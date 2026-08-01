package mx.uacj.cifi.validacion_backend.repository;

import mx.uacj.cifi.validacion_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Usuario findByCorreo(String correo);
}