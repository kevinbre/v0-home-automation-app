"use client"

import { useState, useEffect } from "react"
import {
  Tv,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Home,
  ArrowLeft,
  Plus,
  Star,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TvSettingsModal, type SmartTV } from "@/components/tv-settings-modal"

interface YoutubeFavorite {
  id: string
  name: string
  channelUrl: string
  thumbnail: string
}

const streamingApps = [
  { name: "Netflix", color: "#E50914", icon: "N" },
  { name: "Prime Video", color: "#00A8E1", icon: "P" },
  { name: "Disney+", color: "#113CCF", icon: "D+" },
  { name: "YouTube", color: "#FF0000", icon: "YT" },
  { name: "HBO Max", color: "#B100FF", icon: "HBO" },
  { name: "Spotify", color: "#1DB954", icon: "S" },
]

const inputs = ["HDMI 1", "HDMI 2", "HDMI 3", "USB", "Chromecast", "YouTube"]

export function TvControl() {
  const [tvs, setTvs] = useState<SmartTV[]>([])
  const [selectedTvId, setSelectedTvId] = useState("")
  const [youtubeFavorites, setYoutubeFavorites] = useState<YoutubeFavorite[]>([])
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelUrl, setNewChannelUrl] = useState("")
  const [isAddingChannel, setIsAddingChannel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const tv = tvs.find((t) => t.id === selectedTvId) || tvs[0]

  // Cargar TVs desde localStorage
  useEffect(() => {
    const savedTvs = localStorage.getItem("smartTvs")
    if (savedTvs) {
      const parsed = JSON.parse(savedTvs)
      setTvs(parsed)
      if (parsed.length > 0 && !selectedTvId) {
        setSelectedTvId(parsed[0].id)
      }
    } else {
      // TVs por defecto si no hay guardados
      const defaultTvs: SmartTV[] = [
        {
          id: "1",
          name: "Smart TV Sala",
          location: "Sala de Estar",
          status: true,
          volume: 45,
          muted: false,
          channel: 105,
          input: "HDMI 1",
          playing: false,
          ipAddress: "192.168.1.100", // Cambia esto en la configuración
          brand: "philips",
        },
      ]
      setTvs(defaultTvs)
      setSelectedTvId(defaultTvs[0].id)
      localStorage.setItem("smartTvs", JSON.stringify(defaultTvs))
    }
  }, [])

  // Cargar favoritos de YouTube
  useEffect(() => {
    const saved = localStorage.getItem("youtubeFavorites")
    if (saved) {
      setYoutubeFavorites(JSON.parse(saved))
    } else {
      // Default favorites
      const defaults = [
        {
          id: "1",
          name: "Música Relajante",
          channelUrl: "https://www.youtube.com/@RelaxingMusic",
          thumbnail: "/relaxing-music-scene.png",
        },
        {
          id: "2",
          name: "Noticias 24/7",
          channelUrl: "https://www.youtube.com/@news24",
          thumbnail: "/news-channel.png",
        },
      ]
      setYoutubeFavorites(defaults)
      localStorage.setItem("youtubeFavorites", JSON.stringify(defaults))
    }
  }, [])

  const updateTv = (updates: Partial<SmartTV>) => {
    const updatedTvs = tvs.map((t) => (t.id === selectedTvId ? { ...t, ...updates } : t))
    setTvs(updatedTvs)
    localStorage.setItem("smartTvs", JSON.stringify(updatedTvs))
  }

  const handleTvsChange = (newTvs: SmartTV[]) => {
    setTvs(newTvs)
    // Si el TV seleccionado fue eliminado, seleccionar el primero disponible
    if (newTvs.length > 0 && !newTvs.find((t) => t.id === selectedTvId)) {
      setSelectedTvId(newTvs[0].id)
    }
  }

  const sendPhilipsTvCommand = async (command: string, value?: any) => {
    if (tv.brand !== "philips" || !tv.ipAddress) {
      console.log("[v0] TV is not a Philips TV or IP not configured")
      return
    }

    try {
      const response = await fetch("/api/philips-tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp: tv.ipAddress,
          command,
          value,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] Philips TV command failed:", error)
        return
      }

      const data = await response.json()
      console.log("[v0] Philips TV command success:", data)
      return data
    } catch (error) {
      console.error("[v0] Error sending command to Philips TV:", error)
    }
  }

  const togglePower = () => {
    if (tv.brand === "philips") {
      sendPhilipsTvCommand("sendKey", "Standby")
    }
    updateTv({ status: !tv?.status })
  }

  const toggleMute = () => {
    if (tv.brand === "philips") {
      sendPhilipsTvCommand("mute", !tv.muted)
    }
    updateTv({ muted: !tv.muted })
  }

  const changeVolume = (volume: number) => {
    if (tv.brand === "philips") {
      sendPhilipsTvCommand("setVolume", volume)
    }
    updateTv({ volume, muted: false })
  }

  const changeChannel = (delta: number) => {
    const newChannel = Math.max(1, tv.channel + delta)
    if (tv.brand === "philips") {
      sendPhilipsTvCommand("setChannel", { preset: newChannel })
    }
    updateTv({ channel: newChannel })
  }

  const playYoutubeFavorite = (favorite: YoutubeFavorite) => {
    console.log(`[v0] Playing ${favorite.name} on ${tv.name}`)
    if (tv.brand === "philips") {
      const youtubeIntent = {
        component: {
          packageName: "com.google.android.youtube.tv",
          className: "com.google.android.apps.youtube.tv.activity.ShellActivity",
        },
        action: "android.intent.action.VIEW",
        extras: {
          query: favorite.name,
        },
      }
      sendPhilipsTvCommand("launchApp", youtubeIntent)
    }
    updateTv({
      input: "YouTube",
      currentYoutubeChannel: favorite.name,
      playing: true,
    })
  }

  const changeInput = (input: string) => {
    if (tv.brand === "philips") {
      sendPhilipsTvCommand("setInput", input)
    }
    updateTv({ input })
  }

  const addYoutubeFavorite = () => {
    if (!newChannelName || !newChannelUrl) return

    const newFavorite: YoutubeFavorite = {
      id: Date.now().toString(),
      name: newChannelName,
      channelUrl: newChannelUrl,
      thumbnail: "/youtube-channel-icon.png",
    }

    const updated = [...youtubeFavorites, newFavorite]
    setYoutubeFavorites(updated)
    localStorage.setItem("youtubeFavorites", JSON.stringify(updated))

    setNewChannelName("")
    setNewChannelUrl("")
    setIsAddingChannel(false)
  }

  const removeFavorite = (id: string) => {
    const updated = youtubeFavorites.filter((f) => f.id !== id)
    setYoutubeFavorites(updated)
    localStorage.setItem("youtubeFavorites", JSON.stringify(updated))
  }

  const setTv = (newTv: SmartTV) => {
    setTvs(tvs.map((t) => (t.id === selectedTvId ? newTv : t)))
  }

  const togglePlay = () => {
    updateTv({ playing: !tv.playing })
  }

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Seleccionar TV</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="rounded-xl h-8 gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </Button>
        </div>
        {tvs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No hay TVs configurados</p>
            <Button onClick={() => setShowSettings(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Agregar TV
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            {tvs.map((t) => (
              <Button
                key={t.id}
                variant={selectedTvId === t.id ? "default" : "outline"}
                onClick={() => setSelectedTvId(t.id)}
                className="flex-1 rounded-2xl h-auto p-4 flex flex-col items-start gap-1"
              >
                <div className="flex items-center gap-2 w-full">
                  <Tv className="w-4 h-4" />
                  <span className="font-semibold text-sm">{t.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{t.location}</span>
                <div className="flex items-center gap-1 mt-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: t.status ? "oklch(0.65 0.2 180)" : "oklch(0.4 0.05 250)" }}
                  />
                  <span className="text-xs">{t.status ? "Encendido" : "Apagado"}</span>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* TV Status Card - Solo mostrar si hay un TV seleccionado */}
      {tv && (
        <>
          <div className="glass-strong rounded-3xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: tv.status ? "oklch(0.6 0.25 250)/0.2" : "oklch(0.3 0.05 250)",
                  }}
                >
                  <Tv className="w-8 h-8" style={{ color: tv.status ? "oklch(0.6 0.25 250)" : "oklch(0.5 0.05 250)" }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{tv.name}</h2>
                  <p className="text-sm text-muted-foreground">{tv.location}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tv.status ? "oklch(0.65 0.2 180)" : "oklch(0.4 0.05 250)" }}
                    />
                    <span className="text-xs font-medium">{tv.status ? "Encendido" : "Apagado"}</span>
                  </div>
                </div>
              </div>
              <Switch checked={tv.status} onCheckedChange={togglePower} />
            </div>

            {tv.status && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="glass rounded-2xl p-4">
                  <p className="text-muted-foreground mb-1">{tv.input === "YouTube" ? "Reproduciendo" : "Canal Actual"}</p>
                  <p className="text-xl font-bold">{tv.input === "YouTube" ? tv.currentYoutubeChannel : tv.channel}</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="text-muted-foreground mb-1">Entrada</p>
                  <p className="text-lg font-semibold">{tv.input}</p>
                </div>
              </div>
            )}
          </div>

          {tv.status && (
        <>
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Canales de YouTube Favoritos</h3>
                <p className="text-xs text-muted-foreground">Reproduce tus canales favoritos en el TV</p>
              </div>
              <Dialog open={isAddingChannel} onOpenChange={setIsAddingChannel}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-white/10">
                  <DialogHeader>
                    <DialogTitle>Agregar Canal Favorito</DialogTitle>
                    <DialogDescription>Agrega un nuevo canal de YouTube a tus favoritos</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nombre del Canal</label>
                      <Input
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="Ej: Música Relajante"
                        className="glass"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">URL del Canal</label>
                      <Input
                        value={newChannelUrl}
                        onChange={(e) => setNewChannelUrl(e.target.value)}
                        placeholder="https://www.youtube.com/@canal"
                        className="glass"
                      />
                    </div>
                    <Button onClick={addYoutubeFavorite} className="w-full rounded-xl">
                      Agregar Canal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {youtubeFavorites.map((favorite) => (
                <div key={favorite.id} className="glass rounded-2xl overflow-hidden group relative">
                  <button
                    onClick={() => playYoutubeFavorite(favorite)}
                    className="w-full p-4 flex flex-col items-center gap-3 hover:scale-[1.02] transition-transform"
                  >
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                      <Play className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="text-center w-full">
                      <p className="font-semibold text-sm">{favorite.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{favorite.channelUrl}</p>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFavorite(favorite.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
                  >
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Remote Control */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume & Channel Control */}
            <div className="glass-strong rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-semibold">Control de Volumen y Canal</h3>

              {/* Volume */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tv.muted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5" />}
                    <span className="text-sm font-medium">Volumen</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{tv.muted ? "Silenciado" : `${tv.volume}%`}</span>
                    <Button variant="outline" size="sm" onClick={toggleMute} className="rounded-xl bg-transparent">
                      {tv.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[tv.muted ? 0 : tv.volume]}
                  onValueChange={([value]) => changeVolume(value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Channel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Canal</span>
                  <span className="text-sm font-bold">{tv.channel}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => changeChannel(-1)} className="flex-1 rounded-2xl h-12">
                    <ChevronDown className="w-5 h-5 mr-2" />
                    Anterior
                  </Button>
                  <Button variant="outline" onClick={() => changeChannel(1)} className="flex-1 rounded-2xl h-12">
                    Siguiente
                    <ChevronUp className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Quick Channel Numbers */}
              <div className="grid grid-cols-3 gap-2">
                {[101, 102, 103, 104, 105, 106, 107, 108, 109].map((channel) => (
                  <Button
                    key={channel}
                    variant={tv.channel === channel ? "default" : "outline"}
                    onClick={() => setTv({ ...tv, channel })}
                    className="rounded-xl"
                  >
                    {channel}
                  </Button>
                ))}
              </div>
            </div>

            {/* Media Controls */}
            <div className="glass-strong rounded-3xl p-6 space-y-6">
              <h3 className="text-lg font-semibold">Control de Reproducción</h3>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="icon" className="rounded-2xl w-12 h-12 bg-transparent">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button variant="default" size="icon" onClick={togglePlay} className="rounded-2xl w-16 h-16">
                  {tv.playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                <Button variant="outline" size="icon" className="rounded-2xl w-12 h-12 bg-transparent">
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Navegación</p>
                <div className="grid grid-cols-3 gap-2">
                  <div />
                  <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
                    <ChevronUp className="w-5 h-5" />
                  </Button>
                  <div />
                  <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="default" size="icon" className="rounded-2xl">
                    OK
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </Button>
                  <div />
                  <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
                    <ChevronDown className="w-5 h-5" />
                  </Button>
                  <div />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-2xl bg-transparent">
                  <Home className="w-4 h-4 mr-2" />
                  Inicio
                </Button>
                <Button variant="outline" className="flex-1 rounded-2xl bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
              </div>
            </div>
          </div>

          {/* Streaming Apps */}
          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Apps de Streaming</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {streamingApps.map((app) => (
                <Button
                  key={app.name}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 rounded-2xl hover:scale-105 transition-transform bg-transparent"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: app.color }}
                  >
                    {app.icon}
                  </div>
                  <span className="text-xs font-medium">{app.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Método de Entrada</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {inputs.map((input) => (
                <Button
                  key={input}
                  variant={tv.input === input ? "default" : "outline"}
                  onClick={() => changeInput(input)}
                  className="rounded-2xl h-16 text-base font-semibold"
                >
                  {input === "YouTube" && <Play className="w-4 h-4 mr-2" />}
                  {input}
                </Button>
              ))}
            </div>
          </div>
        </>
          )}
        </>
      )}

      {/* Modal de Configuración */}
      <TvSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        tvs={tvs}
        onTvsChange={handleTvsChange}
      />
    </div>
  )
}
