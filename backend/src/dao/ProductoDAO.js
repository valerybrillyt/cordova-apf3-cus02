import { Producto } from "../models/Producto.js";

export class ProductoDAO {
  constructor(pool) {
    this.pool = pool;
  }

  async listarProductos() {
    const [filas] = await this.pool.execute(
      `SELECT p.idProducto, p.nombre, p.idCategoria, c.nombre AS nombreCategoria
       FROM producto p
       INNER JOIN categoria_producto c ON c.idCategoria = p.idCategoria
       ORDER BY c.nombre, p.nombre`
    );
    return filas.map((fila) => this.#mapear(fila));
  }

  async consultarProducto(idProducto) {
    const [filas] = await this.pool.execute(
      `SELECT p.idProducto, p.nombre, p.idCategoria, c.nombre AS nombreCategoria
       FROM producto p
       INNER JOIN categoria_producto c ON c.idCategoria = p.idCategoria
       WHERE p.idProducto = ?`,
      [idProducto]
    );
    if (filas.length === 0) return null;
    return this.#mapear(filas[0]);
  }

  #mapear(fila) {
    return {
      producto: new Producto({
        idProducto: Number(fila.idProducto),
        nombre: fila.nombre,
        idCategoria: Number(fila.idCategoria),
      }),
      nombreCategoria: fila.nombreCategoria,
    };
  }
}
