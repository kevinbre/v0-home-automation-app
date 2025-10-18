import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Android TV Control via ADB
// Para TVs Philips modernos (2016+) que no tienen JointSpace habilitado

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tvIp, command, value, port, code } = body

    if (!tvIp) {
      return NextResponse.json({ error: "TV IP is required" }, { status: 400 })
    }

    const tvAddress = `${tvIp}:5555`
    let adbCommand = ""

    // Construir comando ADB según la acción
    switch (command) {
      case "pair":
        // Pairing con código
        if (!port || !code) {
          return NextResponse.json({ error: "Port and code are required for pairing" }, { status: 400 })
        }

        adbCommand = `adb pair ${tvIp}:${port}`

        try {
          console.log(`[v0] ADB Pairing: ${adbCommand}`)

          // Ejecutar pairing con el código
          const pairProcess = execAsync(adbCommand, {
            input: `${code}\n`,
          })

          const { stdout: pairOutput, stderr: pairError } = await pairProcess

          console.log("[v0] ADB Pair output:", pairOutput)

          if (pairError && !pairError.includes("Successfully paired")) {
            console.error("[v0] ADB Pair error:", pairError)
            return NextResponse.json({ error: `Pairing failed: ${pairError}` }, { status: 500 })
          }

          if (pairOutput.includes("Successfully paired") || pairOutput.includes("successfully")) {
            // Ahora conectar al puerto estándar
            try {
              await execAsync(`adb connect ${tvIp}:5555`)
            } catch (e) {
              console.log("[v0] Auto-connect failed, but pairing succeeded")
            }

            return NextResponse.json({ success: true, message: "Successfully paired and connected" })
          } else {
            return NextResponse.json({ error: "Pairing failed - incorrect code or port" }, { status: 400 })
          }
        } catch (error: any) {
          console.error("[v0] ADB Pair exception:", error)
          return NextResponse.json({ error: error.message || "Pairing failed" }, { status: 500 })
        }

      default:
        // Para todos los demás comandos, asegurarse de estar conectado primero
        try {
          await execAsync(`adb connect ${tvAddress}`)
        } catch (e) {
          console.log("[v0] ADB connect attempt:", e)
        }
        break
    }

    // Procesar comandos regulares (no pair)
    switch (command) {
      case "sendKey":
        // Mapeo de teclas JointSpace a Android key codes
        const keyMap: Record<string, string> = {
          Standby: "POWER",
          Home: "HOME",
          Back: "BACK",
          Confirm: "DPAD_CENTER",
          CursorUp: "DPAD_UP",
          CursorDown: "DPAD_DOWN",
          CursorLeft: "DPAD_LEFT",
          CursorRight: "DPAD_RIGHT",
          VolumeUp: "VOLUME_UP",
          VolumeDown: "VOLUME_DOWN",
          Mute: "VOLUME_MUTE",
          ChannelUp: "CHANNEL_UP",
          ChannelDown: "CHANNEL_DOWN",
        }

        const androidKey = keyMap[value] || value
        adbCommand = `adb -s ${tvAddress} shell input keyevent KEYCODE_${androidKey}`
        break

      case "launchApp":
        // Lanzar aplicación (YouTube, Netflix, etc)
        if (value?.intent?.component?.packageName) {
          const packageName = value.intent.component.packageName
          const className = value.intent.component.className || ""

          if (className) {
            adbCommand = `adb -s ${tvAddress} shell am start -n ${packageName}/${className}`
          } else {
            adbCommand = `adb -s ${tvAddress} shell monkey -p ${packageName} 1`
          }
        } else if (typeof value === "string") {
          // Si es solo el nombre del paquete
          adbCommand = `adb -s ${tvAddress} shell monkey -p ${value} 1`
        }
        break

      case "openYouTubeSearch":
        // Abrir YouTube con búsqueda
        const searchQuery = encodeURIComponent(value || "")
        adbCommand = `adb -s ${tvAddress} shell am start -a android.intent.action.SEARCH -n com.google.android.youtube.tv/.activity.ShellActivity --es query "${value}"`
        break

      case "setVolume":
        // ADB no permite control directo de volumen, usar teclas
        const currentVolume = 0 // Necesitarías obtenerlo primero
        const targetVolume = value
        const diff = targetVolume - currentVolume
        const key = diff > 0 ? "VOLUME_UP" : "VOLUME_DOWN"
        const times = Math.abs(diff)

        // Enviar múltiples comandos de volumen
        for (let i = 0; i < times; i++) {
          await execAsync(`adb -s ${tvAddress} shell input keyevent KEYCODE_${key}`)
        }
        return NextResponse.json({ success: true, message: `Volume adjusted by ${diff}` })

      case "getVolume":
        // ADB no puede obtener volumen fácilmente
        return NextResponse.json({ current: 50, muted: false }) // Placeholder

      case "mute":
        adbCommand = `adb -s ${tvAddress} shell input keyevent KEYCODE_VOLUME_MUTE`
        break

      default:
        return NextResponse.json({ error: "Unknown command" }, { status: 400 })
    }

    if (!adbCommand) {
      return NextResponse.json({ error: "Failed to build ADB command" }, { status: 400 })
    }

    console.log(`[v0] Android TV ADB: ${adbCommand}`)

    // Ejecutar comando ADB
    const { stdout, stderr } = await execAsync(adbCommand)

    if (stderr && !stderr.includes("connected")) {
      console.error("[v0] ADB error:", stderr)
      return NextResponse.json({ error: `ADB error: ${stderr}` }, { status: 500 })
    }

    console.log("[v0] ADB success:", stdout)

    return NextResponse.json({ success: true, output: stdout })
  } catch (error: any) {
    console.error("[v0] Android TV ADB error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to execute ADB command" },
      { status: 500 }
    )
  }
}
