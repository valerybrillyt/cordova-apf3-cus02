import bcrypt from "bcryptjs";
import { ErrorAplicacion } from "../errors/ErrorAplicacion.js";

const HASH_FICTICIO = bcrypt.hashSync("cordova-comparacion-ficticia", 10);
const MENSAJE_CREDENCIALES = "Usuario o clave incorrectos.";

export class AuthService {
  constructor({ usuarioDAO }) {
    this.usuarioDAO = usuarioDAO;
  }

  async iniciarSesion(identificadorAcceso, clave) {
    if (typeof identificadorAcceso !== "string" || typeof clave !== "string") {
      throw new ErrorAplicacion(MENSAJE_CREDENCIALES, 401);
    }
    const identificador = identificadorAcceso.trim();
    if (identificador === "" || clave === "") {
      throw new ErrorAplicacion(MENSAJE_CREDENCIALES, 401);
    }

    const usuario = await this.usuarioDAO.buscarPorIdentificador(identificador);
    const hash = usuario?.claveHash || HASH_FICTICIO;
    const coincide = await bcrypt.compare(clave, hash);
    if (!usuario || !coincide) {
      throw new ErrorAplicacion(MENSAJE_CREDENCIALES, 401);
    }
    if (!usuario.activo) {
      throw new ErrorAplicacion("El usuario no está activo.", 403);
    }

    return {
      idUsuario: usuario.idUsuario,
      identificadorAcceso: usuario.identificadorAcceso,
      idRol: usuario.idRol,
      nombreRol: usuario.nombreRol,
    };
  }
}
