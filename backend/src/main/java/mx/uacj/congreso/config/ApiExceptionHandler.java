package mx.uacj.congreso.config;

import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> dtoNoValido(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        String message = fields.values().stream().findFirst().orElse("Los datos enviados no son válidos");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", message);
        body.put("campos", fields);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> cuerpoNoValido() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "El cuerpo contiene campos desconocidos o valores no válidos"));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> archivoDemasiadoGrande() {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "El archivo supera el límite de 10 MB"));
    }
}
