import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATEGORIAS_DEMOSTRACION,
  PRODUCTOS_DEMOSTRACION,
  ROLES_DEMOSTRACION,
  coberturaDelProducto,
} from "../backend/src/config/especificacionesPermitidas.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireDesdeBackend = createRequire(path.join(raiz, "backend/package.json"));
const mysql = requireDesdeBackend("mysql2/promise");
const mysqlTexto = requireDesdeBackend("mysql2");
const bcrypt = requireDesdeBackend("bcryptjs");
const dotenv = requireDesdeBackend("dotenv");

dotenv.config({ path: path.join(raiz, "backend/.env") });

export const CLAVE_DEMOSTRACION = "DemoCordova#2026";
export const BASE_DESARROLLO = "cordova_apf3_dev";
export const BASE_PRUEBAS = "cordova_apf3_test";

const USUARIOS = [
  { identificadorAcceso: "atencion.demo", idRol: 1, activo: 1 },
  { identificadorAcceso: "preparacion.demo", idRol: 2, activo: 1 },
  { identificadorAcceso: "cajera.demo", idRol: 3, activo: 1 },
  { identificadorAcceso: "encargada.demo", idRol: 4, activo: 1 },
  { identificadorAcceso: "produccion.demo", idRol: 5, activo: 1 },
  { identificadorAcceso: "inactivo.demo", idRol: 1, activo: 0 },
];

export function sentenciasDelEsquema() {
  const sql = readFileSync(path.join(raiz, "database/esquema_cordova.sql"), "utf8");
  const sinComentarios = sql
    .split("\n")
    .filter((linea) => !linea.trim().startsWith("--"))
    .join("\n");
  return sinComentarios
    .split(";")
    .map((sentencia) => sentencia.trim())
    .filter(Boolean);
}

export function crearPoolAplicacion(database) {
  if (!process.env.DB_USER) {
    throw new Error("Falta DB_USER en backend/.env");
  }
  return mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? "",
    database,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
    charset: "utf8mb4",
  });
}

export async function crearBasesYUsuario() {
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD;
  if (!rootPassword) throw new Error("Falta MYSQL_ROOT_PASSWORD.");
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD ?? "";
  if (!/^[A-Za-z0-9_]+$/.test(dbUser)) {
    throw new Error("DB_USER contiene caracteres no admitidos.");
  }
  const root = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: "root",
    password: rootPassword,
    multipleStatements: false,
  });
  try {
    const usuario = mysqlTexto.escapeId(dbUser);
    const clave = mysqlTexto.escape(dbPassword);
    for (const base of [BASE_DESARROLLO, BASE_PRUEBAS]) {
      const nombre = mysqlTexto.escapeId(base);
      await root.query(
        `CREATE DATABASE IF NOT EXISTS ${nombre} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    }
    await root.query(`CREATE USER IF NOT EXISTS ${usuario}@'%' IDENTIFIED BY ${clave}`);
    await root.query(`ALTER USER ${usuario}@'%' IDENTIFIED BY ${clave}`);
    for (const base of [BASE_DESARROLLO, BASE_PRUEBAS]) {
      const nombre = mysqlTexto.escapeId(base);
      await root.query(`GRANT ALL PRIVILEGES ON ${nombre}.* TO ${usuario}@'%'`);
    }
    await root.query("FLUSH PRIVILEGES");
  } finally {
    await root.end();
  }
}

export async function aplicarEsquema(pool) {
  for (const sentencia of sentenciasDelEsquema()) {
    await pool.query(sentencia);
  }
}

export async function sembrar(pool) {
  for (const producto of PRODUCTOS_DEMOSTRACION) {
    if (coberturaDelProducto(producto.idProducto) === "pendiente") {
      throw new Error(`El producto ${producto.idProducto} no tiene reglas de especificación confirmadas.`);
    }
  }
  for (const rol of ROLES_DEMOSTRACION) {
    await pool.execute(
      `INSERT INTO rol (idRol, nombreRol) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE nombreRol = VALUES(nombreRol)`,
      [rol.idRol, rol.nombreRol]
    );
  }
  for (const categoria of CATEGORIAS_DEMOSTRACION) {
    await pool.execute(
      `INSERT INTO categoria_producto (idCategoria, nombre) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)`,
      [categoria.idCategoria, categoria.nombre]
    );
  }
  for (const producto of PRODUCTOS_DEMOSTRACION) {
    await pool.execute(
      `INSERT INTO producto (idProducto, idCategoria, nombre) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE idCategoria = VALUES(idCategoria), nombre = VALUES(nombre)`,
      [producto.idProducto, producto.idCategoria, producto.nombre]
    );
  }
  const hash = await bcrypt.hash(CLAVE_DEMOSTRACION, 10);
  for (const usuario of USUARIOS) {
    await pool.execute(
      `INSERT INTO usuario (idRol, identificadorAcceso, claveHash, activo)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE idRol = VALUES(idRol), claveHash = VALUES(claveHash), activo = VALUES(activo)`,
      [usuario.idRol, usuario.identificadorAcceso, hash, usuario.activo]
    );
  }
}

export async function prepararBase(nombre) {
  await crearBasesYUsuario();
  const pool = crearPoolAplicacion(nombre);
  try {
    await aplicarEsquema(pool);
    await sembrar(pool);
  } finally {
    await pool.end();
  }
}
