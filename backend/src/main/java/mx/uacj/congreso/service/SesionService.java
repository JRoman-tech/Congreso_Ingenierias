package mx.uacj.congreso.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import mx.uacj.congreso.dto.SesionUsuarioResponse;

@Service
public class SesionService {

    private static final String SELECT_SESSION = """
            SELECT u.id,
                   CASE WHEN u.rol = 'participante'
                        THEN TRIM(CONCAT_WS(' ', p.nombre, p.apellido_paterno, p.apellido_materno))
                        ELSE u.nombre END nombre,
                   CASE WHEN u.rol = 'participante' THEN p.correo ELSE u.correo END correo,
                   u.rol, u.participante_id, p.categoria, p.institucion
            FROM usuarios u
            LEFT JOIN participantes p ON p.id = u.participante_id
            """;

    private final JdbcTemplate jdbc;
    public SesionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<SesionUsuarioResponse> obtener(String usuarioId) {
        List<SesionUsuarioResponse> rows = jdbc.query(
                SELECT_SESSION + "WHERE u.id = ? AND u.activo = TRUE",
                (result, row) -> mapear(result), usuarioId);
        return rows.stream().findFirst();
    }

    private static SesionUsuarioResponse mapear(ResultSet result) throws SQLException {
        return new SesionUsuarioResponse(
                result.getString("id"), result.getString("nombre"), result.getString("correo"),
                result.getString("rol"), result.getString("participante_id"),
                result.getString("categoria"), result.getString("institucion"));
    }
}
