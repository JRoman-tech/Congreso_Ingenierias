package mx.uacj.congreso.dto;

public record SesionUsuarioResponse(
        String id,
        String nombre,
        String correo,
        String rol,
        String participante_id,
        String categoria,
        String institucion) {
}
