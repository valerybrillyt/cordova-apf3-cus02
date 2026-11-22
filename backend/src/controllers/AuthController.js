import { nuevoTokenCsrf } from "../middlewares/validarCsrf.js";

const NOMBRES_ROL = {
  ATENCION: "Personal de atención",
  PREPARACION: "Preparación local",
  CAJERA: "Cajera",
  ENCARGADA: "Encargada",
  PRODUCCION: "Producción",
};

export class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  mostrarLogin = (req, res) => {
    if (req.session.usuario) {
      return res.redirect("/");
    }
    return res.render("auth/login", {
      titulo: "Iniciar sesión",
      mensaje: null,
      identificador: "",
    });
  };

  iniciarSesion = async (req, res, next) => {
    try {
      const sesion = await this.authService.iniciarSesion(req.body?.identificador, req.body?.clave);
      await regenerarSesion(req);
      req.session.usuario = sesion;
      req.session.csrfToken = nuevoTokenCsrf();
      await guardarSesion(req);
      return res.redirect("/");
    } catch (error) {
      if (error?.exponer && (error.status === 401 || error.status === 403)) {
        return res.status(error.status).render("auth/login", {
          titulo: "Iniciar sesión",
          mensaje: error.message,
          identificador: typeof req.body?.identificador === "string" ? req.body.identificador : "",
        });
      }
      return next(error);
    }
  };

  mostrarInicio = (req, res) => {
    const usuario = req.session.usuario;
    return res.render("inicio", {
      titulo: "Inicio",
      nombreRolVisible: NOMBRES_ROL[usuario.nombreRol] || usuario.nombreRol,
    });
  };

  cerrarSesion = (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("cordova.sid");
      return res.redirect("/login");
    });
  };
}

function regenerarSesion(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function guardarSesion(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}
