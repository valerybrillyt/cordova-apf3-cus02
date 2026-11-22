import { ErrorAplicacion } from "../errors/ErrorAplicacion.js";

export function autorizarRol(...roles) {
  return (req, res, next) => {
    const usuario = req.session?.usuario;
    if (!usuario) {
      if (req.path.startsWith("/api/")) {
        return next(new ErrorAplicacion("Debe iniciar sesión", 401));
      }
      return res.redirect("/login");
    }
    if (!roles.includes(usuario.nombreRol)) {
      if (req.path.startsWith("/api/")) {
        return next(new ErrorAplicacion("No autorizado para esta operación", 403));
      }
      return res.status(403).render("acceso_denegado", {
        titulo: "Acceso no autorizado",
        mensaje: "No autorizado para esta operación",
        detalle: "El registro de pedidos de mesa o para llevar corresponde al personal de atención.",
      });
    }
    return next();
  };
}
