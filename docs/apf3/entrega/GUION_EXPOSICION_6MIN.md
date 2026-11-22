# Guion de exposición (~6 minutos)

Reparto sugerido: ~70 s por integrante.

## Nayu (3.8.1) — 90 s
Implementamos CUS02 con JavaScript, Express 5 y MySQL 8. La vista EJS envía JSON al controlador GestionPedidosController; PedidoService valida; PedidoDAO guarda en una sola transacción. Solo mostramos el código después del COMMIT. Probamos mesa, para llevar, errores y rollback: 12 pruebas PASS. El pedido 1 de la demo es mesa 5, dos capuchinos sin crema.

## Elsa (3.8.2) — 60 s
El diagrama de estructura compuesta modela el módulo de pedidos personalizados del PA03. Tiene partes de vista, controlador, servicio y DAO, con puertos hacia PA01, PA05 y MySQL. Todavía es propuesto; la torta personalizada no entra por el endpoint de CUS02.

## Valery (3.8.3) — 60 s
El diagrama de tiempo sigue RECIBIDO, EN_ELABORACION, LISTO y ENTREGADO con tiempos relativos t0 a t3. Producción inicia y marca listo; caja o encargada confirma la entrega. No se permiten saltos ilegales ni bitácoras que el APF2 no define.

## Axel (3.8.4) — 60 s
El despliegue propuesto tiene dos navegadores, el servidor Express y MySQL 8. La demo del 21 de noviembre usó una sola computadora en HTTP local. WhatsApp y Trinetsoft no aparecen como nodos integrados.

## Francesca (3.8.5) — 70 s
Los componentes PA01 a PA05 respetan las dependencias del APF2. Hoy están implementados PA01 con CUS02 y PA05 con acceso mínimo. PA02, PA03 y PA04 quedan previstos; el planificador de recordatorios es interno. Cierre: la cadena Vista–Controlador–Servicio–DAO–MySQL quedó demostrada.
