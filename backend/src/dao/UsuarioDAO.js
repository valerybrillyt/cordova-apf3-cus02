export class UsuarioDAO {
  constructor(pool) {
    this.pool = pool;
  }

  async buscarPorIdentificador(identificadorAcceso) {
    const [filas] = await this.pool.execute(
      `SELECT u.idUsuario, u.identificadorAcceso, u.claveHash, u.activo, u.idRol, r.nombreRol
       FROM usuario u
       INNER JOIN rol r ON r.idRol = u.idRol
       WHERE u.identificadorAcceso = ?`,
      [identificadorAcceso]
    );
    if (filas.length === 0) return null;
    const fila = filas[0];
    return {
      idUsuario: Number(fila.idUsuario),
      identificadorAcceso: fila.identificadorAcceso,
      claveHash: fila.claveHash,
      activo: Boolean(fila.activo),
      idRol: Number(fila.idRol),
      nombreRol: fila.nombreRol,
    };
  }
}
