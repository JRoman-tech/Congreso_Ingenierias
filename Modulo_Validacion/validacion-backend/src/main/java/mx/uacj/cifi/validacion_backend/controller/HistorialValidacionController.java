package mx.uacj.cifi.validacion_backend.controller;

import mx.uacj.cifi.validacion_backend.model.HistorialValidacion;
import mx.uacj.cifi.validacion_backend.repository.HistorialValidacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/historial")
public class HistorialValidacionController {

    @Autowired
    private HistorialValidacionRepository historialValidacionRepository;

    @GetMapping("/validacion/{idValidacion}")
    public List<HistorialValidacion> listarPorValidacion(@PathVariable Long idValidacion) {
        return historialValidacionRepository.findByIdValidacionOrderByFechaDesc(idValidacion);
    }

    @PostMapping
    public HistorialValidacion guardar(@RequestBody HistorialValidacion historial) {
        return historialValidacionRepository.save(historial);
    }
}