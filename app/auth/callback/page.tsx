"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      setStatus("error")
      setMessage(`Error: ${error}`)
      return
    }

    if (code) {
      // Intercambiar código por access token
      exchangeCodeForToken(code)
    } else {
      setStatus("error")
      setMessage("No se recibió código de autorización")
    }
  }, [searchParams])

  const exchangeCodeForToken = async (code: string) => {
    try {
      const response = await fetch("/api/alexa/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })

      if (!response.ok) {
        throw new Error("Error al obtener token")
      }

      const data = await response.json()

      // Enviar token al window opener (popup)
      if (window.opener) {
        window.opener.postMessage({
          type: "alexa_auth_success",
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in
        }, window.location.origin)

        setStatus("success")
        setMessage("Autenticación exitosa. Podés cerrar esta ventana.")

        // Cerrar automáticamente después de 2 segundos
        setTimeout(() => {
          window.close()
        }, 2000)
      }

    } catch (err: any) {
      setStatus("error")
      setMessage(err.message || "Error al autenticar")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.2_0.15_250)] via-[oklch(0.15_0.1_280)] to-[oklch(0.18_0.12_230)]">
      <div className="glass-strong rounded-3xl p-8 max-w-md text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Autenticando con Amazon...</h2>
            <p className="text-muted-foreground text-sm">Espera un momento</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-500">¡Autenticación exitosa!</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-500">Error de autenticación</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}
