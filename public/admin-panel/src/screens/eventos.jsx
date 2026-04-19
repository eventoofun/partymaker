/** @jsx React.createElement */

function EventDetailModal({ ev, onClose }) {
  if (!ev) return null;
  const typ = EVENT_TYPES[ev.type];
  return (
    <Modal open={!!ev} onClose={onClose} width={780}>
      <div style={{padding:'0',borderBottom:`1px solid ${T.borderWhite}`}}>
        <div style={{padding:'28px 28px 24px',background:typ.grad,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 80% 20%, rgba(255,255,255,.25), transparent 50%)'}}/>
          <div style={{position:'relative',display:'flex',alignItems:'flex-start',gap:16}}>
            <div style={{width:60,height:60,borderRadius:16,background:'rgba(255,255,255,.22)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30}}>{typ.e}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.78)'}}>{typ.l}</div>
              <div style={{fontFamily:T.fontD,fontSize:24,fontWeight:800,letterSpacing:'-.03em',color:'#fff',marginTop:4}}>{ev.title}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,.9)',marginTop:6}}>📅 {ev.date} · 📍 Madrid · /e/{ev.slug}</div>
            </div>
            <IconBtn onClick={onClose} icon={<span style={{fontSize:18,color:'#fff'}}>✕</span>}/>
          </div>
        </div>
      </div>
      <div style={{padding:'22px 26px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:22}}>
          {[{l:'Invitados',v:ev.total,c:T.teal},{l:'Confirmados',v:ev.guests,c:T.emerald},{l:'Pendientes',v:ev.total-ev.guests-3,c:T.gold},{l:'Declinados',v:3,c:T.coral}].map(s=>(
            <div key={s.l} style={{padding:14,borderRadius:12,background:'rgba(255,255,255,.02)',border:`1px solid ${T.borderWhite}`}}>
              <div style={{fontSize:10.5,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:T.n400}}>{s.l}</div>
              <div style={{fontFamily:T.fontD,fontSize:28,fontWeight:800,letterSpacing:'-.035em',color:s.c,marginTop:4}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          <div style={{padding:14,borderRadius:12,background:'rgba(0,194,209,.06)',border:`1px solid ${T.border}`}}>
            <div style={{fontSize:11,color:T.n400,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em'}}>Regalos recaudados</div>
            <div style={{fontFamily:T.fontD,fontSize:22,fontWeight:800,color:T.teal,marginTop:4}}>€340</div>
            <div style={{fontSize:11.5,color:T.n300,marginTop:2}}>7 contribuciones · 12 regalos en lista</div>
          </div>
          <div style={{padding:14,borderRadius:12,background:'rgba(255,179,0,.06)',border:`1px solid rgba(255,179,0,.3)`}}>
            <div style={{fontSize:11,color:T.n400,fontWeight:600,textTransform:'uppercase',letterSpacing:'.08em'}}>Presupuesto</div>
            <div style={{fontFamily:T.fontD,fontSize:22,fontWeight:800,color:T.gold,marginTop:4}}>€2,400 <span style={{fontSize:14,color:T.n400,fontWeight:500}}>/ €3,000</span></div>
            <div style={{marginTop:6}}><Progress value={80} color={T.gold}/></div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <Button variant="ghost">🌐 Ver página pública</Button>
          <Button variant="teal">Ver panel completo →</Button>
        </div>
      </div>
    </Modal>
  );
}

function EventosScreen() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [pago, setPago] = useState('all');
  const [sel, setSel] = useState(null);
  const rows = EVENTS.filter(ev =>
    (!q || ev.title.toLowerCase().includes(q.toLowerCase()) || ev.slug.includes(q.toLowerCase())) &&
    (type==='all' || ev.type===type) &&
    (status==='all' || ev.status===status) &&
    (pago==='all' || ev.pago===pago)
  );

  const cols = [
    {k:'title', label:'Evento', w:'2.6fr', render: ev => {
      const typ = EVENT_TYPES[ev.type];
      return (
        <div style={{display:'flex',alignItems:'center',gap:11,minWidth:0}}>
          <div style={{width:36,height:36,borderRadius:10,background:typ.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{typ.e}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.title}</div>
            <div style={{fontSize:11,color:T.n400,fontFamily:T.fontM,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>/{ev.slug}</div>
          </div>
        </div>
      );
    }},
    {k:'owner', label:'Owner', w:'1.4fr', render: ev => (
      <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
        <Avatar name={ev.owner.name} size={26}/>
        <span style={{fontSize:12,color:T.n200,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.owner.email}</span>
      </div>
    )},
    {k:'guests', label:'Invitados', w:'1fr', render: ev => (
      <div>
        <div style={{fontSize:12,color:'#fff',fontWeight:600,marginBottom:4}}>{ev.guests} / {ev.total}</div>
        <Progress value={(ev.guests/Math.max(ev.total,1))*100} color={T.teal}/>
      </div>
    )},
    {k:'rsvp', label:'RSVP', w:'0.8fr', render: ev => (
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:13,fontWeight:700,color:ev.rsvp>=50?T.emerald:ev.rsvp>0?T.gold:T.n400}}>{ev.rsvp}%</span>
      </div>
    )},
    {k:'pago', label:'Pago', w:'0.9fr', render: ev => (
      <Pill color={ev.pago==='paid'?T.emerald:T.orange}>{ev.pago==='paid'?'✅ Desbloq.':'🔒 Pendiente'}</Pill>
    )},
    {k:'status', label:'Status', w:'0.9fr', render: ev => (
      <Pill color={ev.status==='published'?T.teal:ev.status==='draft'?T.n400:T.lilac}>
        {ev.status==='published'?'Publicado':ev.status==='draft'?'Draft':'Archivado'}
      </Pill>
    )},
    {k:'ia', label:'IA', w:'0.7fr', render: ev => ev.videos ? (
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <Dot color={ev.videoStatus==='ok'?T.emerald:ev.videoStatus==='processing'?T.gold:T.coral} pulse={ev.videoStatus==='processing'}/>
        <span style={{fontSize:12,color:T.n200}}>{ev.videos}</span>
      </div>
    ) : <span style={{color:T.n500,fontSize:11}}>—</span>},
    {k:'act', label:'', w:'50px', align:'right', render: ev => <Menu items={[
      {icon:'🌐', label:'Ver página pública'},
      {icon:'👁', label:'Ver detalle', onClick: ()=>setSel(ev)},
      {icon:'🔓', label:'Forzar desbloqueo'},
      {divider:true},
      {icon:'📦', label:'Archivar'},
      {icon:'🗑', label:'Eliminar', danger:true},
    ]}/>},
  ];

  return (
    <div>
      <SectionTitle subtitle={`${rows.length} de ${EVENTS.length} eventos en la plataforma`}
        right={<Button variant="teal" icon="↓">Exportar</Button>}>Eventos</SectionTitle>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <Input value={q} onChange={setQ} placeholder="Buscar por título o slug…"
          icon={<span style={{fontSize:13}}>🔍</span>} width={300}/>
        <Select label="Tipo" value={type} onChange={setType} options={[
          {v:'all',l:'Todos'},...Object.entries(EVENT_TYPES).map(([k,v])=>({v:k,l:`${v.e} ${v.l}`}))]}/>
        <Select label="Estado" value={status} onChange={setStatus} options={[
          {v:'all',l:'Todos'},{v:'published',l:'Publicado'},{v:'draft',l:'Draft'},{v:'archived',l:'Archivado'}]}/>
        <Select label="Pago" value={pago} onChange={setPago} options={[
          {v:'all',l:'Todos'},{v:'paid',l:'Desbloqueado'},{v:'unpaid',l:'Pendiente'}]}/>
      </div>

      <DataTable columns={cols} rows={rows} onRowClick={setSel}/>
      <EventDetailModal ev={sel} onClose={()=>setSel(null)}/>
    </div>
  );
}

Object.assign(window, { EventosScreen });
