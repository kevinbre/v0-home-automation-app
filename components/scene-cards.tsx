"use client"

import { Moon, Sun, Film, Coffee, Sunrise, Sunset, Sparkles, Book } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const USE_MOCK_SCENES = true

const mockHueScenes = [
  {
    icon: Sun,
    name: "Energizar",
    description: "Luz brillante y fría",
    gradient: "from-[oklch(0.9_0.1_200)] to-[oklch(0.85_0.15_220)]",
    hueSceneId: "energize",
  },
  {
    icon: Sunrise,
    name: "Concentración",
    description: "Luz clara para trabajar",
    gradient: "from-[oklch(0.85_0.12_180)] to-[oklch(0.8_0.15_200)]",
    hueSceneId: "concentrate",
  },
  {
    icon: Book,
    name: "Lectura",
    description: "Luz cálida y confortable",
    gradient: "from-[oklch(0.75_0.15_60)] to-[oklch(0.7_0.18_50)]",
    hueSceneId: "read",
  },
  {
    icon: Coffee,
    name: "Relajar",
    description: "Luz suave y cálida",
    gradient: "from-[oklch(0.6_0.18_40)] to-[oklch(0.55_0.2_30)]",
    hueSceneId: "relax",
  },
  {
    icon: Sunset,
    name: "Atardecer",
    description: "Tonos naranjas cálidos",
    gradient: "from-[oklch(0.65_0.2_50)] to-[oklch(0.6_0.22_30)]",
    hueSceneId: "sunset",
  },
  {
    icon: Moon,
    name: "Dormir",
    description: "Luz muy tenue",
    gradient: "from-[oklch(0.4_0.15_30)] to-[oklch(0.3_0.12_20)]",
    hueSceneId: "nightlight",
  },
  {
    icon: Film,
    name: "Cine",
    description: "Luz tenue azulada",
    gradient: "from-[oklch(0.35_0.2_250)] to-[oklch(0.3_0.18_240)]",
    hueSceneId: "movie",
  },
  {
    icon: Sparkles,
    name: "Fiesta",
    description: "Colores vibrantes",
    gradient: "from-[oklch(0.6_0.25_320)] via-[oklch(0.6_0.25_280)] to-[oklch(0.6_0.25_200)]",
    hueSceneId: "party",
  },
]

export function SceneCards() {
  const [scenes, setScenes] = useState(mockHueScenes)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!USE_MOCK_SCENES) {
      fetchHueScenes()
    }
  }, [])

  const fetchHueScenes = async () => {
    setLoading(true)
    try {
      // This would fetch from /api/hue/scenes when connected to real bridge
      const config = localStorage.getItem("hueConfig")
      if (!config) {
        console.log("[v0] No Hue config found, using mock scenes")
        return
      }

      const { bridgeIp, username } = JSON.parse(config)
      const response = await fetch(`http://${bridgeIp}/api/${username}/scenes`)
      const data = await response.json()

      // Transform Hue API scenes to our format
      const transformedScenes = Object.entries(data).map(([id, scene]: [string, any]) => ({
        icon: getIconForScene(scene.name),
        name: scene.name,
        description: scene.type,
        gradient: getGradientForScene(scene.name),
        hueSceneId: id,
      }))

      setScenes(transformedScenes)
    } catch (error) {
      console.error("[v0] Error fetching Hue scenes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIconForScene = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("energi") || lowerName.includes("bright")) return Sun
    if (lowerName.includes("concent") || lowerName.includes("focus")) return Sunrise
    if (lowerName.includes("read") || lowerName.includes("lect")) return Book
    if (lowerName.includes("relax") || lowerName.includes("rest")) return Coffee
    if (lowerName.includes("sunset") || lowerName.includes("atardecer")) return Sunset
    if (lowerName.includes("sleep") || lowerName.includes("night") || lowerName.includes("dorm")) return Moon
    if (lowerName.includes("movie") || lowerName.includes("cine")) return Film
    if (lowerName.includes("party") || lowerName.includes("fiesta")) return Sparkles
    return Sun
  }

  const getGradientForScene = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("energi") || lowerName.includes("bright"))
      return "from-[oklch(0.9_0.1_200)] to-[oklch(0.85_0.15_220)]"
    if (lowerName.includes("concent") || lowerName.includes("focus"))
      return "from-[oklch(0.85_0.12_180)] to-[oklch(0.8_0.15_200)]"
    if (lowerName.includes("read") || lowerName.includes("lect"))
      return "from-[oklch(0.75_0.15_60)] to-[oklch(0.7_0.18_50)]"
    if (lowerName.includes("relax") || lowerName.includes("rest"))
      return "from-[oklch(0.6_0.18_40)] to-[oklch(0.55_0.2_30)]"
    if (lowerName.includes("sunset") || lowerName.includes("atardecer"))
      return "from-[oklch(0.65_0.2_50)] to-[oklch(0.6_0.22_30)]"
    if (lowerName.includes("sleep") || lowerName.includes("night") || lowerName.includes("dorm"))
      return "from-[oklch(0.4_0.15_30)] to-[oklch(0.3_0.12_20)]"
    if (lowerName.includes("movie") || lowerName.includes("cine"))
      return "from-[oklch(0.35_0.2_250)] to-[oklch(0.3_0.18_240)]"
    if (lowerName.includes("party") || lowerName.includes("fiesta"))
      return "from-[oklch(0.6_0.25_320)] via-[oklch(0.6_0.25_280)] to-[oklch(0.6_0.25_200)]"
    return "from-[oklch(0.7_0.15_200)] to-[oklch(0.65_0.18_220)]"
  }

  const activateScene = async (sceneId: string, sceneName: string) => {
    console.log("[v0] Activating Hue scene:", sceneName, sceneId)

    if (USE_MOCK_SCENES) {
      console.log("[v0] Mock mode - scene would be activated on real bridge")
      return
    }

    try {
      const config = localStorage.getItem("hueConfig")
      if (!config) return

      const { bridgeIp, username } = JSON.parse(config)
      await fetch(`http://${bridgeIp}/api/${username}/groups/0/action`, {
        method: "PUT",
        body: JSON.stringify({ scene: sceneId }),
      })
    } catch (error) {
      console.error("[v0] Error activating scene:", error)
    }
  }

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Escenas Philips Hue</h2>
          <p className="text-xs text-muted-foreground">
            {USE_MOCK_SCENES
              ? "Escenas de ejemplo (conecta tu bridge para ver las reales)"
              : "Tus escenas personalizadas"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {scenes.map((scene) => (
          <Button
            key={scene.hueSceneId}
            variant="ghost"
            onClick={() => activateScene(scene.hueSceneId, scene.name)}
            className="glass rounded-2xl h-auto p-0 overflow-hidden hover:scale-[1.02] transition-all group"
          >
            <div className="w-full p-4 flex flex-col items-start gap-2">
              <div
                className={`w-full h-16 rounded-xl bg-gradient-to-br ${scene.gradient} flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg`}
              >
                <scene.icon className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
              <div className="text-left w-full">
                <h3 className="font-semibold text-sm">{scene.name}</h3>
                <p className="text-xs text-muted-foreground">{scene.description}</p>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
