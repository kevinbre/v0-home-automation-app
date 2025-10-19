"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TabletInput } from "@/components/ui/tablet-input"
import { Copy, Check, ExternalLink } from "lucide-react"

export default function SpotifyAuthPage() {
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [authCode, setAuthCode] = useState("")
  const [refreshToken, setRefreshToken] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Capturar código de la URL automáticamente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const urlError = params.get('error')

      if (code) {
        setAuthCode(code)
        // Limpiar URL
        window.history.replaceState({}, '', '/spotify-auth')
      }

      if (urlError) {
        setError(`Error de autorización: ${urlError}`)
        window.history.replaceState({}, '', '/spotify-auth')
      }
    }
  }, [])

  // Cargar credenciales guardadas al montar
  useEffect(() => {
    const savedClientId = localStorage.getItem("temp_spotify_client_id")
    const savedClientSecret = localStorage.getItem("temp_spotify_client_secret")

    if (savedClientId) setClientId(savedClientId)
    if (savedClientSecret) setClientSecret(savedClientSecret)
  }, [])

  const getAuthUrl = () => {
    if (!clientId) {
      alert("Ingresa tu Client ID primero")
      return
    }

    // Guardar credenciales temporalmente para cuando regrese del callback
    localStorage.setItem("temp_spotify_client_id", clientId)
    localStorage.setItem("temp_spotify_client_secret", clientSecret)

    const scopes = [
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-library-read",
    ]

    const authUrl = new URL("https://accounts.spotify.com/authorize")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("redirect_uri", "http://127.0.0.1:3000/api/spotify/callback")
    authUrl.searchParams.append("scope", scopes.join(" "))
    authUrl.searchParams.append("show_dialog", "true")

    // Abrir en la misma ventana para que regrese aquí
    window.location.href = authUrl.toString()
  }

  const getRefreshToken = async () => {
    if (!clientId || !clientSecret || !authCode) {
      setError("Por favor completa todos los campos")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("[Spotify Auth] Intentando obtener token...")
      console.log("[Spotify Auth] Client ID:", clientId.substring(0, 10) + "...")
      console.log("[Spotify Auth] Code:", authCode.substring(0, 20) + "...")

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authCode.trim(),
          redirect_uri: "http://127.0.0.1:3000/api/spotify/callback",
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
        }),
      })

      const data = await response.json()
      console.log("[Spotify Auth] Response:", data)

      if (data.error) {
        setError(`Error: ${data.error_description || data.error}`)
        console.error("[Spotify Auth] Error completo:", data)
        return
      }

      setRefreshToken(data.refresh_token)
      setError("")

      // Limpiar credenciales temporales
      localStorage.removeItem("temp_spotify_client_id")
      localStorage.removeItem("temp_spotify_client_secret")
    } catch (err) {
      setError("Error al obtener el token. Verifica tus credenciales.")
      console.error("[Spotify Auth] Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(refreshToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.2_0.15_250)] via-[oklch(0.15_0.1_280)] to-[oklch(0.18_0.12_230)] p-6">
      <div className="container mx-auto max-w-2xl">
        <div className="glass-strong rounded-3xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Spotify - Obtener Refresh Token</h1>
            <p className="text-muted-foreground">
              Herramienta para obtener tu Refresh Token sin configurar Redirect URI
            </p>
          </div>

          {/* Instrucciones */}
          <div className="glass rounded-2xl p-4 space-y-3 text-sm">
            <h3 className="font-semibold">📝 Instrucciones:</h3>
            <ol className="space-y-2 ml-4 list-decimal text-muted-foreground">
              <li>Ve a <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-[#1DB954] hover:underline">Spotify Developer Dashboard</a></li>
              <li>Crea una app (o usa una existente)</li>
              <li>Copia el <strong>Client ID</strong> y <strong>Client Secret</strong></li>
              <li><strong>NO necesitas configurar Redirect URI</strong></li>
              <li>Pega tus credenciales abajo</li>
            </ol>
          </div>

          {/* Paso 1: Credenciales */}
          <div className="space-y-3">
            <h3 className="font-semibold">1. Ingresa tus credenciales</h3>

            <TabletInput
              placeholder="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="glass"
            />

            <TabletInput
              placeholder="Client Secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="glass"
            />

            <Button
              onClick={getAuthUrl}
              disabled={!clientId}
              className="w-full rounded-xl bg-[#1DB954] hover:bg-[#1ed760]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir página de autorización
            </Button>
          </div>

          {/* Paso 2: Código de autorización */}
          <div className="space-y-3">
            <h3 className="font-semibold">2. Obtén el código de autorización</h3>

            {authCode ? (
              <div className="glass rounded-2xl p-4 bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 font-semibold mb-2">✅ Código recibido automáticamente</p>
                <p className="text-xs text-muted-foreground">Ahora haz click en "Obtener Refresh Token"</p>
              </div>
            ) : (
              <div className="glass rounded-2xl p-3 text-xs text-muted-foreground space-y-2">
                <p>Después de autorizar, serás redirigido automáticamente de vuelta aquí.</p>
                <p className="text-[#1DB954]">El código se capturará automáticamente, no necesitas copiarlo manualmente.</p>
              </div>
            )}

            <TabletInput
              placeholder="Código de autorización (se captura automáticamente)"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="glass font-mono text-xs"
              readOnly
            />

            <Button
              onClick={getRefreshToken}
              disabled={!clientId || !clientSecret || !authCode || loading}
              className="w-full rounded-xl"
            >
              {loading ? "Obteniendo token..." : "Obtener Refresh Token"}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="glass rounded-2xl p-4 bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Resultado */}
          {refreshToken && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[#1DB954]">✅ ¡Refresh Token obtenido!</h3>

              <div className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Refresh Token:</label>
                  <Button
                    onClick={copyToken}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>

                <div className="glass rounded-xl p-3 bg-black/20">
                  <code className="text-xs break-all text-[#1DB954]">
                    {refreshToken}
                  </code>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✅ Usa este token en la aplicación al agregar una cuenta de Spotify</p>
                  <p>✅ Este token NO expira, guárdalo de forma segura</p>
                  <p>✅ Puedes cerrar esta página después de copiar el token</p>
                </div>
              </div>
            </div>
          )}

          {/* Ayuda */}
          <div className="glass rounded-2xl p-3 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">💡 Consejos:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>El código de autorización expira en 10 minutos</li>
              <li>Si el código expira, vuelve a hacer click en "Abrir página de autorización"</li>
              <li>El Refresh Token NO expira y puedes reutilizarlo</li>
              <li>Necesitas Spotify Premium para que funcione la API</li>
            </ul>
          </div>

          {/* Volver */}
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="w-full rounded-xl"
          >
            Volver a la aplicación
          </Button>
        </div>
      </div>
    </div>
  )
}
