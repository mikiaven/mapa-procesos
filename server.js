import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3001

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Conexión MySQL ────────────────────────────────────────────────────────────
// Railway inyecta variables MYSQL_* automáticamente en el servicio
const pool = mysql.createPool({
  host:               process.env.MYSQL_HOST     || process.env.MYSQLHOST,
  port:    parseInt(  process.env.MYSQL_PORT     || process.env.MYSQLPORT || 3306),
  database:           process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE,
  user:               process.env.MYSQL_USER     || process.env.MYSQLUSER,
  password:           process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     20000,
})

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseJSON(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}

function buildProcessObject(row, kpis = []) {
  return {
    id:          row.id,
    name:        row.nombre,
    macro:       row.macroproceso,
    type:        row.tipo === 'Estratégico'    ? 'strategic'
               : row.tipo === 'Operacional'    ? 'operational'
               : 'support',
    description: row.descripcion,
    owner:       row.owner,
    area:        row.area,
    criticality: row.criticidad,
    risk:        row.nivel_riesgo,
    cost_min:    row.costo_min,
    cost_max:    row.costo_max,
    probability: row.probabilidad,
    maturity:    row.madurez,
    status:      row.estado,
    approval:    row.aprobacion,
    approver:    row.aprobador    || '',
    approvalDate:row.fecha_aprobacion
                   ? new Date(row.fecha_aprobacion).toLocaleDateString('es-ES') : '',
    approvedVersion: row.version_aprobada || '',
    norm:        row.normativa,
    tools:       row.herramientas,
    freq:        row.frecuencia,
    successors:  parseJSON(row.sucesores),
    kpis:        kpis.map(k => ({
      name:    k.nombre,
      meta:    k.meta,
      actual:  k.actual,
      traffic: k.semaforo,
    })),
  }
}

// ── API ROUTES ────────────────────────────────────────────────────────────────

// GET /api/health
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() })
  } catch (e) {
    res.status(503).json({ status: 'error', message: e.message })
  }
})

// GET /api/procesos  — lista con filtros opcionales
// ?tipo=strategic&riesgo=MUY+ALTO&aprobacion=Borrador&q=produccion
app.get('/api/procesos', async (req, res) => {
  try {
    const { tipo, riesgo, aprobacion, q } = req.query

    const typeMap = { strategic:'Estratégico', operational:'Operacional', support:'Complementario' }
    const conditions = []
    const params     = []

    if (tipo && typeMap[tipo])    { conditions.push('p.tipo = ?');        params.push(typeMap[tipo]) }
    if (riesgo)                   { conditions.push('p.nivel_riesgo = ?');params.push(riesgo) }
    if (aprobacion)               { conditions.push('p.aprobacion = ?');  params.push(aprobacion) }
    if (q)                        { conditions.push('(p.id LIKE ? OR p.nombre LIKE ?)'); params.push(`%${q}%`, `%${q}%`) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const procesos = await query(
      `SELECT p.* FROM procesos p ${where} ORDER BY p.tipo, p.id`,
      params
    )

    if (!procesos.length) return res.json([])

    // Traer todos los KPIs en una sola query
    const ids = procesos.map(p => p.id)
    const placeholders = ids.map(() => '?').join(',')
    const kpis = await query(
      `SELECT * FROM kpis WHERE proceso_id IN (${placeholders}) ORDER BY proceso_id, orden`,
      ids
    )
    const kpiMap = {}
    kpis.forEach(k => {
      if (!kpiMap[k.proceso_id]) kpiMap[k.proceso_id] = []
      kpiMap[k.proceso_id].push(k)
    })

    res.json(procesos.map(p => buildProcessObject(p, kpiMap[p.id] || [])))
  } catch (e) {
    console.error('/api/procesos error:', e)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/procesos/:id
app.get('/api/procesos/:id', async (req, res) => {
  try {
    const [row] = await query('SELECT * FROM procesos WHERE id = ?', [req.params.id])
    if (!row) return res.status(404).json({ error: 'Proceso no encontrado' })
    const kpis = await query('SELECT * FROM kpis WHERE proceso_id = ? ORDER BY orden', [req.params.id])
    res.json(buildProcessObject(row, kpis))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/stats  — datos para el dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const [stats] = await query('SELECT * FROM v_stats')
    const [redKpis] = await query(
      `SELECT COUNT(*) AS total FROM kpis WHERE semaforo = 'red'`
    )
    res.json({ ...stats, kpis_criticos: redKpis.total })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Servir el frontend React (producción) ─────────────────────────────────────
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'))
    }
  })
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Process Intelligence API corriendo en puerto ${PORT}`)
  console.log(`   DB: ${process.env.MYSQL_HOST || process.env.MYSQLHOST}:${process.env.MYSQL_PORT || process.env.MYSQLPORT}`)
})
