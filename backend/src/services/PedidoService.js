import { DetallePedido } from "../models/DetallePedido.js";
import { Especificacion } from "../models/Especificacion.js";
import { Pedido } from "../models/Pedido.js";
import { ErrorAplicacion, datosInvalidos } from "../errors/ErrorAplicacion.js";
import { validarSolicitudPedido } from "../validators/pedido.validator.js";
import {
  PRODUCTOS_EXCLUIDOS_CUS02,
  coberturaDelProducto,
  describirEspecificaciones,
  especificacionPermitida,
} from "../config/especificacionesPermitidas.js";

export class PedidoService {
  constructor({ productoDAO, pedidoDAO }) {
    this.productoDAO = productoDAO;
    this.pedidoDAO = pedidoDAO;
  }

  async listarCatalogo() {
    const productos = await this.productoDAO.listarProductos();
    return productos.map(({ producto, nombreCategoria }) => ({
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      idCategoria: producto.idCategoria,
      nombreCategoria,
      registrableCus02: !PRODUCTOS_EXCLUIDOS_CUS02.has(producto.idProducto),
      especificacionesPermitidas: describirEspecificaciones(producto.idProducto),
    }));
  }

  async procesarPedido(datos, contextoAutorizado) {
    this.#comprobarAutorizacion(contextoAutorizado);
    const solicitud = validarSolicitudPedido(datos);
    const detalles = [];

    for (const item of solicitud.detalles) {
      const encontrado = await this.productoDAO.consultarProducto(item.idProducto);
      if (!encontrado) {
        throw datosInvalidos("idProducto", "Hay un producto que no existe en el catálogo.");
      }
      const producto = encontrado.producto;
      if (PRODUCTOS_EXCLUIDOS_CUS02.has(producto.idProducto)) {
        throw datosInvalidos(
          "idProducto",
          "La torta personalizada no se registra en este caso de uso. Corresponde a CUS04."
        );
      }
      const cobertura = coberturaDelProducto(producto.idProducto);
      if (cobertura === "pendiente") {
        throw datosInvalidos(
          "especificaciones",
          "Este producto todavía no tiene una correspondencia confirmada de especificaciones."
        );
      }
      for (const especificacion of item.especificaciones) {
        if (!especificacionPermitida(producto.idProducto, especificacion.tipo, especificacion.valor)) {
          throw datosInvalidos(
            "especificaciones",
            `La especificación ${especificacion.tipo}=${especificacion.valor} no está permitida para ${producto.nombre}.`
          );
        }
      }
      detalles.push(
        new DetallePedido({
          idProducto: producto.idProducto,
          cantidad: item.cantidad,
          especificaciones: item.especificaciones.map(
            (especificacion) => new Especificacion(especificacion)
          ),
        })
      );
    }

    const pedido = new Pedido({
      modalidad: solicitud.modalidad,
      numeroMesa: solicitud.numeroMesa,
      fechaRegistro: new Date(),
      confirmado: true,
      detalles,
    });

    const idPedido = await this.pedidoDAO.registrarPedido(pedido);
    return idPedido;
  }

  #comprobarAutorizacion(contexto) {
    if (!contexto || typeof contexto.nombreRol !== "string" || !contexto.idUsuario) {
      throw new ErrorAplicacion("Debe iniciar sesión", 401);
    }
    if (contexto.nombreRol !== "ATENCION") {
      throw new ErrorAplicacion("No autorizado para registrar pedidos", 403);
    }
  }
}
