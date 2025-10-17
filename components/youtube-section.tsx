"use client"

import { useState } from "react"
import { Youtube, Plus, Trash2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface YoutubeFavorite {
  id: string
  name: string
  url: string
  thumbnail: string
}

export function YoutubeSection() {
  const [favorites, setFavorites] = useState<YoutubeFavorite[]>([
    {
      id: "1",
      name: "Música Relajante",
      url: "https://youtube.com/watch?v=example1",
      thumbnail: "/relaxing-music-scene.png",
    },
    {
      id: "2",
      name: "Noticias",
      url: "https://youtube.com/watch?v=example2",
      thumbnail: "/news-channel.png",
    },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFavorite, setNewFavorite] = useState({ name: "", url: "" })

  const addFavorite = () => {
    if (newFavorite.name && newFavorite.url) {
      setFavorites([
        ...favorites,
        {
          id: Date.now().toString(),
          name: newFavorite.name,
          url: newFavorite.url,
          thumbnail: `/placeholder.svg?height=120&width=200&query=${encodeURIComponent(newFavorite.name)}`,
        },
      ])
      setNewFavorite({ name: "", url: "" })
      setShowAddForm(false)
    }
  }

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter((f) => f.id !== id))
  }

  const playOnTV = (favorite: YoutubeFavorite) => {
    console.log("[v0] Playing on TV:", favorite.name, favorite.url)
  }

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF0000]/20 flex items-center justify-center">
            <Youtube className="w-6 h-6 text-[#FF0000]" />
          </div>
          <div>
            <h3 className="text-lg font-bold">YouTube</h3>
            <p className="text-xs text-muted-foreground">Canales favoritos</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-xl bg-transparent"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {showAddForm && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="channel-name" className="text-xs">
              Nombre del Canal
            </Label>
            <Input
              id="channel-name"
              placeholder="Ej: Música Relajante"
              value={newFavorite.name}
              onChange={(e) => setNewFavorite({ ...newFavorite, name: e.target.value })}
              className="glass h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-url" className="text-xs">
              URL del Video/Canal
            </Label>
            <Input
              id="channel-url"
              placeholder="https://youtube.com/..."
              value={newFavorite.url}
              onChange={(e) => setNewFavorite({ ...newFavorite, url: e.target.value })}
              className="glass h-9 text-sm"
            />
          </div>
          <Button onClick={addFavorite} className="w-full rounded-xl h-9 text-sm">
            Agregar Favorito
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="glass rounded-2xl p-3 flex items-center gap-3 group hover:scale-[1.02] transition-all"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={favorite.thumbnail || "/placeholder.svg"}
                alt={favorite.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{favorite.name}</p>
              <p className="text-xs text-muted-foreground truncate">{favorite.url}</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => playOnTV(favorite)}
                className="rounded-lg h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFavorite(favorite.id)}
                className="rounded-lg h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
