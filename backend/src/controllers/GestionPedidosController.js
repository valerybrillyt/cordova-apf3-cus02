export class GestionPedidosController {
  constructor({ pedidoService }) {
    this.pedidoService = pedidoService;
  }

  mostrarRegistro = (req, res) => {
    res.render("pedidos/registro", {
      titulo: "Registrar pedido",
    });
  };

  mostrarResultado = (req, res) => {
    res.render("pedidos/resultado", {
      titulo: "Pedido registrado",
      ultimoPedido: req.session.ultimoPedido || null,
    });
  };

  listarProductos = async (req, res, next) => {
    try {
      const productos = await this.pedidoService.listarCatalogo();
      res.json({ productos });
    } catch (error) {
      next(error);
    }
  };

  registrarPedido = async (req, res, next) => {
    try {
      const contextoAutorizado = {
        idUsuario: req.session.usuario.idUsuario,
        nombreRol: req.session.usuario.nombreRol,
      };
      const idPedido = await this.pedidoService.procesarPedido(req.body, contextoAutorizado);
      req.session.ultimoPedido = {
        idPedido,
        modalidad: req.body?.modalidad,
        numeroMesa: req.body?.modalidad === "MESA" ? String(req.body.numeroMesa).trim() : null,
      };
      res.status(201).json({
        idPedido,
        mensaje: "Pedido registrado",
      });
    } catch (error) {
      next(error);
    }
  };
}
