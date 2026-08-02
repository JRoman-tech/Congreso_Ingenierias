package mx.uacj.congreso.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracion/pagos")
public class ConfiguracionPagosController {

    private final JdbcTemplate jdbc;

    public ConfiguracionPagosController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public Map<String, Object> obtener() {
        return jdbc.queryForMap("""
                SELECT modalidad, fecha_actualizacion
                FROM configuracion_pagos WHERE id = 1
                """);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> actualizar(@RequestBody Map<String, String> body) {
        String modalidad = body.getOrDefault("modalidad", "").trim();
        String usuarioId = body.getOrDefault("usuario_id", "").trim();
        if (!"individual".equals(modalidad) && !"agrupado".equals(modalidad)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Modalidad de pago no válida"));
        }
        Integer administradores = jdbc.queryForObject("""
                SELECT COUNT(*) FROM usuarios
                WHERE id = ? AND rol = 'administrador' AND activo = TRUE
                """, Integer.class, usuarioId);
        if (administradores == null || administradores == 0) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Solo el administrador puede cambiar esta opción"));
        }

        String actual = jdbc.queryForObject(
                "SELECT modalidad FROM configuracion_pagos WHERE id = 1", String.class);
        if (!modalidad.equals(actual)) {
            Integer pagos = jdbc.queryForObject("SELECT COUNT(*) FROM comprobantes_pago", Integer.class);
            if (pagos != null && pagos > 0) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "Elimina los comprobantes existentes antes de cambiar la modalidad global"));
            }
            jdbc.update("UPDATE configuracion_pagos SET modalidad = ? WHERE id = 1", modalidad);
        }
        return ResponseEntity.ok(Map.of("modalidad", modalidad));
    }
}
