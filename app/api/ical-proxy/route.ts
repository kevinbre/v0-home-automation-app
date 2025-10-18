import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    console.log("[v0] Fetching iCal from:", url)

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Smart-Home-Calendar/1.0",
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.error("[v0] Error fetching iCal:", response.status, response.statusText)
      return NextResponse.json(
        { error: `Failed to fetch calendar: ${response.status}` },
        { status: response.status }
      )
    }

    const icalData = await response.text()
    console.log("[v0] Successfully fetched iCal data, length:", icalData.length)

    return new NextResponse(icalData, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar",
        "Cache-Control": "public, max-age=300", // 5 minutes
      },
    })
  } catch (error: any) {
    console.error("[v0] Error in iCal proxy:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar data", details: error.message },
      { status: 500 }
    )
  }
}