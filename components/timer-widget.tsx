"use client"

import { useState, useEffect, useRef } from "react"
import { Timer, Play, Pause, RotateCcw, Plus, Minus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TabletInput } from "@/components/ui/tablet-input"

interface TimerData {
  id: string
  name: string
  duration: number // en segundos
  remaining: number
  isRunning: boolean
  isPaused: boolean
}

export function TimerWidget() {
  const [timers, setTimers] = useState<TimerData[]>([])
  const [newTimerMinutes, setNewTimerMinutes] = useState(5)
  const [newTimerName, setNewTimerName] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const savingRef = useRef(false)

  // === NUEVO: sonidos locales ===
  const startAudioRef = useRef<HTMLAudioElement | null>(null)
  const endAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      startAudioRef.current = new Audio("/Empezado.mp3")
      endAudioRef.current = new Audio("/Finalizado.mp3")
    }
  }, [])

  // Cargar temporizadores desde localStorage
  useEffect(() => {
    const loadTimers = () => {
      const saved = localStorage.getItem("timers")
      if (saved) setTimers(JSON.parse(saved))
    }

    loadTimers()

    const handleTimerEvent = () => {
      savingRef.current = true
      loadTimers()
      setTimeout(() => {
        savingRef.current = false
      }, 100)
    }

    window.addEventListener("timer-created", handleTimerEvent)
    window.addEventListener("timer-updated", handleTimerEvent)

    return () => {
      window.removeEventListener("timer-created", handleTimerEvent)
      window.removeEventListener("timer-updated", handleTimerEvent)
    }
  }, [])

  // Guardar en localStorage
  useEffect(() => {
    if (timers.length > 0 && !savingRef.current) {
      localStorage.setItem("timers", JSON.stringify(timers))
    }
  }, [timers])

  // Tick de 1 segundo
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setTimers(prev =>
        prev.map(timer => {
          if (timer.isRunning && !timer.isPaused && timer.remaining > 0) {
            const newRemaining = timer.remaining - 1
            if (newRemaining === 0) {
              playEndSound()
              showNotification(timer.name)
              return { ...timer, remaining: 0, isRunning: false }
            }
            return { ...timer, remaining: newRemaining }
          }
          return timer
        })
      )
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // 🔊 Reproducir sonido de inicio
  const playStartSound = async () => {
    try {
      if (startAudioRef.current) {
        const audio = startAudioRef.current.cloneNode(true) as HTMLAudioElement
        audio.currentTime = 0
        await audio.play()
      }
    } catch (e) {
      console.warn("Error reproduciendo Empezado.mp3:", e)
    }
  }
  // 🔊 Reproducir sonido de fin
  const playEndSound = async () => {
    try {
      if (endAudioRef.current) {
        const audio = endAudioRef.current.cloneNode(true) as HTMLAudioElement
        audio.currentTime = 0
        await audio.play()
      }
    } catch (e) {
      console.warn("Error reproduciendo Finalizado.mp3:", e)
    }
  }

  // 🔔 Notificación
  const showNotification = (timerName: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Temporizador finalizado", {
        body: timerName || "Tu temporizador ha terminado",
        icon: "/favicon.ico",
        tag: "timer-notification",
      })
    }
  }

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Crear nuevo temporizador (reproduce sonido de inicio)
  const createTimer = async (minutes: number, name?: string) => {
    const duration = minutes * 60
    const newTimer: TimerData = {
      id: Date.now().toString(),
      name: name || `${minutes} min`,
      duration,
      remaining: duration,
      isRunning: true,
      isPaused: false,
    }
    setTimers(prev => [...prev, newTimer])
    setNewTimerMinutes(5)
    setNewTimerName("")
    await playStartSound()
  }

  // Controles
  const toggleTimer = (id: string) => {
    setTimers(prev =>
      prev.map(timer =>
        timer.id === id ? { ...timer, isPaused: !timer.isPaused } : timer
      )
    )
  }

  const resetTimer = (id: string) => {
    setTimers(prev =>
      prev.map(timer =>
        timer.id === id
          ? { ...timer, remaining: timer.duration, isRunning: true, isPaused: false }
          : timer
      )
    )
  }

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== id))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgress = (timer: TimerData) =>
    ((timer.duration - timer.remaining) / timer.duration) * 100

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.65_0.25_140)]/20 flex items-center justify-center">
          <Timer className="w-6 h-6 text-[oklch(0.65_0.25_140)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Temporizadores</h3>
          <p className="text-xs text-muted-foreground">Controla con voz o manualmente</p>
        </div>
      </div>

      {/* Crear nuevo temporizador */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <label className="text-sm font-medium">Nuevo Temporizador</label>

        <div className="space-y-2">
          <TabletInput
            placeholder="Nombre (opcional)"
            value={newTimerName}
            onChange={(e) => setNewTimerName(e.target.value)}
            className="glass"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setNewTimerMinutes(Math.max(1, newTimerMinutes - 1))}
              className="rounded-xl"
            >
              <Minus className="w-4 h-4" />
            </Button>

            <div className="flex-1 glass rounded-xl p-3 text-center">
              <span className="text-2xl font-bold">{newTimerMinutes}</span>
              <span className="text-sm text-muted-foreground ml-1">min</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setNewTimerMinutes(newTimerMinutes + 1)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={() => createTimer(newTimerMinutes, newTimerName)}
          className="w-full rounded-xl"
        >
          <Clock className="w-4 h-4 mr-2" />
          Crear Temporizador
        </Button>
      </div>

      {/* Preconfigurados */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 3, 5, 10, 15, 30].map(mins => (
          <Button
            key={mins}
            variant="outline"
            size="sm"
            onClick={() => createTimer(mins)}
            className="rounded-xl"
          >
            {mins} min
          </Button>
        ))}
      </div>

      {/* Lista de temporizadores */}
      {timers.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Temporizadores Activos</label>

          {timers.map(timer => (
            <div key={timer.id} className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{timer.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(timer.duration)} total
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold tabular-nums">
                    {formatTime(timer.remaining)}
                  </div>
                  {timer.remaining === 0 && (
                    <span className="text-xs text-green-500 font-semibold animate-pulse">
                      ¡Finalizado!
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[oklch(0.65_0.25_140)] to-[oklch(0.75_0.25_160)] transition-all duration-1000"
                  style={{ width: `${getProgress(timer)}%` }}
                />
              </div>

              {/* Controles */}
              <div className="flex gap-2">
                {timer.remaining > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTimer(timer.id)}
                    className="flex-1 rounded-xl"
                  >
                    {timer.isPaused ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Continuar
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetTimer(timer.id)}
                  className="rounded-xl"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTimer(timer.id)}
                  className="rounded-xl text-red-500 hover:text-red-600"
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comandos de voz sugeridos */}
      <div className="glass rounded-2xl p-3 text-xs text-muted-foreground">
        <p className="font-semibold mb-1">💬 Comandos de voz:</p>
        <ul className="space-y-0.5 ml-4">
          <li>• "Temporizador de 5 minutos"</li>
          <li>• "Temporizador para pizza"</li>
          <li>• "Agrega 5 minutos al temporizador"</li>
          <li>• "Cancela el temporizador de pizza"</li>
          <li>• "Temporizadores activos"</li>
        </ul>
      </div>
    </div>
  )
}
