# Gestión de participantes — Congreso 2026

Proyecto limpio del módulo asignado al Alumno 1.

## Tecnologías

- Backend: Java 17, Spring Boot y API REST.
- Frontend: React, TypeScript y Vite.
- Base de datos: MySQL.

## Funciones incluidas

- Dashboard del módulo.
- Registro y gestión de participantes.
- Información académica y áreas de interés.
- Carga y eliminación de documentos.
- Registro y gestión de trabajos académicos.
- Sesión de prueba con un administrador y vistas personalizadas por participante.

No incluye Home, autenticación, usuarios, agenda, salas, reportes ni
configuración del congreso.

## Preparación

Desde esta carpeta, crea la base vacía:

```powershell
mysql --default-character-set=utf8mb4 -u root -e "source backend/database.sql"
```

Inicia el backend en una terminal:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

En Windows también puedes abrir `backend\iniciar-backend.cmd`.

Inicia el frontend en otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

También puedes abrir `frontend\iniciar-frontend.cmd`.

Abre `http://localhost:5173`.

## Datos ficticios

Para insertar los 10 participantes y 10 trabajos de prueba:

```powershell
mysql --default-character-set=utf8mb4 -u root -e "source backend/datos-prueba.sql"
```

El archivo puede ejecutarse nuevamente sin duplicar esos registros.

El selector lateral permite probar la vista del administrador y la de cada
participante. No es un login real. La guía para conectarlo con el futuro módulo
de acceso está en `INTEGRACION_LOGIN.md`.

Para retirar únicamente los datos ficticios:

```powershell
mysql -u root -D congreso_participantes -e "DELETE FROM trabajos WHERE id LIKE '10000000-0000-0000-0000-0000000000%'; DELETE FROM participantes WHERE id LIKE '00000000-0000-0000-0000-0000000000%';"
```
