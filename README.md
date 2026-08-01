# Congreso de Ingenierías 2026

Proyecto integrado de gestión de participantes y validación. Los módulos
conservan sus archivos, backends y bases de datos, pero funcionan desde una sola
dirección y comparten la sesión iniciada en el módulo principal.

## Requisitos

- Node.js 20 o posterior
- Java 17 o posterior
- MySQL 8

## Preparación inicial

Desde esta carpeta:

```powershell
npm install
npm run setup
mysql --default-character-set=utf8mb4 -u root -e "source Gestion_Participantes_Estadias_0/backend/database.sql"
mysql --default-character-set=utf8mb4 -u root -e "source Modulo_Validacion/validacion-backend/cifi_validacion.sql"
```

Si MySQL tiene contraseña, defínela antes de iniciar el proyecto:

```powershell
$env:DB_PASSWORD = "tu-contraseña"
```

## Iniciar todo el proyecto con MySQL en el puerto 3307

```powershell
.\iniciar-proyecto.ps1
```

El iniciador solicita la contraseña de MySQL de forma oculta y configura ambos
backends para usar `127.0.0.1:3307`. Mantén abierta esa terminal mientras uses
la aplicación.

Alternativamente, puedes definir manualmente `DB_HOST`, `DB_PORT`, `DB_USER` y
`DB_PASSWORD`, y ejecutar `npm run dev`.

Abre solamente <http://localhost:5173>. La aplicación principal sirve el acceso
al módulo de validación en `/modulo-validacion/`; no es necesario abrir el
puerto 5174 ni volver a iniciar sesión.

Servicios internos:

- Gestión web: 5173
- Validación web: 5174, expuesto por el proxy del frontend principal
- API de participantes: 3001
- API de validación: 8081

## Cómo se comunican

Al iniciar o restaurar una sesión, el frontend principal envía su identificador
al backend de validación. Este consulta `GET /api/sesion/{id}` en la API de
participantes, verifica al usuario y crea o actualiza su perfil local. Para un
participante nuevo también crea automáticamente el flujo de validación inicial.

## Verificación

```powershell
npm run build
npm run test:backends
```
