# Process Intelligence — Guía de Despliegue en Railway

## Estructura del proyecto

```
mapa-procesos/
├── src/
│   ├── App.jsx          ← Aplicación React completa
│   ├── api.js           ← Llamadas a la API
│   └── main.jsx         ← Entry point React
├── server.js            ← API Express + sirve el frontend
├── schema.sql           ← Estructura de la base de datos
├── n8n_workflow.json    ← Flujo N8N importable
├── package.json
├── vite.config.js
├── railway.toml
└── .env.example
```

---

## PASO 1 — Crear cuenta y proyecto en Railway

1. Ir a **https://railway.app** → Sign up con GitHub
2. Click **New Project**
3. Elegir **Empty Project**

---

## PASO 2 — Crear el servicio MySQL

1. Dentro del proyecto → **+ Add Service** → **Database** → **MySQL**
2. Railway crea la BD automáticamente y genera variables de entorno:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`
3. Click en el servicio MySQL → **Connect** → copiar la **Public URL** (para conectarse desde fuera)
4. Usando cualquier cliente MySQL (TablePlus, DBeaver, MySQL Workbench):
   - Conectarse con las credenciales de Railway
   - Ejecutar el contenido completo de `schema.sql`

---

## PASO 3 — Subir el código a GitHub

```bash
# En tu máquina local, dentro de la carpeta mapa-procesos:
git init
git add .
git commit -m "Initial commit - Process Intelligence"
git branch -M main

# Crear repo en GitHub (github.com/new) y luego:
git remote add origin https://github.com/TU_USUARIO/mapa-procesos.git
git push -u origin main
```

---

## PASO 4 — Crear el servicio web en Railway

1. En Railway → **+ Add Service** → **GitHub Repo**
2. Seleccionar el repositorio `mapa-procesos`
3. Railway detecta el `railway.toml` automáticamente
4. En **Settings** del servicio → **Variables** → agregar:
   ```
   NODE_ENV=production
   PORT=3001
   ```
   > Las variables MYSQL_* se conectan automáticamente desde el servicio MySQL de Railway.
   > En Settings → "Link" el servicio MySQL al servicio web para que las variables se inyecten solas.

5. En **Settings** → **Networking** → **Generate Domain** para obtener una URL pública

---

## PASO 5 — Verificar el despliegue

Una vez que Railway termine el build (~2-3 min):

1. Abrir la URL generada → debería aparecer la app (con datos vacíos hasta que N8N sincronice)
2. Verificar la API: `https://TU_URL.railway.app/api/health`
   Respuesta esperada: `{ "status": "ok", "db": "connected" }`

---

## PASO 6 — Configurar N8N

### Si ya tenés N8N corriendo:
1. N8N → **Workflows** → **Import from file** → seleccionar `n8n_workflow.json`

### Si no tenés N8N:
Opciones gratuitas/baratas:
- **N8N Cloud**: https://n8n.io → plan gratuito (5 workflows activos)
- **Railway** (mismo proyecto): + Add Service → Docker → imagen `n8nio/n8n`
- **Self-hosted**: en cualquier VPS con Docker

### Configurar credenciales en N8N:

**Credencial MySQL:**
- Credentials → New → MySQL
- Host: el MYSQLHOST de Railway (host público)
- Port: MYSQLPORT
- Database: MYSQLDATABASE
- User: MYSQLUSER
- Password: MYSQLPASSWORD

**Credencial Microsoft 365 (OneDrive):**
1. Ir a https://portal.azure.com → App registrations → New registration
2. Nombre: `N8N Process Intelligence`
3. Redirect URI: `https://TU_N8N_URL/rest/oauth2-credential/callback`
4. API permissions → Add → Microsoft Graph → `Files.Read`, `Files.ReadAll`
5. Certificates & secrets → New client secret → copiar el valor
6. En N8N → Credentials → New → Microsoft OAuth2 API
   - Client ID: Application (client) ID de Azure
   - Client Secret: el secreto creado
7. En el workflow, abrir el nodo **Descargar Excel de OneDrive** → seleccionar la credencial

**Variable de entorno en N8N:**
- N8N → Settings → Variables → Agregar:
  - `ONEDRIVE_FILE_PATH` = ruta relativa al Excel en OneDrive
  - Ejemplo: `Documentos/Procesos/Tabla_Maestra_Procesos.xlsx`

---

## PASO 7 — Primera sincronización

1. En N8N → abrir el workflow → click **Test workflow** (ejecuta manualmente)
2. Verificar que los logs muestren `✅ Sincronización completada`
3. Refrescar la app en Railway → deberían aparecer los datos del Excel
4. Activar el workflow (toggle ON) → se ejecutará cada 6 horas automáticamente

---

## Flujo completo de actualización

```
Gestor actualiza Excel en OneDrive
           ↓
    (cada 6 horas)
           ↓
    N8N descarga el Excel
           ↓
    N8N transforma los datos
           ↓
    N8N hace UPSERT en MySQL Railway
           ↓
    La app React lee los datos actualizados
```

---

## Variables de entorno Railway — Referencia

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NODE_ENV` | Entorno | `production` |
| `PORT` | Puerto Express | `3001` |
| `MYSQLHOST` | Auto-inyectada por Railway | - |
| `MYSQLPORT` | Auto-inyectada por Railway | - |
| `MYSQLDATABASE` | Auto-inyectada por Railway | - |
| `MYSQLUSER` | Auto-inyectada por Railway | - |
| `MYSQLPASSWORD` | Auto-inyectada por Railway | - |

---

## Costos estimados

| Servicio | Plan | Costo |
|---|---|---|
| Railway (web + MySQL) | Hobby | ~$5/mes |
| N8N Cloud | Free | $0 (hasta 5 workflows) |
| GitHub | Free | $0 |
| **Total** | | **~$5/mes** |

---

## Comandos útiles para desarrollo local

```bash
# Instalar dependencias
npm install

# Desarrollo frontend (con proxy a API)
npm run dev

# En otra terminal: servidor API
node server.js

# Build de producción
npm run build

# Inicializar BD local (requiere MySQL local)
npm run db:init
```

---

## Soporte

Para problemas de conexión con Railway, revisar:
- `https://TU_URL.railway.app/api/health` → estado de la BD
- Logs del servicio en Railway → pestaña **Deployments** → **View Logs**
