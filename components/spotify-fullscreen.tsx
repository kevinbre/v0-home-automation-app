"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, Pause, SkipForward, SkipBack, Volume2, Type, Minimize2, Maximize2, Speaker, Monitor, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface SpotifyFullscreenProps {
  track: {
    name: string
    artist: string
    album: string
    albumArt: string
    duration: number
    progress: number
    isPlaying: boolean
  }
  volume: number
  mode?: 'container' | 'browser' // Modo de fullscreen
  devices?: any[]
  activeDevice?: any
  onClose: () => void
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
  onVolumeChange: (value: number[]) => void
  onToggleMode?: () => void // Cambiar entre modos
  onDeviceSelect?: (deviceId: string) => void
  onRefreshDevices?: () => void
}

export function SpotifyFullscreen({
  track,
  volume,
  mode = 'container',
  devices = [],
  activeDevice,
  onClose,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onToggleMode,
  onDeviceSelect,
  onRefreshDevices,
}: SpotifyFullscreenProps) {
  const [showLyrics, setShowLyrics] = useState(false)
  const [lyrics, setLyrics] = useState<string[]>([])
  const [loadingLyrics, setLoadingLyrics] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [showDevices, setShowDevices] = useState(false)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const currentLyricRef = useRef<HTMLParagraphElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getProgress = (): number => {
    return (track.progress / track.duration) * 100
  }

  // Simular sincronización de letras basada en el progreso
  useEffect(() => {
    if (lyrics.length === 0 || !showLyrics) return

    const progressPercent = (track.progress / track.duration) * 100
    const estimatedIndex = Math.floor((progressPercent / 100) * lyrics.length)
    setCurrentLyricIndex(Math.min(estimatedIndex, lyrics.length - 1))
  }, [track.progress, lyrics.length, showLyrics, track.duration])

  // Auto-scroll para seguir la letra actual - mantener siempre centrada
  useEffect(() => {
    if (!currentLyricRef.current || !lyricsContainerRef.current) return

    const container = lyricsContainerRef.current
    const currentElement = currentLyricRef.current

    // Obtener la posición del elemento relativo al contenedor
    const containerRect = container.getBoundingClientRect()
    const elementRect = currentElement.getBoundingClientRect()

    // Calcular cuánto necesitamos scrollear para centrar el elemento
    const containerCenter = containerRect.height / 2
    const elementCenter = elementRect.top - containerRect.top + container.scrollTop
    const scrollPosition = elementCenter - containerCenter + (elementRect.height / 2)

    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    })
  }, [currentLyricIndex])

  // Manejar fullscreen del navegador
  useEffect(() => {
    const enterFullscreen = async () => {
      if (!fullscreenRef.current) return

      try {
        if (fullscreenRef.current.requestFullscreen) {
          await fullscreenRef.current.requestFullscreen()
        } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
          await (fullscreenRef.current as any).webkitRequestFullscreen()
        } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
          await (fullscreenRef.current as any).mozRequestFullScreen()
        } else if ((fullscreenRef.current as any).msRequestFullscreen) {
          await (fullscreenRef.current as any).msRequestFullscreen()
        }
      } catch (error) {
        console.error('[Fullscreen] Error entering fullscreen:', error)
      }
    }

    const exitFullscreen = async () => {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      } catch (error) {
        console.error('[Fullscreen] Error exiting fullscreen:', error)
      }
    }

    if (mode === 'browser') {
      enterFullscreen()
    } else {
      if (document.fullscreenElement) {
        exitFullscreen()
      }
    }

    // Listener para cuando el usuario sale del fullscreen con ESC
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && mode === 'browser' && onToggleMode) {
        onToggleMode()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [mode, onToggleMode])

  // Cargar letras de Genius API (alternativa gratuita)
  useEffect(() => {
    const fetchLyrics = async () => {
      setLoadingLyrics(true)
      try {
        // Buscar letras usando una API pública
        const searchQuery = encodeURIComponent(`${track.artist} ${track.name}`)
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.name)}`)

        if (response.ok) {
          const data = await response.json()
          if (data.lyrics) {
            // Dividir las letras en líneas
            const lyricsLines = data.lyrics.split('\n').filter((line: string) => line.trim() !== '')
            setLyrics(lyricsLines)
          } else {
            setLyrics(['No se encontraron letras para esta canción'])
          }
        } else {
          setLyrics(['No se pudieron cargar las letras'])
        }
      } catch (error) {
        console.error('[Lyrics] Error fetching lyrics:', error)
        setLyrics(['Error al cargar las letras'])
      } finally {
        setLoadingLyrics(false)
      }
    }

    if (showLyrics && track) {
      fetchLyrics()
    }
  }, [track.name, track.artist, showLyrics])

  const containerClass = mode === 'browser'
    ? 'fixed inset-0 z-[100]'
    : 'absolute inset-0 z-50'

  return (
    <div ref={fullscreenRef} className={containerClass}>
      <div className="w-full h-full bg-black group">
        {/* Fondo con imagen difuminada - más prominente en modo browser */}
        <div
          className={`absolute inset-0 blur-3xl ${mode === 'browser' ? 'opacity-60' : 'opacity-30'}`}
          style={{
            backgroundImage: `url(${track.albumArt})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Contenido */}
        <div className="relative h-full flex flex-col">
          {/* Header - oculto en modo browser hasta hover */}
          <div className={`flex items-center justify-between p-6 transition-opacity duration-300 ${
            mode === 'browser' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-white/10 bg-black/40"
            >
              <Minimize2 className="w-6 h-6" />
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Reproduciendo desde</p>
              <p className="font-semibold">Spotify</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={showLyrics ? "default" : "ghost"}
                size="icon"
                onClick={() => setShowLyrics(!showLyrics)}
                className="rounded-full hover:bg-white/10 bg-black/40"
                title="Ver letras"
              >
                <Type className="w-6 h-6" />
              </Button>

              <Button
                variant={showDevices ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  setShowDevices(!showDevices)
                  if (!showDevices && onRefreshDevices) {
                    onRefreshDevices()
                  }
                }}
                className="rounded-full hover:bg-white/10 bg-black/40 relative"
                title="Dispositivos"
              >
                <Speaker className="w-6 h-6" />
                {activeDevice && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </Button>

              {onToggleMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleMode}
                  className="rounded-full hover:bg-white/10 bg-black/40"
                  title={mode === 'container' ? 'Pantalla completa' : 'Modo contenedor'}
                >
                  <Maximize2 className="w-6 h-6" />
                </Button>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 flex items-center justify-center p-8">
          <div className={mode === 'browser' ? 'w-full h-full' : 'max-w-4xl w-full'}>
            {!showLyrics ? (
              /* Vista de carátula */
              <div className={`space-y-8 h-full flex flex-col justify-center ${mode === 'browser' ? 'items-center' : ''}`}>
                {/* Carátula - más grande en modo browser */}
                <div className={`aspect-square ${mode === 'browser' ? 'max-w-2xl' : 'max-w-md'} mx-auto rounded-3xl overflow-hidden shadow-2xl`}>
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info de la canción - más sutil en modo browser */}
                <div className={`text-center space-y-2 transition-opacity duration-300 ${
                  mode === 'browser' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                }`}>
                  <h1 className={`font-bold ${mode === 'browser' ? 'text-5xl' : 'text-4xl'}`}>{track.name}</h1>
                  <p className={`text-muted-foreground ${mode === 'browser' ? 'text-3xl' : 'text-2xl'}`}>{track.artist}</p>
                </div>
              </div>
            ) : (
              /* Vista de letras */
              <div className="h-full flex items-center justify-center">
                <div className="max-w-2xl w-full space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">{track.name}</h2>
                    <p className="text-xl text-muted-foreground">{track.artist}</p>
                  </div>

                  {loadingLyrics ? (
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                      <p className="text-lg text-muted-foreground mt-4">Cargando letras...</p>
                    </div>
                  ) : (
                    <div
                      ref={lyricsContainerRef}
                      className="relative h-[60vh] overflow-y-auto px-4 scroll-smooth"
                    >
                      {/* Espaciador superior para permitir centrado */}
                      <div className="h-[30vh]" />

                      <div className="space-y-3 text-center">
                        {lyrics.map((line, index) => {
                          const isCurrent = index === currentLyricIndex
                          const isPast = index < currentLyricIndex
                          const isFuture = index > currentLyricIndex

                          return (
                            <p
                              key={index}
                              ref={isCurrent ? currentLyricRef : null}
                              className={`leading-relaxed transition-all duration-500 ${
                                isCurrent
                                  ? 'text-3xl font-bold text-white scale-105'
                                  : isPast
                                  ? 'text-lg text-white/60'
                                  : 'text-xl text-white/40'
                              }`}
                            >
                              {line}
                            </p>
                          )
                        })}
                      </div>

                      {/* Espaciador inferior para permitir centrado */}
                      <div className="h-[30vh]" />
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Controles - ocultos en modo browser hasta hover */}
          <div className={`p-8 space-y-6 transition-opacity duration-300 ${
            mode === 'browser' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}>
            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-1000"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(track.progress)}</span>
                <span>{formatTime(track.duration)}</span>
              </div>
            </div>

            {/* Botones de control */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="w-14 h-14 rounded-full hover:bg-white/10 bg-black/40"
              >
                <SkipBack className="w-7 h-7" />
              </Button>

              <Button
                size="icon"
                onClick={onPlayPause}
                className="w-20 h-20 rounded-full bg-white hover:bg-white/90 text-black shadow-2xl"
              >
                {track.isPlaying ? (
                  <Pause className="w-10 h-10" />
                ) : (
                  <Play className="w-10 h-10 ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="w-14 h-14 rounded-full hover:bg-white/10 bg-black/40"
              >
                <SkipForward className="w-7 h-7" />
              </Button>
            </div>

            {/* Control de volumen */}
            <div className="max-w-md mx-auto flex items-center gap-4">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={onVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">{volume}%</span>
            </div>
          </div>

          {/* Panel de dispositivos */}
          {showDevices && (
            <div className="absolute top-20 right-6 w-80 bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Dispositivos Disponibles</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDevices(false)}
                  className="h-8 w-8 rounded-lg hover:bg-white/10"
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
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {devices.map((device: any) => {
                    const DeviceIcon = device.type === 'Computer' ? Monitor : device.type === 'Smartphone' ? Smartphone : Speaker
                    const isActive = device.is_active

                    return (
                      <button
                        key={device.id}
                        onClick={() => {
                          if (!isActive && onDeviceSelect) {
                            onDeviceSelect(device.id)
                            setShowDevices(false)
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

              {onRefreshDevices && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshDevices}
                  className="w-full mt-3 rounded-xl bg-white/5 hover:bg-white/10"
                >
                  Actualizar dispositivos
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
