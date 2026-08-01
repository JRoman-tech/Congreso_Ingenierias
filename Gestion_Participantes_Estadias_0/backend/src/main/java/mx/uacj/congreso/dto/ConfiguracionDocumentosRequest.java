package mx.uacj.congreso.dto;

public record ConfiguracionDocumentosRequest(
        boolean carta_autorizacion,
        boolean trabajo_completo,
        String usuario_id) {

    public String usuarioIdSeguro() {
        return usuario_id == null ? "" : usuario_id.trim();
    }
}
