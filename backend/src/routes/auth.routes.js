import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { validarCsrf } from "../middlewares/validarCsrf.js";

export function crearRutasAuth({ authController }) {
  const router = Router();
  router.get("/login", authController.mostrarLogin);
  router.post("/login", validarCsrf, authController.iniciarSesion);
  router.post("/logout", autenticar, validarCsrf, authController.cerrarSesion);
  router.get("/", autenticar, authController.mostrarInicio);
  return router;
}
