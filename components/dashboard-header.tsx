"use client"

import { Home, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function DashboardHeader() {
  const currentTime = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <header className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center glass-strong">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-balance">Mi Casa Inteligente</h1>
            <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-3xl font-bold tabular-nums">{currentTime}</span>
            <span className="text-xs text-muted-foreground">Hora actual</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-2xl glass-strong">
            <User className="w-5 h-5" />
          </Button>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-2xl glass-strong">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
