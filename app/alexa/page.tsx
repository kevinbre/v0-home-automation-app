import { AlexaControl } from "@/components/alexa-control"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AlexaPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.2_0.15_250)] via-[oklch(0.15_0.1_280)] to-[oklch(0.18_0.12_230)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[oklch(0.55_0.22_280)] rounded-full blur-[120px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[oklch(0.5_0.3_280)] rounded-full blur-[100px] opacity-15 animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="glass rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-2xl glass-strong">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Control de Alexa</h1>
              <p className="text-sm text-muted-foreground">Gestiona tus dispositivos Alexa y rutinas</p>
            </div>
          </div>
        </div>

        <AlexaControl />
      </div>
    </div>
  )
}
