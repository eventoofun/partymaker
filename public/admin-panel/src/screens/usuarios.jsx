/** @jsx React.createElement */

function UserDetailModal({ user, onClose }) {
  const [tab, setTab] = useState('events');
  if (!user) return null;
  const userEvents = EVENTS.filter(e=>e.owner.id===user.id);
  const userTx = TRANSACTIONS.filter(t=>t.user.id===user.id);
  return (
    <Modal open={!!user} onClose={onClose} width={720} label="User detail">
      <div style={{padding:'24px 26px 18px',borderBottom:`1px solid ${T.borderWhite}`,display:'flex',alignItems:'center',gap:16}}>
        <Avatar name={user.name} size={56} grad={T.gradBrand} glow/>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontFamily:T.fontD,fontSize:20,fontWeight:700,letterSpacing:'-.02em',color:'#fff'}}>{user.name}</div>
            <Pill color={user.plan==='pro'?T.gold:T.n400} strong={user.plan==='pro'}>{user.plan.toUpperCase()}</Pill>
          </div>
          <div style={{fontSize:12.5,color:T.n300,marginTop:4}}>{user.email} · Miembro desde {user.regFull}</div>
        </div>
        <IconBtn onClick={onClose} icon={<span style={{fontSize:18}}>✕</span>}/>
      </div>
      <div style={{display:'flex',gap:4,padding:'12px 20px 0',borderBottom:`1px solid ${T.borderWhite}`}}>
        {[{k:'events',l:`Eventos (${userEvents.length})`},{k:'tx',l:`Transacciones (${userTx.length})`},{k:'videos',l:'Video Projects'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'10px 14px',background:'transparent',border:'none',cursor:'pointer',
            fontSize:12.5,fontWeight:600,
            color:tab===t.k?'#fff':T.n400,
            borderBottom:`2px solid ${tab===t.k?T.teal:'transparent'}`,marginBottom:-1,
          }}>{t.l}</button>
        ))}
      </div>
      <div style={{padding:'16px 20px',overflowY:'auto',maxHeight:380}}>
        {tab==='events' && (userEvents.length ? userEvents.map(ev=>{
          const typ = EVENT_TYPES[ev.type];
          return (
            <div key={ev.id} style={{padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,.02)',border:`1px solid ${T.borderWhite}`,marginBottom:8,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:typ.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{typ.e}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:'#fff'}}>{ev.title}</div>
                <div style={{fontSize:11.5,color:T.n400,marginTop:2}}>{ev.date} · {ev.guests}/{ev.total} invitados</div>
              </div>
              <Pill color={ev.status==='published'?T.emerald:ev.status==='draft'?T.n400:T.lilac}>{ev.status}</Pill>
            </div>
          );
        }) : <div style={{padding:'32px',textAlign:'center',color:T.n400,fontSize:13}}>Sin eventos</div>)}
        {tab==='tx' && (userTx.length ? userTx.map(tx=>(
          <div key={tx.id} style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,.02)',border:`1px solid ${T.borderWhite}`,marginBottom:6,display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',fontFamily:T.fontD,minWidth:60}}>€{tx.amt.toFixed(2)}</div>
            <div style={{flex:1,fontSize:12,color:T.n300}}>{tx.type==='unlock'?'Event unlock':'Contribución'} · {tx.ev}</div>
            <span style={{fontSize:11,color:T.n400,fontFamily:T.fontM}}>{tx.ts}</span>
            <Pill color={tx.status==='paid'?T.emerald:tx.status==='pending'?T.orange:T.coral}>{tx.status}</Pill>
          </div>
        )) : <div style={{padding:'32px',textAlign:'center',color:T.n400,fontSize:13}}>Sin transacciones</div>)}
        {tab==='videos' && <div style={{padding:'32px',textAlign:'center',color:T.n400,fontSize:13}}>3 proyectos · todos publicados</div>}
      </div>
    </Modal>
  );
}

function UsuariosScreen() {
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('all');
  const [stripe, setStripe] = useState('all');
  const [sel, setSel] = useState(null);
  const rows = USERS.filter(u =>
    (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())) &&
    (plan==='all' || u.plan===plan) &&
    (stripe==='all' || (stripe==='yes' ? u.stripe : !u.stripe))
  );

  const cols = [
    {k:'name', label:'Usuario', w:'2.4fr', render: (u,i)=>(
      <div style={{display:'flex',alignItems:'center',gap:11}}>
        <Avatar name={u.name} size={34} grad={i%2?T.gradCoral:T.gradBrand}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.name}</div>
          <div style={{fontSize:11.5,color:T.n400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.email}</div>
        </div>
      </div>
    )},
    {k:'plan', label:'Plan', w:'0.7fr', render: u => <Pill color={u.plan==='pro'?T.gold:T.n400} strong={u.plan==='pro'}>{u.plan.toUpperCase()}</Pill>},
    {k:'events', label:'Eventos', w:'0.9fr', render: u => <span style={{fontWeight:600,color:'#fff'}}>{u.events}</span>},
    {k:'stripe', label:'Stripe Connect', w:'1.2fr', render: u => u.stripe
      ? <Pill color={T.emerald}>✓ Activo</Pill>
      : <span style={{color:T.n500,fontSize:12}}>— No configurado</span>},
    {k:'reg', label:'Registro', w:'1fr', render: u => <span style={{color:T.n300,fontSize:12}}>{u.reg}</span>},
    {k:'act', label:'', w:'50px', align:'right', render: (u) => <Menu items={[
      {icon:'👁', label:'Ver detalle', onClick: ()=>setSel(u)},
      {icon:u.plan==='pro'?'↓':'↑', label:u.plan==='pro'?'Cambiar a FREE':'Cambiar a PRO'},
      {icon:'↗', label:'Ver en Stripe'},
      {divider:true},
      {icon:'🚫', label:'Desactivar cuenta', danger:true},
    ]}/>},
  ];

  return (
    <div>
      <SectionTitle subtitle={`${rows.length} de ${USERS.length.toLocaleString('es-ES')} usuarios`}
        right={<Button variant="teal" icon="+">Exportar CSV</Button>}>Usuarios</SectionTitle>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <Input value={q} onChange={setQ} placeholder="Buscar por email o nombre…"
          icon={<span style={{fontSize:13}}>🔍</span>} width={320}/>
        <Select label="Plan" value={plan} onChange={setPlan} options={[
          {v:'all',l:'Todos'},{v:'free',l:'FREE'},{v:'pro',l:'PRO'}]}/>
        <Select label="Stripe" value={stripe} onChange={setStripe} options={[
          {v:'all',l:'Todos'},{v:'yes',l:'Conectado'},{v:'no',l:'Sin configurar'}]}/>
        <Select label="Registro" value="30d" onChange={()=>{}} options={[
          {v:'30d',l:'Últimos 30 días'},{v:'7d',l:'Últimos 7 días'},{v:'year',l:'Último año'}]} width={170}/>
      </div>

      <DataTable columns={cols} rows={rows} onRowClick={setSel}/>

      <div style={{marginTop:16,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12,color:T.n400}}>
        <span>Mostrando 1–{rows.length} de 1,284</span>
        <div style={{display:'flex',gap:8}}>
          <Button variant="ghost" size="sm">← Anterior</Button>
          <Button variant="ghost" size="sm">Siguiente →</Button>
        </div>
      </div>

      <UserDetailModal user={sel} onClose={()=>setSel(null)}/>
    </div>
  );
}

Object.assign(window, { UsuariosScreen });
