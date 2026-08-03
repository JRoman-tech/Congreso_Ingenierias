package mx.uacj.congreso.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import mx.uacj.congreso.dto.CambioPasswordRequest;
import mx.uacj.congreso.dto.RestablecerPasswordRequest;
import mx.uacj.congreso.service.PasswordService;
import mx.uacj.congreso.service.PasswordService.Resultado;

@RestController
@RequestMapping("/api/auth/password")
public class PasswordController {

    private final PasswordService passwordService;

    public PasswordController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @PutMapping
    public ResponseEntity<?> cambiar(@Valid @RequestBody CambioPasswordRequest request) {
        Resultado resultado = passwordService.cambiarPropia(
                request.usuario_id(), request.password_actual(), request.password_nuevo());
        return switch (resultado) {
            case ACTUALIZADA -> ResponseEntity.ok(Map.of("message", "Contraseña actualizada"));
            case PASSWORD_INCORRECTO -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "La contraseña actual es incorrecta"));
            default -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Usuario no encontrado"));
        };
    }

    @PutMapping("/admin")
    public ResponseEntity<?> restablecer(@Valid @RequestBody RestablecerPasswordRequest request) {
        Resultado resultado = passwordService.restablecerComoAdministrador(
                request.administrador_id(), request.participante_id(), request.password_nuevo());
        return switch (resultado) {
            case ACTUALIZADA -> ResponseEntity.ok(Map.of("message", "Contraseña actualizada"));
            case SIN_PERMISO -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Solo un administrador puede realizar esta acción"));
            default -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Participante no encontrado"));
        };
    }
}
