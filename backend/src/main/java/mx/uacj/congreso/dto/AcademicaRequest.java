package mx.uacj.congreso.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record AcademicaRequest(
        @Size(max = 100) String grado_maximo_estudios,
        @Size(max = 200) String institucion_academica,
        @Size(max = 80) String pais_academico,
        @Min(value = 1900, message = "El año de egreso no es válido")
        @Max(value = 2100, message = "El año de egreso no es válido") Integer anio_egreso,
        @Size(max = 100) String area_estudio,
        String semblanza,
        List<@Size(max = 100, message = "Un área de interés es demasiado larga") String> areas_interes) {
}
