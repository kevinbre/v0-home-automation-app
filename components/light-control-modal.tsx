"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { HueColorPicker } from "@/components/hue-color-picker"
import { Lightbulb } from "lucide-react"

interface LightControlModalProps {
  isOpen: boolean
  onClose: () => void
  light: {
    id: string
    name: string
    room: string
    status: boolean
    brightness: number
    color: { h: number; s: number }
  } | null
  onToggle: () => void
  onBrightnessChange: (value: number) => void
  onColorChange: (color: { h: number; s: number }) => void
}

export function LightControlModal({
  isOpen,
  onClose,
  light,
  onToggle,
  onBrightnessChange,
  onColorChange,
}: LightControlModalProps) {
  if (!light) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-strong border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.2_60)]/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-[oklch(0.7_0.2_60)]" />
            </div>
            <div>
              <p className="text-lg font-bold">{light.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{light.room}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between glass rounded-2xl p-4">
            <span className="font-medium">Encendido</span>
            <Switch checked={light.status} onCheckedChange={onToggle} />
          </div>

          {light.status && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Brillo</span>
                  <span className="text-sm text-muted-foreground">{light.brightness}%</span>
                </div>
                <Slider
                  value={[light.brightness]}
                  onValueChange={([value]) => onBrightnessChange(value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium">Color</span>
                <HueColorPicker
                  selectedColor={light.color}
                  onColorChange={onColorChange}
                  brightness={light.brightness}
                  onBrightnessChange={onBrightnessChange}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
