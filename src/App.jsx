import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { api } from './api.js'

// ─── THEME SYSTEM ─────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    id:'dark', pageBg:'#080e1a', headerBg:'rgba(8,14,26,0.96)', headerBorder:'rgba(59,130,246,0.18)',
    toolbarBg:'rgba(8,14,26,0.82)', toolbarBorder:'rgba(255,255,255,0.05)',
    surfaceBg:'rgba(255,255,255,0.025)', surfaceBorder:'rgba(255,255,255,0.07)',
    cardAlt:'rgba(255,255,255,0.012)', panelBg:'#0d1525', panelShadow:'none',
    inputBg:'rgba(255,255,255,0.05)', inputBorder:'rgba(255,255,255,0.10)',
    gridLine:'rgba(59,130,246,0.04)', scrollThumb:'rgba(255,255,255,0.12)',
    text:'#e2e8f0', textBright:'#f1f5f9', textMuted:'#94a3b8', textDim:'#475569', textFaint:'#334155',
    divider:'rgba(255,255,255,0.06)', hoverRow:'rgba(59,130,246,0.07)',
    statBg:'rgba(255,255,255,0.04)', statBorder:'rgba(255,255,255,0.07)',
    barTrack:'rgba(255,255,255,0.06)', sectionLine:'rgba(255,255,255,0.06)',
    docLinkBg:'rgba(99,102,241,0.10)', docLinkBorder:'rgba(99,102,241,0.30)', docLinkColor:'#818cf8',
    overlayBg:'rgba(0,0,0,0.62)', headerShadow:'none', cardShadow:'none',
    riskBg:(c)=>`${c}0a`, riskBorder:(c)=>`${c}2e`,
    btnActive:()=>'rgba(255,255,255,0.07)',
    type:{
      strategic:  {bg:'#1e3a5f',border:'#3b82f6',accent:'#60a5fa',layerBg:'rgba(30,58,95,0.28)',layerBorder:'rgba(59,130,246,0.18)'},
      operational:{bg:'#1a3a2a',border:'#22c55e',accent:'#4ade80',layerBg:'rgba(26,58,42,0.28)',layerBorder:'rgba(34,197,94,0.18)'},
      support:    {bg:'#2d2a1e',border:'#f59e0b',accent:'#fbbf24',layerBg:'rgba(45,42,30,0.28)',layerBorder:'rgba(245,158,11,0.18)'},
    },
    flowBg:(cfg)=>`${cfg.bg}55`, flowBgActive:(cfg)=>cfg.bg, flowBgConn:(cfg)=>`${cfg.bg}bb`,
    apv:{'Aprobado':{bg:'rgba(34,197,94,0.12)',border:'rgba(34,197,94,0.30)',text:'#4ade80'},'Pendiente de Aprobar':{bg:'rgba(249,115,22,0.12)',border:'rgba(249,115,22,0.30)',text:'#fb923c'},'Borrador':{bg:'rgba(148,163,184,0.10)',border:'rgba(148,163,184,0.22)',text:'#94a3b8'}},
  },
  light: {
    id:'light', pageBg:'#eef2f7', headerBg:'rgba(255,255,255,0.98)', headerBorder:'rgba(59,130,246,0.15)',
    toolbarBg:'rgba(248,250,252,0.98)', toolbarBorder:'rgba(0,0,0,0.07)',
    surfaceBg:'#ffffff', surfaceBorder:'rgba(0,0,0,0.08)',
    cardAlt:'rgba(0,0,0,0.020)', panelBg:'#ffffff', panelShadow:'-6px 0 32px rgba(0,0,0,0.12)',
    inputBg:'rgba(0,0,0,0.045)', inputBorder:'rgba(0,0,0,0.13)',
    gridLine:'rgba(99,130,200,0.07)', scrollThumb:'rgba(0,0,0,0.15)',
    text:'#1e293b', textBright:'#0f172a', textMuted:'#475569', textDim:'#64748b', textFaint:'#94a3b8',
    divider:'rgba(0,0,0,0.07)', hoverRow:'rgba(59,130,246,0.055)',
    statBg:'rgba(0,0,0,0.035)', statBorder:'rgba(0,0,0,0.08)',
    barTrack:'rgba(0,0,0,0.07)', sectionLine:'rgba(0,0,0,0.07)',
    docLinkBg:'rgba(99,102,241,0.08)', docLinkBorder:'rgba(99,102,241,0.28)', docLinkColor:'#4338ca',
    overlayBg:'rgba(15,23,42,0.40)', headerShadow:'0 1px 8px rgba(0,0,0,0.07)', cardShadow:'0 1px 5px rgba(0,0,0,0.06)',
    riskBg:(c)=>`${c}0d`, riskBorder:(c)=>`${c}2a`,
    btnActive:()=>'rgba(0,0,0,0.055)',
    type:{
      strategic:  {bg:'#dbeafe',border:'#3b82f6',accent:'#1d4ed8',layerBg:'rgba(219,234,254,0.60)',layerBorder:'rgba(59,130,246,0.22)'},
      operational:{bg:'#dcfce7',border:'#16a34a',accent:'#15803d',layerBg:'rgba(220,252,231,0.60)',layerBorder:'rgba(22,163,74,0.22)'},
      support:    {bg:'#fef3c7',border:'#d97706',accent:'#92400e',layerBg:'rgba(254,243,199,0.60)',layerBorder:'rgba(217,119,6,0.22)'},
    },
    flowBg:(cfg)=>`${cfg.bg}cc`, flowBgActive:(cfg)=>cfg.bg, flowBgConn:(cfg)=>cfg.bg,
    apv:{'Aprobado':{bg:'rgba(22,163,74,0.10)',border:'rgba(22,163,74,0.28)',text:'#15803d'},'Pendiente de Aprobar':{bg:'rgba(234,88,12,0.10)',border:'rgba(234,88,12,0.28)',text:'#c2410c'},'Borrador':{bg:'rgba(100,116,139,0.10)',border:'rgba(100,116,139,0.22)',text:'#475569'}},
  },
}

const RISK_COLOR = {'MUY ALTO':'#ef4444','ALTO':'#f97316','MEDIO':'#eab308','BAJO':'#22c55e'}
const TRAFFIC_COLOR = {green:'#22c55e',yellow:'#eab308',red:'#ef4444'}
const TYPE_LABEL = {strategic:'Estratégico',operational:'Operacional',support:'Complementario'}
const TYPE_ICON  = {strategic:'◆',operational:'⬡',support:'●'}
const APPROVAL   = {'Aprobado':{icon:'✓',label:'Aprobado',short:'APR'},'Pendiente de Aprobar':{icon:'⏳',label:'Pendiente de Aprobar',short:'PND'},'Borrador':{icon:'✏',label:'Borrador',short:'BOR'}}

const Ctx = createContext(THEMES.dark)
const useT = () => useContext(Ctx)

// ─── LOADING / ERROR ──────────────────────────────────────────────────────────
function Spinner() {
  const t = useT()
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:16}}>
      <div style={{width:40,height:40,border:`3px solid ${t.surfaceBorder}`,borderTop:`3px solid #3b82f6`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <span style={{color:t.textDim,fontSize:13}}>Cargando procesos…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  const t = useT()
  return (
    <div style={{margin:24,padding:'20px 24px',background:'rgba(239,68,68,0.10)',border:'1px solid rgba(239,68,68,0.30)',borderRadius:10,display:'flex',alignItems:'center',gap:16}}>
      <span style={{fontSize:24}}>⚠</span>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,color:'#ef4444',marginBottom:4}}>No se pudo conectar con la API</div>
        <div style={{fontSize:12,color:t.textMuted}}>{message}</div>
      </div>
      <button onClick={onRetry} style={{padding:'8px 16px',borderRadius:6,background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.40)',color:'#ef4444',cursor:'pointer',fontWeight:600,fontSize:12}}>Reintentar</button>
    </div>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark,    setIsDark]    = useState(true)
  const [view,      setView]      = useState('map')
  const [processes, setProcesses] = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [filterType,     setFilterType]     = useState('all')
  const [filterRisk,     setFilterRisk]     = useState('all')
  const [filterApproval, setFilterApproval] = useState('all')
  const [showDraft,      setShowDraft]      = useState(true)
  const [searchQ,        setSearchQ]        = useState('')

  const theme = isDark ? THEMES.dark : THEMES.light

  const loadData = async () => {
    setLoading(true); setError(null)
    try {
      const [procs, st] = await Promise.all([api.getProcesses(), api.getStats()])
      setProcesses(procs)
      setStats(st)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const openDetail  = (p) => { setSelected(p); setPanelOpen(true) }
  const closeDetail = () => setPanelOpen(false)

  const filtered = processes.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false
    if (filterRisk !== 'all' && p.risk !== filterRisk) return false
    if (filterApproval !== 'all' && p.approval !== filterApproval) return false
    if (!showDraft && p.approval === 'Borrador') return false
    if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase()) && !p.id.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const apvStats = {
    aprobado:  processes.filter(p => p.approval === 'Aprobado').length,
    pendiente: processes.filter(p => p.approval === 'Pendiente de Aprobar').length,
    borrador:  processes.filter(p => p.approval === 'Borrador').length,
  }

  return (
    <Ctx.Provider value={theme}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box} body{margin:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${theme.scrollThumb};border-radius:3px}
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:${theme.textFaint}}
      `}</style>

      <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:theme.pageBg,minHeight:'100vh',color:theme.text,position:'relative',transition:'background .28s,color .28s'}}>
        <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:`linear-gradient(${theme.gridLine} 1px,transparent 1px),linear-gradient(90deg,${theme.gridLine} 1px,transparent 1px)`,backgroundSize:'40px 40px'}}/>

        {/* HEADER */}
        <header style={{position:'relative',zIndex:10,borderBottom:`1px solid ${theme.headerBorder}`,background:theme.headerBg,backdropFilter:'blur(14px)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:60,boxShadow:theme.headerShadow,transition:'background .28s'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:32,height:32,background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,boxShadow:'0 2px 10px #3b82f640'}}>⬡</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,letterSpacing:'.05em',color:theme.textBright}}>PROCESS INTELLIGENCE</div>
              <div style={{fontSize:9,letterSpacing:'.15em',color:theme.textDim,textTransform:'uppercase'}}>Arquitectura de Procesos · v1.0</div>
            </div>
          </div>

          <nav style={{display:'flex',gap:2}}>
            {[{id:'map',l:'Mapa',i:'⬡'},{id:'risk',l:'Riesgo & Costo',i:'◈'},{id:'kpis',l:'KPIs',i:'◉'},{id:'flow',l:'Flujo',i:'⇢'},{id:'approval',l:'Aprobaciones',i:'✓'},{id:'canvas',l:'Lienzo',i:'⬦'}].map(v=>(
              <button key={v.id} onClick={()=>setView(v.id)} style={{padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,letterSpacing:'.04em',transition:'all .18s',background:view===v.id?theme.btnActive():'transparent',color:view===v.id?'#3b82f6':theme.textDim,borderBottom:view===v.id?'2px solid #3b82f6':'2px solid transparent',outline:'none'}}>
                <span style={{marginRight:4}}>{v.i}</span>{v.l}
              </button>
            ))}
          </nav>

          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {stats && [
              {l:'✓ Aprobados',v:stats.aprobados||apvStats.aprobado,c:'#22c55e',a:'Aprobado'},
              {l:'⏳ Pendientes',v:stats.pendientes||apvStats.pendiente,c:'#f97316',a:'Pendiente de Aprobar'},
              {l:'✏ Borrador',v:stats.borrador||apvStats.borrador,c:'#94a3b8',a:'Borrador'},
            ].map(s=>(
              <div key={s.l} onClick={()=>{setFilterApproval(s.a);setView('approval')}} style={{textAlign:'center',padding:'3px 10px',background:theme.statBg,borderRadius:6,border:`1px solid ${theme.statBorder}`,cursor:'pointer',transition:'all .2s'}}>
                <div style={{fontSize:15,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:8,color:theme.textDim,letterSpacing:'.08em',whiteSpace:'nowrap'}}>{s.l}</div>
              </div>
            ))}
            <div style={{width:1,height:24,background:theme.divider,margin:'0 2px'}}/>
            {/* Theme toggle */}
            <button onClick={()=>setIsDark(d=>!d)} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 14px',borderRadius:20,cursor:'pointer',border:`1px solid ${isDark?'rgba(255,255,255,0.13)':'rgba(0,0,0,0.13)'}`,background:'transparent',color:theme.textMuted,fontSize:12,fontWeight:600,outline:'none',transition:'all .2s'}}>
              <span style={{display:'inline-flex',alignItems:'center',justifyContent:isDark?'flex-end':'flex-start',width:34,height:18,borderRadius:9,padding:2,background:isDark?'rgba(59,130,246,0.35)':'rgba(0,0,0,0.12)',border:`1px solid ${isDark?'rgba(59,130,246,0.50)':'rgba(0,0,0,0.15)'}`,transition:'all .3s'}}>
                <span style={{width:14,height:14,borderRadius:'50%',background:isDark?'#60a5fa':'#64748b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,transition:'all .3s'}}>{isDark?'☽':'☀'}</span>
              </span>
              <span>{isDark?'Oscuro':'Claro'}</span>
            </button>
            {/* Refresh */}
            <button onClick={loadData} title="Recargar datos" style={{padding:'6px 10px',borderRadius:6,border:`1px solid ${theme.statBorder}`,background:theme.statBg,color:theme.textDim,cursor:'pointer',fontSize:14,outline:'none',transition:'all .2s'}}>↻</button>
          </div>
        </header>

        {/* TOOLBAR */}
        <div style={{position:'relative',zIndex:9,padding:'9px 24px',display:'flex',gap:7,alignItems:'center',flexWrap:'wrap',borderBottom:`1px solid ${theme.toolbarBorder}`,background:theme.toolbarBg,transition:'background .28s'}}>
          <div style={{position:'relative',flex:'1 1 180px',maxWidth:260}}>
            <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:theme.textDim,fontSize:13,pointerEvents:'none'}}>⌕</span>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Buscar proceso…" style={{width:'100%',background:theme.inputBg,border:`1px solid ${theme.inputBorder}`,borderRadius:6,padding:'6px 9px 6px 27px',color:theme.text,fontSize:12,outline:'none',transition:'all .28s'}}/>
          </div>
          {[{l:'Todos',v:'all',c:theme.textMuted},{l:'◆ Estratégicos',v:'strategic',c:'#3b82f6'},{l:'⬡ Operacionales',v:'operational',c:isDark?'#4ade80':'#16a34a'},{l:'● Complementarios',v:'support',c:isDark?'#fbbf24':'#d97706'}].map(f=>(
            <Pill key={f.v} label={f.l} active={filterType===f.v} color={f.c} onClick={()=>setFilterType(f.v)}/>
          ))}
          <Sep/>{['all','MUY ALTO','ALTO','MEDIO','BAJO'].map(r=>(
            <Pill key={r} label={r==='all'?'Riesgo: Todos':r} active={filterRisk===r} color={RISK_COLOR[r]||theme.textMuted} onClick={()=>setFilterRisk(r)}/>
          ))}
          <Sep/>{[{l:'✓ Todos',v:'all',c:theme.textMuted},{l:'✓ Aprobados',v:'Aprobado',c:'#22c55e'},{l:'⏳ Pendientes',v:'Pendiente de Aprobar',c:'#f97316'},{l:'✏ Borrador',v:'Borrador',c:'#94a3b8'}].map(f=>(
            <Pill key={f.v} label={f.l} active={filterApproval===f.v} color={f.c} onClick={()=>setFilterApproval(f.v)}/>
          ))}
          <Sep/>
          <button onClick={()=>setShowDraft(d=>!d)} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 11px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,border:`1px solid ${showDraft?theme.inputBorder:'#ef444440'}`,background:showDraft?'transparent':'rgba(239,68,68,0.08)',color:showDraft?theme.textDim:'#ef4444',transition:'all .15s',outline:'none'}}>
            {showDraft?'👁 Ocultar borradores':'🚫 Borradores ocultos'}
          </button>
        </div>

        {!showDraft&&(
          <div style={{background:'rgba(249,115,22,0.10)',borderBottom:'1px solid rgba(249,115,22,0.20)',padding:'6px 24px',fontSize:11,color:'#f97316',display:'flex',alignItems:'center',gap:8,position:'relative',zIndex:8}}>
            <span style={{fontSize:13}}>⚠</span>
            <span>Se están ocultando <strong>{apvStats.borrador} procesos en Borrador</strong>. Siguen siendo válidos operativamente.</span>
            <button onClick={()=>setShowDraft(true)} style={{marginLeft:'auto',fontSize:11,padding:'2px 10px',borderRadius:4,border:'1px solid #f97316',background:'transparent',color:'#f97316',cursor:'pointer',fontWeight:600}}>Mostrar todos</button>
          </div>
        )}

        <main style={{position:'relative',zIndex:5,padding:24}} key={view}>
          {loading && <Spinner/>}
          {error   && <ErrorBanner message={error} onRetry={loadData}/>}
          {!loading && !error && (
            <div style={{animation:'fadeUp .28s ease'}}>
              {view==='map'      && <MapView      processes={filtered} allProcesses={processes} onSelect={openDetail}/>}
              {view==='risk'     && <RiskView     processes={filtered} onSelect={openDetail}/>}
              {view==='kpis'     && <KPIView      processes={filtered} onSelect={openDetail}/>}
              {view==='flow'     && <FlowView     processes={filtered} allProcesses={processes} onSelect={openDetail}/>}
              {view==='approval' && <ApprovalView processes={filtered} allProcesses={processes} onSelect={openDetail}/>}
              {view==='canvas'   && <CanvasView   processes={filtered} allProcesses={processes} onSelect={openDetail}/>}
            </div>
          )}
        </main>

        {panelOpen && selected && <DetailPanel process={selected} allProcesses={processes} onClose={closeDetail}/>}
      </div>
    </Ctx.Provider>
  )
}

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function Pill({label,active,color,onClick}) {
  const t=useT()
  return <button onClick={onClick} style={{padding:'5px 11px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,border:`1px solid ${active?color:t.inputBorder}`,background:active?t.btnActive():'transparent',color:active?color:t.textDim,transition:'all .15s',outline:'none'}}>{label}</button>
}
function Sep() {
  const t=useT(); return <div style={{width:1,height:18,background:t.divider}}/>
}
function Card({title,children}) {
  const t=useT()
  return <div style={{background:t.surfaceBg,border:`1px solid ${t.surfaceBorder}`,borderRadius:12,overflow:'hidden',transition:'all .28s',boxShadow:t.cardShadow}}><div style={{padding:'11px 16px',borderBottom:`1px solid ${t.surfaceBorder}`,fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:'.1em',textTransform:'uppercase'}}>{title}</div><div style={{padding:16}}>{children}</div></div>
}
function Sec({title,icon,children}) {
  const t=useT()
  return <div><div style={{fontSize:9,fontWeight:700,color:t.textDim,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><span>{icon}</span>{title}<div style={{flex:1,height:1,background:t.sectionLine,marginLeft:4}}/></div>{children}</div>
}
function IRow({label,val}) {
  const t=useT()
  return <div style={{display:'flex',gap:8,marginBottom:5,alignItems:'flex-start'}}><span style={{fontSize:9,color:t.textDim,minWidth:90,fontWeight:600}}>{label}</span><span style={{fontSize:10,color:t.textMuted}}>{val}</span></div>
}
function Badge({label,color}) {
  return <span style={{fontSize:9,padding:'2px 8px',borderRadius:12,border:`1px solid ${color}35`,color,background:`${color}0e`,fontWeight:600}}>{label}</span>
}
function Dots({val}) {
  return <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:4,height:4,borderRadius:1,background:i<=val?(val>=4?'#ef4444':val>=3?'#f97316':'#22c55e'):'rgba(128,128,128,0.18)'}}/>)}</div>
}
function ApvChip({approval,small}) {
  const t=useT(); const ap=APPROVAL[approval]; const ts=t.apv[approval]
  if(!ap||!ts) return null
  return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:small?7:8,fontWeight:700,padding:'2px 6px',borderRadius:10,background:ts.bg,border:`1px solid ${ts.border}`,color:ts.text,whiteSpace:'nowrap'}}>{ap.icon} {small?ap.short:ap.label}</span>
}

// ─── MAP VIEW ─────────────────────────────────────────────────────────────────
function MapView({processes,onSelect}) {
  const t=useT()
  const g={s:processes.filter(p=>p.type==='strategic'),o:processes.filter(p=>p.type==='operational'),c:processes.filter(p=>p.type==='support')}
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'stretch',gap:14}}>
        <SideLabel text="REQUISITOS DE LAS PARTES INTERESADAS"/>
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:12}}>
          <Layer type="strategic"   label="PROCESOS ESTRATÉGICOS"    sub="Orientan y controlan la organización" items={g.s} onSelect={onSelect}/>
          <Arrow dir="down" label="Directrices y control" color="#3b82f6"/>
          <Layer type="operational" label="PROCESOS OPERACIONALES"   sub="Generan valor directo al cliente" items={g.o} onSelect={onSelect} flow/>
          <Arrow dir="up"   label="Soporte y habilitación" color={t.id==='dark'?'#f59e0b':'#d97706'}/>
          <Layer type="support"     label="PROCESOS COMPLEMENTARIOS" sub="Proveen recursos y soporte" items={g.c} onSelect={onSelect}/>
        </div>
        <SideLabel text="PRODUCTO/SERVICIO → VALOR AL CLIENTE" right/>
      </div>
      <div style={{fontSize:10,color:t.textFaint,textAlign:'center'}}>Clic en cualquier proceso · ✓=Aprobado · ⏳=Pendiente · ✏=Borrador</div>
    </div>
  )
}
function SideLabel({text,right}) {
  const t=useT()
  return <div style={{width:24,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{writingMode:'vertical-rl',transform:right?'rotate(180deg)':'none',fontSize:8,letterSpacing:'.15em',textTransform:'uppercase',color:t.textFaint,fontWeight:700,whiteSpace:'nowrap'}}>{text}</div></div>
}
function Arrow({dir,label,color}) {
  return <div style={{display:'flex',alignItems:'center',gap:12,padding:'0 10px'}}><div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${color}50,${color}90,${color}50,transparent)`}}/><div style={{display:'flex',alignItems:'center',gap:5,color,fontSize:10,fontWeight:600,whiteSpace:'nowrap'}}><span>{dir==='down'?'↓':'↑'}</span>{label}<span>{dir==='down'?'↓':'↑'}</span></div><div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${color}50,${color}90,${color}50,transparent)`}}/></div>
}
function Layer({type,label,sub,items,onSelect,flow}) {
  const t=useT(),cfg=t.type[type]
  return (
    <div style={{background:cfg.layerBg,border:`1px solid ${cfg.layerBorder}`,borderRadius:12,padding:'14px 16px',transition:'all .28s'}}>
      <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:12}}>
        <span style={{fontSize:10,color:cfg.accent,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase'}}>{TYPE_ICON[type]} {label}</span>
        <span style={{fontSize:9,color:t.textDim}}>{sub}</span>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        {items.map((p,i)=><div key={p.id} style={{display:'flex',alignItems:'center',gap:4}}><PCard proc={p} onSelect={onSelect}/>{flow&&i<items.length-1&&<span style={{color:cfg.accent,fontSize:14,opacity:.4}}>→</span>}</div>)}
        {!items.length&&<div style={{color:t.textFaint,fontSize:11}}>Sin procesos con los filtros actuales</div>}
      </div>
    </div>
  )
}
function PCard({proc,onSelect}) {
  const t=useT(),cfg=t.type[proc.type],rc=RISK_COLOR[proc.risk]
  const [hov,setHov]=useState(false)
  const redK=(proc.kpis||[]).filter(k=>k.traffic==='red').length
  return (
    <div onClick={()=>onSelect(proc)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{position:'relative',cursor:'pointer',minWidth:148,maxWidth:168,padding:'10px 12px',background:hov?cfg.bg:(t.id==='dark'?`${cfg.bg}88`:`${cfg.bg}cc`),border:`1px solid ${hov?cfg.border:cfg.border+'70'}`,borderStyle:proc.approval==='Borrador'?'dashed':'solid',borderRadius:8,transition:'all .18s',boxShadow:hov?`0 4px 16px ${cfg.border}28`:t.cardShadow,transform:hov?'translateY(-2px)':'none',opacity:proc.approval==='Borrador'?0.78:1}}>
      <div style={{position:'absolute',top:7,right:7,width:7,height:7,borderRadius:'50%',background:rc,boxShadow:`0 0 5px ${rc}`}}/>
      {redK>0&&<div style={{position:'absolute',top:6,right:20,width:14,height:14,borderRadius:3,background:`${rc}22`,border:`1px solid ${rc}88`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:rc,fontWeight:700}}>{redK}</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
        <span style={{fontSize:8,color:cfg.accent,fontWeight:700,letterSpacing:'.1em'}}>{proc.id}</span>
        <ApvChip approval={proc.approval} small/>
      </div>
      <div style={{fontSize:10,color:t.textBright,fontWeight:600,lineHeight:1.3,marginBottom:5}}>{proc.name}</div>
      <div style={{display:'flex',gap:4,alignItems:'center'}}>
        <Dots val={proc.criticality}/><span style={{fontSize:8,color:t.textDim}}>C:{proc.criticality}</span>
        <span style={{marginLeft:'auto',fontSize:8,color:t.textDim}}>M:{proc.maturity}/5</span>
      </div>
    </div>
  )
}

// ─── RISK VIEW ────────────────────────────────────────────────────────────────
function RiskView({processes,onSelect}) {
  const t=useT()
  const sorted=[...processes].sort((a,b)=>b.cost_max-a.cost_max)
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <Card title="◈ Matriz Probabilidad × Impacto">
        <div style={{display:'grid',gridTemplateColumns:'60px repeat(5,1fr)',gap:2}}>
          <div style={{fontSize:8,color:t.textDim,display:'flex',alignItems:'flex-end',paddingBottom:4}}>Prob\Crit</div>
          {[5,4,3,2,1].map(l=><div key={l} style={{textAlign:'center',fontSize:8,color:t.textDim,padding:'4px 0'}}>C:{l}</div>)}
          {['Alta','Media','Baja'].map(prob=>[
            <div key={`l-${prob}`} style={{fontSize:8,color:t.textMuted,display:'flex',alignItems:'center',fontWeight:600}}>{prob}</div>,
            ...[5,4,3,2,1].map(crit=>{
              const ps=processes.filter(p=>p.probability===prob&&p.criticality===crit)
              const s=(prob==='Alta'?3:prob==='Media'?2:1)*crit,a=t.id==='dark'?'20':'14'
              const bg=s>=10?`#ef4444${a}`:s>=6?`#f97316${a}`:s>=3?`#eab308${a}`:`#22c55e${a}`
              return <div key={crit} style={{background:bg,border:`1px solid ${t.id==='dark'?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.05)'}`,borderRadius:4,minHeight:44,padding:3,display:'flex',flexWrap:'wrap',gap:2,alignContent:'flex-start'}}>
                {ps.map(p=>{const cfg=t.type[p.type];return <div key={p.id} onClick={()=>onSelect(p)} title={p.name} style={{fontSize:7,padding:'2px 4px',borderRadius:3,background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.accent,cursor:'pointer',fontWeight:700,borderStyle:p.approval==='Borrador'?'dashed':'solid'}}>{APPROVAL[p.approval]?.icon} {p.id}</div>})}
              </div>
            })
          ])}
        </div>
      </Card>
      <Card title="◈ Exposición Económica — Costo Máx.">
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {sorted.slice(0,10).map(p=>{const pct=(p.cost_max/500000)*100,rc=RISK_COLOR[p.risk],cfg=t.type[p.type];return(
            <div key={p.id} onClick={()=>onSelect(p)} style={{cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                <span style={{fontSize:10,color:t.text,display:'flex',gap:6,alignItems:'center'}}><span style={{fontSize:8,color:cfg.accent,fontWeight:700}}>{p.id}</span><ApvChip approval={p.approval} small/><span style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span></span>
                <span style={{fontSize:10,color:rc,fontWeight:700,marginLeft:8,flexShrink:0}}>${(p.cost_max/1000).toFixed(0)}K</span>
              </div>
              <div style={{height:5,background:t.barTrack,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${rc}88,${rc})`,borderRadius:3,transition:'width .5s ease'}}/></div>
            </div>
          )})}
        </div>
      </Card>
      {['MUY ALTO','ALTO','MEDIO','BAJO'].map(level=>{const procs=processes.filter(p=>p.risk===level),rc=RISK_COLOR[level];return(
        <div key={level} style={{background:t.riskBg(rc),border:`1px solid ${t.riskBorder(rc)}`,borderRadius:12,padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><span style={{fontSize:11,fontWeight:700,color:rc,letterSpacing:'.08em'}}>{level}</span><span style={{fontSize:22,fontWeight:800,color:rc}}>{procs.length}</span></div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {procs.map(p=><span key={p.id} onClick={()=>onSelect(p)} style={{fontSize:9,padding:'3px 7px',borderRadius:4,background:`${rc}15`,border:`1px solid ${rc}40`,color:rc,cursor:'pointer',fontWeight:700}}>{p.id}</span>)}
            {!procs.length&&<span style={{fontSize:10,color:t.textFaint}}>Ninguno</span>}
          </div>
        </div>
      )})}
    </div>
  )
}

// ─── KPI VIEW ─────────────────────────────────────────────────────────────────
function KPIView({processes,onSelect}) {
  const t=useT()
  const all=processes.flatMap(p=>(p.kpis||[]).map(k=>({...k,process:p})))
  const red=all.filter(k=>k.traffic==='red'),yel=all.filter(k=>k.traffic==='yellow'),grn=all.filter(k=>k.traffic==='green')
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[{label:'🔴 Críticos',items:red,c:'#ef4444'},{label:'🟡 En alerta',items:yel,c:'#eab308'},{label:'🟢 Conformes',items:grn,c:'#22c55e'}].map(({label,items,c})=>(
          <div key={label} style={{background:t.riskBg(c),border:`1px solid ${t.riskBorder(c)}`,borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><span style={{fontSize:11,fontWeight:700,color:c}}>{label}</span><span style={{fontSize:28,fontWeight:800,color:c}}>{items.length}</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {items.slice(0,6).map((k,i)=>{const cfg=t.type[k.process.type];return(
                <div key={i} onClick={()=>onSelect(k.process)} style={{cursor:'pointer',display:'flex',gap:7,alignItems:'flex-start',padding:'5px 7px',borderRadius:5,background:t.surfaceBg,border:`1px solid ${t.surfaceBorder}`}}>
                  <span style={{fontSize:7,color:cfg.accent,fontWeight:700,minWidth:36,marginTop:1}}>{k.process.id}</span>
                  <div style={{flex:1}}><div style={{fontSize:9,color:t.text,lineHeight:1.3}}>{k.name}</div><div style={{fontSize:8,color:t.textDim}}>Meta:{k.meta} · <span style={{color:c,fontWeight:700}}>{k.actual}</span></div></div>
                  <ApvChip approval={k.process.approval} small/>
                </div>
              )})}
              {items.length>6&&<div style={{fontSize:9,color:t.textFaint,textAlign:'center'}}>+{items.length-6} más…</div>}
            </div>
          </div>
        ))}
      </div>
      <Card title="◉ Estado de KPIs por Proceso">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead><tr style={{background:t.cardAlt}}>{['Código','Est.Doc.','Proceso','KPI 1','','KPI 2','','KPI 3',''].map((h,i)=><th key={i} style={{padding:'8px 10px',textAlign:'left',color:t.textDim,fontWeight:600,fontSize:9,letterSpacing:'.08em',borderBottom:`1px solid ${t.surfaceBorder}`,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
            <tbody>{processes.map((p,ri)=>{const cfg=t.type[p.type];return(
              <tr key={p.id} onClick={()=>onSelect(p)} style={{cursor:'pointer',background:ri%2===0?'transparent':t.cardAlt,transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background=t.hoverRow} onMouseLeave={e=>e.currentTarget.style.background=ri%2===0?'transparent':t.cardAlt}>
                <td style={{padding:'8px 10px'}}><span style={{fontSize:9,padding:'2px 6px',borderRadius:4,background:cfg.bg,border:`1px solid ${cfg.border}60`,color:cfg.accent,fontWeight:700}}>{p.id}</span></td>
                <td style={{padding:'8px 6px'}}><ApvChip approval={p.approval} small/></td>
                <td style={{padding:'8px 10px',color:t.text,maxWidth:170,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</td>
                {(p.kpis||[]).map((k,ki)=>[
                  <td key={`n${ki}`} style={{padding:'8px 10px',color:t.textMuted,maxWidth:145,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.name}</td>,
                  <td key={`v${ki}`} style={{padding:'8px 6px'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:TRAFFIC_COLOR[k.traffic],boxShadow:`0 0 5px ${TRAFFIC_COLOR[k.traffic]}`}}/></td>
                ])}
              </tr>
            )})}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── FLOW VIEW ────────────────────────────────────────────────────────────────
function FlowView({processes,allProcesses,onSelect}) {
  const t=useT()
  const [hovId,setHovId]=useState(null)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Card title="⇢ Diagrama de Dependencias Interactivo">
        <div style={{display:'flex',flexDirection:'column',gap:22}}>
          {['strategic','operational','support'].map(type=>{
            const procs=processes.filter(p=>p.type===type),cfg=t.type[type]
            if(!procs.length) return null
            return <div key={type}>
              <div style={{fontSize:9,color:cfg.accent,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:10,opacity:.85}}>{TYPE_ICON[type]} {TYPE_LABEL[type]}</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {procs.map(p=>{
                  const succ=(p.successors||[]).filter(s=>processes.find(px=>px.id===s))
                  const pred=processes.filter(px=>(px.successors||[]).includes(p.id)).map(px=>px.id)
                  const isActive=hovId===p.id,isConn=hovId&&(succ.includes(hovId)||pred.includes(hovId)||(processes.find(px=>px.id===hovId)?.successors||[]).includes(p.id)),isDim=hovId&&!isActive&&!isConn
                  return <div key={p.id} onClick={()=>onSelect(p)} onMouseEnter={()=>setHovId(p.id)} onMouseLeave={()=>setHovId(null)} style={{cursor:'pointer',padding:'10px 14px',background:isActive?t.flowBgActive(cfg):isConn?t.flowBgConn(cfg):t.flowBg(cfg),border:`1px solid ${isActive?cfg.border:isConn?cfg.border+'aa':cfg.border+'35'}`,borderStyle:p.approval==='Borrador'?'dashed':'solid',borderRadius:8,opacity:isDim?.25:1,transition:'all .2s',transform:isActive?'scale(1.04)':'none',boxShadow:isActive?`0 0 20px ${cfg.border}35`:t.cardShadow,minWidth:140,maxWidth:165}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}><span style={{fontSize:8,color:cfg.accent,fontWeight:700}}>{p.id}</span><ApvChip approval={p.approval} small/></div>
                    <div style={{fontSize:10,color:t.textBright,lineHeight:1.3,marginBottom:isActive?6:0}}>{p.name}</div>
                    {isActive&&<div style={{borderTop:`1px solid ${t.divider}`,paddingTop:6,display:'flex',flexDirection:'column',gap:2}}>
                      {pred.length>0&&<div style={{fontSize:8,color:'#3b82f6'}}>← {pred.join(', ')}</div>}
                      {succ.length>0&&<div style={{fontSize:8,color:t.id==='dark'?'#4ade80':'#15803d'}}>→ {succ.join(', ')}</div>}
                    </div>}
                  </div>
                })}
              </div>
            </div>
          })}
        </div>
      </Card>
    </div>
  )
}

// ─── APPROVAL VIEW ────────────────────────────────────────────────────────────
function ApprovalView({processes,allProcesses,onSelect}) {
  const t=useT()
  const apr=allProcesses.filter(p=>p.approval==='Aprobado')
  const pnd=allProcesses.filter(p=>p.approval==='Pendiente de Aprobar')
  const bor=allProcesses.filter(p=>p.approval==='Borrador')
  const total=allProcesses.length
  const pct=total?Math.round(apr.length/total*100):0
  const critSinApr=processes.filter(p=>p.criticality>=4&&p.approval!=='Aprobado')
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1.4fr',gap:14}}>
        {[{l:'Aprobados',v:apr.length,c:'#22c55e',i:'✓',d:'Firmados por Dirección/Gerencia'},{l:'Pendiente de Aprobar',v:pnd.length,c:'#f97316',i:'⏳',d:'Presentados, sin firmas'},{l:'Borrador',v:bor.length,c:'#94a3b8',i:'✏',d:'En elaboración · uso de facto'},{l:null,pct,c:'#3b82f6',i:'◎',d:`${apr.length} de ${total} con firma oficial`}].map((s,i)=>(
          <div key={i} style={{background:t.surfaceBg,border:`1px solid ${t.surfaceBorder}`,borderRadius:12,padding:'16px 18px',boxShadow:t.cardShadow}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}><div><div style={{fontSize:9,color:t.textDim,letterSpacing:'.1em',textTransform:'uppercase',fontWeight:600,marginBottom:4}}>{s.l||'Cobertura formal'}</div><div style={{fontSize:9,color:t.textFaint}}>{s.d}</div></div><span style={{fontSize:20,opacity:.7}}>{s.i}</span></div>
            {s.v!==undefined?(<><div style={{fontSize:32,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div><div style={{marginTop:8,height:4,background:t.barTrack,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${(s.v/total)*100}%`,background:s.c,borderRadius:2}}/></div><div style={{fontSize:9,color:t.textDim,marginTop:3}}>{Math.round(s.v/total*100)}% del total</div></>
            ):(<><div style={{fontSize:32,fontWeight:800,color:s.c,lineHeight:1}}>{pct}%</div><div style={{marginTop:8,height:8,background:t.barTrack,borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${s.c}88,${s.c})`,borderRadius:4}}/></div><div style={{fontSize:9,color:t.textDim,marginTop:3}}>{s.d}</div></>)}
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
        {[{key:'Aprobado',list:apr},{key:'Pendiente de Aprobar',list:pnd},{key:'Borrador',list:bor}].map(({key,list})=>{
          const ap=APPROVAL[key],ts=t.apv[key]
          return <div key={key} style={{background:t.surfaceBg,border:`1px solid ${ts.border}`,borderRadius:12,overflow:'hidden',boxShadow:t.cardShadow}}>
            <div style={{padding:'11px 14px',background:ts.bg,borderBottom:`1px solid ${ts.border}`,display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:14}}>{ap.icon}</span><span style={{fontSize:11,fontWeight:700,color:ts.text,letterSpacing:'.06em'}}>{key.toUpperCase()}</span><span style={{marginLeft:'auto',fontSize:14,fontWeight:800,color:ts.text}}>{list.length}</span>
            </div>
            <div style={{padding:10,display:'flex',flexDirection:'column',gap:6,maxHeight:380,overflowY:'auto'}}>
              {list.map(p=>{const cfg=t.type[p.type];return(
                <div key={p.id} onClick={()=>onSelect(p)} style={{cursor:'pointer',display:'flex',gap:8,alignItems:'flex-start',padding:'8px 10px',borderRadius:7,background:t.statBg,border:`1px solid ${t.surfaceBorder}`,transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=cfg.border+'80'} onMouseLeave={e=>e.currentTarget.style.borderColor=t.surfaceBorder}>
                  <span style={{fontSize:8,padding:'2px 5px',borderRadius:3,background:cfg.bg,border:`1px solid ${cfg.border}60`,color:cfg.accent,fontWeight:700,flexShrink:0,marginTop:1}}>{p.id}</span>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:t.textBright,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div><div style={{display:'flex',gap:6,marginTop:3,flexWrap:'wrap'}}>
                    {p.approver&&<span style={{fontSize:8,color:t.textFaint}}>🖊 {p.approver}</span>}
                    {p.approvalDate&&<span style={{fontSize:8,color:ts.text}}>📅 {p.approvalDate}</span>}
                    {p.approvedVersion&&<span style={{fontSize:8,color:t.textDim}}>{p.approvedVersion}</span>}
                    {!p.approver&&<span style={{fontSize:8,color:t.textFaint,fontStyle:'italic'}}>Sin firmante asignado</span>}
                  </div></div>
                  <span style={{fontSize:8,color:t.textDim,flexShrink:0,fontWeight:600}}>C:{p.criticality}</span>
                </div>
              )})}
              {!list.length&&<div style={{fontSize:11,color:t.textFaint,textAlign:'center',padding:12}}>Ninguno</div>}
            </div>
          </div>
        })}
      </div>
      {critSinApr.length>0&&(
        <Card title="⚠ Procesos Críticos sin Aprobación Formal — Atención prioritaria">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10}}>
            {critSinApr.sort((a,b)=>b.criticality-a.criticality).map(p=>{const cfg=t.type[p.type],ts=t.apv[p.approval];return(
              <div key={p.id} onClick={()=>onSelect(p)} style={{cursor:'pointer',padding:'10px 12px',borderRadius:8,background:t.statBg,border:`2px solid ${RISK_COLOR[p.risk]}40`,transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor=RISK_COLOR[p.risk]+'88'} onMouseLeave={e=>e.currentTarget.style.borderColor=RISK_COLOR[p.risk]+'40'}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <span style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.accent,fontWeight:700}}>{p.id}</span>
                  <div style={{display:'flex',gap:4}}><ApvChip approval={p.approval} small/><span style={{fontSize:9,padding:'2px 5px',borderRadius:3,background:`${RISK_COLOR[p.risk]}18`,border:`1px solid ${RISK_COLOR[p.risk]}40`,color:RISK_COLOR[p.risk],fontWeight:700}}>C:{p.criticality}</span></div>
                </div>
                <div style={{fontSize:11,color:t.textBright,fontWeight:600,lineHeight:1.3,marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:9,color:t.textDim}}>{p.approval==='Borrador'?'Sin presentar a firma':'Presentado — pendiente de firma de '+(p.approver||'…')}</div>
              </div>
            )})}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── CANVAS VIEW ──────────────────────────────────────────────────────────────
function CanvasView({processes,allProcesses,onSelect}) {
  const t=useT()
  const svgRef=useRef(null)
  const containerRef=useRef(null)

  // ── layout: assign initial positions by type lane ──────────────────────────
  function buildInitialPositions(procs) {
    const W=200,H=90,GAP_X=240,GAP_Y=120
    const lanes={strategic:[],operational:[],support:[]}
    procs.forEach(p=>{ const k=p.type==='strategic'?'strategic':p.type==='operational'?'operational':'support'; lanes[k].push(p) })
    const pos={}
    const laneY={strategic:60,operational:60+H+GAP_Y,support:60+(H+GAP_Y)*2}
    Object.entries(lanes).forEach(([lane,arr])=>{
      arr.forEach((p,i)=>{ pos[p.id]={x:60+i*(W+GAP_X),y:laneY[lane],w:W,h:H} })
    })
    return pos
  }

  const [positions,setPositions]=useState(()=>buildInitialPositions(processes))
  const [pan,setPan]=useState({x:0,y:0})
  const [zoom,setZoom]=useState(1)
  const dragging=useRef(null)
  const lastMouse=useRef(null)
  const isPanning=useRef(false)

  // sync positions when processes change (new filter)
  useEffect(()=>{
    setPositions(prev=>{
      const next=buildInitialPositions(processes)
      // keep user-moved positions
      processes.forEach(p=>{ if(prev[p.id]) next[p.id]=prev[p.id] })
      return next
    })
  },[processes])

  // ── drag node ────────────────────────────────────────────────────────────────
  function onNodeMouseDown(e,id) {
    e.stopPropagation()
    dragging.current={id,startX:e.clientX,startY:e.clientY,origX:positions[id]?.x||0,origY:positions[id]?.y||0}
    window.addEventListener('mousemove',onMouseMove)
    window.addEventListener('mouseup',onMouseUp)
  }

  // ── pan canvas ───────────────────────────────────────────────────────────────
  function onCanvasMouseDown(e) {
    if(e.button!==0) return
    isPanning.current=true
    lastMouse.current={x:e.clientX,y:e.clientY}
    window.addEventListener('mousemove',onMouseMove)
    window.addEventListener('mouseup',onMouseUp)
  }

  function onMouseMove(e) {
    if(dragging.current) {
      const dx=(e.clientX-dragging.current.startX)/zoom
      const dy=(e.clientY-dragging.current.startY)/zoom
      setPositions(prev=>({...prev,[dragging.current.id]:{...prev[dragging.current.id],x:dragging.current.origX+dx,y:dragging.current.origY+dy}}))
    } else if(isPanning.current && lastMouse.current) {
      const dx=e.clientX-lastMouse.current.x
      const dy=e.clientY-lastMouse.current.y
      setPan(p=>({x:p.x+dx,y:p.y+dy}))
      lastMouse.current={x:e.clientX,y:e.clientY}
    }
  }

  function onMouseUp() {
    dragging.current=null
    isPanning.current=false
    lastMouse.current=null
    window.removeEventListener('mousemove',onMouseMove)
    window.removeEventListener('mouseup',onMouseUp)
  }

  // ── zoom wheel ───────────────────────────────────────────────────────────────
  function onWheel(e) {
    e.preventDefault()
    const delta=e.deltaY>0?0.9:1.1
    setZoom(z=>Math.max(0.3,Math.min(2.5,z*delta)))
  }

  // ── reset ────────────────────────────────────────────────────────────────────
  function reset() {
    setPositions(buildInitialPositions(processes))
    setPan({x:0,y:0})
    setZoom(1)
  }

  // ── compute edges (successors) ───────────────────────────────────────────────
  const edges=[]
  processes.forEach(p=>{
    (p.successors||[]).forEach(sid=>{
      if(positions[p.id] && positions[sid]) edges.push({from:p.id,to:sid})
    })
  })

  // ── bezier path between two nodes ────────────────────────────────────────────
  function edgePath(fromId,toId) {
    const a=positions[fromId],b=positions[toId]
    if(!a||!b) return ''
    const x1=a.x+(a.w||200),y1=a.y+(a.h||90)/2
    const x2=b.x,y2=b.y+(b.h||90)/2
    const cx=(x1+x2)/2
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`
  }

  // canvas size: fit all nodes + padding
  const allX=Object.values(positions).map(p=>p.x+(p.w||200))
  const allY=Object.values(positions).map(p=>p.y+(p.h||90))
  const canvasW=Math.max(1200,allX.length?Math.max(...allX)+80:1200)
  const canvasH=Math.max(700,allY.length?Math.max(...allY)+80:700)

  return (
    <div style={{position:'relative',userSelect:'none'}}>
      {/* toolbar */}
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
        <div style={{fontSize:13,fontWeight:700,color:t.textBright,letterSpacing:'.04em'}}>⬦ Lienzo de Procesos</div>
        <div style={{flex:1}}/>
        <div style={{fontSize:11,color:t.textDim}}>Arrastra nodos · Scroll para zoom · Arrastra fondo para mover</div>
        <button onClick={reset} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${t.inputBorder}`,background:t.statBg,color:t.textMuted,cursor:'pointer',fontSize:11,fontWeight:600,outline:'none'}}>↺ Resetear vista</button>
        <div style={{fontSize:11,color:t.textDim,padding:'4px 10px',borderRadius:6,background:t.statBg,border:`1px solid ${t.statBorder}`}}>{Math.round(zoom*100)}%</div>
      </div>

      {/* legend */}
      <div style={{display:'flex',gap:12,marginBottom:10,flexWrap:'wrap'}}>
        {[['strategic','◆ Estratégico','#3b82f6'],['operational','⬡ Operacional',t.type?.operational?.accent||'#4ade80'],['support','● Complementario',t.type?.support?.accent||'#fbbf24']].map(([,label,color])=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:t.textDim}}>
            <div style={{width:10,height:10,borderRadius:3,background:color,opacity:.85}}/>
            {label}
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:t.textDim}}>
          <svg width="22" height="10"><path d="M0,5 C8,5 14,5 22,5" stroke={t.textDim} strokeWidth="1.5" fill="none" markerEnd="url(#arrowLegend)"/></svg>
          Sucesor
        </div>
      </div>

      {/* canvas */}
      <div
        ref={containerRef}
        onMouseDown={onCanvasMouseDown}
        onWheel={onWheel}
        style={{overflow:'hidden',borderRadius:12,border:`1px solid ${t.surfaceBorder}`,background:t.surfaceBg,cursor:'grab',height:'68vh',position:'relative'}}
      >
        <div style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:'0 0',width:canvasW,height:canvasH,position:'relative'}}>
          {/* dot grid */}
          <svg width={canvasW} height={canvasH} style={{position:'absolute',top:0,left:0,pointerEvents:'none'}}>
            <defs>
              <pattern id="dotgrid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill={t.textDim} opacity=".22"/>
              </pattern>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={t.textDim} opacity=".7"/>
              </marker>
              <marker id="arrowLegend" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill={t.textDim} opacity=".7"/>
              </marker>
            </defs>
            <rect width={canvasW} height={canvasH} fill="url(#dotgrid)"/>
            {/* edges */}
            {edges.map((e,i)=>(
              <path key={i} d={edgePath(e.from,e.to)} stroke={t.textDim} strokeWidth="1.6" fill="none" strokeDasharray="6 3" markerEnd="url(#arrow)" opacity=".65"/>
            ))}
          </svg>

          {/* nodes */}
          {processes.map(p=>{
            const pos=positions[p.id]
            if(!pos) return null
            const cfg=t.type?.[p.type==='strategic'?'strategic':p.type==='operational'?'operational':'support']||{}
            const rc=RISK_COLOR[p.risk]||'#64748b'
            const apvIcon=APPROVAL[p.approval]?.icon||''
            return (
              <div
                key={p.id}
                onMouseDown={e=>onNodeMouseDown(e,p.id)}
                onDoubleClick={()=>onSelect&&onSelect(p)}
                style={{
                  position:'absolute',
                  left:pos.x,top:pos.y,width:pos.w||200,height:pos.h||90,
                  background:cfg.bg||t.surfaceBg,
                  border:`2px solid ${cfg.border||t.surfaceBorder}`,
                  borderRadius:10,
                  cursor:'grab',
                  padding:'10px 13px',
                  boxShadow:`0 2px 12px ${cfg.accent||'#3b82f6'}22`,
                  display:'flex',flexDirection:'column',gap:4,
                  transition:'box-shadow .15s',
                  overflow:'hidden',
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <span style={{fontSize:13,color:cfg.accent||'#3b82f6'}}>{TYPE_ICON[p.type]||'⬡'}</span>
                  <span style={{fontSize:10,fontWeight:700,color:cfg.accent||t.textBright,flex:1,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{p.name}</span>
                </div>
                <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{fontSize:8,padding:'1px 6px',borderRadius:8,background:`${rc}18`,color:rc,border:`1px solid ${rc}40`,fontWeight:600}}>{p.risk||'—'}</span>
                  <span style={{fontSize:8,padding:'1px 6px',borderRadius:8,background:`${cfg.accent||'#3b82f6'}18`,color:cfg.accent||t.textMuted,border:`1px solid ${cfg.accent||'#3b82f6'}30`,fontWeight:600}}>{TYPE_LABEL[p.type]||p.type}</span>
                </div>
                <div style={{display:'flex',gap:4,alignItems:'center',marginTop:'auto'}}>
                  <span style={{fontSize:9,color:t.textFaint}}>{apvIcon} {p.approval}</span>
                  {(p.successors||[]).length>0 && <span style={{marginLeft:'auto',fontSize:8,color:t.textDim}}>→ {p.successors.length}</span>}
                </div>
                <div style={{fontSize:8,color:t.textDim,position:'absolute',bottom:3,right:6,opacity:.5,cursor:'default'}} title="Doble clic para abrir detalle">⊞</div>
              </div>
            )
          })}
        </div>
      </div>
      <div style={{marginTop:7,fontSize:10,color:t.textFaint,textAlign:'right'}}>
        Doble clic sobre un nodo para ver el detalle · {processes.length} procesos · {edges.length} conexiones
      </div>
    </div>
  )
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({process:p,allProcesses,onClose}) {
  const t=useT(),cfg=t.type[p.type],rc=RISK_COLOR[p.risk],ts=t.apv[p.approval],ap=APPROVAL[p.approval]
  return (
    <div style={{position:'fixed',inset:0,zIndex:100}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:t.overlayBg,backdropFilter:'blur(4px)'}}/>
      <div style={{position:'absolute',right:0,top:0,bottom:0,width:490,background:t.panelBg,borderLeft:`1px solid ${cfg.border}30`,overflowY:'auto',animation:'slideIn .22s ease',boxShadow:t.panelShadow}}>
        <div style={{padding:'20px 24px',borderBottom:`1px solid ${cfg.border}20`,background:t.id==='dark'?`${cfg.bg}44`:cfg.bg}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div><div style={{fontSize:10,color:cfg.accent,fontWeight:700,letterSpacing:'.12em',marginBottom:4}}>{TYPE_ICON[p.type]} {TYPE_LABEL[p.type]} · {p.id}</div><div style={{fontSize:16,fontWeight:700,color:t.textBright,lineHeight:1.3}}>{p.name}</div></div>
            <button onClick={onClose} style={{background:t.statBg,border:`1px solid ${t.statBorder}`,color:t.textMuted,borderRadius:6,width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',outline:'none'}}>✕</button>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}><Badge label={p.risk} color={rc}/><Badge label={`Criticidad ${p.criticality}/5`} color={rc}/><Badge label={`Madurez ${p.maturity}/5`} color="#3b82f6"/><Badge label={p.status} color="#22c55e"/></div>
        </div>
        <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:18}}>
          {/* Approval block */}
          <div style={{padding:'14px 16px',background:ts?.bg,border:`1px solid ${ts?.border}`,borderRadius:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:(p.approver||p.approvalDate)?10:0}}>
              <span style={{fontSize:20}}>{ap?.icon}</span>
              <div><div style={{fontSize:13,fontWeight:700,color:ts?.text}}>{ap?.label}</div>
              <div style={{fontSize:10,color:t.textDim}}>{p.approval==='Aprobado'?'Firmado oficialmente por la Dirección':p.approval==='Pendiente de Aprobar'?'Presentado — pendiente de firma':'En elaboración · uso de facto sin validez formal'}</div></div>
            </div>
            {(p.approver||p.approvalDate)&&<div style={{display:'flex',flexWrap:'wrap',gap:12,paddingTop:10,borderTop:`1px solid ${ts?.border}`}}>
              {p.approver&&<div><div style={{fontSize:8,color:t.textDim,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2}}>Firmante</div><div style={{fontSize:11,fontWeight:600,color:t.textBright}}>{p.approver}</div></div>}
              {p.approvalDate&&<div><div style={{fontSize:8,color:t.textDim,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2}}>Fecha</div><div style={{fontSize:11,fontWeight:600,color:ts?.text}}>{p.approvalDate}</div></div>}
              {p.approvedVersion&&<div><div style={{fontSize:8,color:t.textDim,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2}}>Versión</div><div style={{fontSize:11,fontWeight:600,color:t.textBright}}>{p.approvedVersion}</div></div>}
            </div>}
          </div>
          <Sec title="Propósito" icon="◎"><p style={{fontSize:12,color:t.textMuted,lineHeight:1.65,margin:0}}>{p.description}</p></Sec>
          <Sec title="Responsabilidad" icon="◉"><IRow label="Process Owner" val={p.owner}/><IRow label="Normativa" val={p.norm}/><IRow label="Herramientas" val={p.tools}/><IRow label="Frecuencia" val={p.freq}/></Sec>
          <Sec title="Relaciones" icon="⇢">
            <div style={{marginBottom:10}}><div style={{fontSize:9,color:t.textDim,fontWeight:600,letterSpacing:'.08em',marginBottom:5,textTransform:'uppercase'}}>Alimentado por</div><div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {(allProcesses||[]).filter(px=>(px.successors||[]).includes(p.id)).map(px=>{const sc=t.type[px.type];return <span key={px.id} style={{fontSize:9,padding:'2px 7px',borderRadius:4,background:sc.bg,border:`1px solid ${sc.border}60`,color:sc.accent,fontWeight:600}}>{px.id}</span>})}
              {!(allProcesses||[]).filter(px=>(px.successors||[]).includes(p.id)).length&&<span style={{fontSize:10,color:t.textFaint}}>Proceso de entrada inicial</span>}
            </div></div>
            <div><div style={{fontSize:9,color:t.textDim,fontWeight:600,letterSpacing:'.08em',marginBottom:5,textTransform:'uppercase'}}>Alimenta a</div><div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {(p.successors||[]).map(s=>{const sp=(allProcesses||[]).find(px=>px.id===s);const sc=sp?t.type[sp.type]:null;return <span key={s} style={{fontSize:9,padding:'2px 7px',borderRadius:4,background:sc?sc.bg:t.cardAlt,border:`1px solid ${sc?sc.border+'60':t.surfaceBorder}`,color:sc?sc.accent:t.textDim,fontWeight:600}}>{s}</span>})}
              {!(p.successors||[]).length&&<span style={{fontSize:10,color:t.textFaint}}>Proceso de salida final</span>}
            </div></div>
          </Sec>
          <Sec title="Impacto si Falla" icon="◈">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{padding:10,background:`${rc}0e`,border:`1px solid ${rc}26`,borderRadius:6,textAlign:'center'}}><div style={{fontSize:9,color:t.textDim,marginBottom:3}}>Costo Máx.</div><div style={{fontSize:20,fontWeight:800,color:rc}}>${((p.cost_max||0)/1000).toFixed(0)}K</div></div>
              <div style={{padding:10,background:t.surfaceBg,border:`1px solid ${t.surfaceBorder}`,borderRadius:6,textAlign:'center'}}><div style={{fontSize:9,color:t.textDim,marginBottom:3}}>Probabilidad</div><div style={{fontSize:14,fontWeight:700,color:t.text}}>{p.probability}</div></div>
            </div>
          </Sec>
          <Sec title="KPIs" icon="▦">
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(p.kpis||[]).map((k,i)=>{const tc=TRAFFIC_COLOR[k.traffic];return(
                <div key={i} style={{padding:'10px 12px',background:t.surfaceBg,border:`1px solid ${tc}26`,borderRadius:6,display:'flex',gap:10,alignItems:'center'}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:tc,flexShrink:0,boxShadow:`0 0 7px ${tc}`}}/>
                  <div style={{flex:1}}><div style={{fontSize:10,color:t.textBright,fontWeight:600}}>{k.name}</div><div style={{display:'flex',gap:10,marginTop:2}}><span style={{fontSize:9,color:t.textDim}}>Meta:<span style={{color:t.textMuted}}> {k.meta}</span></span><span style={{fontSize:9,color:t.textDim}}>Actual:<span style={{color:tc,fontWeight:700}}> {k.actual}</span></span></div></div>
                </div>
              )})}
              {!(p.kpis||[]).length&&<div style={{fontSize:11,color:t.textFaint}}>Sin KPIs registrados</div>}
            </div>
          </Sec>
          <Sec title="Documentación" icon="⎘">
            {p.link_procedimiento&&p.link_procedimiento!=='[Insertar URL del procedimiento]'
              ? <a href={p.link_procedimiento} target="_blank" rel="noreferrer" style={{display:'inline-block',padding:'7px 12px',background:t.docLinkBg,border:`1px solid ${t.docLinkBorder}`,borderRadius:6,fontSize:10,color:t.docLinkColor,fontWeight:600,textDecoration:'none',marginRight:8}}>📄 Procedimiento →</a>
              : <span style={{padding:'7px 12px',background:t.docLinkBg,border:`1px solid ${t.docLinkBorder}`,borderRadius:6,fontSize:10,color:t.docLinkColor,fontWeight:600,opacity:.5}}>📄 Enlace no configurado</span>}
          </Sec>
        </div>
      </div>
    </div>
  )
}
