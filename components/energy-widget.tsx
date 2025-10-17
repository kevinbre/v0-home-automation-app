"use client"

import { Zap, TrendingDown } from "lucide-react"

export function EnergyWidget() {
  const currentUsage = 2.4
  const dailyAverage = 3.1
  const savings = ((dailyAverage - currentUsage) / dailyAverage) * 100

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.7_0.2_60)]/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-[oklch(0.7_0.2_60)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Energía</h3>
          <p className="text-xs text-muted-foreground">Consumo actual</p>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-5xl font-bold">{currentUsage}</span>
        <span className="text-lg text-muted-foreground mb-2">kW</span>
      </div>

      <div className="glass rounded-2xl p-3 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-green-400" />
        <p className="text-sm">
          <span className="font-semibold text-green-400">{savings.toFixed(0)}% menos</span>
          <span className="text-muted-foreground"> que el promedio</span>
        </p>
      </div>
    </div>
  )
}
