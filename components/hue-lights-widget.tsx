"use client"

import { useState, useEffect } from "react"
import { Lightbulb, Plus, Settings, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HueColorPicker } from "@/components/hue-color-picker"
import Link from "next/link"

interface HueLight {
  id: string
  name: string
  state: {
    on: boolean
    bri: number
    hue?: number
    sat?: number
    reachable: boolean
  }
  type: string
}

export function HueLightsWidget() {
  const [lights, setLights] = useState<HueLight[]>([])
  const [isConfigured, setIsConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedLight, setSelectedLight] = useState<HueLight | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    setLoading(true)
    try {
      // Check if Hue is configured
      const config = localStorage.getItem("hueConfig")
      if (!config) {
        setIsConfigured(false)
        setLoading(false)
        return
      }

      const { bridgeIp, username } = JSON.parse(config)
      if (!bridgeIp || !username) {
        setIsConfigured(false)
        setLoading(false)
        return
      }

      setIsConfigured(true)
      await fetchLights()
    } catch (error) {
      console.error("[v0] Error checking Hue config:", error)
      setIsConfigured(false)
      setLoading(false)
    }
  }

  const fetchLights = async () => {
    try {
      const config = localStorage.getItem("hueConfig")
      if (!config) return

      const { bridgeIp, username } = JSON.parse(config)
      
      const response = await fetch(`/api/hue/lights?bridgeIp=${bridgeIp}&username=${username}`)
      
      if (!response.ok) {
        console.error("[v0] Error fetching lights")
        return
      }

      const data = await response.json()
      
      // Convert to array and get order from localStorage
      const lightsArray = Object.entries(data).map(([id, light]: [string, any]) => ({
        id,
        name: light.name,
        state: light.state,
        type: light.type,
      }))

      // Get saved order
      const savedOrder = localStorage.getItem("hueLightsOrder")
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder)
        lightsArray.sort((a, b) => {
          const aIndex = orderIds.indexOf(a.id)
          const bIndex = orderIds.indexOf(b.id)
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
      }

      setLights(lightsArray)
    } catch (error) {
      console.error("[v0] Error fetching lights:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLight = async (lightId: string) => {
    const light = lights.find(l => l.id === lightId)
    if (!light) return

    const newState = !light.state.on

    // Optimistic update
    setLights(lights.map(l => 
      l.id === lightId 
        ? { ...l, state: { ...l.state, on: newState } }
        : l
    ))

    try {
      const config = localStorage.getItem("hueConfig")
      if (!config) return

      const { bridgeIp, username } = JSON.parse(config)

      await fetch(`/api/hue/lights/${lightId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bridgeIp,
          username,
          state: { on: newState }
        })
      })
    } catch (error) {
      console.error("[v0] Error toggling light:", error)
      // Revert on error
      await fetchLights()
    }
  }

  const openColorPicker = (light: HueLight) => {
    setSelectedLight(light)
    setShowColorPicker(true)
  }

  const updateColor = async (hue: number, sat: number) => {
    if (!selectedLight) return

    // Optimistic update inmediato
    const updatedLight = {
      ...selectedLight,
      state: { ...selectedLight.state, hue, sat, on: true }
    }
    setSelectedLight(updatedLight)
    setLights(lights.map(l => l.id === selectedLight.id ? updatedLight : l))
  }

  const updateBrightness = async (bri: number) => {
    if (!selectedLight) return

    // Optimistic update inmediato
    const updatedLight = {
      ...selectedLight,
      state: { ...selectedLight.state, bri, on: true }
    }
    setSelectedLight(updatedLight)
    setLights(lights.map(l => l.id === selectedLight.id ? updatedLight : l))
  }

  // Send updates to API with debounce (only when user stops dragging)
  useEffect(() => {
    if (!selectedLight) return

    const timer = setTimeout(async () => {
      try {
        const config = localStorage.getItem("hueConfig")
        if (!config) return

        const { bridgeIp, username } = JSON.parse(config)

        await fetch(`/api/hue/lights/${selectedLight.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bridgeIp,
            username,
            state: { 
              hue: selectedLight.state.hue, 
              sat: selectedLight.state.sat,
              bri: selectedLight.state.bri,
              on: true 
            }
          })
        })
      } catch (error) {
        console.error("[v0] Error updating light:", error)
      }
    }, 300) // Wait 300ms after last change before sending

    return () => clearTimeout(timer)
  }, [selectedLight?.state.hue, selectedLight?.state.sat, selectedLight?.state.bri])

  const getLightColor = (light: HueLight): string => {
    if (!light.state.on) return "oklch(0.3 0.02 250)"
    
    if (light.state.hue !== undefined && light.state.sat !== undefined) {
      const hue = (light.state.hue / 65535) * 360
      const sat = (light.state.sat / 254) * 100
      return `hsl(${hue}, ${sat}%, 60%)`
    }
    
    return "oklch(0.7 0.2 60)" // Default warm white
  }

  // Not configured state
  if (!isConfigured && !loading) {
    return (
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.2_60)]/20 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-[oklch(0.7_0.2_60)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Mis Luces</h3>
            <p className="text-xs text-muted-foreground">Philips Hue</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-yellow-400" />
          <div>
            <p className="font-semibold mb-1">Philips Hue no configurado</p>
            <p className="text-sm text-muted-foreground">
              Conectá tu Hue Bridge para controlar tus luces desde aquí
            </p>
          </div>
          <Link href="/lights">
            <Button className="rounded-xl">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Philips Hue
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.2_60)]/20 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-[oklch(0.7_0.2_60)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Mis Luces</h3>
            <p className="text-xs text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.2_60)]/20 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-[oklch(0.7_0.2_60)]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Mis Luces</h3>
              <p className="text-xs text-muted-foreground">
                {lights.filter(l => l.state.on).length} de {lights.length} encendidas
              </p>
            </div>
          </div>
          <Link href="/lights">
            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Lights scroll horizontal */}
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-3 pb-2" style={{ minWidth: 'min-content' }}>
            {lights.map((light) => {
              const lightColor = getLightColor(light)
              const supportsColor = light.type.toLowerCase().includes('color')

              return (
                <div
                  key={light.id}
                  className="flex-shrink-0 w-[140px]"
                >
                  <div className="glass rounded-2xl overflow-hidden">
                    {/* Color area - clickable for color picker */}
                    <button
                      onClick={() => supportsColor && light.state.on && openColorPicker(light)}
                      disabled={!supportsColor || !light.state.on}
                      className={`w-full aspect-square flex items-center justify-center transition-all ${
                        supportsColor && light.state.on ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                      }`}
                      style={{ 
                        backgroundColor: lightColor,
                        opacity: light.state.on ? 1 : 0.3
                      }}
                    >
                      <Lightbulb 
                        className="w-12 h-12 text-white drop-shadow-lg"
                        style={{ 
                          opacity: light.state.on ? 1 : 0.5,
                          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                        }}
                      />
                    </button>

                    {/* Info and toggle */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{light.name}</p>
                          {light.state.on && (
                            <p className="text-xs text-muted-foreground">
                              {Math.round((light.state.bri / 254) * 100)}%
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={light.state.on}
                          onCheckedChange={() => toggleLight(light.id)}
                          disabled={!light.state.reachable}
                          className="flex-shrink-0"
                        />
                      </div>
                      {!light.state.reachable && (
                        <p className="text-xs text-red-400">No disponible</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add more card */}
            <Link href="/lights" className="flex-shrink-0 w-[140px]">
              <div className="glass rounded-2xl h-full flex flex-col items-center justify-center p-6 hover:scale-105 transition-transform cursor-pointer">
                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs text-center text-muted-foreground">Ver todas</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Color Picker Modal */}
      {selectedLight && (
        <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
          <DialogContent className="glass-strong border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: getLightColor(selectedLight) }}
                >
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold">{selectedLight.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {Math.round((selectedLight.state.bri / 254) * 100)}% brillo
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Color Picker */}
              <HueColorPicker
                lightId={selectedLight.id}
                currentHue={selectedLight.state.hue}
                currentSat={selectedLight.state.sat}
                currentBri={selectedLight.state.bri}
                onColorChange={updateColor}
                onBrightnessChange={updateBrightness}
              />

              {/* Brightness Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Brillo</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((selectedLight.state.bri / 254) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="254"
                  value={selectedLight.state.bri}
                  onChange={(e) => updateBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-background/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}