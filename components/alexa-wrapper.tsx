"use client"

import dynamic from "next/dynamic"

// Importar asistente de voz CON wake word detection
const VoiceAssistantWithWakeWord = dynamic(
  () => import("./voice-assistant-with-wake-word").then(mod => ({ default: mod.VoiceAssistantWithWakeWord })),
  { ssr: false }
)

export function AlexaWrapper() {
  return <VoiceAssistantWithWakeWord />
}
