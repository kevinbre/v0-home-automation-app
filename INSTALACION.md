# Instalación en Tablet Android

## Método Recomendado: GitHub + Termux

Este método te permite descargar la app directamente en tu tablet sin necesidad de transferir archivos por USB.

### 1. Push a GitHub desde v0

1. En v0, haz clic en el ícono de **GitHub** en la esquina superior derecha
2. Selecciona **"Push to GitHub"** para crear un repositorio
3. Copia la URL del repositorio (ejemplo: `https://github.com/tu-usuario/smart-home-app`)

### 2. Deploy a Vercel (Opcional pero recomendado)

1. En v0, haz clic en **"Publish"** para deployar a Vercel
2. Esto te dará una URL pública para probar la app antes de instalarla
3. Útil para verificar que todo funciona correctamente

### 3. Instalar Termux en tu Tablet

1. Descarga **Termux** desde F-Droid (recomendado) o Google Play Store
2. Abre Termux y ejecuta:

\`\`\`bash
pkg update
pkg install git nodejs
\`\`\`

### 4. Clonar el Repositorio en tu Tablet

En Termux, ejecuta:

\`\`\`bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/smart-home-app.git

# Navegar al directorio
cd smart-home-app

# Instalar dependencias
npm install

# Ejecutar la app
npm run dev
\`\`\`

### 5. Acceder a la App

Abre Chrome o cualquier navegador en tu tablet y ve a:
\`\`\`
http://localhost:3000
\`\`\`

## Configuración de Philips Hue

El proyecto ya está configurado con `USE_MOCK_DATA = false`, por lo que se conectará directamente a tu bridge.

1. Asegúrate de que tu tablet esté en la misma red WiFi que tu Philips Hue Bridge
2. Abre la app y ve a la sección de Luces
3. Haz clic en "Configurar Philips Hue"
4. Ingresa la IP de tu bridge (ejemplo: 192.168.100.17)
5. Ingresa tu username (el que creaste en http://tu_ip/debug/clip.html)
6. Haz clic en "Guardar Configuración"

## Configuración de TV Philips con Android TV

Tu TV Philips con Android TV se puede controlar usando la API JointSpace.

### Encontrar la IP de tu TV

1. En tu TV Philips, ve a **Configuración → Red → Ver configuración de red**
2. Anota la dirección IP (ejemplo: 192.168.100.50)

### Configurar en la App

1. Abre la app en tu tablet
2. Ve a **Configuración** (ícono de engranaje)
3. En la sección "TV Philips", ingresa las IPs de tus TVs
4. Guarda la configuración

### Funciones Disponibles

La app puede controlar:
- ✅ Encender/Apagar
- ✅ Volumen y silencio
- ✅ Cambiar canales
- ✅ Navegación (arriba, abajo, izquierda, derecha, OK)
- ✅ Lanzar apps (Netflix, YouTube, etc.)
- ✅ Reproducir canales de YouTube favoritos
- ✅ Cambiar entradas HDMI

## Actualizar la App

Cuando hagas cambios en v0 y quieras actualizarlos en tu tablet:

\`\`\`bash
# En Termux, dentro del directorio de la app
git pull
npm install  # Solo si hay nuevas dependencias
npm run dev
\`\`\`

## Ventajas de este Método

- ✅ No necesitas transferir archivos por USB
- ✅ Puedes actualizar la app fácilmente con `git pull`
- ✅ Tienes backup automático en GitHub
- ✅ Puedes deployar a Vercel para acceso remoto
- ✅ Puedes trabajar en v0 y sincronizar cambios instantáneamente

## Solución de Problemas

### Error de CORS con Philips Hue
- Asegúrate de estar en la misma red WiFi
- Verifica que la IP del bridge sea correcta
- Los bridges modernos permiten CORS automáticamente

### La app no carga
- Verifica que Node.js esté instalado: `node --version`
- Reinstala dependencias: `rm -rf node_modules && npm install`
- Verifica que el puerto 3000 esté libre

### Git no funciona en Termux
- Ejecuta: `pkg install git`
- Verifica la conexión a internet
- Si el repo es privado, configura SSH keys

### YouTube no controla el TV
- La app usa la API JointSpace de Philips para lanzar YouTube
- Asegúrate de que YouTube esté instalado en tu TV
- Verifica que la IP del TV sea correcta
