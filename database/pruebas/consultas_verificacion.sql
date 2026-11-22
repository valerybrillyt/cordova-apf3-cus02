-- Consultas de verificación del CUS02. Reemplace 0 por el código devuelto.
-- No contienen credenciales.

SELECT idPedido, modalidad, numeroMesa, fechaRegistro, confirmado
FROM pedido
WHERE idPedido = 0;

SELECT d.idDetalle, d.idPedido, d.idProducto, p.nombre, d.cantidad
FROM detalle_pedido d
INNER JOIN producto p ON p.idProducto = d.idProducto
WHERE d.idPedido = 0;

SELECT e.idEspecificacion, e.idDetalle, e.tipo, e.valor, d.idPedido
FROM especificacion e
INNER JOIN detalle_pedido d ON d.idDetalle = e.idDetalle
WHERE d.idPedido = 0;
