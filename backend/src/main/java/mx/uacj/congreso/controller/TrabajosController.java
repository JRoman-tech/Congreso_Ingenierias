package mx.uacj.congreso.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
import mx.uacj.congreso.service.ActivityService;
import jakarta.validation.Valid;
import mx.uacj.congreso.dto.EstadoRequest;
import mx.uacj.congreso.dto.TrabajoRequest;

@RestController
@RequestMapping("/api/trabajos")
public class TrabajosController {

    private static final List<String> MODALIDADES = List.of(
            "presencial", "virtual", "grabado");
    private static final List<String> ESTADOS = List.of(
            "pendiente", "en_revision", "aceptado", "rechazado");

    private final JdbcTemplate jdbc;
    private final ActivityService activity;

    public TrabajosController(JdbcTemplate jdbc, ActivityService activity) {
        this.jdbc = jdbc;
        this.activity = activity;
    }

    @GetMapping
    public Map<String, Object> listar(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String modalidad,
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
                LEFT JOIN documentos dr
                  ON dr.participante_id = t.participante_id
                 AND dr.tipo_documento = 'resumen_trabajo'
                LEFT JOIN comprobante_trabajos ct ON ct.trabajo_id = t.id
                LEFT JOIN comprobantes_pago cp ON cp.id = ct.comprobante_id
                """;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT t.*, CONCAT(p.nombre, ' ', p.apellido_paterno) autor_principal, "
                        + "dr.id resumen_documento_id, "
                        + "COALESCE(dr.estado, 'pendiente') estado_resumen, "
                        + "cp.id comprobante_pago_id, "
                        + "COALESCE(cp.estado, 'pendiente') estado_pago "
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

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody TrabajoRequest body) {
        String error = validar(body);
        if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));

        String id = UUID.randomUUID().toString();
        Integer next = jdbc.queryForObject(
                "SELECT COALESCE(MAX(CAST(SUBSTRING(folio, 3) AS UNSIGNED)), 0) + 1 FROM trabajos",
                Integer.class);
        String folio = String.format("T-%03d", next);
        jdbc.update("""
                INSERT INTO trabajos
                (id, folio, participante_id, titulo, resumen, eje_tematico,
                 palabras_clave, modalidad)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id, folio, body.participante_id(), body.titulo(),
                body.resumen(), body.eje_tematico(),
                body.palabras_clave(), body.modalidad());
        String participantId = texto(body.participante_id());
        String actorId = texto(body.usuario_id());
        String route = "/dashboard/trabajos/" + id + "?mode=view";
        activity.registrar(
                actorId, participantId, "trabajo_enviado", "Trabajo enviado",
                folio + " · " + texto(body.titulo()),
                "trabajo", id, route);
        if (actorId.equals(activity.usuarioDeParticipante(participantId))) {
            activity.notificarAdministradores(
                    "trabajo_enviado", "Nuevo trabajo por revisar",
                    folio + " · " + texto(body.titulo()), route);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", id, "folio", folio, "message", "Trabajo registrado"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizar(
            @PathVariable String id,
            @Valid @RequestBody TrabajoRequest body) {

        String error = validar(body);
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
        int affected = jdbc.update("""
                UPDATE trabajos SET participante_id=?, titulo=?, resumen=?, eje_tematico=?,
                palabras_clave=?, modalidad=? WHERE id=?
                """,
                body.participante_id(), body.titulo(), body.resumen(),
                body.eje_tematico(), body.palabras_clave(),
                body.modalidad(), id);
        if (affected == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
        }
        String participantId = texto(body.participante_id());
        String actorId = texto(body.usuario_id());
        if (actorId.equals(activity.usuarioDeParticipante(participantId))) {
            String route = "/dashboard/trabajos/" + id + "?mode=view";
            activity.registrar(
                    actorId, participantId, "trabajo_actualizado", "Trabajo actualizado",
                    texto(body.titulo()), "trabajo", id, route);
            activity.notificarAdministradores(
                    "trabajo_actualizado", "Trabajo actualizado por revisar",
                    texto(body.titulo()), route);
        }
        return ResponseEntity.ok(Map.of("message", "Trabajo actualizado"));
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
        int affected = jdbc.update("DELETE FROM trabajos WHERE id = ?", id);
        if (affected == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
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
        int affected = jdbc.update("UPDATE trabajos SET estado = ? WHERE id = ?", estado, id);
        if (affected == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Trabajo no encontrado"));
        }
        Map<String, Object> work = current.get(0);
        if (!work.get("estado").toString().equals(estado)) {
            String participantId = work.get("participante_id").toString();
            String actorId = body.usuarioIdSeguro();
            String label = etiquetaEstado(estado);
            activity.registrar(
                    actorId, participantId, "estado_trabajo", "Estado de trabajo",
                    work.get("folio") + " cambió a " + label,
                    "trabajo", id, "/dashboard/trabajos/" + id + "?mode=view");
            activity.notificarParticipante(
                    participantId, "estado_trabajo", "Estado de trabajo actualizado",
                    work.get("folio") + " · " + work.get("titulo") + ": " + label,
                    "/dashboard/trabajos/" + id + "?mode=view");
        }
        return ResponseEntity.ok(Map.of("message", "Estado actualizado", "estado", estado));
    }

    private String validar(TrabajoRequest body) {
        String participantId = texto(body.participante_id());
        String title = texto(body.titulo());
        String topic = texto(body.eje_tematico());
        String mode = texto(body.modalidad());

        if (participantId.isBlank()) return "El autor principal es obligatorio";
        if (title.isBlank()) return "El título es obligatorio";
        if (topic.isBlank()) return "El eje temático es obligatorio";
        if (!MODALIDADES.contains(mode)) return "La modalidad no es válida";

        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM participantes WHERE id = ?",
                Integer.class,
                participantId);
        return count == null || count == 0 ? "El participante no existe" : null;
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
