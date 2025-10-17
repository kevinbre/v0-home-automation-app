"use client"

import { useState } from "react"
import { Volume2, Mic, Music, Clock, Zap, MessageSquare, Play, Pause, SkipForward, SkipBack } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

interface AlexaDevice {
  id: string
  name: string
  location: string
  status: boolean
  volume: number
  playing: boolean
  currentActivity: string
}

interface VoiceCommand {
  id: string
  command: string
  time: string
  device: string
  success: boolean
}

interface Routine {
  id: string
  name: string
  trigger: string
  actions: string[]
  enabled: boolean
  icon: any
}

const initialDevices: AlexaDevice[] = [
  {
    id: "1",
    name: "Alexa Cocina",
    location: "Cocina",
    status: true,
    volume: 60,
    playing: true,
    currentActivity: "Reproduciendo música",
  },
  {
    id: "2",
    name: "Alexa Dormitorio",
    location: "Dormitorio",
    status: false,
    volume: 40,
    playing: false,
    currentActivity: "En espera",
  },
  {
    id: "3",
    name: "Alexa Sala",
    location: "Sala de Estar",
    status: true,
    volume: 50,
    playing: false,
    currentActivity: "En espera",
  },
]

const recentCommands: VoiceCommand[] = [
  { id: "1", command: "Alexa, enciende las luces de la sala", time: "Hace 5 min", device: "Alexa Sala", success: true },
  { id: "2", command: "Alexa, pon música relajante", time: "Hace 15 min", device: "Alexa Cocina", success: true },
  { id: "3", command: "Alexa, cuál es el clima", time: "Hace 1 hora", device: "Alexa Sala", success: true },
  {
    id: "4",
    command: "Alexa, apaga la TV del dormitorio",
    time: "Hace 2 horas",
    device: "Alexa Dormitorio",
    success: false,
  },
]

const routines: Routine[] = [
  {
    id: "1",
    name: "Buenos Días",
    trigger: "7:00 AM",
    actions: ["Encender luces", "Leer noticias", "Clima del día"],
    enabled: true,
    icon: Clock,
  },
  {
    id: "2",
    name: "Llegué a Casa",
    trigger: "Al llegar",
    actions: ["Encender luces", "Ajustar temperatura", "Reproducir música"],
    enabled: true,
    icon: Zap,
  },
  {
    id: "3",
    name: "Buenas Noches",
    trigger: "10:00 PM",
    actions: ["Apagar luces", "Cerrar cortinas", "Activar alarma"],
    enabled: false,
    icon: Clock,
  },
]

export function AlexaControl() {
  const [devices, setDevices] = useState(initialDevices)
  const [routinesList, setRoutinesList] = useState(routines)
  const [isListening, setIsListening] = useState(false)

  const toggleDevice = (id: string) => {
    setDevices(devices.map((device) => (device.id === id ? { ...device, status: !device.status } : device)))
  }

  const updateVolume = (id: string, volume: number) => {
    setDevices(devices.map((device) => (device.id === id ? { ...device, volume } : device)))
  }

  const togglePlaying = (id: string) => {
    setDevices(
      devices.map((device) =>
        device.id === id
          ? {
              ...device,
              playing: !device.playing,
              currentActivity: !device.playing ? "Reproduciendo música" : "En espera",
            }
          : device,
      ),
    )
  }

  const toggleRoutine = (id: string) => {
    setRoutinesList(
      routinesList.map((routine) => (routine.id === id ? { ...routine, enabled: !routine.enabled } : routine)),
    )
  }

  return (
    <div className="space-y-6">
      {/* Voice Command Interface */}
      <div className="glass-strong rounded-3xl p-8">
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            variant={isListening ? "default" : "outline"}
            onClick={() => setIsListening(!isListening)}
            className={`w-24 h-24 rounded-full transition-all ${isListening ? "animate-pulse scale-110" : ""}`}
          >
            <Mic className="w-10 h-10" />
          </Button>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{isListening ? "Escuchando..." : "Toca para hablar"}</h3>
            <p className="text-sm text-muted-foreground">
              {isListening ? "Di tu comando ahora" : "Presiona el botón y di tu comando"}
            </p>
          </div>
        </div>
      </div>

      {/* Alexa Devices */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold px-2">Dispositivos Alexa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div key={device.id} className="glass-strong rounded-3xl p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: device.status ? "oklch(0.55 0.22 280)/0.2" : "oklch(0.3 0.05 250)",
                    }}
                  >
                    <Volume2
                      className="w-6 h-6"
                      style={{ color: device.status ? "oklch(0.55 0.22 280)" : "oklch(0.5 0.05 250)" }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{device.name}</h3>
                    <p className="text-xs text-muted-foreground">{device.location}</p>
                  </div>
                </div>
                <Switch checked={device.status} onCheckedChange={() => toggleDevice(device.id)} />
              </div>

              {device.status && (
                <>
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: device.playing ? "oklch(0.65 0.2 180)" : "oklch(0.5 0.1 250)" }}
                    />
                    <span className="text-sm">{device.currentActivity}</span>
                  </div>

                  {/* Volume Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Volumen</span>
                      <span className="font-medium">{device.volume}%</span>
                    </div>
                    <Slider
                      value={[device.volume]}
                      onValueChange={([value]) => updateVolume(device.id, value)}
                      max={100}
                      step={1}
                    />
                  </div>

                  {/* Media Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl bg-transparent">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => togglePlaying(device.id)}
                      className="rounded-xl"
                    >
                      {device.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl bg-transparent">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Routines */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold px-2">Rutinas de Alexa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routinesList.map((routine) => {
            const Icon = routine.icon
            return (
              <div key={routine.id} className="glass-strong rounded-3xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: routine.enabled ? "oklch(0.65 0.2 180)/0.2" : "oklch(0.3 0.05 250)",
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: routine.enabled ? "oklch(0.65 0.2 180)" : "oklch(0.5 0.05 250)" }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{routine.name}</h3>
                      <p className="text-xs text-muted-foreground">{routine.trigger}</p>
                    </div>
                  </div>
                  <Switch checked={routine.enabled} onCheckedChange={() => toggleRoutine(routine.id)} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Acciones:</p>
                  <div className="flex flex-wrap gap-2">
                    {routine.actions.map((action, index) => (
                      <Badge key={index} variant="secondary" className="rounded-lg">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Commands */}
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Comandos Recientes</h2>
        </div>
        <div className="space-y-3">
          {recentCommands.map((command) => (
            <div key={command.id} className="glass rounded-2xl p-4 flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm">{command.command}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">{command.device}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{command.time}</span>
                </div>
              </div>
              <Badge variant={command.success ? "default" : "destructive"} className="rounded-lg">
                {command.success ? "Exitoso" : "Fallido"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 rounded-2xl bg-transparent">
            <Music className="w-6 h-6" />
            <span className="text-sm">Reproducir Música</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 rounded-2xl bg-transparent">
            <Clock className="w-6 h-6" />
            <span className="text-sm">Establecer Alarma</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 rounded-2xl bg-transparent">
            <MessageSquare className="w-6 h-6" />
            <span className="text-sm">Leer Noticias</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 rounded-2xl bg-transparent">
            <Zap className="w-6 h-6" />
            <span className="text-sm">Control de Casa</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
