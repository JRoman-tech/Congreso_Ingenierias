package mx.uacj.congreso.service;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {

    private final JdbcTemplate jdbc;

    public ActivityService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void registrar(
            String actorUsuarioId,
            String participanteId,
            String tipo,
            String titulo,
            String descripcion,
            String entidadTipo,
            String entidadId,
            String ruta) {

        jdbc.update("""
                INSERT INTO actividad
                (actor_usuario_id, actor_nombre, participante_id, tipo, titulo,
                 descripcion, entidad_tipo, entidad_id, ruta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                vacioANulo(actorUsuarioId),
                nombreActor(actorUsuarioId, participanteId),
                vacioANulo(participanteId),
                tipo, titulo, descripcion, entidadTipo,
                vacioANulo(entidadId), ruta);
    }

    public void notificarAdministradores(
            String tipo, String titulo, String mensaje, String ruta) {
        jdbc.update("""
                INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, ruta)
                SELECT id, ?, ?, ?, ? FROM usuarios
                WHERE rol = 'administrador' AND activo = TRUE
                """, tipo, titulo, mensaje, ruta);
    }

    public void notificarParticipante(
            String participanteId,
            String tipo,
            String titulo,
            String mensaje,
            String ruta) {
        jdbc.update("""
                INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, ruta)
                SELECT id, ?, ?, ?, ? FROM usuarios
                WHERE participante_id = ? AND activo = TRUE
                """, tipo, titulo, mensaje, ruta, participanteId);
    }

    public List<Map<String, Object>> historial(int limit) {
        return jdbc.queryForList("""
                SELECT id, actor_usuario_id, actor_nombre, participante_id, tipo,
                       titulo, descripcion, entidad_tipo, entidad_id, ruta, fecha
                FROM actividad ORDER BY fecha DESC, id DESC LIMIT ?
                """, Math.max(1, Math.min(limit, 200)));
    }

    public List<Map<String, Object>> notificaciones(String usuarioId, int limit) {
        return jdbc.queryForList("""
                SELECT id, usuario_id, tipo, titulo, mensaje, ruta, leida, fecha
                FROM notificaciones WHERE usuario_id = ?
                ORDER BY fecha DESC, id DESC LIMIT ?
                """, usuarioId, Math.max(1, Math.min(limit, 100)));
    }

    public int marcarLeida(long id, String usuarioId) {
        return jdbc.update(
                "UPDATE notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?",
                id, usuarioId);
    }

    public int marcarTodasLeidas(String usuarioId) {
        return jdbc.update(
                "UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ? AND leida = FALSE",
                usuarioId);
    }

    public String usuarioDeParticipante(String participanteId) {
        List<String> ids = jdbc.queryForList(
                "SELECT id FROM usuarios WHERE participante_id = ? AND activo = TRUE LIMIT 1",
                String.class,
                participanteId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public boolean esParticipante(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) return false;
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE id = ? AND rol = 'participante' AND activo = TRUE",
                Integer.class, usuarioId);
        return count != null && count > 0;
    }

    private String nombreActor(String usuarioId, String participanteId) {
        if (usuarioId != null && !usuarioId.isBlank()) {
            List<String> names = jdbc.queryForList(
                    "SELECT nombre FROM usuarios WHERE id = ? LIMIT 1",
                    String.class,
                    usuarioId);
            if (!names.isEmpty()) return names.get(0);
        }
        if (participanteId != null && !participanteId.isBlank()) {
            List<String> names = jdbc.queryForList("""
                    SELECT CONCAT(nombre, ' ', apellido_paterno)
                    FROM participantes WHERE id = ? LIMIT 1
                    """, String.class, participanteId);
            if (!names.isEmpty()) return names.get(0);
        }
        return "Sistema";
    }

    private static String vacioANulo(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
