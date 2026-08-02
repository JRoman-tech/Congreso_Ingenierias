package mx.uacj.congreso.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mx.uacj.congreso.dto.LoginRequest;
import mx.uacj.congreso.dto.RegistroRequest;
import mx.uacj.congreso.dto.SesionUsuarioResponse;

@Service
public class AuthService {

    private final JdbcTemplate jdbc;
    private final SesionService sesionService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(JdbcTemplate jdbc, SesionService sesionService) {
        this.jdbc = jdbc;
        this.sesionService = sesionService;
    }

    @Transactional
    public Optional<SesionUsuarioResponse> login(LoginRequest request) {
        sesionService.listarOpciones();
        List<java.util.Map<String, Object>> credentials = jdbc.queryForList("""
                SELECT u.id, u.password_hash
                FROM usuarios u
                LEFT JOIN participantes p ON p.id = u.participante_id
                WHERE u.activo = TRUE
                  AND LOWER(CASE WHEN u.rol = 'participante' THEN p.correo ELSE u.correo END)
                      = LOWER(?)
                LIMIT 1
                """, request.correo().trim());
        if (credentials.isEmpty()) return Optional.empty();
        Object hash = credentials.get(0).get("password_hash");
        if (hash == null || !passwordEncoder.matches(request.password(), hash.toString())) {
            return Optional.empty();
        }
        return sesionService.obtener(credentials.get(0).get("id").toString());
    }

    @Transactional
    public SesionUsuarioResponse registrar(RegistroRequest request) {
        String participantId = UUID.randomUUID().toString();
        String userId = UUID.randomUUID().toString();
        String category = request.categoria() == null || request.categoria().isBlank()
                ? "Estudiante" : request.categoria();
        String fullName = String.join(" ",
                request.nombre().trim(), request.apellido_paterno().trim(),
                request.apellido_materno() == null ? "" : request.apellido_materno().trim()).trim();

        jdbc.update("""
                INSERT INTO participantes
                  (id, nombre, apellido_paterno, apellido_materno, correo, telefono,
                   pais, institucion, categoria, requiere_carta_invitacion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
                """, participantId, request.nombre().trim(), request.apellido_paterno().trim(),
                request.apellido_materno(), request.correo().trim(), request.telefono(),
                request.pais(), request.institucion(), category);
        jdbc.update("""
                INSERT INTO usuarios
                  (id, participante_id, nombre, correo, rol, password_hash, activo)
                VALUES (?, ?, ?, ?, 'participante', ?, TRUE)
                """, userId, participantId, fullName,
                "sesion." + participantId.replace("-", "") + "@example.test",
                passwordEncoder.encode(request.password()));
        jdbc.update("INSERT INTO validaciones (participante_id) VALUES (?)", participantId);
        return sesionService.obtener(userId).orElseThrow();
    }
}
