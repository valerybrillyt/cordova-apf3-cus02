import mysql from "mysql2/promise";

let pool;

function configuracionDesdeEntorno() {
  const requeridas = ["DB_HOST", "DB_USER", "DB_NAME"];
  const faltantes = requeridas.filter((nombre) => !process.env[nombre]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno: ${faltantes.join(", ")}`);
  }
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
    charset: "utf8mb4",
    decimalNumbers: true,
  };
}

export function obtenerPool() {
  if (!pool) {
    pool = mysql.createPool(configuracionDesdeEntorno());
  }
  return pool;
}

export async function cerrarPool() {
  if (pool) {
    const actual = pool;
    pool = null;
    await actual.end();
  }
}
