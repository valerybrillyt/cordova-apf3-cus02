# Conflictos documentales y decisión aplicada

Fecha de registro: 21 de noviembre de 2026.

## 1. Frontend de Nayu frente a la decisión del equipo

El Word de Nayu propone Angular y TypeScript. Este prompt fija HTML, EJS, CSS y JavaScript, y conserva Express, Node.js, MySQL 8 y los nombres del backend.

Decisión: se implementó `registro.ejs`, `RegistroPedidoComponent.js` y `PedidosApiService.js`. No hay archivos `.ts` ni carpeta Angular. Se conservan `GestionPedidosController.js`, `PedidoService.js`, `PedidoDAO.js`, `ProductoDAO.js`, `GET /api/productos` y `POST /api/pedidos`.

## 2. Nombres de tablas: figura 54 y texto del apartado 3.6

La figura 54 dibuja `categoriaproducto`, `detallepedido`, `pedidopersonalizado` y `referenciacomprobante`. El texto de la página 63 y el cuadro de la página 64 escriben `categoria_producto`, `detalle_pedido`, `pedido_personalizado` y `referencia_comprobante`. El prompt usa esos mismos nombres con guion bajo.

Decisión: el esquema usa los nombres del texto del APF2 y del prompt. La figura se interpreta como un recorte visual del diagrama, no como un segundo modelo.

## 3. ENUM del cuadro y VARCHAR de la figura

El cuadro de la página 64 dice «INT, ENUM, DATETIME» para pedido. La figura 54 muestra `modalidad VARCHAR(20)` y `estado VARCHAR(20)`. El apartado 3.4 dice que las enumeraciones son valores controlados, no tablas nuevas.

Decisión: las columnas quedan como VARCHAR, con `CHECK` de los valores documentados (`MESA`, `PARA_LLEVAR`, `PERSONALIZADO` y `RECIBIDO`, `EN_ELABORACION`, `LISTO`, `ENTREGADO`).

## 4. Longitudes VARCHAR recortadas

Varias cajas de la figura 54 cortan el tipo (`VARCHAR(15…`, `VARCHAR(2…`, `VARCHAR(10…`, `VARCHAR(5…`, `VARCHAR(8…`). No se puede leer el número completo. El detalle está en `LONGITUDES_VARCHAR_FIGURA_54.md`. No se inventaron columnas.

## 5. Tarjetas CRC de Usuario y Recordatorio

En la transcripción del PDF, la tarjeta titulada Usuario repite responsabilidades de Recordatorio. Los atributos conceptuales de la página 33 son distintos y se respetaron: Usuario tiene identificador, hash y activo; Recordatorio tiene tipo, fecha y leído.

## 6. CUS01 mínimo

Nayu dejaba pendiente un contexto de prueba sin implementar CUS01. El prompt exige sesión real, hash, usuario activo y rol leído en el servidor. Se implementó solo el acceso mínimo. CUS02 sigue siendo un caso distinto: la pantalla de login no forma parte de su flujo de negocio.

## 7. Nombre del capuchino

El APF2 dice «Capuchino» con la opción con crema o sin crema. La carta escribe «CAPUCCHINO C/ CREMA». El catálogo de demostración usa el nombre del APF2 y la especificación `CREMA`.

## 8. Motor ejecutado

Docker Desktop está instalado, pero el registro de la imagen `mysql:8.0` falló con un error de overlay (`too many levels of symbolic links`). No se borraron las imágenes Oracle y SQL Server que ya existían. La ejecución comprobada usa el binario oficial MySQL Community Server 8.0.40 para macOS 14, arm64. Sigue siendo MySQL Server 8, no MariaDB ni SQLite.

## 9. Entorno

El prompt habla de Windows. Esta máquina es macOS 14.2.1. Los comandos de Windows están en el reporte; la evidencia es de esta Mac.

## 10. Restricciones técnicas que no son columnas de negocio

Se añadieron `UNIQUE` en `usuario.identificadorAcceso` y `rol.nombreRol` para que el acceso no acepte identificadores duplicados. No son columnas nuevas. La propuesta de idempotencia no se aplicó.
