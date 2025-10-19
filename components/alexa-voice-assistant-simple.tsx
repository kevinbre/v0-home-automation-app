"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AlexaVoiceAssistantProps {
  onCommand?: (command: string) => void
}

export function AlexaVoiceAssistant({ onCommand }: AlexaVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>("")
  const [error, setError] = useState<string>("")
  const recognitionRef = useRef<any>(null)

  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'es-ES'
      } else {
        setError("Tu navegador no soporta reconocimiento de voz")
      }
    }
  }, [])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          // Ignorar errores al detener
        }
      }
    }
  }, [])

  // Reproducir sonido de activación (bip)
  const playActivationSound = () => {
    try {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (err) {
      console.error("[Alexa] Error reproduciendo sonido:", err)
    }
  }

  // Escuchar el comando
  const startListeningForCommand = () => {
    if (!recognitionRef.current) {
      setError("Reconocimiento de voz no disponible")
      return
    }

    setIsListening(true)
    setIsProcessing(false)
    setError("")

    recognitionRef.current.onresult = (event: any) => {
      const command = event.results[0][0].transcript
      console.log("[Alexa] Comando recibido:", command)
      setLastCommand(command)
      setIsListening(false)
      setIsProcessing(true)
      processCommand(command)
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("[Alexa] Error:", event.error)
      setError(`Error: ${event.error}`)
      setIsListening(false)
      setIsProcessing(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      if (!isProcessing) {
        setError("No escuché nada. Intenta de nuevo.")
      }
    }

    try {
      recognitionRef.current.start()
    } catch (err: any) {
      console.error("[Alexa] Error al iniciar reconocimiento:", err)
      setError("Error al iniciar reconocimiento de voz")
      setIsListening(false)
    }
  }

  // Procesar el comando de voz
  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase()

    try {
      // Comandos de temporizador
      if (lowerCommand.includes('temporizador') || lowerCommand.includes('timer')) {
        const minutes = extractMinutesFromCommand(lowerCommand)
        const timerName = extractTimerName(lowerCommand)

        if (minutes > 0) {
          createTimerFromVoice(minutes, timerName)
          speak(`Temporizador de ${minutes} minutos ${timerName ? 'para ' + timerName : ''} iniciado`)
          return
        } else {
          speak("No entendí cuántos minutos. Intenta decir: temporizador de 5 minutos")
          return
        }
      }
      // Comandos de TV
      if (lowerCommand.includes('enciende') || lowerCommand.includes('abre') || lowerCommand.includes('abrir')) {
        if (lowerCommand.includes('youtube')) {
          await sendTvCommand('launchApp', 'com.google.android.youtube.tv')
          speak("Abriendo YouTube en el televisor")
        } else if (lowerCommand.includes('netflix')) {
          await sendTvCommand('launchApp', 'com.netflix.ninja')
          speak("Abriendo Netflix en el televisor")
        } else if (lowerCommand.includes('disney')) {
          await sendTvCommand('launchApp', 'com.disney.disneyplus')
          speak("Abriendo Disney Plus en el televisor")
        } else if (lowerCommand.includes('televisor') || lowerCommand.includes('tele') || lowerCommand.includes('tv')) {
          await sendTvCommand('sendKey', 'Power')
          speak("Encendiendo el televisor")
        }
      }
      // Comandos de búsqueda
      else if (lowerCommand.includes('busca') || lowerCommand.includes('buscar')) {
        const searchQuery = extractSearchQuery(command)
        if (searchQuery) {
          await searchOnTv(searchQuery)
          speak(`Buscando ${searchQuery} en el televisor`)
        }
      }
      // Comandos de navegación
      else if (lowerCommand.includes('arriba')) {
        await sendTvCommand('sendKey', 'CursorUp')
        speak("Arriba")
      } else if (lowerCommand.includes('abajo')) {
        await sendTvCommand('sendKey', 'CursorDown')
        speak("Abajo")
      } else if (lowerCommand.includes('izquierda')) {
        await sendTvCommand('sendKey', 'CursorLeft')
        speak("Izquierda")
      } else if (lowerCommand.includes('derecha')) {
        await sendTvCommand('sendKey', 'CursorRight')
        speak("Derecha")
      } else if (lowerCommand.includes('selecciona') || lowerCommand.includes('ok') || lowerCommand.includes('enter')) {
        await sendTvCommand('sendKey', 'Confirm')
        speak("Seleccionado")
      } else if (lowerCommand.includes('volver') || lowerCommand.includes('atrás')) {
        await sendTvCommand('sendKey', 'Back')
        speak("Volver")
      }
      // Comandos de volumen
      else if (lowerCommand.includes('sube') && lowerCommand.includes('volumen')) {
        await sendTvCommand('sendKey', 'VolumeUp')
        speak("Subiendo volumen")
      } else if (lowerCommand.includes('baja') && lowerCommand.includes('volumen')) {
        await sendTvCommand('sendKey', 'VolumeDown')
        speak("Bajando volumen")
      } else if (lowerCommand.includes('silencio') || lowerCommand.includes('mutear')) {
        await sendTvCommand('sendKey', 'Mute')
        speak("Silenciando televisor")
      }
      // Comando desconocido
      else {
        speak("No entendí ese comando. Intenta con: abre YouTube, enciende el TV, o busca algo.")
      }

      // Callback personalizado
      if (onCommand) {
        onCommand(command)
      }
    } catch (error) {
      console.error("[Alexa] Error procesando comando:", error)
      speak("Lo siento, hubo un error procesando tu comando")
    } finally {
      setIsProcessing(false)
    }
  }

  // Enviar comando al TV
  const sendTvCommand = async (command: string, value: string) => {
    const savedTvs = localStorage.getItem("smartTvs")
    if (!savedTvs) {
      throw new Error("No hay TVs configurados")
    }

    const tvs = JSON.parse(savedTvs)
    if (tvs.length === 0) {
      throw new Error("No hay TVs configurados")
    }

    const tv = tvs[0] // Usar el primer TV

    const apiEndpoint = tv.useAdb ? "/api/android-tv-adb" : "/api/philips-tv"

    await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tvIp: tv.ipAddress,
        command,
        value: command === 'launchApp' ? {
          intent: {
            component: {
              packageName: value,
              className: value === "com.google.android.youtube.tv"
                ? "com.google.android.apps.youtube.tv.activity.ShellActivity"
                : undefined
            },
            action: "android.intent.action.MAIN"
          }
        } : value
      })
    })
  }

  // Buscar en YouTube del TV
  const searchOnTv = async (query: string) => {
    const savedTvs = localStorage.getItem("smartTvs")
    if (!savedTvs) return

    const tvs = JSON.parse(savedTvs)
    if (tvs.length === 0) return

    const tv = tvs[0]

    await fetch("/api/android-tv-adb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tvIp: tv.ipAddress,
        command: "openYouTubeSearch",
        value: query
      })
    })
  }

  // Extraer la búsqueda del comando
  const extractSearchQuery = (command: string): string => {
    const patterns = [
      /busca\s+(.+)/i,
      /buscar\s+(.+)/i,
      /buscá\s+(.+)/i,
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    return ""
  }

  // Extraer minutos del comando de temporizador
  const extractMinutesFromCommand = (command: string): number => {
    // Patrones para detectar números
    const patterns = [
      /(\d+)\s*minutos?/i,
      /(\d+)\s*min/i,
      /de\s+(\d+)/i,
      /(\d+)\s*horas?/i, // convertir horas a minutos
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        const value = parseInt(match[1])
        // Si es horas, convertir a minutos
        if (command.includes('hora')) {
          return value * 60
        }
        return value
      }
    }

    // Números en texto
    const textNumbers: Record<string, number> = {
      'un': 1, 'uno': 1, 'una': 1,
      'dos': 2,
      'tres': 3,
      'cuatro': 4,
      'cinco': 5,
      'seis': 6,
      'siete': 7,
      'ocho': 8,
      'nueve': 9,
      'diez': 10,
      'quince': 15,
      'veinte': 20,
      'treinta': 30,
      'media hora': 30,
    }

    for (const [text, value] of Object.entries(textNumbers)) {
      if (command.includes(text)) {
        return value
      }
    }

    return 0
  }

  // Extraer nombre del temporizador
  const extractTimerName = (command: string): string => {
    const patterns = [
      /para\s+(.+)/i,
      /de\s+(.+)/i,
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        let name = match[1].trim()
        // Limpiar palabras clave
        name = name.replace(/\d+\s*minutos?/gi, '')
        name = name.replace(/\d+\s*min/gi, '')
        name = name.replace(/temporizador/gi, '')
        name = name.trim()

        if (name.length > 0) {
          return name
        }
      }
    }

    return ""
  }

  // Crear temporizador desde voz
  const createTimerFromVoice = (minutes: number, name?: string) => {
    const duration = minutes * 60
    const newTimer = {
      id: Date.now().toString(),
      name: name || `${minutes} min`,
      duration,
      remaining: duration,
      isRunning: true,
      isPaused: false,
    }

    // Guardar en localStorage
    const saved = localStorage.getItem("timers")
    const timers = saved ? JSON.parse(saved) : []
    timers.push(newTimer)
    localStorage.setItem("timers", JSON.stringify(timers))

    // Disparar evento para actualizar el widget
    window.dispatchEvent(new CustomEvent('timer-created'))
  }

  // Síntesis de voz para respuestas
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-ES'
        utterance.rate = 1.0
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.error("[Alexa] Error en síntesis de voz:", err)
      }
    }
  }

  // Activación manual (botón)
  const handleManualActivation = () => {
    playActivationSound()
    startListeningForCommand()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Indicador de estado */}
      <div className="mb-2 text-right">
        {isListening && (
          <div className="inline-flex items-center gap-2 glass-strong px-4 py-2 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="text-sm font-medium">Escuchando...</span>
          </div>
        )}
        {isProcessing && (
          <div className="inline-flex items-center gap-2 glass-strong px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Procesando...</span>
          </div>
        )}
        {lastCommand && !isListening && !isProcessing && (
          <div className="inline-flex items-center gap-2 glass-strong px-4 py-2 rounded-full">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs">{lastCommand}</span>
          </div>
        )}
      </div>

      {/* Botón de activación manual */}
      <Button
        onClick={handleManualActivation}
        disabled={isListening || isProcessing}
        size="lg"
        className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-[#00A8E1] to-[#0077B5] hover:scale-110 transition-all"
      >
        <Mic className="w-7 h-7" />
      </Button>

      {/* Errores */}
      {error && (
        <div className="mt-2 glass-strong px-4 py-2 rounded-xl text-xs text-red-400 max-w-xs">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="mt-2 glass-strong px-4 py-3 rounded-xl text-xs max-w-xs">
        <p className="font-semibold mb-1">💬 Asistente de Voz</p>
        <p className="text-muted-foreground text-[10px]">
          Presioná el botón y di tu comando.
          <br />
          Ejemplo: "Abre YouTube", "Busca música"
        </p>
      </div>
    </div>
  )
}
