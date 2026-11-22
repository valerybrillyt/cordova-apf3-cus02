# Propuesta de idempotencia — no aplicada

Estado: pendiente de aprobación del grupo. No se modificó la tabla `pedido`.

## Problema

EA02 del CUS02 dice que, si se pierde la conexión antes de la confirmación, no se sabe si el servidor guardó el pedido. El modelo físico no tiene un identificador persistente del intento. Un reintento puede crear otro pedido con los mismos productos.

## Riesgos

- Confirmar en pantalla un pedido que no se guardó.
- Volver a enviarlo y duplicar la venta operativa.
- Buscar «un pedido parecido» y tratarlo como si fuera el mismo intento. Eso puede unir dos pedidos distintos de la misma mesa.

## Solución conservadora, ya implementada

Si `fetch` falla o la respuesta no puede leerse:

1. No se muestra código.
2. No hay un segundo envío automático.
3. El formulario queda en `sessionStorage`.
4. El mensaje pide verificar si el pedido ya existe.
5. Esa verificación no se hace comparando pedidos semejantes.

Esta conducta no identifica el intento original. No se presenta como solución completa.

## Solución propuesta, no instalada

Agregar una columna nullable y una restricción única:

```sql
ALTER TABLE pedido
  ADD COLUMN solicitudUuid CHAR(36) NULL,
  ADD UNIQUE KEY uk_pedido_solicitud (solicitudUuid);
```

El navegador generaría la clave antes del primer envío y la repetiría solo en el reintento consciente. El servidor, dentro de la misma transacción:

- insertaría `solicitudUuid`;
- si la clave ya existe, devolvería el `idPedido` ya confirmado;
- si no existe, registraría el pedido nuevo.

## Cambio de contrato

El JSON de `POST /api/pedidos` incorporaría `solicitudUuid`. El servidor lo trataría como clave del intento, no como identificador del pedido. `idPedido` seguiría saliendo solo del `INSERT`.

## Pruebas que habría que agregar

- Dos POST con la misma clave y una sola fila en `pedido`.
- Dos POST con claves distintas y dos pedidos.
- Caída después del `COMMIT` y repetición con la misma clave, devolviendo el mismo código.
- Clave ausente: rechazar o tratar el intento como no reintentable, según acuerde el grupo.

## Consecuencias para los diagramas

Habría que actualizar el modelo físico, el contrato de `GestionPedidosController` y la secuencia de CUS02. No cambia los estados del pedido personalizado ni los roles.

## Recomendación

Aprobar la columna y la restricción única antes de programar el reintento. Hasta entonces, EA02 permanece como manejo conservador, no como idempotencia.
