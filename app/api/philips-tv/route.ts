import { type NextRequest, NextResponse } from "next/server"

// Philips TV JointSpace API
// Documentación: https://github.com/eslavnov/pylips

export async function POST(request: NextRequest) {
  try {
    const { tvIp, command, value } = await request.json()

    if (!tvIp) {
      return NextResponse.json({ error: "TV IP is required" }, { status: 400 })
    }

    // Construir la URL según el comando
    let url = ""
    let method = "POST"
    let body: any = {}

    switch (command) {
      case "getVolume":
        url = `http://${tvIp}:1925/1/audio/volume`
        method = "GET"
        break
      case "setVolume":
        url = `http://${tvIp}:1925/1/audio/volume`
        body = { current: value, muted: false }
        break
      case "mute":
        url = `http://${tvIp}:1925/1/audio/volume`
        body = { muted: value }
        break
      case "sendKey":
        url = `http://${tvIp}:1925/1/input/key`
        body = { key: value }
        break
      case "launchApp":
        url = `http://${tvIp}:1925/1/activities/launch`
        body = { intent: value }
        break
      case "getCurrentActivity":
        url = `http://${tvIp}:1925/1/activities/current`
        method = "GET"
        break
      case "getChannels":
        url = `http://${tvIp}:1925/1/channels`
        method = "GET"
        break
      case "setChannel":
        url = `http://${tvIp}:1925/1/channels/current`
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
