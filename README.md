# Córdova — demostración CUS02

Registro de pedidos de mesa o para llevar para Pastelería-Cafetería Córdova, local sede Chifa.

Repositorio: https://github.com/valerybrillyt/cordova-apf3-cus02

La cadena real es: `registro.ejs` → `RegistroPedidoComponent.js` → `PedidosApiService.js` → `GestionPedidosController` → `PedidoService` → `PedidoDAO` → MySQL 8.

Para fotos del código en el informe, ver `docs/evidencias/APF3/GUIA_FOTOS_CODIGO.md`. Los PDF y Word del APF2/APF3 están en `docs/fuentes/`.

## Credencial ficticia

Identificador: `atencion.demo`  
Clave: `DemoCordova#2026`

También existen `preparacion.demo`, `cajera.demo`, `encargada.demo`, `produccion.demo` e `inactivo.demo`, con la misma clave. `inactivo.demo` no entra. Ninguna pertenece a un trabajador real.

## Esta máquina (macOS, ya ejecutada)

MySQL 8.0.40 está en `database/mysql-local` y los datos en `database/mysql-data`. Esos directorios no se versionan.

```zsh
cd Cordova
zsh database/iniciar_mysql_local.sh
cd backend
npm install
npm start
```

Abrir `http://127.0.0.1:3000/login`.

Pruebas, contra `cordova_apf3_test`:

```zsh
cd backend
npm test
```

## Windows con MySQL Server 8

1. Instalar Node.js 20 LTS y MySQL Server 8. No usar SQLite ni MariaDB como reemplazo.
2. Copiar `backend/.env.example` a `backend/.env` y completar usuario, clave, `SESSION_SECRET` y la clave de root.
3. Crear el usuario de aplicación y las bases `cordova_apf3_dev` y `cordova_apf3_test`.
4. Desde `Cordova/backend`: `npm install`, `npm run esquema`, `npm start`.
5. Abrir `http://127.0.0.1:3000/login`.
6. `npm test`.
7. Contrastar el código de pantalla con:

```sql
SELECT p.idPedido, p.modalidad, p.numeroMesa, d.cantidad, pr.nombre, e.tipo, e.valor
FROM pedido p
JOIN detalle_pedido d ON d.idPedido = p.idPedido
JOIN producto pr ON pr.idProducto = d.idProducto
LEFT JOIN especificacion e ON e.idDetalle = d.idDetalle
WHERE p.idPedido = 1;
```

`database/docker-compose.yml` queda como alternativa si Docker puede extraer `mysql:8.0`. En esta Mac la extracción falló; la prueba usó el binario oficial 8.0.40.

No publique `backend/.env` ni `database/mysql.local.env`.
