package mx.uacj.congreso.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import mx.uacj.congreso.dto.AcademicaRequest;

@RestController
@RequestMapping("/api/participantes/{participanteId}/academica")
public class AcademicaController {

    private final JdbcTemplate jdbc;

    public AcademicaController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> obtener(@PathVariable String participanteId) {
        if (!participanteExiste(participanteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM informacion_academica WHERE participante_id = ?",
                participanteId);
        Map<String, Object> response = rows.isEmpty()
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(rows.get(0));
        response.put("areas_interes", jdbc.queryForList(
                "SELECT area FROM areas_interes WHERE participante_id = ? ORDER BY area",
                String.class,
                participanteId));
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> guardar(
            @PathVariable String participanteId,
            @Valid @RequestBody AcademicaRequest body) {

        if (!participanteExiste(participanteId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        }

        jdbc.update("""
                INSERT INTO informacion_academica
                (participante_id, grado_maximo_estudios, institucion_academica,
                 pais_academico, anio_egreso, area_estudio, semblanza)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  grado_maximo_estudios=VALUES(grado_maximo_estudios),
                  institucion_academica=VALUES(institucion_academica),
                  pais_academico=VALUES(pais_academico),
                  anio_egreso=VALUES(anio_egreso),
                  area_estudio=VALUES(area_estudio),
                  semblanza=VALUES(semblanza)
                """,
                participanteId, body.grado_maximo_estudios(),
                body.institucion_academica(), body.pais_academico(),
                body.anio_egreso(), body.area_estudio(), body.semblanza());

        jdbc.update("DELETE FROM areas_interes WHERE participante_id = ?", participanteId);
        if (body.areas_interes() != null) {
            for (String area : body.areas_interes()) {
                String text = area == null ? "" : area.trim();
                if (!text.isBlank()) {
                    jdbc.update(
                            "INSERT INTO areas_interes (participante_id, area) VALUES (?, ?)",
                            participanteId,
                            text);
                }
            }
        }
        return ResponseEntity.ok(Map.of("message", "Información académica guardada"));
    }

    private boolean participanteExiste(String participanteId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM participantes WHERE id = ?",
                Integer.class,
                participanteId);
        return count != null && count > 0;
    }

}
