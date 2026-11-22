import { timingSafeEqual, randomBytes } from "node:crypto";
import { ErrorAplicacion } from "../errors/ErrorAplicacion.js";

export function asegurarTokenCsrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  res.locals.usuario = req.session.usuario || null;
  next();
}

export function validarCsrf(req, res, next) {
  const enviado = req.get("x-csrf-token") || req.body?._csrf;
  const guardado = req.session?.csrfToken;
  if (typeof enviado !== "string" || typeof guardado !== "string" || enviado.length !== guardado.length) {
    return next(new ErrorAplicacion("La solicitud no supera la verificación de seguridad.", 403));
  }
  const valido = timingSafeEqual(Buffer.from(enviado), Buffer.from(guardado));
  if (!valido) {
    return next(new ErrorAplicacion("La solicitud no supera la verificación de seguridad.", 403));
  }
  return next();
}

export function nuevoTokenCsrf() {
  return randomBytes(32).toString("hex");
}
