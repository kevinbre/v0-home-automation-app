"use client"

import { useState, useEffect, useRef } from "react"
import { usePorcupine } from "@picovoice/porcupine-react"
import { Mic, MicOff, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// IMPORTANTE: Necesitás crear una cuenta gratuita en https://console.picovoice.ai/
// y obtener tu Access Key. Es gratis para 3 dispositivos.
const PICOVOICE_ACCESS_KEY = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY || "YOUR_ACCESS_KEY_HERE"

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

  // Callback cuando Porcupine detecta "Alexa"
  const handleWakeWordDetection = () => {
    console.log("[Alexa] Wake word detectada!")
    playActivationSound()
    startListeningForCommand()
  }

  // Estado de Porcupine
  const [porcupineListening, setPorcupineListening] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [porcupineError, setPorcupineError] = useState("")

  // Por ahora deshabilitamos Porcupine hasta configurar el Access Key
  // Hook de Porcupine para detectar "Alexa"
  let porcupineResult = null

  try {
    if (PICOVOICE_ACCESS_KEY !== "YOUR_ACCESS_KEY_HERE") {
      porcupineResult = usePorcupine(
        PICOVOICE_ACCESS_KEY,
        {
          keywords: ["alexa"], // Wake word
          sensitivities: [0.7], // Sensibilidad (0.0 - 1.0)
        },
        handleWakeWordDetection
      )
    }
  } catch (err: any) {
    console.error("[Alexa] Porcupine error:", err)
    setPorcupineError(err.message || "Error inicializando Porcupine")
  }

  const {
    keywordDetection,
    isLoaded: porcupineIsLoaded,
    isListening: porcupineIsListening,
    error: porcupineErr,
    init,
    start,
    stop,
    release,
  } = porcupineResult || {
    keywordDetection: null,
    isLoaded: false,
    isListening: false,
    error: null,
    init: () => {},
    start: () => {},
    stop: () => {},
    release: () => {},
  }

  // Sincronizar estados
  useEffect(() => {
    if (porcupineIsLoaded !== undefined) setIsLoaded(porcupineIsLoaded)
    if (porcupineIsListening !== undefined) setPorcupineListening(porcupineIsListening)
    if (porcupineErr) setPorcupineError(porcupineErr)
  }, [porcupineIsLoaded, porcupineIsListening, porcupineErr])

  // Iniciar Porcupine cuando el componente se monta
  useEffect(() => {
    if (PICOVOICE_ACCESS_KEY !== "YOUR_ACCESS_KEY_HERE" && init) {
      try {
        init()
      } catch (err) {
        console.error("[Alexa] Error al iniciar:", err)
      }
    }
  }, [init])

  // Auto-start cuando esté cargado
  useEffect(() => {
    if (isLoaded && !porcupineListening && !error && start) {
      try {
        start()
      } catch (err) {
        console.error("[Alexa] Error al iniciar listening:", err)
      }
    }
  }, [isLoaded, porcupineListening, start])

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
      if (stop) stop()
      if (release) release()
    }
  }, [stop, release])

  // Reproducir sonido de activación (bip)
  const playActivationSound = () => {
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
  }

  // Escuchar el comando después de detectar "Alexa"
  const startListeningForCommand = () => {
    if (!recognitionRef.current) return

    setIsListening(true)
    setIsProcessing(false)

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

    recognitionRef.current.start()
  }

  // Procesar el comando de voz
  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase()

    try {
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
      } else if (lowerCommand.includes('abajo')) {
        await sendTvCommand('sendKey', 'CursorDown')
      } else if (lowerCommand.includes('izquierda')) {
        await sendTvCommand('sendKey', 'CursorLeft')
      } else if (lowerCommand.includes('derecha')) {
        await sendTvCommand('sendKey', 'CursorRight')
      } else if (lowerCommand.includes('selecciona') || lowerCommand.includes('ok') || lowerCommand.includes('enter')) {
        await sendTvCommand('sendKey', 'Confirm')
      } else if (lowerCommand.includes('volver') || lowerCommand.includes('atrás')) {
        await sendTvCommand('sendKey', 'Back')
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

  // Síntesis de voz para respuestas
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  // Activación manual (botón)
  const handleManualActivation = () => {
    playActivationSound()
    startListeningForCommand()
  }

  // Toggle Porcupine on/off
  const togglePorcupine = () => {
    if (porcupineListening) {
      stop()
    } else {
      start()
    }
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

      {/* Botones de control */}
      <div className="flex gap-3">
        {/* Botón de activación manual */}
        <Button
          onClick={handleManualActivation}
          disabled={isListening || isProcessing}
          size="lg"
          className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-[#00A8E1] to-[#0077B5] hover:scale-110 transition-all"
        >
          <Mic className="w-7 h-7" />
        </Button>

        {/* Toggle wake word detection */}
        {isLoaded && (
          <Button
            onClick={togglePorcupine}
            variant={porcupineListening ? "default" : "outline"}
            size="lg"
            className="w-16 h-16 rounded-full shadow-xl"
            title={porcupineListening ? "Desactivar 'Alexa'" : "Activar 'Alexa'"}
          >
            {porcupineListening ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>
        )}
      </div>

      {/* Errores */}
      {(error || porcupineError) && (
        <div className="mt-2 glass-strong px-4 py-2 rounded-xl text-xs text-red-400 max-w-xs">
          {error || porcupineError}
        </div>
      )}

      {/* Configuración pendiente */}
      {PICOVOICE_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE" && (
        <div className="mt-2 glass-strong px-4 py-3 rounded-xl text-xs max-w-xs">
          <p className="font-semibold mb-1">⚠️ Configuración necesaria</p>
          <p className="text-muted-foreground">
            Necesitás agregar tu Picovoice Access Key en las variables de entorno.
            <br />
            <a
              href="https://console.picovoice.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Obtener Access Key gratis →
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
