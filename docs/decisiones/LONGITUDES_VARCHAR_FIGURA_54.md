# Longitudes VARCHAR de la figura 54

La figura 54 está recortada dentro de las cajas. Estas longitudes sí se leen completas y se usaron tal cual:

| Columna | Tipo visible |
|---|---|
| categoria_producto.nombre | VARCHAR(100) |
| pedido.modalidad | VARCHAR(20) |
| pedido_personalizado.estado | VARCHAR(20) |
| especificacion.tipo | VARCHAR(80) |
| especificacion.valor | VARCHAR(200) |
| cliente.telefono | VARCHAR(25) |
| personalizacion.sabor | VARCHAR(100) |
| personalizacion.tamano | VARCHAR(100) |
| recordatorio.tipo | VARCHAR(80) |
| usuario.claveHash | VARCHAR(255) |
| personalizacion.diseno e indicacionesEspeciales | TEXT |

Estas quedaron cortadas. El valor es provisional, solo para poder crear la tabla, y debe confirmarlo el grupo si aparece el diagrama original sin recorte:

| Columna | Fragmento visible | Valor provisional | Motivo |
|---|---|---|---|
| producto.nombre | VARCHAR(15… | VARCHAR(150) | «Batido de fresa con leche» no cabe en 15 caracteres |
| cliente.nombre | VARCHAR(15… | VARCHAR(150) | El mismo recorte; 15 no alcanza para un nombre compuesto |
| pedido.numeroMesa | VARCHAR(2… | VARCHAR(20) | El fragmento empieza en 2, igual que modalidad VARCHAR(20). Sigue siendo texto |
| usuario.identificadorAcceso | VARCHAR(10… | VARCHAR(100) | `atencion.demo` ya supera 10 caracteres |
| rol.nombreRol | VARCHAR(5… | VARCHAR(50) | `PREPARACION` no cabe en VARCHAR(5) |
| referencia_comprobante.numeroComprobante | VARCHAR(8… | VARCHAR(80) | Misma familia de anchos que `tipo VARCHAR(80)` |
| idEspecificacion | INT(1… | INT | El resto de claves se leen como INT(10); el 10 es ancho de presentación, no un tipo distinto |

`INT(10)` de la figura se implementó como `INT`. En MySQL 8 el número entre paréntesis es ancho de visualización, no la precisión del entero.

No se agregó `idUsuario` a `pedido`, ni `solicitud_uuid`, ni una tabla Mesa, ni una columna de estado de preparación.
