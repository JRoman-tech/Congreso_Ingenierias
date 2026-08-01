package mx.uacj.congreso.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ParticipanteRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
        String nombre,
        @NotBlank(message = "El apellido paterno es obligatorio")
        @Size(max = 100, message = "El apellido paterno no puede exceder 100 caracteres")
        String apellido_paterno,
        @Size(max = 100, message = "El apellido materno no puede exceder 100 caracteres")
        String apellido_materno,
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no es válido")
        @Size(max = 150, message = "El correo no puede exceder 150 caracteres")
        String correo,
        @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
        String telefono,
        @Size(max = 80, message = "El país no puede exceder 80 caracteres")
        String pais,
        @Size(max = 200, message = "La institución no puede exceder 200 caracteres")
        String institucion,
        @NotBlank(message = "La categoría es obligatoria")
        @Pattern(regexp = "Estudiante|Docente|Investigador|Profesional",
                message = "La categoría no es válida")
        String categoria,
        boolean requiere_carta_invitacion) {
}
