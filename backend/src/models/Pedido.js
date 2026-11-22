export class Pedido {
  constructor({ idPedido = null, modalidad, numeroMesa = null, fechaRegistro, confirmado, detalles = [] }) {
    this.idPedido = idPedido;
    this.modalidad = modalidad;
    this.numeroMesa = numeroMesa;
    this.fechaRegistro = fechaRegistro;
    this.confirmado = confirmado;
    this.detalles = detalles;
  }
}
