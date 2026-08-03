package mx.uacj.congreso.config;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbc;
    private final String email;
    private final String password;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AdminInitializer(
            JdbcTemplate jdbc,
            @Value("${ADMIN_EMAIL:admin@cifi.mx}") String email,
            @Value("${ADMIN_PASSWORD:}") String password) {
        this.jdbc = jdbc;
        this.email = email.trim();
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> administrators = jdbc.queryForList(
                "SELECT id FROM usuarios WHERE rol = 'administrador' LIMIT 1", String.class);
        if (administrators.isEmpty()) {
            if (password.isBlank()) {
                throw new IllegalStateException(
                        "ADMIN_PASSWORD es obligatorio para crear el administrador inicial");
            }
            jdbc.update("""
                    INSERT INTO usuarios
                      (id, participante_id, nombre, correo, rol, password_hash, activo)
                    VALUES (?, NULL, 'Administrador del congreso', ?, 'administrador', ?, TRUE)
                    """, UUID.randomUUID().toString(), email, encoder.encode(password));
        } else {
            jdbc.update("""
                    UPDATE usuarios SET correo = ?, activo = TRUE
                    WHERE id = ?
                    """, email, administrators.get(0));
        }
    }
}
