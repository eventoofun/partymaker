/** @jsx React.createElement */

// AUDIT se carga desde window.AUDIT_LOG (real DB data via /api/admin/data)

const ACT = {
  create:{c:T.emerald,l:'CREATE'},
  update:{c:T.teal,   l:'UPDATE'},
  delete:{c:T.coral,  l:'DELETE'},
};

function AuditScreen() {
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [q, setQ] = useState('');

  const AUDIT = (AUDIT_LOG || []).map(a => ({
    ts: a.createdAt ? new Date(a.createdAt).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : a.ts || '—',
    who: { n: a.userId || 'Sistema', e: a.userId || '', r: 'sistema' },
    action: a.action?.split('.')[0] || 'update',
    entity: a.entityType || 'sistema',
    id: a.entityId || a.id,
    ip: a.ip || '—',
    payload: typeof a.payload === 'object' ? JSON.stringify(a.payload) : String(a.payload || '{}'),
  }));

  const rows = AUDIT.filter(a =>
    (action==='all'||a.action===action) &&
    (entity==='all'||a.entity===entity) &&
    (!q||a.who.n?.toLowerCase().includes(q.toLowerCase())||a.who.e.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <SectionTitle subtitle="Trazabilidad completa de acciones del equipo · últimos 30 días">Audit Log</SectionTitle>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:22}}>
        <KPI label="Entradas en log"  value={String(AUDIT.length)}   accent={T.teal}    icon="📋" sub="Últimas 20 visibles"/>
        <KPI label="Creates"          value={String(AUDIT.filter(a=>a.action==='create').length)} accent={T.emerald} icon="✚"/>
        <KPI label="Deletes"          value={String(AUDIT.filter(a=>a.action==='delete').length)} accent={T.coral}   icon="🗑"/>
        <KPI label="Última acción"    value={AUDIT.length?AUDIT[0].ts:'—'} accent={T.lilac} icon="●" sub={AUDIT.length?`${AUDIT[0].action} · ${AUDIT[0].entity}`:'sin datos'}/>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <Input value={q} onChange={setQ} placeholder="Buscar usuario por email…" icon={<span>🔍</span>} width={260}/>
        <Select label="Acción" value={action} onChange={setAction} options={[{v:'all',l:'Todas'},{v:'create',l:'Create'},{v:'update',l:'Update'},{v:'delete',l:'Delete'}]}/>
        <Select label="Entidad" value={entity} onChange={setEntity} options={[{v:'all',l:'Todas'},{v:'event',l:'Event'},{v:'notification',l:'Notification'},{v:'biometric',l:'Biometric'},{v:'order',l:'Order'},{v:'adminUser',l:'Admin User'}]}/>
        <Select label="Fecha" value="30d" onChange={()=>{}} options={[{v:'30d',l:'Últimos 30 días'},{v:'7d',l:'Últimos 7 días'},{v:'today',l:'Hoy'}]} width={170}/>
      </div>

      <DataTable columns={[
        {k:'ts',label:'Timestamp',w:'1.2fr',render:a=><span style={{fontFamily:T.fontM,color:T.n300,fontSize:11.5}}>{a.ts}</span>},
        {k:'who',label:'Usuario',w:'1.4fr',render:a=>(
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Avatar name={a.who.n} size={26} grad={a.who.r==='owner'?T.gradBrand:a.who.r==='gestor'?'linear-gradient(135deg,#00C2D1,#0066FF)':'linear-gradient(135deg,#65748F,#435066)'}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:'#fff'}}>{a.who.n}</div>
              <div style={{fontSize:10.5,color:T.n400}}>{a.who.r}</div>
            </div>
          </div>
        )},
        {k:'action',label:'Acción',w:'0.7fr',render:a=><Pill color={ACT[a.action].c} strong>{ACT[a.action].l}</Pill>},
        {k:'entity',label:'Entidad',w:'0.9fr',render:a=><span style={{fontFamily:T.fontM,color:T.teal,fontSize:12}}>{a.entity}</span>},
        {k:'id',label:'ID',w:'1fr',render:a=><span style={{fontFamily:T.fontM,color:T.n400,fontSize:11}}>{a.id}</span>},
        {k:'ip',label:'IP',w:'0.8fr',render:a=><span style={{fontFamily:T.fontM,color:T.n400,fontSize:11}}>{a.ip}</span>},
        {k:'payload',label:'Payload',w:'1.8fr',render:a=><code style={{fontSize:10.5,color:T.n300,background:'rgba(0,194,209,.06)',padding:'3px 8px',borderRadius:6,display:'inline-block',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.payload}</code>},
      ]} rows={rows}/>

      <div style={{marginTop:16,fontSize:12,color:T.n400,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span>Mostrando 1–{rows.length} de 287 · 50 por página</span>
        <div style={{display:'flex',gap:8}}>
          <Button variant="ghost" size="sm">← Anterior</Button>
          <Button variant="ghost" size="sm">Siguiente →</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuditScreen });
