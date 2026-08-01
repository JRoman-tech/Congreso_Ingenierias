package mx.uacj.cifi.validacion_backend.controller;

import mx.uacj.cifi.validacion_backend.model.Validacion;
import mx.uacj.cifi.validacion_backend.model.HistorialValidacion;
import mx.uacj.cifi.validacion_backend.repository.ValidacionRepository;
import mx.uacj.cifi.validacion_backend.repository.HistorialValidacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/validacion")
public class ValidacionController {

    @Autowired
    private ValidacionRepository validacionRepository;

    @Autowired
    private HistorialValidacionRepository historialValidacionRepository;

    @Autowired
    private mx.uacj.cifi.validacion_backend.repository.UsuarioRepository usuarioRepository;

    @GetMapping("/con-nombre")
    public List<java.util.Map<String, Object>> listarConNombre() {
        List<Validacion> validaciones = validacionRepository.findAll();
        List<java.util.Map<String, Object>> resultado = new java.util.ArrayList<>();

        for (Validacion v : validaciones) {
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", v.getId());
            item.put("idParticipante", v.getIdParticipante());
            item.put("estado", v.getEstado());
            item.put("creadoEn", v.getCreadoEn());
            item.put("actualizadoEn", v.getActualizadoEn());

            // Buscar nombre del usuario
            mx.uacj.cifi.validacion_backend.model.Usuario usuario =
                    usuarioRepository.findById(v.getIdParticipante()).orElse(null);
            item.put("nombre", usuario != null ? usuario.getNombre() : "Sin nombre");
            item.put("correo", usuario != null ? usuario.getCorreo() : "");

            resultado.add(item);
        }
        return resultado;
    }
    private void guardarHistorial(Long idValidacion, String estadoAnterior, String estadoNuevo, String comentario) {
        HistorialValidacion h = new HistorialValidacion();
        h.setIdValidacion(idValidacion);
        h.setEstadoAnterior(estadoAnterior);
        h.setEstadoNuevo(estadoNuevo);
        h.setComentario(comentario);
        h.setRealizadoPor("Admin");
        h.setFecha(LocalDateTime.now().toString());
        historialValidacionRepository.save(h);
    }

    @GetMapping
    public List<Validacion> listar() {
        return validacionRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Validacion> buscarPorId(@PathVariable Long id) {
        Optional<Validacion> validacion = validacionRepository.findById(id);
        return validacion.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Validacion guardar(@RequestBody Validacion validacion) {
        return validacionRepository.save(validacion);
    }

    @PutMapping("/{id}/aprobar-academico")
    public ResponseEntity<Validacion> aprobarAcademico(@PathVariable Long id) {
        Optional<Validacion> optional = validacionRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        Validacion v = optional.get();
        String anterior = v.getEstado().name();
        v.setEstado(Validacion.EstadoValidacion.aprobado_academico);
        v.setActualizadoEn(LocalDateTime.now().toString());
        validacionRepository.save(v);
        guardarHistorial(id, anterior, "aprobado_academico", "Datos académicos aprobados");
        return ResponseEntity.ok(v);
    }

    @PutMapping("/{id}/rechazar-academico")
    public ResponseEntity<Validacion> rechazarAcademico(@PathVariable Long id) {
        Optional<Validacion> optional = validacionRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        Validacion v = optional.get();
        String anterior = v.getEstado().name();
        v.setEstado(Validacion.EstadoValidacion.rechazado_academico);
        v.setActualizadoEn(LocalDateTime.now().toString());
        validacionRepository.save(v);
        guardarHistorial(id, anterior, "rechazado_academico", "Datos académicos rechazados");
        return ResponseEntity.ok(v);
    }

    @PutMapping("/{id}/pago-recibido")
    public ResponseEntity<Validacion> pagoRecibido(@PathVariable Long id) {
        Optional<Validacion> optional = validacionRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        Validacion v = optional.get();
        String anterior = v.getEstado().name();
        v.setEstado(Validacion.EstadoValidacion.validado_completo);
        v.setActualizadoEn(LocalDateTime.now().toString());
        validacionRepository.save(v);
        guardarHistorial(id, anterior, "validado_completo", "Pago verificado — participante validado completamente");
        return ResponseEntity.ok(v);
    }

    @PutMapping("/{id}/pago-no-recibido")
    public ResponseEntity<Validacion> pagoNoRecibido(@PathVariable Long id) {
        Optional<Validacion> optional = validacionRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        Validacion v = optional.get();
        String anterior = v.getEstado().name();
        v.setEstado(Validacion.EstadoValidacion.pago_no_recibido);
        v.setActualizadoEn(LocalDateTime.now().toString());
        validacionRepository.save(v);
        guardarHistorial(id, anterior, "pago_no_recibido", "Pago no recibido");
        return ResponseEntity.ok(v);
    }

    @PutMapping("/{id}/en-correccion")
    public ResponseEntity<Validacion> enCorreccion(@PathVariable Long id) {
        Optional<Validacion> optional = validacionRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        Validacion v = optional.get();
        String anterior = v.getEstado().name();
        v.setEstado(Validacion.EstadoValidacion.en_correccion_academico);
        v.setActualizadoEn(LocalDateTime.now().toString());
        validacionRepository.save(v);
        guardarHistorial(id, anterior, "en_correccion_academico", "Participante envió corrección");
        return ResponseEntity.ok(v);


    }
}