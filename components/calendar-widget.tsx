"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, ChevronDown, RefreshCw, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
  calendarId: string
  calendarName: string
}

interface CalendarConfig {
  id: string
  name: string
  icalUrl: string
  color: string
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([])
  const [calendars, setCalendars] = useState<CalendarConfig[]>([])
  const [selectedCalendar, setSelectedCalendar] = useState<string>("all")
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFullCalendar, setShowFullCalendar] = useState(false)
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    loadCalendars()
  }, [])

  useEffect(() => {
    if (calendars.length > 0) {
      fetchEvents()
    }
  }, [calendars])

  useEffect(() => {
    filterTodayEvents()
  }, [allEvents, showPastEvents])

  const loadCalendars = () => {
    const savedCalendars = localStorage.getItem("icalCalendars")
    if (savedCalendars) {
      setCalendars(JSON.parse(savedCalendars))
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("[DEBUG] Starting to fetch events from", calendars.length, "calendars")
      const allEventsArray: CalendarEvent[] = []

      for (const calendar of calendars) {
        try {
          console.log("[DEBUG] Fetching calendar:", calendar.name, calendar.icalUrl)
          
          const response = await fetch(`/api/ical-proxy?url=${encodeURIComponent(calendar.icalUrl)}`)
          
          console.log("[DEBUG] Response status:", response.status)
          
          if (!response.ok) {
            console.error(`[DEBUG] Error fetching calendar ${calendar.name}:`, response.statusText)
            setError(`Error al cargar calendario ${calendar.name}`)
            continue
          }

          const icalData = await response.text()
          console.log("[DEBUG] iCal data received, length:", icalData.length)
          console.log("[DEBUG] First 500 chars:", icalData.substring(0, 500))
          
          const parsedEvents = parseICalData(icalData, calendar)
          console.log("[DEBUG] Parsed", parsedEvents.length, "events from", calendar.name)
          
          allEventsArray.push(...parsedEvents)
        } catch (err) {
          console.error(`[DEBUG] Error loading calendar ${calendar.name}:`, err)
          setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }

      console.log("[DEBUG] Total events before filtering:", allEventsArray.length)

      allEventsArray.sort((a, b) => a.start.getTime() - b.start.getTime())

      console.log("[DEBUG] Total events loaded:", allEventsArray.length)
      setAllEvents(allEventsArray)
    } catch (err) {
      console.error("[DEBUG] Error fetching events:", err)
      setError(`Error al cargar eventos: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const filterTodayEvents = () => {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log("[DEBUG] Filtering today's events, showPastEvents:", showPastEvents)

    const todayEvents = allEvents.filter(event => {
      const eventStart = new Date(event.start)
      const isToday = eventStart >= today && eventStart < tomorrow
      
      if (showPastEvents) {
        return isToday
      } else {
        return isToday && eventStart >= now
      }
    })

    console.log("[DEBUG] Filtered to", todayEvents.length, "events")
    setEvents(todayEvents)
  }

  const parseICalData = (icalData: string, calendar: CalendarConfig): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    const lines = icalData.split(/\r?\n/)
    let currentEvent: any = null
    let lineBuffer = ""

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]
      
      if (line.startsWith(" ") || line.startsWith("\t")) {
        lineBuffer += line.trim()
        continue
      }
      
      if (lineBuffer) {
        processLine(lineBuffer)
        lineBuffer = ""
      }
      
      lineBuffer = line.trim()
    }
    
    if (lineBuffer) {
      processLine(lineBuffer)
    }

    function processLine(line: string) {
      if (line === "BEGIN:VEVENT") {
        currentEvent = {
          id: `${calendar.id}-${Date.now()}-${Math.random()}`,
          title: "",
          start: new Date(),
          end: new Date(),
          color: calendar.color,
          calendarId: calendar.id,
          calendarName: calendar.name,
          rrule: null,
          startTzid: null,
          endTzid: null,
        }
      } else if (line === "END:VEVENT" && currentEvent) {
        if (currentEvent.title && currentEvent.start) {
          // Si tiene RRULE, expandir las ocurrencias
          if (currentEvent.rrule) {
            console.log("[DEBUG] Found recurring event:", currentEvent.title, "RRULE:", currentEvent.rrule)
            const occurrences = expandRecurrence(currentEvent)
            console.log("[DEBUG] Expanded to", occurrences.length, "occurrences")
            events.push(...occurrences)
          } else {
            console.log("[DEBUG] Adding single event:", currentEvent.title, "Start:", currentEvent.start.toLocaleString("es-AR"))
            events.push(currentEvent)
          }
        } else {
          console.log("[DEBUG] Skipping event - missing title or start:", currentEvent)
        }
        currentEvent = null
      } else if (currentEvent) {
        if (line.startsWith("SUMMARY:")) {
          currentEvent.title = line.substring(8).trim()
        } else if (line.startsWith("DTSTART")) {
          // Extraer TZID si existe: DTSTART;TZID=America/New_York:20251021T140000
          const tzidMatch = line.match(/TZID=([^:;]+)/)
          const tzid = tzidMatch ? tzidMatch[1] : null
          currentEvent.startTzid = tzid
          
          const colonIndex = line.indexOf(":")
          if (colonIndex !== -1) {
            const dateStr = line.substring(colonIndex + 1).trim()
            currentEvent.start = parseICalDate(dateStr, tzid || undefined)
          }
        } else if (line.startsWith("DTEND")) {
          // Extraer TZID si existe
          const tzidMatch = line.match(/TZID=([^:;]+)/)
          const tzid = tzidMatch ? tzidMatch[1] : null
          currentEvent.endTzid = tzid
          
          const colonIndex = line.indexOf(":")
          if (colonIndex !== -1) {
            const dateStr = line.substring(colonIndex + 1).trim()
            currentEvent.end = parseICalDate(dateStr, tzid || undefined)
          }
        } else if (line.startsWith("RRULE:")) {
          currentEvent.rrule = line.substring(6).trim()
        } else if (line.startsWith("UID:")) {
          const uid = line.substring(4).trim()
          currentEvent.id = `${calendar.id}-${uid}`
        }
      }
    }

    console.log("[DEBUG] Total events parsed from iCal:", events.length)
    events.forEach((e, i) => {
      console.log(`[DEBUG] Event ${i + 1}:`, e.title, "at", e.start.toLocaleString())
    })
    return events
  }

  const expandRecurrence = (baseEvent: any): CalendarEvent[] => {
    const occurrences: CalendarEvent[] = []
    const rrule = baseEvent.rrule
    
    if (!rrule) return [baseEvent]

    // Parse RRULE
    const rules: Record<string, string> = {}
    rrule.split(';').forEach((part: string) => {
      const [key, value] = part.split('=')
      if (key && value) rules[key] = value
    })

    const freq = rules.FREQ // DAILY, WEEKLY, MONTHLY, YEARLY
    const count = rules.COUNT ? parseInt(rules.COUNT) : null
    const until = rules.UNTIL ? parseICalDate(rules.UNTIL) : null
    const interval = rules.INTERVAL ? parseInt(rules.INTERVAL) : 1
    const byday = rules.BYDAY ? rules.BYDAY.split(',') : null // MO,TU,WE,TH,FR,SA,SU

    console.log("[DEBUG] RRULE parsed:", { freq, count, until, interval, byday })

    // Mapeo de días de la semana
    const dayMap: Record<string, number> = {
      'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
    }

    // Límite de seguridad
    const maxOccurrences = count || 365 // Máximo 1 año si no hay COUNT
    const maxDate = until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    let currentDate = new Date(baseEvent.start)
    const duration = baseEvent.end - baseEvent.start
    let occurrenceCount = 0

    // Si hay BYDAY y es WEEKLY, necesitamos iterar diferente
    if (freq === 'WEEKLY' && byday) {
      const targetDays = byday.map(day => dayMap[day])
      console.log("[DEBUG] Target days of week:", targetDays)

      // Empezar desde el día del evento base
      let weekDate = new Date(currentDate)
      weekDate.setDate(weekDate.getDate() - weekDate.getDay()) // Ir al domingo de esa semana

      while (occurrenceCount < maxOccurrences && weekDate <= maxDate) {
        // Revisar cada día de la semana
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          if (targetDays.includes(dayOfWeek)) {
            const occurrenceDate = new Date(weekDate)
            occurrenceDate.setDate(occurrenceDate.getDate() + dayOfWeek)
            
            // Ajustar hora del día original
            occurrenceDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0)

            // Solo agregar si es igual o después del evento base
            if (occurrenceDate >= baseEvent.start && occurrenceDate <= maxDate) {
              const occurrence = {
                ...baseEvent,
                id: `${baseEvent.id}-occurrence-${occurrenceCount}`,
                start: new Date(occurrenceDate),
                end: new Date(occurrenceDate.getTime() + duration),
              }
              delete occurrence.rrule
              occurrences.push(occurrence)
              console.log("[DEBUG] Added BYDAY occurrence:", occurrence.title, occurrence.start.toLocaleString("es-AR"))
              occurrenceCount++

              if (occurrenceCount >= maxOccurrences) break
            }
          }
        }
        
        // Avanzar a la siguiente semana según INTERVAL
        weekDate.setDate(weekDate.getDate() + (7 * interval))
      }
    } else {
      // Lógica original para otros tipos de recurrencia
      for (let i = 0; i < maxOccurrences; i++) {
        if (currentDate > maxDate) break

        // Crear ocurrencia
        const occurrence = {
          ...baseEvent,
          id: `${baseEvent.id}-occurrence-${i}`,
          start: new Date(currentDate),
          end: new Date(currentDate.getTime() + duration),
        }
        delete occurrence.rrule
        occurrences.push(occurrence)

        // Calcular siguiente ocurrencia
        switch (freq) {
          case 'DAILY':
            currentDate.setDate(currentDate.getDate() + interval)
            break
          case 'WEEKLY':
            currentDate.setDate(currentDate.getDate() + (7 * interval))
            break
          case 'MONTHLY':
            currentDate.setMonth(currentDate.getMonth() + interval)
            break
          case 'YEARLY':
            currentDate.setFullYear(currentDate.getFullYear() + interval)
            break
          default:
            console.warn("[DEBUG] Unknown FREQ:", freq)
            return [baseEvent]
        }
      }
    }

    console.log("[DEBUG] Total occurrences generated:", occurrences.length)
    return occurrences
  }

  const parseICalDate = (dateStr: string, tzid?: string | null): Date => {
    if (!dateStr) {
      console.log("[DEBUG] Empty date string")
      return new Date()
    }

    console.log("[DEBUG] Parsing date:", dateStr, "TZID:", tzid)

    // Remove any whitespace
    dateStr = dateStr.trim()

    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6)) - 1
    const day = parseInt(dateStr.substring(6, 8))
    
    if (dateStr.includes("T")) {
      const hour = parseInt(dateStr.substring(9, 11))
      const minute = parseInt(dateStr.substring(11, 13))
      
      // Si termina en Z es UTC
      if (dateStr.endsWith("Z")) {
        const utcDate = new Date(Date.UTC(year, month, day, hour, minute))
        console.log("[DEBUG] UTC input:", dateStr)
        console.log("[DEBUG] Converted to local:", utcDate.toLocaleString("es-AR"))
        return utcDate
      } 
      
      // Si tiene TZID, necesitamos convertir
      if (tzid) {
        console.log("[DEBUG] Has TZID:", tzid)
        
        // Crear la fecha como string ISO con la zona horaria
        const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
        
        // Intentar parsear con Intl
        try {
          // Crear fecha en la zona horaria especificada y convertir a local
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tzid,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
          
          // Crear una fecha local primero
          const localInTz = new Date(year, month, day, hour, minute)
          
          // Obtener el offset de esa zona horaria
          const parts = formatter.formatToParts(localInTz)
          const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0')
          const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1
          const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0')
          const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
          const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
          
          // Calcular el offset
          const localTime = new Date(year, month, day, hour, minute).getTime()
          const tzTime = new Date(tzYear, tzMonth, tzDay, tzHour, tzMinute).getTime()
          const offset = tzTime - localTime
          
          // Aplicar el offset inverso para obtener la hora correcta
          const correctedDate = new Date(localTime - offset)
          
          console.log("[DEBUG] Original TZID date:", isoString, tzid)
          console.log("[DEBUG] Converted to local:", correctedDate.toLocaleString("es-AR"))
          
          return correctedDate
        } catch (error) {
          console.warn("[DEBUG] Error parsing TZID, falling back to local:", error)
          // Si falla, asumir local
          return new Date(year, month, day, hour, minute)
        }
      }
      
      // Sin TZID ni Z, asumir local
      const localDate = new Date(year, month, day, hour, minute)
      console.log("[DEBUG] Parsed as local datetime:", localDate.toLocaleString("es-AR"))
      return localDate
    }
    
    // Eventos de día completo
    const parsedDate = new Date(year, month, day)
    console.log("[DEBUG] Parsed as all-day event:", parsedDate)
    return parsedDate
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatTimeRange = (start: Date, end: Date): string => {
    const startTime = start.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    const endTime = end.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    return `${startTime} - ${endTime}`
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const getWeekEvents = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    console.log("[DEBUG] Getting week events")
    console.log("[DEBUG] Week start:", start)
    console.log("[DEBUG] Week end:", end)
    console.log("[DEBUG] Total events to filter:", allEvents.length)

    const filtered = allEvents.filter(event => {
      const eventDate = new Date(event.start)
      const isInRange = eventDate >= start && eventDate < end
      console.log("[DEBUG] Event:", event.title, "Start:", eventDate, "In range:", isInRange)
      return isInRange
    })

    console.log("[DEBUG] Week events filtered:", filtered.length)
    return filtered
  }

  const getMonthEvents = () => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)

    console.log("[DEBUG] Getting month events")
    console.log("[DEBUG] Month start:", start)
    console.log("[DEBUG] Month end:", end)
    console.log("[DEBUG] Total events to filter:", allEvents.length)

    const filtered = allEvents.filter(event => {
      const eventDate = new Date(event.start)
      const isInRange = eventDate >= start && eventDate <= end
      console.log("[DEBUG] Event:", event.title, "Start:", eventDate, "In range:", isInRange)
      return isInRange
    })

    console.log("[DEBUG] Month events filtered:", filtered.length)
    return filtered
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const getViewTitle = () => {
    if (viewMode === "week") {
      const start = new Date(currentDate)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${formatDate(start)} - ${formatDate(end)}`
    } else {
      return currentDate.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      })
    }
  }

  const filteredEvents = selectedCalendar === "all" 
    ? events 
    : events.filter((e) => e.calendarId === selectedCalendar)

  const filteredFullEvents = selectedCalendar === "all"
    ? (viewMode === "week" ? getWeekEvents() : getMonthEvents())
    : (viewMode === "week" ? getWeekEvents() : getMonthEvents()).filter((e) => e.calendarId === selectedCalendar)

  const getCalendarName = (calendarId: string) => {
    const calendar = calendars.find((c) => c.id === calendarId)
    return calendar ? calendar.name : "Todos"
  }

  if (calendars.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.6_0.25_250)]/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-[oklch(0.6_0.25_250)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Calendario</h3>
            <p className="text-xs text-muted-foreground">No hay calendarios configurados</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
          Ve a Configuración para agregar tus calendarios
        </div>
      </div>
    )
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
            <p className="text-xs text-muted-foreground">
              {showPastEvents ? "Todos los eventos de hoy" : "Próximos eventos de hoy"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFullCalendar(true)}
            className="rounded-xl h-8 w-8"
            title="Ver calendario completo"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchEvents}
            disabled={loading}
            className="rounded-xl h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
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
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={showPastEvents ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowPastEvents(true)}
          className="flex-1 rounded-xl text-xs"
        >
          Todos
        </Button>
        <Button
          variant={!showPastEvents ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowPastEvents(false)}
          className="flex-1 rounded-xl text-xs"
        >
          Pendientes
        </Button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {loading && (
          <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
            Cargando eventos...
          </div>
        )}

        {error && (
          <div className="glass rounded-2xl p-4 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
            {showPastEvents ? "No hay eventos para hoy" : "No hay eventos pendientes para hoy"}
          </div>
        )}

        {!loading && !error && filteredEvents.map((event) => (
          <div key={event.id} className="glass rounded-2xl p-3 hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 rounded-full" style={{ backgroundColor: event.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{event.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeRange(event.start, event.end)}
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">{event.calendarName}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showFullCalendar} onOpenChange={setShowFullCalendar}>
        <DialogContent className="glass-strong border-white/10 max-w-5xl w-[95vw] max-h-[85vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header fijo */}
            <div className="flex-shrink-0 p-6 border-b border-white/10">
              <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Calendario Completo</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredFullEvents.length} evento{filteredFullEvents.length !== 1 ? 's' : ''} en este período
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                    className="rounded-xl"
                  >
                    Semana
                  </Button>
                  <Button
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                    className="rounded-xl"
                  >
                    Mes
                  </Button>
                </div>
              </DialogTitle>

              {/* Navegación */}
              <div className="flex items-center justify-between mt-4 glass rounded-2xl p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate("prev")}
                  className="rounded-xl hover:scale-105 transition-transform"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-semibold capitalize px-4">{getViewTitle()}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate("next")}
                  className="rounded-xl hover:scale-105 transition-transform"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Lista de eventos con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredFullEvents.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">No hay eventos</p>
                  <p className="text-sm text-muted-foreground">
                    No hay eventos programados para este período
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Agrupar eventos por día */}
                  {Object.entries(
                    filteredFullEvents.reduce((groups: Record<string, CalendarEvent[]>, event) => {
                      const date = new Date(event.start).toDateString()
                      if (!groups[date]) groups[date] = []
                      groups[date].push(event)
                      return groups
                    }, {})
                  ).map(([dateStr, dayEvents]) => {
                    const date = new Date(dateStr)
                    const isToday = date.toDateString() === new Date().toDateString()
                    const dayName = date.toLocaleDateString("es-ES", { weekday: "long" })
                    const dayNumber = date.getDate()
                    const monthName = date.toLocaleDateString("es-ES", { month: "long" })
                    
                    return (
                      <div key={dateStr} className="space-y-3">
                        {/* Header del día - estilo Google Calendar */}
                        <div className={`flex items-baseline gap-3 pb-2 border-b ${
                          isToday ? 'border-primary' : 'border-border'
                        }`}>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                              {dayNumber}
                            </span>
                            <span className={`text-sm uppercase tracking-wide ${
                              isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
                            }`}>
                              {dayName}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground capitalize">
                            {monthName}
                          </span>
                          {isToday && (
                            <span className="ml-auto text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
                              Hoy
                            </span>
                          )}
                        </div>

                        {/* Eventos del día - estilo timeline */}
                        <div className="space-y-2 pl-2">
                          {dayEvents.map((event) => {
                            const isPast = new Date(event.end) < new Date()
                            const isHappening = new Date(event.start) <= new Date() && new Date() <= new Date(event.end)

                            return (
                              <div
                                key={event.id}
                                className={`group relative flex gap-4 p-4 rounded-xl transition-all hover:scale-[1.01] ${
                                  isHappening ? 'glass-strong ring-2 ring-primary shadow-lg' : 'glass'
                                } ${isPast && !isHappening ? 'opacity-60' : ''}`}
                              >
                                {/* Línea vertical de color */}
                                <div 
                                  className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                                  style={{ backgroundColor: event.color }}
                                />

                                {/* Hora */}
                                <div className="flex flex-col items-end min-w-[90px] pt-1">
                                  <span className="text-sm font-semibold">
                                    {formatTime(event.start)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(event.end)}
                                  </span>
                                  {isHappening && (
                                    <span className="text-xs text-primary font-medium mt-1">
                                      En curso
                                    </span>
                                  )}
                                </div>
                                
                                {/* Contenido del evento */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <h4 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
                                    {event.title}
                                  </h4>
                                  
                                  <div className="flex items-center gap-2 text-sm">
                                    <div 
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: event.color }}
                                    />
                                    <span className="text-muted-foreground">{event.calendarName}</span>
                                  </div>

                                  {/* Duración */}
                                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60))} min
                                    </span>
                                  </div>
                                </div>

                                {/* Badge de estado */}
                                {isPast && !isHappening && (
                                  <div className="flex items-start">
                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg">
                                      Finalizado
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}