# App de Domótica - Smart Home Control

Aplicación moderna para controlar dispositivos de domótica con diseño glassmorphism inspirado en iOS.

## Características

- 🎨 Diseño glassmorphism moderno con efectos de vidrio y blur
- 💡 Control completo de luces Philips Hue
- 📺 Panel de control para Smart TV
- 🎤 Integración con Alexa
- ⚙️ Sistema de configuración y favoritos

## Philips Hue - Configuración

### En el preview de v0 (Modo Demo)

La aplicación usa datos simulados porque el preview de v0 no puede conectarse a dispositivos locales por CORS.
Puedes ver y probar toda la funcionalidad con las 5 luces de ejemplo.

### Para usar con tu bridge real (Descarga local)

1. **Descarga el proyecto** usando el botón de GitHub o Download ZIP

2. **Instala las dependencias:**
   \`\`\`bash
   npm install
   # o
   pnpm install
   \`\`\`

3. **Activa la API real:**
   - Abre `components/lights-control.tsx`
   - Cambia `const USE_MOCK_DATA = true` a `const USE_MOCK_DATA = false`

4. **Obtén tu username del bridge:**
   - Ve a `http://TU_IP_DEL_BRIDGE/debug/clip.html`
   - En URL pon: `/api`
   - En Message Body pon: `{"devicetype":"my_hue_app#user"}`
   - Presiona el botón físico del bridge
   - Haz clic en POST
   - Copia el username que te devuelve

5. **Corre la aplicación:**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Configura en la app:**
   - Ingresa la IP de tu bridge (ej: 192.168.100.17)
   - Ingresa el username que obtuviste
   - ¡Listo! Ahora controlas tus luces reales

## Solución de problemas

### Error de CORS
Si ves errores de CORS cuando corres localmente:
- Asegúrate de estar en la misma red que el bridge
- Verifica que la IP sea correcta
- Los bridges modernos de Philips Hue permiten CORS automáticamente

### No se conecta al bridge
- Verifica que el bridge esté encendido y conectado a la red
- Confirma que la IP sea correcta (puedes encontrarla en la app de Philips Hue)
- Asegúrate de haber presionado el botón del bridge al crear el username

## Tecnologías

- Next.js 15 con App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Philips Hue API local

## Estructura del proyecto

\`\`\`
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── lights/               # Panel de luces Philips Hue
│   ├── tv/                   # Panel de control de TV
│   ├── alexa/                # Panel de Alexa
│   └── settings/             # Configuración
├── components/
│   ├── lights-control.tsx    # Componente principal de luces
│   ├── tv-control.tsx        # Componente de control de TV
│   └── ...
└── README.md
