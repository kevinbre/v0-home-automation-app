"use client"

import { Lightbulb, Tv, Volume2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const actions = [
  { icon: Lightbulb, label: "Todas las Luces", color: "oklch(0.7 0.2 60)", href: "/lights" },
  { icon: Tv, label: "Smart TV", color: "oklch(0.6 0.25 250)", href: "/tv" },
  { icon: Volume2, label: "Alexa", color: "oklch(0.55 0.22 280)", href: "/alexa" },
  { icon: Zap, label: "Escenas", color: "oklch(0.65 0.2 180)", href: "/" },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <Button
            variant="ghost"
            className="glass-strong rounded-3xl h-auto p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform w-full"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${action.color}/0.2` }}
            >
              <action.icon className="w-7 h-7" style={{ color: action.color }} />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  )
}
