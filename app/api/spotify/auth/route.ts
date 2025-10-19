import { NextRequest, NextResponse } from "next/server"

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ""
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ""
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`
  : "http://127.0.0.1:3000/api/spotify/callback"

// Generar URL de autorización
export async function GET() {
  const scope = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
  ].join(" ")

  const authUrl = new URL("https://accounts.spotify.com/authorize")
  authUrl.searchParams.append("client_id", SPOTIFY_CLIENT_ID)
  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI)
  authUrl.searchParams.append("scope", scope)
  authUrl.searchParams.append("show_dialog", "true")

  return NextResponse.json({ authUrl: authUrl.toString() })
}
