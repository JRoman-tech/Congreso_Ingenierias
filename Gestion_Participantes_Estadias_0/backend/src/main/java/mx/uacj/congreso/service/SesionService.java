package mx.uacj.congreso.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import mx.uacj.congreso.dto.SesionUsuarioResponse;

@Service
public class SesionService {

    private static final String SELECT_SESSION = """
            SELECT u.id, u.nombre,
                   CASE WHEN u.rol = 'participante' THEN p.correo ELSE u.correo END correo,
                   u.rol, u.participante_id, p.categoria, p.institucion
            FROM usuarios u
            LEFT JOIN participantes p ON p.id = u.participante_id
            """;

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public SesionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public List<SesionUsuarioResponse> listarOpciones() {
        sincronizarParticipantes();
        return jdbc.query(
                SELECT_SESSION + """
                        WHERE u.activo = TRUE
                        ORDER BY CASE WHEN u.rol = 'administrador' THEN 0 ELSE 1 END,
                                 u.nombre
                        """,
                (result, row) -> mapear(result));
    }

    @Transactional
    public Optional<SesionUsuarioResponse> obtener(String usuarioId) {
        sincronizarParticipantes();
        List<SesionUsuarioResponse> rows = jdbc.query(
                SELECT_SESSION + "WHERE u.id = ? AND u.activo = TRUE",
                (result, row) -> mapear(result), usuarioId);
        return rows.stream().findFirst();
    }

    private void sincronizarParticipantes() {
        String genericPassword = passwordEncoder.encode("123456");
        jdbc.update("""
                UPDATE usuarios u
                JOIN participantes p ON p.id = u.participante_id
                SET u.nombre = TRIM(CONCAT_WS(' ', p.nombre, p.apellido_paterno, p.apellido_materno)),
                    u.activo = TRUE
                WHERE u.rol = 'participante'
                """);
        jdbc.update("""
                INSERT INTO usuarios
                  (id, participante_id, nombre, correo, rol, password_hash, activo)
                SELECT UUID(), p.id,
                       TRIM(CONCAT_WS(' ', p.nombre, p.apellido_paterno, p.apellido_materno)),
                       CONCAT('sesion.', REPLACE(p.id, '-', ''), '@example.test'),
                       'participante', ?, TRUE
                FROM participantes p
                WHERE NOT EXISTS (
                  SELECT 1 FROM usuarios u WHERE u.participante_id = p.id
                )
                """, genericPassword);
        jdbc.update("UPDATE usuarios SET password_hash = ? WHERE password_hash IS NULL OR password_hash = ''",
                genericPassword);
    }

    private static SesionUsuarioResponse mapear(ResultSet result) throws SQLException {
        return new SesionUsuarioResponse(
                result.getString("id"), result.getString("nombre"), result.getString("correo"),
                result.getString("rol"), result.getString("participante_id"),
                result.getString("categoria"), result.getString("institucion"));
    }
}
