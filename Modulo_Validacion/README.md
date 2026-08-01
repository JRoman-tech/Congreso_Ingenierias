# Módulo de Validación — Congreso 2026

Módulo de validación y control asignado al Alumno 2.

## Tecnologías

* **Backend:** Java 17, Spring Boot 4.1 y API REST
* **Frontend:** React 18, Vite y Tailwind CSS
* **Base de datos:** MySQL

## Funciones incluidas

* Login con roles diferenciados (administrador y participante)
* Registro de nuevos participantes
* Panel de validaciones con filtros por nombre y estado
* Revisión de información académica (título, resumen y palabras clave)
* Revisión de comprobante de pago en PDF
* Flujo de validación en 2 fases (académica → pago)
* Historial de cambios de estado por participante
* Rutas protegidas por rol

No incluye agenda, salas, reportes ni configuración del congreso.

## Preparación

Crea la base de datos en MySQL Workbench:

```sql
CREATE DATABASE cifi_validacion;
```

Importa el esquema:

mysql -u root -p cifi_validacion < cifi_validacion.sql


Inicia el backend en una terminal:

cd validacion-backend
.\mvnw.cmd spring-boot:run


Inicia el frontend en otra terminal:

cd validacion-frontend
npm install
npm run dev


Abre `http://localhost:5173`.

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@cifi.mx | admin123 |
| Participante | maria@test.com | pass123 |

## Puertos
* Frontend: `http://localhost:5173`
* Backend: `http://localhost:8081`
* Frontend: `http://localhost:5173`
* Backend: `http://localhost:8081`
