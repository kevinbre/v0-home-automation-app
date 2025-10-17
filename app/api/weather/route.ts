import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city") || "Rosario"

  try {
    // Get API key from server-side environment variable (more secure)
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city},AR&units=metric&lang=es&appid=${apiKey}`,
      { next: { revalidate: 600 } }, // Cache for 10 minutes
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch weather data" }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      city: city,
    })
  } catch (error) {
    console.error("[v0] Error fetching weather:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
