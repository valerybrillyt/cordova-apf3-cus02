import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.js";
import { autorizarRol } from "../middlewares/autorizarRol.js";

export function crearRutasProductos({ gestionPedidosController }) {
  const router = Router();
  router.get(
    "/api/productos",
    autenticar,
    autorizarRol("ATENCION"),
    gestionPedidosController.listarProductos
  );
  return router;
}
