"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface WeatherConfigModalProps {
  onClose: () => void
}

export default function WeatherConfigModal({ onClose }: WeatherConfigModalProps) {
  const [city, setCity] = useState("Rosario")

  useEffect(() => {
    const savedCity = localStorage.getItem("weatherCity")
    if (savedCity) {
      setCity(savedCity)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem("weatherCity", city)
    onClose()
    window.location.reload() // Reload to fetch new weather
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Configurar Clima</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Ciudad</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Rosario, Buenos Aires, Córdoba"
              className="glass rounded-xl border-white/10"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Ingresa el nombre de tu ciudad para ver el clima actual
            </p>
          </div>

          <div className="glass rounded-2xl p-4 bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs font-medium mb-1">💡 Nota</p>
            <p className="text-xs text-muted-foreground">
              Para usar datos reales del clima, necesitas agregar una API key de OpenWeatherMap en las variables de
              entorno (OPENWEATHER_API_KEY)
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="ghost" className="flex-1 glass rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 glass-strong rounded-xl">
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
