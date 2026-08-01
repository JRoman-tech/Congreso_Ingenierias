package mx.uacj.congreso.controller;

import java.io.IOException;
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
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
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

import mx.uacj.congreso.service.ActivityService;
import jakarta.validation.Valid;
import mx.uacj.congreso.dto.EstadoRequest;

@RestController
@RequestMapping("/api/participantes/{participanteId}/pagos")
public class PagosController {

    private static final List<String> MODALIDADES = List.of("individual", "agrupado");
    private static final List<String> ESTADOS = List.of(
            "pendiente", "en_revision", "validado", "rechazado");
    private static final List<String> EXTENSIONES = List.of(".pdf", ".jpg", ".jpeg", ".png");

    private final JdbcTemplate jdbc;
    private final Path uploadDirectory;
    private final ActivityService activity;

    public PagosController(
            JdbcTemplate jdbc,
            @Value("${app.upload-dir}") String uploadDirectory,
            ActivityService activity) {
        this.jdbc = jdbc;
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        this.activity = activity;
    }

    @GetMapping
    public ResponseEntity<?> listar(@PathVariable String participanteId) {
        if (!participanteExiste(participanteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM comprobantes_pago WHERE participante_id = ? ORDER BY fecha_carga DESC",
                participanteId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> payment = new LinkedHashMap<>(row);
            payment.put("trabajos", jdbc.queryForList("""
                    SELECT t.id, t.folio, t.titulo
                    FROM comprobante_trabajos ct
                    JOIN trabajos t ON t.id = ct.trabajo_id
                    WHERE ct.comprobante_id = ?
                    ORDER BY t.folio
                    """, row.get("id")));
            result.add(payment);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> subir(
            @PathVariable String participanteId,
            @RequestParam MultipartFile archivo,
            @RequestParam String modalidad,
            @RequestParam(name = "trabajo_ids") List<String> trabajoIds,
            @RequestParam(name = "usuario_id", required = false) String usuarioId) throws IOException {

        if (!participanteExiste(participanteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }
        List<String> selectedIds = trabajoIds.stream()
                .map(String::trim).filter(value -> !value.isBlank()).distinct().toList();
        if (!MODALIDADES.contains(modalidad)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Modalidad de pago no válida"));
        }
        if (selectedIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Selecciona al menos un trabajo"));
        }
        if ("individual".equals(modalidad) && selectedIds.size() != 1) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El pago individual debe cubrir exactamente un trabajo"));
        }
        String pendingDocument = primerDocumentoSinAprobar(participanteId);
        if (pendingDocument != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Primero debe aprobarse " + etiquetaDocumento(pendingDocument)));
        }

        String placeholders = String.join(",", selectedIds.stream().map(id -> "?").toList());
        List<Object> ownershipParameters = new ArrayList<>();
        ownershipParameters.add(participanteId);
        ownershipParameters.addAll(selectedIds);
        Integer owned = jdbc.queryForObject(
                "SELECT COUNT(*) FROM trabajos WHERE participante_id = ? AND id IN (" + placeholders + ")",
                Integer.class, ownershipParameters.toArray());
        if (owned == null || owned != selectedIds.size()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Uno o más trabajos no pertenecen al participante"));
        }
        Integer covered = jdbc.queryForObject(
                "SELECT COUNT(*) FROM comprobante_trabajos WHERE trabajo_id IN (" + placeholders + ")",
                Integer.class, selectedIds.toArray());
        if (covered != null && covered > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Uno o más trabajos ya tienen un comprobante asociado"));
        }

        String extension = extension(archivo.getOriginalFilename());
        if (archivo.isEmpty() || !EXTENSIONES.contains(extension)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Solo se permiten archivos PDF, JPG y PNG"));
        }

        Files.createDirectories(uploadDirectory);
        String storedName = UUID.randomUUID() + extension;
        Path destination = uploadDirectory.resolve(storedName);
        archivo.transferTo(destination);
        String paymentId = UUID.randomUUID().toString();

        try {
            jdbc.update("""
                    INSERT INTO comprobantes_pago
                      (id, participante_id, modalidad, nombre_archivo, ruta_archivo, tamano_bytes)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, paymentId, participanteId, modalidad, archivo.getOriginalFilename(),
                    "/uploads/" + storedName, archivo.getSize());
            for (String workId : selectedIds) {
                jdbc.update("""
                        INSERT INTO comprobante_trabajos (comprobante_id, trabajo_id)
                        VALUES (?, ?)
                        """, paymentId, workId);
            }

            String actorId = usuarioId == null || usuarioId.isBlank()
                    ? activity.usuarioDeParticipante(participanteId)
                    : usuarioId;
            String description = ("individual".equals(modalidad) ? "Pago individual" : "Pago agrupado")
                    + " para " + selectedIds.size() + (selectedIds.size() == 1 ? " trabajo" : " trabajos");
            String route = "/dashboard/documentos/" + participanteId;
            activity.registrar(actorId, participanteId, "pago_subido", "Comprobante de pago subido",
                    description, "pago", paymentId, route);
            if (activity.esParticipante(actorId)) {
                activity.notificarAdministradores("pago_subido", "Pago por revisar",
                        nombreParticipante(participanteId) + " subió un comprobante", route);
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Comprobante guardado", "id", paymentId));
        } catch (RuntimeException exception) {
            Files.deleteIfExists(destination);
            throw exception;
        }
    }

    @DeleteMapping("/{pagoId}")
    public ResponseEntity<Map<String, Object>> eliminar(
            @PathVariable String participanteId,
            @PathVariable String pagoId) throws IOException {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT ruta_archivo FROM comprobantes_pago
                WHERE id = ? AND participante_id = ?
                """, pagoId, participanteId);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Comprobante no encontrado"));
        }
        jdbc.update("DELETE FROM comprobantes_pago WHERE id = ? AND participante_id = ?",
                pagoId, participanteId);
        deleteStoredFile(rows.get(0).get("ruta_archivo"));
        return ResponseEntity.ok(Map.of("message", "Comprobante eliminado"));
    }

    @PutMapping("/{pagoId}/estado")
    public ResponseEntity<Map<String, Object>> actualizarEstado(
            @PathVariable String participanteId,
            @PathVariable String pagoId,
            @Valid @RequestBody EstadoRequest body) {
        String estado = body.estado().trim();
        if (!ESTADOS.contains(estado)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado no válido"));
        }
        List<String> current = jdbc.queryForList("""
                SELECT estado FROM comprobantes_pago
                WHERE id = ? AND participante_id = ?
                """, String.class, pagoId, participanteId);
        if (current.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Comprobante no encontrado"));
        }
        jdbc.update("""
                UPDATE comprobantes_pago SET estado = ?
                WHERE id = ? AND participante_id = ?
                """, estado, pagoId, participanteId);
        if (!current.get(0).equals(estado)) {
            String actorId = body.usuarioIdSeguro();
            String label = etiquetaEstado(estado);
            activity.registrar(actorId, participanteId, "estado_pago", "Estado de pago actualizado",
                    "El comprobante cambió a " + label, "pago", pagoId,
                    "/dashboard/documentos/" + participanteId);
            activity.notificarParticipante(participanteId, "estado_pago", "Estado de pago actualizado",
                    "Tu comprobante de pago fue marcado como " + label, "/dashboard/documentos");
        }
        return ResponseEntity.ok(Map.of("message", "Estado actualizado", "estado", estado));
    }

    private String primerDocumentoSinAprobar(String participanteId) {
        List<String> required = new ArrayList<>();
        required.add("resumen_trabajo");
        List<Map<String, Object>> config = jdbc.queryForList("""
                SELECT carta_autorizacion, trabajo_completo
                FROM requisitos_documentos WHERE participante_id = ?
                """, participanteId);
        if (!config.isEmpty()) {
            if (verdadero(config.get(0).get("carta_autorizacion"))) required.add("carta_autorizacion");
            if (verdadero(config.get(0).get("trabajo_completo"))) required.add("trabajo_completo");
        }
        for (String type : required) {
            Integer count = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM documentos
                    WHERE participante_id = ? AND tipo_documento = ? AND estado = 'validado'
                    """, Integer.class, participanteId, type);
            if (count == null || count == 0) return type;
        }
        return null;
    }

    private boolean participanteExiste(String participanteId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM participantes WHERE id = ?", Integer.class, participanteId);
        return count != null && count > 0;
    }

    private String nombreParticipante(String participanteId) {
        return jdbc.queryForObject(
                "SELECT CONCAT(nombre, ' ', apellido_paterno) FROM participantes WHERE id = ?",
                String.class, participanteId);
    }

    private void deleteStoredFile(Object routeValue) throws IOException {
        if (routeValue == null) return;
        String filename = Paths.get(routeValue.toString()).getFileName().toString();
        Files.deleteIfExists(uploadDirectory.resolve(filename));
    }

    private static boolean verdadero(Object value) {
        return Boolean.TRUE.equals(value) || "true".equalsIgnoreCase(String.valueOf(value))
                || "1".equals(String.valueOf(value));
    }

    private static String etiquetaDocumento(String type) {
        return switch (type) {
            case "carta_autorizacion" -> "la carta de autorización";
            case "trabajo_completo" -> "el trabajo completo";
            default -> "el resumen del trabajo";
        };
    }

    private static String etiquetaEstado(String estado) {
        return switch (estado) {
            case "validado" -> "Aceptado";
            case "en_revision" -> "En revisión";
            case "rechazado" -> "Rechazado";
            default -> "Pendiente";
        };
    }

    private static String extension(String filename) {
        if (filename == null) return "";
        int index = filename.lastIndexOf('.');
        return index < 0 ? "" : filename.substring(index).toLowerCase();
    }
}
