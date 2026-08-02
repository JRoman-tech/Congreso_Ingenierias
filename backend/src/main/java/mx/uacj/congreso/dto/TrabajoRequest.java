package mx.uacj.congreso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TrabajoRequest(
        @NotBlank(message = "El autor principal es obligatorio") String participante_id,
        @NotBlank(message = "El título es obligatorio")
        @Size(max = 300, message = "El título no puede exceder 300 caracteres") String titulo,
        String resumen,
        @NotBlank(message = "El eje temático es obligatorio")
        @Size(max = 100, message = "El eje temático no puede exceder 100 caracteres") String eje_tematico,
        @Size(max = 300, message = "Las palabras clave no pueden exceder 300 caracteres") String palabras_clave,
        @Pattern(regexp = "presencial|virtual|grabado", message = "La modalidad no es válida")
        String modalidad,
        String usuario_id) {
}
