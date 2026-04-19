/** @jsx React.createElement */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentPrimary": "#00C2D1",
  "accentWarm": "#FFB300",
  "density": "comfortable",
  "showGrain": true
}/*EDITMODE-END*/;

const SCREEN_MAP = {
  overview: () => <OverviewScreen/>,
  usuarios: () => <UsuariosScreen/>,
  eventos: () => <EventosScreen/>,
  pagos: () => <PagosScreen/>,
  ia: () => <IAScreen/>,
  tienda: () => <TiendaScreen/>,
  comunicaciones: () => <ComunicacionesScreen/>,
  compliance: () => <ComplianceScreen/>,
  integraciones: () => <IntegracionesScreen/>,
  audit: () => <AuditScreen/>,
  equipo: () => <EquipoScreen/>,
};

function TweaksPanel({ open, tweaks, setTweaks, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', bottom:20, right:20, width:320, zIndex:200,
      background:T.elev, border:`1px solid ${T.borderWhite}`, borderRadius:16,
      boxShadow:'0 24px 60px rgba(0,0,0,.6)', padding:18,
      animation:'float-in 240ms ease',
    }}>
      <div style={{display:'flex',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:T.fontD,fontWeight:800,fontSize:14,color:'#fff',letterSpacing:'-.01em'}}>Tweaks</div>
        <div style={{marginLeft:'auto',cursor:'pointer',color:T.n400,fontSize:16}} onClick={onClose}>✕</div>
      </div>
      <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:T.n400,marginBottom:8}}>Acento principal</div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[
          {v:'#00C2D1',l:'Teal'},
          {v:'#6E5BFF',l:'Lilac'},
          {v:'#FF4D6D',l:'Coral'},
          {v:'#00E5A0',l:'Emerald'},
        ].map(o=>(
          <div key={o.v} onClick={()=>setTweaks({...tweaks, accentPrimary:o.v})}
            title={o.l}
            style={{width:36,height:36,borderRadius:10,background:o.v,cursor:'pointer',
              border:`2px solid ${tweaks.accentPrimary===o.v?'#fff':'transparent'}`,
              boxShadow:tweaks.accentPrimary===o.v?`0 0 14px ${o.v}`:'none'}}/>
        ))}
      </div>
      <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:T.n400,marginBottom:8}}>Densidad</div>
      <div style={{display:'flex',gap:6,marginBottom:16}}>
        {['compact','comfortable','spacious'].map(d=>(
          <div key={d} onClick={()=>setTweaks({...tweaks,density:d})} style={{
            flex:1,padding:'7px 8px',textAlign:'center',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',
            background:tweaks.density===d?'rgba(0,194,209,.15)':'rgba(255,255,255,.03)',
            color:tweaks.density===d?T.teal:T.n300,
            border:`1px solid ${tweaks.density===d?T.border:T.borderWhite}`,
          }}>{d}</div>
        ))}
      </div>
      <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:12,color:T.n200}}>
        <input type="checkbox" checked={tweaks.showGrain} onChange={e=>setTweaks({...tweaks,showGrain:e.target.checked})}/>
        Grano de textura en fondo
      </label>
    </div>
  );
}

function App() {
  const [active, setActive] = useStateApp(() => localStorage.getItem('cumplefy-active') || 'overview');
  const [tweaksOpen, setTweaksOpen] = useStateApp(false);
  const [tweaks, setTweaks] = useStateApp(TWEAK_DEFAULTS);
  const [dataReady, setDataReady] = useStateApp(false);
  const [dataError, setDataError] = useStateApp(null);

  useEffectApp(() => {
    fetch('/api/admin/data')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        window.USERS         = d.users        || [];
        window.EVENTS        = d.events       || [];
        window.TRANSACTIONS  = d.transactions || [];
        window.ADMIN_KPIS    = d.kpis         || {};
        window.EVENTS_CHART  = d.eventsChart  || Array(30).fill(0);
        window.REVENUE_CHART = d.revenueChart || Array(30).fill(0);
        window.ACTIVE_JOBS   = d.activeJobs   || [];
        window.AUDIT_LOG     = d.auditLog     || [];
        setDataReady(true);
      })
      .catch(err => {
        console.error('Admin data load failed:', err);
        setDataError(err.message);
        setDataReady(true); // render anyway with empty data
      });
  }, []);

  useEffectApp(() => { localStorage.setItem('cumplefy-active', active); }, [active]);

  // Apply tweaks live
  useEffectApp(() => {
    document.documentElement.style.setProperty('--teal', tweaks.accentPrimary);
    if (!tweaks.showGrain) {
      document.body.style.setProperty('--grain-opacity','0');
      const s = document.createElement('style');
      s.id = 'grain-off';
      s.textContent = 'body::after{display:none !important}';
      if (!document.getElementById('grain-off')) document.head.appendChild(s);
    } else {
      const s = document.getElementById('grain-off');
      if (s) s.remove();
    }
  }, [tweaks]);

  // Tweaks toolbar integration
  useEffectApp(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({type:'__edit_mode_available'}, '*'); } catch(e){}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffectApp(() => {
    try {
      window.parent.postMessage({type:'__edit_mode_set_keys', edits: tweaks}, '*');
    } catch(e){}
  }, [tweaks]);

  const Screen = SCREEN_MAP[active] || SCREEN_MAP.overview;

  if (!dataReady) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,color:T.n300}}>
        <div style={{width:36,height:36,border:`3px solid ${T.border}`,borderTopColor:T.teal,borderRadius:'50%',animation:'spin 700ms linear infinite'}}/>
        <div style={{fontSize:13,letterSpacing:'.04em'}}>Cargando datos de la plataforma…</div>
      </div>
    );
  }

  return (
    <div style={{animation:'fade-up 240ms ease'}} key={active}>
      {dataError && (
        <div style={{position:'fixed',top:12,right:12,zIndex:999,padding:'8px 14px',borderRadius:10,background:'rgba(255,77,109,.15)',border:'1px solid rgba(255,77,109,.4)',fontSize:12,color:'#FF8AA0'}}>
          ⚠ Error al cargar datos: {dataError}
        </div>
      )}
      <AdminShell active={active} setActive={setActive}>
        <Screen/>
      </AdminShell>
      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={()=>setTweaksOpen(false)}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
