/** @jsx React.createElement */

const IA_JOBS = [
  {id:'j1', ev:'Cumpleaños de Sofía',   mode:'visual', model:'Seedance 2.0', provider:'Kie.ai', taskId:'task_abc12K9', status:'processing', pct:72, elapsed:154, regen:'2/5'},
  {id:'j2', ev:'Bautizo de Lola',        mode:'visual', model:'Kling 3.0',    provider:'Kie.ai', taskId:'task_df87HPq', status:'processing', pct:23, elapsed:48,  regen:'1/5'},
  {id:'j3', ev:'Despedida Javier',       mode:'lipsync',model:'Lipsync v2',   provider:'FAL',    taskId:'fal_21bH7wm',  status:'processing', pct:41, elapsed:72,  regen:'3/5'},
  {id:'j4', ev:'Graduación Pablo',       mode:'visual', model:'Seedance 2.0', provider:'Kie.ai', taskId:'task_qr93NLp', status:'published',  pct:100,elapsed:380, regen:'0/5'},
  {id:'j5', ev:'Comunión de Diego',      mode:'lipsync',model:'Lipsync v2',   provider:'FAL',    taskId:'fal_8XmZ93k',  status:'published',  pct:100,elapsed:290, regen:'1/5'},
  {id:'j6', ev:'Boda Lucía & Marco',     mode:'visual', model:'Seedance 2.0', provider:'Kie.ai', taskId:'task_pm21KLn', status:'failed',     pct:0,  elapsed:12,  regen:'2/5'},
  {id:'j7', ev:'Cumpleaños Martín · 40', mode:'visual', model:'Kling 3.0',    provider:'Kie.ai', taskId:'task_zn43ABc', status:'draft',      pct:0,  elapsed:0,   regen:'0/5'},
];

function StatusPill({ s }) {
  const map = {
    processing:{c:T.gold,   l:'● Generando'},
    published: {c:T.emerald,l:'✓ Publicado'},
    failed:    {c:T.coral,  l:'✕ Fallido'},
    draft:     {c:T.n400,   l:'· Draft'},
  };
  const v = map[s] || map.draft;
  return <Pill color={v.c}>{v.l}</Pill>;
}

function IAScreen() {
  const [status, setStatus] = useState('all');
  const [mode, setMode] = useState('all');
  const [provider, setProvider] = useState('all');
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setTick(x=>x+1),1000); return ()=>clearInterval(t); },[]);

  const liveJobs = IA_JOBS.filter(j=>j.status==='processing' || j.status==='failed');
  const rows = IA_JOBS.filter(j =>
    (status==='all'||j.status===status) &&
    (mode==='all'||j.mode===mode) &&
    (provider==='all'||j.provider===provider) &&
    (!q||j.ev.toLowerCase().includes(q.toLowerCase()))
  );

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div>
      <SectionTitle subtitle="Monitorización de producción IA · jobs en tiempo real">IA / Video Projects</SectionTitle>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:22}}>
        <KPI label="Jobs activos ahora" value="7"      accent={T.emerald} icon="●" live sub="Actualizado cada 10s"/>
        <KPI label="Completados hoy"    value="43"     accent={T.teal}    icon="✓" sub="23 visual · 20 lipsync"/>
        <KPI label="Tasa de error 24h"  value="4.2%"   accent={T.gold}    icon="⚠" sub="Objetivo: <5%" delta="2 fallos en última hora" deltaColor={T.orange}/>
        <KPI label="Costo API estimado" value="€127.40" accent={T.lilac}   icon="€" sub="Abril · acumulado del mes"/>
      </div>

      {/* Live jobs panel */}
      <Card padding={22} style={{borderColor:'rgba(0,229,160,.3)', boxShadow:'0 8px 40px rgba(0,0,0,.35), 0 0 40px rgba(0,229,160,.08)',marginBottom:22}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <div style={{
            width:36,height:36,borderRadius:10,
            background:'rgba(0,229,160,.14)',border:`1px solid rgba(0,229,160,.3)`,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,
            animation:'glow-breathe 3s ease-in-out infinite',
          }}>🎬</div>
          <div>
            <div style={{fontFamily:T.fontD,fontSize:17,fontWeight:700,letterSpacing:'-.02em',color:'#fff'}}>Jobs en procesamiento</div>
            <div style={{fontSize:11.5,color:T.emerald,display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <Dot color={T.emerald} pulse size={6}/> Actualizado hace {tick%10}s
            </div>
          </div>
          <div style={{marginLeft:'auto',fontSize:12,color:T.n400}}>Polling cada 10s · Kie.ai + FAL</div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {liveJobs.map(j=>(
            <div key={j.id} style={{
              padding:'14px 16px',borderRadius:12,
              background: j.status==='failed'?'rgba(255,77,109,.06)':'rgba(0,229,160,.04)',
              border:`1px solid ${j.status==='failed'?'rgba(255,77,109,.3)':'rgba(0,229,160,.2)'}`,
              display:'grid',gridTemplateColumns:'30px 1.8fr 1fr 1.2fr 1fr 100px',gap:14,alignItems:'center',
            }}>
              <div style={{width:28,height:28,borderRadius:8,background:j.provider==='Kie.ai'?'rgba(0,194,209,.14)':'rgba(167,139,250,.14)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:j.provider==='Kie.ai'?T.teal:T.lilac}}>
                {j.provider==='Kie.ai'?'K':'F'}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{j.ev}</div>
                <div style={{fontSize:11,color:T.n400,fontFamily:T.fontM,marginTop:2}}>{j.taskId}</div>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.n200}}>{j.model}</div>
                <div style={{fontSize:10.5,color:T.n400,textTransform:'uppercase',letterSpacing:'.08em'}}>{j.mode}</div>
              </div>
              <div>
                {j.status==='processing' ? (
                  <>
                    <Progress value={j.pct} color={T.emerald}/>
                    <div style={{fontSize:10.5,color:T.emerald,fontWeight:700,marginTop:5,display:'flex',alignItems:'center',gap:6}}>
                      <span style={{display:'inline-block',width:10,height:10,border:`2px solid ${T.emerald}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin .9s linear infinite'}}/>
                      Generando… {j.pct}%
                    </div>
                  </>
                ) : (
                  <div style={{fontSize:12,fontWeight:700,color:T.coral}}>✕ Error de modelo</div>
                )}
              </div>
              <div style={{fontSize:12,fontFamily:T.fontM,color:T.n300}}>{fmt(j.elapsed+(j.status==='processing'?tick:0))}</div>
              <Button size="sm" variant={j.status==='failed'?'primary':'ghost'} disabled={j.status==='processing'}>{j.status==='failed'?'Retry':'En curso'}</Button>
            </div>
          ))}
        </div>
      </Card>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <Input value={q} onChange={setQ} placeholder="Buscar por evento…" icon={<span>🔍</span>} width={260}/>
        <Select label="Estado" value={status} onChange={setStatus} options={[{v:'all',l:'Todos'},{v:'processing',l:'Generando'},{v:'published',l:'Publicado'},{v:'failed',l:'Fallido'},{v:'draft',l:'Draft'}]}/>
        <Select label="Modo" value={mode} onChange={setMode} options={[{v:'all',l:'Todos'},{v:'visual',l:'🎬 Visual'},{v:'lipsync',l:'💬 Lipsync'}]}/>
        <Select label="Proveedor" value={provider} onChange={setProvider} options={[{v:'all',l:'Todos'},{v:'Kie.ai',l:'Kie.ai'},{v:'FAL',l:'FAL'}]}/>
      </div>

      <DataTable columns={[
        {k:'ev',label:'Evento',w:'2fr',render:j=><span style={{color:'#fff',fontWeight:600}}>{j.ev}</span>},
        {k:'mode',label:'Modo',w:'0.9fr',render:j=><Pill color={j.mode==='visual'?T.teal:T.lilac}>{j.mode==='visual'?'🎬 Visual':'💬 Lipsync'}</Pill>},
        {k:'status',label:'Estado',w:'1fr',render:j=><StatusPill s={j.status}/>},
        {k:'provider',label:'Proveedor',w:'0.8fr',render:j=><span style={{fontSize:12,color:T.n200}}>{j.provider}</span>},
        {k:'model',label:'Modelo',w:'1fr',render:j=><span style={{fontSize:12,color:T.n200,fontFamily:T.fontM}}>{j.model}</span>},
        {k:'regen',label:'Regen.',w:'0.6fr',render:j=><span style={{fontSize:12,color:T.n300}}>{j.regen}</span>},
        {k:'elapsed',label:'Iniciado',w:'0.9fr',render:j=><span style={{fontSize:11.5,color:T.n400}}>{j.elapsed?ago(Math.floor(j.elapsed/60)||1):'—'}</span>},
        {k:'act',label:'',w:'50px',align:'right',render:j=><Menu items={[
          {icon:'👁',label:'Ver detalle'},
          {icon:'↻',label:'Retry',onClick:()=>{}},
          {icon:'📋',label:'Copiar task ID'},
        ]}/>},
      ]} rows={rows}/>
    </div>
  );
}

Object.assign(window, { IAScreen });
