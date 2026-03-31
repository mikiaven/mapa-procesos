import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Conexión MySQL ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     || process.env.MYSQLHOST,
  port:     parseInt( process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306),
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE,
  user:     process.env.MYSQL_USER     || process.env.MYSQLUSER,
  password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000,
})

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

// ── Auto-inicialización del schema ──────────────────────────────────────────
async function initDatabase() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS procesos (
      id VARCHAR(10) NOT NULL PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      macroproceso VARCHAR(100),
      tipo ENUM('Estratégico','Operacional','Complementario') NOT NULL,
      descripcion TEXT, funcion_arq TEXT, owner VARCHAR(100), area VARCHAR(100),
      equipo TEXT, entradas TEXT, salidas TEXT, proveedores TEXT, clientes TEXT,
      predecesores VARCHAR(300), sucesores JSON, n_alimenta TINYINT DEFAULT 0,
      criticidad TINYINT NOT NULL DEFAULT 1,
      nivel_riesgo ENUM('MUY ALTO','ALTO','MEDIO','BAJO'),
      impacto_fallo TEXT, procesos_bloq VARCHAR(300), tipo_costo VARCHAR(200),
      costo_min INT DEFAULT 0, costo_max INT DEFAULT 0,
      probabilidad ENUM('Alta','Media','Baja'), prioridad TINYINT DEFAULT 3,
      accion_prev TEXT, estado VARCHAR(50) DEFAULT 'Activo',
      aprobacion ENUM('Aprobado','Pendiente de Aprobar','Borrador') DEFAULT 'Borrador',
      aprobador VARCHAR(100), fecha_aprobacion DATE, version_aprobada VARCHAR(20),
      madurez TINYINT DEFAULT 1, frecuencia VARCHAR(80), normativa VARCHAR(300),
      herramientas TEXT, link_procedimiento VARCHAR(600), link_flujograma VARCHAR(600),
      version_doc VARCHAR(20), fecha_revision DATE, fecha_prox_rev DATE,
      resp_revision VARCHAR(100), mejoras TEXT, fecha_mejora DATE,
      estado_mejora VARCHAR(50), observaciones TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

    await query(`CREATE TABLE IF NOT EXISTS kpis (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      proceso_id VARCHAR(10) NOT NULL,
      orden TINYINT NOT NULL DEFAULT 1,
      nombre VARCHAR(250), meta VARCHAR(100), actual VARCHAR(100),
      semaforo ENUM('green','yellow','red') DEFAULT 'green',
      frecuencia_med VARCHAR(80),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_proceso_orden (proceso_id, orden),
      FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

    await query(`CREATE OR REPLACE VIEW v_stats AS
    SELECT 
      COUNT(*) AS total_procesos,
      SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) AS activos,
      AVG(madurez) AS madurez_promedio
    FROM procesos`)

    console.log('✅ Database schema ready')
  } catch (err) {
    console.error('❌ DB init error:', err.message)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseJSON(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}

function buildProcessObject(row, kpis = []) {
  return {
    id: row.id, name: row.nombre, macro: row.macroproceso,
    type: row.tipo === 'Estratégico' ? 'strategic' : row.tipo === 'Operacional' ? 'operational' : 'support',
    description: row.descripcion, owner: row.owner, area: row.area,
    criticality: row.criticidad, risk: row.nivel_riesgo,
    cost_min: row.costo_min, cost_max: row.costo_max,
    probability: row.probabilidad, maturity: row.madurez,
    status: row.estado, approval: row.aprobacion,
    approver: row.aprobador || '',
    approvalDate: row.fecha_aprobacion ? new Date(row.fecha_aprobacion).toLocaleDateString('es-ES') : '',
    approvedVersion: row.version_aprobada || '',
    norm: row.normativa, tools: row.herramientas, freq: row.frecuencia,
    successors: parseJSON(row.sucesores),
    kpis: kpis.map(k => ({ name: k.nombre, meta: k.meta, actual: k.actual, traffic: k.semaforo })),
  }
}

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() })
  } catch (e) {
    res.status(503).json({ status: 'error', message: e.message })
  }
})

app.get('/api/procesos', async (req, res) => {
  try {
    const { tipo, riesgo, aprobacion, q } = req.query
    const typeMap = { strategic:'Estratégico', operational:'Operacional', support:'Complementario' }
    const conditions = [], params = []
    if (tipo && typeMap[tipo]) { conditions.push('p.tipo = ?'); params.push(typeMap[tipo]) }
    if (riesgo) { conditions.push('p.nivel_riesgo = ?'); params.push(riesgo) }
    if (aprobacion) { conditions.push('p.aprobacion = ?'); params.push(aprobacion) }
    if (q) { conditions.push('(p.id LIKE ? OR p.nombre LIKE ?)'); params.push(`%${q}%`, `%${q}%`) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const procesos = await query(`SELECT p.* FROM procesos p ${where} ORDER BY p.tipo, p.id`, params)
    if (!procesos.length) return res.json([])
    const ids = procesos.map(p => p.id)
    const placeholders = ids.map(() => '?').join(',')
    const kpis = await query(`SELECT * FROM kpis WHERE proceso_id IN (${placeholders}) ORDER BY proceso_id, orden`, ids)
    const kpiMap = {}
    kpis.forEach(k => { if (!kpiMap[k.proceso_id]) kpiMap[k.proceso_id] = []; kpiMap[k.proceso_id].push(k) })
    res.json(procesos.map(p => buildProcessObject(p, kpiMap[p.id] || [])))
  } catch (e) {
    console.error('/api/procesos error:', e)
    res.status(500).json({ error: e.message })
  }
})

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

app.get('/api/stats', async (req, res) => {
  try {
    const [stats] = await query('SELECT * FROM v_stats')
    const [redKpis] = await query(`SELECT COUNT(*) AS total FROM kpis WHERE semaforo = 'red'`)
    res.json({ ...stats, kpis_criticos: redKpis.total })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Frontend React ───────────────────────────────────────────────────────────
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) res.sendFile(join(distPath, 'index.html'))
  })
}

// ── Start ────────────────────────────────────────────────────────────────────
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Process Intelligence API corriendo en puerto ${PORT}`)
    console.log(`   DB: ${process.env.MYSQL_HOST || process.env.MYSQLHOST}:${process.env.MYSQL_PORT || process.env.MYSQLPORT}`)
  })
})
