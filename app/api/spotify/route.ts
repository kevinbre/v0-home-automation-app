import { NextRequest, NextResponse } from "next/server"

// Obtener access token usando refresh token
async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error_description || data.error)
  }

  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { action, clientId, clientSecret, refreshToken, ...params } = await request.json()

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { error: "Faltan credenciales de Spotify" },
        { status: 400 }
      )
    }

    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken)

    switch (action) {
      case "play":
        // Reproducir (reanudar)
        await fetch("https://api.spotify.com/v1/me/player/play", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        return NextResponse.json({ success: true })

      case "pause":
        // Pausar
        await fetch("https://api.spotify.com/v1/me/player/pause", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        return NextResponse.json({ success: true })

      case "next":
        // Siguiente canción
        await fetch("https://api.spotify.com/v1/me/player/next", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        return NextResponse.json({ success: true })

      case "previous":
        // Canción anterior
        await fetch("https://api.spotify.com/v1/me/player/previous", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        return NextResponse.json({ success: true })

      case "volume":
        // Ajustar volumen (0-100)
        const { volume } = params
        await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        return NextResponse.json({ success: true })

      case "search":
        // Buscar canción/artista/álbum
        const { query, type = "track,artist", limit = 10 } = params
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        const searchData = await searchResponse.json()
        return NextResponse.json(searchData)

      case "searchAndPlay":
        // Buscar y reproducir automáticamente
        const { query: searchQuery, type: searchType = "track,artist" } = params

        // Buscar
        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        const searchResult = await searchRes.json()

        // Reproducir el primer resultado
        if (searchResult.tracks?.items?.[0]) {
          await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [searchResult.tracks.items[0].uri],
            }),
          })
          return NextResponse.json({
            success: true,
            playing: searchResult.tracks.items[0].name,
            artist: searchResult.tracks.items[0].artists[0].name
          })
        } else if (searchResult.artists?.items?.[0]) {
          // Si es un artista, reproducir sus top tracks
          const artistId = searchResult.artists.items[0].id
          const topTracksRes = await fetch(
            `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
          const topTracks = await topTracksRes.json()

          if (topTracks.tracks?.[0]) {
            await fetch("https://api.spotify.com/v1/me/player/play", {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                uris: topTracks.tracks.map((t: any) => t.uri),
              }),
            })
            return NextResponse.json({
              success: true,
              playing: `Top tracks de ${searchResult.artists.items[0].name}`
            })
          }
        }

        return NextResponse.json({ error: "No se encontraron resultados" }, { status: 404 })

      case "playTrack":
        // Reproducir una canción específica
        const { uri, deviceId: playDeviceId } = params
        const playUrl = playDeviceId
          ? `https://api.spotify.com/v1/me/player/play?device_id=${playDeviceId}`
          : "https://api.spotify.com/v1/me/player/play"

        await fetch(playUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [uri],
          }),
        })
        return NextResponse.json({ success: true })

      case "playPlaylist":
        // Reproducir una playlist
        const { playlistUri, deviceId: playlistDeviceId } = params
        const playlistUrl = playlistDeviceId
          ? `https://api.spotify.com/v1/me/player/play?device_id=${playlistDeviceId}`
          : "https://api.spotify.com/v1/me/player/play"

        await fetch(playlistUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            context_uri: playlistUri,
          }),
        })
        return NextResponse.json({ success: true })

      case "getCurrentTrack":
        // Obtener canción actual
        const currentResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (currentResponse.status === 204) {
          return NextResponse.json({ playing: false })
        }

        const currentData = await currentResponse.json()
        return NextResponse.json(currentData)

      case "getPlaylists":
        // Obtener playlists del usuario
        const playlistsResponse = await fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const playlistsData = await playlistsResponse.json()
        return NextResponse.json(playlistsData)

      case "shuffle":
        // Activar/desactivar aleatorio
        const { state } = params
        await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${state}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        return NextResponse.json({ success: true })

      case "getDevices":
        // Obtener dispositivos disponibles
        const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const devicesData = await devicesResponse.json()
        return NextResponse.json(devicesData)

      case "transferPlayback":
        // Transferir reproducción a un dispositivo
        const { deviceId, play } = params
        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: play !== false, // Por defecto continuar reproduciendo
          }),
        })
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error: any) {
    // Solo mostrar errores que no sean de autenticación o estado normal
    if (error?.message && !error.message.includes("invalid_grant")) {
      console.error("[Spotify API] Error:", error)
    }
    return NextResponse.json({ error: error?.message || "Error en la API de Spotify" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")
    const clientId = searchParams.get("clientId")
    const clientSecret = searchParams.get("clientSecret")
    const refreshToken = searchParams.get("refreshToken")

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { error: "Faltan credenciales de Spotify" },
        { status: 400 }
      )
    }

    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken)

    if (action === "currentTrack") {
      const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.status === 204) {
        return NextResponse.json({ playing: false })
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === "playlists") {
      const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === "getUserInfo") {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error: any) {
    // Solo mostrar errores que no sean de autenticación o estado normal
    if (error?.message && !error.message.includes("invalid_grant")) {
      console.error("[Spotify API GET] Error:", error)
    }
    return NextResponse.json({ error: error?.message || "Error en la API de Spotify" }, { status: 500 })
  }
}
