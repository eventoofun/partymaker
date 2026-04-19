/** @jsx React.createElement */

const BIO_JOBS = [
  {id:'bs1', ev:'Cumpleaños de Sofía', honoree:'Sofía García Pérez',   consentedBy:'Lucía Pérez (madre)', consentedAt:'22 mar · 11:30', ip:'83.45.12.7',  status:'active', expires:23},
  {id:'bs2', ev:'Despedida Javier',    honoree:'Javier Ruiz Molina',    consentedBy:'Javier Ruiz',         consentedAt:'02 abr · 16:42', ip:'212.18.92.4', status:'active', expires:5},
  {id:'bs3', ev:'Bautizo de Lola',     honoree:'Lola Giménez',          consentedBy:'Pablo Giménez (padre)', consentedAt:'05 abr · 09:12', ip:'80.32.14.88', status:'active', expires:7},
  {id:'bs4', ev:'Graduación Pablo',    honoree:'Pablo Torres Ruiz',     consentedBy:'Ana Torres',          consentedAt:'18 feb · 20:15', ip:'83.55.81.2',  status:'deleted',expires:null},
];

function ComplianceScreen() {
  const [del, setDel] = useState(null);
  const active = BIO_JOBS.filter(j=>j.status==='active');

  return (
    <div>
      <SectionTitle subtitle="GDPR Art. 9 · datos biométricos y retención">Compliance & GDPR</SectionTitle>

      <Card padding={16} style={{marginBottom:20,borderColor:'rgba(255,140,66,.4)',background:'linear-gradient(90deg, rgba(255,140,66,.10), rgba(255,77,109,.04))'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'rgba(255,140,66,.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⚠️</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13.5,fontWeight:700,color:'#FFB895'}}>{active.length} registros biométricos activos</div>
            <div style={{fontSize:11.5,color:T.n300,marginTop:2}}>Próxima eliminación automática: Javier Ruiz Molina en 5 días</div>
          </div>
          <Button variant="ghost">Ver política de retención</Button>
        </div>
      </Card>

      <div style={{marginBottom:12,display:'flex',alignItems:'baseline',gap:10}}>
        <Eyebrow color={T.coral}>Face Swap Jobs — Datos Biométricos</Eyebrow>
        <span style={{fontSize:11.5,color:T.n400}}>Eliminación automática a los 30 días del consentimiento</span>
      </div>

      <DataTable columns={[
        {k:'ev',label:'Evento',w:'1.4fr',render:j=><span style={{color:'#fff',fontWeight:600,fontSize:13}}>{j.ev}</span>},
        {k:'honoree',label:'Homenajeado',w:'1.3fr',render:j=><span style={{color:T.n200}}>{j.honoree}</span>},
        {k:'consent',label:'Consentido por',w:'1.4fr',render:j=><span style={{color:T.n300,fontSize:12}}>{j.consentedBy}</span>},
        {k:'at',label:'Consentimiento',w:'1fr',render:j=><span style={{color:T.n400,fontSize:11.5,fontFamily:T.fontM}}>{j.consentedAt}</span>},
        {k:'ip',label:'IP',w:'0.8fr',render:j=><span style={{color:T.n400,fontSize:11.5,fontFamily:T.fontM}}>{j.ip}</span>},
        {k:'status',label:'Estado',w:'0.9fr',render:j=><Pill color={j.status==='active'?T.coral:T.emerald}>{j.status==='active'?'🔴 Activo':'✅ Eliminado'}</Pill>},
        {k:'exp',label:'Auto-eliminación',w:'1fr',render:j=>j.expires==null?<span style={{color:T.n500,fontSize:11}}>—</span>:<span style={{color:j.expires<=7?T.coral:T.n200,fontWeight:j.expires<=7?700:500,fontSize:12}}>en {j.expires} días</span>},
        {k:'act',label:'',w:'140px',align:'right',render:j=>j.status==='active'?<Button variant="danger" size="sm" onClick={()=>setDel(j)}>🗑 Eliminar ahora</Button>:null},
      ]} rows={BIO_JOBS}/>

      <div style={{marginTop:30,marginBottom:12}}>
        <Eyebrow color={T.gold}>Retención — próximos a expirar</Eyebrow>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          {t:'Datos biométricos', ev:'Despedida Javier', exp:'en 5 días', c:T.coral},
          {t:'Foto de invitados', ev:'Bautizo de Lola', exp:'en 7 días', c:T.gold},
          {t:'Consentimientos RGPD', ev:'Graduación Pablo', exp:'en 2 días', c:T.coral},
        ].map((r,i)=>(
          <Card key={i} padding={16} hover style={{borderColor:`${r.c}44`}}>
            <Pill color={r.c}>{r.t}</Pill>
            <div style={{fontSize:14,fontWeight:700,color:'#fff',marginTop:10,fontFamily:T.fontD}}>{r.ev}</div>
            <div style={{fontSize:12,color:T.n300,marginTop:4}}>Expira {r.exp}</div>
            <Button variant="danger" size="sm" style={{marginTop:12}}>Eliminar</Button>
          </Card>
        ))}
      </div>

      <Modal open={!!del} onClose={()=>setDel(null)} width={460}>
        {del && <>
          <ModalHeader title="¿Eliminar datos biométricos?" onClose={()=>setDel(null)}/>
          <div style={{padding:'22px 26px'}}>
            <div style={{padding:14,borderRadius:12,background:'rgba(255,77,109,.08)',border:`1px solid ${T.coral}55`,marginBottom:16}}>
              <div style={{fontSize:13,color:'#FFB8C0',lineHeight:1.6}}>Se eliminarán permanentemente los datos biométricos de <b style={{color:'#fff'}}>{del.honoree}</b>. Esta acción es <b>irreversible</b> y quedará registrada en el Audit Log.</div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <Button variant="ghost" onClick={()=>setDel(null)}>Cancelar</Button>
              <Button variant="danger" onClick={()=>setDel(null)}>Eliminar permanentemente</Button>
            </div>
          </div>
        </>}
      </Modal>
    </div>
  );
}

Object.assign(window, { ComplianceScreen });
