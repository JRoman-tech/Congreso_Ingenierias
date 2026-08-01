package mx.uacj.cifi.validacion_backend.controller;

import mx.uacj.cifi.validacion_backend.model.ValidacionPago;
import mx.uacj.cifi.validacion_backend.repository.ValidacionPagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/validacion-pago")
public class ValidacionPagoController {

    @Autowired
    private ValidacionPagoRepository validacionPagoRepository;

    // Listar todos
    @GetMapping
    public List<ValidacionPago> listar() {
        return validacionPagoRepository.findAll();
    }

    // Buscar por id
    @GetMapping("/{id}")
    public Optional<ValidacionPago> buscarPorId(@PathVariable Long id) {
        return validacionPagoRepository.findById(id);
    }

    // Buscar por id de validacion
    @GetMapping("/validacion/{idValidacion}")
    public ValidacionPago buscarPorValidacion(@PathVariable Long idValidacion) {
        return validacionPagoRepository.findByIdValidacion(idValidacion);
    }

    // Guardar nuevo
    @PostMapping
    public ValidacionPago guardar(@RequestBody ValidacionPago validacionPago) {
        return validacionPagoRepository.save(validacionPago);
    }

    // Actualizar estado
    @PutMapping("/{id}")
    public ValidacionPago actualizar(@PathVariable Long id, @RequestBody ValidacionPago datos) {
        datos.setId(id);
        return validacionPagoRepository.save(datos);
    }

    // Subir comprobante PDF
    @PostMapping("/subir-comprobante/{idValidacion}")
    public ResponseEntity<?> subirComprobante(
            @PathVariable Long idValidacion,
            @RequestParam("archivo") MultipartFile archivo) {
        try {
            String nombreArchivo = "comprobante_" + idValidacion + "_" + archivo.getOriginalFilename();
            Path ruta = Paths.get("uploads/comprobantes/" + nombreArchivo);
            Files.createDirectories(ruta.getParent());
            Files.write(ruta, archivo.getBytes());

            ValidacionPago pago = validacionPagoRepository.findByIdValidacion(idValidacion);
            if (pago == null) {
                pago = new ValidacionPago();
                pago.setIdValidacion(idValidacion);
            }
            pago.setComprobantePago(nombreArchivo);
            pago.setFechaPago(LocalDate.now().toString());
            pago.setEstadoPago(ValidacionPago.EstadoPago.pendiente);
            validacionPagoRepository.save(pago);

            return ResponseEntity.ok("{\"mensaje\": \"Comprobante subido correctamente\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\": \"Error al subir el archivo\"}");
        }
    }
    @GetMapping("/archivo/{nombreArchivo}")
    public ResponseEntity<org.springframework.core.io.Resource> descargarArchivo(
            @PathVariable String nombreArchivo) {
        try {
            Path ruta = Paths.get("uploads/comprobantes/" + nombreArchivo);
            org.springframework.core.io.Resource recurso =
                    new org.springframework.core.io.UrlResource(ruta.toUri());

            if (!recurso.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=\"" + nombreArchivo + "\"")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(recurso);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}