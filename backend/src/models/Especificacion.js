export class Especificacion {
  constructor({ idEspecificacion = null, tipo, valor }) {
    this.idEspecificacion = idEspecificacion;
    this.tipo = tipo;
    this.valor = valor;
  }
}
