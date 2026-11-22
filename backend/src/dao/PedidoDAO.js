export class PedidoDAO {
  constructor(pool) {
    this.pool = pool;
  }

  async registrarPedido(pedido) {
    const conexion = await this.pool.getConnection();
    try {
      await conexion.beginTransaction();
      const [cabecera] = await conexion.execute(
        `INSERT INTO pedido (modalidad, numeroMesa, fechaRegistro, confirmado)
         VALUES (?, ?, ?, ?)`,
        [pedido.modalidad, pedido.numeroMesa, pedido.fechaRegistro, pedido.confirmado ? 1 : 0]
      );
      const idPedido = Number(cabecera.insertId);
      for (const detalle of pedido.detalles) {
        const [insertado] = await conexion.execute(
          `INSERT INTO detalle_pedido (idPedido, idProducto, cantidad)
           VALUES (?, ?, ?)`,
          [idPedido, detalle.idProducto, detalle.cantidad]
        );
        const idDetalle = Number(insertado.insertId);
        detalle.idDetalle = idDetalle;
        for (const especificacion of detalle.especificaciones) {
          const [esp] = await conexion.execute(
            `INSERT INTO especificacion (idDetalle, tipo, valor)
             VALUES (?, ?, ?)`,
            [idDetalle, especificacion.tipo, especificacion.valor]
          );
          especificacion.idEspecificacion = Number(esp.insertId);
        }
      }
      await conexion.commit();
      pedido.idPedido = idPedido;
      return idPedido;
    } catch (error) {
      try {
        await conexion.rollback();
      } catch {
        // La transacción puede no haber iniciado.
      }
      throw error;
    } finally {
      conexion.release();
    }
  }

  async consultarPedido(idPedido) {
    const conexion = await this.pool.getConnection();
    try {
      const [pedidos] = await conexion.execute(
        `SELECT idPedido, modalidad, numeroMesa, fechaRegistro, confirmado
         FROM pedido
         WHERE idPedido = ?`,
        [idPedido]
      );
      if (pedidos.length === 0) return null;
      const [detalles] = await conexion.execute(
        `SELECT idDetalle, idPedido, idProducto, cantidad
         FROM detalle_pedido
         WHERE idPedido = ?
         ORDER BY idDetalle`,
        [idPedido]
      );
      const ids = detalles.map((detalle) => detalle.idDetalle);
      let especificaciones = [];
      if (ids.length > 0) {
        const marcas = ids.map(() => "?").join(", ");
        const [filas] = await conexion.execute(
          `SELECT idEspecificacion, idDetalle, tipo, valor
           FROM especificacion
           WHERE idDetalle IN (${marcas})
           ORDER BY idEspecificacion`,
          ids
        );
        especificaciones = filas;
      }
      const pedido = pedidos[0];
      return {
        idPedido: Number(pedido.idPedido),
        modalidad: pedido.modalidad,
        numeroMesa: pedido.numeroMesa,
        fechaRegistro: pedido.fechaRegistro,
        confirmado: Boolean(pedido.confirmado),
        detalles: detalles.map((detalle) => ({
          idDetalle: Number(detalle.idDetalle),
          idProducto: Number(detalle.idProducto),
          cantidad: Number(detalle.cantidad),
          especificaciones: especificaciones
            .filter((item) => Number(item.idDetalle) === Number(detalle.idDetalle))
            .map((item) => ({
              idEspecificacion: Number(item.idEspecificacion),
              tipo: item.tipo,
              valor: item.valor,
            })),
        })),
      };
    } finally {
      conexion.release();
    }
  }
}
