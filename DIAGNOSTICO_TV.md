# Diagnóstico de Problemas con Philips TV

## Problema: Los comandos no llegan al TV

Si configuraste la IP correctamente pero los comandos no funcionan, sigue estos pasos de diagnóstico:

### 1. Verificar la Conexión Básica

**Paso 1: Prueba de Ping**
```bash
# En Termux o tu computadora
ping 192.168.1.100  # Reemplaza con la IP de tu TV
```

Si el ping funciona → Tu dispositivo puede ver el TV en la red ✓
Si el ping NO funciona → Problema de red (ver sección "Problemas de Red")

**Paso 2: Probar la API del TV directamente**
```bash
# En Termux
curl http://192.168.1.100:1925/1/audio/volume
```

Si recibes una respuesta JSON → La API del TV está activa ✓
Si recibes error de conexión → Ver sección "La API no responde"

### 2. Usar el Botón "Probar Conexión"

En la aplicación:
1. Ve a `/tv` → "Configurar"
2. Haz clic en "Probar Conexión" junto a tu TV
3. Observa el resultado:
   - **Verde (Conectado)**: Todo bien, la comunicación funciona
   - **Rojo (Error de conexión)**: Revisa las secciones siguientes

### 3. Revisar la Consola del Navegador

**Cómo abrir la consola:**
- En Chrome/Firefox en Android: Menu → Tools → Developer Tools
- En escritorio: F12 o Ctrl+Shift+I

**Qué buscar:**
```
[v0] Philips TV API: POST http://192.168.1.100:1925/1/input/key {"key":"Standby"}
```

Si ves este mensaje → El comando se está enviando ✓

**Errores comunes:**
- `Failed to fetch`: Problema de red o CORS
- `404 Not Found`: La ruta de la API es incorrecta
- `Connection refused`: El puerto 1925 no está abierto

---

## Soluciones a Problemas Comunes

### Problema 1: La API no responde (Puerto 1925 cerrado)

**Solución: Habilitar JointSpace API en el TV**

1. **En tu TV Philips:**
   - Presiona **Home**
   - Ve a **Configuración** → **Ajustes de red** → **Wi-Fi con Miracast**
   - Activa **Wi-Fi con Miracast** (esto habilita la API)

2. **Alternativamente:**
   - Ve a **Configuración** → **General Settings** → **Network Settings**
   - Busca **JointSpace** o **Network API**
   - Actívalo

3. **Para TVs más nuevos (Android TV):**
   - La API JointSpace puede estar deshabilitada por defecto
   - Necesitas usar la API v6 con autenticación
   - Ver sección "API v6 con Autenticación"

### Problema 2: CORS Error (Cross-Origin)

**Síntoma:** Error en consola: `blocked by CORS policy`

**Solución:**
Este problema NO debería ocurrir porque estás usando una API route en Next.js (`/api/philips-tv`), que actúa como proxy y evita CORS.

Si aún así aparece:
1. Verifica que estás usando `/api/philips-tv` y no directamente `http://192.168.1.100:1925`
2. Asegúrate de que la app está corriendo en `http://localhost:3000` (no file://)

### Problema 3: El TV y la tablet están en redes diferentes

**Solución:**
1. Verifica que ambos dispositivos están conectados a la misma red WiFi
2. Desactiva "Aislamiento de AP" en tu router si está habilitado
3. Verifica que no hay subredes separadas (algunas routers tienen "Guest Network")

**Cómo verificar:**
```bash
# En Termux (tu tablet)
ip addr show wlan0

# Deberías ver algo como: inet 192.168.1.XXX/24
# Tu TV debería estar en el mismo rango: 192.168.1.YYY
```

### Problema 4: Firewall del Router

**Solución:**
Algunos routers bloquean comunicación entre dispositivos en la red local.

1. Accede a tu router (usualmente `192.168.1.1` o `192.168.0.1`)
2. Busca "AP Isolation" o "Client Isolation"
3. **Desactívalo**
4. Reinicia el router

### Problema 5: El TV usa API v6 (TVs más nuevos)

Los Philips TVs más nuevos (2016+) usan API v6 que requiere autenticación.

**Síntoma:** Recibes error 401 Unauthorized

**Solución:** Necesitas hacer pairing primero

```bash
# Paso 1: Generar credenciales
curl -X POST http://192.168.1.100:1926/6/pair/request \
  -H "Content-Type: application/json" \
  -d '{"scope":["read","write","control"],"device":{"device_name":"heliotrope","device_os":"Android","app_name":"Home Automation","type":"native","app_id":"com.home.automation","id":"homeautomation"}}'

# El TV mostrará un PIN en pantalla

# Paso 2: Confirmar pairing con el PIN
curl -X POST http://192.168.1.100:1926/6/pair/grant \
  -H "Content-Type: application/json" \
  -d '{"auth":{"auth_AppId":"1","pin":"XXXX","auth_timestamp":"0","auth_signature":"XXXXXXXXXXXX"},"device":{"device_name":"heliotrope","device_os":"Android","app_name":"Home Automation","type":"native","app_id":"com.home.automation","id":"homeautomation"}}'
```

**Nota:** Si tu TV requiere API v6, necesitarás modificar el archivo `app/api/philips-tv/route.ts` para incluir autenticación.

---

## Checklist de Diagnóstico Rápido

Marca cada ítem:

- [ ] La IP del TV es correcta (verificada en Configuración del TV)
- [ ] El TV y la tablet están en la misma red WiFi
- [ ] El ping a la IP del TV funciona
- [ ] El puerto 1925 o 1926 está abierto (curl funciona)
- [ ] No hay errores CORS en la consola
- [ ] La API JointSpace está habilitada en el TV
- [ ] "Probar Conexión" en la app muestra verde
- [ ] No hay firewall/AP isolation activo en el router

---

## Información del Sistema

**Versiones de API de Philips:**
- **API v1** (puerto 1925): TVs antiguos (2013-2015)
- **API v6** (puerto 1926): TVs nuevos (2016+) - requiere autenticación

**Cómo saber qué versión usa tu TV:**
```bash
# Probar v1
curl http://192.168.1.100:1925/1/system

# Probar v6
curl http://192.168.1.100:1926/6/system
```

---

## Comandos Útiles para Debuggear

**Ver volumen actual:**
```bash
curl http://192.168.1.100:1925/1/audio/volume
```

**Enviar comando de tecla:**
```bash
curl -X POST http://192.168.1.100:1925/1/input/key \
  -H "Content-Type: application/json" \
  -d '{"key":"Standby"}'
```

**Ver aplicaciones instaladas:**
```bash
curl http://192.168.1.100:1925/1/applications
```

**Abrir YouTube:**
```bash
curl -X POST http://192.168.1.100:1925/1/activities/launch \
  -H "Content-Type: application/json" \
  -d '{"intent":{"component":{"packageName":"com.google.android.youtube.tv","className":"com.google.android.apps.youtube.tv.activity.ShellActivity"},"action":"android.intent.action.MAIN"}}'
```

---

## Próximos Pasos

Si seguiste todos estos pasos y aún no funciona:

1. **Verifica el modelo de tu TV:**
   - Anota el modelo exacto (ej: 55PUS7303/12)
   - Busca en Google: "Philips [MODELO] JointSpace API"
   - Algunos modelos tienen la API deshabilitada por firmware

2. **Considera usar alternativas:**
   - **Android TV Remote**: Si tu TV tiene Android TV, puedes usar ADB
   - **HDMI-CEC**: Algunos comandos básicos por HDMI

3. **Reporta el problema:**
   - Abre un issue en el repositorio con:
     - Modelo de TV
     - Versión de firmware
     - Logs de la consola
     - Resultado de los comandos curl

---

## Testing Rápido desde la App

La aplicación ahora incluye un botón "Probar Conexión" en el panel de configuración de TVs.

**Cómo usarlo:**
1. Ve a Control de TV (`/tv`)
2. Haz clic en "Configurar"
3. Encuentra tu TV en la lista
4. Haz clic en "Probar Conexión"
5. Espera el resultado:
   - ✅ Verde = Funciona
   - ❌ Rojo = No funciona (revisa esta guía)

**Qué hace este botón:**
- Envía un comando `getVolume` al TV
- Verifica que la API responde
- No cambia ninguna configuración del TV
- Es seguro usarlo múltiples veces
