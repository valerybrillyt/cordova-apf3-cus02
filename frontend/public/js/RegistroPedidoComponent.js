import { PedidosApiService, ErrorConexionNoConfirmada, ErrorRespuestaApi } from "./PedidosApiService.js";

const CLAVE_BORRADOR = "cordova.borradorPedido";

export class RegistroPedidoComponent {
  constructor({ documento = document, servicio = new PedidosApiService() } = {}) {
    this.documento = documento;
    this.servicio = servicio;
    this.productos = [];
    this.lineas = [];
    this.enviando = false;
  }

  async iniciar() {
    this.formulario = this.documento.querySelector("#formPedido");
    this.aviso = this.documento.querySelector("#aviso");
    this.resumen = this.documento.querySelector("#resumen");
    this.confirmacion = this.documento.querySelector("#confirmacion");
    this.codigo = this.documento.querySelector("#codigoPedido");
    this.especificaciones = this.documento.querySelector("#especificaciones");
    this.selector = this.documento.querySelector("#producto");
    this.cantidad = this.documento.querySelector("#cantidad");
    this.grupoMesa = this.documento.querySelector("#grupoMesa");
    this.mesa = this.documento.querySelector("#numeroMesa");
    this.boton = this.documento.querySelector("#confirmar");
    this.nota = this.documento.querySelector("#notaCatalogo");
    this.token = this.documento.querySelector('meta[name="csrf-token"]')?.content || "";

    this.formulario.addEventListener("change", () => this.guardarBorrador());
    this.formulario.addEventListener("input", () => this.guardarBorrador());
    this.documento.querySelectorAll('input[name="modalidad"]').forEach((radio) => {
      radio.addEventListener("change", () => this.actualizarModalidad());
    });
    this.selector.addEventListener("change", () => this.pintarEspecificaciones());
    this.documento.querySelector("#agregar").addEventListener("click", () => this.agregarLinea());
    this.formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();
      this.confirmar();
    });

    this.actualizarModalidad();
    await this.cargarCatalogo();
    this.restaurarBorrador();
  }

  async cargarCatalogo() {
    try {
      const productos = await this.servicio.listarProductos();
      this.productos = productos;
      const registrables = productos.filter((producto) => producto.registrableCus02);
      this.selector.replaceChildren();
      for (const producto of registrables) {
        const opcion = this.documento.createElement("option");
        opcion.value = String(producto.idProducto);
        opcion.textContent = `${producto.nombreCategoria} · ${producto.nombre}`;
        this.selector.append(opcion);
      }
      const excluidos = productos.filter((producto) => !producto.registrableCus02).map((producto) => producto.nombre);
      this.nota.textContent = excluidos.length
        ? `${excluidos.join(", ")} no se registra aquí: corresponde a otro caso de uso.`
        : "";
      this.pintarEspecificaciones();
    } catch (error) {
      this.mostrar(error.message || "No se pudo cargar el catálogo.", "alert-warning");
    }
  }

  actualizarModalidad() {
    const mesa = this.modalidad() === "MESA";
    this.grupoMesa.hidden = !mesa;
    this.mesa.required = mesa;
    if (!mesa) this.mesa.value = "";
  }

  modalidad() {
    return this.formulario.querySelector('input[name="modalidad"]:checked')?.value || "MESA";
  }

  productoSeleccionado() {
    const id = Number(this.selector.value);
    return this.productos.find((producto) => producto.idProducto === id) || null;
  }

  pintarEspecificaciones() {
    this.especificaciones.replaceChildren();
    const producto = this.productoSeleccionado();
    if (!producto) return;
    for (const grupo of producto.especificacionesPermitidas) {
      const envoltura = this.documento.createElement("label");
      envoltura.className = "spec";
      envoltura.textContent = grupo.etiqueta;
      const seleccion = this.documento.createElement("select");
      seleccion.className = "form-select";
      seleccion.dataset.tipo = grupo.tipo;
      const vacia = this.documento.createElement("option");
      vacia.value = "";
      vacia.textContent = "Sin indicación";
      seleccion.append(vacia);
      for (const valor of grupo.valores) {
        const opcion = this.documento.createElement("option");
        opcion.value = valor.valor;
        opcion.textContent = valor.etiqueta;
        seleccion.append(opcion);
      }
      envoltura.append(seleccion);
      this.especificaciones.append(envoltura);
    }
  }

  agregarLinea() {
    const producto = this.productoSeleccionado();
    const cantidad = Number(this.cantidad.value);
    if (!producto || !Number.isInteger(cantidad) || cantidad <= 0) {
      this.mostrar("Indique un producto y una cantidad entera positiva.", "alert-warning");
      return;
    }
    const especificaciones = [];
    this.especificaciones.querySelectorAll("select").forEach((seleccion) => {
      if (seleccion.value) {
        const grupo = producto.especificacionesPermitidas.find((item) => item.tipo === seleccion.dataset.tipo);
        const valor = grupo?.valores.find((item) => item.valor === seleccion.value);
        especificaciones.push({
          tipo: seleccion.dataset.tipo,
          valor: seleccion.value,
          etiqueta: `${grupo?.etiqueta || seleccion.dataset.tipo}: ${valor?.etiqueta || seleccion.value}`,
        });
      }
    });
    this.lineas.push({
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      cantidad,
      especificaciones,
    });
    this.pintarResumen();
    this.ocultarConfirmacion();
    this.guardarBorrador();
  }

  pintarResumen() {
    this.resumen.replaceChildren();
    if (this.lineas.length === 0) {
      const fila = this.documento.createElement("tr");
      fila.id = "vacio";
      const celda = this.documento.createElement("td");
      celda.colSpan = 4;
      celda.textContent = "Todavía no hay productos.";
      fila.append(celda);
      this.resumen.append(fila);
      return;
    }
    this.lineas.forEach((linea, indice) => {
      const fila = this.documento.createElement("tr");
      fila.append(celda(linea.nombre));
      fila.append(celda(String(linea.cantidad)));
      fila.append(celda(linea.especificaciones.map((item) => item.etiqueta).join(", ") || "—"));
      const acciones = this.documento.createElement("td");
      const quitar = this.documento.createElement("button");
      quitar.type = "button";
      quitar.className = "btn btn-sm btn-link";
      quitar.textContent = "Quitar";
      quitar.addEventListener("click", () => {
        this.lineas.splice(indice, 1);
        this.pintarResumen();
        this.guardarBorrador();
      });
      acciones.append(quitar);
      fila.append(acciones);
      this.resumen.append(fila);
    });
  }

  async confirmar() {
    if (this.enviando) return;
    this.ocultarConfirmacion();
    if (this.lineas.length === 0) {
      this.mostrar("El pedido debe incluir al menos un producto.", "alert-warning");
      return;
    }
    const payload = {
      modalidad: this.modalidad(),
      numeroMesa: this.modalidad() === "MESA" ? this.mesa.value : null,
      detalles: this.lineas.map((linea) => ({
        idProducto: linea.idProducto,
        cantidad: linea.cantidad,
        especificaciones: linea.especificaciones.map(({ tipo, valor }) => ({ tipo, valor })),
      })),
    };
    this.enviando = true;
    this.boton.disabled = true;
    try {
      const resultado = await this.servicio.registrarPedido(payload, this.token);
      this.aviso.classList.add("d-none");
      this.codigo.textContent = String(resultado.idPedido);
      this.confirmacion.classList.remove("d-none");
      sessionStorage.removeItem(CLAVE_BORRADOR);
    } catch (error) {
      if (error instanceof ErrorConexionNoConfirmada) {
        this.guardarBorrador();
      }
      const texto = error.detalle ? `${error.message} ${error.detalle}` : error.message;
      this.mostrar(texto, error instanceof ErrorRespuestaApi ? "alert-warning" : "alert-danger");
      this.ocultarConfirmacion();
    } finally {
      this.enviando = false;
      this.boton.disabled = false;
    }
  }

  guardarBorrador() {
    const borrador = {
      modalidad: this.modalidad(),
      numeroMesa: this.mesa.value,
      cantidad: this.cantidad.value,
      lineas: this.lineas,
    };
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
  }

  restaurarBorrador() {
    const crudo = sessionStorage.getItem(CLAVE_BORRADOR);
    if (!crudo) return;
    try {
      const borrador = JSON.parse(crudo);
      const radio = this.formulario.querySelector(`input[name="modalidad"][value="${borrador.modalidad}"]`);
      if (radio) radio.checked = true;
      this.actualizarModalidad();
      if (typeof borrador.numeroMesa === "string") this.mesa.value = borrador.numeroMesa;
      if (borrador.cantidad) this.cantidad.value = borrador.cantidad;
      if (Array.isArray(borrador.lineas)) {
        this.lineas = borrador.lineas;
        this.pintarResumen();
      }
      if (this.lineas.length > 0) {
        this.mostrar("Se recuperó el formulario guardado en este navegador. Revíselo antes de enviarlo otra vez.", "alert-info");
      }
    } catch {
      sessionStorage.removeItem(CLAVE_BORRADOR);
    }
  }

  mostrar(texto, clase) {
    this.aviso.className = `alert ${clase}`;
    this.aviso.textContent = texto;
  }

  ocultarConfirmacion() {
    this.confirmacion.classList.add("d-none");
    this.codigo.textContent = "";
  }
}

function celda(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

const componente = new RegistroPedidoComponent();
componente.iniciar();
