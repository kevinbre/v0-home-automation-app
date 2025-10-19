# Obtener Refresh Token de Spotify - Método Simple

Si tienes problemas con el Redirect URI, usa este método alternativo.

## Método Rápido (Sin callback)

### Paso 1: Preparar la URL de autorización

Reemplaza `TU_CLIENT_ID` con tu Client ID real:

```
https://accounts.spotify.com/authorize?client_id=TU_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/api/spotify/callback&scope=user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20playlist-read-private%20playlist-read-collaborative%20user-library-read
```

### Paso 2: Autorizar

1. Pega la URL en tu navegador
2. Autoriza la aplicación
3. Serás redirigido a una página que probablemente no cargará (es normal)
4. Copia el **código** de la URL. Se ve así:

```
http://localhost:3000/api/spotify/callback?code=AQDT...muy_largo...xyz
```

Copia solo la parte después de `code=` (hasta antes de `&` si hay más parámetros)

### Paso 3: Obtener el Refresh Token con cURL

Abre tu terminal y ejecuta (reemplaza los valores):

```bash
curl -X POST "https://accounts.spotify.com/api/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "code=TU_CODIGO_AQUI" \
     -d "redirect_uri=http://localhost:3000/api/spotify/callback" \
     -d "client_id=TU_CLIENT_ID" \
     -d "client_secret=TU_CLIENT_SECRET"
```

### Paso 4: Copiar el Refresh Token

La respuesta será algo así:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "AQC...este_es_el_que_necesitas...xyz",
  "scope": "..."
}
```

Copia el valor de `refresh_token` y úsalo en la aplicación.

---

## Método con Postman (Más visual)

### Paso 1: Autorizar (igual que arriba)

Usa la URL de autorización y obtén el `code`

### Paso 2: Usar Postman

1. Abre Postman
2. Crea un nuevo request POST a: `https://accounts.spotify.com/api/token`
3. En "Body", selecciona "x-www-form-urlencoded"
4. Agrega estos campos:

| Key | Value |
|-----|-------|
| grant_type | authorization_code |
| code | TU_CODIGO_AQUI |
| redirect_uri | http://localhost:3000/api/spotify/callback |
| client_id | TU_CLIENT_ID |
| client_secret | TU_CLIENT_SECRET |

5. Envía el request
6. Copia el `refresh_token` de la respuesta

---

## Método con JavaScript en la consola del navegador

Si prefieres no usar terminal:

1. Obtén el código de autorización (pasos anteriores)
2. Abre la consola del navegador (F12)
3. Pega este código (reemplaza los valores):

```javascript
fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: 'TU_CODIGO_AQUI',
    redirect_uri: 'http://localhost:3000/api/spotify/callback',
    client_id: 'TU_CLIENT_ID',
    client_secret: 'TU_CLIENT_SECRET',
  })
})
.then(r => r.json())
.then(data => {
  console.log('Refresh Token:', data.refresh_token)
  // También lo copiamos al portapapeles
  navigator.clipboard.writeText(data.refresh_token)
  alert('Refresh token copiado al portapapeles!')
})
```

---

## Notas importantes

1. El `code` que obtienes **expira en 10 minutos**, úsalo rápido
2. El `refresh_token` **no expira** (úsalo en la app)
3. Si el código expira, repite el proceso de autorización
4. Guarda el `refresh_token` de forma segura

---

## Solución al warning de Redirect URI

Si quieres eliminar el warning en producción:

1. Despliega tu app en HTTPS (ej: Vercel, Netlify)
2. Cambia el redirect URI a: `https://tu-dominio.com/api/spotify/callback`
3. El warning desaparecerá

Para desarrollo local, el warning es **normal y puedes ignorarlo**.
