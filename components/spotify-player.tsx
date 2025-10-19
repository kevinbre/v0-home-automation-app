"use client"

import { useState, useEffect } from "react"
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, Plus, Trash2, UserCircle, Check, Search, List, X, Maximize2, Minimize2, Type, Monitor, Smartphone, Speaker, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { TabletInput } from "@/components/ui/tablet-input"
import { SpotifyFullscreen } from "./spotify-fullscreen"

interface SpotifyAccount {
  id: string
  name: string
  clientId: string
  clientSecret: string
  refreshToken: string
  userName?: string
  isActive: boolean
}

interface SpotifyTrack {
  name: string
  artist: string
  album: string
  albumArt: string
  duration: number
  progress: number
  isPlaying: boolean
}

export function SpotifyPlayer() {
  const [accounts, setAccounts] = useState<SpotifyAccount[]>([])
  const [activeAccount, setActiveAccount] = useState<SpotifyAccount | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [volume, setVolume] = useState(50)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenMode, setFullscreenMode] = useState<'container' | 'browser'>('container')
  const [deviceError, setDeviceError] = useState("")
  const [devices, setDevices] = useState<any[]>([])
  const [showDevices, setShowDevices] = useState(false)
  const [activeDevice, setActiveDevice] = useState<any>(null)
  const [showCommands, setShowCommands] = useState(false)

  // Formulario para nueva cuenta
  const [newAccount, setNewAccount] = useState({
    name: "",
    clientId: "",
    clientSecret: "",
    refreshToken: "",
  })

  // Cargar cuentas desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("spotifyAccounts")
    if (saved) {
      const parsedAccounts = JSON.parse(saved)
      setAccounts(parsedAccounts)

      const active = parsedAccounts.find((acc: SpotifyAccount) => acc.isActive)
      if (active) {
        setActiveAccount(active)
      }
    }
  }, [])

  // Guardar cuentas en localStorage
  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem("spotifyAccounts", JSON.stringify(accounts))

      // Notificar al asistente de voz
      window.dispatchEvent(new CustomEvent('spotify-accounts-updated'))
    }
  }, [accounts])

  // Actualizar canción actual desde Spotify (cada 5 segundos para reducir requests)
  useEffect(() => {
    if (!activeAccount) return

    updateCurrentTrack()

    const interval = setInterval(() => {
      if (currentTrack?.isPlaying) {
        updateCurrentTrack()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [activeAccount, currentTrack?.isPlaying])

  // Actualizar progreso localmente cada segundo para sincronización suave
  useEffect(() => {
    if (!currentTrack?.isPlaying) return

    const interval = setInterval(() => {
      setCurrentTrack(prev => {
        if (!prev || !prev.isPlaying) return prev

        const newProgress = prev.progress + 1000 // Añadir 1 segundo

        // No exceder la duración
        if (newProgress >= prev.duration) {
          return prev
        }

        return {
          ...prev,
          progress: newProgress
        }
      })
    }, 1000) // Actualizar cada segundo

    return () => clearInterval(interval)
  }, [currentTrack?.isPlaying])

  const updateCurrentTrack = async () => {
    if (!activeAccount) return

    try {
      const params = new URLSearchParams({
        action: "currentTrack",
        clientId: activeAccount.clientId,
        clientSecret: activeAccount.clientSecret,
        refreshToken: activeAccount.refreshToken,
      })

      const response = await fetch(`/api/spotify?${params}`)
      const data = await response.json()

      // Si hay error o no está reproduciendo, simplemente limpiar sin mostrar error
      if (data.error || data.playing === false || !data.item) {
        setCurrentTrack(null)
        return
      }

      setCurrentTrack({
        name: data.item.name,
        artist: data.item.artists.map((a: any) => a.name).join(", "),
        album: data.item.album.name,
        albumArt: getImageUrl(data.item.album.images) || "",
        duration: data.item.duration_ms,
        progress: data.progress_ms,
        isPlaying: data.is_playing,
      })

      // Sincronizar volumen con el dispositivo actual
      if (data.device?.volume_percent !== undefined) {
        setVolume(data.device.volume_percent)
      }
    } catch (error) {
      // Solo mostrar errores de red, no de "no hay música reproduciendo"
      console.error("[Spotify] Network error:", error)
      setCurrentTrack(null)
    }
  }

  const sendCommand = async (action: string, params?: any) => {
    if (!activeAccount) return

    try {
      await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          clientId: activeAccount.clientId,
          clientSecret: activeAccount.clientSecret,
          refreshToken: activeAccount.refreshToken,
          ...params,
        }),
      })

      setTimeout(updateCurrentTrack, 500)
    } catch (error) {
      console.error("[Spotify] Error sending command:", error)
    }
  }

  const addAccount = async () => {
    if (!newAccount.name || !newAccount.clientId || !newAccount.clientSecret || !newAccount.refreshToken) {
      alert("Por favor completa todos los campos")
      return
    }

    try {
      // Verificar credenciales obteniendo info del usuario
      const params = new URLSearchParams({
        action: "getUserInfo",
        clientId: newAccount.clientId,
        clientSecret: newAccount.clientSecret,
        refreshToken: newAccount.refreshToken,
      })

      const response = await fetch(`/api/spotify?${params}`)
      const data = await response.json()

      if (data.error) {
        alert(`Error: ${data.error}. Verifica tus credenciales.`)
        return
      }

      const account: SpotifyAccount = {
        id: Date.now().toString(),
        name: newAccount.name,
        clientId: newAccount.clientId,
        clientSecret: newAccount.clientSecret,
        refreshToken: newAccount.refreshToken,
        userName: data.display_name || data.id,
        isActive: accounts.length === 0, // Activar si es la primera cuenta
      }

      setAccounts((prev) => [...prev, account])

      if (accounts.length === 0) {
        setActiveAccount(account)
      }

      setNewAccount({ name: "", clientId: "", clientSecret: "", refreshToken: "" })
      setShowAddAccount(false)
    } catch (error) {
      console.error("[Spotify] Error adding account:", error)
      alert("Error al agregar la cuenta. Verifica tus credenciales.")
    }
  }

  const removeAccount = (id: string) => {
    const accountToRemove = accounts.find((acc) => acc.id === id)
    if (!accountToRemove) return

    if (confirm(`¿Eliminar la cuenta "${accountToRemove.name}"?`)) {
      const newAccounts = accounts.filter((acc) => acc.id !== id)
      setAccounts(newAccounts)

      if (activeAccount?.id === id) {
        const newActive = newAccounts.find((acc) => acc.isActive) || newAccounts[0] || null
        setActiveAccount(newActive)
      }
    }
  }

  const switchAccount = (id: string) => {
    const account = accounts.find((acc) => acc.id === id)
    if (!account) return

    const updatedAccounts = accounts.map((acc) => ({
      ...acc,
      isActive: acc.id === id,
    }))

    setAccounts(updatedAccounts)
    setActiveAccount(account)
  }

  const handlePlayPause = () => {
    sendCommand(currentTrack?.isPlaying ? "pause" : "play")
  }

  const handleNext = () => sendCommand("next")
  const handlePrevious = () => sendCommand("previous")

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    sendCommand("volume", { volume: newVolume })
  }

  const getDevices = async () => {
    if (!activeAccount) return

    try {
      const response = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getDevices",
          clientId: activeAccount.clientId,
          clientSecret: activeAccount.clientSecret,
          refreshToken: activeAccount.refreshToken,
        }),
      })

      const data = await response.json()
      if (data.devices) {
        setDevices(data.devices)
        const active = data.devices.find((d: any) => d.is_active)
        setActiveDevice(active)
      }
    } catch (error) {
      console.error("[Spotify] Error getting devices:", error)
    }
  }

  const transferPlayback = async (deviceId: string) => {
    if (!activeAccount) return

    try {
      await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transferPlayback",
          deviceId,
          play: true,
          clientId: activeAccount.clientId,
          clientSecret: activeAccount.clientSecret,
          refreshToken: activeAccount.refreshToken,
        }),
      })

      // Actualizar lista de dispositivos después de transferir
      setTimeout(() => {
        getDevices()
        updateCurrentTrack()
      }, 1000)
    } catch (error) {
      console.error("[Spotify] Error transferring playback:", error)
    }
  }

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Helper para obtener imagen de forma segura
  const getImageUrl = (images: any[] | null | undefined, index: number = 0): string | null => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null
    }
    return images[index]?.url || null
  }

  const getProgress = (): number => {
    if (!currentTrack) return 0
    return (currentTrack.progress / currentTrack.duration) * 100
  }

  const connectSpotify = () => {
    window.open("https://developer.spotify.com/dashboard", "_blank")
  }

  const searchMusic = async () => {
    if (!activeAccount || !searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          query: searchQuery,
          type: "track,artist,playlist",
          limit: 10,
          clientId: activeAccount.clientId,
          clientSecret: activeAccount.clientSecret,
          refreshToken: activeAccount.refreshToken,
        }),
      })

      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error("[Spotify] Error searching:", error)
    } finally {
      setSearching(false)
    }
  }

  const playTrack = async (uri: string, name: string) => {
    if (!activeAccount) return

    try {
      // Obtener dispositivos disponibles primero
      await getDevices()

      // Esperar un poco para que se actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100))

      const response = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "playTrack",
          uri,
          deviceId: activeDevice?.id, // Usar el dispositivo activo
          clientId: activeAccount.clientId,
          clientSecret: activeAccount.clientSecret,
          refreshToken: activeAccount.refreshToken,
        }),
      })

      const data = await response.json()

      if (data.error || response.status !== 200) {
        setDeviceError("No hay dispositivos Spotify activos. Abre Spotify en tu teléfono, computadora o tablet.")
        setTimeout(() => setDeviceError(""), 5000)
        return
      }

      setShowSearch(false)
      setSearchQuery("")
      setSearchResults(null)
      setDeviceError("")
      setTimeout(updateCurrentTrack, 500)
    } catch (error) {
      console.error("[Spotify] Error playing track:", error)
      setDeviceError("Error al reproducir. Verifica que Spotify esté abierto.")
      setTimeout(() => setDeviceError(""), 5000)
    }
  }

  const playPlaylist = async (uri: string) => {
    if (!activeAccount) return

    try {
      // Obtener dispositivos disponibles primero
      await getDevices()

      // Esperar un poco para que se actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100))

      const response = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "playPlaylist",
          playlistUri: uri,
          deviceId: activeDevice?.id, // Usar el dispositivo activo
          clientId: activeAccount.clientId,
          clientSecret: activeAccount.clientSecret,
          refreshToken: activeAccount.refreshToken,
        }),
      })

      const data = await response.json()

      if (data.error || response.status !== 200) {
        setDeviceError("No hay dispositivos Spotify activos. Abre Spotify en tu teléfono, computadora o tablet.")
        setTimeout(() => setDeviceError(""), 5000)
        return
      }

      setShowPlaylists(false)
      setDeviceError("")
      setTimeout(updateCurrentTrack, 500)
    } catch (error) {
      console.error("[Spotify] Error playing playlist:", error)
      setDeviceError("Error al reproducir. Verifica que Spotify esté abierto.")
      setTimeout(() => setDeviceError(""), 5000)
    }
  }

  const loadPlaylists = async () => {
    if (!activeAccount) return

    try {
      const params = new URLSearchParams({
        action: "playlists",
        clientId: activeAccount.clientId,
        clientSecret: activeAccount.clientSecret,
        refreshToken: activeAccount.refreshToken,
      })

      const response = await fetch(`/api/spotify?${params}`)
      const data = await response.json()

      if (data.items) {
        setPlaylists(data.items)
        setShowPlaylists(true)
      }
    } catch (error) {
      console.error("[Spotify] Error loading playlists:", error)
    }
  }

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 flex items-center justify-center">
            <Music className="w-6 h-6 text-[#1DB954]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Spotify</h3>
            <p className="text-xs text-muted-foreground">
              {activeAccount ? activeAccount.name : "No configurado"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Botón de información de comandos */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCommands(!showCommands)}
            className="rounded-xl"
            title="Comandos de voz"
          >
            <Info className="w-4 h-4" />
          </Button>

          {activeAccount && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSearch(!showSearch)
                  setShowPlaylists(false)
                  setShowAddAccount(false)
                }}
                className="rounded-xl"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadPlaylists()
                  setShowSearch(false)
                  setShowAddAccount(false)
                }}
                className="rounded-xl"
              >
                <List className="w-4 h-4 mr-2" />
                Listas
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAddAccount(!showAddAccount)
              setShowSearch(false)
              setShowPlaylists(false)
            }}
            className="rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Cuenta
          </Button>
        </div>
      </div>

      {/* Agregar nueva cuenta */}
      {showAddAccount && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h4 className="font-semibold text-sm">Nueva Cuenta de Spotify</h4>

          <TabletInput
            placeholder="Nombre (ej: Mi Cuenta, Juan, etc.)"
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            className="glass"
          />

          <TabletInput
            placeholder="Client ID"
            value={newAccount.clientId}
            onChange={(e) => setNewAccount({ ...newAccount, clientId: e.target.value })}
            className="glass"
          />

          <TabletInput
            placeholder="Client Secret"
            value={newAccount.clientSecret}
            onChange={(e) => setNewAccount({ ...newAccount, clientSecret: e.target.value })}
            className="glass"
            type="password"
          />

          <TabletInput
            placeholder="Refresh Token"
            value={newAccount.refreshToken}
            onChange={(e) => setNewAccount({ ...newAccount, refreshToken: e.target.value })}
            className="glass"
            type="password"
          />

          <div className="flex gap-2">
            <Button onClick={addAccount} className="flex-1 rounded-xl bg-[#1DB954] hover:bg-[#1ed760]">
              Agregar Cuenta
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddAccount(false)
                setNewAccount({ name: "", clientId: "", clientSecret: "", refreshToken: "" })
              }}
              className="rounded-xl"
            >
              Cancelar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open("/spotify-auth", "_blank")}
              className="flex-1 text-xs bg-[#1DB954]/10"
            >
              🔑 Obtener Refresh Token
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={connectSpotify}
              className="flex-1 text-xs"
            >
              📖 Guía completa
            </Button>
          </div>
        </div>
      )}

      {/* Búsqueda de música */}
      {showSearch && activeAccount && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Buscar música</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowSearch(false)
                setSearchQuery("")
                setSearchResults(null)
              }}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <TabletInput
              placeholder="Buscar canciones, artistas, álbumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchMusic()}
              className="glass flex-1"
            />
            <Button
              onClick={searchMusic}
              disabled={searching || !searchQuery.trim()}
              className="rounded-xl bg-[#1DB954] hover:bg-[#1ed760]"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {searching && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Buscando...
            </div>
          )}

          {searchResults && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Canciones */}
              {searchResults.tracks?.items?.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Canciones</label>
                  <div className="space-y-1 mt-2">
                    {searchResults.tracks.items.filter((t: any) => t !== null).map((track: any) => (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track.uri, track.name)}
                        className="glass rounded-xl p-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all"
                      >
                        {getImageUrl(track?.album?.images, 2) ? (
                          <img
                            src={getImageUrl(track?.album?.images, 2)!}
                            alt={track.name}
                            className="w-10 h-10 rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                            <Music className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artists?.map((a: any) => a.name).join(", ") || "Desconocido"}
                          </p>
                        </div>
                        <Play className="w-4 h-4 text-[#1DB954]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artistas */}
              {searchResults.artists?.items?.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Artistas</label>
                  <div className="space-y-1 mt-2">
                    {searchResults.artists.items.slice(0, 5).filter((a: any) => a !== null).map((artist: any) => (
                      <div
                        key={artist.id}
                        onClick={() => playTrack(artist.uri, artist.name)}
                        className="glass rounded-xl p-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all"
                      >
                        {getImageUrl(artist?.images, 2) ? (
                          <img
                            src={getImageUrl(artist?.images, 2)!}
                            alt={artist.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{artist.name}</p>
                          <p className="text-xs text-muted-foreground">Artista</p>
                        </div>
                        <Play className="w-4 h-4 text-[#1DB954]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Playlists */}
              {searchResults.playlists?.items?.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Playlists</label>
                  <div className="space-y-1 mt-2">
                    {searchResults.playlists.items.slice(0, 5).filter((p: any) => p !== null).map((playlist: any) => (
                      <div
                        key={playlist.id}
                        onClick={() => playPlaylist(playlist.uri)}
                        className="glass rounded-xl p-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all"
                      >
                        {getImageUrl(playlist?.images, 0) ? (
                          <img
                            src={getImageUrl(playlist?.images, 0)!}
                            alt={playlist.name}
                            className="w-10 h-10 rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                            <List className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{playlist.name}</p>
                          <p className="text-xs text-muted-foreground">{playlist.tracks?.total || 0} canciones</p>
                        </div>
                        <Play className="w-4 h-4 text-[#1DB954]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults && !searchResults.tracks?.items?.length && !searchResults.artists?.items?.length && !searchResults.playlists?.items?.length && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No se encontraron resultados
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Playlists del usuario */}
      {showPlaylists && activeAccount && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Mis Playlists</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPlaylists(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {playlists.filter((p: any) => p !== null).map((playlist: any) => (
              <div
                key={playlist.id}
                onClick={() => playPlaylist(playlist.uri)}
                className="glass rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all"
              >
                {getImageUrl(playlist?.images, 0) ? (
                  <img
                    src={getImageUrl(playlist?.images, 0)!}
                    alt={playlist.name}
                    className="w-12 h-12 rounded"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
                    <List className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">{playlist.tracks?.total || 0} canciones</p>
                </div>
                <Play className="w-4 h-4 text-[#1DB954]" />
              </div>
            ))}

            {playlists.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No hay playlists
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layout horizontal: Reproductor a la izquierda, Cuentas a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reproductor - 2 columnas */}
        <div className="lg:col-span-2">
          {activeAccount ? (
            currentTrack ? (
              <div className="glass rounded-2xl p-4 flex gap-4 items-center h-full">
                {/* Album Art - más pequeña */}
                {currentTrack.albumArt && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden group flex-shrink-0">
                    <img
                      src={currentTrack.albumArt}
                      alt={currentTrack.album}
                      className="w-full h-full object-cover"
                    />
                    {/* Botón de pantalla completa */}
                    <button
                      onClick={() => setShowFullscreen(true)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Maximize2 className="w-8 h-8 text-white" />
                    </button>
                  </div>
                )}

                {/* Contenido del reproductor */}
                <div className="flex-1 space-y-3">
                  {/* Track Info */}
                  <div>
                    <h4 className="font-bold text-base truncate">{currentTrack.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1DB954] transition-all duration-1000"
                        style={{ width: `${getProgress()}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTrack.progress)}</span>
                      <span>{formatTime(currentTrack.duration)}</span>
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={handlePrevious} className="rounded-xl h-9 w-9">
                        <SkipBack className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        onClick={handlePlayPause}
                        className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760]"
                      >
                        {currentTrack.isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </Button>

                      <Button variant="outline" size="icon" onClick={handleNext} className="rounded-xl h-9 w-9">
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Volume and Device Controls */}
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">{volume}%</span>

                      {/* Device selector button */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (!showDevices) {
                            getDevices()
                          }
                          setShowDevices(!showDevices)
                        }}
                        className="rounded-xl relative h-9 w-9 flex-shrink-0"
                        title="Dispositivos disponibles"
                      >
                        <Speaker className="w-4 h-4" />
                        {activeDevice && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center">
                <Music className="w-10 h-10 mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No hay música reproduciéndose</p>
              </div>
            )
          ) : (
            <div className="glass rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center">
              <Music className="w-10 h-10 mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Agrega una cuenta de Spotify para comenzar</p>
            </div>
          )}
        </div>

        {/* Lista de cuentas - 1 columna */}
        <div className="space-y-2">
          {accounts.length > 0 && (
            <>
              <label className="text-xs font-medium text-muted-foreground">Cuentas</label>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`glass rounded-xl p-2 flex items-center justify-between cursor-pointer transition-all ${
                      account.isActive ? "ring-2 ring-[#1DB954]" : ""
                    }`}
                    onClick={() => switchAccount(account.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{account.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {account.isActive && (
                        <Check className="w-4 h-4 text-[#1DB954]" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeAccount(account.id)
                        }}
                        className="h-6 w-6"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comandos de voz - Colapsable */}
      {showCommands && (
        <div className="glass rounded-2xl p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">🎵 Comandos de voz</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCommands(false)}
              className="h-6 w-6 rounded-lg"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <ul className="space-y-0.5 ml-4">
            <li>• "Reproduce Bad Bunny"</li>
            <li>• "Pon música de Shakira"</li>
            <li>• "Reproduce la canción Despacito"</li>
            <li>• "Pausa la música"</li>
            <li>• "Siguiente canción"</li>
            {accounts.length > 1 && (
              <li>• "Cambia a cuenta [nombre]"</li>
            )}
          </ul>
        </div>
      )}

      {/* Device Error Message */}
      {deviceError && (
        <div className="glass rounded-2xl p-4 bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{deviceError}</p>
        </div>
      )}

      {/* Devices List */}
      {showDevices && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Dispositivos Disponibles</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDevices(false)}
              className="h-8 w-8 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-6">
              <Speaker className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No hay dispositivos activos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Abre Spotify en tu teléfono o computadora
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device: any) => {
                const DeviceIcon = device.type === 'Computer' ? Monitor : device.type === 'Smartphone' ? Smartphone : Speaker
                const isActive = device.is_active

                return (
                  <button
                    key={device.id}
                    onClick={() => {
                      if (!isActive) {
                        transferPlayback(device.id)
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-green-500/20 border-2 border-green-500/40'
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <DeviceIcon className={`w-5 h-5 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-medium ${isActive ? 'text-green-500' : ''}`}>
                          {device.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {device.type} · {device.volume_percent}%
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-500 font-medium">Activo</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={getDevices}
            className="w-full mt-3 rounded-xl"
          >
            Actualizar dispositivos
          </Button>
        </div>
      )}

      {/* Fullscreen Player */}
      {showFullscreen && currentTrack && (
        <SpotifyFullscreen
          track={currentTrack}
          volume={volume}
          mode={fullscreenMode}
          devices={devices}
          activeDevice={activeDevice}
          onClose={() => {
            setShowFullscreen(false)
            setFullscreenMode('container')
          }}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onVolumeChange={handleVolumeChange}
          onToggleMode={() => {
            setFullscreenMode(prev => prev === 'container' ? 'browser' : 'container')
          }}
          onDeviceSelect={transferPlayback}
          onRefreshDevices={getDevices}
        />
      )}
    </div>
  )
}
