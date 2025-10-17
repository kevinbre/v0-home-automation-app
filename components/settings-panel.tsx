"use client"

import { useState } from "react"
import { User, Bell, Shield, Palette, Wifi, Battery, Moon, Sun, Globe, Star, Heart, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface FavoriteDevice {
  id: string
  name: string
  type: string
  room: string
}

interface UserProfile {
  name: string
  email: string
  avatar: string
}

export function SettingsPanel() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "",
  })

  const [notifications, setNotifications] = useState({
    deviceStatus: true,
    routines: true,
    security: true,
    updates: false,
  })

  const [preferences, setPreferences] = useState({
    darkMode: true,
    language: "es",
    temperature: "celsius",
    energySaving: true,
  })

  const [favorites, setFavorites] = useState<FavoriteDevice[]>([
    { id: "1", name: "Luz Sala", type: "light", room: "Sala" },
    { id: "2", name: "Smart TV Sala", type: "tv", room: "Sala" },
    { id: "3", name: "Alexa Cocina", type: "speaker", room: "Cocina" },
  ])

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter((fav) => fav.id !== id))
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="glass-strong rounded-2xl p-1 w-full grid grid-cols-4">
        <TabsTrigger value="profile" className="rounded-xl">
          <User className="w-4 h-4 mr-2" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="favorites" className="rounded-xl">
          <Star className="w-4 h-4 mr-2" />
          Favoritos
        </TabsTrigger>
        <TabsTrigger value="notifications" className="rounded-xl">
          <Bell className="w-4 h-4 mr-2" />
          Notificaciones
        </TabsTrigger>
        <TabsTrigger value="preferences" className="rounded-xl">
          <Palette className="w-4 h-4 mr-2" />
          Preferencias
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <div className="glass-strong rounded-3xl p-6 space-y-6">
          <h2 className="text-xl font-semibold">Información del Perfil</h2>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
            </div>
          </div>

          <Button className="rounded-2xl">Guardar Cambios</Button>
        </div>

        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Seguridad</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start rounded-2xl bg-transparent">
              <Shield className="w-4 h-4 mr-2" />
              Cambiar Contraseña
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-2xl bg-transparent">
              <Wifi className="w-4 h-4 mr-2" />
              Gestionar Dispositivos Conectados
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Favorites Tab */}
      <TabsContent value="favorites" className="space-y-6">
        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Dispositivos Favoritos</h2>
            <Button className="rounded-2xl">
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Accede rápidamente a tus dispositivos más utilizados desde el dashboard principal.
          </p>

          <div className="space-y-3">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{favorite.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {favorite.room} • {favorite.type}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFavorite(favorite.id)} className="rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Escenas Favoritas</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <Sun className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Buenos Días</span>
            </div>
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <Moon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Buenas Noches</span>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications" className="space-y-6">
        <div className="glass-strong rounded-3xl p-6 space-y-6">
          <h2 className="text-xl font-semibold">Preferencias de Notificaciones</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass rounded-2xl">
              <div className="space-y-1">
                <Label htmlFor="device-status" className="text-base font-medium">
                  Estado de Dispositivos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recibe alertas cuando los dispositivos cambien de estado
                </p>
              </div>
              <Switch
                id="device-status"
                checked={notifications.deviceStatus}
                onCheckedChange={(checked) => setNotifications({ ...notifications, deviceStatus: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 glass rounded-2xl">
              <div className="space-y-1">
                <Label htmlFor="routines" className="text-base font-medium">
                  Rutinas Ejecutadas
                </Label>
                <p className="text-sm text-muted-foreground">Notificaciones cuando se ejecuten rutinas automáticas</p>
              </div>
              <Switch
                id="routines"
                checked={notifications.routines}
                onCheckedChange={(checked) => setNotifications({ ...notifications, routines: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 glass rounded-2xl">
              <div className="space-y-1">
                <Label htmlFor="security" className="text-base font-medium">
                  Alertas de Seguridad
                </Label>
                <p className="text-sm text-muted-foreground">Notificaciones importantes sobre seguridad del hogar</p>
              </div>
              <Switch
                id="security"
                checked={notifications.security}
                onCheckedChange={(checked) => setNotifications({ ...notifications, security: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 glass rounded-2xl">
              <div className="space-y-1">
                <Label htmlFor="updates" className="text-base font-medium">
                  Actualizaciones del Sistema
                </Label>
                <p className="text-sm text-muted-foreground">Información sobre nuevas funciones y actualizaciones</p>
              </div>
              <Switch
                id="updates"
                checked={notifications.updates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Preferences Tab */}
      <TabsContent value="preferences" className="space-y-6">
        <div className="glass-strong rounded-3xl p-6 space-y-6">
          <h2 className="text-xl font-semibold">Apariencia y Comportamiento</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass rounded-2xl">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5" />
                <div className="space-y-1">
                  <Label htmlFor="dark-mode" className="text-base font-medium">
                    Modo Oscuro
                  </Label>
                  <p className="text-sm text-muted-foreground">Interfaz con colores oscuros</p>
                </div>
              </div>
              <Switch
                id="dark-mode"
                checked={preferences.darkMode}
                onCheckedChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 glass rounded-2xl">
              <div className="flex items-center gap-3">
                <Battery className="w-5 h-5" />
                <div className="space-y-1">
                  <Label htmlFor="energy-saving" className="text-base font-medium">
                    Modo Ahorro de Energía
                  </Label>
                  <p className="text-sm text-muted-foreground">Optimiza el consumo de dispositivos</p>
                </div>
              </div>
              <Switch
                id="energy-saving"
                checked={preferences.energySaving}
                onCheckedChange={(checked) => setPreferences({ ...preferences, energySaving: checked })}
              />
            </div>

            <div className="p-4 glass rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5" />
                <Label className="text-base font-medium">Idioma</Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={preferences.language === "es" ? "default" : "outline"}
                  onClick={() => setPreferences({ ...preferences, language: "es" })}
                  className="rounded-xl"
                >
                  Español
                </Button>
                <Button
                  variant={preferences.language === "en" ? "default" : "outline"}
                  onClick={() => setPreferences({ ...preferences, language: "en" })}
                  className="rounded-xl"
                >
                  English
                </Button>
                <Button
                  variant={preferences.language === "fr" ? "default" : "outline"}
                  onClick={() => setPreferences({ ...preferences, language: "fr" })}
                  className="rounded-xl"
                >
                  Français
                </Button>
              </div>
            </div>

            <div className="p-4 glass rounded-2xl space-y-3">
              <Label className="text-base font-medium">Unidad de Temperatura</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={preferences.temperature === "celsius" ? "default" : "outline"}
                  onClick={() => setPreferences({ ...preferences, temperature: "celsius" })}
                  className="rounded-xl"
                >
                  Celsius (°C)
                </Button>
                <Button
                  variant={preferences.temperature === "fahrenheit" ? "default" : "outline"}
                  onClick={() => setPreferences({ ...preferences, temperature: "fahrenheit" })}
                  className="rounded-xl"
                >
                  Fahrenheit (°F)
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Información del Sistema</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Versión de la App</span>
              <Badge variant="secondary" className="rounded-lg">
                v2.1.0
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dispositivos Conectados</span>
              <Badge variant="secondary" className="rounded-lg">
                12 dispositivos
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Última Sincronización</span>
              <span className="text-sm">Hace 2 minutos</span>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
