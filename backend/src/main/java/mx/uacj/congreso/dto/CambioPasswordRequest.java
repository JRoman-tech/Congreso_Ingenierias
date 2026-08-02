package mx.uacj.congreso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambioPasswordRequest(
        @NotBlank String usuario_id,
        @NotBlank String password_actual,
        @NotBlank @Size(min = 6, max = 72) String password_nuevo) {
}
