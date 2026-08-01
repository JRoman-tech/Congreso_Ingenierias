package mx.uacj.cifi.validacion_backend.repository;

import mx.uacj.cifi.validacion_backend.model.ValidacionAcademica;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ValidacionAcademicaRepository extends JpaRepository<ValidacionAcademica, Long> {
    ValidacionAcademica findByIdValidacion(Long idValidacion);
}