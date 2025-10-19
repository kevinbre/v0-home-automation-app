import { type NextRequest, NextResponse } from "next/server"

const AVS_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_ALEXA_CLIENT_ID || "",
  clientSecret: process.env.ALEXA_CLIENT_SECRET || "",
  redirectUri: process.env.NEXT_PUBLIC_ALEXA_REDIRECT_URI || "http://localhost:3000/auth/callback",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    // Intercambiar código por access token
    const tokenResponse = await fetch("https://api.amazon.com/auth/o2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: AVS_CONFIG.clientId,
        client_secret: AVS_CONFIG.clientSecret,
        redirect_uri: AVS_CONFIG.redirectUri,
      }).toString()
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("[Alexa] Token error:", errorData)
      return NextResponse.json(
        { error: "Failed to exchange code for token" },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type
    })

  } catch (error: any) {
    console.error("[Alexa] Token exchange error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get access token" },
      { status: 500 }
    )
  }
}
