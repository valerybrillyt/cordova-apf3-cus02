import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import { ProductoDAO } from "./dao/ProductoDAO.js";
import { PedidoDAO } from "./dao/PedidoDAO.js";
import { UsuarioDAO } from "./dao/UsuarioDAO.js";
import { PedidoService } from "./services/PedidoService.js";
import { AuthService } from "./services/AuthService.js";
import { GestionPedidosController } from "./controllers/GestionPedidosController.js";
import { AuthController } from "./controllers/AuthController.js";
import { crearRutasAuth } from "./routes/auth.routes.js";
import { crearRutasPedidos } from "./routes/pedidos.routes.js";
import { crearRutasProductos } from "./routes/productos.routes.js";
import { asegurarTokenCsrf } from "./middlewares/validarCsrf.js";
import { manejarErrores } from "./middlewares/manejarErrores.js";

const raizFrontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../frontend");

export function crearAplicacion({ pool, sessionSecret, secureCookie = false }) {
  if (!pool) throw new Error("La aplicación requiere un pool de MySQL.");
  if (!sessionSecret) throw new Error("La aplicación requiere SESSION_SECRET.");

  const productoDAO = new ProductoDAO(pool);
  const pedidoDAO = new PedidoDAO(pool);
  const usuarioDAO = new UsuarioDAO(pool);
  const pedidoService = new PedidoService({ productoDAO, pedidoDAO });
  const authService = new AuthService({ usuarioDAO });
  const gestionPedidosController = new GestionPedidosController({ pedidoService });
  const authController = new AuthController({ authService });

  const app = express();
  app.disable("x-powered-by");
  app.set("view engine", "ejs");
  app.set("views", path.join(raizFrontend, "views"));
  app.locals.nombreLocal = "Pastelería-Cafetería Córdova";

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      name: "cordova.sid",
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookie,
        maxAge: 8 * 60 * 60 * 1000,
      },
    })
  );
  app.use(asegurarTokenCsrf);
  app.use(express.static(path.join(raizFrontend, "public")));

  app.get("/health", async (_req, res, next) => {
    try {
      const [filas] = await pool.query("SELECT DATABASE() AS baseDatos, 1 AS ok");
      res.json({
        estado: "ok",
        baseDatos: filas[0]?.baseDatos || null,
        conexion: filas[0]?.ok === 1,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use(crearRutasAuth({ authController }));
  app.use(crearRutasProductos({ gestionPedidosController }));
  app.use(crearRutasPedidos({ gestionPedidosController }));

  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ mensaje: "Recurso no encontrado" });
    }
    return res.status(404).render("acceso_denegado", {
      titulo: "Página no encontrada",
      mensaje: "La página solicitada no existe.",
      detalle: null,
    });
  });

  app.use(manejarErrores);
  return app;
}
