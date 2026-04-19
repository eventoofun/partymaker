/** @jsx React.createElement */
const { useState: useStateShell, useEffect: useEffectShell } = React;

const NAV = [
  {group:null, items:[
    {k:'overview', i:'📊', l:'Overview', path:'/admin'},
  ]},
  {group:'Plataforma', items:[
    {k:'usuarios', i:'👥', l:'Usuarios'},
    {k:'eventos', i:'🎉', l:'Eventos'},
    {k:'pagos', i:'💳', l:'Pagos'},
  ]},
  {group:'Producción', items:[
    {k:'ia', i:'🎬', l:'IA / Video'},
    {k:'tienda', i:'🛍️', l:'Tienda'},
  ]},
  {group:'Operaciones', items:[
    {k:'comunicaciones', i:'📨', l:'Comunicaciones'},
    {k:'compliance', i:'🔐', l:'Compliance'},
    {k:'integraciones', i:'🔗', l:'Integraciones'},
    {k:'audit', i:'📋', l:'Audit Log'},
  ]},
  {group:'Equipo', items:[
    {k:'equipo', i:'👤', l:'Gestión de equipo'},
  ]},
];

function Sidebar({ active, setActive }) {
  return (
    <aside style={{
      width:240, flexShrink:0,
      background:`linear-gradient(180deg, ${T.elev} 0%, ${T.deep} 100%)`,
      borderRight:`1px solid ${T.borderWhite}`,
      padding:'20px 14px 24px',
      height:'100vh', position:'sticky', top:0,
      display:'flex', flexDirection:'column',
      zIndex:10,
    }}>
      {/* Logo */}
      <div style={{padding:'4px 10px 22px',display:'flex',alignItems:'center',gap:10}}>
        <div style={{
          width:34, height:34, borderRadius:10,
          background:T.gradBrand,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:18, boxShadow:'0 0 16px rgba(0,194,209,.35)',
        }}>🪔</div>
        <div>
          <div style={{
            fontFamily:T.fontD,fontWeight:800,fontSize:15,letterSpacing:'-.02em',lineHeight:1,
            background:T.gradBrand,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
          }}>Cumplefy</div>
          <div style={{fontSize:9.5,fontWeight:700,letterSpacing:'.18em',color:T.n400,marginTop:3}}>ADMIN</div>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',overflowX:'hidden',display:'flex',flexDirection:'column',gap:2,marginRight:-8,paddingRight:8}}>
        {NAV.map((g, gi) => (
          <div key={gi} style={{marginBottom:g.group?4:10}}>
            {g.group && <div style={{
              fontSize:9.5, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase',
              color:T.n500, padding:'12px 12px 6px',
            }}>{g.group}</div>}
            {g.items.map(it => {
              const isActive = active===it.k;
              return (
                <div key={it.k} onClick={()=>setActive(it.k)}
                  style={{
                    padding:'9px 12px', borderRadius:10,
                    display:'flex', alignItems:'center', gap:11,
                    fontSize:13, fontWeight: isActive?700:500,
                    color: isActive?'#fff':T.n300,
                    background: isActive?'rgba(0,194,209,.10)':'transparent',
                    border:`1px solid ${isActive?T.border:'transparent'}`,
                    cursor:'pointer', position:'relative',
                    transition:'all 180ms',
                    boxShadow: isActive?`inset 3px 0 0 ${T.teal}, 0 0 20px rgba(0,194,209,.1)`:'none',
                  }}
                  onMouseEnter={e=>{ if(!isActive){e.currentTarget.style.background='rgba(255,255,255,.03)';e.currentTarget.style.color=T.n100;}}}
                  onMouseLeave={e=>{ if(!isActive){e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.n300;}}}
                >
                  <span style={{fontSize:15,lineHeight:1,width:18,display:'inline-flex',justifyContent:'center'}}>{it.i}</span>
                  {it.l}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User tile */}
      <div style={{
        marginTop:12, padding:'12px 12px',
        background:'rgba(255,255,255,.03)',
        border:`1px solid ${T.borderWhite}`,
        borderRadius:14, display:'flex', alignItems:'center', gap:10,
      }}>
        <Avatar name="Pedro Amador" size={34} grad={T.gradBrand} glow/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12.5,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Pedro Amador</div>
          <div style={{fontSize:10,color:T.gold,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}>
            <span>★</span> Owner
          </div>
        </div>
        <IconBtn icon={<span style={{fontSize:14}}>⚙</span>}/>
      </div>
    </aside>
  );
}

function TopBar({ active, onToggleTweaks }) {
  const cur = NAV.flatMap(g=>g.items).find(i=>i.k===active);
  const [q, setQ] = useStateShell('');
  return (
    <div style={{
      padding:'16px 36px',
      borderBottom:`1px solid ${T.borderWhite}`,
      display:'flex', alignItems:'center', gap:20,
      background:'rgba(8,13,28,.6)', backdropFilter:'blur(12px)',
      position:'sticky', top:0, zIndex:20,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:T.n400}}>
        <span style={{fontWeight:500}}>Admin</span>
        <span style={{opacity:.4}}>/</span>
        <span style={{color:T.n100,fontWeight:600}}>{cur?.l || 'Overview'}</span>
      </div>
      <div style={{flex:1,maxWidth:420,marginLeft:16}}>
        <Input value={q} onChange={setQ} placeholder="Buscar usuarios, eventos, órdenes…"
          icon={<span style={{fontSize:13}}>🔍</span>}/>
      </div>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
        <Pill color={T.emerald} strong={false}><Dot color={T.emerald} pulse size={6}/>Sistemas OK</Pill>
        <IconBtn icon={<span style={{fontSize:15}}>🔔</span>} tooltip="Notificaciones"/>
        <IconBtn icon={<span style={{fontSize:15}}>?</span>} tooltip="Ayuda"/>
      </div>
    </div>
  );
}

function AdminShell({ active, setActive, children }) {
  return (
    <div style={{display:'flex',minHeight:'100vh',position:'relative',zIndex:1}}>
      <Sidebar active={active} setActive={setActive}/>
      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
        <TopBar active={active}/>
        <main style={{flex:1,padding:'32px 36px 60px',maxWidth:1600,width:'100%',margin:'0 auto'}}>
          {children}
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { AdminShell, NAV });
