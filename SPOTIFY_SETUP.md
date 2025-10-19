# Configuración de Spotify - Múltiples Cuentas

Esta guía te ayudará a configurar una o más cuentas de Spotify para controlarlas por voz en tu aplicación de domótica.

## Características

- ✅ Soporte para múltiples cuentas de Spotify
- ✅ Cambio entre cuentas por voz
- ✅ Gestión desde el frontend (sin variables de entorno)
- ✅ Control completo por comandos de voz

## Paso 1: Crear una aplicación en Spotify Developer Dashboard

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Inicia sesión con tu cuenta de Spotify
3. Haz clic en **"Create app"**
4. Completa la información:
   - **App name**: "Home Automation" (o el nombre que prefieras)
   - **App description**: "Control de Spotify por voz"
   - **Redirect URI**: `http://localhost:3000/api/spotify/callback`
   - **Website**: (opcional)
   - Marca las casillas de términos y condiciones
5. Haz clic en **"Save"**
6. En la página de tu app, haz clic en **"Settings"**
7. Copia el **Client ID** y el **Client Secret**

**IMPORTANTE:** Puedes usar la misma app para múltiples cuentas, o crear una app diferente para cada cuenta.

## Paso 2: Obtener el Refresh Token

### Opción A: Usando la herramienta web de Spotify

1. Ve a https://developer.spotify.com/console/post-token/
2. Marca todos los scopes necesarios:
   - `user-read-playback-state`
   - `user-modify-playback-state`
   - `user-read-currently-playing`
   - `playlist-read-private`
   - `playlist-read-collaborative`
   - `user-library-read`
3. Haz clic en "Get Token"
4. Copia el token generado

### Opción B: Usando el callback de la app (recomendado)

1. Configura temporalmente las variables de entorno en `.env.local`:
```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
```

2. Visita: `http://localhost:3000/api/spotify/auth` en tu navegador
3. Copia la URL de autorización que aparece
4. Pégala en una nueva pestaña y autoriza la aplicación
5. Serás redirigido a tu app con el `refresh_token` en la URL
6. Copia el `refresh_token` (es un string largo)

## Paso 3: Agregar la cuenta en la aplicación

1. Abre tu aplicación de domótica
2. Ve al widget de Spotify
3. Haz clic en **"+ Cuenta"**
4. Completa el formulario:
   - **Nombre**: Un nombre descriptivo (ej: "Juan", "Mi Cuenta", "Familia")
   - **Client ID**: El Client ID de tu app
   - **Client Secret**: El Client Secret de tu app
   - **Refresh Token**: El token que obtuviste en el paso 2
5. Haz clic en **"Agregar Cuenta"**

La aplicación verificará automáticamente las credenciales y agregará la cuenta si son válidas.

## Paso 4: Agregar más cuentas (opcional)

Repite los pasos 2 y 3 para cada cuenta adicional que quieras agregar. Cada persona puede tener su propia cuenta de Spotify vinculada.

## Comandos de voz disponibles

### Control de reproducción
- **"Alexa, reproduce música"** - Reanuda la reproducción
- **"Alexa, pausa la música"** - Pausa la reproducción
- **"Alexa, siguiente canción"** - Salta a la siguiente canción
- **"Alexa, canción anterior"** - Vuelve a la canción anterior
- **"Alexa, sube el volumen"** - Sube el volumen de Spotify
- **"Alexa, baja el volumen"** - Baja el volumen de Spotify

### Cambio entre cuentas (si tienes múltiples)
- **"Alexa, cambia a cuenta Juan"** - Cambia a la cuenta llamada "Juan"
- **"Alexa, cambia a cuenta Familia"** - Cambia a la cuenta llamada "Familia"
- **"Alexa, cambia cuenta"** - Lista todas las cuentas disponibles

## Gestión de cuentas desde la UI

En el widget de Spotify puedes:

1. **Ver todas tus cuentas**: Se muestran con su nombre y usuario de Spotify
2. **Cambiar cuenta activa**: Haz clic en cualquier cuenta para activarla
3. **Eliminar cuenta**: Haz clic en el icono de papelera
4. **Agregar nueva cuenta**: Botón "+ Cuenta"

La cuenta activa se marca con un check verde y un borde verde.

## Notas importantes

1. **Spotify Premium requerido**: La API de Spotify solo funciona con cuentas Premium
2. **Dispositivo activo**: Necesitas tener Spotify abierto en al menos un dispositivo para cada cuenta
3. **Sincronización**: Los cambios se guardan en localStorage y se sincronizan automáticamente
4. **Seguridad**: Las credenciales se almacenan localmente en tu navegador

## Solución de problemas

### Error: "Faltan credenciales de Spotify"
- Verifica que hayas ingresado todos los campos al agregar la cuenta
- Asegúrate de que el refresh token sea válido

### Error al agregar cuenta
- Verifica que tu Client ID y Client Secret sean correctos
- Asegúrate de que el Refresh Token no haya expirado
- Intenta obtener un nuevo Refresh Token

### "No hay dispositivos activos"
- Abre Spotify en tu computadora, teléfono o cualquier dispositivo
- Reproduce algo brevemente
- La cuenta debe estar autenticada en ese dispositivo
- Intenta nuevamente el comando de voz

### El cambio de cuenta no funciona
- Verifica que la cuenta destino tenga Spotify abierto en un dispositivo
- Espera unos segundos después de cambiar de cuenta
- Verifica que el nombre de la cuenta sea correcto

### La canción no se actualiza
- El widget se actualiza cada 3 segundos
- Verifica tu conexión a internet
- Revisa la consola del navegador para errores

## Seguridad y privacidad

- Las credenciales se almacenan **solo en localStorage** de tu navegador
- No se envían a ningún servidor externo (excepto a la API de Spotify)
- Cada usuario puede tener su propia cuenta
- Las credenciales no se comparten entre dispositivos

## Configuración en producción

Si despliegas tu aplicación en producción:

1. Actualiza el **Redirect URI** en Spotify Developer Dashboard:
   - Agrega: `https://tu-dominio.com/api/spotify/callback`

2. Las cuentas se configuran desde el frontend, no necesitas variables de entorno

3. Considera agregar un sistema de autenticación para proteger el acceso a la app

## Recursos adicionales

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
- [Spotify Console for Testing](https://developer.spotify.com/console/)

## Ejemplo de uso multi-usuario

### Familia con 3 personas:

1. **Papá** configura su cuenta:
   - Nombre: "Papá"
   - Usa su cuenta Premium de Spotify
   - Control: "Alexa, cambia a cuenta Papá"

2. **Mamá** agrega su cuenta:
   - Nombre: "Mamá"
   - Usa su propia cuenta Premium
   - Control: "Alexa, cambia a cuenta Mamá"

3. **Cuenta compartida** para toda la familia:
   - Nombre: "Familia"
   - Cuenta Premium compartida
   - Control: "Alexa, cambia a cuenta Familia"

Cada persona puede cambiar a su cuenta por voz y tener su propia música, playlists y preferencias.
