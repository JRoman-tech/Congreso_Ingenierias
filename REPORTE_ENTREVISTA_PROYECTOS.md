# Reporte técnico y funcional para entrevista

## Sistema de Gestión de Participantes — Congreso de Ingenierías 2026

Este documento resume el trabajo realizado en los dos proyectos, cómo funciona la solución, las decisiones tomadas, los problemas resueltos y las respuestas recomendadas para una entrevista técnica o no técnica.

> Importante: este reporte no contiene contraseñas de producción. Las credenciales deben conservarse fuera del repositorio y configurarse como variables de entorno.

---

## 1. Resumen ejecutivo

Se trabajó sobre dos variantes del mismo sistema:

1. **Gestión de Participantes**, sin el módulo de validación.
2. **Congreso Ingenierías**, con el flujo completo de validación.

Ambos quedaron organizados como aplicaciones web completas, con:

- Un frontend en React y TypeScript.
- Un backend REST en Java con Spring Boot.
- Una base de datos MySQL.
- Roles de administrador y participante.
- Registro e inicio de sesión.
- Administración de participantes, información académica, documentos, pagos y trabajos.
- Cambio de contraseña por el propio usuario.
- Restablecimiento de contraseña de participantes por el administrador.
- Diseño coherente y responsivo.
- Frontend publicado en Netlify.
- Backend y MySQL publicados en Railway.
- Archivos persistentes mediante volúmenes de Railway.

Direcciones públicas:

- Gestión de Participantes: <https://gestion-participantes-estadias.netlify.app>
- Congreso Ingenierías: <https://congreso-ingenierias-2026.netlify.app>

La diferencia funcional principal es que **Congreso Ingenierías sí incluye revisión y validación**, mientras que Gestión de Participantes mantiene el resto del flujo sin mostrar esa opción.

---

## 2. Explicación breve para una persona no técnica

El sistema concentra en una sola página el proceso de participación en un congreso. Un participante puede crear su cuenta, registrar sus datos, agregar trabajos, subir documentos y comprobantes, y consultar su avance. El administrador puede revisar la información, controlar requisitos, cambiar la modalidad global de pago y dar seguimiento a cada participante.

Antes existían módulos con configuraciones y estilos separados. El trabajo consistió en hacerlos coherentes, conectarlos correctamente con una sola API y una sola base de datos por proyecto, corregir los errores de acceso y prepararlos para funcionar tanto localmente como en internet.

Una frase útil para entrevista:

> “Convertí módulos separados en dos aplicaciones web consistentes y desplegables. Unifiqué la experiencia visual, centralicé la comunicación mediante una API REST y aseguré la persistencia en MySQL, manteniendo una variante con validación y otra sin ella.”

---

## 3. Arquitectura general

```text
Usuario
  │
  ▼
Frontend React + TypeScript (Netlify)
  │  solicitudes HTTPS/JSON y multipart/form-data
  ▼
API REST Spring Boot (Railway)
  ├── MySQL administrado (Railway)
  └── Volumen persistente para archivos (Railway)
```

### Responsabilidad de cada capa

**Frontend**

- Muestra la interfaz.
- Administra navegación y estado de sesión en el navegador.
- Valida datos básicos antes de enviarlos.
- Consume la API con Axios.
- Adapta la interfaz al rol del usuario.

**Backend**

- Expone endpoints REST.
- Aplica validación de solicitudes.
- Ejecuta reglas de negocio.
- Hashea y verifica contraseñas.
- Consulta y actualiza MySQL.
- Administra cargas y descargas de archivos.
- Controla CORS para permitir únicamente los frontends configurados.

**MySQL**

- Mantiene participantes, usuarios, trabajos, documentos, pagos, configuraciones, actividad, notificaciones y validaciones.
- Usa claves foráneas para conservar relaciones consistentes.
- Usa valores enumerados para estados y categorías controladas.

---

## 4. Tecnologías utilizadas

### Frontend

- React 19.
- TypeScript 6.
- Vite 8.
- Axios para solicitudes HTTP.
- Lucide React para iconografía.
- CSS responsivo propio.
- ESLint para análisis estático.

### Backend

- Java 17.
- Spring Boot 3.5.
- Spring Web para REST.
- Spring JDBC y `JdbcTemplate` para acceso a datos.
- Jakarta Validation para validar solicitudes.
- BCrypt de Spring Security Crypto para contraseñas.
- Maven Wrapper para builds reproducibles.
- MySQL Connector/J.

### Infraestructura

- Git y GitHub para control de versiones.
- Netlify para los frontends estáticos.
- Railway para APIs, bases MySQL y volúmenes.
- Docker con construcción multietapa para los backends.

---

## 5. Estructura del proyecto

```text
raíz/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── database.sql
│   └── src/main/
│       ├── java/mx/uacj/congreso/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   └── service/
│       └── resources/
│           ├── application.properties
│           └── schema.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── session/
│   │   ├── api.ts
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.ts
├── netlify.toml
├── package.json
└── iniciar-proyecto.ps1
```

La raíz contiene comandos que permiten tratar frontend y backend como un solo proyecto, aunque internamente sigan separados por responsabilidad.

---

## 6. Funcionalidades principales

### Participante

- Crear cuenta.
- Iniciar y cerrar sesión.
- Cambiar su contraseña verificando primero la contraseña actual.
- Consultar y actualizar información personal y académica.
- Registrar, consultar y actualizar trabajos.
- Subir documentos.
- Subir comprobantes de pago.
- Asociar pagos a uno o varios trabajos según la configuración global.
- Consultar estados de revisión.
- Recibir notificaciones.
- En Congreso Ingenierías, consultar el proceso de validación.

### Administrador

- Consultar indicadores del dashboard.
- Crear, editar, buscar y eliminar participantes cuando las relaciones lo permiten.
- Consultar información académica.
- Configurar documentos requeridos.
- Revisar documentos y pagos.
- Administrar trabajos y estados.
- Seleccionar la modalidad global de pagos.
- Restablecer la contraseña de un participante.
- Cambiar su propia contraseña.
- Consultar historial y actividad.
- En Congreso Ingenierías, realizar el flujo de validación.

---

## 7. Modalidad global de pagos

El administrador elige una modalidad que se aplica de forma global:

- **Individual:** se requiere un comprobante por trabajo.
- **Agrupado:** un comprobante puede cubrir varios trabajos.

La configuración se guarda en `configuracion_pagos`; no depende únicamente de la interfaz. El backend consulta esa configuración al procesar comprobantes y asociaciones con trabajos.

Respuesta sugerida:

> “La modalidad se centralizó como una regla global administrable. Esto evita que cada participante elija una lógica diferente y mantiene un comportamiento uniforme durante el evento.”

---

## 8. Autenticación y contraseñas

### Implementación actual

- Las contraseñas nunca se guardan en texto plano.
- Se genera un hash BCrypt.
- El inicio de sesión busca al usuario activo por correo y compara el hash.
- El cambio personal exige la contraseña actual.
- La contraseña nueva debe tener entre 6 y 72 caracteres.
- El administrador puede asignar una nueva contraseña a un participante.
- El frontend exige confirmación de la contraseña nueva.

### Flujo de cambio personal

1. El usuario abre “Cambiar contraseña”.
2. Envía contraseña actual, contraseña nueva y confirmación.
3. El backend verifica BCrypt.
4. Si la actual es incorrecta responde `401`.
5. Si es válida, reemplaza el hash.
6. Se verificó que el usuario pueda iniciar sesión con la contraseña nueva.

### Flujo administrativo

1. El administrador abre Participantes.
2. Pulsa el botón con icono de llave.
3. Escribe y confirma la nueva contraseña.
4. El backend comprueba que el ID enviado corresponda a un administrador activo.
5. Actualiza el hash del usuario asociado al participante.

### Limitación importante que debe reconocerse

El sistema actual no usa todavía Spring Security completo, JWT ni sesiones firmadas por el servidor. El ID de sesión se conserva en `localStorage` y varias operaciones reciben IDs desde el cliente. Esto es suficiente para una demostración controlada, pero **no constituye autorización robusta para un sistema expuesto con datos sensibles**.

Mejora recomendada:

- Implementar Spring Security.
- Emitir JWT de corta duración o usar cookies de sesión `HttpOnly`, `Secure` y `SameSite`.
- Validar el rol en el servidor a partir del token, nunca de un ID enviado por el cliente.
- Agregar expiración, revocación y protección contra fuerza bruta.
- Incorporar recuperación de contraseña por correo mediante tokens de un solo uso.

El administrador inicial se crea únicamente cuando todavía no existe y exige
`ADMIN_PASSWORD` como variable de entorno. Los reinicios posteriores no
reescriben su hash, por lo que un cambio hecho desde la interfaz se conserva. El
repositorio tampoco incluye una contraseña administrativa predeterminada.

Una respuesta madura en entrevista sería:

> “BCrypt protege el almacenamiento de contraseñas, pero hashing y autorización son problemas distintos. La siguiente mejora prioritaria sería introducir autenticación firmada y autorización por rol en cada endpoint.”

---

## 9. Diseño de la base de datos

Tablas principales:

- `participantes`: datos generales.
- `usuarios`: identidad, rol, estado y hash de contraseña.
- `informacion_academica`: formación y semblanza.
- `areas_interes`: relación de áreas académicas.
- `trabajos`: ponencias y archivos.
- `documentos`: requisitos documentales y estados.
- `comprobantes_pago`: archivos y estado de pagos.
- `comprobante_trabajos`: relación muchos a muchos entre pagos y trabajos.
- `configuracion_pagos`: modalidad global.
- `requisitos_documentos`: configuración individual de requisitos.
- `actividad`: auditoría funcional.
- `notificaciones`: avisos por usuario.
- `validaciones`, `validacion_academica`, `validacion_pagos` e `historial_validacion`: presentes en la variante completa.

### Decisiones relevantes

- Se usan UUID como identificadores principales.
- Las claves foráneas evitan registros huérfanos.
- La relación entre participante y usuario permite separar perfil e identidad.
- Los estados se restringen con `ENUM` para impedir valores arbitrarios.
- Un comprobante agrupado se asocia con varios trabajos mediante una tabla intermedia.

### Inicialización

`schema.sql` utiliza `CREATE TABLE IF NOT EXISTS`, por lo que prepara una base vacía sin borrar registros existentes. El backend también contiene inicializadores para completar estructuras faltantes.

Limitación: para una evolución profesional del esquema debería usarse Flyway o Liquibase con migraciones versionadas. Ejecutar un esquema general al iniciar es práctico en esta etapa, pero ofrece menos trazabilidad que una secuencia formal de migraciones.

---

## 10. API REST

Grupos principales de endpoints:

- `/api/health`: salud del backend.
- `/api/auth`: registro e inicio de sesión.
- `/api/auth/password`: cambio propio y restablecimiento administrativo.
- `/api/sesion/{usuarioId}`: recuperación del usuario autenticado.
- `/api/participantes`: CRUD de participantes.
- `/api/participantes/{id}/academica`: información académica.
- `/api/participantes/{id}/documentos`: archivos y requisitos.
- `/api/participantes/{id}/pagos`: comprobantes y estados.
- `/api/trabajos`: trabajos, PDF y estados.
- `/api/configuracion/pagos`: modalidad global.
- `/api/dashboard/stats`: métricas.
- `/api/actividad` y `/api/notificaciones`: historial y avisos.
- `/api/validaciones`: flujo de validación en la variante completa.

### Convenciones usadas

- `GET`: consultar.
- `POST`: crear o subir archivos.
- `PUT`: actualizar datos o estados.
- `DELETE`: eliminar.
- JSON para datos estructurados.
- `multipart/form-data` para archivos.
- Códigos HTTP como `200`, `201`, `401`, `403`, `404` y `409`.

---

## 11. Diseño responsivo

Se revisaron las pantallas públicas y privadas:

- Inicio, login y registro.
- Sidebar y navegación.
- Dashboard.
- Participantes.
- Formularios.
- Información académica.
- Documentos y pagos.
- Trabajos.
- Historial y notificaciones.
- Cambio de contraseña.
- Validación.

Adaptaciones realizadas:

- Menú lateral ocultable en tabletas y teléfonos.
- Fondo bloqueador para cerrar el menú al tocar fuera.
- Navegación accesible con `aria-expanded`, `aria-controls` y etiquetas.
- Formularios de dos columnas que pasan a una.
- Tarjetas de tres o cuatro columnas que se reorganizan.
- Tablas con desplazamiento horizontal táctil y contenido protegido contra desbordamiento.
- Botones y acciones que se ajustan o envuelven.
- Notificaciones limitadas al alto disponible.
- Modal de contraseña convertido en panel inferior en móvil.
- Ajustes para pantallas angostas y dispositivos con poca altura.
- Uso de `clamp`, `minmax`, flexbox y CSS grid.
- Protección global contra desplazamiento horizontal accidental.

Respuesta sugerida:

> “No limité la responsividad al home. Revisé navegación, formularios, tablas, cargas de archivos, notificaciones y modales. Usé puntos de corte basados en el contenido y protecciones para anchura y altura reducidas.”

---

## 12. Ejecución local

Requisitos:

- Node.js 20 o posterior.
- Java 17 o posterior.
- MySQL 8.
- MySQL local configurado en el puerto `3307` para estos proyectos.

Proyecto completo con validación:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

Proyecto sin validación:

- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3002`

Comando normal:

```powershell
.\iniciar-proyecto.ps1
```

O mediante npm:

```powershell
npm run setup
npm run dev
```

Verificación:

```powershell
npm test
npm run build
npm run lint
```

---

## 13. Variables de entorno

Backend:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `UPLOAD_DIR`
- `ALLOWED_ORIGINS`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Frontend:

- `VITE_API_URL`

En Railway, las variables `DB_*` hacen referencia a las variables internas del servicio MySQL. En Netlify, `VITE_API_URL` se incorpora durante la compilación porque Vite genera archivos estáticos.

Nunca deben subirse contraseñas reales a GitHub.

---

## 14. Despliegue

### Netlify

- Ejecuta el build de Vite.
- Publica `frontend/dist`.
- Usa una redirección de `/*` a `/index.html` para que rutas como `/login` funcionen en una SPA.
- Recibe la dirección del backend mediante `VITE_API_URL`.

### Railway

- Construye el backend mediante Docker.
- El Dockerfile usa una etapa JDK para compilar y una imagen JRE más pequeña para ejecutar.
- Railway inyecta `PORT`.
- MySQL se ejecuta como un servicio administrado separado.
- Los archivos se guardan bajo `/data/uploads` en un volumen persistente.
- CORS permite el dominio exacto de Netlify.

### Situación particular del segundo despliegue

El plan gratuito alcanzó el límite de recursos. Con autorización se reutilizó el proyecto anterior `bubbly-inspiration` para Congreso Ingenierías. Se conservó su servicio MySQL, se desconectó el backend antiguo y se desplegó el backend nuevo. No se eliminó deliberadamente la base existente.

Los despliegues actuales se realizaron por CLI. Los cambios están guardados en GitHub, pero no debe afirmarse que existe una canalización CI/CD completa: una modificación futura requiere volver a desplegar o configurar integración automática con GitHub.

---

## 15. Problemas encontrados y cómo se resolvieron

### “No database selected”

Causa: se ejecutó un script con tablas sin haber seleccionado un esquema.

Solución: crear/seleccionar explícitamente la base para el entorno local y generar un `schema.sql` que trabaja sobre la base ya configurada por Spring en producción.

### Confusión entre MariaDB, MySQL y Workbench

MySQL Workbench es un cliente gráfico; no reemplaza al motor de base de datos. El proyecto quedó configurado para MySQL Server en el puerto local `3307`. Workbench se utiliza para conectarse y administrar ese servidor.

### Puerto 5173 ocupado

Se asignaron puertos distintos a las dos variantes:

- Completo: `5173` y `3001`.
- Sin validación: `5174` y `3002`.

También se configuró `strictPort` para que Vite informe claramente un conflicto en lugar de cambiar silenciosamente.

### Fallos de registro e inicio de sesión

Se revisaron:

- Conexión a MySQL.
- Esquema seleccionado.
- Hash BCrypt.
- creación del usuario asociado al participante.
- dirección base del frontend.
- CORS.
- credencial administrativa inicial.

### Error de publicación de Netlify

La configuración inicial combinaba `base` y `publish` de forma que Netlify buscaba el directorio generado en la ubicación incorrecta. Se cambió a:

```toml
[build]
command = "npm run build --prefix frontend"
publish = "frontend/dist"
```

### Backend de Railway buscando `backend/backend`

El servicio reutilizado conservaba `backend` como directorio raíz. Enviar únicamente esa carpeta hacía que Railway intentara buscar otra carpeta `backend` dentro de ella. Se corrigió enviando el repositorio desde la raíz para que encontrara `backend/Dockerfile`.

### Volumen de Railway

La CLI falló al recibir el nombre del servicio en una operación de volumen. Se utilizó el ID exacto del servicio y el volumen quedó montado correctamente.

### Límite del plan gratuito

No se intentó ocultar ni forzar el error. Se inspeccionaron los recursos, se informó la situación y se pidió autorización antes de reutilizar infraestructura existente.

---

## 16. Pruebas realizadas

### Automatizadas y de build

- Pruebas de Spring Boot con Maven.
- Compilación TypeScript.
- Build de Vite.
- Empaquetado del backend.
- ESLint.
- `git diff --check`.

### Pruebas manuales de integración

- Salud de ambos backends.
- Respuesta `200` de ambos frontends.
- Rutas SPA como `/login`.
- CORS desde cada dominio Netlify.
- Inicio de sesión administrativo.
- Registro de usuarios temporales.
- Eliminación posterior de los datos de prueba.
- Presencia del módulo de validación únicamente en el proyecto completo.
- Cambio de contraseña propia.
- Rechazo de una contraseña actual incorrecta.
- Inicio de sesión con la contraseña cambiada.
- Restablecimiento por administrador.
- Inicio de sesión con la contraseña restablecida.
- Verificación de que producción sirve los estilos responsivos nuevos.

No debe afirmarse que existe cobertura completa. Faltan pruebas unitarias específicas para todos los servicios y pruebas end-to-end automatizadas del navegador.

---

## 17. Decisiones y compensaciones

### `JdbcTemplate` en lugar de JPA

Ventajas:

- SQL explícito.
- Control directo de joins y actualizaciones.
- Poco código de infraestructura para un esquema existente.

Desventajas:

- Más SQL manual.
- Mapeo y mantenimiento más delicados.
- Mayor riesgo de duplicar consultas.

### Dos variantes en lugar de condicionar un solo despliegue

Se mantuvieron dos proyectos porque el usuario solicitó una versión sin validación y otra completa. Comparten estilo y conceptos, pero se publican de forma independiente.

Una evolución posible sería un único repositorio con feature flags o configuración por entorno, siempre que el negocio realmente necesite mantener ambas variantes.

### Almacenamiento en volumen

Es una mejora frente al disco efímero, pero para una solución escalable sería preferible almacenamiento de objetos como S3 o equivalente, con URLs firmadas, límites, análisis antivirus y políticas de retención.

---

## 18. Limitaciones y mejoras prioritarias

Orden recomendado:

1. Implementar autenticación y autorización robustas con Spring Security.
2. Corregir el inicializador del administrador para no sobrescribir cambios de contraseña en reinicios normales.
3. Añadir recuperación de contraseña por correo.
4. Agregar Flyway o Liquibase.
5. Añadir pruebas unitarias, integración aislada y E2E.
6. Configurar CI/CD desde GitHub.
7. Migrar archivos a almacenamiento de objetos.
8. Añadir antivirus, validación MIME real y políticas de tamaño/retención.
9. Incorporar rate limiting y bloqueo temporal de inicio de sesión.
10. Gestionar secretos con rotación periódica.
11. Agregar monitoreo, alertas, respaldos y recuperación probada.
12. Revisar protección de datos personales, consentimiento y acceso administrativo.

---

## 19. Preguntas técnicas probables

### ¿Por qué separaste frontend y backend?

Porque tienen responsabilidades y ciclos de construcción distintos. React genera una SPA estática, mientras Spring Boot ejecuta reglas, acceso a datos y archivos. La separación permite desplegar cada capa en la plataforma más adecuada.

### ¿Cómo se comunican?

El frontend usa Axios y consume la API REST por HTTPS. Los datos normales viajan como JSON y los archivos como `multipart/form-data`.

### ¿Qué es CORS y por qué fue necesario?

El navegador considera Netlify y Railway orígenes distintos. CORS indica qué frontend puede llamar a la API. Se configuró mediante `ALLOWED_ORIGINS`. CORS no reemplaza la autenticación.

### ¿Cómo proteges las contraseñas?

Con BCrypt, que usa salt y un factor de trabajo. El backend compara hashes; no descifra contraseñas. Aun así, falta completar la seguridad con tokens o sesiones y autorización por endpoint.

### ¿Por qué MySQL?

El dominio es relacional: participantes tienen usuarios, trabajos, documentos y pagos. MySQL permite claves foráneas, transacciones y consultas consistentes.

### ¿Cómo evitas SQL injection?

Las consultas variables utilizan parámetros de `JdbcTemplate`, no concatenación directa de valores del usuario.

### ¿Cómo conservas archivos en Railway?

Se configuró `UPLOAD_DIR=/data/uploads` y un volumen montado en `/data`. Sin volumen, el sistema de archivos del contenedor sería efímero.

### ¿Qué sucede al actualizar el esquema?

Actualmente se crean estructuras faltantes con SQL idempotente. La mejora profesional es usar migraciones versionadas.

### ¿Por qué Docker multietapa?

La primera etapa incluye el JDK y Maven para compilar. La segunda solo utiliza el JRE y el JAR, reduciendo tamaño y superficie de ejecución.

### ¿Qué hace la redirección de Netlify?

Entrega `index.html` para cualquier ruta de la SPA. React interpreta después `/login`, `/registro` o `/dashboard`.

### ¿Cómo manejaste el puerto dinámico?

Spring usa `server.port=${PORT:3001}` o su variante local. Railway inyecta `PORT`; localmente se usa el valor por defecto.

### ¿La aplicación escala horizontalmente?

El frontend sí se distribuye fácilmente. El backend podría replicarse, pero el almacenamiento local montado limita esa estrategia. Para múltiples réplicas conviene usar almacenamiento de objetos y sesiones sin estado.

### ¿Qué pruebas hiciste?

Build, lint, pruebas Spring y pruebas manuales reales contra producción, incluyendo registro, login, CORS, contraseñas y limpieza de datos temporales. Reconocería que faltan E2E automatizadas y mayor cobertura unitaria.

---

## 20. Preguntas no técnicas probables

### ¿Cuál era el problema principal?

Había módulos que parecían proyectos distintos, configuraciones de puertos y base inconsistentes, errores de inicio de sesión y registro, y una experiencia visual desigual. El objetivo fue hacer el sistema coherente, ejecutable y desplegable.

### ¿Cómo priorizaste?

Primero aseguré base de datos y autenticación; después consolidé estructura y reglas; luego unifiqué diseño; finalmente preparé despliegue, persistencia, contraseñas y responsividad.

### ¿Cómo manejaste un bloqueo?

Cuando Railway alcanzó el límite gratuito, no eliminé recursos sin permiso. Inspeccioné el proyecto existente, expliqué las opciones y esperé autorización para reutilizarlo conservando la base.

### ¿Cómo validaste que funcionara?

No me limité a que compilara. Probé frontend, backend, base, CORS, registro, login, roles, cambio de contraseña, restablecimiento y rutas públicas en producción.

### ¿Qué harías diferente con más tiempo?

Priorizaría seguridad de sesiones, migraciones, pruebas E2E, CI/CD, almacenamiento de objetos, monitoreo y respaldo.

### ¿Cuál fue una decisión difícil?

Mantener dos variantes coherentes sin introducir el módulo de validación donde no debía aparecer. Se compartieron patrones visuales y funcionales, pero se respetó esa diferencia de negocio.

---

## 21. Historias tipo STAR para entrevista

### Integración de módulos

**Situación:** existían módulos separados con estética y configuración distintas.

**Tarea:** convertirlos en una experiencia coherente y fácil de ejecutar.

**Acción:** organicé frontend y backend, centralicé comandos, alineé rutas, estilos, puertos, API y base de datos.

**Resultado:** dos variantes consistentes, cada una ejecutable desde su raíz y publicada en internet.

### Error de base de datos

**Situación:** el script devolvía “No database selected” y registro/login fallaban.

**Tarea:** identificar si era un problema de Workbench, MySQL o aplicación.

**Acción:** separé cliente y servidor, confirmé puerto y credenciales, seleccioné el esquema y ajusté inicialización y variables.

**Resultado:** conexión estable local y bases administradas en producción.

### Restricción de infraestructura

**Situación:** Railway bloqueó nuevos recursos por límite del plan.

**Tarea:** publicar el segundo sistema sin perder datos ni tomar una acción destructiva no autorizada.

**Acción:** inspeccioné recursos existentes, comuniqué el riesgo, pedí permiso y reutilicé el proyecto antiguo conservando MySQL.

**Resultado:** segundo sistema publicado sin borrar deliberadamente la información existente.

### Mejora de seguridad funcional

**Situación:** los usuarios no podían administrar sus contraseñas.

**Tarea:** permitir cambio propio y restablecimiento administrativo.

**Acción:** agregué endpoints, validaciones, BCrypt, interfaz modal y pruebas reales con usuarios temporales.

**Resultado:** ambos flujos funcionan en los dos despliegues.

---

## 22. Guion de demostración

Duración sugerida: 5 a 8 minutos.

1. Abrir el home y explicar las dos variantes.
2. Mostrar registro de participante.
3. Iniciar sesión como participante.
4. Mostrar panel, datos académicos, documentos y trabajos.
5. Mostrar cambio de contraseña.
6. Cerrar sesión e iniciar como administrador.
7. Mostrar dashboard y tabla de participantes.
8. Mostrar restablecimiento mediante el icono de llave.
9. Mostrar modalidad global de pagos.
10. En Congreso Ingenierías, mostrar validación.
11. Reducir el navegador para demostrar responsividad.
12. Cerrar explicando arquitectura Netlify–Railway–MySQL.

No conviene cambiar la contraseña del administrador durante una demostración hasta ajustar `AdminInitializer`. Es mejor demostrar el cambio con un participante de prueba.

---

## 23. Respuestas que conviene evitar

Evitar:

- “Es totalmente seguro.”
- “Tiene cobertura completa.”
- “Tiene CI/CD automático.”
- “CORS protege la API.”
- “Workbench es la base de datos.”
- “Railway guarda archivos automáticamente para siempre.”
- “Es responsivo en absolutamente cualquier equipo imaginable.”

Preferir:

- “Tiene hashing BCrypt, y el siguiente paso es autorización robusta con Spring Security.”
- “Se probaron los flujos críticos, pero falta automatizar E2E y ampliar cobertura.”
- “Los despliegues actuales son reproducibles por CLI; CI/CD es una mejora pendiente.”
- “Workbench es el cliente; MySQL Server es el motor.”
- “Los archivos persisten en un volumen, aunque para escalar usaría almacenamiento de objetos.”
- “Se cubrieron teléfonos, tabletas, escritorio y pantallas de poca altura mediante diseño adaptable.”

---

## 24. Resumen de 30 segundos

> “Desarrollé y consolidé un sistema de gestión para un congreso con React, TypeScript, Spring Boot y MySQL. Incluye participantes, datos académicos, trabajos, documentos, pagos, notificaciones, roles y contraseñas; una variante añade validación. Resolví problemas de base, puertos, CORS y despliegue, unifiqué la interfaz y la hice responsiva. Publiqué los frontends en Netlify y los backends con MySQL y volúmenes persistentes en Railway. También identifiqué como siguientes pasos Spring Security, migraciones, pruebas E2E, CI/CD y almacenamiento de objetos.”

---

## 25. Lista de repaso antes de la entrevista

- Saber explicar React → API REST → MySQL.
- Recordar la diferencia entre MySQL Server y Workbench.
- Explicar BCrypt sin decir que “cifra” la contraseña.
- Saber qué hace CORS y qué no hace.
- Explicar por qué se usan variables de entorno.
- Recordar la diferencia entre la versión con y sin validación.
- Explicar modalidad individual y agrupada de pagos.
- Mencionar pruebas reales y datos temporales eliminados.
- Reconocer limitaciones de autorización, migraciones y CI/CD.
- Preparar una historia STAR sobre el límite de Railway.
- No compartir secretos durante la entrevista o una grabación.
- Tener abiertas las dos URLs y probarlas antes de comenzar.
