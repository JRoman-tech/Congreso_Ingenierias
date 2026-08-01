package mx.uacj.cifi.validacion_backend.repository;

import mx.uacj.cifi.validacion_backend.model.ValidacionPago;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ValidacionPagoRepository extends JpaRepository<ValidacionPago, Long> {
    ValidacionPago findByIdValidacion(Long idValidacion);
}