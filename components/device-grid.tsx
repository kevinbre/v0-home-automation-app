"use client"

import { useState } from "react"
import { Lightbulb, Tv, Volume2, Power } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { LightControlModal } from "@/components/light-control-modal"

interface Device {
  id: string
  name: string
  type: "light" | "tv" | "speaker"
  status: boolean
  icon: any
  room: string
  brightness?: number
  color?: { h: number; s: number }
}

const initialDevices: Device[] = [
  {
    id: "1",
    name: "Luz Sala",
    type: "light",
    status: true,
    icon: Lightbulb,
    room: "Sala",
    brightness: 80,
    color: { h: 45, s: 0.8 },
  },
  {
    id: "2",
    name: "Luz Cocina",
    type: "light",
    status: false,
    icon: Lightbulb,
    room: "Cocina",
    brightness: 60,
    color: { h: 200, s: 0.6 },
  },
  {
    id: "3",
    name: "Luz Dormitorio",
    type: "light",
    status: true,
    icon: Lightbulb,
    room: "Dormitorio",
    brightness: 50,
    color: { h: 280, s: 0.7 },
  },
  { id: "4", name: "Smart TV Sala", type: "tv", status: false, icon: Tv, room: "Sala" },
  { id: "5", name: "Alexa Cocina", type: "speaker", status: true, icon: Volume2, room: "Cocina" },
  { id: "6", name: "Alexa Dormitorio", type: "speaker", status: false, icon: Volume2, room: "Dormitorio" },
]

export function DeviceGrid() {
  const [devices, setDevices] = useState(initialDevices)
  const [selectedLight, setSelectedLight] = useState<Device | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const toggleDevice = (id: string) => {
    setDevices(devices.map((device) => (device.id === id ? { ...device, status: !device.status } : device)))
  }

  const handleDeviceClick = (device: Device) => {
    if (device.type === "light") {
      setSelectedLight(device)
      setIsModalOpen(true)
    }
  }

  const handleBrightnessChange = (value: number) => {
    if (!selectedLight) return
    setDevices(devices.map((device) => (device.id === selectedLight.id ? { ...device, brightness: value } : device)))
    setSelectedLight({ ...selectedLight, brightness: value })
  }

  const handleColorChange = (color: { h: number; s: number }) => {
    if (!selectedLight) return
    setDevices(devices.map((device) => (device.id === selectedLight.id ? { ...device, color } : device)))
    setSelectedLight({ ...selectedLight, color })
  }

  const handleToggleModal = () => {
    if (!selectedLight) return
    toggleDevice(selectedLight.id)
    const updatedDevice = devices.find((d) => d.id === selectedLight.id)
    if (updatedDevice) {
      setSelectedLight(updatedDevice)
    }
  }

  const getDeviceColor = (device: Device) => {
    if (!device.status) return "oklch(0.4 0.05 250)"

    if (device.type === "light" && device.color) {
      const { h, s } = device.color
      return `oklch(0.7 ${s * 0.25} ${h})`
    }

    switch (device.type) {
      case "light":
        return "oklch(0.7 0.2 60)"
      case "tv":
        return "oklch(0.6 0.25 250)"
      case "speaker":
        return "oklch(0.55 0.22 280)"
      default:
        return "oklch(0.5 0.2 250)"
    }
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-4 px-2">Dispositivos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const Icon = device.icon
            const color = getDeviceColor(device)

            return (
              <div
                key={device.id}
                className="glass-strong rounded-3xl p-6 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => handleDeviceClick(device)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${color}/0.2` }}
                  >
                    <Icon className="w-6 h-6 transition-colors" style={{ color }} />
                  </div>
                  <Switch
                    checked={device.status}
                    onCheckedChange={(e) => {
                      e.stopPropagation()
                      toggleDevice(device.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-base mb-1">{device.name}</h3>
                  <p className="text-xs text-muted-foreground">{device.room}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Power className="w-3 h-3" style={{ color }} />
                    <span className="text-xs font-medium" style={{ color }}>
                      {device.status ? "Encendido" : "Apagado"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <LightControlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        light={selectedLight}
        onToggle={handleToggleModal}
        onBrightnessChange={handleBrightnessChange}
        onColorChange={handleColorChange}
      />
    </>
  )
}
