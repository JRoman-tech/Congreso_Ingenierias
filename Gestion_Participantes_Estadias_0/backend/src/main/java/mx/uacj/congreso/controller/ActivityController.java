package mx.uacj.congreso.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import mx.uacj.congreso.service.ActivityService;

@RestController
@RequestMapping("/api")
public class ActivityController {

    private final ActivityService activity;

    public ActivityController(ActivityService activity) {
        this.activity = activity;
    }

    @GetMapping("/actividad")
    public List<Map<String, Object>> historial(
            @RequestParam(defaultValue = "50") int limit) {
        return activity.historial(limit);
    }

    @GetMapping("/notificaciones/usuario/{usuarioId}")
    public List<Map<String, Object>> notificaciones(
            @PathVariable String usuarioId,
            @RequestParam(defaultValue = "30") int limit) {
        return activity.notificaciones(usuarioId, limit);
    }

    @PutMapping("/notificaciones/{id}/leer")
    public ResponseEntity<Map<String, Object>> marcarLeida(
            @PathVariable long id,
            @RequestParam String usuarioId) {
        if (activity.marcarLeida(id, usuarioId) == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Notificación no encontrada"));
        }
        return ResponseEntity.ok(Map.of("message", "Notificación leída"));
    }

    @PutMapping("/notificaciones/usuario/{usuarioId}/leer-todas")
    public Map<String, Object> marcarTodas(@PathVariable String usuarioId) {
        int total = activity.marcarTodasLeidas(usuarioId);
        return Map.of("message", "Notificaciones leídas", "total", total);
    }
}
