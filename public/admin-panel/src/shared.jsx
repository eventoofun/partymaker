/** @jsx React.createElement */
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// ══════════════════════════════════════════════════════════════════
// TOKENS
// ══════════════════════════════════════════════════════════════════
const T = {
  bg: '#020409',
  deep: '#04070F',
  elev: '#080D1C',
  card: '#0C1224',
  hover: '#111A30',
  teal: '#00C2D1',
  gold: '#FFB300',
  coral: '#FF4D6D',
  emerald: '#00E5A0',
  blue: '#0066FF',
  lilac: '#A78BFA',
  red: '#FF4D6D',
  orange: '#FF8C42',
  n100: '#EEF2FF',
  n200: '#C0CCDE',
  n300: '#92A0BB',
  n400: '#65748F',
  n500: '#435066',
  n600: '#2B3749',
  n700: '#18243A',
  border: 'rgba(0,194,209,0.18)',
  borderSubtle: 'rgba(0,194,209,0.10)',
  borderStrong: 'rgba(0,194,209,0.35)',
  borderWhite: 'rgba(255,255,255,0.06)',
  gradBrand: 'linear-gradient(135deg,#00C2D1 0%,#FFB300 100%)',
  gradCoral: 'linear-gradient(135deg,#FF4D6D 0%,#FFB300 100%)',
  gradGenie: 'linear-gradient(135deg,#00C2D1 0%,#0066FF 50%,#FFB300 100%)',
  gradTeal:  'linear-gradient(135deg,#00E5F5 0%,#008FA0 100%)',
  fontD: '"Plus Jakarta Sans",Inter,system-ui,sans-serif',
  fontB: 'Inter,system-ui,sans-serif',
  fontM: '"JetBrains Mono",Fira Code,monospace',
};

// ══════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════
function Card({ children, style, glow, padding = 20, hover = false, ...rest }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: T.card,
        border: `1px solid ${h ? T.border : T.borderSubtle}`,
        borderRadius: 18,
        padding,
        boxShadow: glow ? `0 8px 40px rgba(0,0,0,.6), ${glow}` : '0 8px 40px rgba(0,0,0,.35)',
        transition: 'all 280ms cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Pill({ children, color = T.teal, bg, strong, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 9999,
      fontSize: 11, fontWeight: 700, letterSpacing: '.03em',
      background: bg || (strong ? color : `${color}1F`),
      color: strong ? '#fff' : color,
      border: `1px solid ${color}33`,
      whiteSpace:'nowrap',
      ...style,
    }}>{children}</span>
  );
}

function Dot({ color = T.emerald, pulse = false, size = 8, style }) {
  return (
    <span style={{
      display:'inline-block', width:size, height:size, borderRadius:'50%',
      background:color, boxShadow:`0 0 10px ${color}`,
      animation: pulse ? 'pulse-dot 1.6s ease-in-out infinite' : 'none',
      ...style,
    }}/>
  );
}

function Avatar({ name, size = 32, grad = T.gradBrand, glow = false }) {
  const initials = (name||'??').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:grad,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:800, fontSize:size*0.38,
      fontFamily:T.fontD, letterSpacing:'-0.02em',
      flexShrink:0,
      boxShadow: glow ? '0 0 0 2px rgba(0,194,209,.3), 0 0 20px rgba(0,194,209,.4)' : 'none',
    }}>{initials}</div>
  );
}

function Button({ children, variant = 'primary', size = 'md', onClick, style, icon, disabled }) {
  const [h, setH] = useState(false);
  const sizes = {
    sm: { p: '6px 12px', f: 12 },
    md: { p: '9px 16px', f: 13 },
    lg: { p: '12px 22px', f: 14 },
  }[size];
  const variants = {
    primary: {
      background: T.gradCoral, color:'#fff',
      border:'1px solid transparent',
      boxShadow: h ? '0 6px 24px rgba(255,77,109,.45)' : '0 3px 12px rgba(255,77,109,.25)',
    },
    teal: {
      background: T.gradBrand, color:'#fff',
      border:'1px solid transparent',
      boxShadow: h ? '0 6px 24px rgba(0,194,209,.45)' : '0 3px 12px rgba(0,194,209,.2)',
    },
    ghost: {
      background: h ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)',
      color: T.n200,
      border:`1px solid ${T.borderWhite}`,
    },
    danger: {
      background: h ? '#ff3e5c' : 'rgba(255,77,109,.12)',
      color: h ? '#fff' : T.coral,
      border:`1px solid ${T.coral}55`,
    },
  }[variant];
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={()=>setH(true)}
      onMouseLeave={()=>setH(false)}
      style={{
        ...variants,
        padding: sizes.p,
        fontSize: sizes.f,
        fontWeight:700,
        borderRadius:9999,
        cursor: disabled?'not-allowed':'pointer',
        opacity: disabled?0.4:1,
        display:'inline-flex', alignItems:'center', gap:7,
        transition:'all 200ms cubic-bezier(0.34,1.56,0.64,1)',
        transform: h && !disabled ? 'translateY(-1px)' : 'none',
        fontFamily:T.fontB,
        letterSpacing:'-.005em',
        ...style,
      }}
    >{icon}{children}</button>
  );
}

function IconBtn({ icon, onClick, tooltip, color=T.n300 }) {
  const [h,setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      title={tooltip}
      style={{
        width:32, height:32, borderRadius:10,
        background: h? 'rgba(0,194,209,.1)':'transparent',
        border:`1px solid ${h? T.border : 'transparent'}`,
        color: h? T.teal : color, cursor:'pointer',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        transition:'all 180ms',
      }}>{icon}</button>
  );
}

function Input({ placeholder, value, onChange, icon, style, width }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'8px 12px', borderRadius:10,
      background:'rgba(255,255,255,.03)',
      border:`1px solid ${T.borderWhite}`,
      width,
      ...style,
    }}>
      {icon && <span style={{color:T.n400,display:'flex'}}>{icon}</span>}
      <input
        value={value} onChange={e=>onChange && onChange(e.target.value)} placeholder={placeholder}
        style={{background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:13,flex:1,fontFamily:T.fontB}}
      />
    </div>
  );
}

function Select({ value, onChange, options, label, width = 140 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(()=>{
    const h = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);
  const cur = options.find(o=>o.v===value) || options[0];
  return (
    <div ref={ref} style={{position:'relative',width}}>
      <button onClick={()=>setOpen(!open)} style={{
        width:'100%', padding:'8px 12px', borderRadius:10,
        background:'rgba(255,255,255,.03)', border:`1px solid ${open?T.border:T.borderWhite}`,
        color:'#fff', fontSize:12.5, fontWeight:500, cursor:'pointer',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
        transition:'all 160ms',
      }}>
        <span style={{display:'flex',gap:6,alignItems:'center'}}>
          {label && <span style={{color:T.n400,fontWeight:400}}>{label}:</span>}
          <span>{cur?.l}</span>
        </span>
        <span style={{color:T.n400,fontSize:10,transition:'transform .2s',transform:open?'rotate(180deg)':'none'}}>▼</span>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:30,
          background:T.elev, border:`1px solid ${T.border}`,
          borderRadius:10, padding:4, boxShadow:'0 12px 40px rgba(0,0,0,.6)',
          animation:'fade-up 180ms',
        }}>
          {options.map(o => (
            <div key={o.v} onClick={()=>{onChange && onChange(o.v); setOpen(false);}}
              style={{padding:'8px 10px',borderRadius:7,cursor:'pointer',fontSize:12.5,
                background: o.v===value?'rgba(0,194,209,.12)':'transparent',
                color: o.v===value?T.teal:T.n200,
                fontWeight: o.v===value?600:500,
              }}
              onMouseEnter={e=>{ if(o.v!==value) e.currentTarget.style.background='rgba(255,255,255,.04)';}}
              onMouseLeave={e=>{ if(o.v!==value) e.currentTarget.style.background='transparent';}}
            >{o.l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Eyebrow({ children, color = T.teal }) {
  return <div style={{
    fontSize:10.5, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase',
    color, fontFamily:T.fontB,
  }}>{children}</div>;
}

function SectionTitle({ children, subtitle, right }) {
  return (
    <div style={{display:'flex',alignItems:'flex-end',marginBottom:20,gap:16}}>
      <div style={{flex:1}}>
        <h1 style={{fontFamily:T.fontD,fontSize:32,fontWeight:800,letterSpacing:'-.035em',margin:0,color:'#fff'}}>{children}</h1>
        {subtitle && <div style={{fontSize:13,color:T.n300,marginTop:6}}>{subtitle}</div>}
      </div>
      <div>{right}</div>
    </div>
  );
}

function Modal({ open, onClose, children, width = 640, label }) {
  if (!open) return null;
  return (
    <div
      data-modal
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(2,4,9,.72)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:40,
        animation:'backdrop-in 200ms',
      }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          width,
          maxWidth:'95vw',
          maxHeight:'90vh',
          background:`linear-gradient(180deg, ${T.elev} 0%, ${T.card} 100%)`,
          border:`1px solid ${T.border}`,
          borderRadius:24,
          boxShadow:'0 30px 100px rgba(0,0,0,.8), 0 0 0 1px rgba(0,194,209,.15), 0 0 60px rgba(0,194,209,.15)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
          animation:'modal-in 260ms cubic-bezier(0.16,1,0.3,1)',
        }}
        aria-label={label}
      >{children}</div>
    </div>
  );
}

function ModalHeader({ title, subtitle, onClose, right }) {
  return (
    <div style={{padding:'22px 26px',borderBottom:`1px solid ${T.borderWhite}`,display:'flex',alignItems:'center',gap:14}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:T.fontD,fontSize:20,fontWeight:700,letterSpacing:'-.02em',color:'#fff'}}>{title}</div>
        {subtitle && <div style={{fontSize:12.5,color:T.n300,marginTop:4}}>{subtitle}</div>}
      </div>
      {right}
      {onClose && <IconBtn onClick={onClose} icon={<span style={{fontSize:18}}>✕</span>}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TABLE
// ══════════════════════════════════════════════════════════════════
function DataTable({ columns, rows, onRowClick, rowKey='id', empty }) {
  return (
    <div style={{background:T.card,border:`1px solid ${T.borderSubtle}`,borderRadius:18,overflow:'hidden',boxShadow:'0 8px 40px rgba(0,0,0,.35)'}}>
      <div style={{
        display:'grid', gridTemplateColumns: columns.map(c=>c.w||'1fr').join(' '),
        padding:'14px 20px',
        borderBottom:`1px solid ${T.borderWhite}`,
        fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase',
        color:T.n400, gap:12,
      }}>
        {columns.map(c => <div key={c.k} style={{textAlign:c.align||'left'}}>{c.label}</div>)}
      </div>
      {rows.length===0 ? (
        <div style={{padding:'40px 20px',textAlign:'center',color:T.n400,fontSize:13}}>{empty||'Sin resultados'}</div>
      ) : rows.map((r, i) => (
        <div key={r[rowKey]||i} onClick={()=>onRowClick && onRowClick(r)}
          className="table-row"
          style={{
            display:'grid', gridTemplateColumns: columns.map(c=>c.w||'1fr').join(' '),
            padding:'14px 20px',
            borderTop:`1px solid ${T.borderWhite}`,
            fontSize:13, color:T.n200, gap:12, alignItems:'center',
            cursor: onRowClick?'pointer':'default',
            transition:'background 150ms',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(0,194,209,.04)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          {columns.map(c => <div key={c.k} style={{textAlign:c.align||'left',minWidth:0,overflow:'hidden'}}>{c.render ? c.render(r, i) : r[c.k]}</div>)}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MENU (three-dot dropdown)
// ══════════════════════════════════════════════════════════════════
function Menu({ items, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(()=>{
    const h = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}} onClick={e=>e.stopPropagation()}>
      <IconBtn onClick={()=>setOpen(!open)} icon={icon || <span style={{fontSize:18,letterSpacing:'.1em'}}>⋯</span>}/>
      {open && (
        <div style={{
          position:'absolute', right:0, top:'calc(100% + 6px)', zIndex:40,
          minWidth:200, padding:6,
          background:T.elev, border:`1px solid ${T.border}`,
          borderRadius:12, boxShadow:'0 20px 60px rgba(0,0,0,.7)',
          animation:'fade-up 180ms',
        }}>
          {items.map((it, i) => it.divider ? (
            <div key={i} style={{height:1,background:T.borderWhite,margin:'4px 2px'}}/>
          ) : (
            <div key={i}
              onClick={()=>{ it.onClick && it.onClick(); setOpen(false); }}
              style={{
                padding:'9px 12px', borderRadius:8, cursor:'pointer',
                fontSize:12.5, color: it.danger?T.coral:T.n200, fontWeight:500,
                display:'flex', alignItems:'center', gap:10,
              }}
              onMouseEnter={e=>e.currentTarget.style.background = it.danger?'rgba(255,77,109,.1)':'rgba(0,194,209,.08)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <span style={{fontSize:14,width:16,display:'inline-flex',justifyContent:'center'}}>{it.icon}</span>
              {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// KPI CARD
// ══════════════════════════════════════════════════════════════════
function KPI({ label, value, delta, deltaColor=T.emerald, sub, accent=T.teal, icon, live }) {
  return (
    <Card padding={22} hover
      style={{
        background:`linear-gradient(135deg, ${T.card} 0%, ${T.elev} 100%)`,
        borderLeft:`2px solid ${accent}55`,
        position:'relative',
        overflow:'hidden',
      }}
    >
      <div style={{position:'absolute',right:-20,top:-20,width:120,height:120,borderRadius:'50%',
        background:`radial-gradient(circle, ${accent}1F, transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,position:'relative'}}>
        {icon && <div style={{
          width:32,height:32,borderRadius:10,
          background:`${accent}18`,
          display:'flex',alignItems:'center',justifyContent:'center',
          color:accent, fontSize:15,
        }}>{icon}</div>}
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:T.n400}}>{label}</div>
        {live && <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
          <Dot color={T.emerald} pulse/>
          <span style={{fontSize:10,color:T.emerald,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase'}}>Live</span>
        </span>}
      </div>
      <div style={{position:'relative',fontFamily:T.fontD,fontSize:38,fontWeight:800,letterSpacing:'-.04em',color:'#fff',lineHeight:1}}>{value}</div>
      {delta && <div style={{position:'relative',marginTop:10,fontSize:12,color:deltaColor,fontWeight:600,display:'flex',gap:6,alignItems:'center'}}>
        <span>{delta}</span>
      </div>}
      {sub && <div style={{position:'relative',marginTop:delta?4:10,fontSize:11.5,color:T.n400}}>{sub}</div>}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SPARKLINE / LINE / BAR
// ══════════════════════════════════════════════════════════════════
function LineChart({ data, color = T.teal, height = 180, gradId = 'lg1', showAxis = true }) {
  const W = 600, H = height, pad = { l: 28, r: 12, t: 12, b: 20 };
  const max = Math.max(...data);
  const min = Math.min(...data, 0);
  const px = i => pad.l + (i*(W - pad.l - pad.r)) / (data.length-1);
  const py = v => pad.t + (1 - (v-min)/(max-min || 1)) * (H - pad.t - pad.b);
  const path = data.map((v,i)=>`${i===0?'M':'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  const area = `${path} L${px(data.length-1).toFixed(1)},${H-pad.b} L${px(0).toFixed(1)},${H-pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:height,display:'block'}}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".32"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {showAxis && [0, 0.25, 0.5, 0.75, 1].map((t,i)=>(
        <line key={i} x1={pad.l} x2={W-pad.r} y1={pad.t+t*(H-pad.t-pad.b)} y2={pad.t+t*(H-pad.t-pad.b)} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      ))}
      <path d={area} fill={`url(#${gradId})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{filter:`drop-shadow(0 0 6px ${color}80)`}}/>
      {data.map((v,i)=>i%5===0 && (
        <circle key={i} cx={px(i)} cy={py(v)} r="2.5" fill={color} stroke={T.bg} strokeWidth="1"/>
      ))}
    </svg>
  );
}

function BarChart({ data, height = 180, gradId = 'bg1' }) {
  const W = 600, H = height, pad = { l: 28, r: 12, t: 12, b: 20 };
  const max = Math.max(...data);
  const bw = (W - pad.l - pad.r) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:height,display:'block'}}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4D6D"/>
          <stop offset="100%" stopColor="#FFB300"/>
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t,i)=>(
        <line key={i} x1={pad.l} x2={W-pad.r} y1={pad.t+t*(H-pad.t-pad.b)} y2={pad.t+t*(H-pad.t-pad.b)} stroke="rgba(255,255,255,.04)"/>
      ))}
      {data.map((v,i)=>{
        const h = (v/max) * (H - pad.t - pad.b);
        const x = pad.l + i*bw + 1.5;
        const y = H - pad.b - h;
        return <rect key={i} x={x} y={y} width={bw-3} height={h} rx="2" fill={`url(#${gradId})`} opacity={0.85}/>;
      })}
    </svg>
  );
}

function Progress({ value, color = T.teal, height = 4, bg = 'rgba(255,255,255,.06)' }) {
  return (
    <div style={{height,background:bg,borderRadius:99,overflow:'hidden'}}>
      <div style={{
        height:'100%', width:`${value}%`,
        background: typeof color==='string'?color:color,
        borderRadius:99,
        transition:'width .6s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: `0 0 8px ${typeof color==='string'?color:T.teal}66`,
      }}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STATIC LOOKUPS (no son datos de BD)
// ══════════════════════════════════════════════════════════════════
const EVENT_TYPES = {
  cumpleanos: {e:'🎂', l:'Cumpleaños', grad:'linear-gradient(135deg,#FF4D6D,#FFB300)'},
  boda:       {e:'💍', l:'Boda', grad:'linear-gradient(135deg,#E8C4A0,#B8854A)'},
  bautizo:    {e:'👶', l:'Bautizo', grad:'linear-gradient(135deg,#67E8F9,#38BDF8)'},
  graduacion: {e:'🎓', l:'Graduación', grad:'linear-gradient(135deg,#00C2D1,#0066FF)'},
  comunion:   {e:'✨', l:'Comunión', grad:'linear-gradient(135deg,#A78BFA,#7C3AED)'},
  despedida:  {e:'🥂', l:'Despedida', grad:'linear-gradient(135deg,#FFD23F,#FF6B35)'},
  navidad:    {e:'🎄', l:'Navidad', grad:'linear-gradient(135deg,#DC2626,#16A34A)'},
  empresa:    {e:'🏢', l:'Empresa', grad:'linear-gradient(135deg,#00C2D1,#6366F1)'},
  otros:      {e:'🎊', l:'Otros', grad:'linear-gradient(135deg,#65748F,#435066)'},
};

// Placeholders vacíos — se rellenan desde /api/admin/data en app.jsx
let USERS = [];
let EVENTS = [];
let TRANSACTIONS = [];
let ADMIN_KPIS = { totalUsers:0, newUsersWeek:0, activeEvents:0, totalEvents:0, newEventsWeek:0, revenueCents:0, videoJobsLive:0 };
let EVENTS_CHART = Array(30).fill(0);
let REVENUE_CHART = Array(30).fill(0);
let ACTIVE_JOBS = [];
let AUDIT_LOG = [];

// ══════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════
Object.assign(window, {
  T, Card, Pill, Dot, Avatar, Button, IconBtn, Input, Select,
  Eyebrow, SectionTitle, Modal, ModalHeader, DataTable, Menu,
  KPI, LineChart, BarChart, Progress,
  EVENT_TYPES,
  get USERS() { return USERS; }, set USERS(v) { USERS = v; },
  get EVENTS() { return EVENTS; }, set EVENTS(v) { EVENTS = v; },
  get TRANSACTIONS() { return TRANSACTIONS; }, set TRANSACTIONS(v) { TRANSACTIONS = v; },
  get ADMIN_KPIS() { return ADMIN_KPIS; }, set ADMIN_KPIS(v) { ADMIN_KPIS = v; },
  get EVENTS_CHART() { return EVENTS_CHART; }, set EVENTS_CHART(v) { EVENTS_CHART = v; },
  get REVENUE_CHART() { return REVENUE_CHART; }, set REVENUE_CHART(v) { REVENUE_CHART = v; },
  get ACTIVE_JOBS() { return ACTIVE_JOBS; }, set ACTIVE_JOBS(v) { ACTIVE_JOBS = v; },
  get AUDIT_LOG() { return AUDIT_LOG; }, set AUDIT_LOG(v) { AUDIT_LOG = v; },
});
