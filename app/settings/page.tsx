"use client"

import { SettingsPanel } from "@/components/settings-panel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import WeatherConfigModal from "@/components/weather-config-modal"
import CalendarConfigModal from "@/components/calendar-config-modal"

export default function SettingsPage() {
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showWeatherConfig, setShowWeatherConfig] = useState(false)
  const [showCalendarConfig, setShowCalendarConfig] = useState(false)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.2_0.15_250)] via-[oklch(0.15_0.1_280)] to-[oklch(0.18_0.12_230)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[oklch(0.5_0.3_250)] rounded-full blur-[120px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[oklch(0.5_0.3_280)] rounded-full blur-[100px] opacity-15 animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="glass rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-2xl glass-strong">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Configuración</h1>
                <p className="text-sm text-muted-foreground">Personaliza tu experiencia de casa inteligente</p>
              </div>
            </div>
            <Button
              onClick={() => setShowDownloadModal(true)}
              className="glass-strong rounded-2xl px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Descargar App</span>
            </Button>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Configuración de Clima</h2>
            <Button onClick={() => setShowWeatherConfig(true)} variant="ghost" size="sm" className="glass rounded-xl">
              Configurar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura tu ciudad para ver el clima actual. Por defecto: Rosario, Argentina
          </p>
        </div>

        <div className="glass-strong rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Configuración de Calendarios</h2>
            <Button onClick={() => setShowCalendarConfig(true)} variant="ghost" size="sm" className="glass rounded-xl">
              Agregar Calendario
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Conecta múltiples calendarios de Google para ver todos tus eventos en un solo lugar
          </p>
          <div className="space-y-2">
            <div className="glass rounded-2xl p-3 text-sm">
              <p className="font-medium">📝 Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground mt-2">
                <li>Ve a Google Calendar API Console</li>
                <li>Crea credenciales OAuth 2.0</li>
                <li>Agrega las credenciales aquí</li>
                <li>Autoriza el acceso a tus calendarios</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Instalación en Tablet</h2>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Para usar esta app en tu tablet Android, sigue estos pasos:</p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Haz clic en el botón "Descargar App" arriba o en los tres puntos (⋮) en v0</li>
              <li>Selecciona "Download ZIP" o "Push to GitHub"</li>
              <li>Transfiere el archivo a tu tablet</li>
              <li>Instala Termux y Node.js (ver INSTALACION.md)</li>
              <li>
                Ejecuta <code className="glass px-2 py-1 rounded">npm install && npm run dev</code>
              </li>
            </ol>
            <div className="glass rounded-2xl p-4 mt-4">
              <p className="font-semibold mb-2">Configuración de TV Philips</p>
              <p className="text-xs text-muted-foreground">
                Edita las IPs de tus TVs en <code className="glass px-1 rounded">components/tv-control.tsx</code>:
              </p>
              <pre className="glass rounded-xl p-3 mt-2 text-xs overflow-x-auto">
                {`ipAddress: "192.168.100.50" // Tu IP aquí`}
              </pre>
            </div>
          </div>
        </div>

        <SettingsPanel />
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Cómo Descargar la App</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDownloadModal(false)} className="rounded-2xl">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="glass-strong rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Push a GitHub desde v0
                </h3>
                <ol className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-8">
                  <li>Haz clic en el ícono de GitHub en la esquina superior derecha de v0</li>
                  <li>Selecciona "Push to GitHub" para crear un repositorio</li>
                  <li>Copia la URL del repositorio que se crea</li>
                </ol>
              </div>

              <div className="glass rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="glass-strong rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Deploy a Vercel (Opcional)
                </h3>
                <ol className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-8">
                  <li>Haz clic en "Publish" en v0 para deployar a Vercel</li>
                  <li>Esto te dará una URL pública para acceder a la app</li>
                  <li>Útil para probar antes de instalar en la tablet</li>
                </ol>
              </div>

              <div className="glass rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="glass-strong rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Clonar en tu Tablet
                </h3>
                <ol className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-8">
                  <li>Instala Termux en tu tablet desde F-Droid o Google Play</li>
                  <li>
                    En Termux: <code className="glass px-2 py-1 rounded">pkg install git nodejs</code>
                  </li>
                  <li>
                    Clona el repo: <code className="glass px-2 py-1 rounded">git clone [URL-del-repo]</code>
                  </li>
                  <li>
                    Navega: <code className="glass px-2 py-1 rounded">cd [nombre-del-repo]</code>
                  </li>
                </ol>
              </div>

              <div className="glass rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="glass-strong rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                  Instalar y Ejecutar
                </h3>
                <ol className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-8">
                  <li>
                    Instala dependencias: <code className="glass px-2 py-1 rounded">npm install</code>
                  </li>
                  <li>
                    Ejecuta la app: <code className="glass px-2 py-1 rounded">npm run dev</code>
                  </li>
                  <li>Abre el navegador en http://localhost:3000</li>
                </ol>
              </div>

              <div className="glass rounded-2xl p-4 bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm font-medium mb-2">💡 Ventajas de este método</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>No necesitas transferir archivos por USB</li>
                  <li>Puedes actualizar la app con git pull</li>
                  <li>Tienes backup en GitHub</li>
                  <li>Puedes deployar a Vercel para acceso remoto</li>
                </ul>
              </div>

              <Button onClick={() => setShowDownloadModal(false)} className="w-full glass-strong rounded-2xl py-6">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {showWeatherConfig && <WeatherConfigModal onClose={() => setShowWeatherConfig(false)} />}

      {showCalendarConfig && <CalendarConfigModal onClose={() => setShowCalendarConfig(false)} />}
    </div>
  )
}
