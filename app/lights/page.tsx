
import { LightsControlRedesigned } from "@/components/lights-control-redesigned"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LightsPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.18_0.12_250)] via-[oklch(0.14_0.08_270)] to-[oklch(0.16_0.10_240)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[oklch(0.65_0.25_250)] rounded-full blur-[140px] opacity-20 animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[oklch(0.55_0.22_280)] rounded-full blur-[120px] opacity-15 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="glass rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl glass-strong"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Philips Hue</h1>
              <p className="text-sm text-muted-foreground mt-1">Control total de tus luces inteligentes</p>
            </div>
          </div>
        </div>

        <LightsControlRedesigned />
      </div>
    </div>
  )
}