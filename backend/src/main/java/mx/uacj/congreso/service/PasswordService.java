package mx.uacj.congreso.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordService {

    public enum Resultado { ACTUALIZADA, USUARIO_NO_ENCONTRADO, PASSWORD_INCORRECTO, SIN_PERMISO }

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public PasswordService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public Resultado cambiarPropia(String usuarioId, String passwordActual, String passwordNuevo) {
        List<String> hashes = jdbc.queryForList(
                "SELECT password_hash FROM usuarios WHERE id = ? AND activo = TRUE LIMIT 1",
                String.class, usuarioId.trim());
        if (hashes.isEmpty()) return Resultado.USUARIO_NO_ENCONTRADO;
        if (!encoder.matches(passwordActual, hashes.get(0))) return Resultado.PASSWORD_INCORRECTO;
        jdbc.update("UPDATE usuarios SET password_hash = ? WHERE id = ?",
                encoder.encode(passwordNuevo), usuarioId.trim());
        return Resultado.ACTUALIZADA;
    }

    @Transactional
    public Resultado restablecerComoAdministrador(
            String administradorId, String participanteId, String passwordNuevo) {
        Integer administradores = jdbc.queryForObject("""
                SELECT COUNT(*) FROM usuarios
                WHERE id = ? AND rol = 'administrador' AND activo = TRUE
                """, Integer.class, administradorId.trim());
        if (administradores == null || administradores == 0) return Resultado.SIN_PERMISO;
        int actualizados = jdbc.update("""
                UPDATE usuarios SET password_hash = ?
                WHERE participante_id = ? AND rol = 'participante' AND activo = TRUE
                """, encoder.encode(passwordNuevo), participanteId.trim());
        return actualizados == 0 ? Resultado.USUARIO_NO_ENCONTRADO : Resultado.ACTUALIZADA;
    }
}
