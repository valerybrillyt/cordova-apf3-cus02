export class ErrorAplicacion extends Error {
  constructor(mensaje, status = 400, { campo = null, detalle = null, codigo = null } = {}) {
    super(mensaje);
    this.name = "ErrorAplicacion";
    this.status = status;
    this.campo = campo;
    this.detalle = detalle;
    this.codigo = codigo;
    this.exponer = true;
  }
}

export function datosInvalidos(campo, detalle) {
  return new ErrorAplicacion("Datos del pedido no válidos", 400, { campo, detalle, codigo: "EA01" });
}
