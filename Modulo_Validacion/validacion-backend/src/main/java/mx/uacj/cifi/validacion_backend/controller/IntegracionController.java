package mx.uacj.cifi.validacion_backend.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import mx.uacj.cifi.validacion_backend.model.Usuario;
import mx.uacj.cifi.validacion_backend.model.Validacion;
import mx.uacj.cifi.validacion_backend.repository.UsuarioRepository;
import mx.uacj.cifi.validacion_backend.repository.ValidacionRepository;

@RestController
@RequestMapping("/api/integracion")
public class IntegracionController {

    private final UsuarioRepository usuarioRepository;
    private final ValidacionRepository validacionRepository;
    private final RestClient gestionApi;

    public IntegracionController(
            UsuarioRepository usuarioRepository,
            ValidacionRepository validacionRepository,
            @Value("${gestion.api.base-url}") String gestionApiBaseUrl) {
        this.usuarioRepository = usuarioRepository;
        this.validacionRepository = validacionRepository;
        this.gestionApi = RestClient.create(gestionApiBaseUrl);
    }

    @PostMapping("/sesion/{sesionId}")
    public ResponseEntity<?> sincronizarSesion(@PathVariable String sesionId) {
        try {
            SesionGestion sesion = gestionApi.get()
                    .uri("/api/sesion/{id}", sesionId)
                    .retrieve()
                    .body(SesionGestion.class);

            if (sesion == null || sesion.correo() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Sesión no válida"));
            }

            Usuario usuario = usuarioRepository.findByCorreo(sesion.correo());
            if (usuario == null) {
                usuario = new Usuario();
                usuario.setCorreo(sesion.correo());
                usuario.setPassword(UUID.randomUUID().toString());
                usuario.setCreadoEn(LocalDateTime.now().toString());
            }
            usuario.setNombre(sesion.nombre());
            usuario.setActivo(true);
            usuario.setRol("administrador".equals(sesion.rol())
                    ? Usuario.Rol.admin : Usuario.Rol.participante);
            usuario = usuarioRepository.save(usuario);

            Long usuarioId = usuario.getId();
            if (usuario.getRol() == Usuario.Rol.participante
                    && validacionRepository.findAll().stream()
                            .noneMatch(v -> usuarioId.equals(v.getIdParticipante()))) {
                Validacion validacion = new Validacion();
                validacion.setIdParticipante(usuarioId);
                validacion.setEstado(Validacion.EstadoValidacion.pendiente_academico);
                validacion.setCreadoEn(LocalDateTime.now().toString());
                validacion.setActualizadoEn(LocalDateTime.now().toString());
                validacionRepository.save(validacion);
            }

            return ResponseEntity.ok(new UsuarioIntegrado(
                    usuario.getId(), usuario.getNombre(), usuario.getCorreo(),
                    usuario.getRol().name()));
        } catch (Exception error) {
            return ResponseEntity.status(503)
                    .body(Map.of("error", "No se pudo verificar la sesión del módulo principal"));
        }
    }

    private record SesionGestion(
            String id, String nombre, String correo, String rol,
            String participante_id, String categoria, String institucion) {}

    private record UsuarioIntegrado(Long id, String nombre, String correo, String rol) {}
}
