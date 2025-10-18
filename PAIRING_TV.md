# Guía Rápida: Vincular tu TV Philips 65PUD7908/77

## ¡Ahora puedes hacer el pairing directamente desde la app! 🎉

Ya no necesitas usar la PC. Todo se hace desde tu tablet.

---

## Paso 1: Instalar ADB en Termux (Solo una vez)

**En tu tablet, abre Termux:**

```bash
# Actualizar paquetes
pkg update && pkg upgrade

# Instalar ADB
pkg install android-tools

# Verificar
adb version
```

Deberías ver:
```
Android Debug Bridge version 1.0.41
```

---

## Paso 2: Habilitar Depuración Inalámbrica en el TV (Solo una vez)

**En tu TV Philips:**

1. **Configuración** (Settings) → **Preferencias del dispositivo**
2. **Acerca de** (About)
3. Presiona **7 veces** en **"Versión de Android"** o **"Compilación"**
4. Aparecerá: "Ahora eres un desarrollador"

**Luego:**

5. Vuelve a **Preferencias del dispositivo**
6. Entra en **Opciones para desarrolladores**
7. Activa **"Depuración inalámbrica"** (Wireless debugging)

**IMPORTANTE:** Deja esta opción activada siempre.

---

## Paso 3: Agregar el TV en la App

1. Abre la app en tu tablet
2. Ve a **Control de TV** (`/tv`)
3. Haz clic en **"Configurar"** (arriba a la derecha)
4. Haz clic en **"Agregar Nuevo TV"**
5. Completa:
   - **Nombre:** Smart TV Sala
   - **Ubicación:** Sala de Estar
   - **Dirección IP:** `192.168.100.228` (la IP de tu TV)
   - **Marca:** Philips
   - **Usar ADB:** ✅ **ACTIVA ESTO** (muy importante)
6. Haz clic en **"Agregar"**

---

## Paso 4: Vincular el TV (Pairing)

**Después de agregar el TV:**

1. En la lista de TVs, haz clic en **"Vincular ADB"** (botón azul)
2. Se abrirá un modal con instrucciones

**En tu TV:**

3. Ve a **Configuración** → **Opciones para desarrolladores**
4. Entra en **"Depuración inalámbrica"**
5. Haz clic en **"Vincular dispositivo con código"**
6. Verás algo como:
   ```
   Código de vinculación: 482916
   192.168.100.228:37853
   ```

**En la app (tu tablet):**

7. Ingresa el **puerto** (ejemplo: `37853`)
8. Ingresa el **código** (ejemplo: `482916`)
9. Haz clic en **"Vincular"**

**Si todo salió bien:**
- Verás ✅ "Vinculación exitosa"
- El modal se cerrará automáticamente
- ¡Ya puedes controlar el TV!

---

## Paso 5: Probar que Funciona

1. En la página de Control de TV, haz clic en tu TV
2. Activa el switch de encendido
3. Haz clic en el botón de **YouTube** en "Canales de YouTube Favoritos"

**Si YouTube se abre en el TV → ¡FUNCIONA!** 🎉

---

## Solución de Problemas

### Error: "Pairing failed"

**Posibles causas:**
- El código expiró (dura 2 minutos). Genera uno nuevo en el TV.
- El puerto es incorrecto. Verifica que copiaste bien el número.
- Tu tablet y el TV no están en la misma red WiFi.

**Solución:**
1. En el TV, sal y vuelve a entrar en "Vincular dispositivo con código"
2. Genera un código nuevo
3. Inténtalo de nuevo

### Error: "Connection refused"

- Verifica que "Depuración inalámbrica" esté **activada** en el TV
- Verifica que la IP del TV sea correcta
- Asegúrate de que tu tablet esté conectada a la **misma red WiFi** que el TV

### El TV no responde a los comandos

Haz clic en **"Probar Conexión"** en la configuración del TV:
- ✅ Verde = Funciona
- ❌ Rojo = Problema de conexión

Si es rojo:
1. Ve al TV → Opciones para desarrolladores
2. Verifica que "Depuración inalámbrica" esté activa
3. Vuelve a hacer el pairing

---

## Nota Importante

**El pairing se pierde si:**
- Apagas el TV completamente (desenchufas)
- Desactivas "Depuración inalámbrica"
- Cambias de red WiFi

**En esos casos, simplemente vuelve a hacer el pairing** (Paso 4). Es rápido, toma solo 30 segundos.

---

## Resumen Ultra Rápido

1. Termux: `pkg install android-tools`
2. TV: Activar "Depuración inalámbrica"
3. App: Agregar TV con IP y marcar "Usar ADB"
4. App: Hacer pairing con código del TV
5. ¡Listo! 🎯

---

## Ventajas de este Método

✅ Todo desde la tablet (no necesitas PC)
✅ Interfaz visual fácil de usar
✅ Funciona con TVs Philips 2016+ que no tienen JointSpace
✅ Control completo del TV
✅ Puedes agregar múltiples TVs

---

¿Problemas? Verifica:
1. Tu tablet y TV están en la **misma WiFi**
2. ADB está instalado en Termux: `adb version`
3. "Depuración inalámbrica" está **activada** en el TV
4. La IP del TV es correcta
5. Marcaste "Usar ADB" al agregar el TV

¡Disfruta controlando tu TV desde la app! 📺✨
