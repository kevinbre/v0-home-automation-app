# Configuración de ADB para Android TV

Para controlar TVs Philips modernos (2016+) como el **65PUD7908/77**, necesitas usar ADB (Android Debug Bridge) en lugar de la API JointSpace.

## Parte 1: Configurar el TV

### Paso 1: Habilitar Modo Desarrollador

1. En tu TV, presiona **Home**
2. Ve a **Configuración** → **Sistema** → **Acerca de**
3. Busca **"Versión de Android TV"** o **"Número de compilación"**
4. Presiona **7 veces seguidas** sobre esa opción
5. Aparecerá: **"Ahora eres un desarrollador"**

### Paso 2: Habilitar Depuración de Red

1. Ve a **Configuración** → **Sistema** → **Opciones de desarrollador**
2. Activa:
   - ✅ **Depuración USB**
   - ✅ **Depuración de red** (Network debugging)
   - ✅ **Permanecer activo** (Stay awake)

3. **Anota la IP y puerto** que aparece (ej: `192.168.100.228:5555`)

---

## Parte 2: Instalar ADB en Termux (Tablet Android)

### Instalación

Abre **Termux** en tu tablet y ejecuta:

```bash
# Actualizar repositorios
pkg update && pkg upgrade

# Instalar ADB
pkg install android-tools

# Verificar instalación
adb version
```

Deberías ver algo como:
```
Android Debug Bridge version 1.0.41
```

### Conectar al TV

```bash
# Reemplaza con la IP de tu TV
adb connect 192.168.100.228:5555
```

**Primera vez:**
- Aparecerá un mensaje en el TV pidiendo autorización
- Selecciona **"Permitir siempre desde este dispositivo"**
- Presiona **"Aceptar"**

**Verificar conexión:**
```bash
adb devices
```

Deberías ver:
```
List of devices attached
192.168.100.228:5555    device
```

---

## Parte 3: Probar Comandos

### Abrir YouTube

```bash
adb -s 192.168.100.228:5555 shell am start -n com.google.android.youtube.tv/.activity.ShellActivity
```

### Buscar en YouTube

```bash
adb -s 192.168.100.228:5555 shell am start -a android.intent.action.SEARCH -n com.google.android.youtube.tv/.activity.ShellActivity --es query "música relajante"
```

### Enviar teclas

```bash
# Home
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_HOME

# Atrás
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_BACK

# Volumen arriba
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_VOLUME_UP

# Volumen abajo
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_VOLUME_DOWN

# Silenciar
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_VOLUME_MUTE

# Power (Standby)
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_POWER
```

### Navegación

```bash
# Arriba
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_DPAD_UP

# Abajo
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_DPAD_DOWN

# Izquierda
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_DPAD_LEFT

# Derecha
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_DPAD_RIGHT

# OK (Confirmar)
adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_DPAD_CENTER
```

### Abrir Aplicaciones

```bash
# Netflix
adb -s 192.168.100.228:5555 shell monkey -p com.netflix.ninja 1

# Prime Video
adb -s 192.168.100.228:5555 shell monkey -p com.amazon.amazonvideo.livingroom 1

# Disney+
adb -s 192.168.100.228:5555 shell monkey -p com.disney.disneyplus 1
```

---

## Parte 4: Actualizar la App para usar ADB

He creado una nueva ruta API en `/api/android-tv-adb` que usa ADB en lugar de JointSpace.

### Actualizar componente de TV

En `components/tv-control.tsx`, necesitas cambiar la configuración del TV para que use ADB:

```typescript
// En la configuración del TV, agrega:
useAdb: true, // Usar ADB en lugar de JointSpace API
```

O simplemente la app detectará automáticamente si JointSpace no funciona y usará ADB.

---

## Solución de Problemas

### Error: "daemon not running"

```bash
adb kill-server
adb start-server
adb connect 192.168.100.228:5555
```

### Error: "connection refused"

1. Verifica que la depuración de red esté habilitada en el TV
2. Verifica que la IP sea correcta
3. Asegúrate de que el TV y la tablet están en la misma red WiFi

### Error: "unauthorized"

1. Verifica en la pantalla del TV si hay un mensaje de autorización
2. Acepta y marca "Permitir siempre"
3. Vuelve a conectar:
   ```bash
   adb disconnect 192.168.100.228:5555
   adb connect 192.168.100.228:5555
   ```

### La conexión se pierde

El TV puede cerrar la conexión ADB después de un tiempo. Para reconectar automáticamente:

```bash
# Script para mantener conexión
while true; do
  adb connect 192.168.100.228:5555
  sleep 60
done
```

---

## Alternativa: Usar ADB desde tu PC (Temporalmente)

Si quieres probar desde tu PC primero:

### Windows

1. Descarga [Platform Tools](https://developer.android.com/studio/releases/platform-tools)
2. Extrae el ZIP
3. Abre PowerShell en esa carpeta
4. Ejecuta:
   ```powershell
   .\adb.exe connect 192.168.100.228:5555
   .\adb.exe shell am start -n com.google.android.youtube.tv/.activity.ShellActivity
   ```

### Linux/Mac

```bash
# Instalar ADB
sudo apt install adb  # Ubuntu/Debian
brew install android-platform-tools  # Mac

# Conectar
adb connect 192.168.100.228:5555
adb shell am start -n com.google.android.youtube.tv/.activity.ShellActivity
```

---

## Ventajas de ADB vs JointSpace

✅ Funciona con todos los Android TV modernos
✅ Más comandos disponibles
✅ Control completo del sistema
✅ Puede instalar/desinstalar apps
✅ Acceso a logs del TV

❌ Requiere habilitar modo desarrollador
❌ La conexión puede perderse
❌ Requiere autorización inicial

---

## Scripts Útiles

### Conectar automáticamente al iniciar Termux

Crea un archivo `~/.bashrc` en Termux:

```bash
nano ~/.bashrc
```

Agrega:

```bash
# Auto-conectar a Android TV
adb connect 192.168.100.228:5555 2>/dev/null
```

Guarda (Ctrl+X, Y, Enter)

### Alias útiles

```bash
# Agregar a ~/.bashrc
alias tv-youtube='adb -s 192.168.100.228:5555 shell am start -n com.google.android.youtube.tv/.activity.ShellActivity'
alias tv-home='adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_HOME'
alias tv-back='adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_BACK'
alias tv-volup='adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_VOLUME_UP'
alias tv-voldown='adb -s 192.168.100.228:5555 shell input keyevent KEYCODE_VOLUME_DOWN'
```

Ahora puedes hacer:
```bash
tv-youtube
tv-home
tv-volup
```

---

## Próximos Pasos

1. **Habilita el modo desarrollador en tu TV** (Paso 1 y 2 de arriba)
2. **Instala ADB en Termux** (o prueba desde tu PC primero)
3. **Conecta y prueba** los comandos básicos
4. **Actualiza la app** para usar la nueva ruta `/api/android-tv-adb`

Una vez que funcione, tendrás **control total** sobre tu Philips TV desde la app! 🎉
