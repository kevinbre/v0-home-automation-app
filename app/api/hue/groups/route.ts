import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bridgeIp = searchParams.get("bridgeIp")
    const username = searchParams.get("username")

    console.log("[v0] Fetching groups from bridge:", bridgeIp)

    if (!bridgeIp || !username) {
      return NextResponse.json({ error: "Missing bridgeIp or username" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`http://${bridgeIp}/api/${username}/groups`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    console.log("[v0] Groups response status:", response.status)

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
    console.log("[v0] Successfully fetched groups:", Object.keys(data).length)

    if (Array.isArray(data) && data[0]?.error) {
      const error = data[0].error
      console.log("[v0] Hue API error:", error)
      return NextResponse.json({ error: `Philips Hue error: ${error.description}`, hueError: error }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error fetching groups:", error)

    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout - check if bridge IP is correct" }, { status: 504 })
    }

    if (error.cause?.code === "ECONNREFUSED") {
      return NextResponse.json({ error: "Cannot connect to bridge - check IP address" }, { status: 503 })
    }

    return NextResponse.json({ error: "Failed to fetch groups", details: error.message }, { status: 500 })
  }
}
