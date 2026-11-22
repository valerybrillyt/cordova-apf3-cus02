export class ErrorDeRed extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ErrorDeRed";
  }
}

export class ErrorConexionNoConfirmada extends Error {
  constructor() {
    super(
      "No se pudo confirmar si el pedido fue registrado. No se reintentó el envío. Conserve los datos y verifique si el pedido ya existe antes de intentar otra vez. La prevención inequívoca de duplicados sigue pendiente."
    );
    this.name = "ErrorConexionNoConfirmada";
    this.codigo = "EA02";
  }
}

export class ErrorRespuestaApi extends Error {
  constructor(mensaje, status, cuerpo = {}) {
    super(mensaje || "No se pudo registrar el pedido.");
    this.name = "ErrorRespuestaApi";
    this.status = status;
    this.campo = cuerpo.campo || null;
    this.detalle = cuerpo.detalle || null;
  }
}

export class PedidosApiService {
  constructor({ fetchImpl } = {}) {
    this.fetchImpl = fetchImpl || fetch.bind(globalThis);
  }

  async listarProductos() {
    let respuesta;
    try {
      respuesta = await this.fetchImpl("/api/productos", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } catch {
      throw new ErrorDeRed("No se pudo cargar el catálogo.");
    }
    const cuerpo = await leerJson(respuesta);
    if (!respuesta.ok) {
      throw new ErrorRespuestaApi(cuerpo.mensaje, respuesta.status, cuerpo);
    }
    return cuerpo.productos || [];
  }

  async registrarPedido(payload, csrfToken) {
    let respuesta;
    try {
      respuesta = await this.fetchImpl("/api/pedidos", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ErrorConexionNoConfirmada();
    }

    let cuerpo;
    try {
      cuerpo = await leerJson(respuesta);
    } catch {
      throw new ErrorConexionNoConfirmada();
    }

    if (respuesta.status !== 201 || !cuerpo.idPedido) {
      throw new ErrorRespuestaApi(cuerpo.mensaje, respuesta.status, cuerpo);
    }
    return cuerpo;
  }
}

async function leerJson(respuesta) {
  return respuesta.json();
}
