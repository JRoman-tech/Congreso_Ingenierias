package mx.uacj.cifi.validacion_backend.repository;

import mx.uacj.cifi.validacion_backend.model.Validacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ValidacionRepository extends JpaRepository<Validacion, Long> {
}