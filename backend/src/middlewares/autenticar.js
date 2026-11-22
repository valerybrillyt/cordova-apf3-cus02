import { ErrorAplicacion } from "../errors/ErrorAplicacion.js";

export function autenticar(req, res, next) {
  if (!req.session?.usuario) {
    if (req.path.startsWith("/api/")) {
      return next(new ErrorAplicacion("Debe iniciar sesión", 401));
    }
    return res.redirect("/login");
  }
  return next();
}
