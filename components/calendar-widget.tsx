"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CalendarEvent {
  id: string
  title: string
  time: string
  color: string
  calendarId: string
}

interface CalendarConfig {
  id: string
  name: string
  email: string
  color: string
}

const USE_MOCK_DATA = false

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "1", title: "Reunión de equipo", time: "10:00 AM", color: "oklch(0.6 0.25 250)", calendarId: "calendar1" },
    { id: "2", title: "Almuerzo con cliente", time: "1:00 PM", color: "oklch(0.65 0.22 150)", calendarId: "calendar1" },
    { id: "3", title: "Revisión de proyecto", time: "4:30 PM", color: "oklch(0.6 0.23 30)", calendarId: "calendar2" },
  ])

  const [calendars, setCalendars] = useState<CalendarConfig[]>([
    { id: "calendar1", name: "Personal", email: "personal@gmail.com", color: "oklch(0.6 0.25 250)" },
    { id: "calendar2", name: "Trabajo", email: "trabajo@gmail.com", color: "oklch(0.65 0.22 150)" },
  ])

  const [selectedCalendar, setSelectedCalendar] = useState<string>("all")

  useEffect(() => {
    if (!USE_MOCK_DATA) {
      loadCalendars()
    }
  }, [])

  const loadCalendars = () => {
    // Load calendars from localStorage
    const savedCalendars = localStorage.getItem("googleCalendars")
    if (savedCalendars) {
      setCalendars(JSON.parse(savedCalendars))
    }
  }

  const filteredEvents = selectedCalendar === "all" ? events : events.filter((e) => e.calendarId === selectedCalendar)

  const getCalendarName = (calendarId: string) => {
    const calendar = calendars.find((c) => c.id === calendarId)
    return calendar ? calendar.name : "Todos"
  }

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.6_0.25_250)]/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-[oklch(0.6_0.25_250)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Calendario</h3>
            <p className="text-xs text-muted-foreground">Eventos de hoy</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="glass rounded-xl px-3 py-2 text-xs">
              {selectedCalendar === "all" ? "Todos" : getCalendarName(selectedCalendar)}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong border-white/10">
            <DropdownMenuItem onClick={() => setSelectedCalendar("all")} className="text-sm">
              Todos los calendarios
            </DropdownMenuItem>
            {calendars.map((calendar) => (
              <DropdownMenuItem key={calendar.id} onClick={() => setSelectedCalendar(calendar.id)} className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: calendar.color }} />
                  {calendar.name}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">No hay eventos para hoy</div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="glass rounded-2xl p-3 hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-1 h-12 rounded-full" style={{ backgroundColor: event.color }} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{event.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
