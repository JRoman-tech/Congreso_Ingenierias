package mx.uacj.congreso.dto;

import jakarta.validation.constraints.NotBlank;

public record EstadoRequest(
        @NotBlank(message = "El estado es obligatorio") String estado,
        String usuario_id) {

    public String usuarioIdSeguro() {
        return usuario_id == null ? "" : usuario_id.trim();
    }
}
