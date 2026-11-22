export class Producto {
  constructor({ idProducto, nombre, idCategoria = null }) {
    this.idProducto = idProducto;
    this.nombre = nombre;
    this.idCategoria = idCategoria;
  }
}
