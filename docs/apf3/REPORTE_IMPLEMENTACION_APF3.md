# Reporte de implementación APF3 — Córdova

Fecha de la ejecución comprobada: 21 de noviembre de 2026, hora local UTC-5 (los registros de MySQL quedan en UTC, 2026-11-22 04:18:03Z para el pedido de la demostración).

## A. Tecnologías

Versiones leídas en esta máquina, no estimadas:

| Pieza | Versión |
|---|---|
| Sistema | macOS 14.2.1, arm64 |
| Node.js | 20.19.6 |
| npm | 10.8.2 |
| Express | 5.3.0 |
| mysql2 | 3.24.6 |
| EJS | 3.1.10 |
| express-session | 1.19.0 |
| bcryptjs | 2.4.3 |
| dotenv | 16.6.1 |
| supertest | 7.3.2 |
| Bootstrap | 5.3.3, archivos locales en `frontend/public/vendor` |
| MySQL | 8.0.40 Community Server, `mysqld Ver 8.0.40 for macos14 on arm64` |

DBeaver está instalado (`DBeaver.app`). Las consultas de evidencia se hicieron con el cliente del propio MySQL 8.0.40, no con una captura de DBeaver.

Docker Desktop está instalado, pero `docker pull mysql:8.0` falló al montar la capa (`too many levels of symbolic links`). No se eliminaron los contenedores Oracle ni SQL Server que ya existían. Por eso la prueba usa el binario oficial, que sigue siendo MySQL Server 8.

## B. Implementación

El proyecto nuevo está en `Cordova/`. El listado real, sin `node_modules` ni el binario de MySQL, está en `docs/evidencias/APF3/E01_estructura.txt`.

Piezas principales:

- Vista: `frontend/views/pedidos/registro.ejs`, `RegistroPedidoComponent.js`, `PedidosApiService.js`.
- Controlador: `GestionPedidosController.js` y `AuthController.js`.
- Servicio: `PedidoService.js`, `AuthService.js`.
- Modelo: `Pedido`, `DetallePedido`, `Producto`, `Especificacion`.
- DAO: `PedidoDAO`, `ProductoDAO`, `UsuarioDAO`.
- Conexión: `Conexion.js`.
- Esquema: `database/esquema_cordova.sql`.

No hay Angular, TypeScript, PHP, Prisma ni Sequelize.

## C. Base de datos

Bases: `cordova_apf3_dev` y `cordova_apf3_test`.

`GET /health` respondió `{"estado":"ok","baseDatos":"cordova_apf3_dev","conexion":true}`.

`SELECT VERSION()` devolvió `8.0.40`. Las doce tablas están en ambas bases. Evidencia: `docs/evidencias/APF3/E02_conexion.txt`.

El pedido de la pantalla quedó así en desarrollo (`E04_persistencia.txt`):

`idPedido=1`, `MESA`, mesa `5`, `confirmado=1`, detalle 1, producto 4 Capuchino, cantidad 2, especificación `CREMA` / `SIN_CREMA`.

## D. MVC

La vista captura modalidad, mesa, catálogo, cantidad y especificaciones. Solo muestra el código si la respuesta es HTTP 201 con `idPedido`.

`registrarPedido` no escribe SQL. Entrega el cuerpo y el rol de la sesión a `PedidoService.procesarPedido`.

Los modelos no reemplazan al DAO. Las reglas están en el servicio y en `pedido.validator.js`, que el servicio invoca.

## E. DAO

`registrarPedido` obtiene una conexión del pool, abre transacción, inserta cabecera, detalles y especificaciones, y hace `commit` después del último insert. El `rollback` se probó con un producto inexistente: la cabecera no permanece. Las sentencias usan parámetros `?`.

## F. Tres capas

| Capa | Archivos | Qué hace |
|---|---|---|
| Presentación | `frontend/` | Formulario, `fetch`, mensajes |
| Negocio | `controllers`, `services`, `models`, `validators`, `middlewares` | Sesión, rol, modalidad, mesa, cantidades, especificaciones |
| Persistencia | `dao`, `config/Conexion.js`, MySQL 8.0.40 | Catálogo y transacción |

Express entrega la vista y los estáticos. El navegador no abre un puerto hacia MySQL.

## G. CUS01

Implementación mínima, no el módulo completo de usuarios.

Entra con identificador y clave, compara el hash, rechaza al usuario inactivo, guarda el rol leído de `rol` y regenera la sesión. La cookie es HttpOnly y SameSite Lax. `Secure` queda para HTTPS. Las operaciones que cambian datos exigen el token CSRF de la sesión. Un rol distinto de `ATENCION` recibe HTTP 403 en `POST /api/pedidos`. Cerrar sesión destruye la sesión.

La memoria de `express-session` sirve para esta demostración local y no para producción.

## H. CUS02

Quedaron operativos el pedido de mesa y el de para llevar, el catálogo de MySQL, las cantidades enteras positivas, las especificaciones por id de producto y el rechazo de la torta personalizada. `numeroMesa` se guarda como texto. En para llevar queda `NULL`. `confirmado` se escribe en el mismo `INSERT` y el código se devuelve solo después del `commit`.

## I. Pruebas

Archivo: `docs/evidencias/APF3/E05_pruebas_node.txt`. Resultado de esa ejecución: 12 pruebas, 12 aprobadas, 0 fallos.

| Código | Resultado |
|---|---|
| P01 | PASS. HTTP 201, mesa, detalle y especificación persistidos en `cordova_apf3_test` |
| P02 | PASS. Para llevar con `numeroMesa` nulo |
| P03 | PASS. Mesa vacía, sin detalles, cantidad 0, cantidad negativa, producto inexistente, especificación incompatible y torta personalizada. HTTP 400 y el conteo no aumenta |
| P04 | PASS. Falla de clave foránea después de insertar la cabecera; rollback; no queda detalle huérfano |
| P05 | PASS en el cliente HTTP: una sola llamada y mensaje de verificación. La prevención inequívoca de duplicados sigue pendiente |

También pasaron login correcto, clave incorrecta, usuario inactivo, sesión ausente, rol de preparación, catálogo real, mesa con comillas guardada como texto, error de MySQL sin filtrar SQL y `/health`.

## J. Capturas

| Código | Archivo | Qué demuestra |
|---|---|---|
| E01 | `docs/evidencias/APF3/E01_estructura.txt` | Árbol real. Es salida de `find`, no una imagen dibujada |
| E02 | `docs/evidencias/APF3/E02_conexion.txt` | Health y versión 8.0.40, sin claves |
| E03 | `docs/evidencias/APF3/E03_cus02_pedido_mesa.png` | Formulario con mesa 5, capuchino, cantidad 2, sin crema y código 1 |
| E04 | `docs/evidencias/APF3/E04_persistencia.txt` | La fila 1 coincide con ese código |
| E05 | `E05_validacion_sin_detalle.png` y `E05_pruebas_node.txt` | Rechazo sin productos y la suite P01–P05 |

No hay captura de DBeaver. La comprobación de persistencia es la consulta reproducida en E04.

## K. Diagramas

Fuentes PlantUML:

- `docs/apf3/diagramas/3.8.2_estructura_compuesta.puml`
- `docs/apf3/diagramas/3.8.3_tiempo.puml`
- `docs/apf3/diagramas/3.8.4_despliegue.puml`
- `docs/apf3/diagramas/3.8.5_componentes.puml`

Explicación: `docs/apf3/3.8.2_a_3.8.5_Explicaciones.md`.

No se exportó PNG ni SVG y no existe un archivo de Visual Paradigm. Falta Java o PlantUML en esta máquina.

Los diagramas usan Express, EJS y MySQL 8. PA03, PA02 y PA04 están marcados como previstos. El planificador es interno. No se dibujan WhatsApp ni Trinetsoft.

## L. Limitaciones

- EA02 no identifica el intento. Un envío manual posterior puede duplicar el pedido.
- Las longitudes VARCHAR recortadas en la figura 54 son provisionales.
- Docker no pudo extraer la imagen. El servidor usado es el binario 8.0.40 local.
- La sesión está en memoria.
- La demostración fue en una sola Mac, por HTTP, no en dos servidores ni con HTTPS.
- No hay captura de DBeaver.
- CUS03 a CUS09, cobro, delivery, WhatsApp y Trinetsoft no están implementados.
- El disco de la máquina estaba lleno durante la preparación. Se liberó caché regenerable de Chrome y del simulador de iOS para poder instalar dependencias y MySQL. No se borraron documentos del proyecto ni las imágenes Docker de Oracle y SQL Server.

## M. Decisiones pendientes

1. Aprobar o rechazar `solicitudUuid` y su índice único. Ver `docs/decisiones/PROPUESTA_IDEMPOTENCIA.md`.
2. Confirmar las longitudes VARCHAR provisionales con el diagrama original sin recorte.
3. Confirmar si los nombres físicos definitivos llevan guion bajo, como el texto del APF2, o van concatenados, como la figura 54. El esquema sigue el texto.
4. Cerrar la lista de sabor y postre del milkshake, y decidir si frozen y frappé entran al catálogo cuando haya un producto identificado.
5. Ratificar en grupo el abandono de Angular. El código ya está en EJS y JavaScript.

## N. Ejecución en Windows

Supone Node.js 20 LTS y MySQL Server 8 escuchando en `127.0.0.1:3306`. No incluye contraseñas.

1. Instalar dependencias: `cd Cordova\backend` y `npm install`.
2. Configurar variables: copiar `backend\.env.example` a `backend\.env` y completar `DB_USER`, `DB_PASSWORD`, `DB_NAME=cordova_apf3_dev`, `SESSION_SECRET` y `MYSQL_ROOT_PASSWORD`.
3. Preparar MySQL: crear las bases si el script aún no puede entrar, o dejar que `npm run esquema` las cree con el usuario root indicado.
4. Sembrar: `npm run esquema` aplica el esquema y los datos ficticios en desarrollo y en pruebas. `npm run seed` vuelve a sembrar solo la base de desarrollo.
5. Iniciar Express: `npm start`.
6. Abrir `http://127.0.0.1:3000/login`. El identificador ficticio y la clave están en el README.
7. Pruebas: `npm test`. Usan únicamente `cordova_apf3_test`.
8. Verificar el pedido, cambiando el id por el código de pantalla:

```sql
SELECT p.idPedido, p.modalidad, p.numeroMesa, p.confirmado,
       d.idDetalle, d.cantidad, pr.nombre, e.tipo, e.valor
FROM pedido p
JOIN detalle_pedido d ON d.idPedido = p.idPedido
JOIN producto pr ON pr.idProducto = d.idProducto
LEFT JOIN especificacion e ON e.idDetalle = d.idDetalle
WHERE p.idPedido = 1;
```

En esta Mac el equivalente del paso 5 ya está escuchando en el puerto 3000 mientras el proceso de Node siga activo, y MySQL 8.0.40 escucha en el puerto 3306.
