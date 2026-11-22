# Qué fotografiar del código (E01 y resto)

Abrir el repositorio en GitHub o en Cursor. Para el documento APF3, estas carpetas y archivos son las que conviene capturar:

## E01 — Estructura MVC + DAO + Capas

1. Árbol del proyecto (carpeta `Cordova/` o la vista Files de GitHub).
2. Vista: `frontend/views/pedidos/registro.ejs`
3. Frontend: `frontend/public/js/RegistroPedidoComponent.js` y `PedidosApiService.js`
4. Controlador: `backend/src/controllers/GestionPedidosController.js`
5. Servicio: `backend/src/services/PedidoService.js`
6. Modelos: `backend/src/models/`
7. DAO: `backend/src/dao/PedidoDAO.js` y `ProductoDAO.js`
8. Rutas: `backend/src/routes/pedidos.routes.js` y `productos.routes.js`
9. Conexión: `backend/src/config/Conexion.js` (sin abrir `.env`)

## E02 — Conexión MySQL

- `backend/src/config/Conexion.js`
- Resultado de `/health` o la evidencia `E02_conexion.txt`

## E03 — CUS02 en pantalla

- `docs/evidencias/APF3/E03_cus02_pedido_mesa.png`
- O volver a abrir `http://127.0.0.1:3000/pedidos/nuevo` y capturar el código del pedido

## E04 — Persistencia

- `docs/evidencias/APF3/E04_persistencia.txt`
- O una consulta en DBeaver sobre `pedido`, `detalle_pedido` y `especificacion`

## E05 — Validaciones

- `docs/evidencias/APF3/E05_validacion_sin_detalle.png`
- `docs/evidencias/APF3/E05_pruebas_node.txt`

No fotografíen ni compartan `backend/.env` ni contraseñas reales.
