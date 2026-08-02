package mx.uacj.congreso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RestablecerPasswordRequest(
        @NotBlank String administrador_id,
        @NotBlank String participante_id,
        @NotBlank @Size(min = 6, max = 72) String password_nuevo) {
}
