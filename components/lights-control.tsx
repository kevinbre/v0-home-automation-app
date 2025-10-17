"use client"

import { useState, useEffect } from "react"
import { Lightbulb, Settings, RefreshCw, AlertCircle, ChevronDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HueColorPicker } from "@/components/hue-color-picker"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface HueLight {
  id: string
  name: string
  state: {
    on: boolean
    bri: number
    hue?: number
    sat?: number
    ct?: number
    reachable: boolean
  }
  type: string
  modelid: string
}

interface HueConfig {
  bridgeIp: string
  username: string
}

const MOCK_LIGHTS: Record<string, HueLight> = {
  "1": {
    id: "1",
    name: "Sala Principal",
    state: { on: true, bri: 200, hue: 8000, sat: 200, reachable: true },
    type: "Extended color light",
    modelid: "LCT015",
  },
  "2": {
    id: "2",
    name: "Cocina",
    state: { on: false, bri: 150, ct: 366, reachable: true },
    type: "Color temperature light",
    modelid: "LTW015",
  },
  "3": {
    id: "3",
    name: "Dormitorio",
    state: { on: true, bri: 100, hue: 46920, sat: 254, reachable: true },
    type: "Extended color light",
    modelid: "LCT015",
  },
  "4": {
    id: "4",
    name: "Baño",
    state: { on: true, bri: 254, ct: 153, reachable: true },
    type: "Color temperature light",
    modelid: "LTW015",
  },
  "5": {
    id: "5",
    name: "Escritorio",
    state: { on: false, bri: 180, hue: 25500, sat: 254, reachable: true },
    type: "Extended color light",
    modelid: "LCT015",
  },
}

const USE_MOCK_DATA = false

export function LightsControl() {
  const [lights, setLights] = useState<Record<string, HueLight>>({})
  const [config, setConfig] = useState<HueConfig>({ bridgeIp: "", username: "" })
  const [showConfig, setShowConfig] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedLightId, setExpandedLightId] = useState<string | null>(null)

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setLights(MOCK_LIGHTS)
      setConfig({ bridgeIp: "192.168.100.17", username: "demo-user" })
      return
    }
    loadConfig()
  }, [])

  useEffect(() => {
    if (!USE_MOCK_DATA && config.bridgeIp && config.username) {
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
        console.error("[v0] Error parsing saved config:", err)
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
      console.error("[v0] Error saving config:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLights = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = `http://${config.bridgeIp}/api/${config.username}/lights`
      console.log("[v0] Fetching lights directly from bridge:", url)

      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const text = await response.text()
        console.error("[v0] Error response:", text)
        setError(`Error del bridge: ${response.status} ${response.statusText}`)
        return
      }

      const data = await response.json()
      console.log("[v0] Response data keys:", Object.keys(data))

      if (Array.isArray(data) && data[0]?.error) {
        const hueError = data[0].error
        console.error("[v0] Hue API error:", hueError)
        setError(`Error del bridge: ${hueError.description}`)
        return
      }

      if (Object.keys(data).length === 0) {
        setError("No se encontraron luces. Verifica que tu bridge tenga luces configuradas.")
        return
      }

      const transformedLights: Record<string, HueLight> = {}
      Object.entries(data).forEach(([id, light]: [string, any]) => {
        transformedLights[id] = {
          id,
          name: light.name,
          state: light.state,
          type: light.type,
          modelid: light.modelid,
        }
      })

      setLights(transformedLights)
      console.log("[v0] Lights loaded successfully:", Object.keys(transformedLights).length)
    } catch (err: any) {
      console.error("[v0] Error fetching lights:", err)
      if (err.message.includes("Failed to fetch") || err.name === "TypeError") {
        setError(
          "Error de CORS o conexión. Asegúrate de: 1) Estar en la misma red que el bridge, 2) La IP sea correcta, 3) Si ves error de CORS, tu bridge moderno debería permitirlo automáticamente.",
        )
      } else {
        setError(`Error: ${err.message}`)
      }
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

    if (USE_MOCK_DATA) return

    try {
      const url = `http://${config.bridgeIp}/api/${config.username}/lights/${lightId}/state`
      await fetch(url, {
        method: "PUT",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: newState }),
      })
    } catch (err) {
      console.error("[v0] Error toggling light:", err)
      await fetchLights()
    }
  }

  const updateBrightness = async (lightId: string, bri: number) => {
    setLights((prev) => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        state: { ...prev[lightId].state, bri },
      },
    }))

    if (USE_MOCK_DATA) return

    try {
      const url = `http://${config.bridgeIp}/api/${config.username}/lights/${lightId}/state`
      await fetch(url, {
        method: "PUT",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bri, on: true }),
      })
    } catch (err) {
      console.error("[v0] Error updating brightness:", err)
    }
  }

  const setColor = async (lightId: string, hue: number, sat: number) => {
    setLights((prev) => ({
      ...prev,
      [lightId]: {
        ...prev[lightId],
        state: { ...prev[lightId].state, hue, sat },
      },
    }))

    if (USE_MOCK_DATA) return

    try {
      const url = `http://${config.bridgeIp}/api/${config.username}/lights/${lightId}/state`
      await fetch(url, {
        method: "PUT",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hue, sat, on: true }),
      })
    } catch (err) {
      console.error("[v0] Error setting color:", err)
    }
  }

  const lightsArray = Object.values(lights)

  if (showConfig) {
    return (
      <div className="glass-strong rounded-3xl p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Configuración de Philips Hue</h2>
            <p className="text-sm text-muted-foreground">Ingresa la IP de tu Hue Bridge y tu username para comenzar</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bridgeIp">IP del Hue Bridge</Label>
              <Input
                id="bridgeIp"
                placeholder="192.168.1.100"
                value={config.bridgeIp}
                onChange={(e) => setConfig({ ...config, bridgeIp: e.target.value })}
                className="glass"
              />
              <p className="text-xs text-muted-foreground">Encuentra la IP en la app de Philips Hue o en tu router</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="tu-username-aqui"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="glass font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Crea un usuario en https://tu_ip/debug/clip.html</p>
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

  if (error && lightsArray.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => setShowConfig(true)} className="w-full mt-4 rounded-2xl">
          Configurar Conexión
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {USE_MOCK_DATA && (
        <Alert className="glass-strong border-primary/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Modo Demo:</strong> Usando datos simulados. Para conectar con tu bridge real, descarga el proyecto y
            cambia <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">USE_MOCK_DATA</code> a{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">false</code> en{" "}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">components/lights-control.tsx</code>
          </AlertDescription>
        </Alert>
      )}

      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold">
              {lightsArray.filter((l) => l.state.on).length} de {lightsArray.length} luces encendidas
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {USE_MOCK_DATA ? "Modo Demo" : `Conectado a ${config.bridgeIp}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchLights}
              variant="outline"
              className="rounded-2xl transition-smooth hover:scale-105 bg-transparent"
              disabled={loading || USE_MOCK_DATA}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            {!USE_MOCK_DATA && (
              <Button
                onClick={() => setShowConfig(true)}
                variant="outline"
                className="rounded-2xl transition-smooth hover:scale-105"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {lightsArray.map((light) => {
          const lightColor = light.state.on
            ? `hsl(${((light.state.hue || 0) / 65535) * 360}, ${((light.state.sat || 0) / 254) * 100}%, 60%)`
            : "oklch(0.25 0.02 250)"

          const isExpanded = expandedLightId === light.id

          return (
            <Collapsible
              key={light.id}
              open={isExpanded}
              onOpenChange={(open) => setExpandedLightId(open ? light.id : null)}
            >
              <CollapsibleTrigger asChild>
                <div
                  className="rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: light.state.on
                      ? `linear-gradient(135deg, ${lightColor} 0%, ${lightColor}dd 100%)`
                      : "oklch(0.2 0.02 250)",
                    boxShadow: light.state.on ? `0 8px 32px ${lightColor}40` : "none",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-6 h-6 text-white" />
                      <div>
                        <h3 className="font-semibold text-lg text-white">{light.name}</h3>
                        {!light.state.reachable && <p className="text-xs text-white/70">No disponible</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={light.state.on}
                        onCheckedChange={(checked) => {
                          toggleLight(light.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!light.state.reachable}
                        className="data-[state=checked]:bg-white/30"
                      />
                      <ChevronDown
                        className={`w-5 h-5 text-white transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                {light.state.on && light.state.reachable && (
                  <div
                    className="rounded-3xl p-6 mt-2 space-y-3"
                    style={{
                      background: `linear-gradient(135deg, ${lightColor}20 0%, ${lightColor}10 100%)`,
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Brillo</span>
                        <span className="text-sm font-bold">{Math.round((light.state.bri / 254) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="254"
                        value={light.state.bri}
                        onChange={(e) => updateBrightness(light.id, Number.parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                    </div>

                    {light.type.includes("color") && (
                      <div className="bg-black/20 rounded-2xl backdrop-blur-sm p-4">
                        <HueColorPicker
                          lightId={light.id}
                          currentHue={light.state.hue}
                          currentSat={light.state.sat}
                          currentBri={light.state.bri}
                          onColorChange={(hue, sat) => setColor(light.id, hue, sat)}
                          onBrightnessChange={(bri) => updateBrightness(light.id, bri)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>

      {lightsArray.length === 0 && !loading && (
        <div className="glass-strong rounded-3xl p-12 text-center">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No se encontraron luces</h3>
          <p className="text-muted-foreground mb-4">
            Verifica que tu Hue Bridge esté conectado y configurado correctamente
          </p>
          <Button onClick={fetchLights} className="rounded-2xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  )
}
