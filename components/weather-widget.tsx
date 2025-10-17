"use client"

import { useEffect, useState } from "react"
import { Cloud, CloudRain, Sun, Wind, MapPin } from "lucide-react"

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  city: string
}

const USE_MOCK_DATA = false

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 22,
    condition: "Soleado",
    humidity: 65,
    windSpeed: 12,
    city: "Rosario",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!USE_MOCK_DATA) {
      fetchWeather()
    }
  }, [])

  const fetchWeather = async () => {
    setLoading(true)
    try {
      const savedCity = localStorage.getItem("weatherCity") || "Rosario"

      const response = await fetch(`/api/weather?city=${encodeURIComponent(savedCity)}`)

      if (response.ok) {
        const data = await response.json()
        setWeather(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching weather:", error)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = () => {
    const condition = weather.condition.toLowerCase()
    if (condition.includes("sol") || condition.includes("clear")) {
      return <Sun className="w-8 h-8 text-yellow-400" />
    } else if (condition.includes("nub") || condition.includes("cloud")) {
      return <Cloud className="w-8 h-8 text-gray-400" />
    } else if (condition.includes("lluv") || condition.includes("rain")) {
      return <CloudRain className="w-8 h-8 text-blue-400" />
    }
    return <Sun className="w-8 h-8 text-yellow-400" />
  }

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Clima</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {weather.city}
          </p>
        </div>
        {getWeatherIcon()}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-5xl font-bold">{weather.temp}°</span>
        <span className="text-lg text-muted-foreground mb-2 capitalize">{weather.condition}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Humedad</p>
          <p className="text-sm font-semibold">{weather.humidity}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Viento</p>
          <p className="text-sm font-semibold flex items-center gap-1">
            <Wind className="w-3 h-3" />
            {weather.windSpeed} km/h
          </p>
        </div>
      </div>
    </div>
  )
}
