"use client"

import { useState, useEffect } from "react"
import { Lightbulb, Settings, RefreshCw, AlertCircle, Zap, ZapOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HueColorPicker } from "@/components/hue-color-picker"

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

interface HueConfig {
  bridgeIp: string
  username: string
}

export function LightsControlRedesigned() {
  const [lights, setLights] = useState<Record<string, HueLight>>({})
  const [config, setConfig] = useState<HueConfig>({ bridgeIp: "", username: "" })
  const [showConfig, setShowConfig] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLight, setSelectedLight] = useState<HueLight | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    if (config.bridgeIp && config.username) {
      fetchLights()
    }
  }, [config])

  const loadConfig = () => {
    const savedConfig = localStorage.getItem("hueConfig")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        if (parsed.bridgeIp && parsed.username) {
          setConfig(parsed)
          setShowConfig(false)
        } else {
          setShowConfig(true)
        }
      } catch (err) {
        setShowConfig(true)
      }
    } else {
      setShowConfig(true)
    }
  }

  const saveConfig = () => {
    try {
      setLoading(true)
      setError(null)
      localStorage.setItem("hueConfig", JSON.stringify(config))
      setShowConfig(false)
      fetchLights()
    } catch (err) {
      setError("Error al guardar la configuración")
    } finally {
      setLoading(false)
    }
  }

  const fetchLights = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/hue/lights?bridgeIp=${config.bridgeIp}&username=${config.username}`
      )

      if (!response.ok) {
        setError("Error al conectar con el bridge")
        return
      }

      const data = await response.json()

      if (Array.isArray(data) && data[0]?.error) {
        setError(`Error: ${data[0].error.description}`)
        return
      }

      const transformedLights: Record<string, HueLight> = {}
      Object.entries(data).forEach(([id, light]: [string, any]) => {
        transformedLights[id] = {
          id,
          name: light.name,
          state: light.state,
          type: light.type,
        }
      })

      setLights(transformedLights)
    } catch (err: any) {
      setError("Error de conexión con el bridge")
    } finally {
      setLoading(false)
    }
  }

  const toggleLight = async (lightId: string) => {
    const light = lights[lightId]
    if (!light) return

    const newState = !light.state.on
    setLights((prev) => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        state: { ...prev[lightId].state, on: newState },
      },
    }))

    try {
      await fetch(`/api/hue/lights/${lightId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bridgeIp: config.bridgeIp,
          username: config.username,
          state: { on: newState },
        }),
      })
    } catch (err) {
      await fetchLights()
    }
  }

  const toggleAllLights = async (turnOn: boolean) => {
    // Optimistic update
    const updatedLights = { ...lights }
    Object.keys(updatedLights).forEach(id => {
      updatedLights[id] = {
        ...updatedLights[id],
        state: { ...updatedLights[id].state, on: turnOn }
      }
    })
    setLights(updatedLights)

    // Send to each light
    try {
      const promises = Object.keys(lights).map(lightId =>
        fetch(`/api/hue/lights/${lightId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bridgeIp: config.bridgeIp,
            username: config.username,
            state: { on: turnOn },
          }),
        })
      )
      await Promise.all(promises)
    } catch (err) {
      await fetchLights()
    }
  }

  const openLightControl = (light: HueLight) => {
    if (light.type.toLowerCase().includes('color')) {
      setSelectedLight(light)
      setShowColorPicker(true)
    }
  }

  const updateColor = (hue: number, sat: number) => {
    if (!selectedLight) return
    const updated = {
      ...selectedLight,
      state: { ...selectedLight.state, hue, sat, on: true }
    }
    setSelectedLight(updated)
    setLights(prev => ({ ...prev, [updated.id]: updated }))
  }

  const updateBrightness = (bri: number) => {
    if (!selectedLight) return
    const updated = {
      ...selectedLight,
      state: { ...selectedLight.state, bri, on: true }
    }
    setSelectedLight(updated)
    setLights(prev => ({ ...prev, [updated.id]: updated }))
  }

  // Debounced API call
  useEffect(() => {
    if (!selectedLight) return

    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/hue/lights/${selectedLight.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bridgeIp: config.bridgeIp,
            username: config.username,
            state: {
              hue: selectedLight.state.hue,
              sat: selectedLight.state.sat,
              bri: selectedLight.state.bri,
              on: true
            }
          })
        })
      } catch (err) {
        console.error("Error updating light:", err)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [selectedLight?.state])

  const getLightColor = (light: HueLight): string => {
    if (!light.state.on) return "oklch(0.25 0.02 250)"

    if (light.state.hue !== undefined && light.state.sat !== undefined) {
      const hue = (light.state.hue / 65535) * 360
      const sat = (light.state.sat / 254) * 100
      const lightness = 50 + (light.state.bri / 254) * 20
      return `hsl(${hue}, ${sat}%, ${lightness}%)`
    }

    return "oklch(0.7 0.2 60)"
  }

  const lightsArray = Object.values(lights)
  const lightsOn = lightsArray.filter(l => l.state.on).length

  // Config Modal
  if (showConfig) {
    return (
      <div className="glass-strong rounded-3xl p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Configuración de Philips Hue</h2>
            <p className="text-sm text-muted-foreground">Conectá tu Hue Bridge para comenzar</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bridgeIp">IP del Hue Bridge</Label>
              <Input
                id="bridgeIp"
                placeholder="192.168.1.100"
                value={config.bridgeIp}
                onChange={(e) => setConfig({ ...config, bridgeIp: e.target.value })}
                className="glass rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="tu-username-aqui"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="glass rounded-xl font-mono text-sm"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={saveConfig}
              disabled={loading || !config.bridgeIp || !config.username}
              className="w-full rounded-2xl"
              size="lg"
            >
              {loading ? "Conectando..." : "Conectar con Philips Hue"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading && lightsArray.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-lg font-medium">Cargando luces...</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats y controles globales */}
        <div className="glass-strong rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold">{lightsOn}</p>
                <p className="text-sm text-muted-foreground">Encendidas</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-4xl font-bold">{lightsArray.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => toggleAllLights(false)}
                variant="outline"
                className="rounded-2xl"
                disabled={lightsOn === 0}
              >
                <ZapOff className="w-4 h-4 mr-2" />
                Apagar Todas
              </Button>
              <Button
                onClick={() => toggleAllLights(true)}
                className="rounded-2xl"
                disabled={lightsOn === lightsArray.length}
              >
                <Zap className="w-4 h-4 mr-2" />
                Encender Todas
              </Button>
              <Button
                onClick={fetchLights}
                variant="outline"
                size="icon"
                className="rounded-2xl"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                onClick={() => setShowConfig(true)}
                variant="outline"
                size="icon"
                className="rounded-2xl"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de luces */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {lightsArray.map((light) => {
            const lightColor = getLightColor(light)
            const supportsColor = light.type.toLowerCase().includes('color')

            return (
              <div
                key={light.id}
                className="glass-strong rounded-3xl overflow-hidden hover:scale-105 transition-all"
              >
                {/* Color area */}
                <button
                  onClick={() => openLightControl(light)}
                  disabled={!supportsColor || !light.state.on}
                  className={`w-full aspect-square flex items-center justify-center transition-all relative ${
                    supportsColor && light.state.on ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  style={{
                    backgroundColor: lightColor,
                    opacity: light.state.on ? 1 : 0.4
                  }}
                >
                  <Lightbulb
                    className="w-16 h-16 text-white drop-shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
                    }}
                  />
                  {!light.state.reachable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                  )}
                </button>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{light.name}</p>
                      {light.state.on ? (
                        <p className="text-sm text-muted-foreground">
                          {Math.round((light.state.bri / 254) * 100)}% brillo
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Apagada</p>
                      )}
                    </div>
                    <Switch
                      checked={light.state.on}
                      onCheckedChange={() => toggleLight(light.id)}
                      disabled={!light.state.reachable}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {lightsArray.length === 0 && !loading && (
          <div className="glass-strong rounded-3xl p-12 text-center">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No se encontraron luces</h3>
            <p className="text-muted-foreground mb-4">
              Verificá que tu Hue Bridge esté conectado
            </p>
            <Button onClick={fetchLights} className="rounded-2xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Color Picker Modal */}
      {selectedLight && (
        <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
          <DialogContent className="glass-strong border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: getLightColor(selectedLight) }}
                >
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold">{selectedLight.name}</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {Math.round((selectedLight.state.bri / 254) * 100)}% brillo
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <HueColorPicker
                lightId={selectedLight.id}
                currentHue={selectedLight.state.hue}
                currentSat={selectedLight.state.sat}
                currentBri={selectedLight.state.bri}
                onColorChange={updateColor}
                onBrightnessChange={updateBrightness}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}