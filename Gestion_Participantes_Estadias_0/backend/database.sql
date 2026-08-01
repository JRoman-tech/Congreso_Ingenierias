CREATE DATABASE IF NOT EXISTS congreso_participantes
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE congreso_participantes;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS participantes (
  id                        CHAR(36)     NOT NULL,
  nombre                    VARCHAR(100) NOT NULL,
  apellido_paterno          VARCHAR(100) NOT NULL,
  apellido_materno          VARCHAR(100) NULL,
  correo                    VARCHAR(150) NOT NULL,
  telefono                  VARCHAR(20)  NULL,
  pais                      VARCHAR(80)  NULL,
  institucion               VARCHAR(200) NULL,
  categoria                 ENUM('Estudiante','Docente','Investigador','Profesional') NOT NULL,
  requiere_carta_invitacion BOOLEAN NOT NULL DEFAULT FALSE,
  estado                    ENUM('activo','pendiente','rechazado') NOT NULL DEFAULT 'activo',
  fecha_registro            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion       DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_participante_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id                  CHAR(36)     NOT NULL,
  participante_id     CHAR(36)     NULL,
  nombre              VARCHAR(200) NOT NULL,
  correo              VARCHAR(150) NOT NULL,
  rol                 ENUM('administrador','participante') NOT NULL,
  password_hash       VARCHAR(100) NULL,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  administrador_unico TINYINT
    AS (CASE WHEN rol = 'administrador' THEN 1 ELSE NULL END) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_correo (correo),
  UNIQUE KEY uq_usuario_participante (participante_id),
  UNIQUE KEY uq_administrador_unico (administrador_unico),
  CONSTRAINT fk_usuario_participante
    FOREIGN KEY (participante_id) REFERENCES participantes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS informacion_academica (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  participante_id       CHAR(36)     NOT NULL,
  grado_maximo_estudios VARCHAR(100) NULL,
  institucion_academica VARCHAR(200) NULL,
  pais_academico        VARCHAR(80)  NULL,
  anio_egreso           SMALLINT     NULL,
  area_estudio          VARCHAR(100) NULL,
  semblanza             TEXT         NULL,
  fecha_actualizacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_academica_participante (participante_id),
  CONSTRAINT fk_academica_participante
    FOREIGN KEY (participante_id) REFERENCES participantes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS areas_interes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  participante_id CHAR(36)     NOT NULL,
  area            VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_area_participante (participante_id, area),
  CONSTRAINT fk_area_participante
    FOREIGN KEY (participante_id) REFERENCES participantes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trabajos (
  id              CHAR(36)     NOT NULL,
  folio           VARCHAR(12)  NOT NULL,
  participante_id CHAR(36)     NOT NULL,
  titulo          VARCHAR(300) NOT NULL,
  resumen         TEXT         NULL,
  eje_tematico    VARCHAR(100) NOT NULL,
  palabras_clave  VARCHAR(300) NULL,
  modalidad       ENUM('presencial','virtual','grabado') NOT NULL DEFAULT 'presencial',
  estado          ENUM('pendiente','en_revision','aceptado','rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trabajo_folio (folio),
  KEY idx_trabajo_participante (participante_id),
  CONSTRAINT fk_trabajo_participante
    FOREIGN KEY (participante_id) REFERENCES participantes (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  participante_id CHAR(36)     NOT NULL,
  tipo_documento  ENUM(
    'comprobante_pago',
    'resumen_trabajo',
    'trabajo_completo',
    'carta_autorizacion'
  ) NOT NULL,
  nombre_archivo  VARCHAR(255) NOT NULL,
  ruta_archivo    VARCHAR(500) NOT NULL,
  tamano_bytes    INT UNSIGNED NULL,
  estado          ENUM('pendiente','en_revision','validado','rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_carga     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_documento_tipo (participante_id, tipo_documento),
  CONSTRAINT fk_documento_participante
    FOREIGN KEY (participante_id) REFERENCES participantes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comprobantes_pago (
  id              CHAR(36)     NOT NULL,
  participante_id CHAR(36)     NOT NULL,
  modalidad       ENUM('individual','agrupado') NOT NULL,
  nombre_archivo  VARCHAR(255) NOT NULL,
  ruta_archivo    VARCHAR(500) NOT NULL,
  tamano_bytes    INT UNSIGNED NULL,
  estado          ENUM('pendiente','en_revision','validado','rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_carga     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comprobante_participante (participante_id),
  CONSTRAINT fk_comprobante_participante
    FOREIGN KEY (participante_id) REFERENCES participantes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comprobante_trabajos (
  comprobante_id CHAR(36) NOT NULL,
  trabajo_id     CHAR(36) NOT NULL,
  PRIMARY KEY (comprobante_id, trabajo_id),
  UNIQUE KEY uq_comprobante_trabajo (trabajo_id),
  CONSTRAINT fk_comprobante_trabajo_comprobante
    FOREIGN KEY (comprobante_id) REFERENCES comprobantes_pago (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_comprobante_trabajo_trabajo
    FOREIGN KEY (trabajo_id) REFERENCES trabajos (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS requisitos_documentos (
  participante_id     CHAR(36) NOT NULL,
  carta_autorizacion  BOOLEAN  NOT NULL DEFAULT FALSE,
  trabajo_completo    BOOLEAN  NOT NULL DEFAULT FALSE,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (participante_id),
  CONSTRAINT fk_requisitos_participante
    FOREIGN KEY (participante_id) REFERENCES participantes (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS actividad (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_usuario_id    CHAR(36)        NULL,
  actor_nombre        VARCHAR(200)    NOT NULL,
  participante_id     CHAR(36)        NULL,
  tipo                VARCHAR(50)     NOT NULL,
  titulo              VARCHAR(200)    NOT NULL,
  descripcion         VARCHAR(500)    NOT NULL,
  entidad_tipo        VARCHAR(40)     NOT NULL,
  entidad_id          VARCHAR(100)    NULL,
  ruta                VARCHAR(300)    NOT NULL,
  fecha               DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_actividad_fecha (fecha),
  KEY idx_actividad_participante (participante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificaciones (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  CHAR(36)        NOT NULL,
  tipo        VARCHAR(50)     NOT NULL,
  titulo      VARCHAR(200)    NOT NULL,
  mensaje     VARCHAR(500)    NOT NULL,
  ruta        VARCHAR(300)    NOT NULL,
  leida       BOOLEAN         NOT NULL DEFAULT FALSE,
  fecha       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notificacion_usuario (usuario_id, leida, fecha),
  CONSTRAINT fk_notificacion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
