-- Esquema físico MySQL 8 del APF2 para Pastelería-Cafetería Córdova.
-- Doce tablas. No elimina bases ni tablas existentes.
-- Los nombres con guion bajo siguen el texto del apartado 3.6.
-- La figura 54 dibuja algunos nombres concatenados; ver docs/decisiones/CONFLICTOS_DOCUMENTALES.md.
-- Las longitudes VARCHAR recortadas en la figura quedan documentadas como provisionales.

CREATE TABLE IF NOT EXISTS rol (
  idRol INT NOT NULL AUTO_INCREMENT,
  nombreRol VARCHAR(50) NOT NULL,
  PRIMARY KEY (idRol),
  UNIQUE KEY uk_rol_nombre (nombreRol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categoria_producto (
  idCategoria INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (idCategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cliente (
  idCliente INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(25) NOT NULL,
  PRIMARY KEY (idCliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuario (
  idUsuario INT NOT NULL AUTO_INCREMENT,
  idRol INT NOT NULL,
  identificadorAcceso VARCHAR(100) NOT NULL,
  claveHash VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL,
  PRIMARY KEY (idUsuario),
  UNIQUE KEY uk_usuario_identificador (identificadorAcceso),
  CONSTRAINT fk_usuario_rol FOREIGN KEY (idRol) REFERENCES rol (idRol)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS producto (
  idProducto INT NOT NULL AUTO_INCREMENT,
  idCategoria INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  PRIMARY KEY (idProducto),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (idCategoria) REFERENCES categoria_producto (idCategoria)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedido (
  idPedido INT NOT NULL AUTO_INCREMENT,
  modalidad VARCHAR(20) NOT NULL,
  numeroMesa VARCHAR(20) NULL,
  fechaRegistro DATETIME NOT NULL,
  confirmado TINYINT(1) NOT NULL,
  PRIMARY KEY (idPedido),
  CONSTRAINT chk_pedido_modalidad CHECK (modalidad IN ('MESA', 'PARA_LLEVAR', 'PERSONALIZADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_pedido (
  idDetalle INT NOT NULL AUTO_INCREMENT,
  idPedido INT NOT NULL,
  idProducto INT NOT NULL,
  cantidad INT NOT NULL,
  PRIMARY KEY (idDetalle),
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (idPedido) REFERENCES pedido (idPedido)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (idProducto) REFERENCES producto (idProducto)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS especificacion (
  idEspecificacion INT NOT NULL AUTO_INCREMENT,
  idDetalle INT NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  valor VARCHAR(200) NOT NULL,
  PRIMARY KEY (idEspecificacion),
  CONSTRAINT fk_especificacion_detalle FOREIGN KEY (idDetalle) REFERENCES detalle_pedido (idDetalle)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedido_personalizado (
  idPersonalizado INT NOT NULL AUTO_INCREMENT,
  idPedido INT NOT NULL,
  idCliente INT NOT NULL,
  estado VARCHAR(20) NOT NULL,
  fechaConfirmacion DATETIME NULL,
  PRIMARY KEY (idPersonalizado),
  UNIQUE KEY uk_pedido_personalizado_pedido (idPedido),
  CONSTRAINT fk_personalizado_pedido FOREIGN KEY (idPedido) REFERENCES pedido (idPedido)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_personalizado_cliente FOREIGN KEY (idCliente) REFERENCES cliente (idCliente)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_estado_personalizado CHECK (estado IN ('RECIBIDO', 'EN_ELABORACION', 'LISTO', 'ENTREGADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personalizacion (
  idPersonalizacion INT NOT NULL AUTO_INCREMENT,
  idPersonalizado INT NOT NULL,
  diseno TEXT NOT NULL,
  sabor VARCHAR(100) NOT NULL,
  tamano VARCHAR(100) NOT NULL,
  fechaHoraEntrega DATETIME NOT NULL,
  indicacionesEspeciales TEXT NULL,
  PRIMARY KEY (idPersonalizacion),
  UNIQUE KEY uk_personalizacion_encargo (idPersonalizado),
  CONSTRAINT fk_personalizacion_encargo FOREIGN KEY (idPersonalizado) REFERENCES pedido_personalizado (idPersonalizado)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referencia_comprobante (
  idReferencia INT NOT NULL AUTO_INCREMENT,
  idPedido INT NOT NULL,
  numeroComprobante VARCHAR(80) NOT NULL,
  PRIMARY KEY (idReferencia),
  UNIQUE KEY uk_referencia_pedido (idPedido),
  CONSTRAINT fk_referencia_pedido FOREIGN KEY (idPedido) REFERENCES pedido (idPedido)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recordatorio (
  idRecordatorio INT NOT NULL AUTO_INCREMENT,
  idPersonalizado INT NOT NULL,
  idUsuario INT NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  fechaProgramada DATETIME NOT NULL,
  leido TINYINT(1) NOT NULL,
  PRIMARY KEY (idRecordatorio),
  UNIQUE KEY uk_recordatorio_evento (idPersonalizado, idUsuario, tipo, fechaProgramada),
  CONSTRAINT fk_recordatorio_personalizado FOREIGN KEY (idPersonalizado) REFERENCES pedido_personalizado (idPersonalizado)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_recordatorio_usuario FOREIGN KEY (idUsuario) REFERENCES usuario (idUsuario)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
