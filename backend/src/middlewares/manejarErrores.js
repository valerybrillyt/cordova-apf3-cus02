const CONEXION = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "POOL_CLOSED",
]);

export function manejarErrores(error, req, res, _next) {
  if (error?.type === "entity.parse.failed") {
    return responder(req, res, 400, {
      mensaje: "Datos del pedido no válidos",
      campo: "json",
      detalle: "El cuerpo enviado no es JSON válido.",
    });
  }

  if (error?.exponer) {
    const cuerpo = { mensaje: error.message };
    if (error.campo) cuerpo.campo = error.campo;
    if (error.detalle) cuerpo.detalle = error.detalle;
    return responder(req, res, error.status || 400, cuerpo);
  }

  console.error("Error interno:", error?.code || error?.name || "Error", error?.message);

  if (CONEXION.has(error?.code)) {
    return responder(req, res, 503, {
      mensaje: "No hay conexión con la base de datos.",
    });
  }

  return responder(req, res, 500, {
    mensaje: "No se pudo completar la operación.",
  });
}

function responder(req, res, status, cuerpo) {
  if (req.path.startsWith("/api/") || req.accepts(["html", "json"]) === "json") {
    return res.status(status).json(cuerpo);
  }
  if (status === 401 && req.method === "GET") {
    return res.redirect("/login");
  }
  return res.status(status).render("acceso_denegado", {
    titulo: "No se pudo completar la operación",
    mensaje: cuerpo.mensaje,
    detalle: cuerpo.detalle || null,
  });
}
