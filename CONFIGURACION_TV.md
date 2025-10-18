# Configuración de Smart TV

## Mejoras Implementadas

Hemos mejorado la sección de control de TV para que puedas configurar la IP de tu televisor directamente desde la interfaz, sin necesidad de editar archivos de código.

### Características Nuevas

1. **Gestión de Múltiples TVs**: Ahora puedes agregar, editar y eliminar múltiples Smart TVs desde la interfaz.

2. **Configuración de IP desde la UI**: Ya no necesitas editar el código. Puedes configurar la IP de cada TV desde el panel de configuración.

3. **Persistencia de Datos**: Todas las configuraciones se guardan automáticamente en `localStorage` y se mantienen entre sesiones.

4. **Validación de IP**: El sistema valida que las direcciones IP sean correctas antes de guardarlas.

5. **Soporte para Múltiples Marcas**: Puedes especificar la marca de tu TV (Philips, Samsung, LG, u Otra).

## Cómo Usar

### 1. Acceder a la Configuración

- Ve a la página `/tv` (Control de Smart TV)
- Haz clic en el botón "Configurar" en la parte superior derecha

### 2. Agregar un Nuevo TV

1. En el modal de configuración, haz clic en "Agregar Nuevo TV"
2. Completa los campos:
   - **Nombre**: Ej: "Smart TV Sala"
   - **Ubicación**: Ej: "Sala de Estar"
   - **Dirección IP**: Ej: "192.168.1.100"
   - **Marca**: Selecciona la marca de tu TV
3. Haz clic en "Agregar"

### 3. Editar un TV Existente

1. En el modal de configuración, busca el TV que quieres editar
2. Haz clic en el ícono de editar (lápiz)
3. Modifica los campos que necesites
4. Haz clic en "Guardar"

### 4. Eliminar un TV

1. En el modal de configuración, busca el TV que quieres eliminar
2. Haz clic en el ícono de eliminar (tacho de basura)
3. Confirma la eliminación

## Cómo Encontrar la IP de tu TV Philips

### Método 1: Desde el Menú del TV

1. Presiona el botón **Home** en tu control remoto
2. Ve a **Configuración** (Settings)
3. Selecciona **Red** (Network) o **Wireless and Networks**
4. Selecciona **Ver configuración de red** (View network settings)
5. Busca **Dirección IP** (IP Address)
6. Anota la IP (debería verse como: `192.168.1.100`)

### Método 2: Desde tu Router

1. Accede a la interfaz web de tu router (usualmente `192.168.1.1` o `192.168.0.1`)
2. Busca la sección "Dispositivos conectados" o "DHCP Clients"
3. Busca un dispositivo con el nombre de tu TV o marca Philips
4. Anota la dirección IP asignada

## Estructura de Datos

Los datos se almacenan en `localStorage` bajo la clave `smartTvs` en formato JSON:

```json
[
  {
    "id": "1",
    "name": "Smart TV Sala",
    "location": "Sala de Estar",
    "ipAddress": "192.168.1.100",
    "brand": "philips",
    "status": false,
    "volume": 30,
    "muted": false,
    "channel": 105,
    "input": "HDMI 1",
    "playing": false
  }
]
```

## Archivos Modificados

- **`components/tv-settings-modal.tsx`**: Nuevo componente para gestionar la configuración de TVs
- **`components/tv-control.tsx`**: Actualizado para usar configuración desde localStorage
- **`components/ui/select.tsx`**: Nuevo componente UI para selectores
- **`app/settings/page.tsx`**: Actualizado con información sobre configuración de TV

## Solución de Problemas

### El TV no responde a los comandos

1. Verifica que la IP sea correcta
2. Asegúrate de que el TV y tu tablet/dispositivo estén en la misma red WiFi
3. Verifica que la API de Philips TV esté configurada correctamente en `/api/philips-tv`

### No puedo encontrar la IP de mi TV

- Asegúrate de que tu TV esté conectado a WiFi
- Reinicia el TV y vuelve a intentar
- Usa el Método 2 (desde el router) si el Método 1 no funciona

### Los cambios no se guardan

- Verifica que localStorage esté habilitado en tu navegador
- Limpia la caché del navegador y vuelve a intentar
- Verifica la consola del navegador para errores

## Notas Técnicas

- La validación de IP acepta direcciones IPv4 en formato `xxx.xxx.xxx.xxx` donde cada octeto está entre 0-255
- Los datos persisten solo en el dispositivo actual (localStorage)
- Si necesitas sincronizar entre dispositivos, considera implementar un backend
