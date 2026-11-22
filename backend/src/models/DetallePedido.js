export class DetallePedido {
  constructor({ idDetalle = null, idProducto, cantidad, especificaciones = [] }) {
    this.idDetalle = idDetalle;
    this.idProducto = idProducto;
    this.cantidad = cantidad;
    this.especificaciones = especificaciones;
  }
}
