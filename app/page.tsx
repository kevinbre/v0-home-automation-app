import { DashboardHeader } from "@/components/dashboard-header"
import { QuickActions } from "@/components/quick-actions"
import { DeviceGrid } from "@/components/device-grid"
import { SceneCards } from "@/components/scene-cards"
import { YoutubeSection } from "@/components/youtube-section"
import { WeatherWidget } from "@/components/weather-widget"
import { CalendarWidget } from "@/components/calendar-widget"
import { EnergyWidget } from "@/components/energy-widget"

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.2_0.15_250)] via-[oklch(0.15_0.1_280)] to-[oklch(0.18_0.12_230)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[oklch(0.5_0.3_250)] rounded-full blur-[120px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[oklch(0.5_0.3_280)] rounded-full blur-[100px] opacity-15 animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <DashboardHeader />

        <div className="mt-8 space-y-8">
          <QuickActions />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WeatherWidget />
            <CalendarWidget />
            <EnergyWidget />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SceneCards />
            <YoutubeSection />
          </div>

          <DeviceGrid />
        </div>
      </div>
    </div>
  )
}
