/** @jsx React.createElement */

function AlertsStrip() {
  return (
    <div style={{
      padding:'12px 18px', borderRadius:14,
      background:`linear-gradient(90deg, rgba(255,140,66,.12), rgba(255,77,109,.06))`,
      border:`1px solid rgba(255,140,66,.35)`,
      display:'flex', alignItems:'center', gap:14, marginBottom:20,
      animation:'fade-up 400ms',
    }}>
      <div style={{
        width:32,height:32,borderRadius:10,
        background:'rgba(255,140,66,.18)',
        display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:15,
      }}>⚠️</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:'#FFB895'}}>3 video projects fallidos en las últimas 24h</div>
        <div style={{fontSize:11.5,color:T.n300,marginTop:2}}>Kie.ai · 2 jobs bloqueados en cola · 1 webhook de Resend con errores</div>
      </div>
      <Button variant="ghost" size="sm">Ver detalles →</Button>
    </div>
  );
}

function RecentList({ title, action, children }) {
  return (
    <Card padding={0} hover style={{display:'flex',flexDirection:'column'}}>
      <div style={{padding:'16px 18px',borderBottom:`1px solid ${T.borderWhite}`,display:'flex',alignItems:'center'}}>
        <div style={{fontSize:13,fontWeight:700,color:'#fff',fontFamily:T.fontD,letterSpacing:'-.01em'}}>{title}</div>
        <span style={{marginLeft:'auto',fontSize:11.5,color:T.teal,fontWeight:600,cursor:'pointer'}}>{action||'Ver todos →'}</span>
      </div>
      <div style={{flex:1}}>{children}</div>
    </Card>
  );
}

function OverviewScreen({ go }) {
  const kpis = ADMIN_KPIS;
  const evDays = EVENTS_CHART;
  const revDays = REVENUE_CHART;
  const [tick, setTick] = useState(0);
  useEffect(()=>{
    const t = setInterval(()=>setTick(x=>x+1), 1800);
    return ()=>clearInterval(t);
  },[]);

  const now = new Date();
  const subtitle = now.toLocaleDateString('es-ES', {weekday:'short', day:'numeric', month:'short', year:'numeric'}) + ' · ' + now.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'}) + 'h · Resumen global de la plataforma';
  const revenueEur = (kpis.revenueCents / 100).toLocaleString('es-ES', {minimumFractionDigits:0, maximumFractionDigits:0});
  const eventsChartTotal = evDays.reduce((a,b)=>a+b, 0);
  const revenueChartTotal = revDays.reduce((a,b)=>a+b, 0);

  return (
    <div>
      <SectionTitle subtitle={subtitle}>Overview</SectionTitle>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:22}}>
        <KPI label="Usuarios registrados" value={kpis.totalUsers.toLocaleString('es-ES')} accent={T.teal} icon="👥"
             delta={`+${kpis.newUsersWeek} esta semana`} sub="Total histórico"/>
        <KPI label="Eventos activos" value={kpis.activeEvents.toLocaleString('es-ES')} accent={T.coral} icon="🎉"
             delta={`+${kpis.newEventsWeek} esta semana`} sub={`${kpis.totalEvents} total`} deltaColor={T.emerald}/>
        <KPI label="Revenue acumulado" value={`€${revenueEur}`} accent={T.gold} icon="€"
             delta="Contribuciones + unlocks" sub="Neto después de comisiones"/>
        <KPI label="Video jobs activos" value={String(kpis.videoJobsLive)} accent={T.emerald} icon="🎬" live
             delta="En proceso ahora" sub="Kie.ai / Seedance 2.0"/>
      </div>

      {/* Actividad reciente — 3 cols */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:22}}>
        <RecentList title="Últimos usuarios" action="Ver todos →">
          {USERS.slice(0,5).map((u,i)=>(
            <div key={u.id} onClick={()=>go && go('usuarios')} style={{padding:'11px 18px',display:'flex',alignItems:'center',gap:11,cursor:'pointer',borderTop:i?`1px solid ${T.borderWhite}`:'none'}}>
              <Avatar name={u.name} size={32} grad={i%2?T.gradCoral:T.gradBrand}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.name}</div>
                <div style={{fontSize:11,color:T.n400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.email}</div>
              </div>
              <Pill color={u.plan==='pro'?T.gold:T.n400}>{u.plan.toUpperCase()}</Pill>
              <div style={{fontSize:10.5,color:T.n400,whiteSpace:'nowrap'}}>{u.reg}</div>
            </div>
          ))}
        </RecentList>

        <RecentList title="Últimos eventos" action="Ver todos →">
          {EVENTS.slice(0,5).map((ev,i)=>{
            const typ = EVENT_TYPES[ev.type];
            return (
              <div key={ev.id} onClick={()=>go && go('eventos')} style={{padding:'11px 18px',display:'flex',alignItems:'center',gap:11,cursor:'pointer',borderTop:i?`1px solid ${T.borderWhite}`:'none'}}>
                <div style={{width:34,height:34,borderRadius:10,background:typ.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{typ.e}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.title}</div>
                  <div style={{fontSize:11,color:T.n400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.owner.email}</div>
                </div>
                <Pill color={ev.pago==='paid'?T.emerald:T.orange}>{ev.pago==='paid'?'Desbloq.':'Pendiente'}</Pill>
              </div>
            );
          })}
        </RecentList>

        <RecentList title="Últimas transacciones" action="Ver todas →">
          {TRANSACTIONS.slice(0,5).map((tx,i)=>(
            <div key={tx.id} onClick={()=>go && go('pagos')} style={{padding:'11px 18px',display:'flex',alignItems:'center',gap:11,cursor:'pointer',borderTop:i?`1px solid ${T.borderWhite}`:'none'}}>
              <div style={{width:34,height:34,borderRadius:10,
                background: tx.type==='unlock'?'rgba(255,179,0,.15)':'rgba(0,194,209,.12)',
                border:`1px solid ${tx.type==='unlock'?'rgba(255,179,0,.3)':'rgba(0,194,209,.25)'}`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,
              }}>{tx.type==='unlock'?'🔓':'🎁'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:'#fff',fontFamily:T.fontD,letterSpacing:'-.01em'}}>€{tx.amt.toFixed(2)}</div>
                <div style={{fontSize:11,color:T.n400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.type==='unlock'?'Event unlock':'Contribution'} · {tx.ev}</div>
              </div>
              <Pill color={tx.status==='paid'?T.emerald: tx.status==='pending'?T.orange:T.coral}>
                {tx.status==='paid'?'Pagado': tx.status==='pending'?'Pendiente':'Fallido'}
              </Pill>
            </div>
          ))}
        </RecentList>
      </div>

      {/* Charts */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:22}}>
        <Card padding={22} hover>
          <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:14}}>
            <div>
              <Eyebrow color={T.lilac}>Eventos creados</Eyebrow>
              <div style={{fontFamily:T.fontD,fontSize:22,fontWeight:700,letterSpacing:'-.02em',color:'#fff',marginTop:4}}>Últimos 30 días</div>
            </div>
            <div style={{marginLeft:'auto',fontSize:11,color:T.n400}}>Total: <span style={{color:'#fff',fontWeight:700}}>{eventsChartTotal}</span></div>
          </div>
          <LineChart data={evDays} color={T.lilac} gradId="ovl1" height={200}/>
        </Card>
        <Card padding={22} hover>
          <div style={{display:'flex',alignItems:'baseline',gap:12,marginBottom:14}}>
            <div>
              <Eyebrow color={T.coral}>Revenue diario</Eyebrow>
              <div style={{fontFamily:T.fontD,fontSize:22,fontWeight:700,letterSpacing:'-.02em',color:'#fff',marginTop:4}}>Últimos 30 días</div>
            </div>
            <div style={{marginLeft:'auto',fontSize:11,color:T.n400}}>Total: <span style={{color:'#fff',fontWeight:700}}>€{revenueChartTotal.toLocaleString('es-ES')}</span></div>
          </div>
          <BarChart data={revDays} gradId="ovb1" height={200}/>
        </Card>
      </div>

      {/* Live production strip */}
      <Card padding={22} hover style={{borderColor:'rgba(0,229,160,.25)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:10,background:'rgba(0,229,160,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,animation:'glow-breathe 3s ease-in-out infinite'}}>🎬</div>
          <div>
            <div style={{fontFamily:T.fontD,fontSize:16,fontWeight:700,letterSpacing:'-.02em',color:'#fff'}}>Producción IA en vivo</div>
            <div style={{fontSize:11.5,color:T.emerald,display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <Dot color={T.emerald} pulse size={6}/> Actualizado hace {(tick%60)}s
            </div>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:10}}>
            <Pill color={T.emerald}>● {kpis.videoJobsLive} generando</Pill>
          </div>
        </div>
        {ACTIVE_JOBS.length === 0 ? (
          <div style={{textAlign:'center',padding:'24px 0',color:T.n400,fontSize:13}}>
            No hay jobs activos en este momento
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {ACTIVE_JOBS.slice(0,3).map((j,i)=>(
              <div key={j.id||i} style={{padding:14,borderRadius:12,background:'rgba(0,229,160,.05)',border:`1px solid rgba(0,229,160,.2)`}}>
                <div style={{fontSize:12.5,fontWeight:700,color:'#fff',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Job #{(j.id||'').slice(-6)}</div>
                <div style={{fontSize:11,color:T.n300,marginBottom:10,fontFamily:T.fontM}}>{j.model}</div>
                <Pill color={T.emerald}><Dot color={T.emerald} pulse size={6}/> Procesando</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

Object.assign(window, { OverviewScreen });
