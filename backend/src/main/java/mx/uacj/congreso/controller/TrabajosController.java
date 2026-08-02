package mx.uacj.congreso.controller;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import mx.uacj.congreso.dto.EstadoRequest;
import mx.uacj.congreso.dto.TrabajoRequest;
import mx.uacj.congreso.service.ActivityService;

@RestController
@RequestMapping("/api/trabajos")
public class TrabajosController {

    private static final List<String> MODALIDADES = List.of(
            "presencial", "virtual", "grabado");
    private static final List<String> ESTADOS = List.of(
            "pendiente", "en_revision", "aceptado", "rechazado");

    private final JdbcTemplate jdbc;
    private final ActivityService activity;
    private final Path uploadDirectory;

    public TrabajosController(
            JdbcTemplate jdbc,
            ActivityService activity,
            @Value("${app.upload-dir}") String uploadDirectory) {
        this.jdbc = jdbc;
        this.activity = activity;
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize()
                .resolve("trabajos");
    }

    @GetMapping
    public Map<String, Object> listar(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String modalidad,
            @RequestParam(defaultValue = "") String estado,
            @RequestParam(name = "participante_id", defaultValue = "") String participanteId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        page = Math.max(1, page);
        limit = Math.max(1, Math.min(1000, limit));
        int offset = (page - 1) * limit;
        List<String> conditions = new ArrayList<>();
        List<Object> parameters = new ArrayList<>();

        if (!search.isBlank()) {
            conditions.add("(t.titulo LIKE ? OR t.folio LIKE ? OR CONCAT(p.nombre, ' ', p.apellido_paterno) LIKE ?)");
            String value = "%" + search.trim() + "%";
            parameters.add(value);
            parameters.add(value);
            parameters.add(value);
        }
        if (!modalidad.isBlank()) {
            conditions.add("t.modalidad = ?");
            parameters.add(modalidad);
        }
        if (!estado.isBlank()) {
            conditions.add("t.estado = ?");
            parameters.add(estado);
        }
        if (!participanteId.isBlank()) {
            conditions.add("t.participante_id = ?");
            parameters.add(participanteId);
        }

        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);
        List<Object> pageParameters = new ArrayList<>(parameters);
        pageParameters.add(limit);
        pageParameters.add(offset);
        String from = """
                FROM trabajos t
                JOIN participantes p ON p.id = t.participante_id
                """;

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT t.*, CONCAT(p.nombre, ' ', p.apellido_paterno) autor_principal "
                        + from + where + " ORDER BY t.fecha_registro DESC LIMIT ? OFFSET ?",
                pageParameters.toArray());
        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) " + from + where,
                Long.class,
                parameters.toArray());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", rows);
        response.put("total", total);
        response.put("page", page);
        response.put("limit", limit);
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtener(@PathVariable String id) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT t.*, CONCAT(p.nombre, ' ', p.apellido_paterno) autor_principal
                FROM trabajos t
                JOIN participantes p ON p.id = t.participante_id
                WHERE t.id = ?
                """, id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> crear(
            @RequestParam("participante_id") String participanteId,
            @RequestParam String titulo,
            @RequestParam(defaultValue = "") String resumen,
            @RequestParam("eje_tematico") String ejeTematico,
            @RequestParam(name = "palabras_clave", defaultValue = "") String palabrasClave,
            @RequestParam(defaultValue = "presencial") String modalidad,
            @RequestParam(name = "usuario_id", required = false) String usuarioId,
            @RequestParam MultipartFile archivo) throws IOException {
        String error = validar(participanteId, titulo, ejeTematico, modalidad);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        error = validarPdf(archivo);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));

        String id = UUID.randomUUID().toString();
        Integer next = jdbc.queryForObject(
                "SELECT COALESCE(MAX(CAST(SUBSTRING(folio, 3) AS UNSIGNED)), 0) + 1 FROM trabajos",
                Integer.class);
        String folio = String.format("T-%03d", next);
        Files.createDirectories(uploadDirectory);
        String storedName = UUID.randomUUID() + ".pdf";
        Path target = uploadDirectory.resolve(storedName);
        archivo.transferTo(target);
        String fileRoute = "/uploads/trabajos/" + storedName;

        try {
            jdbc.update("""
                    INSERT INTO trabajos
                    (id, folio, participante_id, titulo, resumen, eje_tematico,
                     palabras_clave, modalidad, nombre_archivo, ruta_archivo, tamano_bytes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    id, folio, participanteId, titulo, resumen, ejeTematico,
                    palabrasClave, modalidad, archivo.getOriginalFilename(),
                    fileRoute, archivo.getSize());
            asociarAPagoAgrupadoExistente(participanteId, id);
        } catch (RuntimeException exception) {
            Files.deleteIfExists(target);
            throw exception;
        }

        String actorId = texto(usuarioId);
        String detailRoute = "/dashboard/trabajos/" + id + "?mode=view";
        activity.registrar(
                actorId, participanteId, "trabajo_enviado", "Trabajo enviado",
                folio + " · " + texto(titulo), "trabajo", id, detailRoute);
        if (actorId.equals(activity.usuarioDeParticipante(participanteId))) {
            activity.notificarAdministradores(
                    "trabajo_enviado", "Nuevo trabajo por revisar",
                    folio + " · " + texto(titulo), "/dashboard/validacion/" + id);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", id, "folio", folio, "message", "Trabajo registrado"));
    }

    private void asociarAPagoAgrupadoExistente(String participanteId, String trabajoId) {
        String modalidadPago = jdbc.queryForObject(
                "SELECT modalidad FROM configuracion_pagos WHERE id = 1", String.class);
        if (!"agrupado".equals(modalidadPago)) return;
        List<String> pagos = jdbc.queryForList("""
                SELECT id FROM comprobantes_pago
                WHERE participante_id = ? AND modalidad = 'agrupado'
                ORDER BY fecha_carga DESC LIMIT 1
                """, String.class, participanteId);
        if (!pagos.isEmpty()) {
            jdbc.update("""
                    INSERT IGNORE INTO comprobante_trabajos (comprobante_id, trabajo_id)
                    VALUES (?, ?)
                    """, pagos.get(0), trabajoId);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizar(
            @PathVariable String id,
            @Valid @RequestBody TrabajoRequest body) {
        String error = validar(body.participante_id(), body.titulo(), body.eje_tematico(), body.modalidad());
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        List<String> currentParticipants = jdbc.queryForList(
                "SELECT participante_id FROM trabajos WHERE id = ?", String.class, id);
        if (currentParticipants.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
        }
        if (!currentParticipants.get(0).equals(texto(body.participante_id()))) {
            Integer payments = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM comprobante_trabajos WHERE trabajo_id = ?",
                    Integer.class, id);
            if (payments != null && payments > 0) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "No se puede cambiar el autor de un trabajo con pago asociado"));
            }
        }
        jdbc.update("""
                UPDATE trabajos SET participante_id=?, titulo=?, resumen=?, eje_tematico=?,
                palabras_clave=?, modalidad=?, estado='pendiente' WHERE id=?
                """,
                body.participante_id(), body.titulo(), body.resumen(), body.eje_tematico(),
                body.palabras_clave(), body.modalidad(), id);
        String participantId = texto(body.participante_id());
        String actorId = texto(body.usuario_id());
        if (actorId.equals(activity.usuarioDeParticipante(participantId))) {
            activity.registrar(
                    actorId, participantId, "trabajo_actualizado", "Trabajo actualizado",
                    texto(body.titulo()), "trabajo", id,
                    "/dashboard/trabajos/" + id + "?mode=view");
            activity.notificarAdministradores(
                    "trabajo_actualizado", "Trabajo actualizado por revisar",
                    texto(body.titulo()), "/dashboard/validacion/" + id);
        }
        return ResponseEntity.ok(Map.of("message", "Trabajo actualizado"));
    }

    @PutMapping(value = "/{id}/archivo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> reemplazarArchivo(
            @PathVariable String id,
            @RequestParam MultipartFile archivo) throws IOException {
        String error = validarPdf(archivo);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT ruta_archivo FROM trabajos WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
        }
        Files.createDirectories(uploadDirectory);
        String storedName = UUID.randomUUID() + ".pdf";
        Path target = uploadDirectory.resolve(storedName);
        archivo.transferTo(target);
        String fileRoute = "/uploads/trabajos/" + storedName;
        try {
            jdbc.update("""
                    UPDATE trabajos
                    SET nombre_archivo=?, ruta_archivo=?, tamano_bytes=?, estado='pendiente'
                    WHERE id=?
                    """, archivo.getOriginalFilename(), fileRoute, archivo.getSize(), id);
        } catch (RuntimeException exception) {
            Files.deleteIfExists(target);
            throw exception;
        }
        eliminarArchivoGuardado(rows.get(0).get("ruta_archivo"));
        return ResponseEntity.ok(Map.of(
                "message", "PDF actualizado", "ruta_archivo", fileRoute, "estado", "pendiente"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminar(@PathVariable String id) {
        Integer payments = jdbc.queryForObject(
                "SELECT COUNT(*) FROM comprobante_trabajos WHERE trabajo_id = ?",
                Integer.class, id);
        if (payments != null && payments > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El trabajo tiene un comprobante de pago asociado"));
        }
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT ruta_archivo FROM trabajos WHERE id = ?", id);
        int affected = jdbc.update("DELETE FROM trabajos WHERE id = ?", id);
        if (affected == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
        }
        try {
            eliminarArchivoGuardado(rows.get(0).get("ruta_archivo"));
        } catch (IOException ignored) {
            // El registro ya fue eliminado; un archivo huérfano puede limpiarse después.
        }
        return ResponseEntity.ok(Map.of("message", "Trabajo eliminado"));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Map<String, Object>> actualizarEstado(
            @PathVariable String id,
            @Valid @RequestBody EstadoRequest body) {
        String estado = texto(body.estado());
        if (!ESTADOS.contains(estado)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado no válido"));
        }
        List<Map<String, Object>> current = jdbc.queryForList(
                "SELECT participante_id, titulo, folio, estado FROM trabajos WHERE id = ?", id);
        if (current.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
        }
        jdbc.update("UPDATE trabajos SET estado = ? WHERE id = ?", estado, id);
        Map<String, Object> work = current.get(0);
        if (!work.get("estado").toString().equals(estado)) {
            String participantId = work.get("participante_id").toString();
            String label = etiquetaEstado(estado);
            activity.registrar(
                    body.usuarioIdSeguro(), participantId, "estado_trabajo", "Estado de trabajo",
                    work.get("folio") + " cambió a " + label,
                    "trabajo", id, "/dashboard/validacion/" + id);
            activity.notificarParticipante(
                    participantId, "estado_trabajo", "Estado de trabajo actualizado",
                    work.get("folio") + " · " + work.get("titulo") + ": " + label,
                    "/dashboard/trabajos/" + id + "?mode=view");
        }
        return ResponseEntity.ok(Map.of("message", "Estado actualizado", "estado", estado));
    }

    private String validar(String participantValue, String titleValue, String topicValue, String modeValue) {
        String participantId = texto(participantValue);
        String title = texto(titleValue);
        String topic = texto(topicValue);
        String mode = texto(modeValue);
        if (participantId.isBlank()) return "El autor principal es obligatorio";
        if (title.isBlank()) return "El título es obligatorio";
        if (title.length() > 300) return "El título no puede exceder 300 caracteres";
        if (topic.isBlank()) return "El eje temático es obligatorio";
        if (!MODALIDADES.contains(mode)) return "La modalidad no es válida";
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM participantes WHERE id = ?", Integer.class, participantId);
        return count == null || count == 0 ? "El participante no existe" : null;
    }

    private String validarPdf(MultipartFile archivo) throws IOException {
        if (archivo == null || archivo.isEmpty()) return "Selecciona el trabajo en formato PDF";
        if (!".pdf".equals(extension(archivo.getOriginalFilename()))) {
            return "El trabajo debe ser un archivo PDF";
        }
        try (InputStream input = archivo.getInputStream()) {
            byte[] signature = input.readNBytes(5);
            if (signature.length < 5
                    || signature[0] != '%' || signature[1] != 'P' || signature[2] != 'D'
                    || signature[3] != 'F' || signature[4] != '-') {
                return "El archivo seleccionado no es un PDF válido";
            }
        }
        return null;
    }

    private void eliminarArchivoGuardado(Object routeValue) throws IOException {
        if (routeValue == null) return;
        String filename = Paths.get(routeValue.toString()).getFileName().toString();
        Files.deleteIfExists(uploadDirectory.resolve(filename));
    }

    private static String extension(String filename) {
        if (filename == null) return "";
        int index = filename.lastIndexOf('.');
        return index < 0 ? "" : filename.substring(index).toLowerCase();
    }

    private static String texto(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private static String etiquetaEstado(String estado) {
        return switch (estado) {
            case "en_revision" -> "En revisión";
            case "aceptado" -> "Aceptado";
            case "rechazado" -> "Rechazado";
            default -> "Pendiente";
        };
    }
}
