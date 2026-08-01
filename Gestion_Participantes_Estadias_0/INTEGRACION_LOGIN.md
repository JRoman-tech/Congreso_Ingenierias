# Integración con el futuro Home y Login

La aplicación utiliza un contrato de sesión independiente de las pantallas de
acceso. El selector actual es únicamente un simulador para pruebas y no
representa autenticación real.

## Contrato de usuario

El login deberá entregar al frontend un objeto con esta forma:

```ts
interface SessionUser {
  id: string
  nombre: string
  correo: string
  rol: 'administrador' | 'participante'
  participante_id?: string
  categoria?: string
  institucion?: string
}
```

Para el administrador, `participante_id` es nulo. Para los demás usuarios
contiene el identificador del participante cuyos datos pueden consultar.

## Sustitución del selector

1. El backend de autenticación debe exponer una ruta como `GET /api/auth/me`
   que devuelva el contrato anterior.
2. En `frontend/src/session/SessionContext.tsx`, se reemplaza la carga de
   `sessionApi.opciones()` por la consulta a `authApi.me()`.
3. El usuario devuelto se guarda mediante `setUser`.
4. Se configura `VITE_ENABLE_SESSION_SWITCHER=false` para ocultar el selector
   temporal.
5. El botón de cerrar sesión y las redirecciones al Home/Login pueden añadirse
   en el mismo contexto sin modificar las páginas del dashboard.

## Seguridad pendiente

Ocultar pantallas por rol no sustituye la autorización del servidor. Al
integrar el login, el backend debe validar el token o la cookie de sesión en
cada petición y comprobar que un participante solo acceda a su propio
`participante_id`.

La base de datos incluye una restricción que permite únicamente un usuario con
rol `administrador`.

