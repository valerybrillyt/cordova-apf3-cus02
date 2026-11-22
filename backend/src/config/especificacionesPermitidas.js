/**
 * Catálogo de demostración y especificaciones permitidas del CUS02.
 *
 * Los identificadores son el contrato del seed. La validación no deduce
 * reglas buscando palabras en el nombre del producto.
 *
 * Fuentes:
 * - APF2, p. 16: jugos, batidos, café americano, capuchino, empanadas y croissants.
 * - Carta del APF2, pp. 71-75: nombres de productos de la muestra.
 * - La torta personalizada pertenece a CUS04 y no se registra por CUS02.
 *
 * Pendiente documentado: el apartado de milkshake menciona «sabor» y «postre de 4.5»
 * sin una lista cerrada. Esas opciones no se ofrecen. Frozen y frappés no aparecen
 * como productos identificables en las páginas de carta revisadas.
 */

export const ETIQUETAS_TIPO = {
  TEMPERATURA: "Temperatura",
  AZUCAR: "Azúcar",
  CARGA: "Carga",
  CREMA: "Crema",
  CALENTADO: "Calentado",
  TOPPING: "Topping",
  SALSA: "Salsa dulce",
};

export const ETIQUETAS_VALOR = {
  AMBIENTE: "Ambiente",
  FRESCO: "Fresco",
  HELADO: "Helado",
  SIN_AZUCAR: "Sin azúcar",
  BAJO_AZUCAR: "Bajo azúcar",
  AZUCAR_NORMAL: "Azúcar normal",
  CARGADO: "Cargado",
  POCO_CARGADO: "Poco cargado",
  CON_CREMA: "Con crema",
  SIN_CREMA: "Sin crema",
  CALIENTE: "Caliente",
  OREO: "Oreo",
  CHOCO_YOGURT: "Choco yogurt",
  LENTEJAS: "Lentejas",
  SUBLIME: "Sublime",
  FUDGE: "Fudge",
  MANJAR: "Manjar",
  JALEA_DE_FRESA: "Jalea de fresa",
};

const TEMPERATURA = ["AMBIENTE", "FRESCO", "HELADO"];
const AZUCAR = ["SIN_AZUCAR", "BAJO_AZUCAR", "AZUCAR_NORMAL"];

export const CATEGORIAS_DEMOSTRACION = [
  { idCategoria: 1, nombre: "Jugos" },
  { idCategoria: 2, nombre: "Batidos" },
  { idCategoria: 3, nombre: "Cafés" },
  { idCategoria: 4, nombre: "Bebidas frías" },
  { idCategoria: 5, nombre: "Bollería y empanadas" },
  { idCategoria: 6, nombre: "Postres" },
  { idCategoria: 7, nombre: "Tortas" },
  { idCategoria: 8, nombre: "Milkshakes" },
];

export const PRODUCTOS_DEMOSTRACION = [
  { idProducto: 1, idCategoria: 1, nombre: "Jugo de naranja" },
  { idProducto: 2, idCategoria: 2, nombre: "Batido de fresa con leche" },
  { idProducto: 3, idCategoria: 3, nombre: "Café americano" },
  { idProducto: 4, idCategoria: 3, nombre: "Capuchino" },
  { idProducto: 5, idCategoria: 5, nombre: "Croissant de avellana" },
  { idProducto: 6, idCategoria: 5, nombre: "Empanada de pollo" },
  { idProducto: 7, idCategoria: 6, nombre: "Tres leches" },
  { idProducto: 8, idCategoria: 8, nombre: "Milkshake con postre" },
  { idProducto: 9, idCategoria: 7, nombre: "Torta personalizada" },
  { idProducto: 10, idCategoria: 4, nombre: "Café helado" },
];

export const REGLAS_POR_PRODUCTO = {
  1: { TEMPERATURA, AZUCAR },
  2: { TEMPERATURA, AZUCAR },
  3: { CARGA: ["CARGADO", "POCO_CARGADO"] },
  4: { CREMA: ["CON_CREMA", "SIN_CREMA"] },
  5: { CALENTADO: ["CALIENTE"] },
  6: { CALENTADO: ["CALIENTE"] },
  8: {
    TOPPING: ["OREO", "CHOCO_YOGURT", "LENTEJAS", "SUBLIME"],
    SALSA: ["FUDGE", "MANJAR", "JALEA_DE_FRESA"],
  },
};

export const PRODUCTOS_SIN_ESPECIFICACION = new Set([7, 10]);

export const PRODUCTOS_EXCLUIDOS_CUS02 = new Set([9]);

export const ROLES_DEMOSTRACION = [
  { idRol: 1, nombreRol: "ATENCION" },
  { idRol: 2, nombreRol: "PREPARACION" },
  { idRol: 3, nombreRol: "CAJERA" },
  { idRol: 4, nombreRol: "ENCARGADA" },
  { idRol: 5, nombreRol: "PRODUCCION" },
];

export function coberturaDelProducto(idProducto) {
  if (PRODUCTOS_EXCLUIDOS_CUS02.has(idProducto)) return "excluido";
  if (Object.prototype.hasOwnProperty.call(REGLAS_POR_PRODUCTO, idProducto)) return "con_reglas";
  if (PRODUCTOS_SIN_ESPECIFICACION.has(idProducto)) return "sin_especificacion";
  return "pendiente";
}

export function describirEspecificaciones(idProducto) {
  const regla = REGLAS_POR_PRODUCTO[idProducto];
  if (!regla) return [];
  return Object.entries(regla).map(([tipo, valores]) => ({
    tipo,
    etiqueta: ETIQUETAS_TIPO[tipo] || tipo,
    valores: valores.map((valor) => ({
      valor,
      etiqueta: ETIQUETAS_VALOR[valor] || valor,
    })),
  }));
}

export function especificacionPermitida(idProducto, tipo, valor) {
  const regla = REGLAS_POR_PRODUCTO[idProducto];
  if (!regla || !Object.prototype.hasOwnProperty.call(regla, tipo)) return false;
  return regla[tipo].includes(valor);
}
