/** @jsx React.createElement */

function Tabs({ tabs, active, setActive }) {
  return (
    <div style={{display:'flex',gap:4,marginBottom:20,padding:4,background:'rgba(255,255,255,.02)',border:`1px solid ${T.borderWhite}`,borderRadius:12,width:'fit-content'}}>
      {tabs.map(t => (
        <button key={t.k} onClick={()=>setActive(t.k)} style={{
          padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',
          fontSize:12.5,fontWeight:600,fontFamily:T.fontB,
          background: active===t.k?'rgba(0,194,209,.14)':'transparent',
          color: active===t.k?'#fff':T.n300,
          boxShadow: active===t.k?'inset 0 0 0 1px rgba(0,194,209,.3)':'none',
          transition:'all 180ms',
        }}>{t.l}</button>
      ))}
    </div>
  );
}

function PagosScreen() {
  const [tab, setTab] = useState('unlocks');
  const unlocks = TRANSACTIONS.filter(t=>t.type==='unlock');
  const contribs = TRANSACTIONS.filter(t=>t.type==='contrib');
  const kpis = ADMIN_KPIS;
  const monthlyEur = ((kpis.monthlyRevenueCents||0) / 100).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  const feesEur = ((kpis.monthlyFeesCents||0) / 100).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
  const now = new Date();
  const mes = now.toLocaleDateString('es-ES',{month:'long',year:'numeric'});

  return (
    <div>
      <SectionTitle subtitle={`Ingresos, fees y transfers · ${mes}`}>Pagos</SectionTitle>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:22}}>
        <KPI label="Ingresos del mes" value={`€${monthlyEur}`} accent={T.emerald} icon="€" delta={`${kpis.monthlyUnlocks||0} unlocks este mes`} sub="Contribuciones + event unlocks"/>
        <KPI label="Fees plataforma"  value={`€${feesEur}`}    accent={T.gold}    icon="%" sub="3% contribuciones + unlocks plataforma"/>
        <KPI label="En tránsito"      value="€0,00"            accent={T.lilac}   icon="↻" sub="Stripe Connect · en entorno de pruebas"/>
      </div>

      <Tabs tabs={[{k:'unlocks',l:'Event Unlocks'},{k:'contribs',l:'Contributions'},{k:'summary',l:'Resumen financiero'}]} active={tab} setActive={setTab}/>

      {tab==='unlocks' && (
        <DataTable columns={[
          {k:'ev',label:'Evento',w:'2fr',render:t=><span style={{color:'#fff',fontWeight:600,fontSize:13}}>{t.ev}</span>},
          {k:'owner',label:'Owner',w:'1.5fr',render:t=><span style={{color:T.n300,fontSize:12}}>{t.user.email}</span>},
          {k:'amt',label:'Importe',w:'0.8fr',render:t=><span style={{fontFamily:T.fontD,fontSize:14,fontWeight:700,color:'#fff'}}>€{t.amt.toFixed(2)}</span>},
          {k:'pi',label:'Stripe PI',w:'1.3fr',render:t=><span style={{fontFamily:T.fontM,fontSize:11,color:T.teal,cursor:'pointer'}}>{t.pi}</span>},
          {k:'status',label:'Estado',w:'0.8fr',render:t=><Pill color={t.status==='paid'?T.emerald:T.coral}>{t.status==='paid'?'Pagado':'Fallido'}</Pill>},
          {k:'ts',label:'Fecha',w:'0.9fr',render:t=><span style={{color:T.n400,fontSize:11.5}}>{t.ts}</span>},
        ]} rows={unlocks}/>
      )}

      {tab==='contribs' && (
        <DataTable columns={[
          {k:'ev',label:'Evento',w:'1.6fr',render:t=><span style={{color:'#fff',fontWeight:600,fontSize:13}}>{t.ev}</span>},
          {k:'gift',label:'Regalo',w:'1.4fr',render:t=><span style={{color:T.n200,fontSize:12.5}}>{t.gift}</span>},
          {k:'contrib',label:'Contribuidor',w:'1fr',render:t=><span style={{color:T.n300,fontSize:12}}>{t.contribUser}</span>},
          {k:'bruto',label:'Bruto',w:'0.6fr',align:'right',render:t=><span style={{fontWeight:700,color:'#fff',fontFamily:T.fontD,fontSize:13}}>€{t.amt.toFixed(2)}</span>},
          {k:'fee',label:'Fee (3%)',w:'0.7fr',align:'right',render:t=><span style={{color:T.gold,fontSize:12,fontFamily:T.fontD,fontWeight:600}}>€{t.fee.toFixed(2)}</span>},
          {k:'neto',label:'Neto',w:'0.7fr',align:'right',render:t=><span style={{color:T.emerald,fontSize:13,fontFamily:T.fontD,fontWeight:700}}>€{(t.amt-t.fee).toFixed(2)}</span>},
          {k:'tr',label:'Transfer',w:'1fr',render:t=>t.tr?<span style={{fontFamily:T.fontM,fontSize:11,color:T.teal}}>{t.tr}</span>:<span style={{color:T.n500,fontSize:11}}>—</span>},
          {k:'status',label:'Estado',w:'0.9fr',render:t=><Pill color={t.status==='paid'?T.emerald:t.status==='pending'?T.orange:T.coral}>{t.status}</Pill>},
        ]} rows={contribs}/>
      )}

      {tab==='summary' && (
        <Card padding={24}>
          <div style={{display:'flex',alignItems:'baseline',marginBottom:16}}>
            <div>
              <Eyebrow color={T.emerald}>Resumen mensual</Eyebrow>
              <div style={{fontFamily:T.fontD,fontSize:22,fontWeight:700,color:'#fff',marginTop:4}}>Event unlocks + contribution fees</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:14,fontSize:12}}>
              <span><Dot color={T.coral}/> Event unlocks</span>
              <span><Dot color={T.gold}/> Contribution fees</span>
            </div>
          </div>
          <BarChart data={REVENUE_CHART} height={220} gradId="pg1"/>
          <div style={{textAlign:'center',marginTop:8,fontSize:11,color:T.n400}}>Últimos 30 días · ingresos reales de la plataforma</div>
        </Card>
      )}
    </div>
  );
}

Object.assign(window, { PagosScreen });
