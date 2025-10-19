"use client"

import { useState, useEffect, useRef } from "react"
import { usePorcupine } from "@picovoice/porcupine-react"
import { Mic, MicOff, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const PICOVOICE_ACCESS_KEY = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY || ""

export function VoiceAssistantWithWakeWord() {
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
    console.log("[Asistente] Wake word 'Alexa' detectada!")
    playActivationSound()
    startListeningForCommand()
  }

  // Hook de Porcupine - DEBE estar al nivel superior, sin condicionales
  const porcupineConfig = PICOVOICE_ACCESS_KEY && PICOVOICE_ACCESS_KEY !== ""
    ? {
        keywords: ["tablet"],
        sensitivities: [0.7],
      }
    : null

  const {
    isLoaded,
    isListening: porcupineListening,
    error: porcupineError,
    init,
    start,
    stop,
    release,
  } = usePorcupine(
    PICOVOICE_ACCESS_KEY || "",
    porcupineConfig || { keywords: [], sensitivities: [] },
    handleWakeWordDetection
  )

  // Inicializar Porcupine cuando se carga - SOLO UNA VEZ
  useEffect(() => {
    if (PICOVOICE_ACCESS_KEY && PICOVOICE_ACCESS_KEY !== "") {
      console.log("[Asistente] Inicializando Porcupine...")
      try {
        init()
      } catch (err) {
        console.error("[Asistente] Error inicializando:", err)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo al montar

  // Auto-start Porcupine cuando esté listo - SOLO UNA VEZ
  useEffect(() => {
    if (isLoaded && PICOVOICE_ACCESS_KEY) {
      console.log("[Asistente] Iniciando detección de wake word...")
      try {
        start()
      } catch (err) {
        console.error("[Asistente] Error iniciando:", err)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]) // Solo cuando isLoaded cambie

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          // Ignorar
        }
      }
      stop()
      release()
    }
  }, [stop, release])

  // Mostrar error de Porcupine
  useEffect(() => {
    if (porcupineError) {
      console.error("[Asistente] Error de Porcupine:", porcupineError)
      setError(`Error de wake word: ${porcupineError}`)
    }
  }, [porcupineError])

  // Reproducir sonido de activación
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
      console.error("[Asistente] Error reproduciendo sonido:", err)
    }
  }

  // Escuchar comando después de wake word
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
      console.log("[Asistente] Comando recibido:", command)
      setLastCommand(command)
      setIsListening(false)
      setIsProcessing(true)
      processCommand(command)
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("[Asistente] Error:", event.error)
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
      console.error("[Asistente] Error al iniciar reconocimiento:", err)
      setError("Error al iniciar reconocimiento de voz")
      setIsListening(false)
    }
  }

  // Procesar comando de voz
  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase()

    try {
      // Comandos de temporizador
      if (lowerCommand.includes('temporizador') || lowerCommand.includes('timer')) {
        // Consultar temporizadores activos
        if (lowerCommand.includes('activo') || lowerCommand.includes('corriendo') || lowerCommand.includes('ejecutando')) {
          listActiveTimers()
          return
        }

        // Cancelar temporizador
        if (lowerCommand.includes('cancela') || lowerCommand.includes('cancelar') || lowerCommand.includes('elimina') || lowerCommand.includes('eliminar') || lowerCommand.includes('borra') || lowerCommand.includes('borrar')) {
          const timerName = extractTimerNameForCancel(lowerCommand)
          cancelTimer(timerName)
          return
        }

        // Añadir tiempo a temporizador
        if (lowerCommand.includes('agrega') || lowerCommand.includes('agregar') || lowerCommand.includes('añade') || lowerCommand.includes('añadir') || lowerCommand.includes('suma') || lowerCommand.includes('sumar')) {
          const minutes = extractMinutesFromCommand(lowerCommand)
          const timerName = extractTimerNameForAdd(lowerCommand)
          if (minutes > 0) {
            addTimeToTimer(minutes, timerName)
            return
          } else {
            speak("No entendí cuántos minutos agregar. Intenta decir: agrega 5 minutos al temporizador")
            return
          }
        }

        // Crear nuevo temporizador
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
      else if (lowerCommand.includes('enciende') || lowerCommand.includes('abre') || lowerCommand.includes('abrir')) {
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
        const searchQuery = extractSearchQuery(lowerCommand)
        if (searchQuery) {
          await searchOnTv(searchQuery)
          speak(`Buscando ${searchQuery} en el televisor`)
        }
      }
      // Navegación
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
      // Volumen TV
      else if (lowerCommand.includes('sube') && lowerCommand.includes('volumen') && (lowerCommand.includes('tv') || lowerCommand.includes('televisor'))) {
        await sendTvCommand('sendKey', 'VolumeUp')
        speak("Subiendo volumen del televisor")
      } else if (lowerCommand.includes('baja') && lowerCommand.includes('volumen') && (lowerCommand.includes('tv') || lowerCommand.includes('televisor'))) {
        await sendTvCommand('sendKey', 'VolumeDown')
        speak("Bajando volumen del televisor")
      } else if (lowerCommand.includes('silencio') || lowerCommand.includes('mutear')) {
        await sendTvCommand('sendKey', 'Mute')
        speak("Silenciando televisor")
      }
      // Comandos de Spotify - Cambiar cuenta
      else if (lowerCommand.includes('cambia') && (lowerCommand.includes('cuenta') || lowerCommand.includes('spotify'))) {
        const accountName = extractSpotifyAccountName(lowerCommand)
        switchSpotifyAccount(accountName)
        return
      }
      // Comandos de Spotify - Reproducción
      else if (lowerCommand.includes('reproduce') || lowerCommand.includes('play') || lowerCommand.includes('pon')) {
        // Detectar si está pidiendo reproducir algo específico
        const searchQuery = extractSpotifySearchQuery(lowerCommand)

        if (searchQuery) {
          // Reproducir artista/canción específica
          const result = await searchAndPlaySpotify(searchQuery)
          if (result) {
            speak(`Reproduciendo ${result}`)
          } else {
            speak("No encontré esa canción o artista")
          }
        } else {
          // Reanudar reproducción
          await sendSpotifyCommand('play')
          speak("Reproduciendo música")
        }
      } else if (lowerCommand.includes('pausa') && (lowerCommand.includes('música') || lowerCommand.includes('canción') || lowerCommand.includes('spotify'))) {
        await sendSpotifyCommand('pause')
        speak("Pausando música")
      } else if (lowerCommand.includes('siguiente') && (lowerCommand.includes('canción') || lowerCommand.includes('tema') || lowerCommand.includes('música'))) {
        await sendSpotifyCommand('next')
        speak("Siguiente canción")
      } else if (lowerCommand.includes('anterior') && (lowerCommand.includes('canción') || lowerCommand.includes('tema') || lowerCommand.includes('música'))) {
        await sendSpotifyCommand('previous')
        speak("Canción anterior")
      } else if (lowerCommand.includes('sube') && lowerCommand.includes('volumen') && !lowerCommand.includes('tv')) {
        await sendSpotifyCommand('volume', { volume: 80 })
        speak("Subiendo volumen")
      } else if (lowerCommand.includes('baja') && lowerCommand.includes('volumen') && !lowerCommand.includes('tv')) {
        await sendSpotifyCommand('volume', { volume: 30 })
        speak("Bajando volumen")
      }
      // Comando desconocido
      else {
        speak("No entendí ese comando. Intenta con: abre YouTube, temporizador de 5 minutos, reproduce música, o busca algo.")
      }
    } catch (error) {
      console.error("[Asistente] Error procesando comando:", error)
      speak("Lo siento, hubo un error procesando tu comando")
    } finally {
      setIsProcessing(false)
    }
  }

  // Funciones auxiliares (TV, temporizador, etc.)
  const sendTvCommand = async (command: string, value: string) => {
    const savedTvs = localStorage.getItem("smartTvs")
    if (!savedTvs) return

    const tvs = JSON.parse(savedTvs)
    if (tvs.length === 0) return

    const tv = tvs[0]
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

  const extractSearchQuery = (command: string): string => {
    const patterns = [/busca\s+(.+)/i, /buscar\s+(.+)/i, /buscá\s+(.+)/i]
    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) return match[1].trim()
    }
    return ""
  }

  const extractMinutesFromCommand = (command: string): number => {
    const patterns = [
      /(\d+)\s*minutos?/i,
      /(\d+)\s*min/i,
      /de\s+(\d+)/i,
      /(\d+)\s*horas?/i,
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        const value = parseInt(match[1])
        if (command.includes('hora')) return value * 60
        return value
      }
    }

    const textNumbers: Record<string, number> = {
      'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
      'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,
      'diez': 10, 'quince': 15, 'veinte': 20, 'treinta': 30, 'media hora': 30,
    }

    for (const [text, value] of Object.entries(textNumbers)) {
      if (command.includes(text)) return value
    }

    return 0
  }

  const extractTimerName = (command: string): string => {
    const patterns = [/para\s+(.+)/i, /de\s+(.+)/i]
    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        let name = match[1].trim()
        name = name.replace(/\d+\s*minutos?/gi, '')
        name = name.replace(/\d+\s*min/gi, '')
        name = name.replace(/temporizador/gi, '')
        name = name.trim()
        if (name.length > 0) return name
      }
    }
    return ""
  }

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

    const saved = localStorage.getItem("timers")
    const timers = saved ? JSON.parse(saved) : []
    timers.push(newTimer)
    localStorage.setItem("timers", JSON.stringify(timers))

    // Solo despachar el evento, no recargar
    window.dispatchEvent(new CustomEvent('timer-created'))
  }

  const addTimeToTimer = (minutes: number, timerName?: string) => {
    console.log("[Temporizador] Intentando agregar tiempo:", minutes, "minutos a:", timerName || "primer activo")

    const saved = localStorage.getItem("timers")
    if (!saved) {
      speak("No hay temporizadores activos")
      return
    }

    const timers = JSON.parse(saved)
    console.log("[Temporizador] Temporizadores actuales:", timers)

    // Si hay nombre, buscar ese temporizador específico
    let targetTimer = null
    if (timerName) {
      targetTimer = timers.find((t: any) =>
        t.name.toLowerCase().includes(timerName.toLowerCase()) && t.isRunning
      )
    } else {
      // Si no hay nombre, usar el primer temporizador activo
      targetTimer = timers.find((t: any) => t.isRunning)
    }

    if (!targetTimer) {
      console.log("[Temporizador] No se encontró temporizador")
      speak(timerName
        ? `No encontré el temporizador ${timerName}`
        : "No hay temporizadores activos"
      )
      return
    }

    console.log("[Temporizador] Temporizador encontrado:", targetTimer)

    // Agregar tiempo
    const additionalSeconds = minutes * 60
    const updatedTimers = timers.map((t: any) => {
      if (t.id === targetTimer.id) {
        const updated = {
          ...t,
          remaining: t.remaining + additionalSeconds,
          duration: t.duration + additionalSeconds
        }
        console.log("[Temporizador] Actualizando temporizador:", updated)
        return updated
      }
      return t
    })

    console.log("[Temporizador] Guardando temporizadores actualizados:", updatedTimers)
    localStorage.setItem("timers", JSON.stringify(updatedTimers))

    console.log("[Temporizador] Disparando evento timer-updated")
    window.dispatchEvent(new CustomEvent('timer-updated'))

    speak(`${minutes} minutos agregados al temporizador ${targetTimer.name}`)
  }

  const cancelTimer = (timerName?: string) => {
    const saved = localStorage.getItem("timers")
    if (!saved) {
      speak("No hay temporizadores activos")
      return
    }

    let timers = JSON.parse(saved)

    if (timerName) {
      // Cancelar temporizador específico
      const initialLength = timers.length
      timers = timers.filter((t: any) =>
        !t.name.toLowerCase().includes(timerName.toLowerCase())
      )

      if (timers.length === initialLength) {
        speak(`No encontré el temporizador ${timerName}`)
        return
      }

      localStorage.setItem("timers", JSON.stringify(timers))
      window.dispatchEvent(new CustomEvent('timer-updated'))
      speak(`Temporizador ${timerName} cancelado`)
    } else {
      // Cancelar todos los temporizadores
      if (timers.length === 0) {
        speak("No hay temporizadores activos")
        return
      }

      localStorage.setItem("timers", JSON.stringify([]))
      window.dispatchEvent(new CustomEvent('timer-updated'))
      speak(`Todos los temporizadores cancelados`)
    }
  }

  const listActiveTimers = () => {
    const saved = localStorage.getItem("timers")
    if (!saved) {
      speak("No hay temporizadores activos")
      return
    }

    const timers = JSON.parse(saved)
    const activeTimers = timers.filter((t: any) => t.isRunning && t.remaining > 0)

    if (activeTimers.length === 0) {
      speak("No hay temporizadores activos")
      return
    }

    if (activeTimers.length === 1) {
      const timer = activeTimers[0]
      const minutes = Math.ceil(timer.remaining / 60)
      speak(`Tienes un temporizador activo: ${timer.name}, quedan ${minutes} minutos`)
    } else {
      let message = `Tienes ${activeTimers.length} temporizadores activos: `
      activeTimers.forEach((timer: any, index: number) => {
        const minutes = Math.ceil(timer.remaining / 60)
        message += `${timer.name} con ${minutes} minutos`
        if (index < activeTimers.length - 1) message += ", "
      })
      speak(message)
    }
  }

  const extractTimerNameForCancel = (command: string): string => {
    const patterns = [
      /cancela(?:r)?\s+(?:el\s+)?temporizador\s+(?:de\s+)?(.+)/i,
      /elimina(?:r)?\s+(?:el\s+)?temporizador\s+(?:de\s+)?(.+)/i,
      /borra(?:r)?\s+(?:el\s+)?temporizador\s+(?:de\s+)?(.+)/i,
      /cancela(?:r)?\s+(.+)/i,
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        let name = match[1].trim()
        name = name.replace(/temporizador/gi, '')
        name = name.trim()
        if (name.length > 0 && !name.includes('todo')) return name
      }
    }
    return ""
  }

  const extractTimerNameForAdd = (command: string): string => {
    const patterns = [
      /al\s+temporizador\s+(?:de\s+)?(.+)/i,
      /al\s+(.+)/i,
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        let name = match[1].trim()
        name = name.replace(/\d+\s*minutos?/gi, '')
        name = name.replace(/\d+\s*min/gi, '')
        name = name.replace(/temporizador/gi, '')
        name = name.trim()
        if (name.length > 0) return name
      }
    }
    return ""
  }

  const sendSpotifyCommand = async (action: string, params?: any) => {
    try {
      const saved = localStorage.getItem("spotifyAccounts")
      if (!saved) {
        speak("No hay cuentas de Spotify configuradas")
        return null
      }

      const accounts = JSON.parse(saved)
      const activeAccount = accounts.find((acc: any) => acc.isActive)

      if (!activeAccount) {
        speak("No hay cuenta de Spotify activa")
        return null
      }

      const response = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          clientId: activeAccount.clientId,
          clientSecret: activeAccount.clientSecret,
          refreshToken: activeAccount.refreshToken,
          ...params,
        }),
      })

      return await response.json()
    } catch (error) {
      console.error("[Spotify] Error sending command:", error)
      return null
    }
  }

  const searchAndPlaySpotify = async (query: string) => {
    try {
      const result = await sendSpotifyCommand('searchAndPlay', { query })

      if (result?.success) {
        return result.playing
      }

      return null
    } catch (error) {
      console.error("[Spotify] Error searching and playing:", error)
      return null
    }
  }

  const extractSpotifySearchQuery = (command: string): string => {
    const patterns = [
      /reproduce\s+(.+)/i,
      /pon\s+(.+)/i,
      /play\s+(.+)/i,
      /ponme\s+(.+)/i,
      /reproduceme\s+(.+)/i,
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        let query = match[1].trim()
        // Limpiar palabras comunes
        query = query.replace(/música de/gi, '')
        query = query.replace(/canciones de/gi, '')
        query = query.replace(/el artista/gi, '')
        query = query.replace(/la canción/gi, '')
        query = query.trim()

        // Si quedó algo útil, devolverlo
        if (query.length > 2 && !query.includes('música') && !query.includes('canción')) {
          return query
        }
      }
    }

    return ""
  }

  const switchSpotifyAccount = (accountName: string) => {
    const saved = localStorage.getItem("spotifyAccounts")
    if (!saved) {
      speak("No hay cuentas de Spotify configuradas")
      return
    }

    const accounts = JSON.parse(saved)

    if (!accountName) {
      // Si no se especifica nombre, listar las cuentas disponibles
      if (accounts.length === 0) {
        speak("No hay cuentas de Spotify configuradas")
        return
      }

      if (accounts.length === 1) {
        speak(`Solo tienes una cuenta: ${accounts[0].name}`)
        return
      }

      let message = "Cuentas disponibles: "
      accounts.forEach((acc: any, index: number) => {
        message += acc.name
        if (index < accounts.length - 1) message += ", "
      })
      speak(message)
      return
    }

    // Buscar la cuenta por nombre
    const account = accounts.find((acc: any) =>
      acc.name.toLowerCase().includes(accountName.toLowerCase())
    )

    if (!account) {
      speak(`No encontré la cuenta ${accountName}`)
      return
    }

    // Activar la cuenta
    const updatedAccounts = accounts.map((acc: any) => ({
      ...acc,
      isActive: acc.id === account.id,
    }))

    localStorage.setItem("spotifyAccounts", JSON.stringify(updatedAccounts))
    window.dispatchEvent(new CustomEvent('spotify-accounts-updated'))

    speak(`Cambiado a cuenta ${account.name}`)
  }

  const extractSpotifyAccountName = (command: string): string => {
    const patterns = [
      /cambia\s+a\s+(?:la\s+)?cuenta\s+(.+)/i,
      /cambia\s+a\s+(.+)/i,
      /cuenta\s+(.+)/i,
    ]

    for (const pattern of patterns) {
      const match = command.match(pattern)
      if (match) {
        let name = match[1].trim()
        name = name.replace(/de\s+spotify/gi, '')
        name = name.replace(/spotify/gi, '')
        name = name.trim()
        if (name.length > 0) return name
      }
    }
    return ""
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-ES'
        utterance.rate = 1.0
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.error("[Asistente] Error en síntesis de voz:", err)
      }
    }
  }

  // Activación manual
  const handleManualActivation = () => {
    playActivationSound()
    startListeningForCommand()
  }

  // Toggle wake word detection
  const toggleWakeWord = () => {
    if (porcupineListening) {
      stop()
    } else {
      start()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Indicadores de estado */}
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

      {/* Botones */}
      <div className="flex gap-3">
        {/* Botón manual */}
        <Button
          onClick={handleManualActivation}
          disabled={isListening || isProcessing}
          size="lg"
          className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-[#00A8E1] to-[#0077B5] hover:scale-110 transition-all"
        >
          <Mic className="w-7 h-7" />
        </Button>

        {/* Toggle wake word */}
        {isLoaded && (
          <Button
            onClick={toggleWakeWord}
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
      {error && (
        <div className="mt-2 glass-strong px-4 py-2 rounded-xl text-xs text-red-400 max-w-xs">
          {error}
        </div>
      )}

      {/* Info */}
      {!PICOVOICE_ACCESS_KEY && (
        <div className="mt-2 glass-strong px-4 py-3 rounded-xl text-xs max-w-xs">
          <p className="font-semibold mb-1">⚠️ Configuración necesaria</p>
          <p className="text-muted-foreground">
            Agregá tu Picovoice Access Key en .env.local
          </p>
        </div>
      )}

      {isLoaded && porcupineListening && (
        <div className="mt-2 glass-strong px-4 py-3 rounded-xl text-xs max-w-xs">
          <p className="font-semibold mb-1 text-green-400">👂 Escuchando "Alexa"</p>
          <p className="text-muted-foreground text-[10px]">
            Di "Alexa" seguido de tu comando
            <br />
            O presioná el botón grande
          </p>
        </div>
      )}
    </div>
  )
}
