package mx.uacj.cifi.validacion_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "validacion_academica")
public class ValidacionAcademica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idValidacion;
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String resumen;

    private String palabraClave1;
    private String palabraClave2;
    private String palabraClave3;
    private String palabraClave4;
    private String palabraClave5;

    private Boolean datosValidos;
    private String observaciones;
    private String revisadoPor;
    private String revisadoEn;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdValidacion() { return idValidacion; }
    public void setIdValidacion(Long idValidacion) { this.idValidacion = idValidacion; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getResumen() { return resumen; }
    public void setResumen(String resumen) { this.resumen = resumen; }

    public String getPalabraClave1() { return palabraClave1; }
    public void setPalabraClave1(String palabraClave1) { this.palabraClave1 = palabraClave1; }

    public String getPalabraClave2() { return palabraClave2; }
    public void setPalabraClave2(String palabraClave2) { this.palabraClave2 = palabraClave2; }

    public String getPalabraClave3() { return palabraClave3; }
    public void setPalabraClave3(String palabraClave3) { this.palabraClave3 = palabraClave3; }

    public String getPalabraClave4() { return palabraClave4; }
    public void setPalabraClave4(String palabraClave4) { this.palabraClave4 = palabraClave4; }

    public String getPalabraClave5() { return palabraClave5; }
    public void setPalabraClave5(String palabraClave5) { this.palabraClave5 = palabraClave5; }

    public Boolean getDatosValidos() { return datosValidos; }
    public void setDatosValidos(Boolean datosValidos) { this.datosValidos = datosValidos; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getRevisadoPor() { return revisadoPor; }
    public void setRevisadoPor(String revisadoPor) { this.revisadoPor = revisadoPor; }

    public String getRevisadoEn() { return revisadoEn; }
    public void setRevisadoEn(String revisadoEn) { this.revisadoEn = revisadoEn; }
}