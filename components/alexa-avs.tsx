"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, LogIn, LogOut, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Configuración de AVS (obtener de Amazon Developer Console)
const AVS_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_ALEXA_CLIENT_ID || "YOUR_CLIENT_ID",
  clientSecret: process.env.NEXT_PUBLIC_ALEXA_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
  redirectUri: process.env.NEXT_PUBLIC_ALEXA_REDIRECT_URI || "http://localhost:3000/auth/callback",
  scope: "alexa:all",
  productId: process.env.NEXT_PUBLIC_ALEXA_PRODUCT_ID || "home-tablet-001",
}

interface AlexaAVSProps {
  onCommand?: (command: string) => void
}

export function AlexaAVS({ onCommand }: AlexaAVSProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResponse, setLastResponse] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Verificar si ya está autenticado al cargar
  useEffect(() => {
    const storedToken = localStorage.getItem("alexa_access_token")
    const tokenExpiry = localStorage.getItem("alexa_token_expiry")

    if (storedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry)
      if (Date.now() < expiryTime) {
        setAccessToken(storedToken)
        setIsAuthenticated(true)
      } else {
        // Token expirado
        localStorage.removeItem("alexa_access_token")
        localStorage.removeItem("alexa_token_expiry")
      }
    }

    // Escuchar respuesta del callback de OAuth
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "alexa_auth_success") {
        const { access_token, expires_in } = event.data
        const expiryTime = Date.now() + (expires_in * 1000)

        localStorage.setItem("alexa_access_token", access_token)
        localStorage.setItem("alexa_token_expiry", expiryTime.toString())

        setAccessToken(access_token)
        setIsAuthenticated(true)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Login con Amazon (OAuth)
  const handleLogin = () => {
    const authUrl = `https://www.amazon.com/ap/oa?` +
      `client_id=${AVS_CONFIG.clientId}` +
      `&scope=${encodeURIComponent(AVS_CONFIG.scope)}` +
      `&scope_data=${encodeURIComponent(JSON.stringify({
        "alexa:all": {
          productID: AVS_CONFIG.productId,
          productInstanceAttributes: {
            deviceSerialNumber: "001"
          }
        }
      }))}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(AVS_CONFIG.redirectUri)}`

    // Abrir popup para OAuth
    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    window.open(
      authUrl,
      "Amazon Login",
      `width=${width},height=${height},left=${left},top=${top}`
    )
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("alexa_access_token")
    localStorage.removeItem("alexa_token_expiry")
    setAccessToken(null)
    setIsAuthenticated(false)
  }

  // Iniciar grabación de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendAudioToAlexa(audioBlob)

        // Detener stream
        stream.getTracks().forEach(track => track.stop())
      }

      // Reproducir sonido de activación
      playActivationSound()

      mediaRecorder.start()
      setIsListening(true)
      setError("")

      // Detener después de 5 segundos (o cuando el usuario suelte el botón)
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          stopRecording()
        }
      }, 5000)

    } catch (err: any) {
      console.error("[Alexa] Error al grabar:", err)
      setError("Error al acceder al micrófono")
    }
  }

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsListening(false)
      setIsProcessing(true)
    }
  }

  // Enviar audio a Alexa Voice Service
  const sendAudioToAlexa = async (audioBlob: Blob) => {
    if (!accessToken) {
      setError("No estás autenticado con Amazon")
      setIsProcessing(false)
      return
    }

    try {
      // Convertir webm a formato compatible (L16 PCM)
      const audioBuffer = await audioBlob.arrayBuffer()

      // Enviar a AVS usando multipart/form-data
      const formData = new FormData()

      // Metadata del evento
      const metadata = {
        event: {
          header: {
            namespace: "SpeechRecognizer",
            name: "Recognize",
            messageId: `msg-${Date.now()}`,
            dialogRequestId: `dialog-${Date.now()}`
          },
          payload: {
            profile: "CLOSE_TALK",
            format: "AUDIO_L16_RATE_16000_CHANNELS_1"
          }
        }
      }

      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "metadata")
      formData.append("audio", audioBlob, "audio")

      const response = await fetch("https://avs-alexa-na.amazon.com/v20160207/events", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`AVS Error: ${response.status}`)
      }

      // Procesar respuesta de Alexa
      await processAlexaResponse(response)

    } catch (err: any) {
      console.error("[Alexa] Error enviando audio:", err)
      setError(`Error: ${err.message}`)
      setIsProcessing(false)
    }
  }

  // Procesar respuesta de Alexa
  const processAlexaResponse = async (response: Response) => {
    try {
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("multipart/related")) {
        // Respuesta multipart con audio y directivas
        const text = await response.text()

        // Parsear partes (simplificado)
        // En producción usarías una biblioteca para parsear multipart
        console.log("[Alexa] Respuesta recibida:", text)

        // Buscar directivas JSON
        const jsonMatch = text.match(/\{[\s\S]*"directive"[\s\S]*\}/)
        if (jsonMatch) {
          const directive = JSON.parse(jsonMatch[0])
          console.log("[Alexa] Directiva:", directive)

          // Procesar directiva (ej: controlar smart home)
          handleAlexaDirective(directive)
        }

        setLastResponse("Alexa respondió correctamente")
      }

      setIsProcessing(false)

    } catch (err: any) {
      console.error("[Alexa] Error procesando respuesta:", err)
      setError("Error procesando respuesta de Alexa")
      setIsProcessing(false)
    }
  }

  // Manejar directivas de Alexa
  const handleAlexaDirective = (directive: any) => {
    // Aquí procesarías las directivas de Alexa
    // Por ejemplo, si Alexa dice "enciende las luces", recibirías una directiva
    console.log("[Alexa] Procesando directiva:", directive)

    if (onCommand) {
      onCommand(JSON.stringify(directive))
    }
  }

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
      console.error("[Alexa] Error reproduciendo sonido:", err)
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
            <span className="text-sm font-medium">Alexa procesando...</span>
          </div>
        )}
        {lastResponse && !isListening && !isProcessing && (
          <div className="inline-flex items-center gap-2 glass-strong px-4 py-2 rounded-full">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs">{lastResponse}</span>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex flex-col gap-3">
        {!isAuthenticated ? (
          // Login con Amazon
          <Button
            onClick={handleLogin}
            size="lg"
            className="rounded-full shadow-2xl bg-gradient-to-br from-[#FF9900] to-[#146EB4] hover:scale-105 transition-all"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Login con Amazon
          </Button>
        ) : (
          <>
            {/* Botón principal de Alexa */}
            <Button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isListening || isProcessing}
              size="lg"
              className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-[#00A8E1] to-[#0077B5] hover:scale-110 transition-all active:scale-95"
            >
              <Mic className="w-7 h-7" />
            </Button>

            {/* Botón de logout */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Salir
            </Button>
          </>
        )}
      </div>

      {/* Errores */}
      {error && (
        <div className="mt-2 glass-strong px-4 py-2 rounded-xl text-xs text-red-400 max-w-xs">
          {error}
        </div>
      )}

      {/* Configuración pendiente */}
      {AVS_CONFIG.clientId === "YOUR_CLIENT_ID" && (
        <div className="mt-2 glass-strong px-4 py-3 rounded-xl text-xs max-w-xs">
          <p className="font-semibold mb-1">⚠️ Configuración necesaria</p>
          <p className="text-muted-foreground">
            Necesitás configurar tu producto Alexa en Amazon Developer Console.
            <br />
            <a
              href="https://developer.amazon.com/alexa/console/avs/products"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Crear producto →
            </a>
          </p>
        </div>
      )}

      {/* Info de uso */}
      {isAuthenticated && (
        <div className="mt-2 glass-strong px-4 py-3 rounded-xl text-xs max-w-xs">
          <p className="font-semibold mb-1 text-green-400">✓ Conectado con Alexa</p>
          <p className="text-muted-foreground text-[10px]">
            Mantené presionado el botón y hablá.
            <br />
            Soltá cuando termines de hablar.
          </p>
        </div>
      )}
    </div>
  )
}
