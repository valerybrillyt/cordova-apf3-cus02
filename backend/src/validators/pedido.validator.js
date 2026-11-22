import { datosInvalidos } from "../errors/ErrorAplicacion.js";

const MODALIDADES = new Set(["MESA", "PARA_LLEVAR"]);
const LONGITUD_MESA = 20;

function esEnteroPositivo(valor) {
  return typeof valor === "number" && Number.isInteger(valor) && valor > 0;
}

export function validarSolicitudPedido(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw datosInvalidos("pedido", "El cuerpo de la solicitud no es válido.");
  }

  if (typeof datos.modalidad !== "string" || !MODALIDADES.has(datos.modalidad)) {
    throw datosInvalidos("modalidad", "La modalidad debe ser MESA o PARA_LLEVAR.");
  }

  let numeroMesa = null;
  if (datos.modalidad === "MESA") {
    if (typeof datos.numeroMesa !== "string") {
      throw datosInvalidos("numeroMesa", "El número de mesa es obligatorio y debe ser texto.");
    }
    numeroMesa = datos.numeroMesa.trim();
    if (numeroMesa.length === 0) {
      throw datosInvalidos("numeroMesa", "El número de mesa es obligatorio para un pedido de mesa.");
    }
    if (numeroMesa.length > LONGITUD_MESA) {
      throw datosInvalidos("numeroMesa", "El número de mesa supera la longitud permitida.");
    }
  } else if (datos.numeroMesa !== undefined && datos.numeroMesa !== null) {
    if (typeof datos.numeroMesa !== "string" || datos.numeroMesa.trim() !== "") {
      throw datosInvalidos("numeroMesa", "Un pedido para llevar no lleva número de mesa.");
    }
  }

  if (!Array.isArray(datos.detalles) || datos.detalles.length === 0) {
    throw datosInvalidos("detalles", "El pedido debe incluir al menos un producto.");
  }

  const detalles = datos.detalles.map((detalle, indice) => validarDetalle(detalle, indice));
  return {
    modalidad: datos.modalidad,
    numeroMesa,
    detalles,
  };
}

function validarDetalle(detalle, indice) {
  const campo = `detalles[${indice}]`;
  if (!detalle || typeof detalle !== "object" || Array.isArray(detalle)) {
    throw datosInvalidos(campo, "Cada detalle debe ser un objeto.");
  }
  if (!esEnteroPositivo(detalle.idProducto)) {
    throw datosInvalidos(`${campo}.idProducto`, "El producto indicado no es un identificador válido.");
  }
  if (!esEnteroPositivo(detalle.cantidad)) {
    throw datosInvalidos(`${campo}.cantidad`, "La cantidad debe ser un entero positivo.");
  }
  const especificacionesEntrada = detalle.especificaciones ?? [];
  if (!Array.isArray(especificacionesEntrada)) {
    throw datosInvalidos(`${campo}.especificaciones`, "Las especificaciones deben enviarse como una lista.");
  }
  const tipos = new Set();
  const especificaciones = especificacionesEntrada.map((especificacion, posicion) => {
    if (!especificacion || typeof especificacion !== "object" || Array.isArray(especificacion)) {
      throw datosInvalidos(`${campo}.especificaciones[${posicion}]`, "La especificación no tiene el formato esperado.");
    }
    if (typeof especificacion.tipo !== "string" || especificacion.tipo.trim() === "") {
      throw datosInvalidos(`${campo}.especificaciones[${posicion}].tipo`, "El tipo de especificación es obligatorio.");
    }
    if (typeof especificacion.valor !== "string" || especificacion.valor.trim() === "") {
      throw datosInvalidos(`${campo}.especificaciones[${posicion}].valor`, "El valor de la especificación es obligatorio.");
    }
    if (tipos.has(especificacion.tipo)) {
      throw datosInvalidos(`${campo}.especificaciones`, "No se puede repetir el mismo tipo de especificación en un producto.");
    }
    tipos.add(especificacion.tipo);
    return { tipo: especificacion.tipo, valor: especificacion.valor };
  });
  return {
    idProducto: detalle.idProducto,
    cantidad: detalle.cantidad,
    especificaciones,
  };
}
