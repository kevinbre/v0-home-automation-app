"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun, Wind, Droplets, Gauge, Eye, Navigation, Sunrise, Sunset, MapPin, RefreshCw, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface WeatherData {
  temp: number
  feelsLike: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  windDirection: number
  windGust?: number
  pressure: number
  visibility: number
  sunrise: number
  sunset: number
  cloudiness: number
  city: string
  icon: string
  isMockData?: boolean // Flag para saber si son datos simulados
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchWeather()
    // Auto-refresh every 1 minute
    const interval = setInterval(fetchWeather, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    try {
      const savedCity = localStorage.getItem("weatherCity") || "Rosario"
      const response = await fetch(`/api/weather?city=${encodeURIComponent(savedCity)}`)

      if (response.ok) {
        const data = await response.json()
        setWeather(data)
      } else {
        setError("No se pudo cargar el clima")
      }
    } catch (error) {
      console.error("[v0] Error fetching weather:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    const cond = condition.toLowerCase()
    if (cond.includes("sol") || cond.includes("clear") || cond.includes("despej")) {
      return <Sun className="w-8 h-8 text-yellow-400" />
    } else if (cond.includes("nub") || cond.includes("cloud")) {
      return <Cloud className="w-8 h-8 text-gray-400" />
    } else if (cond.includes("lluv") || cond.includes("rain")) {
      return <CloudRain className="w-8 h-8 text-blue-400" />
    }
    return <Sun className="w-8 h-8 text-yellow-400" />
  }

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getUVLevel = (cloudiness: number): string => {
    if (cloudiness > 70) return "Bajo"
    if (cloudiness > 40) return "Moderado"
    if (cloudiness > 20) return "Alto"
    return "Muy Alto"
  }

  if (loading && !weather) {
    return (
      <div className="glass-strong rounded-3xl p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="glass-strong rounded-3xl p-6">
        <div className="text-center">
          <p className="text-sm text-red-400 mb-3">{error || "Error al cargar"}</p>
          <Button onClick={fetchWeather} size="sm" className="rounded-xl">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Widget compacto */}
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        {/* Indicador de datos mock */}
        {weather.isMockData && (
          <div className="glass rounded-xl p-2 border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-xs text-center text-yellow-400 font-medium">
              📊 Datos simulados - API key inválida o no activada
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.2_60)]/20 flex items-center justify-center">
              {getWeatherIcon(weather.condition)}
            </div>
            <div>
              <h3 className="text-lg font-bold">Clima</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {weather.city}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowModal(true)}
              className="rounded-xl h-8 w-8"
              title="Ver detalles"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchWeather}
              disabled={loading}
              className="rounded-xl h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Info compacta */}
        <div className="flex items-end gap-3">
          <div>
            <span className="text-4xl font-bold">{weather.temp}°</span>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{weather.description}</p>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass rounded-xl p-2 text-center">
            <Wind className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-xs font-semibold">{weather.windSpeed} km/h</p>
            <p className="text-xs text-muted-foreground">{getWindDirection(weather.windDirection)}</p>
          </div>
          <div className="glass rounded-xl p-2 text-center">
            <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-400" />
            <p className="text-xs font-semibold">{weather.humidity}%</p>
            <p className="text-xs text-muted-foreground">Humedad</p>
          </div>
          <div className="glass rounded-xl p-2 text-center">
            <Gauge className="w-4 h-4 mx-auto mb-1 text-purple-400" />
            <p className="text-xs font-semibold">{weather.pressure}</p>
            <p className="text-xs text-muted-foreground">hPa</p>
          </div>
        </div>
      </div>

      {/* Modal expandido */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-strong border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              {getWeatherIcon(weather.condition)}
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Clima en {weather.city}</h2>
                <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
              </div>
              {weather.isMockData && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-medium whitespace-nowrap">
                  Datos simulados
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">{/* Scroll solo en el contenido */}
            {/* Temperatura principal */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold">{weather.temp}°</span>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      <span>Sensación</span>
                      <span className="font-semibold text-lg">{weather.feelsLike}°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de estadísticas detalladas */}
            <div className="grid grid-cols-2 gap-3">
              {/* Viento */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wind className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold">Viento</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">{weather.windSpeed}</span>
                  <span className="text-sm text-muted-foreground">km/h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation 
                    className="w-4 h-4 text-primary" 
                    style={{ transform: `rotate(${weather.windDirection}deg)` }}
                  />
                  <span className="text-sm font-medium">{getWindDirection(weather.windDirection)}</span>
                </div>
                {weather.windGust && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ráfagas hasta {weather.windGust} km/h
                  </p>
                )}
              </div>

              {/* Humedad */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold">Humedad</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">{weather.humidity}</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${weather.humidity}%` }}
                  />
                </div>
              </div>

              {/* Presión */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-semibold">Presión</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold">{weather.pressure}</span>
                  <span className="text-sm text-muted-foreground">hPa</span>
                </div>
                <span className={`text-sm font-medium ${
                  weather.pressure > 1013 ? "text-green-400" : 
                  weather.pressure < 1010 ? "text-red-400" : "text-yellow-400"
                }`}>
                  {weather.pressure > 1013 ? "Alta" : weather.pressure < 1010 ? "Baja" : "Normal"}
                </span>
              </div>

              {/* Visibilidad */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-semibold">Visibilidad</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold">{weather.visibility}</span>
                  <span className="text-sm text-muted-foreground">km</span>
                </div>
                <span className="text-sm font-medium text-cyan-400">
                  {weather.visibility > 10 ? "Excelente" : weather.visibility > 5 ? "Buena" : "Limitada"}
                </span>
              </div>
            </div>

            {/* Sol */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-4 flex items-center gap-3">
                <Sunrise className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Amanecer</p>
                  <p className="text-lg font-semibold">{formatTime(weather.sunrise)}</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-4 flex items-center gap-3">
                <Sunset className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Atardecer</p>
                  <p className="text-lg font-semibold">{formatTime(weather.sunset)}</p>
                </div>
              </div>
            </div>

            {/* Nubosidad y UV */}
            <div className="space-y-3">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-semibold">Nubosidad</span>
                  </div>
                  <span className="text-lg font-bold">{weather.cloudiness}%</span>
                </div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-gray-400 rounded-full transition-all"
                    style={{ width: `${weather.cloudiness}%` }}
                  />
                </div>
              </div>

              <div className="glass rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-semibold">Índice UV (estimado)</span>
                </div>
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${
                  getUVLevel(weather.cloudiness) === "Muy Alto" ? "bg-red-500/20 text-red-400" :
                  getUVLevel(weather.cloudiness) === "Alto" ? "bg-orange-500/20 text-orange-400" :
                  getUVLevel(weather.cloudiness) === "Moderado" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-green-500/20 text-green-400"
                }`}>
                  {getUVLevel(weather.cloudiness)}
                </span>
              </div>
            </div>

            {/* Última actualización */}
            <div className="space-y-2">
              {weather.isMockData && (
                <div className="glass rounded-2xl p-3 border border-yellow-500/30 bg-yellow-500/10">
                  <p className="text-xs text-yellow-400 text-center">
                    ⚠️ <strong>Usando datos simulados</strong> - Tu API key es inválida o aún no está activada. 
                    Las keys nuevas pueden tardar hasta 2 horas en activarse.
                  </p>
                </div>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Actualización automática cada minuto • Última: {new Date().toLocaleTimeString("es-ES")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}