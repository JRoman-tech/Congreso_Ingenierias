package mx.uacj.congreso.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100) String nombre,
        @NotBlank(message = "El apellido paterno es obligatorio") @Size(max = 100) String apellido_paterno,
        @Size(max = 100) String apellido_materno,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no es válido")
        @Size(max = 150) String correo,
        @Size(max = 20) String telefono,
        @Size(max = 80) String pais,
        @Size(max = 200) String institucion,
        @Pattern(regexp = "Estudiante|Docente|Investigador|Profesional",
                message = "La categoría no es válida") String categoria,
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres")
        String password) {
}
