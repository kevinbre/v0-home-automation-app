# Configuración de Alexa Voice Assistant

Este documento explica cómo configurar el asistente de voz con detección de wake word "Alexa".

## 🎯 Características

- ✅ **Wake Word Detection**: Di "Alexa" y la tablet te escucha automáticamente
- ✅ **Comandos de voz** para controlar el TV, apps, búsquedas, etc.
- ✅ **Activación manual**: Botón para activar sin decir "Alexa"
- ✅ **Respuestas de voz**: La tablet te responde con síntesis de voz
- ✅ **100% gratis** para uso personal (hasta 3 dispositivos)
- ✅ **Funciona offline** después de la carga inicial

---

## 📋 Pasos de configuración

### 1. Crear cuenta en Picovoice (GRATIS)

1. Ve a [Picovoice Console](https://console.picovoice.ai/)
2. Regístrate con tu email (es gratis)
3. Una vez dentro, busca tu **Access Key** en el dashboard
4. Copia el Access Key (se ve algo así: `AbC123XyZ...`)

### 2. Configurar la variable de entorno

1. Crea un archivo `.env.local` en la raíz del proyecto (si no existe)
2. Agrega esta línea:

```bash
NEXT_PUBLIC_PICOVOICE_ACCESS_KEY=tu_access_key_aqui
```

3. Reemplaza `tu_access_key_aqui` con el Access Key que copiaste

### 3. Reiniciar el servidor

```bash
pnpm dev
```

### 4. Dar permisos de micrófono

Cuando abras la app en tu tablet, el navegador te pedirá permiso para usar el micrófono. **Dale permitir**.

---

## 🎤 Cómo usar

### Modo automático (Wake Word)

1. Asegurate de que el botón con el ícono de micrófono esté **azul** (activo)
2. Di **"Alexa"** en voz alta
3. Escucharás un "bip" de confirmación
4. Di tu comando (ej: "abre YouTube")
5. La tablet ejecutará el comando y te responderá

### Modo manual (Botón)

1. Tocá el **botón grande azul** en la esquina inferior derecha
2. Escucharás el "bip"
3. Di tu comando
4. Listo!

---

## 📱 Comandos disponibles

### Control del TV

- "Alexa, **enciende el televisor**"
- "Alexa, **abre YouTube**"
- "Alexa, **abre Netflix**"
- "Alexa, **abre Disney Plus**"

### Búsquedas

- "Alexa, **busca música relajante**" (busca en YouTube)
- "Alexa, **buscar noticias**"

### Navegación

- "Alexa, **arriba**" / "**abajo**" / "**izquierda**" / "**derecha**"
- "Alexa, **selecciona**" / "**ok**"
- "Alexa, **volver**" / "**atrás**"

### Volumen

- "Alexa, **sube el volumen**"
- "Alexa, **baja el volumen**"
- "Alexa, **silencio**" / "**mutear**"

---

## 🔧 Solución de problemas

### "No detecta cuando digo Alexa"

- Asegurate de que el botón de micrófono esté **azul** (activo)
- Verifica que diste permisos de micrófono al navegador
- Revisa que tu Access Key esté correctamente configurada en `.env.local`
- Intenta decir "Alexa" más claro o más fuerte

### "El navegador no soporta reconocimiento de voz"

- Necesitás usar **Chrome** o **Edge** en Android
- Safari en iOS tiene soporte limitado
- Firefox no soporta Web Speech API completamente

### "No funciona el wake word pero sí el botón manual"

- Revisa tu Access Key de Picovoice
- Abre la consola del navegador (F12) y busca errores
- Puede que hayas alcanzado el límite de 3 dispositivos activos

### "Consume mucha batería"

- El wake word detection está optimizado, pero si querés ahorrar batería:
  - Tocá el botón pequeño para **desactivar** la detección automática
  - Usá solo el **botón manual** cuando necesites

---

## 🎨 Personalización

### Cambiar la sensibilidad del wake word

En `components/alexa-voice-assistant.tsx`, línea 52:

```typescript
sensitivities: [0.7], // 0.0 (menos sensible) - 1.0 (más sensible)
```

### Agregar más comandos

Edita la función `processCommand` en el mismo archivo y agrega tus propios comandos.

---

## 📊 Límites gratuitos de Picovoice

- ✅ **3 dispositivos** activos simultáneos
- ✅ **Sin límite de tiempo** de uso
- ✅ **Sin límite de detecciones** por día
- ✅ **Todas las wake words** disponibles
- ⚠️ Solo para **uso personal** (no comercial)

Para tu caso (1 tablet), **estás completamente cubierto gratis**.

---

## 🚀 Próximas mejoras

Ideas para el futuro:

- [ ] Integrar con Alexa real (AVS) para acceder a skills de Amazon
- [ ] Agregar más comandos personalizados
- [ ] Integrar con Philips Hue para controlar luces por voz
- [ ] Controlar música (Spotify, YouTube Music)
- [ ] Wake word personalizada (ej: "Jarvis", "Computer")

---

## 🆘 Ayuda

Si tenés problemas:

1. Revisa la consola del navegador (F12 → Console)
2. Verifica los permisos de micrófono
3. Asegurate de que `.env.local` esté configurado correctamente
4. Reinicia el servidor de desarrollo

---

¡Listo! Ahora tenés tu propia Alexa en la tablet 🎉
