# Continuidad hacia el sistema completo

CUS02 y el acceso mínimo de CUS01 están implementados. El resto queda organizado para reutilizar controlador, servicio y DAO sin romper el registro actual.

## PA01 — Gestión de pedidos

Hoy: `GestionPedidosController`, `PedidoService`, `PedidoDAO`, `ProductoDAO`.
Después: consultas de pedidos confirmados, sin publicar todavía `GET /api/pedidos/:id`.

## PA02 — Preparación local

Puede leer, mediante un servicio nuevo, los pedidos confirmados de `MESA` y `PARA_LLEVAR` con sus detalles y especificaciones. No se crea un estado de preparación local.

## PA03 — Pedidos personalizados

Usará las tablas `cliente`, `pedido` con modalidad `PERSONALIZADO`, `detalle_pedido` del producto 9 «Torta personalizada» con cantidad uno, `pedido_personalizado` y `personalizacion`. No pasa por `POST /api/pedidos`.

## PA04 — Seguimiento y recordatorios

Estados ya restringidos en la tabla: `RECIBIDO`, `EN_ELABORACION`, `LISTO`, `ENTREGADO`. El planificador será un componente interno del proceso Node, no WhatsApp ni Trinetsoft. Los avisos siguen las reglas de RF11 ya escritas en el APF2.

## PA05 — Acceso y permisos

Roles existentes: `ATENCION`, `PREPARACION`, `CAJERA`, `ENCARGADA`, `PRODUCCION`. La autorización vive en `autorizarRol` y se vuelve a comprobar en `PedidoService`. No se agregan roles.
