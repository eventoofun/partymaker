/** @jsx React.createElement */

const ORDERS = [
  {id:'#ORD-2847', ev:'Cumpleaños de Sofía', owner:'lucia.perez@gmail.com', cliente:'Ana T.',    items:2, amt:47.90, status:'in_production', ts:'15 abr · 11:20'},
  {id:'#ORD-2846', ev:'Boda Lucía & Marco',  owner:'marco.fdez@hotmail.com',cliente:'Marco F.',  items:4, amt:128.00,status:'shipped',       ts:'14 abr · 09:48'},
  {id:'#ORD-2845', ev:'Graduación Pablo',    owner:'ana.torres@outlook.es', cliente:'Ana T.',    items:1, amt:22.50, status:'paid',          ts:'14 abr · 18:02'},
  {id:'#ORD-2844', ev:'Bautizo de Lola',     owner:'pablo.g@cumplefy.com',  cliente:'Pablo G.',  items:3, amt:67.30, status:'delivered',     ts:'12 abr · 15:10'},
  {id:'#ORD-2843', ev:'Comunión de Diego',   owner:'sofiadelgado@icloud.com',cliente:'Sofía D.', items:2, amt:54.80, status:'pending_payment',ts:'13 abr · 20:30'},
  {id:'#ORD-2842', ev:'Despedida Javier',    owner:'javi.ruiz@gmail.com',   cliente:'Pedro V.',  items:1, amt:18.90, status:'draft',         ts:'10 abr · 08:12'},
];

const STATUS_MAP = {
  draft:           {l:'Draft', c:T.n400},
  pending_payment: {l:'Pendiente pago', c:T.orange},
  paid:            {l:'Pagado', c:T.teal},
  in_production:   {l:'En producción', c:T.lilac},
  shipped:         {l:'Enviado', c:T.gold},
  delivered:       {l:'Entregado', c:T.emerald},
};

function Pipeline({ active = 'in_production' }) {
  const stages = ['draft','pending_payment','paid','in_production','shipped','delivered'];
  const counts = {draft:3, pending_payment:5, paid:8, in_production:6, shipped:4, delivered:8};
  return (
    <Card padding={20} hover style={{marginBottom:20}}>
      <Eyebrow color={T.lilac}>Pipeline de órdenes</Eyebrow>
      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:14}}>
        {stages.map((s,i)=>{
          const v = STATUS_MAP[s];
          const isActive = s===active;
          return (
            <React.Fragment key={s}>
              <div style={{flex:1,padding:'12px 10px',borderRadius:12,
                background: isActive?`${v.c}22`:'rgba(255,255,255,.03)',
                border:`1px solid ${isActive?v.c+'55':T.borderWhite}`,
                textAlign:'center',position:'relative',
                boxShadow: isActive?`0 0 20px ${v.c}33`:'none',
              }}>
                <div style={{fontSize:11,fontWeight:700,color:isActive?v.c:T.n300,textTransform:'uppercase',letterSpacing:'.06em'}}>{v.l}</div>
                <div style={{fontFamily:T.fontD,fontSize:22,fontWeight:800,color:isActive?'#fff':T.n200,marginTop:4,letterSpacing:'-.03em'}}>{counts[s]}</div>
              </div>
              {i<stages.length-1 && <span style={{color:T.n500,fontSize:14}}>→</span>}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}

function TiendaScreen() {
  const [tab, setTab] = useState('orders');
  return (
    <div>
      <SectionTitle subtitle="Órdenes y productos de la tienda">Tienda / Órdenes</SectionTitle>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:22}}>
        <KPI label="Órdenes este mes"       value="34"    accent={T.teal}    icon="📦" delta="+6 vs. marzo"/>
        <KPI label="Revenue tienda"         value="€2,140" accent={T.emerald} icon="€"  delta="+€320 esta semana"/>
        <KPI label="Pendientes de envío"   value="8"     accent={T.orange}  icon="🚚" sub="2 llevan >7 días en producción"/>
      </div>

      <Tabs tabs={[{k:'orders',l:'Órdenes'},{k:'products',l:'Productos'}]} active={tab} setActive={setTab}/>

      {tab==='orders' && <>
        <Pipeline/>
        <DataTable columns={[
          {k:'id',label:'Orden',w:'1fr',render:o=><span style={{fontFamily:T.fontM,color:'#fff',fontWeight:700,fontSize:12}}>{o.id}</span>},
          {k:'ev',label:'Evento',w:'1.6fr',render:o=><span style={{color:'#fff',fontWeight:600,fontSize:13}}>{o.ev}</span>},
          {k:'cli',label:'Cliente',w:'1.4fr',render:o=><div><div style={{fontSize:12.5,color:T.n200,fontWeight:600}}>{o.cliente}</div><div style={{fontSize:11,color:T.n400}}>{o.owner}</div></div>},
          {k:'items',label:'Items',w:'0.6fr',render:o=><span style={{color:T.n200}}>{o.items}</span>},
          {k:'amt',label:'Importe',w:'0.8fr',render:o=><span style={{fontFamily:T.fontD,fontWeight:700,color:'#fff'}}>€{o.amt.toFixed(2)}</span>},
          {k:'status',label:'Estado',w:'1.2fr',render:o=><Pill color={STATUS_MAP[o.status].c}>{STATUS_MAP[o.status].l}</Pill>},
          {k:'ts',label:'Fecha',w:'1fr',render:o=><span style={{fontSize:11.5,color:T.n400}}>{o.ts}</span>},
          {k:'act',label:'',w:'50px',align:'right',render:o=><Menu items={[{icon:'👁',label:'Ver detalle'},{icon:'🚚',label:'Marcar enviado'},{icon:'✕',label:'Cancelar',danger:true}]}/>},
        ]} rows={ORDERS}/>
      </>}

      {tab==='products' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          {[
            {n:'Taza personalizada · Sofía',ev:'Cumple de Sofía',type:'POD_2D',var:'3 variantes',st:'active',c:T.coral,i:'☕'},
            {n:'Camiseta equipo despedida',ev:'Despedida Javier',type:'POD_2D',var:'4 tallas',st:'active',c:T.gold,i:'👕'},
            {n:'Figura 3D · Boda L&M',ev:'Boda Lucía & Marco',type:'POD_3D',var:'2 variantes',st:'active',c:T.lilac,i:'🎭'},
            {n:'Marco enmarcado',ev:'Bautizo de Lola',type:'CUSTOM',var:'Único',st:'active',c:T.teal,i:'🖼️'},
            {n:'Tote bag graduación',ev:'Graduación Pablo',type:'POD_2D',var:'2 colores',st:'archived',c:T.n400,i:'👜'},
            {n:'Álbum fotográfico',ev:'Comunión de Diego',type:'CUSTOM',var:'Único',st:'active',c:T.emerald,i:'📖'},
          ].map((p,i)=>(
            <Card key={i} hover padding={0} style={{overflow:'hidden'}}>
              <div style={{height:120,background:`linear-gradient(135deg, ${p.c}40 0%, ${p.c}10 100%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:42}}>{p.i}</div>
              <div style={{padding:16}}>
                <Pill color={p.type==='POD_2D'?T.teal:p.type==='POD_3D'?T.lilac:T.gold}>{p.type}</Pill>
                <div style={{fontSize:14,fontWeight:700,color:'#fff',marginTop:10,fontFamily:T.fontD,letterSpacing:'-.01em'}}>{p.n}</div>
                <div style={{fontSize:12,color:T.n400,marginTop:4}}>{p.ev}</div>
                <div style={{display:'flex',alignItems:'center',marginTop:12}}>
                  <span style={{fontSize:11.5,color:T.n300}}>{p.var}</span>
                  <Pill color={p.st==='active'?T.emerald:T.n400} style={{marginLeft:'auto'}}>{p.st}</Pill>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TiendaScreen });
