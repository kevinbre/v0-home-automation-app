"use client"

import { useState, useEffect, useRef } from "react"
import { Tv, Youtube, Play, Search, Home, ChevronDown, ChevronUp, Volume2, Power, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TabletInput } from "@/components/ui/tablet-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SmartTV } from "./tv-settings-modal"
import Link from "next/link"

interface TVApp {
  name: string
  packageName: string
  icon: any
  color: string
  searchSupported: boolean
}

const AVAILABLE_APPS: TVApp[] = [
  {
    name: "YouTube",
    packageName: "com.google.android.youtube.tv",
    icon: Youtube,
    color: "#FF0000",
    searchSupported: true
  },
  {
    name: "Netflix",
    packageName: "com.netflix.ninja",
    icon: Play,
    color: "#E50914",
    searchSupported: true
  },
  {
    name: "Prime Video",
    packageName: "com.amazon.amazonvideo.livingroom",
    icon: Play,
    color: "#00A8E1",
    searchSupported: false
  },
  {
    name: "Disney+",
    packageName: "com.disney.disneyplus",
    icon: Play,
    color: "#113CCF",
    searchSupported: false
  }
]

export function TvControlEnhanced() {
  const [tvs, setTvs] = useState<SmartTV[]>([])
  const [selectedTvId, setSelectedTvId] = useState<string>("")
  const [currentApp, setCurrentApp] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [showExtraControls, setShowExtraControls] = useState(false)
  const [trackpadActive, setTrackpadActive] = useState(false)
  const trackpadRef = useRef<HTMLDivElement>(null)
  const lastPositionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Cargar TVs desde localStorage
    const savedTvs = localStorage.getItem("smartTvs")
    if (savedTvs) {
      const parsed = JSON.parse(savedTvs)
      setTvs(parsed)
      if (parsed.length > 0 && !selectedTvId) {
        setSelectedTvId(parsed[0].id)
      }
    }
  }, [selectedTvId])

  const selectedTv = tvs.find(tv => tv.id === selectedTvId)

  const launchApp = async (app: TVApp) => {
    if (!selectedTv) return

    setLoading(true)
    setCurrentApp(app.packageName)

    try {
      const apiEndpoint = selectedTv.useAdb ? "/api/android-tv-adb" : "/api/philips-tv"
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp: selectedTv.ipAddress,
          command: "launchApp",
          value: {
            intent: {
              component: {
                packageName: app.packageName,
                className: app.packageName === "com.google.android.youtube.tv"
                  ? "com.google.android.apps.youtube.tv.activity.ShellActivity"
                  : undefined
              },
              action: "android.intent.action.MAIN"
            }
          }
        })
      })

      if (response.ok) {
        console.log(`[v0] Launched ${app.name}`)
      }
    } catch (error) {
      console.error("[v0] Error launching app:", error)
    } finally {
      setLoading(false)
    }
  }

  const openSearch = async () => {
    if (!selectedTv || !searchQuery.trim() || !currentApp) return

    setLoading(true)
    try {
      const apiEndpoint = selectedTv.useAdb ? "/api/android-tv-adb" : "/api/philips-tv"

      // Búsqueda contextual según la app
      if (currentApp === "com.google.android.youtube.tv") {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tvIp: selectedTv.ipAddress,
            command: selectedTv.useAdb ? "openYouTubeSearch" : "launchApp",
            value: selectedTv.useAdb ? searchQuery : {
              intent: {
                component: {
                  packageName: "com.google.android.youtube.tv",
                  className: "com.google.android.apps.youtube.tv.activity.ShellActivity"
                },
                action: "android.intent.action.SEARCH",
                extras: {
                  query: searchQuery
                }
              }
            }
          })
        })

        if (response.ok) {
          setSearchQuery("")
        }
      } else if (currentApp === "com.netflix.ninja") {
        // Para Netflix, enviamos las teclas para abrir el buscador
        await sendTvKey("Search")
        // Pequeña pausa y luego escribimos
        setTimeout(() => {
          searchQuery.split("").forEach((char, index) => {
            setTimeout(() => sendTvKey(char), index * 100)
          })
        }, 500)
        setSearchQuery("")
      }
    } catch (error) {
      console.error("[v0] Error searching:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendTvKey = async (key: string) => {
    if (!selectedTv) return

    try {
      const apiEndpoint = selectedTv.useAdb ? "/api/android-tv-adb" : "/api/philips-tv"
      await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp: selectedTv.ipAddress,
          command: "sendKey",
          value: key
        })
      })
    } catch (error) {
      console.error("[v0] Error sending key:", error)
    }
  }

  const handleTrackpadMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!trackpadActive || !selectedTv) return

    const touch = e.touches[0]
    const rect = trackpadRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    // Calcular movimiento relativo
    const deltaX = x - lastPositionRef.current.x
    const deltaY = y - lastPositionRef.current.y

    // Sensibilidad del trackpad
    const sensitivity = 3

    if (Math.abs(deltaX) > sensitivity || Math.abs(deltaY) > sensitivity) {
      // Determinar dirección principal
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        sendTvKey(deltaX > 0 ? "CursorRight" : "CursorLeft")
      } else {
        sendTvKey(deltaY > 0 ? "CursorDown" : "CursorUp")
      }

      lastPositionRef.current = { x, y }
    }
  }

  const handleTrackpadStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTrackpadActive(true)
    const touch = e.touches[0]
    const rect = trackpadRef.current?.getBoundingClientRect()
    if (!rect) return

    lastPositionRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  const handleTrackpadEnd = () => {
    setTrackpadActive(false)
  }

  const handleTrackpadTap = () => {
    sendTvKey("Confirm")
  }

  const currentAppInfo = AVAILABLE_APPS.find(app => app.packageName === currentApp)
  const canSearch = currentAppInfo?.searchSupported

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.6_0.25_250)]/20 flex items-center justify-center">
            <Tv className="w-6 h-6 text-[oklch(0.6_0.25_250)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Control de TV</h3>
            <p className="text-xs text-muted-foreground">
              {selectedTv ? selectedTv.name : "Sin TV seleccionado"}
            </p>
          </div>
        </div>
        <Link href="/tv">
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Selector de TV - Ancho completo */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Seleccionar TV</label>
        <Select value={selectedTvId} onValueChange={setSelectedTvId}>
          <SelectTrigger className="glass w-full rounded-xl h-12">
            <SelectValue placeholder="Selecciona un televisor" />
          </SelectTrigger>
          <SelectContent>
            {tvs.length === 0 ? (
              <SelectItem value="none" disabled>
                No hay TVs configurados
              </SelectItem>
            ) : (
              tvs.map((tv) => (
                <SelectItem key={tv.id} value={tv.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tv.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {tv.location}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedTv && (
        <>
          {/* Apps - Grid de aplicaciones */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Aplicaciones</label>
            <div className="grid grid-cols-4 gap-3">
              {AVAILABLE_APPS.map((app) => (
                <Button
                  key={app.packageName}
                  onClick={() => launchApp(app)}
                  disabled={loading}
                  variant="outline"
                  className={`h-auto p-3 flex flex-col items-center gap-2 rounded-2xl bg-transparent hover:scale-105 transition-transform ${
                    currentApp === app.packageName ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${app.color}20` }}
                  >
                    <app.icon className="w-6 h-6" style={{ color: app.color }} />
                  </div>
                  <span className="text-xs font-medium">{app.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Búsqueda contextual */}
          {currentApp && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Buscar en {currentAppInfo?.name || "App"}
              </label>
              <div className="flex gap-2">
                <TabletInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canSearch && openSearch()}
                  placeholder={
                    canSearch
                      ? `Buscar en ${currentAppInfo?.name}...`
                      : "Esta app no soporta búsqueda"
                  }
                  className="glass"
                  disabled={!canSearch}
                />
                <Button
                  onClick={openSearch}
                  disabled={loading || !searchQuery.trim() || !canSearch}
                  className="rounded-xl"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {!canSearch && (
                <p className="text-xs text-muted-foreground">
                  La búsqueda no está disponible para esta aplicación
                </p>
              )}
            </div>
          )}

          {/* Trackpad */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Trackpad</label>
            <div
              ref={trackpadRef}
              onTouchStart={handleTrackpadStart}
              onTouchMove={handleTrackpadMove}
              onTouchEnd={handleTrackpadEnd}
              onClick={handleTrackpadTap}
              className={`glass rounded-2xl h-48 flex items-center justify-center cursor-pointer select-none transition-colors ${
                trackpadActive ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-white/5'
              }`}
            >
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">👆</div>
                <p className="text-sm">Desliza para navegar</p>
                <p className="text-xs">Toca para seleccionar</p>
              </div>
            </div>
          </div>

          {/* Controles básicos siempre visibles */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => sendTvKey("Home")}
              className="rounded-xl"
            >
              <Home className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => sendTvKey("Back")}
              className="rounded-xl"
            >
              ←
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExtraControls(!showExtraControls)}
              className="rounded-xl"
            >
              {showExtraControls ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Más controles
                </>
              )}
            </Button>
          </div>

          {/* Controles adicionales (colapsables) */}
          {showExtraControls && (
            <div className="glass rounded-2xl p-4 space-y-4 animate-in slide-in-from-top">
              {/* D-Pad */}
              <div>
                <label className="text-sm font-medium mb-3 block text-center">Navegación D-Pad</label>
                <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
                  <div />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sendTvKey("CursorUp")}
                    className="rounded-xl"
                  >
                    ↑
                  </Button>
                  <div />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sendTvKey("CursorLeft")}
                    className="rounded-xl"
                  >
                    ←
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => sendTvKey("Confirm")}
                    className="rounded-xl"
                  >
                    OK
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sendTvKey("CursorRight")}
                    className="rounded-xl"
                  >
                    →
                  </Button>
                  <div />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sendTvKey("CursorDown")}
                    className="rounded-xl"
                  >
                    ↓
                  </Button>
                  <div />
                </div>
              </div>

              {/* Controles de volumen y poder */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => sendTvKey("VolumeDown")}
                  className="rounded-xl"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  −
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTvKey("Mute")}
                  className="rounded-xl"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTvKey("VolumeUp")}
                  className="rounded-xl"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  +
                </Button>
              </div>

              <Button
                variant="destructive"
                onClick={() => sendTvKey("Power")}
                className="w-full rounded-xl"
              >
                <Power className="w-4 h-4 mr-2" />
                Encender/Apagar TV
              </Button>
            </div>
          )}
        </>
      )}

      {!selectedTv && (
        <div className="text-center py-8 text-muted-foreground">
          <Tv className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No hay TVs configurados.{" "}
            <Link href="/tv" className="text-primary hover:underline">
              Configura uno aquí
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
