import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { autorizarRol } from "../middlewares/autorizarRol.js";
import { validarCsrf } from "../middlewares/validarCsrf.js";

export function crearRutasPedidos({ gestionPedidosController }) {
  const router = Router();
  router.get("/pedidos/nuevo", autenticar, autorizarRol("ATENCION"), gestionPedidosController.mostrarRegistro);
  router.get("/pedidos/resultado", autenticar, gestionPedidosController.mostrarResultado);
  router.post(
    "/api/pedidos",
    autenticar,
    autorizarRol("ATENCION"),
    validarCsrf,
    gestionPedidosController.registrarPedido
  );
  return router;
}
