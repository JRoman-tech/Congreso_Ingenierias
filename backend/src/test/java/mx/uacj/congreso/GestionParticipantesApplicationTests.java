package mx.uacj.congreso;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import mx.uacj.congreso.service.SesionService;
import mx.uacj.congreso.service.AuthService;
import mx.uacj.congreso.dto.LoginRequest;
import mx.uacj.congreso.dto.RegistroRequest;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
class GestionParticipantesApplicationTests {

    @Autowired
    private SesionService sesionService;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private AuthService authService;

    @Test
    void cargaContexto() {
    }

    @Test
    void ofreceSesionParaTodosLosParticipantesRegistrados() {
        Long participants = jdbc.queryForObject("SELECT COUNT(*) FROM participantes", Long.class);
        long participantSessions = sesionService.listarOpciones().stream()
                .filter(user -> "participante".equals(user.rol()))
                .count();
        assertEquals(participants == null ? 0 : participants, participantSessions);
    }

    @Test
    void participantePuedeIngresarConPasswordGenerico() {
        String email = jdbc.queryForObject("SELECT correo FROM participantes LIMIT 1", String.class);
        assertTrue(authService.login(new LoginRequest(email, "123456")).isPresent());
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
