import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ lightId: string }> }) {
  try {
    const { lightId } = await params
    const body = await request.json()
    const { bridgeIp, username, state } = body

    console.log("[v0] Controlling light:", lightId, "with state:", state)

    if (!bridgeIp || !username || !state) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`http://${bridgeIp}/api/${username}/lights/${lightId}/state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    console.log("[v0] Light control response status:", response.status)

    if (!response.ok) {
      const text = await response.text()
      console.log("[v0] Error response:", text)
      return NextResponse.json({ error: `Bridge returned error: ${response.status}` }, { status: response.status })
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.log("[v0] Non-JSON response:", text)
      return NextResponse.json({ error: "Bridge returned non-JSON response" }, { status: 500 })
    }

    const data = await response.json()
    console.log("[v0] Light control response:", data)

    if (Array.isArray(data) && data[0]?.error) {
      const error = data[0].error
      console.log("[v0] Hue API error:", error)
      return NextResponse.json({ error: `Philips Hue error: ${error.description}`, hueError: error }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error controlling light:", error)

    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 })
    }

    return NextResponse.json({ error: "Failed to control light", details: error.message }, { status: 500 })
  }
}
