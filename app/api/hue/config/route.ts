import { NextResponse } from "next/server"

// En producción, esto debería estar en una base de datos
// Por ahora usamos variables en memoria (se perderán al reiniciar)
let hueConfig = {
  bridgeIp: "",
  username: "",
}

export async function GET() {
  return NextResponse.json(hueConfig)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    hueConfig = {
      bridgeIp: body.bridgeIp || hueConfig.bridgeIp,
      username: body.username || hueConfig.username,
    }
    return NextResponse.json({ success: true, config: hueConfig })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  }
}
