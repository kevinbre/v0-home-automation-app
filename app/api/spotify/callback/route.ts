import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // Usar siempre 127.0.0.1 para desarrollo local
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"

  if (error) {
    return NextResponse.redirect(`${baseUrl}/spotify-auth?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/spotify-auth?error=no_code`)
  }

  // Simplemente redirigir a la herramienta con el código
  // La herramienta procesará el código usando las credenciales del formulario
  return NextResponse.redirect(`${baseUrl}/spotify-auth?code=${code}`)
}
