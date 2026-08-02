package mx.uacj.congreso.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public SchemaInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer passwordColumnCount = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'usuarios'
                  AND column_name = 'password_hash'
                """, Integer.class);
        if (passwordColumnCount != null && passwordColumnCount == 0) {
            jdbc.execute("""
                    ALTER TABLE usuarios
                    ADD COLUMN password_hash VARCHAR(100) NULL AFTER rol
                    """);
        }
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS requisitos_documentos (
                  participante_id CHAR(36) NOT NULL,
                  carta_autorizacion BOOLEAN NOT NULL DEFAULT FALSE,
                  trabajo_completo BOOLEAN NOT NULL DEFAULT FALSE,
                  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (participante_id),
                  CONSTRAINT fk_requisitos_participante
                    FOREIGN KEY (participante_id) REFERENCES participantes (id)
                    ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.update("""
                INSERT INTO requisitos_documentos
                  (participante_id, carta_autorizacion, trabajo_completo)
                SELECT p.id,
                       EXISTS(
                         SELECT 1 FROM documentos d
                         WHERE d.participante_id = p.id
                           AND d.tipo_documento = 'carta_autorizacion'
                       ),
                       EXISTS(
                         SELECT 1 FROM documentos d
                         WHERE d.participante_id = p.id
                           AND d.tipo_documento = 'trabajo_completo'
                       )
                FROM participantes p
                WHERE NOT EXISTS (
                  SELECT 1 FROM requisitos_documentos r
                  WHERE r.participante_id = p.id
                )
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS comprobantes_pago (
                  id CHAR(36) NOT NULL,
                  participante_id CHAR(36) NOT NULL,
                  modalidad ENUM('individual','agrupado') NOT NULL,
                  nombre_archivo VARCHAR(255) NOT NULL,
                  ruta_archivo VARCHAR(500) NOT NULL,
                  tamano_bytes INT UNSIGNED NULL,
                  estado ENUM('pendiente','validado','rechazado') NOT NULL DEFAULT 'pendiente',
                  fecha_carga DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_comprobante_participante (participante_id),
                  CONSTRAINT fk_comprobante_participante
                    FOREIGN KEY (participante_id) REFERENCES participantes (id)
                    ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS comprobante_trabajos (
                  comprobante_id CHAR(36) NOT NULL,
                  trabajo_id CHAR(36) NOT NULL,
                  PRIMARY KEY (comprobante_id, trabajo_id),
                  UNIQUE KEY uq_comprobante_trabajo (trabajo_id),
                  CONSTRAINT fk_comprobante_trabajo_comprobante
                    FOREIGN KEY (comprobante_id) REFERENCES comprobantes_pago (id)
                    ON DELETE CASCADE,
                  CONSTRAINT fk_comprobante_trabajo_trabajo
                    FOREIGN KEY (trabajo_id) REFERENCES trabajos (id)
                    ON DELETE RESTRICT
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.execute("""
                ALTER TABLE documentos
                MODIFY estado ENUM('pendiente','en_revision','validado','rechazado')
                NOT NULL DEFAULT 'pendiente'
                """);
        jdbc.execute("""
                ALTER TABLE comprobantes_pago
                MODIFY estado ENUM('pendiente','en_revision','validado','rechazado')
                NOT NULL DEFAULT 'pendiente'
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS actividad (
                  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  actor_usuario_id CHAR(36) NULL,
                  actor_nombre VARCHAR(200) NOT NULL,
                  participante_id CHAR(36) NULL,
                  tipo VARCHAR(50) NOT NULL,
                  titulo VARCHAR(200) NOT NULL,
                  descripcion VARCHAR(500) NOT NULL,
                  entidad_tipo VARCHAR(40) NOT NULL,
                  entidad_id VARCHAR(100) NULL,
                  ruta VARCHAR(300) NOT NULL,
                  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_actividad_fecha (fecha),
                  KEY idx_actividad_participante (participante_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS notificaciones (
                  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  usuario_id CHAR(36) NOT NULL,
                  tipo VARCHAR(50) NOT NULL,
                  titulo VARCHAR(200) NOT NULL,
                  mensaje VARCHAR(500) NOT NULL,
                  ruta VARCHAR(300) NOT NULL,
                  leida BOOLEAN NOT NULL DEFAULT FALSE,
                  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_notificacion_usuario (usuario_id, leida, fecha),
                  CONSTRAINT fk_notificacion_usuario
                    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
                    ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS validaciones (
                  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  participante_id CHAR(36) NOT NULL,
                  estado ENUM(
                    'pendiente_academico','rechazado_academico','en_correccion_academico',
                    'aprobado_academico','pendiente_pago','pago_no_recibido','validado_completo'
                  ) NOT NULL DEFAULT 'pendiente_academico',
                  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY uq_validacion_participante (participante_id),
                  CONSTRAINT fk_validacion_participante FOREIGN KEY (participante_id)
                    REFERENCES participantes (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS validacion_academica (
                  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  validacion_id BIGINT UNSIGNED NOT NULL,
                  titulo VARCHAR(300) NOT NULL,
                  resumen TEXT NOT NULL,
                  palabras_clave VARCHAR(500) NULL,
                  observaciones VARCHAR(1000) NULL,
                  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY uq_academica_validacion (validacion_id),
                  CONSTRAINT fk_academica_validacion FOREIGN KEY (validacion_id)
                    REFERENCES validaciones (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS validacion_pagos (
                  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  validacion_id BIGINT UNSIGNED NOT NULL,
                  nombre_archivo VARCHAR(255) NOT NULL,
                  ruta_archivo VARCHAR(500) NOT NULL,
                  monto DECIMAL(10,2) NULL,
                  estado ENUM('pendiente','rechazado','verificado') NOT NULL DEFAULT 'pendiente',
                  fecha_carga DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  UNIQUE KEY uq_pago_validacion (validacion_id),
                  CONSTRAINT fk_pago_validacion FOREIGN KEY (validacion_id)
                    REFERENCES validaciones (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS historial_validacion (
                  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  validacion_id BIGINT UNSIGNED NOT NULL,
                  estado_anterior VARCHAR(50) NULL,
                  estado_nuevo VARCHAR(50) NOT NULL,
                  comentario VARCHAR(1000) NULL,
                  realizado_por VARCHAR(200) NOT NULL,
                  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (id),
                  KEY idx_historial_validacion (validacion_id, fecha),
                  CONSTRAINT fk_historial_validacion FOREIGN KEY (validacion_id)
                    REFERENCES validaciones (id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
        jdbc.update("""
                INSERT INTO validaciones (participante_id)
                SELECT p.id FROM participantes p
                WHERE NOT EXISTS (
                  SELECT 1 FROM validaciones v WHERE v.participante_id = p.id
                )
                """);
        jdbc.update("""
                INSERT INTO actividad
                (actor_usuario_id, actor_nombre, participante_id, tipo, titulo,
                 descripcion, entidad_tipo, entidad_id, ruta, fecha)
                SELECT u.id,
                       COALESCE(u.nombre, CONCAT(p.nombre, ' ', p.apellido_paterno)),
                       d.participante_id,
                       'documento_subido',
                       'Documento registrado',
                       CONCAT(
                         CASE d.tipo_documento
                           WHEN 'comprobante_pago' THEN 'Subió el comprobante de pago: '
                           WHEN 'resumen_trabajo' THEN 'Subió el resumen del trabajo: '
                           WHEN 'trabajo_completo' THEN 'Subió el trabajo completo: '
                           ELSE 'Subió la carta de autorización: '
                         END,
                         d.nombre_archivo
                       ),
                       'documento',
                       d.tipo_documento,
                       CONCAT('/dashboard/documentos/', d.participante_id),
                       d.fecha_carga
                FROM documentos d
                JOIN participantes p ON p.id = d.participante_id
                LEFT JOIN usuarios u ON u.participante_id = d.participante_id
                WHERE NOT EXISTS (
                  SELECT 1 FROM actividad a
                  WHERE a.tipo = 'documento_subido'
                    AND a.participante_id = d.participante_id
                    AND a.entidad_tipo = 'documento'
                    AND a.entidad_id = d.tipo_documento
                )
                """);
    }
}
