package mx.uacj.cifi.validacion_backend.controller;

import mx.uacj.cifi.validacion_backend.model.Usuario;
import mx.uacj.cifi.validacion_backend.model.Validacion;
import mx.uacj.cifi.validacion_backend.repository.UsuarioRepository;
import mx.uacj.cifi.validacion_backend.repository.ValidacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ValidacionRepository validacionRepository;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioRepository.findAll();
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario loginData) {
        Usuario usuario = usuarioRepository.findByCorreo(loginData.getCorreo());
        if (usuario == null || !usuario.getPassword().equals(loginData.getPassword())) {
            return ResponseEntity.status(401).body("Correo o contraseña incorrectos");
        }
        return ResponseEntity.ok(usuario);
    }

    // Registro de participante
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Usuario nuevoUsuario) {
        // Verificar si el correo ya existe
        Usuario existente = usuarioRepository.findByCorreo(nuevoUsuario.getCorreo());
        if (existente != null) {
            return ResponseEntity.status(400).body("El correo ya está registrado");
        }

        // Guardar usuario como participante
        nuevoUsuario.setRol(Usuario.Rol.participante);
        nuevoUsuario.setActivo(true);
        nuevoUsuario.setCreadoEn(java.time.LocalDateTime.now().toString());
        Usuario guardado = usuarioRepository.save(nuevoUsuario);

        // Crear validacion inicial automaticamente
        Validacion validacion = new Validacion();
        validacion.setIdParticipante(guardado.getId());
        validacion.setEstado(Validacion.EstadoValidacion.pendiente_academico);
        validacion.setCreadoEn(java.time.LocalDateTime.now().toString());
        validacion.setActualizadoEn(java.time.LocalDateTime.now().toString());
        validacionRepository.save(validacion);

        return ResponseEntity.ok(guardado);
    }

    // Crear usuario (admin)
    @PostMapping
    public Usuario crear(@RequestBody Usuario usuario) {
        return usuarioRepository.save(usuario);
    }
}