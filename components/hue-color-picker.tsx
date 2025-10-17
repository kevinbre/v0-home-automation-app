"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface HueColorPickerProps {
  lightId: string
  currentHue?: number
  currentSat?: number
  currentBri: number
  onColorChange: (hue: number, sat: number) => void
  onBrightnessChange: (brightness: number) => void
}

export function HueColorPicker({
  lightId,
  currentHue = 0,
  currentSat = 254,
  currentBri,
  onColorChange,
  onBrightnessChange,
}: HueColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    drawColorWheel()
    updatePositionFromColor()
  }, [])

  useEffect(() => {
    updatePositionFromColor()
  }, [currentHue, currentSat])

  const updatePositionFromColor = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = canvas.width / 2 - 10

    // Convert Hue (0-65535) to angle
    const angle = ((currentHue || 0) / 65535) * 360 - 90
    const angleRad = (angle * Math.PI) / 180

    // Convert Sat (0-254) to distance
    const distance = ((currentSat || 0) / 254) * maxRadius

    const x = centerX + Math.cos(angleRad) * distance
    const y = centerY + Math.sin(angleRad) * distance

    setPosition({ x, y })
  }

  const drawColorWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = canvas.width / 2 - 10

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw color wheel with radial gradient from white center to saturated colors
    for (let angle = 0; angle < 360; angle += 0.5) {
      const startAngle = (angle - 90) * (Math.PI / 180)
      const endAngle = (angle + 0.5 - 90) * (Math.PI / 180)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, "#ffffff")
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`)

      ctx.fillStyle = gradient
      ctx.fill()
    }
  }

  const handleColorSelect = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxRadius = canvas.width / 2 - 10

    if (distance > maxRadius) return

    setPosition({ x, y })

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
    if (angle < 0) angle += 360

    const hue = Math.round((angle / 360) * 65535)
    const sat = Math.min(254, Math.round((distance / maxRadius) * 254))

    onColorChange(hue, sat)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    handleColorSelect(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleColorSelect(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            setIsDragging(true)
            handleColorSelect(e)
          }}
          onTouchMove={(e) => {
            if (isDragging) handleColorSelect(e)
          }}
          onTouchEnd={() => setIsDragging(false)}
          className="cursor-pointer rounded-full"
          style={{ touchAction: "none" }}
        />
        <div
          className="absolute w-8 h-8 rounded-full border-4 border-white pointer-events-none transition-all duration-100"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </div>
  )
}
