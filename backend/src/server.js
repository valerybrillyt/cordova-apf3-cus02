import "dotenv/config";
import { crearAplicacion } from "./crearAplicacion.js";
import { obtenerPool } from "./config/Conexion.js";

const pool = obtenerPool();
const app = crearAplicacion({
  pool,
  sessionSecret: process.env.SESSION_SECRET,
  secureCookie: process.env.NODE_ENV === "production",
});

const puerto = Number(process.env.PORT || 3000);
app.listen(puerto, "127.0.0.1", () => {
  console.log(`Córdova escuchando en http://127.0.0.1:${puerto}`);
});
