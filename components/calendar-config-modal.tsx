"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Trash2 } from "lucide-react"

interface CalendarConfig {
  id: string
  name: string
  email: string
  color: string
}

interface CalendarConfigModalProps {
  onClose: () => void
}

export default function CalendarConfigModal({ onClose }: CalendarConfigModalProps) {
  const [calendars, setCalendars] = useState<CalendarConfig[]>([])
  const [newCalendar, setNewCalendar] = useState({
    name: "",
    email: "",
    color: "oklch(0.6 0.25 250)",
  })

  useEffect(() => {
    const savedCalendars = localStorage.getItem("googleCalendars")
    if (savedCalendars) {
      setCalendars(JSON.parse(savedCalendars))
    }
  }, [])

  const handleAddCalendar = () => {
    if (newCalendar.name && newCalendar.email) {
      const calendar: CalendarConfig = {
        id: `calendar-${Date.now()}`,
        ...newCalendar,
      }
      const updatedCalendars = [...calendars, calendar]
      setCalendars(updatedCalendars)
      localStorage.setItem("googleCalendars", JSON.stringify(updatedCalendars))
      setNewCalendar({ name: "", email: "", color: "oklch(0.6 0.25 250)" })
    }
  }

  const handleRemoveCalendar = (id: string) => {
    const updatedCalendars = calendars.filter((c) => c.id !== id)
    setCalendars(updatedCalendars)
    localStorage.setItem("googleCalendars", JSON.stringify(updatedCalendars))
  }

  const handleClose = () => {
    onClose()
    window.location.reload() // Reload to update calendar widget
  }

  const colorOptions = [
    "oklch(0.6 0.25 250)", // Blue
    "oklch(0.65 0.22 150)", // Green
    "oklch(0.6 0.23 30)", // Orange
    "oklch(0.65 0.25 330)", // Pink
    "oklch(0.6 0.22 280)", // Purple
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Configurar Calendarios</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-2xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-4">
            <h3 className="font-semibold mb-3">Agregar Nuevo Calendario</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre</label>
                <Input
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                  placeholder="Ej: Personal, Trabajo"
                  className="glass rounded-xl border-white/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email de Google</label>
                <Input
                  value={newCalendar.email}
                  onChange={(e) => setNewCalendar({ ...newCalendar, email: e.target.value })}
                  placeholder="ejemplo@gmail.com"
                  type="email"
                  className="glass rounded-xl border-white/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCalendar({ ...newCalendar, color })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newCalendar.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-black/20" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAddCalendar} className="w-full glass-strong rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Calendario
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Calendarios Configurados</h3>
            {calendars.length === 0 ? (
              <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
                No hay calendarios configurados
              </div>
            ) : (
              calendars.map((calendar) => (
                <div key={calendar.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: calendar.color }} />
                    <div>
                      <p className="font-medium text-sm">{calendar.name}</p>
                      <p className="text-xs text-muted-foreground">{calendar.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCalendar(calendar.id)}
                    className="rounded-xl hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="glass rounded-2xl p-4 bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs font-medium mb-2">📝 Próximos pasos</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Ve a Google Calendar API Console</li>
              <li>Crea credenciales OAuth 2.0</li>
              <li>Implementa la autenticación en el código</li>
              <li>Los eventos se sincronizarán automáticamente</li>
            </ol>
          </div>

          <Button onClick={handleClose} className="w-full glass-strong rounded-xl py-6">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
