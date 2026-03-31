-- ============================================================
-- SCHEMA: mapa_procesos
-- Ejecutar una vez al crear la base de datos en Railway
-- ============================================================

CREATE DATABASE IF NOT EXISTS mapa_procesos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mapa_procesos;

-- ── Tabla principal de procesos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procesos (
  id                VARCHAR(10)  NOT NULL PRIMARY KEY,
  nombre            VARCHAR(200) NOT NULL,
  macroproceso      VARCHAR(100),
  tipo              ENUM('Estratégico','Operacional','Complementario') NOT NULL,
  descripcion       TEXT,
  funcion_arq       TEXT,
  owner             VARCHAR(100),
  area              VARCHAR(100),
  equipo            TEXT,
  entradas          TEXT,
  salidas           TEXT,
  proveedores       TEXT,
  clientes          TEXT,
  predecesores      VARCHAR(300),
  sucesores         JSON,
  n_alimenta        TINYINT      DEFAULT 0,
  -- Riesgo
  criticidad        TINYINT      NOT NULL DEFAULT 1,
  nivel_riesgo      ENUM('MUY ALTO','ALTO','MEDIO','BAJO'),
  impacto_fallo     TEXT,
  procesos_bloq     VARCHAR(300),
  tipo_costo        VARCHAR(200),
  costo_min         INT          DEFAULT 0,
  costo_max         INT          DEFAULT 0,
  probabilidad      ENUM('Alta','Media','Baja'),
  prioridad         TINYINT      DEFAULT 3,
  accion_prev       TEXT,
  -- Gestión
  estado            VARCHAR(50)  DEFAULT 'Activo',
  aprobacion        ENUM('Aprobado','Pendiente de Aprobar','Borrador') DEFAULT 'Borrador',
  aprobador         VARCHAR(100),
  fecha_aprobacion  DATE,
  version_aprobada  VARCHAR(20),
  madurez           TINYINT      DEFAULT 1,
  frecuencia        VARCHAR(80),
  normativa         VARCHAR(300),
  herramientas      TEXT,
  -- Documentación
  link_procedimiento VARCHAR(600),
  link_flujograma   VARCHAR(600),
  version_doc       VARCHAR(20),
  fecha_revision    DATE,
  fecha_prox_rev    DATE,
  resp_revision     VARCHAR(100),
  -- Mejora continua
  mejoras           TEXT,
  fecha_mejora      DATE,
  estado_mejora     VARCHAR(50),
  observaciones     TEXT,
  -- Metadata
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── KPIs (hasta 3 por proceso) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kpis (
  id                INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  proceso_id        VARCHAR(10)  NOT NULL,
  orden             TINYINT      NOT NULL DEFAULT 1,
  nombre            VARCHAR(250),
  meta              VARCHAR(100),
  actual            VARCHAR(100),
  semaforo          ENUM('green','yellow','red') DEFAULT 'green',
  frecuencia_med    VARCHAR(80),
  updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_proceso_orden (proceso_id, orden),
  FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Índices útiles para filtros frecuentes ────────────────────────────────────
CREATE INDEX idx_tipo        ON procesos(tipo);
CREATE INDEX idx_riesgo      ON procesos(nivel_riesgo);
CREATE INDEX idx_aprobacion  ON procesos(aprobacion);
CREATE INDEX idx_criticidad  ON procesos(criticidad);
CREATE INDEX idx_updated     ON procesos(updated_at);

-- ── Vista útil para el dashboard ──────────────────────────────────────────────
CREATE OR REPLACE VIEW v_stats AS
SELECT
  COUNT(*)                                                    AS total_procesos,
  SUM(nivel_riesgo = 'MUY ALTO')                             AS riesgo_muy_alto,
  SUM(nivel_riesgo = 'ALTO')                                 AS riesgo_alto,
  SUM(nivel_riesgo = 'MEDIO')                                AS riesgo_medio,
  SUM(nivel_riesgo = 'BAJO')                                 AS riesgo_bajo,
  SUM(aprobacion = 'Aprobado')                               AS aprobados,
  SUM(aprobacion = 'Pendiente de Aprobar')                   AS pendientes,
  SUM(aprobacion = 'Borrador')                               AS borrador,
  SUM(criticidad >= 4)                                       AS alta_criticidad,
  ROUND(SUM(aprobacion = 'Aprobado') / COUNT(*) * 100, 1)   AS pct_aprobados
FROM procesos;
