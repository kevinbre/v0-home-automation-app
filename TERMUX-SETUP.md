# Instalación en Termux (Android)

Esta guía te ayudará a instalar y ejecutar la app de domótica en tu tablet Android usando Termux.

## Requisitos Previos

1. **Instalar Termux** desde F-Droid (NO desde Google Play Store)
   - Descarga F-Droid: https://f-droid.org/
   - Busca e instala "Termux" desde F-Droid

2. **Instalar Termux:API** (opcional, para funciones avanzadas)
   - También desde F-Droid

## Instalación Paso a Paso

### 1. Actualizar Termux

\`\`\`bash
pkg update && pkg upgrade
\`\`\`

### 2. Instalar Node.js y Git

\`\`\`bash
pkg install nodejs git
\`\`\`

Verifica la instalación:
\`\`\`bash
node --version
npm --version
git --version
\`\`\`

### 3. Clonar el Repositorio

\`\`\`bash
# Navega a tu directorio home
cd ~

# Clona el repositorio (reemplaza con tu URL de GitHub)
git clone https://github.com/TU_USUARIO/TU_REPO.git

# Entra al directorio
cd TU_REPO
\`\`\`

### 4. Instalar Dependencias

\`\`\`bash
# Instalar dependencias (esto puede tardar varios minutos)
npm install
\`\`\`

**Nota importante:** Si encuentras errores con módulos nativos, ejecuta:
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### 5. Configurar Variables de Entorno

Crea un archivo `.env.local`:
\`\`\`bash
nano .env.local
\`\`\`

Agrega tus configuraciones:
\`\`\`
# Philips Hue
NEXT_PUBLIC_HUE_BRIDGE_IP=192.168.100.17
NEXT_PUBLIC_HUE_USERNAME=W0qtleYTu2US8jLDZpaSlEoTX9JaFg87fums98cf

# Philips TV (si tienes)
NEXT_PUBLIC_PHILIPS_TV_IP_1=192.168.100.XX
NEXT_PUBLIC_PHILIPS_TV_IP_2=192.168.100.XX

# OpenWeather API (opcional)
OPENWEATHER_API_KEY=tu_api_key_aqui
\`\`\`

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

### 6. Ejecutar la Aplicación

\`\`\`bash
# Modo desarrollo
npm run dev
\`\`\`

La app estará disponible en: `http://localhost:3000`

### 7. Acceder desde tu Tablet

Abre el navegador en tu tablet y ve a:
- `http://localhost:3000`

O desde otros dispositivos en la misma red:
- `http://IP_DE_TU_TABLET:3000`

Para encontrar la IP de tu tablet:
\`\`\`bash
ifconfig wlan0
\`\`\`

## Ejecutar en Segundo Plano

Para que la app siga corriendo cuando cierres Termux:

1. Instalar `tmux`:
\`\`\`bash
pkg install tmux
\`\`\`

2. Crear una sesión:
\`\`\`bash
tmux new -s smart-home
\`\`\`

3. Ejecutar la app:
\`\`\`bash
cd ~/TU_REPO
npm run dev
\`\`\`

4. Desconectar de la sesión: `Ctrl+B` luego `D`

5. Reconectar más tarde:
\`\`\`bash
tmux attach -t smart-home
\`\`\`

## Solución de Problemas

### Error: "Cannot find module"
\`\`\`bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
\`\`\`

### Error: "Port 3000 already in use"
\`\`\`bash
# Matar el proceso en el puerto 3000
pkill -f "node.*3000"
\`\`\`

### La app es muy lenta
\`\`\`bash
# Ejecutar en modo producción (más rápido)
npm run build
npm start
\`\`\`

### Permisos de red
Si tienes problemas de conexión:
\`\`\`bash
termux-setup-storage
\`\`\`

## Mantener la App Actualizada

\`\`\`bash
cd ~/TU_REPO
git pull
npm install
npm run dev
\`\`\`

## Consejos

1. **Mantén Termux abierto**: Android puede matar el proceso si cierras la app
2. **Usa tmux**: Para mantener la app corriendo en segundo plano
3. **WiFi estable**: Asegúrate de estar en la misma red que tus dispositivos
4. **Batería**: Considera conectar la tablet a la corriente si la usas como hub permanente

## Acceso Remoto (Opcional)

Para acceder desde fuera de tu red local, considera:
1. Configurar port forwarding en tu router
2. Usar un servicio como ngrok
3. Deployar a Vercel y usar solo para la UI (las APIs locales seguirán funcionando)
