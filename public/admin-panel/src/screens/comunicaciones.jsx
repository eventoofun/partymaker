/** @jsx React.createElement */

const NOTIFS = [
  {id:1,ev:'Cumpleaños de Sofía', guest:'Andrés M.',    channel:'email',   type:'Invitación',         status:'delivered',ts:'hace 8 min', ext:'re_12ABxY9'},
  {id:2,ev:'Boda Lucía & Marco',  guest:'María L.',     channel:'whatsapp',type:'Recordatorio RSVP',  status:'delivered',ts:'hace 22 min',ext:'wa_4hKP2mN'},
  {id:3,ev:'Bautizo de Lola',     guest:'Pedro V.',     channel:'email',   type:'Agradecimiento',     status:'failed',   ts:'hace 1 h',   ext:'re_98QwE2x'},
  {id:4,ev:'Graduación Pablo',    guest:'Laura G.',     channel:'sms',     type:'Invitación',         status:'sent',     ts:'hace 2 h',   ext:'tw_SM12abc'},
  {id:5,ev:'Comunión de Diego',   guest:'Carlos P.',    channel:'email',   type:'Recordatorio RSVP',  status:'pending',  ts:'hace 3 h',   ext:'re_PD3x90p'},
  {id:6,ev:'Despedida Javier',    guest:'Sandra T.',    channel:'whatsapp',type:'Invitación',         status:'delivered',ts:'hace 4 h',   ext:'wa_9pMnX1L'},
  {id:7,ev:'Cumpleaños Martín',   guest:'Julia R.',     channel:'email',   type:'Agradecimiento',     status:'failed',   ts:'hace 5 h',   ext:'re_FL4abEE'},
];

const CH = {
  email:   {i:'📧', l:'Email'},
  whatsapp:{i:'💬', l:'WhatsApp'},
  sms:     {i:'📱', l:'SMS'},
};
const STAT = {
  delivered:{c:T.emerald,l:'Entregado'},
  sent:     {c:T.teal,   l:'Enviado'},
  pending:  {c:T.orange, l:'Pendiente'},
  failed:   {c:T.coral,  l:'Fallido'},
};

function ComunicacionesScreen() {
  const [channel, setChannel] = useState('all');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [msg, setMsg] = useState(null);
  const rows = NOTIFS.filter(n =>
    (channel==='all'||n.channel===channel) &&
    (status==='all'||n.status===status)
  );
  const failed = NOTIFS.filter(n=>n.status==='failed').length;

  return (
    <div>
      <SectionTitle subtitle="Email, WhatsApp y SMS · estado de entregas">Comunicaciones</SectionTitle>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:22}}>
        <KPI label="Enviados hoy"       value="284"   accent={T.teal}    icon="📨" delta="+42 vs. ayer"/>
        <KPI label="Tasa de entrega"    value="97.3%" accent={T.emerald} icon="✓"  sub="Global · últimos 7 días"/>
        <KPI label="Fallos (24h)"       value={failed+''} accent={T.coral} icon="⚠" sub="Resend · problemas SPF/DKIM"/>
        <KPI label="Pendientes"         value="43"    accent={T.orange}  icon="⏳" sub="Recordatorios RSVP programados"/>
      </div>

      {/* Channel breakdown */}
      <Card padding={20} hover style={{marginBottom:20}}>
        <Eyebrow color={T.teal}>Canal — últimos 30 días</Eyebrow>
        <div style={{display:'flex',alignItems:'center',gap:24,marginTop:14}}>
          <div style={{flex:1,display:'flex',borderRadius:10,overflow:'hidden',height:38,border:`1px solid ${T.borderWhite}`}}>
            <div style={{flex:68,background:'linear-gradient(90deg,#00C2D1,#00A7B4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff'}}>📧 Email · 68%</div>
            <div style={{flex:24,background:'linear-gradient(90deg,#00E5A0,#00C78A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#06160E'}}>💬 WA · 24%</div>
            <div style={{flex:8, background:'linear-gradient(90deg,#FFB300,#FF8C00)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#1A0E00'}}>SMS 8%</div>
          </div>
        </div>
      </Card>

      {/* Failed banner */}
      {failed>0 && (
        <Card padding={16} style={{marginBottom:18,borderColor:'rgba(255,140,66,.4)',background:'linear-gradient(90deg, rgba(255,140,66,.10), rgba(255,77,109,.04))'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,77,109,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⚠️</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13.5,fontWeight:700,color:'#fff'}}>{failed} notificaciones fallidas</div>
              <div style={{fontSize:11.5,color:T.n300,marginTop:2}}>Afectan 2 eventos · errores de bounce y timeout</div>
            </div>
            <Button variant="primary">↻ Reintentar todos</Button>
          </div>
        </Card>
      )}

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <Select label="Canal" value={channel} onChange={setChannel} options={[{v:'all',l:'Todos'},{v:'email',l:'📧 Email'},{v:'whatsapp',l:'💬 WhatsApp'},{v:'sms',l:'📱 SMS'}]}/>
        <Select label="Tipo" value={type} onChange={setType} options={[{v:'all',l:'Todos'},{v:'inv',l:'Invitación'},{v:'rsvp',l:'Recordatorio RSVP'},{v:'thx',l:'Agradecimiento'}]}/>
        <Select label="Estado" value={status} onChange={setStatus} options={[{v:'all',l:'Todos'},...Object.entries(STAT).map(([k,v])=>({v:k,l:v.l}))]}/>
      </div>

      <DataTable columns={[
        {k:'ev',label:'Evento',w:'1.6fr',render:n=><span style={{color:'#fff',fontWeight:600,fontSize:13}}>{n.ev}</span>},
        {k:'guest',label:'Invitado',w:'1fr',render:n=><span style={{color:T.n200}}>{n.guest}</span>},
        {k:'ch',label:'Canal',w:'0.9fr',render:n=><span style={{fontSize:12.5}}>{CH[n.channel].i} {CH[n.channel].l}</span>},
        {k:'type',label:'Tipo',w:'1.2fr',render:n=><span style={{color:T.n300,fontSize:12.5}}>{n.type}</span>},
        {k:'status',label:'Estado',w:'1fr',render:n=><Pill color={STAT[n.status].c}>{STAT[n.status].l}</Pill>},
        {k:'ts',label:'Enviado',w:'0.9fr',render:n=><span style={{fontSize:11.5,color:T.n400}}>{n.ts}</span>},
        {k:'ext',label:'ID externo',w:'1fr',render:n=><span style={{fontFamily:T.fontM,fontSize:11,color:T.teal}}>{n.ext}</span>},
        {k:'act',label:'',w:'50px',align:'right',render:n=><Menu items={[
          {icon:'👁',label:'Ver contenido',onClick:()=>setMsg(n)},
          {icon:'↻',label:'Reintentar',onClick:()=>{}},
        ]}/>},
      ]} rows={rows} onRowClick={setMsg}/>

      <Modal open={!!msg} onClose={()=>setMsg(null)} width={560}>
        {msg && <>
          <ModalHeader title={`${CH[msg.channel].i} ${msg.type}`} subtitle={`Para ${msg.guest} · ${msg.ev}`} onClose={()=>setMsg(null)}/>
          <div style={{padding:'22px 26px'}}>
            <div style={{display:'flex',gap:10,marginBottom:14}}>
              <Pill color={STAT[msg.status].c}>{STAT[msg.status].l}</Pill>
              <Pill color={T.n400}>{msg.ts}</Pill>
              <Pill color={T.teal}>{msg.ext}</Pill>
            </div>
            <div style={{padding:16,borderRadius:12,background:'rgba(255,255,255,.03)',border:`1px solid ${T.borderWhite}`}}>
              <div style={{fontSize:11,color:T.n400,textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700,marginBottom:6}}>Asunto</div>
              <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:14}}>Estás invitado · {msg.ev}</div>
              <div style={{fontSize:11,color:T.n400,textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700,marginBottom:6}}>Mensaje</div>
              <div style={{fontSize:13,color:T.n200,lineHeight:1.65}}>
                Hola {msg.guest.split(' ')[0]} ✨ El Genio de Cumplefy te acaba de preparar una videoinvitación especial.
                Ábrela y confirma tu asistencia en un clic. ¡Te esperamos!
              </div>
            </div>
            {msg.status==='failed' && <Button style={{marginTop:16}} variant="primary">↻ Reintentar envío</Button>}
          </div>
        </>}
      </Modal>
    </div>
  );
}

Object.assign(window, { ComunicacionesScreen });
