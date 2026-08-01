package mx.uacj.congreso.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
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
import jakarta.validation.Valid;
import mx.uacj.congreso.dto.ParticipanteRequest;

@RestController
@RequestMapping("/api/participantes")
public class ParticipantesController {

    private final JdbcTemplate jdbc;

    public ParticipantesController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public Map<String, Object> listar(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String categoria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        page = Math.max(1, page);
        limit = Math.max(1, Math.min(1000, limit));
        int offset = (page - 1) * limit;
        List<String> conditions = new ArrayList<>();
        List<Object> parameters = new ArrayList<>();

        if (!search.isBlank()) {
            conditions.add("(nombre LIKE ? OR apellido_paterno LIKE ? OR correo LIKE ?)");
            String value = "%" + search.trim() + "%";
            parameters.add(value);
            parameters.add(value);
            parameters.add(value);
        }
        if (!categoria.isBlank()) {
            conditions.add("categoria = ?");
            parameters.add(categoria);
        }

        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);
        List<Object> paginatedParameters = new ArrayList<>(parameters);
        paginatedParameters.add(limit);
        paginatedParameters.add(offset);

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM participantes" + where
                        + " ORDER BY fecha_registro DESC LIMIT ? OFFSET ?",
                paginatedParameters.toArray());
        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM participantes" + where,
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
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM participantes WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@Valid @RequestBody ParticipanteRequest body) {
        String id = UUID.randomUUID().toString();
        try {
            jdbc.update("""
                    INSERT INTO participantes
                    (id, nombre, apellido_paterno, apellido_materno, correo, telefono,
                     pais, institucion, categoria, requiere_carta_invitacion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    id, body.nombre(), body.apellido_paterno(),
                    body.apellido_materno(), body.correo(), body.telefono(),
                    body.pais(), body.institucion(), body.categoria(),
                    body.requiere_carta_invitacion());
        } catch (DuplicateKeyException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El correo ya está registrado"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", id, "message", "Participante registrado"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> actualizar(
            @PathVariable String id,
            @Valid @RequestBody ParticipanteRequest body) {

        try {
            int affected = jdbc.update("""
                    UPDATE participantes SET nombre=?, apellido_paterno=?, apellido_materno=?,
                    correo=?, telefono=?, pais=?, institucion=?, categoria=?,
                    requiere_carta_invitacion=? WHERE id=?
                    """,
                    body.nombre(), body.apellido_paterno(), body.apellido_materno(),
                    body.correo(), body.telefono(), body.pais(),
                    body.institucion(), body.categoria(),
                    body.requiere_carta_invitacion(), id);
            if (affected == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Participante no encontrado"));
            }
        } catch (DuplicateKeyException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El correo ya está registrado"));
        }
        return ResponseEntity.ok(Map.of("message", "Participante actualizado"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminar(@PathVariable String id) {
        try {
            int affected = jdbc.update("DELETE FROM participantes WHERE id = ?", id);
            if (affected == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Participante no encontrado"));
            }
        } catch (DataIntegrityViolationException exception) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El participante tiene trabajos registrados"));
        }
        return ResponseEntity.ok(Map.of("message", "Participante eliminado"));
    }

}
