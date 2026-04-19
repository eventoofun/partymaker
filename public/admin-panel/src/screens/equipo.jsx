/** @jsx React.createElement */

const SECTIONS = [
  {k:'overview',l:'Overview'},
  {k:'usuarios',l:'Usuarios'},
  {k:'eventos',l:'Eventos'},
  {k:'pagos',l:'Pagos'},
  {k:'ia',l:'IA / Video'},
  {k:'tienda',l:'Tienda'},
  {k:'comunicaciones',l:'Comunicaciones'},
  {k:'compliance',l:'Compliance'},
  {k:'integraciones',l:'Integraciones'},
  {k:'audit',l:'Audit Log'},
  {k:'equipo',l:'Gestión equipo'},
];

const TEMPLATES = {
  admin:   {overview:'write',usuarios:'write',eventos:'write',pagos:'write',ia:'write',tienda:'write',comunicaciones:'write',compliance:'write',integraciones:'write',audit:'write',equipo:'write'},
  gestor:  {overview:'write',usuarios:'read', eventos:'write',pagos:'none', ia:'write',tienda:'write',comunicaciones:'write',compliance:'none', integraciones:'none', audit:'read', equipo:'none'},
  soporte: {overview:'write',usuarios:'none', eventos:'read', pagos:'none', ia:'none', tienda:'none', comunicaciones:'write',compliance:'none', integraciones:'none', audit:'none', equipo:'none'},
};

const MEMBERS = [
  {id:'m1',name:'Pedro Amador',   email:'pedro@cumplefy.com',  role:'admin',  last:'hace 2 horas', active:true, you:true},
  {id:'m2',name:'David Martínez', email:'david@cumplefy.com',  role:'gestor', last:'hace 1 día',   active:true},
  {id:'m3',name:'Emilio Regordán',email:'emilio@cumplefy.com', role:'soporte',last:'hace 5 días',  active:true},
];

const ROLE_STY = {
  admin:   {c:T.gold,   l:'OWNER',   grad:T.gradBrand},
  gestor:  {c:T.teal,   l:'GESTOR',  grad:'linear-gradient(135deg,#00C2D1,#0066FF)'},
  soporte: {c:T.n300,   l:'SOPORTE', grad:'linear-gradient(135deg,#65748F,#435066)'},
};

function PermissionsEditor({ member, onClose }) {
  const [role, setRole] = useState(member?.role || 'gestor');
  const [perms, setPerms] = useState(TEMPLATES[member?.role || 'gestor']);
  useEffect(()=>{ if(member){ setRole(member.role); setPerms(TEMPLATES[member.role]); } },[member?.id]);
  if(!member) return null;

  const set = (k,v) => setPerms(p=>({...p,[k]:v}));
  const applyTpl = (r) => { setRole(r); setPerms(TEMPLATES[r]); };

  const LEVELS = [
    {v:'none', l:'Sin acceso', c:T.n500, i:'—'},
    {v:'read', l:'Lectura',    c:T.gold, i:'👁'},
    {v:'write',l:'Escritura',  c:T.emerald,i:'✎'},
  ];

  return (
    <Modal open onClose={onClose} width={760}>
      <ModalHeader
        title={`Permisos de ${member.name}`}
        subtitle={member.email}
        onClose={onClose}
        right={<Select label="Plantilla" value={role} onChange={applyTpl} options={[{v:'admin',l:'Admin'},{v:'gestor',l:'Gestor'},{v:'soporte',l:'Soporte'}]} width={160}/>}
      />
      <div style={{padding:'18px 26px 0',overflowY:'auto',flex:1}}>
        <div style={{padding:12,borderRadius:10,background:'rgba(0,194,209,.06)',border:`1px solid ${T.border}`,fontSize:12,color:T.n200,marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:15}}>💡</span>
          <span>El rol es sólo una plantilla de inicio. Puedes ajustar cada permiso individualmente.</span>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'1.3fr repeat(3, 1fr)',
          gap:0,
          border:`1px solid ${T.borderWhite}`, borderRadius:12, overflow:'hidden',
          marginBottom:10,
        }}>
          <div style={{padding:'10px 14px',background:'rgba(255,255,255,.03)',fontSize:10.5,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:T.n400}}>Sección</div>
          {LEVELS.map(lv => (
            <div key={lv.v} style={{padding:'10px 14px',background:'rgba(255,255,255,.03)',fontSize:10.5,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:lv.c,textAlign:'center',borderLeft:`1px solid ${T.borderWhite}`}}>{lv.i} {lv.l}</div>
          ))}

          {SECTIONS.map((sec,i) => (
            <React.Fragment key={sec.k}>
              <div style={{padding:'12px 14px',borderTop:`1px solid ${T.borderWhite}`,fontSize:13,color:'#fff',fontWeight:500,display:'flex',alignItems:'center'}}>{sec.l}</div>
              {LEVELS.map(lv => {
                const sel = perms[sec.k]===lv.v;
                return (
                  <div key={lv.v} onClick={()=>set(sec.k,lv.v)}
                    style={{borderTop:`1px solid ${T.borderWhite}`,borderLeft:`1px solid ${T.borderWhite}`,
                      padding:'12px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                      background: sel?`${lv.c}18`:'transparent',
                      transition:'all 150ms',
                    }}
                    onMouseEnter={e=>{if(!sel) e.currentTarget.style.background='rgba(255,255,255,.03)';}}
                    onMouseLeave={e=>{if(!sel) e.currentTarget.style.background='transparent';}}
                  >
                    <div style={{
                      width:18,height:18,borderRadius:'50%',
                      border:`2px solid ${sel?lv.c:T.n500}`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      background: sel?lv.c:'transparent',
                      boxShadow: sel?`0 0 10px ${lv.c}66`:'none',
                      transition:'all 160ms',
                    }}>
                      {sel && <span style={{width:6,height:6,borderRadius:'50%',background:'#000'}}/>}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{padding:'16px 26px',borderTop:`1px solid ${T.borderWhite}`,display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="teal" onClick={onClose}>Guardar permisos</Button>
      </div>
    </Modal>
  );
}

function InviteModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('gestor');
  if(!open) return null;
  return (
    <Modal open onClose={onClose} width={520}>
      <ModalHeader title="Invitar miembro al equipo" subtitle="El email debe pertenecer a una cuenta Cumplefy existente" onClose={onClose}/>
      <div style={{padding:'22px 26px'}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:T.n400,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Email del nuevo miembro</div>
          <Input value={email} onChange={setEmail} placeholder="nombre@dominio.com" icon={<span>@</span>}/>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:T.n400,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Rol</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {['gestor','soporte'].map(r=>(
              <div key={r} onClick={()=>setRole(r)} style={{
                padding:14,borderRadius:12,cursor:'pointer',
                background:role===r?`${ROLE_STY[r].c}14`:'rgba(255,255,255,.02)',
                border:`1px solid ${role===r?ROLE_STY[r].c:T.borderWhite}`,
              }}>
                <Pill color={ROLE_STY[r].c} strong={role===r}>{ROLE_STY[r].l}</Pill>
                <div style={{fontSize:11.5,color:T.n300,marginTop:8,lineHeight:1.5}}>
                  {r==='gestor'?'Acceso amplio: eventos, IA, comunicaciones, tienda.':'Acceso mínimo: sólo comunicaciones y lectura de eventos.'}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:12,borderRadius:10,background:'rgba(255,179,0,.06)',border:`1px solid rgba(255,179,0,.3)`,fontSize:12,color:'#FFD88A',marginBottom:16}}>
          Permisos pre-rellenados según plantilla · podrás editarlos después.
        </div>
      </div>
      <div style={{padding:'16px 26px',borderTop:`1px solid ${T.borderWhite}`,display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onClose}>Enviar invitación</Button>
      </div>
    </Modal>
  );
}

function EquipoScreen() {
  const [edit, setEdit] = useState(null);
  const [invite, setInvite] = useState(false);

  return (
    <div>
      <SectionTitle subtitle="Miembros con acceso al panel · 3 activos"
        right={<Button variant="primary" icon="+" onClick={()=>setInvite(true)}>Invitar miembro</Button>}>Gestión de Equipo</SectionTitle>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
        {MEMBERS.map(m=>{
          const r = ROLE_STY[m.role];
          return (
            <Card key={m.id} padding={20} hover style={{borderColor:m.you?T.border:T.borderSubtle, position:'relative'}}>
              {m.you && <div style={{position:'absolute',top:12,right:12,padding:'3px 9px',borderRadius:9999,background:T.gradBrand,color:'#fff',fontSize:10,fontWeight:800,letterSpacing:'.08em'}}>TÚ</div>}
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <Avatar name={m.name} size={52} grad={r.grad} glow={m.you}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:T.fontD,fontSize:16,fontWeight:700,color:'#fff',letterSpacing:'-.02em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
                  <div style={{fontSize:12,color:T.n400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.email}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:16}}>
                <Pill color={r.c} strong={m.role==='admin'}>{m.role==='admin'?'★ OWNER':r.l}</Pill>
                <Pill color={T.emerald}><Dot color={T.emerald} pulse size={6}/> Activo</Pill>
              </div>
              <div style={{fontSize:11.5,color:T.n400,marginTop:12}}>Último acceso: {m.last}</div>
              {!m.you && (
                <div style={{display:'flex',gap:8,marginTop:16}}>
                  <Button variant="teal" size="sm" onClick={()=>setEdit(m)} style={{flex:1}}>Editar permisos</Button>
                  <Button variant="ghost" size="sm">Desactivar</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Permission matrix summary */}
      <Card padding={0}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.borderWhite}`,display:'flex',alignItems:'center'}}>
          <Eyebrow color={T.teal}>Matriz de permisos actuales</Eyebrow>
          <span style={{marginLeft:'auto',fontSize:11.5,color:T.n400}}>Haz clic en un miembro arriba para editar</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:`1.4fr repeat(${MEMBERS.length},1fr)`,fontSize:12}}>
          <div style={{padding:'10px 20px',fontSize:10.5,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:T.n400,borderBottom:`1px solid ${T.borderWhite}`}}>Sección</div>
          {MEMBERS.map(m=>(
            <div key={m.id} style={{padding:'10px 16px',fontSize:10.5,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:ROLE_STY[m.role].c,borderBottom:`1px solid ${T.borderWhite}`,borderLeft:`1px solid ${T.borderWhite}`,textAlign:'center'}}>{m.name.split(' ')[0]}</div>
          ))}
          {SECTIONS.map(sec=>(
            <React.Fragment key={sec.k}>
              <div style={{padding:'10px 20px',color:T.n200,borderTop:`1px solid ${T.borderWhite}`}}>{sec.l}</div>
              {MEMBERS.map(m=>{
                const v = TEMPLATES[m.role][sec.k];
                const c = v==='write'?T.emerald:v==='read'?T.gold:T.n500;
                const l = v==='write'?'✎':v==='read'?'👁':'—';
                return (
                  <div key={m.id+sec.k} style={{padding:'10px',borderTop:`1px solid ${T.borderWhite}`,borderLeft:`1px solid ${T.borderWhite}`,textAlign:'center',color:c,fontSize:13,fontWeight:700}}>{l}</div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <PermissionsEditor member={edit} onClose={()=>setEdit(null)}/>
      <InviteModal open={invite} onClose={()=>setInvite(false)}/>
    </div>
  );
}

Object.assign(window, { EquipoScreen });
