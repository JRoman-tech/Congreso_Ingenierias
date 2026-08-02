package mx.uacj.congreso.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
import mx.uacj.congreso.service.ActivityService;
import jakarta.validation.Valid;
import mx.uacj.congreso.dto.ConfiguracionDocumentosRequest;
import mx.uacj.congreso.dto.EstadoRequest;

@RestController
@RequestMapping("/api/participantes/{participanteId}/documentos")
public class DocumentosController {

    private static final List<String> TIPOS = List.of(
            "resumen_trabajo", "trabajo_completo", "carta_autorizacion");
    private static final List<String> EXTENSIONES = List.of(
            ".pdf", ".jpg", ".jpeg", ".png");
    private static final List<String> ESTADOS = List.of(
            "pendiente", "en_revision", "validado", "rechazado");

    private final JdbcTemplate jdbc;
    private final Path uploadDirectory;
    private final ActivityService activity;

    public DocumentosController(
            JdbcTemplate jdbc,
            @Value("${app.upload-dir}") String uploadDirectory,
            ActivityService activity) {
        this.jdbc = jdbc;
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        this.activity = activity;
    }

    @GetMapping
    public List<Map<String, Object>> listar(@PathVariable String participanteId) {
        return jdbc.queryForList(
                "SELECT * FROM documentos WHERE participante_id = ? ORDER BY fecha_carga DESC",
                participanteId);
    }

    @GetMapping("/configuracion")
    public ResponseEntity<Map<String, Object>> obtenerConfiguracion(
            @PathVariable String participanteId) {
        if (!participanteExiste(participanteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT carta_autorizacion, trabajo_completo
                FROM requisitos_documentos WHERE participante_id = ?
                """, participanteId);
        if (rows.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "carta_autorizacion", false,
                    "trabajo_completo", false));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PutMapping("/configuracion")
    public ResponseEntity<Map<String, Object>> guardarConfiguracion(
            @PathVariable String participanteId,
            @Valid @RequestBody ConfiguracionDocumentosRequest body) {
        if (!participanteExiste(participanteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }
        boolean carta = body.carta_autorizacion();
        boolean trabajo = body.trabajo_completo();
        jdbc.update("""
                INSERT INTO requisitos_documentos
                  (participante_id, carta_autorizacion, trabajo_completo)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  carta_autorizacion = VALUES(carta_autorizacion),
                  trabajo_completo = VALUES(trabajo_completo)
                """, participanteId, carta, trabajo);

        String actorId = body.usuarioIdSeguro();
        activity.registrar(
                actorId, participanteId, "requisitos_documentos",
                "Requisitos de documentos actualizados",
                "Carta de autorización: " + (carta ? "solicitada" : "no solicitada")
                        + " · Trabajo completo: " + (trabajo ? "solicitado" : "no solicitado"),
                "participante", participanteId,
                "/dashboard/documentos/" + participanteId);
        activity.notificarParticipante(
                participanteId, "requisitos_documentos",
                "Documentos solicitados actualizados",
                "El administrador actualizó los documentos que debes presentar",
                "/dashboard/documentos");
        return ResponseEntity.ok(Map.of(
                "message", "Configuración actualizada",
                "carta_autorizacion", carta,
                "trabajo_completo", trabajo));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> subir(
            @PathVariable String participanteId,
            @RequestParam MultipartFile archivo,
            @RequestParam("tipo_documento") String tipoDocumento,
            @RequestParam(name = "usuario_id", required = false) String usuarioId) throws IOException {

        if (!participanteExiste(participanteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }
        if (!TIPOS.contains(tipoDocumento)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo de documento no válido"));
        }
        if (esOpcional(tipoDocumento) && !documentoHabilitado(participanteId, tipoDocumento)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Este documento no fue solicitado al participante"));
        }
        String requisitoAnterior = requisitoAnterior(participanteId, tipoDocumento);
        if (requisitoAnterior != null
                && !documentoAprobado(participanteId, requisitoAnterior)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "Primero debe aprobarse " + etiquetaTipo(requisitoAnterior)));
        }

        String extension = extension(archivo.getOriginalFilename());
        if (archivo.isEmpty() || !EXTENSIONES.contains(extension)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Solo se permiten archivos PDF, JPG y PNG"));
        }

        Files.createDirectories(uploadDirectory);
        String storedName = UUID.randomUUID() + extension;
        archivo.transferTo(uploadDirectory.resolve(storedName));
        String route = "/uploads/" + storedName;

        List<Map<String, Object>> previous = jdbc.queryForList(
                "SELECT ruta_archivo FROM documentos WHERE participante_id = ? AND tipo_documento = ?",
                participanteId,
                tipoDocumento);
        boolean reemplazo = !previous.isEmpty();
        if (!previous.isEmpty()) {
            deleteStoredFile(previous.get(0).get("ruta_archivo"));
        }

        jdbc.update("""
                INSERT INTO documentos
                (participante_id, tipo_documento, nombre_archivo, ruta_archivo, tamano_bytes)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  nombre_archivo=VALUES(nombre_archivo),
                  ruta_archivo=VALUES(ruta_archivo),
                  tamano_bytes=VALUES(tamano_bytes),
                  estado='pendiente',
                  fecha_carga=CURRENT_TIMESTAMP
                """,
                participanteId, tipoDocumento, archivo.getOriginalFilename(),
                route, archivo.getSize());

        String actorId = usuarioId == null || usuarioId.isBlank()
                ? activity.usuarioDeParticipante(participanteId)
                : usuarioId;
        String action = reemplazo ? "reemplazó" : "subió";
        String adminRoute = "/dashboard/documentos/" + participanteId;
        activity.registrar(
                actorId, participanteId, "documento_subido",
                "Documento " + (reemplazo ? "reemplazado" : "subido"),
                action + " " + etiquetaTipo(tipoDocumento) + ": " + archivo.getOriginalFilename(),
                "documento", tipoDocumento, adminRoute);
        if (activity.esParticipante(actorId)) {
            activity.notificarAdministradores(
                    "documento_subido", "Documento por revisar",
                    nombreParticipante(participanteId) + " " + action + " " + etiquetaTipo(tipoDocumento),
                    adminRoute);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Documento guardado", "ruta", route));
    }

    @DeleteMapping("/{tipoDocumento}")
    public ResponseEntity<Map<String, Object>> eliminar(
            @PathVariable String participanteId,
            @PathVariable String tipoDocumento) throws IOException {

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT ruta_archivo FROM documentos WHERE participante_id = ? AND tipo_documento = ?",
                participanteId,
                tipoDocumento);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Documento no encontrado"));
        }
        if (tieneDocumentosPosteriores(participanteId, tipoDocumento)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "No puedes eliminar este documento mientras existan documentos posteriores"));
        }

        deleteStoredFile(rows.get(0).get("ruta_archivo"));
        jdbc.update(
                "DELETE FROM documentos WHERE participante_id = ? AND tipo_documento = ?",
                participanteId,
                tipoDocumento);
        return ResponseEntity.ok(Map.of("message", "Documento eliminado"));
    }

    @PutMapping("/{tipoDocumento}/estado")
    public ResponseEntity<Map<String, Object>> actualizarEstado(
            @PathVariable String participanteId,
            @PathVariable String tipoDocumento,
            @Valid @RequestBody EstadoRequest body) {

        String estado = body.estado().trim();
        if (!ESTADOS.contains(estado)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Estado no válido"));
        }
        List<Map<String, Object>> current = jdbc.queryForList(
                "SELECT estado FROM documentos WHERE participante_id = ? AND tipo_documento = ?",
                participanteId, tipoDocumento);
        if (current.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Documento no encontrado"));
        }
        if (!"validado".equals(estado)
                && "validado".equals(current.get(0).get("estado").toString())
                && tieneDocumentosPosteriores(participanteId, tipoDocumento)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            "No puedes quitar la aprobación mientras existan documentos o pagos posteriores"));
        }
        int affected = jdbc.update(
                "UPDATE documentos SET estado = ? WHERE participante_id = ? AND tipo_documento = ?",
                estado, participanteId, tipoDocumento);
        if (affected == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Documento no encontrado"));
        }
        if (!current.get(0).get("estado").toString().equals(estado)) {
            String actorId = body.usuarioIdSeguro();
            String label = etiquetaEstado(estado);
            activity.registrar(
                    actorId, participanteId, "estado_documento",
                    "Documento " + label.toLowerCase(),
                    etiquetaTipo(tipoDocumento) + " cambió a " + label,
                    "documento", tipoDocumento,
                    "/dashboard/documentos/" + participanteId);
            activity.notificarParticipante(
                    participanteId, "estado_documento",
                    "Estado de documento actualizado",
                    "Tu " + etiquetaTipo(tipoDocumento) + " fue marcado como " + label,
                    "/dashboard/documentos");
        }
        return ResponseEntity.ok(Map.of("message", "Estado actualizado", "estado", estado));
    }

    private boolean participanteExiste(String participanteId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM participantes WHERE id = ?",
                Integer.class,
                participanteId);
        return count != null && count > 0;
    }

    private String nombreParticipante(String participanteId) {
        return jdbc.queryForObject(
                "SELECT CONCAT(nombre, ' ', apellido_paterno) FROM participantes WHERE id = ?",
                String.class, participanteId);
    }

    private boolean documentoHabilitado(String participanteId, String tipoDocumento) {
        String column = "carta_autorizacion".equals(tipoDocumento)
                ? "carta_autorizacion"
                : "trabajo_completo";
        List<Boolean> values = jdbc.queryForList(
                "SELECT " + column + " FROM requisitos_documentos WHERE participante_id = ?",
                Boolean.class, participanteId);
        return !values.isEmpty() && Boolean.TRUE.equals(values.get(0));
    }

    private String requisitoAnterior(String participanteId, String tipoDocumento) {
        List<String> sequence = secuenciaHabilitada(participanteId);
        int index = sequence.indexOf(tipoDocumento);
        return index > 0 ? sequence.get(index - 1) : null;
    }

    private boolean tieneDocumentosPosteriores(
            String participanteId,
            String tipoDocumento) {
        List<String> sequence = secuenciaHabilitada(participanteId);
        int index = sequence.indexOf(tipoDocumento);
        if (index < 0) return false;
        for (int next = index + 1; next < sequence.size(); next++) {
            if (documentoExiste(participanteId, sequence.get(next))) return true;
        }
        Integer payments = jdbc.queryForObject(
                "SELECT COUNT(*) FROM comprobantes_pago WHERE participante_id = ?",
                Integer.class, participanteId);
        return payments != null && payments > 0;
    }

    private List<String> secuenciaHabilitada(String participanteId) {
        List<String> sequence = new ArrayList<>();
        sequence.add("resumen_trabajo");
        if (documentoHabilitado(participanteId, "carta_autorizacion")) {
            sequence.add("carta_autorizacion");
        }
        if (documentoHabilitado(participanteId, "trabajo_completo")) {
            sequence.add("trabajo_completo");
        }
        return sequence;
    }

    private boolean documentoExiste(String participanteId, String tipoDocumento) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM documentos WHERE participante_id = ? AND tipo_documento = ?",
                Integer.class, participanteId, tipoDocumento);
        return count != null && count > 0;
    }

    private boolean documentoAprobado(String participanteId, String tipoDocumento) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM documentos
                WHERE participante_id = ? AND tipo_documento = ? AND estado = 'validado'
                """, Integer.class, participanteId, tipoDocumento);
        return count != null && count > 0;
    }

    private static boolean esOpcional(String tipoDocumento) {
        return "carta_autorizacion".equals(tipoDocumento)
                || "trabajo_completo".equals(tipoDocumento);
    }

    private static boolean verdadero(Object value) {
        return Boolean.TRUE.equals(value) || "true".equalsIgnoreCase(String.valueOf(value));
    }

    private static String etiquetaTipo(String tipo) {
        return switch (tipo) {
            case "comprobante_pago" -> "el comprobante de pago";
            case "resumen_trabajo" -> "el resumen del trabajo";
            case "trabajo_completo" -> "el trabajo completo";
            case "carta_autorizacion" -> "la carta de autorización";
            default -> "un documento";
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

    private void deleteStoredFile(Object routeValue) throws IOException {
        if (routeValue == null) return;
        String filename = Paths.get(routeValue.toString()).getFileName().toString();
        Files.deleteIfExists(uploadDirectory.resolve(filename));
    }

    private static String extension(String filename) {
        if (filename == null) return "";
        int index = filename.lastIndexOf('.');
        return index < 0 ? "" : filename.substring(index).toLowerCase();
    }
}
