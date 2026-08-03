package mx.uacj.congreso;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import mx.uacj.congreso.service.AuthService;
import mx.uacj.congreso.dto.LoginRequest;
import mx.uacj.congreso.dto.RegistroRequest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
        "debug=false",
        "logging.level.root=WARN",
        "logging.level.org.springframework.jdbc.core=WARN"
})
class GestionParticipantesApplicationTests {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private AuthService authService;

    @Test
    void cargaContexto() {
    }

    @Test
    @Transactional
    void participanteSinCredencialesNoRecibePasswordPredeterminado() {
        String id = UUID.randomUUID().toString();
        String email = "sin.credenciales." + System.nanoTime() + "@example.test";
        jdbc.update("""
                INSERT INTO participantes
                  (id, nombre, apellido_paterno, correo, categoria, requiere_carta_invitacion)
                VALUES (?, 'Usuario', 'Sin credenciales', ?, 'Estudiante', FALSE)
                """, id, email);
        assertFalse(authService.login(new LoginRequest(email, "123456")).isPresent());
    }

    @Test
    @Transactional
    void registroCreaParticipanteYPermiteIniciarSesion() {
        String email = "registro." + System.nanoTime() + "@example.test";
        authService.registrar(new RegistroRequest(
                "Prueba", "Registro", null, email, null, "México",
                "Institución de prueba", "Estudiante", "MiPassword789"));
        assertTrue(authService.login(new LoginRequest(email, "MiPassword789")).isPresent());
        assertFalse(authService.login(new LoginRequest(email, "123456")).isPresent());
    }
}
