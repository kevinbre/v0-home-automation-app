# Configuración de Alexa Voice Service (AVS) - Alexa Real

Esta guía te ayudará a conectar tu tablet con tu cuenta de Amazon Alexa para que funcione exactamente como un Echo.

---

## 🎯 ¿Qué vas a lograr?

Tu tablet se convertirá en un dispositivo Alexa real que puede:
- ✅ Controlar tus dispositivos smart home (luces, enchufes, etc.)
- ✅ Reproducir música (Amazon Music, Spotify, etc.)
- ✅ Usar todas las skills de Alexa
- ✅ Activar rutinas
- ✅ Responder con la voz real de Alexa
- ✅ Todo lo que hace tu Alexa física

---

## 📋 Pasos de configuración

### 1. Crear un producto Alexa en Amazon Developer Console

1. **Entrá a Amazon Developer Console:**
   https://developer.amazon.com/alexa/console/avs/products

2. **Iniciá sesión** con tu cuenta de Amazon (la misma de tu Alexa)

3. **Click en "Create Product"**

4. **Completá el formulario:**
   - **Product Name:** `Home Automation Tablet`
   - **Product ID:** `home-tablet-001`
   - **Product Type:** Seleccioná `Alexa-Enabled Device`
   - **Product Category:** `Smart Home`
   - **Brief Product Description:** `Tablet with Alexa integration for home automation`
   - **How will end users interact with your product?** Seleccioná `Touch-initiated`
   - **Upload an image:** Podés usar cualquier imagen (opcional)
   - **Do you intend to distribute this product commercially?** `No`
   - **Is this a children's product?** `No`

5. **Click "Next"**

### 2. Configurar Security Profile

1. **Security Profile:**
   - Si es la primera vez, click en **"Create New Profile"**
   - **Security Profile Name:** `Home Tablet Profile`
   - **Security Profile Description:** `Security profile for home tablet`
   - Click **"Next"**

2. **En la sección "Web Settings":**
   - Click en **"Edit"** o **"Add Another"**
   - **Allowed Origins:** Agregá:
     ```
     http://localhost:3000
     ```
   - **Allowed Return URLs:** Agregá:
     ```
     http://localhost:3000/auth/callback
     ```
   - Click **"Save"**

3. **Guardar credenciales:**
   - Copiá el **Client ID** (se ve como: `amzn1.application-oa2-client.xxxxx`)
   - Click en **"Show Secret"** y copiá el **Client Secret**
   - **¡IMPORTANTE!** Guardá estos valores, los vas a necesitar

4. **Click "Next"** hasta terminar

---

### 3. Configurar variables de entorno

1. **Creá un archivo `.env.local`** en la raíz del proyecto (si no existe)

2. **Agregá estas líneas:**

```bash
# Alexa Voice Service (AVS)
NEXT_PUBLIC_ALEXA_CLIENT_ID=amzn1.application-oa2-client.XXXXX
ALEXA_CLIENT_SECRET=tu_client_secret_aqui
NEXT_PUBLIC_ALEXA_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_ALEXA_PRODUCT_ID=home-tablet-001
```

3. **Reemplazá** `XXXXX` con tu Client ID y Client Secret

4. **Guardá el archivo**

---

### 4. Reiniciar el servidor

```bash
pnpm dev
```

---

### 5. Probar la integración

1. **Abrí la app** en tu navegador: `http://localhost:3000`

2. **Verás un botón "Login con Amazon"** en la esquina inferior derecha

3. **Click en "Login con Amazon"**
   - Se abrirá un popup
   - Iniciá sesión con tu cuenta de Amazon
   - Aceptá los permisos

4. **Una vez autenticado:**
   - El popup se cerrará
   - Verás un botón azul con ícono de micrófono

5. **Probar Alexa:**
   - **Mantené presionado** el botón del micrófono
   - Hablá (ej: "¿Qué hora es?", "Enciende las luces")
   - **Soltá** el botón
   - Alexa procesará y responderá

---

## 🎤 Cómo usar

### Interactuar con Alexa:

1. **Presioná y mantené** el botón del micrófono
2. **Hablá** tu comando
3. **Soltá** cuando termines
4. Alexa procesará y responderá

### Ejemplos de comandos:

- "¿Qué hora es?"
- "Enciende las luces del living"
- "Reproduce música"
- "¿Cómo está el clima?"
- "Activa la rutina de buenos días"
- "Abre YouTube" (si tenés skills configuradas)

---

## 🔧 Solución de problemas

### "Error al autenticar"

- Verificá que el **Client ID** y **Client Secret** sean correctos
- Asegurate de que las **Allowed Return URLs** incluyan `http://localhost:3000/auth/callback`
- Reiniciá el servidor después de cambiar `.env.local`

### "No escucha mi voz"

- Dá permisos de micrófono al navegador
- Asegurate de **mantener presionado** el botón mientras hablás
- Probá con Chrome o Edge (mejor soporte)

### "Alexa no responde"

- Verificá que iniciaste sesión con la misma cuenta de tu Alexa física
- Revisá la consola del navegador (F12) para ver errores
- Asegurate de que tu cuenta de Alexa funciona en la app de Amazon Alexa

### "Token expirado"

- Los tokens duran 1 hora por defecto
- Hacé logout y volvé a hacer login
- En producción, deberías implementar refresh token automático

---

## 🚀 Próximos pasos

### Funcionalidades avanzadas:

1. **Wake Word Detection:**
   - Podés agregar detección de "Alexa" para no tener que presionar el botón
   - Requiere configurar Porcupine (ver `ALEXA_SETUP.md`)

2. **Refresh Token automático:**
   - Implementar renovación automática del token
   - Evitar tener que hacer login cada hora

3. **Directivas personalizadas:**
   - Procesar respuestas de Alexa
   - Integrar con tu smart home local

4. **Audio de respuesta:**
   - Reproducir las respuestas de voz de Alexa
   - Requiere procesar el audio multipart

---

## 📚 Recursos

- [AVS Documentation](https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/get-started-with-alexa-voice-service.html)
- [AVS API Reference](https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/api-overview.html)
- [Login with Amazon](https://developer.amazon.com/docs/login-with-amazon/documentation-overview.html)

---

## ⚠️ Notas importantes

- **Desarrollo solamente:** Esta configuración es para desarrollo local
- **Producción:** Para usar en producción (HTTPS), necesitás:
  - Dominio con HTTPS
  - Actualizar Allowed Origins y Return URLs
  - Posiblemente certificación de AVS de Amazon

- **Privacidad:** El audio se envía a los servidores de Amazon para procesamiento

---

¡Listo! Ahora tenés Alexa real funcionando en tu tablet 🎉
