"use client"

import { useState, useEffect } from "react"
import { Tv, Youtube, Play, Search, TrendingUp, Home, Settings, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

interface TVApp {
  name: string
  packageName: string
  icon: any
  color: string
}

const AVAILABLE_APPS: TVApp[] = [
  {
    name: "YouTube",
    packageName: "com.google.android.youtube.tv",
    icon: Youtube,
    color: "#FF0000"
  },
  {
    name: "Netflix",
    packageName: "com.netflix.ninja",
    icon: Play,
    color: "#E50914"
  },
  {
    name: "Prime Video",
    packageName: "com.amazon.amazonvideo.livingroom",
    icon: Play,
    color: "#00A8E1"
  },
  {
    name: "Disney+",
    packageName: "com.disney.disneyplus",
    icon: Play,
    color: "#113CCF"
  }
]

export function TvYoutubeControl() {
  const [tvIp, setTvIp] = useState("192.168.100.50")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Load saved TV IP
    const saved = localStorage.getItem("philipsTvIp")
    if (saved) setTvIp(saved)
  }, [])

  const saveTvIp = () => {
    localStorage.setItem("philipsTvIp", tvIp)
  }

  const launchApp = async (app: TVApp) => {
    setLoading(true)
    try {
      const response = await fetch("/api/philips-tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp,
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

  const openYouTubeSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/philips-tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp,
          command: "launchApp",
          value: {
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
    } catch (error) {
      console.error("[v0] Error searching YouTube:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendTvKey = async (key: string) => {
    try {
      await fetch("/api/philips-tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp,
          command: "sendKey",
          value: key
        })
      })
    } catch (error) {
      console.error("[v0] Error sending key:", error)
    }
  }

  return (
    <>
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.6_0.25_250)]/20 flex items-center justify-center">
              <Tv className="w-6 h-6 text-[oklch(0.6_0.25_250)]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Control de TV</h3>
              <p className="text-xs text-muted-foreground">Philips 65" Android TV</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowModal(true)}
              className="rounded-xl h-8 w-8"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Link href="/tv">
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* YouTube Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscar en YouTube</label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && openYouTubeSearch()}
              placeholder="Ej: música relajante, noticias..."
              className="glass rounded-xl"
            />
            <Button
              onClick={openYouTubeSearch}
              disabled={loading || !searchQuery.trim()}
              className="rounded-xl"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Apps */}
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_APPS.slice(0, 4).map((app) => (
            <Button
              key={app.packageName}
              onClick={() => launchApp(app)}
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 rounded-2xl bg-transparent hover:scale-105 transition-transform"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${app.color}20` }}
              >
                <app.icon className="w-6 h-6" style={{ color: app.color }} />
              </div>
              <span className="text-sm font-medium">{app.name}</span>
            </Button>
          ))}
        </div>

        {/* Quick Controls */}
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
        </div>
      </div>

      {/* Expanded Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-strong border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Tv className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Control Completo de TV</h2>
                <p className="text-sm text-muted-foreground font-normal">Philips Android TV</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* TV IP Config */}
            <div className="glass rounded-2xl p-4">
              <label className="text-sm font-medium mb-2 block">IP del TV</label>
              <div className="flex gap-2">
                <Input
                  value={tvIp}
                  onChange={(e) => setTvIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="glass rounded-xl"
                />
                <Button onClick={saveTvIp} className="rounded-xl">
                  Guardar
                </Button>
              </div>
            </div>

            {/* YouTube Search */}
            <div className="glass rounded-2xl p-4 space-y-3">
              <label className="text-sm font-medium">Buscar en YouTube en el TV</label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && openYouTubeSearch()}
                  placeholder="¿Qué querés ver?"
                  className="glass rounded-xl"
                />
                <Button
                  onClick={openYouTubeSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="rounded-xl"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Escribí algo y presioná Enter o el botón para buscar en YouTube del TV
              </p>
            </div>

            {/* All Apps */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Abrir Aplicación</label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_APPS.map((app) => (
                  <Button
                    key={app.packageName}
                    onClick={() => launchApp(app)}
                    disabled={loading}
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-center gap-3 rounded-2xl bg-transparent hover:scale-105 transition-transform"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${app.color}20` }}
                    >
                      <app.icon className="w-8 h-8" style={{ color: app.color }} />
                    </div>
                    <span className="text-sm font-medium">{app.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* D-Pad Navigation */}
            <div className="glass rounded-2xl p-6">
              <label className="text-sm font-medium mb-4 block text-center">Navegación</label>
              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
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
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => sendTvKey("Home")}
                  className="rounded-xl"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendTvKey("Back")}
                  className="rounded-xl"
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}