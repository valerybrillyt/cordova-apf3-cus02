import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import request from "supertest";
import { Pedido } from "../src/models/Pedido.js";
import { DetallePedido } from "../src/models/DetallePedido.js";
import { PedidoDAO } from "../src/dao/PedidoDAO.js";
import { crearAplicacion } from "../src/crearAplicacion.js";
import { manejarErrores } from "../src/middlewares/manejarErrores.js";
import {
  BASE_PRUEBAS,
  CLAVE_DEMOSTRACION,
  aplicarEsquema,
  crearBasesYUsuario,
  crearPoolAplicacion,
  sembrar,
} from "../../database/administrar.js";
import { ErrorConexionNoConfirmada, PedidosApiService } from "../../frontend/public/js/PedidosApiService.js";

const SECRETO = "secreto-de-prueba-cordova";
let pool;
let app;

async function agenteAtencion() {
  const agente = request.agent(app);
  const login = await agente.get("/login");
  const token = extraerToken(login.text);
  const acceso = await agente.post("/login").type("form").send({
    _csrf: token,
    identificador: "atencion.demo",
    clave: CLAVE_DEMOSTRACION,
  });
  assert.equal(acceso.status, 302);
  const pagina = await agente.get("/pedidos/nuevo");
  return { agente, token: extraerToken(pagina.text) };
}

function extraerToken(html) {
  const encontrado = html.match(/name="csrf-token" content="([^"]+)"/);
  assert.ok(encontrado, "La página debe incluir el token CSRF");
  return encontrado[1];
}

async function contarPedidos() {
  const [filas] = await pool.query("SELECT COUNT(*) AS total FROM pedido");
  return Number(filas[0].total);
}

describe("CUS02 y acceso mínimo", { concurrency: false }, () => {
  before(async () => {
    await crearBasesYUsuario();
    pool = crearPoolAplicacion(BASE_PRUEBAS);
    const [base] = await pool.query("SELECT DATABASE() AS nombre");
    assert.equal(base[0].nombre, BASE_PRUEBAS);
    await aplicarEsquema(pool);
    await sembrar(pool);
    app = crearAplicacion({ pool, sessionSecret: SECRETO, secureCookie: false });
  });

  after(async () => {
    if (pool) await pool.end();
  });

  test("el esquema de pruebas tiene las doce tablas", async () => {
    const [filas] = await pool.query(
      `SELECT table_name AS tabla
       FROM information_schema.tables
       WHERE table_schema = ?
       ORDER BY table_name`,
      [BASE_PRUEBAS]
    );
    assert.deepEqual(
      filas.map((fila) => fila.tabla).sort(),
      [
        "categoria_producto",
        "cliente",
        "detalle_pedido",
        "especificacion",
        "pedido",
        "pedido_personalizado",
        "personalizacion",
        "producto",
        "recordatorio",
        "referencia_comprobante",
        "rol",
        "usuario",
      ].sort()
    );
  });

  test("login correcto, credenciales incorrectas, inactivo y cierre", async () => {
    const agente = request.agent(app);
    const pagina = await agente.get("/login");
    const token = extraerToken(pagina.text);
    const malo = await agente.post("/login").type("form").send({
      _csrf: token,
      identificador: "atencion.demo",
      clave: "clave-incorrecta",
    });
    assert.equal(malo.status, 401);
    assert.match(malo.text, /Usuario o clave incorrectos/);

    const fresco = request.agent(app);
    const paginaInactivo = await fresco.get("/login");
    const tokenInactivo = extraerToken(paginaInactivo.text);
    const inactivo = await fresco.post("/login").type("form").send({
      _csrf: tokenInactivo,
      identificador: "inactivo.demo",
      clave: CLAVE_DEMOSTRACION,
    });
    assert.equal(inactivo.status, 403);
    assert.match(inactivo.text, /no está activo/);

    const { agente: activo } = await agenteAtencion();
    const inicio = await activo.get("/");
    assert.equal(inicio.status, 200);
    assert.match(inicio.text, /Personal de atención/);
    const tokenSalida = extraerToken(inicio.text);
    const salida = await activo.post("/logout").type("form").send({ _csrf: tokenSalida });
    assert.equal(salida.status, 302);
    const protegido = await activo.get("/pedidos/nuevo");
    assert.equal(protegido.status, 302);
    assert.match(protegido.headers.location, /\/login/);
  });

  test("sin sesión y con otro rol no se registra el pedido", async () => {
    const antes = await contarPedidos();
    const anonimo = await request(app).post("/api/pedidos").send({ modalidad: "MESA", numeroMesa: "1", detalles: [] });
    assert.equal(anonimo.status, 401);
    assert.equal(anonimo.body.idPedido, undefined);

    const agente = request.agent(app);
    const login = await agente.get("/login");
    const token = extraerToken(login.text);
    const acceso = await agente.post("/login").type("form").send({
      _csrf: token,
      identificador: "preparacion.demo",
      clave: CLAVE_DEMOSTRACION,
    });
    assert.equal(acceso.status, 302);
    const pagina = await agente.get("/");
    const tokenApi = extraerToken(pagina.text);
    const respuesta = await agente
      .post("/api/pedidos")
      .set("X-CSRF-Token", tokenApi)
      .send({
        modalidad: "MESA",
        numeroMesa: "4",
        detalles: [{ idProducto: 4, cantidad: 1, especificaciones: [] }],
      });
    assert.equal(respuesta.status, 403);
    assert.equal(respuesta.body.idPedido, undefined);
    assert.equal(await contarPedidos(), antes);
  });

  test("el catálogo sale de MySQL y no ofrece la torta personalizada como registrable", async () => {
    const { agente } = await agenteAtencion();
    const respuesta = await agente.get("/api/productos");
    assert.equal(respuesta.status, 200);
    const capuchino = respuesta.body.productos.find((producto) => producto.nombre === "Capuchino");
    const torta = respuesta.body.productos.find((producto) => producto.nombre === "Torta personalizada");
    assert.equal(capuchino.idProducto, 4);
    assert.equal(capuchino.registrableCus02, true);
    assert.ok(capuchino.especificacionesPermitidas.some((grupo) => grupo.tipo === "CREMA"));
    assert.equal(torta.registrableCus02, false);
    assert.deepEqual(torta.especificacionesPermitidas, []);
  });

  test("P01 registra un pedido de mesa con detalle y especificación", async () => {
    const { agente, token } = await agenteAtencion();
    const respuesta = await agente.post("/api/pedidos").set("X-CSRF-Token", token).send({
      modalidad: "MESA",
      numeroMesa: "5",
      detalles: [
        {
          idProducto: 4,
          cantidad: 2,
          especificaciones: [{ tipo: "CREMA", valor: "SIN_CREMA" }],
        },
      ],
    });
    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.body.mensaje, "Pedido registrado");
    assert.equal(typeof respuesta.body.idPedido, "number");

    const [pedido] = await pool.query(
      "SELECT modalidad, numeroMesa, confirmado FROM pedido WHERE idPedido = ?",
      [respuesta.body.idPedido]
    );
    assert.equal(pedido[0].modalidad, "MESA");
    assert.equal(pedido[0].numeroMesa, "5");
    assert.equal(Number(pedido[0].confirmado), 1);
    const [detalles] = await pool.query(
      "SELECT idProducto, cantidad FROM detalle_pedido WHERE idPedido = ?",
      [respuesta.body.idPedido]
    );
    assert.deepEqual(detalles.map((fila) => ({ idProducto: Number(fila.idProducto), cantidad: Number(fila.cantidad) })), [
      { idProducto: 4, cantidad: 2 },
    ]);
    const [especificaciones] = await pool.query(
      `SELECT e.tipo, e.valor
       FROM especificacion e
       INNER JOIN detalle_pedido d ON d.idDetalle = e.idDetalle
       WHERE d.idPedido = ?`,
      [respuesta.body.idPedido]
    );
    assert.deepEqual(especificaciones, [{ tipo: "CREMA", valor: "SIN_CREMA" }]);
  });

  test("P02 registra para llevar con número de mesa nulo", async () => {
    const { agente, token } = await agenteAtencion();
    const respuesta = await agente.post("/api/pedidos").set("X-CSRF-Token", token).send({
      modalidad: "PARA_LLEVAR",
      detalles: [{ idProducto: 1, cantidad: 1, especificaciones: [{ tipo: "AZUCAR", valor: "SIN_AZUCAR" }] }],
    });
    assert.equal(respuesta.status, 201);
    const [pedido] = await pool.query("SELECT numeroMesa, modalidad FROM pedido WHERE idPedido = ?", [
      respuesta.body.idPedido,
    ]);
    assert.equal(pedido[0].modalidad, "PARA_LLEVAR");
    assert.equal(pedido[0].numeroMesa, null);
  });

  test("P03 rechaza datos inválidos y no confirma un pedido", async () => {
    const { agente, token } = await agenteAtencion();
    const casos = [
      { cuerpo: { modalidad: "MESA", numeroMesa: "   ", detalles: [{ idProducto: 4, cantidad: 1, especificaciones: [] }] }, campo: "numeroMesa" },
      { cuerpo: { modalidad: "PARA_LLEVAR", detalles: [] }, campo: "detalles" },
      { cuerpo: { modalidad: "MESA", numeroMesa: "8", detalles: [{ idProducto: 4, cantidad: 0, especificaciones: [] }] }, campo: "detalles[0].cantidad" },
      { cuerpo: { modalidad: "MESA", numeroMesa: "8", detalles: [{ idProducto: 4, cantidad: -2, especificaciones: [] }] }, campo: "detalles[0].cantidad" },
      { cuerpo: { modalidad: "MESA", numeroMesa: "8", detalles: [{ idProducto: 99999, cantidad: 1, especificaciones: [] }] }, campo: "idProducto" },
      {
        cuerpo: {
          modalidad: "MESA",
          numeroMesa: "8",
          detalles: [{ idProducto: 4, cantidad: 1, especificaciones: [{ tipo: "AZUCAR", valor: "SIN_AZUCAR" }] }],
        },
        campo: "especificaciones",
      },
      { cuerpo: { modalidad: "MESA", numeroMesa: "8", detalles: [{ idProducto: 9, cantidad: 1, especificaciones: [] }] }, campo: "idProducto" },
    ];
    for (const caso of casos) {
      const antes = await contarPedidos();
      const respuesta = await agente.post("/api/pedidos").set("X-CSRF-Token", token).send(caso.cuerpo);
      assert.equal(respuesta.status, 400, JSON.stringify(caso.cuerpo));
      assert.equal(respuesta.body.mensaje, "Datos del pedido no válidos");
      assert.equal(respuesta.body.campo, caso.campo);
      assert.equal(respuesta.body.idPedido, undefined);
      assert.equal(await contarPedidos(), antes);
    }
  });

  test("P04 revierte la cabecera si falla un detalle", async () => {
    const antes = await contarPedidos();
    const dao = new PedidoDAO(pool);
    const pedido = new Pedido({
      modalidad: "MESA",
      numeroMesa: "9",
      fechaRegistro: new Date(),
      confirmado: true,
      detalles: [new DetallePedido({ idProducto: 999999, cantidad: 1, especificaciones: [] })],
    });
    await assert.rejects(() => dao.registrarPedido(pedido));
    assert.equal(await contarPedidos(), antes);
    const [detalles] = await pool.query("SELECT COUNT(*) AS total FROM detalle_pedido d LEFT JOIN pedido p ON p.idPedido = d.idPedido WHERE p.idPedido IS NULL");
    assert.equal(Number(detalles[0].total), 0);
  });

  test("P05 no reintenta ni confirma cuando se pierde la respuesta", async () => {
    let llamadas = 0;
    const servicio = new PedidosApiService({
      fetchImpl: async () => {
        llamadas += 1;
        throw new TypeError("network down");
      },
    });
    await assert.rejects(
      () => servicio.registrarPedido({ modalidad: "MESA", numeroMesa: "1", detalles: [] }, "token"),
      (error) => {
        assert.ok(error instanceof ErrorConexionNoConfirmada);
        assert.match(error.message, /No se reintentó/);
        assert.match(error.message, /verifique/i);
        return true;
      }
    );
    assert.equal(llamadas, 1);

    llamadas = 0;
    const interrumpido = new PedidosApiService({
      fetchImpl: async () => {
        llamadas += 1;
        return {
          status: 201,
          ok: true,
          json: async () => {
            throw new Error("body aborted");
          },
        };
      },
    });
    await assert.rejects(() => interrumpido.registrarPedido({}, "token"), ErrorConexionNoConfirmada);
    assert.equal(llamadas, 1);
  });

  test("guarda el número de mesa como texto y no ejecuta SQL concatenado", async () => {
    const { agente, token } = await agenteAtencion();
    const numeroMesa = "12' OR '1'='1";
    const respuesta = await agente.post("/api/pedidos").set("X-CSRF-Token", token).send({
      modalidad: "MESA",
      numeroMesa,
      detalles: [{ idProducto: 10, cantidad: 1, especificaciones: [] }],
    });
    assert.equal(respuesta.status, 201);
    const [pedido] = await pool.query("SELECT numeroMesa FROM pedido WHERE idPedido = ?", [respuesta.body.idPedido]);
    assert.equal(pedido[0].numeroMesa, numeroMesa);
    const [tablas] = await pool.query(
      "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ?",
      [BASE_PRUEBAS]
    );
    assert.equal(Number(tablas[0].total), 12);
  });

  test("un error de MySQL no se expone al cliente", async () => {
    const capa = { estado: 0, cuerpo: null, path: "/api/pedidos", accepts: () => "json", status(codigo) { this.estado = codigo; return this; }, json(cuerpo) { this.cuerpo = cuerpo; return this; } };
    const error = new Error("Duplicate entry");
    error.code = "ER_DUP_ENTRY";
    error.sqlMessage = "Duplicate entry 'secreto' for key 'pedido.PRIMARY'";
    manejarErrores(error, capa, capa, () => {});
    assert.equal(capa.estado, 500);
    assert.equal(capa.cuerpo.mensaje, "No se pudo completar la operación.");
    assert.equal(JSON.stringify(capa.cuerpo).includes("sql"), false);
    assert.equal(JSON.stringify(capa.cuerpo).includes("secreto"), false);
    assert.equal(capa.cuerpo.idPedido, undefined);
  });

  test("la salud informa la base conectada sin credenciales", async () => {
    const respuesta = await request(app).get("/health");
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.baseDatos, BASE_PRUEBAS);
    assert.equal(respuesta.body.conexion, true);
    assert.equal(JSON.stringify(respuesta.body).includes("PASSWORD"), false);
  });
});
