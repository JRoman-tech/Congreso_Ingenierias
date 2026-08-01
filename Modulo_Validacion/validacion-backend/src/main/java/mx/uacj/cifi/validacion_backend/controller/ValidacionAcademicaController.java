package mx.uacj.cifi.validacion_backend.controller;

import mx.uacj.cifi.validacion_backend.model.ValidacionAcademica;
import mx.uacj.cifi.validacion_backend.repository.ValidacionAcademicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/validacion-academica")
public class ValidacionAcademicaController {

    @Autowired
    private ValidacionAcademicaRepository validacionAcademicaRepository;

    @GetMapping
    public List<ValidacionAcademica> listar() {
        return validacionAcademicaRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<ValidacionAcademica> buscarPorId(@PathVariable Long id) {
        return validacionAcademicaRepository.findById(id);
    }

    // Buscar por id de validacion (el que usa el frontend)
    @GetMapping("/validacion/{idValidacion}")
    public ValidacionAcademica buscarPorValidacion(@PathVariable Long idValidacion) {
        return validacionAcademicaRepository.findByIdValidacion(idValidacion);
    }

    @PostMapping
    public ValidacionAcademica guardar(@RequestBody ValidacionAcademica validacionAcademica) {
        return validacionAcademicaRepository.save(validacionAcademica);
    }

    @PutMapping("/{id}")
    public ValidacionAcademica actualizar(@PathVariable Long id, @RequestBody ValidacionAcademica datos) {
        datos.setId(id);
        return validacionAcademicaRepository.save(datos);
    }
}