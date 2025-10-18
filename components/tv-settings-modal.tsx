"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  TabletDialog,
  TabletDialogContent,
  TabletDialogHeader,
  TabletDialogTitle,
  TabletDialogDescription,
} from "@/components/ui/tablet-dialog"
import { TabletInput } from "@/components/ui/tablet-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Edit2, Check, X, Wifi, WifiOff, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export interface SmartTV {
  id: string
  name: string
  location: string
  status: boolean
  volume: number
  muted: boolean
  channel: number
  input: string
  playing: boolean
  currentYoutubeChannel?: string
  ipAddress?: string
  brand?: "philips" | "samsung" | "lg" | "other"
  useAdb?: boolean // true = usar ADB, false/undefined = usar JointSpace API
}

interface TvSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tvs: SmartTV[]
  onTvsChange: (tvs: SmartTV[]) => void
}

export function TvSettingsModal({ open, onOpenChange, tvs, onTvsChange }: TvSettingsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    ipAddress: "",
    brand: "philips" as SmartTV["brand"],
    useAdb: false,
  })
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: "success" | "error" | null }>({})
  const [pairingTvId, setPairingTvId] = useState<string | null>(null)
  const [pairingStep, setPairingStep] = useState<"idle" | "waiting_code" | "pairing" | "success" | "error">("idle")
  const [pairingCode, setPairingCode] = useState("")
  const [pairingPort, setPairingPort] = useState("")
  const [pairingMessage, setPairingMessage] = useState("")

  const validateIp = (ip: string): boolean => {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipPattern.test(ip)) return false

    const parts = ip.split(".")
    return parts.every((part) => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    setEditForm({
      name: "",
      location: "",
      ipAddress: "",
      brand: "philips",
      useAdb: false,
    })
  }

  const handleSaveNew = () => {
    if (!editForm.name || !editForm.location || !editForm.ipAddress) {
      alert("Por favor completa todos los campos")
      return
    }

    if (!validateIp(editForm.ipAddress)) {
      alert("IP inválida. Formato correcto: 192.168.1.100")
      return
    }

    const newTv: SmartTV = {
      id: Date.now().toString(),
      name: editForm.name,
      location: editForm.location,
      ipAddress: editForm.ipAddress,
      brand: editForm.brand,
      useAdb: editForm.useAdb,
      status: false,
      volume: 30,
      muted: false,
      channel: 105,
      input: "HDMI 1",
      playing: false,
    }

    const updatedTvs = [...tvs, newTv]
    onTvsChange(updatedTvs)
    localStorage.setItem("smartTvs", JSON.stringify(updatedTvs))
    setIsAddingNew(false)
    setEditForm({ name: "", location: "", ipAddress: "", brand: "philips", useAdb: false })
  }

  const handleEdit = (tv: SmartTV) => {
    setEditingId(tv.id)
    setEditForm({
      name: tv.name,
      location: tv.location,
      ipAddress: tv.ipAddress || "",
      brand: tv.brand || "philips",
      useAdb: tv.useAdb || false,
    })
  }

  const handleSaveEdit = () => {
    if (!editingId) return

    if (!editForm.name || !editForm.location || !editForm.ipAddress) {
      alert("Por favor completa todos los campos")
      return
    }

    if (!validateIp(editForm.ipAddress)) {
      alert("IP inválida. Formato correcto: 192.168.1.100")
      return
    }

    const updatedTvs = tvs.map((tv) =>
      tv.id === editingId
        ? {
            ...tv,
            name: editForm.name,
            location: editForm.location,
            ipAddress: editForm.ipAddress,
            brand: editForm.brand,
            useAdb: editForm.useAdb,
          }
        : tv
    )

    onTvsChange(updatedTvs)
    localStorage.setItem("smartTvs", JSON.stringify(updatedTvs))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este TV?")) return

    const updatedTvs = tvs.filter((tv) => tv.id !== id)
    onTvsChange(updatedTvs)
    localStorage.setItem("smartTvs", JSON.stringify(updatedTvs))
  }

  const testConnection = async (tv: SmartTV) => {
    if (!tv.ipAddress) return

    setTestingConnection(tv.id)
    setConnectionStatus({ ...connectionStatus, [tv.id]: null })

    try {
      const apiEndpoint = tv.useAdb ? "/api/android-tv-adb" : "/api/philips-tv"
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp: tv.ipAddress,
          command: "getVolume",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Conexión exitosa:", data)
        setConnectionStatus({ ...connectionStatus, [tv.id]: "success" })
      } else {
        const error = await response.json()
        console.error("[v0] Error de conexión:", error)
        setConnectionStatus({ ...connectionStatus, [tv.id]: "error" })
      }
    } catch (error) {
      console.error("[v0] Error al probar conexión:", error)
      setConnectionStatus({ ...connectionStatus, [tv.id]: "error" })
    } finally {
      setTestingConnection(null)
    }
  }

  const startAdbPairing = async (tv: SmartTV) => {
    if (!tv.ipAddress) return

    setPairingTvId(tv.id)
    setPairingStep("pairing")
    setPairingMessage("Verificando conexión con el TV...")

    try {
      // Primero intentar conectar sin pairing (puede que ya esté vinculado)
      const response = await fetch("/api/android-tv-adb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp: tv.ipAddress,
          command: "checkConnection",
        }),
      })

      const data = await response.json()

      if (data.success && data.connected) {
        // Ya está conectado, no necesita pairing
        setPairingStep("success")
        setPairingMessage("¡Conexión exitosa! El TV ya estaba vinculado. Puedes controlarlo ahora.")
        setConnectionStatus({ ...connectionStatus, [tv.id]: "success" })

        setTimeout(() => {
          setPairingTvId(null)
          setPairingStep("idle")
        }, 2000)
      } else {
        // Necesita pairing
        setPairingStep("waiting_code")
        setPairingMessage(`
          En tu TV ${tv.name}:
          1. Ve a Configuración → Opciones para desarrolladores
          2. Entra en "Depuración inalámbrica"
          3. Haz clic en "Vincular dispositivo con código"
          4. Ingresa el PUERTO y CÓDIGO que aparecen en el TV
        `)
      }
    } catch (error: any) {
      // Si falla la verificación, pedir pairing manual
      setPairingStep("waiting_code")
      setPairingMessage(`
        En tu TV ${tv.name}:
        1. Ve a Configuración → Opciones para desarrolladores
        2. Entra en "Depuración inalámbrica"
        3. Haz clic en "Vincular dispositivo con código"
        4. Ingresa el PUERTO y CÓDIGO que aparecen en el TV
      `)
    }
  }

  const executeAdbPairing = async (tv: SmartTV) => {
    if (!pairingPort || !pairingCode) {
      alert("Por favor ingresa el puerto y el código")
      return
    }

    setPairingStep("pairing")
    setPairingMessage("Vinculando con el TV...")

    try {
      const response = await fetch("/api/android-tv-adb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tvIp: tv.ipAddress,
          command: "pair",
          port: pairingPort,
          code: pairingCode,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPairingStep("success")
        setPairingMessage("¡Vinculación exitosa! Ahora puedes controlar el TV.")
        setConnectionStatus({ ...connectionStatus, [tv.id]: "success" })

        // Cerrar el modal de pairing después de 2 segundos
        setTimeout(() => {
          setPairingTvId(null)
          setPairingStep("idle")
          setPairingCode("")
          setPairingPort("")
        }, 2000)
      } else {
        setPairingStep("error")
        setPairingMessage(data.error || "Error al vincular. Verifica el código y puerto.")
      }
    } catch (error: any) {
      setPairingStep("error")
      setPairingMessage(`Error: ${error.message}`)
    }
  }

  const cancelPairing = () => {
    setPairingTvId(null)
    setPairingStep("idle")
    setPairingCode("")
    setPairingPort("")
    setPairingMessage("")
  }

  return (
    <>
      <TabletDialog open={open} onOpenChange={onOpenChange}>
        <TabletDialogContent className="glass-strong border-white/10" size="lg">
        <TabletDialogHeader>
          <TabletDialogTitle>Configuración de TVs</TabletDialogTitle>
          <TabletDialogDescription>
            Administra tus Smart TVs. Agrega, edita o elimina dispositivos.
          </TabletDialogDescription>
        </TabletDialogHeader>

        <div className="space-y-4 mt-4">
          {/* Lista de TVs */}
          <div className="space-y-3">
            {tvs.map((tv) => (
              <div key={tv.id} className="glass rounded-2xl p-4">
                {editingId === tv.id ? (
                // Modo edición
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-name">Nombre</Label>
                    <TabletInput
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Smart TV Sala"
                      className="glass mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Ubicación</Label>
                    <TabletInput
                      id="edit-location"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Sala de Estar"
                      className="glass mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-ip">Dirección IP</Label>
                    <TabletInput
                      id="edit-ip"
                      value={editForm.ipAddress}
                      onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                      className="glass mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-brand">Marca</Label>
                    <Select
                      value={editForm.brand}
                      onValueChange={(value) => setEditForm({ ...editForm, brand: value as SmartTV["brand"] })}
                    >
                      <SelectTrigger className="glass mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="philips">Philips</SelectItem>
                        <SelectItem value="samsung">Samsung</SelectItem>
                        <SelectItem value="lg">LG</SelectItem>
                        <SelectItem value="other">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between glass rounded-xl p-3">
                    <div>
                      <Label htmlFor="edit-use-adb">Usar ADB (Android Debug Bridge)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Para TVs modernos (2016+) sin JointSpace
                      </p>
                    </div>
                    <Switch
                      id="edit-use-adb"
                      checked={editForm.useAdb}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, useAdb: checked })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="flex-1 rounded-xl">
                      <Check className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      className="flex-1 rounded-xl bg-transparent"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
                ) : (
                // Modo visualización
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{tv.name}</h3>
                      <p className="text-sm text-muted-foreground">{tv.location}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="glass px-2 py-1 rounded-lg">
                          IP: {tv.ipAddress || "No configurada"}
                        </span>
                        <span className="glass px-2 py-1 rounded-lg capitalize">
                          {tv.brand || "Otra"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tv)}
                        className="rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tv.id)}
                        className="rounded-xl text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Botones de prueba de conexión y pairing */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(tv)}
                      disabled={testingConnection === tv.id || !tv.ipAddress}
                      className="rounded-xl text-xs"
                    >
                      {testingConnection === tv.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Probando...
                        </>
                      ) : (
                        <>
                          <Wifi className="w-3 h-3 mr-2" />
                          Probar Conexión
                        </>
                      )}
                    </Button>

                    {tv.useAdb && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startAdbPairing(tv)}
                        disabled={!tv.ipAddress}
                        className="rounded-xl text-xs bg-blue-500/10"
                      >
                        <Wifi className="w-3 h-3 mr-2" />
                        Vincular ADB
                      </Button>
                    )}

                    {connectionStatus[tv.id] === "success" && (
                      <div className="flex items-center gap-1 text-xs text-green-500">
                        <Wifi className="w-3 h-3" />
                        <span>Conectado</span>
                      </div>
                    )}

                    {connectionStatus[tv.id] === "error" && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <WifiOff className="w-3 h-3" />
                        <span>Error de conexión</span>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            ))}
          </div>

          {/* Formulario para agregar nuevo */}
          {isAddingNew ? (
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold">Agregar Nuevo TV</h3>
              <div>
                <Label htmlFor="new-name">Nombre</Label>
                <TabletInput
                id="new-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Smart TV Sala"
                className="glass mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-location">Ubicación</Label>
                <TabletInput
                id="new-location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Sala de Estar"
                className="glass mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-ip">Dirección IP</Label>
                <TabletInput
                id="new-ip"
                value={editForm.ipAddress}
                onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })}
                placeholder="192.168.1.100"
                className="glass mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                Para encontrar la IP de tu TV Philips: Configuración → Red → Ver configuración de red
                </p>
              </div>
              <div>
                <Label htmlFor="new-brand">Marca</Label>
                <Select
                value={editForm.brand}
                onValueChange={(value) => setEditForm({ ...editForm, brand: value as SmartTV["brand"] })}
                >
                <SelectTrigger className="glass mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="philips">Philips</SelectItem>
                  <SelectItem value="samsung">Samsung</SelectItem>
                  <SelectItem value="lg">LG</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between glass-strong rounded-xl p-3 bg-blue-500/10">
                <div>
                <Label htmlFor="new-use-adb">Usar ADB (Android Debug Bridge)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Para TVs modernos Philips 2016+ (como el 65PUD7908/77)
                </p>
                </div>
                <Switch
                id="new-use-adb"
                checked={editForm.useAdb}
                onCheckedChange={(checked) => setEditForm({ ...editForm, useAdb: checked })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveNew} className="flex-1 rounded-xl">
                <Check className="w-4 h-4 mr-2" />
                Agregar
                </Button>
                <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNew(false)
                  setEditForm({ name: "", location: "", ipAddress: "", brand: "philips", useAdb: false })
                }}
                className="flex-1 rounded-xl bg-transparent"
                >
                <X className="w-4 h-4 mr-2" />
                Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleAddNew} className="w-full rounded-xl" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Nuevo TV
            </Button>
          )}
        </div>
        </TabletDialogContent>
      </TabletDialog>

      {/* Modal de Pairing ADB */}
      <TabletDialog open={!!pairingTvId} onOpenChange={() => cancelPairing()}>
        <TabletDialogContent className="glass-strong border-white/10" size="md">
          <TabletDialogHeader>
            <TabletDialogTitle>Vincular TV con ADB</TabletDialogTitle>
            <TabletDialogDescription>
              {tvs.find((t) => t.id === pairingTvId)?.name}
            </TabletDialogDescription>
          </TabletDialogHeader>

          <div className="space-y-4 mt-4">
            {/* Instrucciones */}
            {pairingStep === "waiting_code" && (
              <>
                <div className="glass rounded-2xl p-4 text-sm space-y-2">
                  <p className="font-semibold">📺 En tu TV:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground ml-2">
                    <li>Ve a <strong>Configuración</strong> → <strong>Opciones para desarrolladores</strong></li>
                    <li>Entra en <strong>"Depuración inalámbrica"</strong></li>
                    <li>Haz clic en <strong>"Vincular dispositivo con código"</strong></li>
                    <li>Verás un código de 6 dígitos y un puerto</li>
                  </ol>
                </div>

                <div>
                  <Label htmlFor="pairing-port">Puerto (del TV)</Label>
                  <TabletInput
                    id="pairing-port"
                    value={pairingPort}
                    onChange={(e) => setPairingPort(e.target.value)}
                    placeholder="Ej: 37853"
                    className="glass mt-1"
                    type="number"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El puerto que aparece en el TV (ej: 192.168.100.228:<strong>37853</strong>)
                  </p>
                </div>

                <div>
                  <Label htmlFor="pairing-code">Código de vinculación</Label>
                  <TabletInput
                    id="pairing-code"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value)}
                    placeholder="Ej: 123456"
                    className="glass mt-1 text-lg font-mono text-center tracking-widest"
                    maxLength={6}
                    type="text"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El código de 6 dígitos que aparece en el TV
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => executeAdbPairing(tvs.find((t) => t.id === pairingTvId)!)}
                    className="flex-1 rounded-xl"
                    disabled={!pairingPort || !pairingCode || pairingCode.length !== 6}
                  >
                    Vincular
                  </Button>
                  <Button variant="outline" onClick={cancelPairing} className="flex-1 rounded-xl bg-transparent">
                    Cancelar
                  </Button>
                </div>
                </>
              )}

              {/* Vinculando */}
              {pairingStep === "pairing" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{pairingMessage}</p>
                </div>
              )}

              {/* Éxito */}
              {pairingStep === "success" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-green-500">{pairingMessage}</p>
                </div>
              )}

              {/* Error */}
              {pairingStep === "error" && (
                <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-sm text-red-500 text-center">{pairingMessage}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setPairingStep("waiting_code")} className="flex-1 rounded-xl">
                    Reintentar
                  </Button>
                  <Button variant="outline" onClick={cancelPairing} className="flex-1 rounded-xl bg-transparent">
                    Cerrar
                  </Button>
                </div>
                </div>
              )}
          </div>
        </TabletDialogContent>
      </TabletDialog>
    </>
  )
}
