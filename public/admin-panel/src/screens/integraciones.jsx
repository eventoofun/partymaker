/** @jsx React.createElement */

const INTEGRATIONS = [
  {k:'stripe',   name:'Stripe Webhooks',  i:'💳', status:'ok',    last:'payment_intent.succeeded · hace 4 min', m:[{l:'Errores 24h',v:'0',c:T.emerald},{l:'Eventos hoy',v:'127',c:T.n100},{l:'Latencia p95',v:'180ms',c:T.teal}]},
  {k:'clerk',    name:'Clerk Webhooks',   i:'🔑', status:'ok',    last:'user.created · hace 12 min', m:[{l:'Sync pendientes',v:'0',c:T.emerald},{l:'Eventos hoy',v:'34',c:T.n100},{l:'Latencia p95',v:'210ms',c:T.teal}]},
  {k:'kieai',    name:'Kie.ai',           i:'🎬', status:'warn',  last:'task completed · hace 42s', m:[{l:'Jobs activos',v:'7',c:T.emerald},{l:'Error rate 24h',v:'4.2%',c:T.orange},{l:'Latencia media',v:'4.2 min',c:T.n100}]},
  {k:'resend',   name:'Resend (Email)',   i:'📧', status:'err',   last:'delivery.failed · hace 18 min', m:[{l:'Enviados hoy',v:'284',c:T.n100},{l:'Bounce rate',v:'2.8%',c:T.orange},{l:'Último error',v:'SPF fail',c:T.coral}]},
  {k:'supabase', name:'Supabase Storage', i:'🗄️', status:'ok',    last:'upload.success · hace 1 min', m:[{l:'Uso',v:'12.4 / 50 GB',c:T.teal},{l:'Archivos hoy',v:'+43',c:T.n100},{l:'Requests hoy',v:'8.2k',c:T.n100}]},
  {k:'r2',       name:'Cloudflare R2',    i:'☁️', status:'ok',    last:'put.success · hace 3 min', m:[{l:'Uso',v:'8.2 GB',c:T.lilac},{l:'Requests hoy',v:'1,247',c:T.n100},{l:'Bandwidth',v:'4.1 GB',c:T.n100}]},
];

const STATUS_STY = {
  ok:   {c:T.emerald, l:'Operativo', dot:true,  bg:'rgba(0,229,160,.06)', border:'rgba(0,229,160,.25)'},
  warn: {c:T.gold,    l:'Degradado', dot:true,  bg:'rgba(255,179,0,.06)', border:'rgba(255,179,0,.3)'},
  err:  {c:T.coral,   l:'Error',     dot:true,  bg:'rgba(255,77,109,.06)',border:'rgba(255,77,109,.3)'},
};

function IntegrationCard({ it, expanded, onToggle }) {
  const s = STATUS_STY[it.status];
  return (
    <Card padding={0} hover style={{borderColor:s.border, boxShadow:`0 8px 30px rgba(0,0,0,.4), 0 0 0 1px ${s.border}`, overflow:'hidden'}}>
      <div style={{padding:18, background:s.bg}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:'rgba(255,255,255,.06)',border:`1px solid ${s.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{it.i}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:'#fff',fontFamily:T.fontD,letterSpacing:'-.01em'}}>{it.name}</div>
            <div style={{fontSize:11,color:T.n400,marginTop:2}}>{it.last}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 11px',borderRadius:9999,background:`${s.c}22`,border:`1px solid ${s.c}66`}}>
            <Dot color={s.c} pulse/>
            <span style={{fontSize:11,fontWeight:700,color:s.c,letterSpacing:'.04em'}}>{s.l}</span>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:0,borderTop:`1px solid ${T.borderWhite}`}}>
        {it.m.map((x,i)=>(
          <div key={i} style={{padding:'14px 16px',borderRight:i<2?`1px solid ${T.borderWhite}`:'none'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:T.n400}}>{x.l}</div>
            <div style={{fontFamily:T.fontD,fontSize:18,fontWeight:800,letterSpacing:'-.03em',color:x.c,marginTop:4}}>{x.v}</div>
          </div>
        ))}
      </div>
      <div onClick={onToggle} style={{padding:'10px 16px',borderTop:`1px solid ${T.borderWhite}`,display:'flex',alignItems:'center',cursor:'pointer',fontSize:12,color:T.teal,fontWeight:600}}>
        <span>{expanded?'▼':'▶'} {expanded?'Ocultar':'Ver'} eventos recientes</span>
      </div>
      {expanded && (
        <div style={{padding:'4px 16px 16px',borderTop:`1px solid ${T.borderWhite}`,background:'rgba(0,0,0,.2)'}}>
          {[
            {t:'hace 42s', e:'event.success', p:`{"id":"evt_abc123","type":"${it.k}.ok"}`},
            {t:'hace 2 min', e:'event.success', p:`{"id":"evt_xyz987","status":200}`},
            {t:'hace 4 min', e:'event.success', p:`{"id":"evt_qrs456","status":200}`},
            {t:'hace 8 min', e:it.status==='err'?'event.failed':'event.success', p:`{"id":"evt_lmn321"}`},
          ].map((l,i)=>(
            <div key={i} style={{padding:'6px 0',borderTop:i?'1px dashed rgba(255,255,255,.04)':'none',fontFamily:T.fontM,fontSize:10.5,color:T.n300,display:'flex',gap:10}}>
              <span style={{color:T.n500,flexShrink:0,width:70}}>{l.t}</span>
              <span style={{color:l.e.includes('failed')?T.coral:T.emerald,flexShrink:0}}>{l.e}</span>
              <span style={{color:T.n400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>{l.p}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function IntegracionesScreen() {
  const [expanded, setExpanded] = useState('kieai');
  const errs = INTEGRATIONS.filter(i=>i.status!=='ok').length;

  return (
    <div>
      <SectionTitle subtitle={errs>0?`${errs} integraciones con atención requerida`:'Todos los sistemas operativos'}
        right={<Pill color={errs>0?T.gold:T.emerald} strong={false}><Dot color={errs>0?T.gold:T.emerald} pulse/> {errs>0?`${errs} alertas`:'Todo OK'}</Pill>}>Integraciones</SectionTitle>

      <div style={{display:'flex',borderRadius:10,overflow:'hidden',height:12,marginBottom:22,border:`1px solid ${T.borderWhite}`,background:T.card}}>
        {INTEGRATIONS.map(it=>{
          const s = STATUS_STY[it.status];
          return <div key={it.k} style={{flex:1,background:s.c,opacity:.65}} title={`${it.name} · ${s.l}`}/>;
        })}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {INTEGRATIONS.map(it=>(
          <IntegrationCard key={it.k} it={it} expanded={expanded===it.k} onToggle={()=>setExpanded(expanded===it.k?null:it.k)}/>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { IntegracionesScreen });
