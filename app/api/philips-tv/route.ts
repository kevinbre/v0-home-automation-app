import { type NextRequest, NextResponse } from "next/server"

// Philips TV JointSpace API
// Documentación: https://github.com/eslavnov/pylips

// Helper para detectar el puerto correcto del TV
async function detectTvPort(tvIp: string): Promise<number> {
  // Intentar puerto 1926 primero (API v6 - TVs más nuevos)
  try {
    const response = await fetch(`http://${tvIp}:1926/6/system`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    })
    if (response.ok) {
      console.log(`[v0] TV ${tvIp} usa API v6 (puerto 1926)`)
      return 1926
    }
  } catch (e) {
    // Puerto 1926 no responde, probar 1925
  }

  // Intentar puerto 1925 (API v1 - TVs más viejos)
  try {
    const response = await fetch(`http://${tvIp}:1925/1/system`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    })
    if (response.ok) {
      console.log(`[v0] TV ${tvIp} usa API v1 (puerto 1925)`)
      return 1925
    }
  } catch (e) {
    // Puerto 1925 tampoco responde
  }

  console.log(`[v0] No se pudo detectar puerto para TV ${tvIp}, usando 1925 por defecto`)
  return 1925 // Por defecto
}

export async function POST(request: NextRequest) {
  try {
    const { tvIp, command, value } = await request.json()

    if (!tvIp) {
      return NextResponse.json({ error: "TV IP is required" }, { status: 400 })
    }

    // Detectar el puerto correcto
    const port = await detectTvPort(tvIp)
    const apiVersion = port === 1926 ? 6 : 1

    // Construir la URL según el comando
    let url = ""
    let method = "POST"
    let body: any = {}

    switch (command) {
      case "getVolume":
        url = `http://${tvIp}:${port}/${apiVersion}/audio/volume`
        method = "GET"
        break
      case "setVolume":
        url = `http://${tvIp}:${port}/${apiVersion}/audio/volume`
        body = { current: value, muted: false }
        break
      case "mute":
        url = `http://${tvIp}:${port}/${apiVersion}/audio/volume`
        body = { muted: value }
        break
      case "sendKey":
        url = `http://${tvIp}:${port}/${apiVersion}/input/key`
        body = { key: value }
        break
      case "launchApp":
        url = `http://${tvIp}:${port}/${apiVersion}/activities/launch`
        body = apiVersion === 6 ? value : { intent: value }
        break
      case "getCurrentActivity":
        url = `http://${tvIp}:${port}/${apiVersion}/activities/current`
        method = "GET"
        break
      case "getChannels":
        url = `http://${tvIp}:${port}/${apiVersion}/channels`
        method = "GET"
        break
      case "setChannel":
        url = `http://${tvIp}:${port}/${apiVersion}/channels/current`
        body = { channel: value }
        break
      default:
        return NextResponse.json({ error: "Unknown command" }, { status: 400 })
    }

    console.log(`[v0] Philips TV API: ${method} ${url}`, body)

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[v0] Philips TV API error: ${response.status} ${text}`)
      return NextResponse.json({ error: `TV returned error: ${response.status}` }, { status: response.status })
    }

    const data = method === "GET" ? await response.json() : { success: true }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Philips TV API error:", error)
    return NextResponse.json({ error: error.message || "Failed to communicate with TV" }, { status: 500 })
  }
}
