package mx.uacj.congreso.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/validaciones")
public class ValidacionesController {

    private static final Set<String> ESTADOS = Set.of(
            "pendiente_academico", "rechazado_academico", "en_correccion_academico",
            "aprobado_academico", "pendiente_pago", "pago_no_recibido", "validado_completo");

    private final JdbcTemplate jdbc;
    private final Path uploadDirectory;

    public ValidacionesController(JdbcTemplate jdbc, @Value("${app.upload-dir}") String uploadDirectory) {
        this.jdbc = jdbc;
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize()
                .resolve("validacion");
    }

    @GetMapping
    public List<Map<String, Object>> listar() {
        return jdbc.queryForList("""
                SELECT v.id, v.participante_id, v.estado, v.creado_en, v.actualizado_en,
                       TRIM(CONCAT_WS(' ', p.nombre, p.apellido_paterno, p.apellido_materno)) nombre,
                       p.correo, p.institucion, p.categoria
                FROM validaciones v
                JOIN participantes p ON p.id = v.participante_id
                ORDER BY v.actualizado_en DESC, v.id DESC
                """);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable long id) {
        return detalle("v.id = ?", id);
    }

    @GetMapping("/participante/{participanteId}")
    public ResponseEntity<?> obtenerPorParticipante(@PathVariable String participanteId) {
        asegurarValidacion(participanteId);
        return detalle("v.participante_id = ?", participanteId);
    }

    @PutMapping("/{id}/estado")
    @Transactional
    public ResponseEntity<?> actualizarEstado(@PathVariable long id, @RequestBody Map<String, Object> body) {
        String estado = texto(body.get("estado"));
        if (!ESTADOS.contains(estado)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado no válido"));
        }
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT estado FROM validaciones WHERE id = ?", id);
        if (rows.isEmpty()) return ResponseEntity.notFound().build();

        String anterior = rows.get(0).get("estado").toString();
        jdbc.update("UPDATE validaciones SET estado = ?, actualizado_en = NOW() WHERE id = ?", estado, id);
        if ("validado_completo".equals(estado)) {
            jdbc.update("UPDATE validacion_pagos SET estado='verificado' WHERE validacion_id=?", id);
        } else if ("pago_no_recibido".equals(estado)) {
            jdbc.update("UPDATE validacion_pagos SET estado='rechazado' WHERE validacion_id=?", id);
        }
        registrarHistorial(id, anterior, estado, texto(body.get("comentario")),
                nombreUsuario(texto(body.get("usuario_id"))));
        return obtener(id);
    }

    @PutMapping("/participante/{participanteId}/academica")
    @Transactional
    public ResponseEntity<?> guardarAcademica(
            @PathVariable String participanteId, @RequestBody Map<String, Object> body) {
        String titulo = texto(body.get("titulo"));
        String resumen = texto(body.get("resumen"));
        if (titulo.isBlank() || resumen.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Título y resumen son obligatorios"));
        }
        long validacionId = asegurarValidacion(participanteId);
        jdbc.update("""
                INSERT INTO validacion_academica
                  (validacion_id, titulo, resumen, palabras_clave, observaciones)
                VALUES (?, ?, ?, ?, NULL)
                ON DUPLICATE KEY UPDATE titulo=VALUES(titulo), resumen=VALUES(resumen),
                  palabras_clave=VALUES(palabras_clave), observaciones=NULL
                """, validacionId, titulo, resumen, texto(body.get("palabras_clave")));

        String actual = jdbc.queryForObject(
                "SELECT estado FROM validaciones WHERE id=?", String.class, validacionId);
        String nuevo = "rechazado_academico".equals(actual)
                ? "en_correccion_academico" : "pendiente_academico";
        if (!nuevo.equals(actual)) {
            jdbc.update("UPDATE validaciones SET estado=?, actualizado_en=NOW() WHERE id=?", nuevo, validacionId);
            registrarHistorial(validacionId, actual, nuevo, "Información académica actualizada",
                    nombreParticipante(participanteId));
        }
        return obtener(validacionId);
    }

    @PostMapping(value = "/participante/{participanteId}/comprobante",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> subirComprobante(
            @PathVariable String participanteId,
            @RequestParam("archivo") MultipartFile archivo) throws IOException {
        if (archivo.isEmpty() || archivo.getOriginalFilename() == null
                || !archivo.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Selecciona un archivo PDF"));
        }
        long validacionId = asegurarValidacion(participanteId);
        Files.createDirectories(uploadDirectory);
        String safeName = archivo.getOriginalFilename().replaceAll("[^a-zA-Z0-9._ -]", "_");
        String storedName = UUID.randomUUID() + "_" + safeName;
        Path target = uploadDirectory.resolve(storedName).normalize();
        if (!target.startsWith(uploadDirectory)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre de archivo no válido"));
        }
        archivo.transferTo(target);
        jdbc.update("""
                INSERT INTO validacion_pagos
                  (validacion_id, nombre_archivo, ruta_archivo, estado)
                VALUES (?, ?, ?, 'pendiente')
                ON DUPLICATE KEY UPDATE nombre_archivo=VALUES(nombre_archivo),
                  ruta_archivo=VALUES(ruta_archivo), estado='pendiente', fecha_carga=NOW()
                """, validacionId, safeName, storedName);
        String anterior = jdbc.queryForObject(
                "SELECT estado FROM validaciones WHERE id=?", String.class, validacionId);
        jdbc.update("UPDATE validaciones SET estado='pendiente_pago', actualizado_en=NOW() WHERE id=?",
                validacionId);
        registrarHistorial(validacionId, anterior, "pendiente_pago", "Comprobante enviado para revisión",
                nombreParticipante(participanteId));
        return obtener(validacionId);
    }

    @GetMapping("/comprobantes/{nombre}")
    public ResponseEntity<Resource> verComprobante(@PathVariable String nombre) throws IOException {
        Path target = uploadDirectory.resolve(nombre).normalize();
        if (!target.startsWith(uploadDirectory) || !Files.exists(target)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "inline; filename=\"" + target.getFileName() + "\"")
                .body(new UrlResource(target.toUri()));
    }

    private ResponseEntity<?> detalle(String where, Object value) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT v.id, v.participante_id, v.estado, v.creado_en, v.actualizado_en,
                       TRIM(CONCAT_WS(' ', p.nombre, p.apellido_paterno, p.apellido_materno)) nombre,
                       p.correo, p.institucion, p.categoria
                FROM validaciones v JOIN participantes p ON p.id=v.participante_id
                WHERE """ + " " + where, value);
        if (rows.isEmpty()) return ResponseEntity.notFound().build();
        Map<String, Object> result = new LinkedHashMap<>(rows.get(0));
        long id = ((Number) result.get("id")).longValue();
        result.put("academica", primero(jdbc.queryForList("""
                SELECT id, titulo, resumen, palabras_clave, observaciones, actualizado_en
                FROM validacion_academica WHERE validacion_id=?
                """, id)));
        result.put("pago", primero(jdbc.queryForList("""
                SELECT id, nombre_archivo, ruta_archivo, monto, estado, fecha_carga
                FROM validacion_pagos WHERE validacion_id=?
                """, id)));
        result.put("historial", jdbc.queryForList("""
                SELECT id, estado_anterior, estado_nuevo, comentario, realizado_por, fecha
                FROM historial_validacion WHERE validacion_id=? ORDER BY fecha DESC, id DESC
                """, id));
        return ResponseEntity.ok(result);
    }

    private long asegurarValidacion(String participanteId) {
        jdbc.update("""
                INSERT INTO validaciones (participante_id)
                SELECT id FROM participantes WHERE id=?
                ON DUPLICATE KEY UPDATE participante_id=VALUES(participante_id)
                """, participanteId);
        Long id = jdbc.queryForObject(
                "SELECT id FROM validaciones WHERE participante_id=?", Long.class, participanteId);
        if (id == null) throw new IllegalArgumentException("Participante no encontrado");
        return id;
    }

    private void registrarHistorial(long id, String anterior, String nuevo,
            String comentario, String realizadoPor) {
        jdbc.update("""
                INSERT INTO historial_validacion
                  (validacion_id, estado_anterior, estado_nuevo, comentario, realizado_por)
                VALUES (?, ?, ?, ?, ?)
                """, id, anterior, nuevo, comentario.isBlank() ? null : comentario, realizadoPor);
    }

    private String nombreUsuario(String id) {
        if (id == null || id.isBlank()) return "Administrador";
        List<String> names = jdbc.query("SELECT nombre FROM usuarios WHERE id=?",
                (row, index) -> row.getString(1), id);
        return names.isEmpty() ? "Administrador" : names.get(0);
    }

    private String nombreParticipante(String id) {
        List<String> names = jdbc.query("""
                SELECT TRIM(CONCAT_WS(' ', nombre, apellido_paterno, apellido_materno))
                FROM participantes WHERE id=?
                """, (row, index) -> row.getString(1), id);
        return names.isEmpty() ? "Participante" : names.get(0);
    }

    private static Object primero(List<Map<String, Object>> rows) {
        return rows.isEmpty() ? null : rows.get(0);
    }

    private static String texto(Object value) {
        return value == null ? "" : value.toString().trim();
    }
}
