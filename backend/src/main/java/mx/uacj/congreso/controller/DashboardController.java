package mx.uacj.congreso.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final JdbcTemplate jdbc;

    public DashboardController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/stats")
    public Map<String, Object> estadisticas() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("participantes", contar("participantes"));
        response.put("trabajos", contar("trabajos"));
        response.put("documentos", contar("documentos"));

        List<Map<String, Object>> categorias = jdbc.queryForList(
                "SELECT categoria, COUNT(*) total FROM participantes GROUP BY categoria ORDER BY categoria");
        response.put("por_categoria", categorias);
        return response;
    }

    private Long contar(String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
    }
}

