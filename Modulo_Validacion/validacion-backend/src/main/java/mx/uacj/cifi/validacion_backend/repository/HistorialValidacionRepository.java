package mx.uacj.cifi.validacion_backend.repository;

import mx.uacj.cifi.validacion_backend.model.HistorialValidacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistorialValidacionRepository extends JpaRepository<HistorialValidacion, Long> {
    List<HistorialValidacion> findByIdValidacionOrderByFechaDesc(Long idValidacion);
}