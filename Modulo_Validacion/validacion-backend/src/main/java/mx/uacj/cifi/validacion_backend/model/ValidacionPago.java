package mx.uacj.cifi.validacion_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "validacion_pago")
public class ValidacionPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idValidacion;
    private Double monto;
    private String comprobantePago;
    private String fechaPago;
    private String observaciones;
    private String revisadoPor;
    private String revisadoEn;

    @Enumerated(EnumType.STRING)
    private EstadoPago estadoPago = EstadoPago.pendiente;

    public enum EstadoPago {
        pendiente, verificado, rechazado
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdValidacion() { return idValidacion; }
    public void setIdValidacion(Long idValidacion) { this.idValidacion = idValidacion; }

    public Double getMonto() { return monto; }
    public void setMonto(Double monto) { this.monto = monto; }

    public String getComprobantePago() { return comprobantePago; }
    public void setComprobantePago(String comprobantePago) { this.comprobantePago = comprobantePago; }

    public String getFechaPago() { return fechaPago; }
    public void setFechaPago(String fechaPago) { this.fechaPago = fechaPago; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getRevisadoPor() { return revisadoPor; }
    public void setRevisadoPor(String revisadoPor) { this.revisadoPor = revisadoPor; }

    public String getRevisadoEn() { return revisadoEn; }
    public void setRevisadoEn(String revisadoEn) { this.revisadoEn = revisadoEn; }

    public EstadoPago getEstadoPago() { return estadoPago; }
    public void setEstadoPago(EstadoPago estadoPago) { this.estadoPago = estadoPago; }
}