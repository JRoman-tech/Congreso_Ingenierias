# Congreso de Ingenierías 2026

Proyecto único para administrar participantes y su proceso de validación.

## Estructura

- `frontend/`: aplicación React para participantes y administradores.
- `backend/`: API Spring Boot de autenticación, participantes y validaciones.
- Base de datos única: `congreso_participantes` en MySQL.

## Requisitos

- Node.js 20 o posterior
- Java 17 o posterior
- MySQL 8 en `127.0.0.1:3307`

## Primera instalación

Desde esta carpeta ejecuta:

```powershell
npm run setup
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -h 127.0.0.1 -P 3307 -u root -p --default-character-set=utf8mb4 -e "source backend/database.sql"
```

El último comando solicita la contraseña de MySQL y crea la base y todas sus
tablas. El backend también completa automáticamente las tablas que falten al
arrancar, sin borrar la información existente.

## Iniciar el proyecto

```powershell
.\iniciar-proyecto.ps1
```

Escribe tu contraseña de MySQL cuando se solicite y abre
<http://localhost:5173>. La API se ejecuta en <http://localhost:3001>.

Antes del primer arranque define una contraseña administrativa propia; no existe
una contraseña predeterminada en el código:

```powershell
$env:ADMIN_PASSWORD = Read-Host "Contraseña inicial del administrador"
```

El correo inicial es `admin@cifi.mx` y puede cambiarse mediante
`ADMIN_EMAIL`. La contraseña de entorno solo crea al administrador cuando aún
no existe, por lo que los cambios posteriores de contraseña se conservan.

También puedes configurar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
`DB_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` manualmente y después ejecutar
`npm run dev`.

## Verificación

```powershell
npm run lint
npm run build
npm test
```
