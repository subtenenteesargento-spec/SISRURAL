// SISRURAL V9 - firebase-admin.js
import { firebaseConfig, ADMIN_EMAIL, APP_INFO, ADMIN_EMAILS_FIXOS } from './config.firebase.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
let v7User=null, v7Profile=null, v7Requests=[], v7Visits=[], v7Audits=[], v7CloudProps=[], v7Users=[]; window.v7CloudProps=v7CloudProps;
const PENDING_PROPS_KEY='sisrural_pending_props_v1';
const MIGRATED_LOCAL_KEY='sisrural_local_props_migrated_v1';
const ADMIN = ADMIN_EMAIL || 'ferpozzer@gmail.com';
const ADMIN_EMAILS = Array.from(new Set([String(ADMIN).toLowerCase(),'ferpozzer@gmail.com',...(Array.isArray(ADMIN_EMAILS_FIXOS)?ADMIN_EMAILS_FIXOS:[]).map(e=>String(e).toLowerCase())]));
const $v=id=>document.getElementById(id);
const emailKey = email => String(email||'').toLowerCase().replace(/[^a-z0-9]/g,'_');
function perfilNorm(p){ return String(p||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function isAdminGeral(){ const email=String(v7User?.email||'').toLowerCase(); const p=perfilNorm(v7Profile?.perfil); return !!v7User && (ADMIN_EMAILS.includes(email) || ['administrador','administrador geral','comandante'].includes(p)); }
function isSupervisor(){ const p=perfilNorm(v7Profile?.perfil); return ['supervisor','capitao','capitao pm','tenente'].includes(p); }
function canOpenAdminPanel(){ return isAdminGeral() || isSupervisor(); }
function isAdmin(){ return isAdminGeral(); }
async function auditV7(acao,detalhe){ try{ await addDoc(collection(db,'auditoria'),{acao,detalhe,usuario:v7User?.email||'',createdAt:serverTimestamp(),app:'SISRURAL V8.4 CONSOLIDACAO'}); }catch(e){} }
async function loadProfile(u){
  const refUid=doc(db,'usuarios',u.uid);
  const refEmail=doc(db,'usuarios',emailKey(u.email));
  let snap=await getDoc(refUid);
  let data=snap.exists()?snap.data():null;
  if(!data){ const s2=await getDoc(refEmail); if(s2.exists()) data=s2.data(); }
  if(!data){
    data={nome:u.email,email:u.email,re:'',graduacao:'',companhia:APP_INFO.companhia,perfil:String(u.email).toLowerCase()===String(ADMIN).toLowerCase()?'Administrador':'Policial',status:'Ativo',createdAt:serverTimestamp()};
  }
  if(String(u.email).toLowerCase()===String(ADMIN).toLowerCase()) data.perfil='Administrador';
  data.email=u.email;
  await setDoc(refUid,data,{merge:true});
  await setDoc(refEmail,{...data,uid:u.uid},{merge:true});
  return data;
}
function showLogged(){
  $v('authGate').classList.add('hidden');
  $v('userPill').style.display='block';
  $v('v7UserEmail').textContent=v7User.email;
  $v('v7UserPerfil').textContent=v7Profile?.perfil||'Policial';
  const b=$v('bAdmin'); if(b) b.style.display=canOpenAdminPanel()?'flex':'none';
}
function showLogin(){ $v('authGate').classList.remove('hidden'); $v('userPill').style.display='none'; const b=$v('bAdmin'); if(b) b.style.display='none'; }
window.v7Login=async()=>{
  const msg=$v('v7LoginMsg'); msg.style.display='none';
  try{ await signInWithEmailAndPassword(auth,$v('v7Email').value.trim(),$v('v7Senha').value); }
  catch(e){ msg.style.display='block'; msg.textContent = e.code==='auth/invalid-credential'?'E-mail ou senha incorretos.':e.message; }
};
window.v7Logout=async()=>{ await signOut(auth); location.reload(); };
onAuthStateChanged(auth, async u=>{
  if(!u){ showLogin(); return; }
  v7User=u; v7Profile=await loadProfile(u); showLogged(); auditV7('login','Usuário entrou no sistema'); startRealtime();
});
function startRealtime(){
  onSnapshot(query(collection(db,'solicitacoes_acesso'),orderBy('createdAt','desc')),s=>{v7Requests=s.docs.map(d=>({id:d.id,...d.data()})); renderRequests();});
  onSnapshot(query(collection(db,'visitas'),orderBy('createdAt','desc')),s=>{v7Visits=s.docs.map(d=>({id:d.id,...d.data()})); renderCommanderDashboard();});
  onSnapshot(query(collection(db,'auditoria'),orderBy('createdAt','desc')),s=>{v7Audits=s.docs.map(d=>({id:d.id,...d.data()})); renderAudit();});
  onSnapshot(collection(db,'usuarios'),s=>{v7Users=s.docs.map(d=>({docId:d.id,...d.data()})); renderUsersList();});
  onSnapshot(collection(db,'propriedades_cadastradas'),s=>{v7CloudProps=s.docs.map(d=>({id:d.id,...d.data()})); window.v7CloudProps=v7CloudProps; renderCloudProperties(); renderCommanderDashboard();});
  syncPendingProperties();
      syncPendingVisits();
  migrateLocalPointsToCloudOnce();
}
window.closeV7Modal=id=>$v(id).classList.remove('open');
window.openRequestAccess=()=>{$v('v7RequestModal').classList.add('open'); $v('reqEmail').value=$v('v7Email').value||'';};
window.sendAccessRequest=async()=>{
  const btnMsg=$v('reqMsg');
  try{
    const data={
      nome:$v('reqNome').value.trim(),
      re:$v('reqRe').value.trim(),
      graduacao:$v('reqGrad').value.trim(),
      email:$v('reqEmail').value.trim().toLowerCase(),
      telefone:$v('reqTel').value.trim(),
      status:'Pendente',
      createdAt:serverTimestamp()
    };
    if(!data.nome) throw Error('Informe o nome.');
    if(!data.re) throw Error('Informe o RE.');
    if(!data.email) throw Error('Informe o e-mail.');
    btnMsg.innerHTML='<span style="color:#facc15">Enviando solicitação...</span>';
    await addDoc(collection(db,'solicitacoes_acesso'),data);
    btnMsg.innerHTML='<span style="color:#4ade80">Solicitação enviada. O administrador verá no painel ADMIN.</span>';
    setTimeout(()=>closeV7Modal('v7RequestModal'),1600);
  }catch(e){
    btnMsg.innerHTML='<span style="color:#ef4444">'+(e.code==='permission-denied'?'Permissão negada no Firebase. Atualize as regras do Firestore conforme orientação.':e.message)+'</span>';
  }
};
window.openAdminPanel=()=>{ if(!canOpenAdminPanel()) return alert('Acesso restrito.'); $v('admNome').value=v7Profile.nome||''; $v('admRe').value=v7Profile.re||''; $v('admGrad').value=v7Profile.graduacao||''; const pf=$v('admPerfilTxt'); if(pf) pf.value=v7Profile?.perfil||'Policial'; $v('v7AdminModal').classList.add('open'); renderUsersList(); renderRequests(); renderAudit(); renderCommanderDashboard(); updateOfflineBadge(); const ss=$v('syncStatus'); if(ss) ss.innerHTML='Pendências no aparelho: '+(pendingProps().length+pendingVisits().length); };
window.saveMyBasicProfile=async()=>{
  if(!v7User) return; const data={nome:$v('admNome').value,re:$v('admRe').value,graduacao:$v('admGrad').value,email:v7User.email,companhia:APP_INFO.companhia,status:v7Profile?.status||'Ativo',updatedAt:serverTimestamp()}; await setDoc(doc(db,'usuarios',v7User.uid),data,{merge:true}); await setDoc(doc(db,'usuarios',emailKey(v7User.email)),{...data,uid:v7User.uid,perfil:v7Profile?.perfil||'Policial'},{merge:true}); v7Profile={...v7Profile,...data}; showLogged(); auditV7('perfil_atualizado','Usuário atualizou dados básicos'); alert('Dados salvos. O perfil funcional só pode ser alterado por Administrador Geral.'); };
window.approveReq=async(id)=>{ if(!isAdminGeral()) return alert('Somente Administrador Geral pode aprovar acesso.'); const r=v7Requests.find(x=>x.id===id); if(!r)return; const perfil=prompt('Perfil do usuário: Policial, Supervisor ou Administrador Geral','Policial')||'Policial'; const data={nome:r.nome,email:r.email,re:r.re,graduacao:r.graduacao,telefone:r.telefone,perfil,status:'Ativo',companhia:APP_INFO.companhia,approvedBy:v7User.email,approvedAt:serverTimestamp()}; await setDoc(doc(db,'usuarios',emailKey(r.email)),data,{merge:true}); await setDoc(doc(db,'solicitacoes_acesso',id),{status:'Aprovado',perfilAprovado:perfil,approvedBy:v7User.email,approvedAt:serverTimestamp()},{merge:true}); auditV7('acesso_aprovado',`${r.email} como ${perfil}. Criar/confirmar senha no Authentication.`); alert('Acesso aprovado no SISRURAL. Se o e-mail ainda não existir em Authentication, crie o usuário no Firebase com senha provisória para permitir o primeiro login.'); renderRequests(); renderUsersList(); };
window.denyReq=async(id)=>{ const r=v7Requests.find(x=>x.id===id); await setDoc(doc(db,'solicitacoes_acesso',id),{status:'Negado',deniedBy:v7User.email,deniedAt:serverTimestamp()},{merge:true}); auditV7('acesso_negado',r?.email||id); renderRequests(); };

window.adminCreatePoliceProfile=async()=>{
  try{
    if(!isAdminGeral()) return alert('Somente Administrador Geral pode cadastrar policiais.');
    const nome=($v('polNome')?.value||'').trim();
    const re=($v('polRe')?.value||'').trim();
    const graduacao=($v('polGrad')?.value||'').trim();
    const email=($v('polEmail')?.value||'').trim().toLowerCase();
    const telefone=($v('polTel')?.value||'').trim();
    const perfil=$v('polPerfil')?.value||'Policial';
    const msg=$v('polMsg');
    if(!nome||!email){ if(msg) msg.innerHTML='<span style="color:#f87171">Preencha nome e e-mail.</span>'; return; }
    const data={nome,re,graduacao,email,telefone,perfil,status:'Ativo',updatedBy:v7User.email,updatedAt:serverTimestamp(),origem:'admin_sisrural'};
    await setDoc(doc(db,'usuarios',emailKey(email)),data,{merge:true});
    await auditV7('policial_cadastrado',`${nome} (${email}) como ${perfil}`);
    if(msg) msg.innerHTML='✅ Perfil salvo no SISRURAL. Se ainda não existir, crie o mesmo e-mail em Firebase Authentication com senha provisória.';
    ['polNome','polRe','polGrad','polEmail','polTel'].forEach(id=>{ const e=$v(id); if(e) e.value=''; });
    renderUsersList();
  }catch(e){ const msg=$v('polMsg'); if(msg) msg.innerHTML='<span style="color:#f87171">Erro: '+(e.message||e)+'</span>'; }
};

window.forceSyncNow=async()=>{
  const el=$v('syncStatus');
  if(el) el.innerHTML='⏳ Sincronizando pendências...';
  try{
    await syncPendingProperties();
    await syncPendingVisits();
    await auditV7('sincronizacao_manual','Administrador acionou sincronização manual.');
    updateOfflineBadge();
    if(el) el.innerHTML='✅ Sincronização concluída. Pendências restantes: '+(pendingProps().length+pendingVisits().length);
    try{toastV7('✅ Dados sincronizados.');}catch(e){}
  }catch(e){ if(el) el.innerHTML='⚠️ Falha na sincronização: '+(e.message||e); }
};
window.refreshSisruralData=async()=>{
  try{
    await syncPendingProperties();
    await syncPendingVisits();
    if(typeof renderCloudProperties==='function') renderCloudProperties();
    if(typeof renderCommanderDashboard==='function') renderCommanderDashboard();
    updateOfflineBadge();
    const el=$v('syncStatus'); if(el) el.innerHTML='✅ Dados atualizados da nuvem. Pendências: '+(pendingProps().length+pendingVisits().length);
    try{toastV7('✅ Dados atualizados.');}catch(e){}
  }catch(e){ alert('Erro ao atualizar: '+(e.message||e)); }
};

function renderRequests(){ const el=$v('v7Requests'); if(!el) return; const pend=v7Requests.filter(r=>r.status==='Pendente'); el.innerHTML=pend.length?pend.map(r=>`<div class="v7-card"><b>${r.nome||r.email}</b><div class="v7-small">${r.graduacao||''} · RE ${r.re||''}<br>${r.email||''} · ${r.telefone||''}</div><button class="btn-primary" onclick="approveReq('${r.id}')">Aprovar</button><button class="btn-secondary" onclick="denyReq('${r.id}')">Negar</button></div>`).join(''):'<div class="v7-card v7-small">Nenhuma solicitação pendente.</div>'; }

function uniqueUsers(){
  const m=new Map();
  (v7Users||[]).forEach(u=>{
    const em=String(u.email||'').toLowerCase(); if(!em) return;
    const cur=m.get(em)||{};
    m.set(em,{...cur,...u,email:em});
  });
  return [...m.values()].sort((a,b)=>String(a.nome||a.email).localeCompare(String(b.nome||b.email),'pt-BR'));
}
function roleOptions(sel){
  const opts=['Administrador Geral','Supervisor','Policial','Consulta'];
  return opts.map(o=>`<option ${String(sel||'')===o||perfilNorm(sel)===perfilNorm(o)?'selected':''}>${o}</option>`).join('');
}
function renderUsersList(){
  const el=$v('v7UsersList'); if(!el) return;
  const arr=uniqueUsers();
  if(!arr.length){ el.innerHTML='<div class="v7-card v7-small">Nenhum usuário cadastrado ainda.</div>'; return; }
  const canEdit=isAdminGeral();
  el.innerHTML=arr.map((u,i)=>{
    const selId='userPerfil_'+i;
    const stId='userStatus_'+i;
    const locked=!canEdit?'disabled':'';
    return `<div class="v7-card" style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><b>${u.nome||u.email}</b><div class="v7-small">${u.graduacao||''} · RE ${u.re||''}<br>${u.email||''}<br>Status: <b>${u.status||'Ativo'}</b></div></div><div style="min-width:210px"><label class="field-lbl">PERFIL</label><select class="field-inp" id="${selId}" ${locked}>${roleOptions(u.perfil||'Policial')}</select><label class="field-lbl">SITUAÇÃO</label><select class="field-inp" id="${stId}" ${locked}><option ${String(u.status||'Ativo')==='Ativo'?'selected':''}>Ativo</option><option ${String(u.status||'Ativo')==='Bloqueado'?'selected':''}>Bloqueado</option></select>${canEdit?`<button class="btn-primary" onclick="saveUserProfile('${u.email}','${selId}','${stId}')">Salvar perfil</button>`:`<div class="v7-small" style="color:#facc15;margin-top:6px">Somente Administrador Geral altera perfil.</div>`}</div></div></div>`;
  }).join('');
}
window.saveUserProfile=async(email,selId,stId)=>{
  if(!isAdminGeral()) return alert('Somente Administrador Geral pode alterar usuários.');
  const perfil=$v(selId).value;
  const status=$v(stId).value;
  const user=uniqueUsers().find(u=>String(u.email).toLowerCase()===String(email).toLowerCase())||{};
  const data={...user,email,perfil,status,updatedBy:v7User.email,updatedAt:serverTimestamp()};
  await setDoc(doc(db,'usuarios',emailKey(email)),data,{merge:true});
  if(user.uid) await setDoc(doc(db,'usuarios',user.uid),data,{merge:true});
  auditV7('perfil_usuario_alterado',`${email}: ${perfil} / ${status}`);
  alert('Perfil atualizado. Peça para o usuário sair e entrar novamente.');
  renderUsersList();
};
function renderAudit(){ const el=$v('v7Audit'); if(!el)return; el.innerHTML=v7Audits.slice(0,20).map(a=>`<div class="v7-card"><b>${a.acao||''}</b><div class="v7-small">${a.detalhe||''}<br>${a.usuario||''}</div></div>`).join('')||'<div class="v7-card v7-small">Sem auditoria.</div>'; }
function allVisitProps(){
  const base=(window.PROPS||[]).map((p,i)=>({key:'base_'+i,id:'base_'+i,baseIndex:i,source:'base',nome:p.nm,municipio:'Casa Branca',quadrante:p.q,lat:p.lat,lng:p.lng,maps:p.gmaps||`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}));
  const cloud=(v7CloudProps||[]).map(p=>({key:'cloud_'+p.id,id:p.id,source:'cloud',nome:p.nome||p.nm||'Propriedade cadastrada',municipio:p.municipio||'Casa Branca',quadrante:p.quadrante||p.q||classQ(parseFloat(p.lat),parseFloat(p.lng)),lat:parseFloat(p.lat),lng:parseFloat(p.lng),maps:p.maps||`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}));
  return base.concat(cloud);
}
function baseVisitProps(){
  return allVisitProps().filter(p=>p.source==='base').map(p=>({...p,id:String(p.baseIndex)}));
}
function cloudVisitProps(){
  return allVisitProps().filter(p=>p.source==='cloud');
}
function fillVisitSelect(selectedKey=''){
  const sel=$v('v7VisitProp'); const arr=allVisitProps();
  sel.innerHTML=arr.map(p=>`<option value="${p.key}" ${p.key===selectedKey?'selected':''}>${p.nome}</option>`).join('');
  if(!selectedKey && arr[0]) $v('v7VisitKey').value=arr[0].key; else $v('v7VisitKey').value=selectedKey;
  updateVisitInfo();
}
function updateVisitInfo(){
  const key=$v('v7VisitKey').value || $v('v7VisitProp').value;
  const p=allVisitProps().find(x=>x.key===key);
  $v('v7VisitInfo').innerHTML=p?`<b>${p.nome}</b><br>${p.municipio||'Casa Branca'} · Quadrante ${p.quadrante||'-'}<br>Data, hora, policial e GPS serão preenchidos automaticamente.`:'Selecione a propriedade.';
}
window.selectVisitPropFromList=()=>{ $v('v7VisitKey').value=$v('v7VisitProp').value; updateVisitInfo(); };
window.openVisitModal=()=>{
  if(!v7User) return alert('Faça login para registrar visita.');
  $v('v7VisitTexto').value=''; $v('v7VisitMsg').innerHTML=''; fillVisitSelect(''); $v('v7VisitModal').classList.add('open');
};
window.openVisitForBase=(idx)=>{ if(!v7User) return alert('Faça login para registrar visita.'); map.closePopup(); $v('v7VisitTexto').value=''; $v('v7VisitMsg').innerHTML=''; fillVisitSelect('base_'+idx); $v('v7VisitModal').classList.add('open'); };
window.openVisitForCloud=(id)=>{ if(!v7User) return alert('Faça login para registrar visita.'); map.closePopup(); $v('v7VisitTexto').value=''; $v('v7VisitMsg').innerHTML=''; fillVisitSelect('cloud_'+id); $v('v7VisitModal').classList.add('open'); };
function renderV7HistoryForProp(p){
  const title=$v('v7HistoryTitle'), sub=$v('v7HistorySub'), list=$v('v7HistoryList');
  if(!p){ title.textContent='📜 Histórico'; sub.textContent='Propriedade não localizada.'; list.innerHTML=''; return; }
  const nome=(p.nome||'').trim();
  const visits=(v7Visits||[]).filter(v=>((v.propriedade||'').trim()===nome)).sort((a,b)=>{
    const ta=a.createdAt?.seconds||0, tb=b.createdAt?.seconds||0; return tb-ta;
  });
  title.textContent='📜 '+nome;
  sub.innerHTML=`${p.municipio||'Casa Branca'} · Quadrante ${p.quadrante||'-'} · ${visits.length} visita(s) registrada(s)`;
  if(!visits.length){
    list.innerHTML='<div class="v7-card"><b>Nenhuma visita registrada ainda.</b><br><span class="v7-small">Use o botão 📋 Registrar visita para criar o primeiro histórico desta propriedade.</span></div>';
    return;
  }
  list.innerHTML=visits.slice(0,30).map(v=>`<div class="v7-card"><b style="color:#ffd700">${v.dataLocal||''} ${v.horaLocal||''}${v._pendente?' · 🟡 pendente':''}</b><br><span class="v7-small">${v.usuarioNome||v.usuario||''}${v.re?' · RE '+v.re:''}</span><div style="margin-top:6px;color:#e5e7eb;white-space:pre-wrap">${(v.observacao||v.texto||'Sem observação').replace(/[<>]/g,'')}</div>${v.maps?`<div style="margin-top:6px"><a href="${v.maps}" target="_blank" style="color:#4ade80;font-weight:700">🧭 Abrir local no Maps ↗</a></div>`:''}</div>`).join('');
}
window.openHistoryForBase=(idx)=>{ map.closePopup(); const p=baseVisitProps().find(x=>x.id===String(idx)); renderV7HistoryForProp(p); $v('v7HistoryModal').classList.add('open'); };
window.openHistoryForCloud=(id)=>{ map.closePopup(); const p=cloudVisitProps().find(x=>x.id===id); renderV7HistoryForProp(p); $v('v7HistoryModal').classList.add('open'); };

function getGpsOnce(){
  return new Promise(resolve=>{
    if(!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(pos=>resolve({lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy}),()=>resolve(null),{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  });
}
function pendingVisits(){ try{return JSON.parse(localStorage.getItem(PENDING_VISITS_KEY)||'[]')}catch(e){return[]} }
function savePendingVisits(arr){ localStorage.setItem(PENDING_VISITS_KEY,JSON.stringify(arr)); }
async function saveVisitCloud(data,p){
  const cloudData={...data,createdAt:serverTimestamp()};
  await addDoc(collection(db,'visitas'),cloudData);
  if(p && p.source==='cloud'){
    await setDoc(doc(db,'propriedades_cadastradas',p.id),{ultimaVisitaTexto:`${data.dataLocal} ${data.horaLocal} · ${data.usuarioNome}`,ultimaVisitaObs:data.observacao,ultimaVisitaPor:data.usuario,ultimaVisitaEm:serverTimestamp()},{merge:true});
  }
}
async function syncPendingVisits(){
  if(!v7User || !navigator.onLine) return;
  let arr=pendingVisits(); if(!arr.length) return;
  const rest=[];
  for(const item of arr){
    try{
      const p=allVisitProps().find(x=>String(x.id)===String(item.propriedadeId)||String(x.nome)===String(item.propriedade));
      await saveVisitCloud(item,p);
      await auditV7('visita_sincronizada',item.propriedade||'sem nome');
    }catch(e){ rest.push(item); }
  }
  savePendingVisits(rest);
  if(rest.length===0) console.log('SISRURAL: visitas pendentes sincronizadas.');
}
window.saveV7Visit=async()=>{
  const msg=$v('v7VisitMsg');
  try{
    if(!v7User) throw Error('Faça login para registrar visita.');
    const key=$v('v7VisitKey').value || $v('v7VisitProp').value;
    const p=allVisitProps().find(x=>x.key===key);
    if(!p) throw Error('Selecione a propriedade.');
    const observacao=$v('v7VisitTexto').value.trim();
    msg.innerHTML='<span style="color:#facc15">Salvando visita...</span>';
    const gps=await getGpsOnce();
    const now=new Date();
    const data={
      propriedadeId:p.id, propriedade:p.nome, origem:p.source, municipio:p.municipio||'Casa Branca', quadrante:p.quadrante||'',
      lat:p.lat, lng:p.lng, gpsVisita:gps, observacao, texto:observacao, usuario:v7User.email,
      usuarioNome:v7Profile?.nome||v7User.email, re:v7Profile?.re||'', graduacao:v7Profile?.graduacao||'',
      dataLocal:now.toLocaleDateString('pt-BR'), horaLocal:now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      createdAtLocal:now.toISOString(), maps:p.maps
    };
    if(navigator.onLine){
      try{
        await saveVisitCloud(data,p);
        await auditV7('visita_registrada',p.nome);
        msg.innerHTML='<span style="color:#4ade80">✅ Visita registrada e sincronizada.</span>';
      }catch(e){
        const arr=pendingVisits(); arr.push(data); savePendingVisits(arr);
        msg.innerHTML='<span style="color:#f59e0b">🟡 Sem envio no momento. Visita salva no aparelho para sincronizar.</span>';
      }
    }else{
      const arr=pendingVisits(); arr.push(data); savePendingVisits(arr);
      msg.innerHTML='<span style="color:#f59e0b">🟡 Visita salva offline no aparelho. Enviaremos quando voltar sinal.</span>';
    }
    $v('v7VisitTexto').value='';
    setTimeout(()=>{ if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.old||'Salvar visita';btn.style.opacity='1';} closeV7Modal('v7VisitModal'); },1600);
  }catch(e){ if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.old||'Salvar visita';btn.style.opacity='1';} msg.innerHTML='<span style="color:#ef4444">'+e.message+'</span>'; }
};
function toastV7(txt){ const d=document.createElement('div'); d.textContent=txt; d.style.cssText='position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:10000;background:#0f172a;color:#e5e7eb;border:1px solid #22c55e;border-radius:12px;padding:10px 14px;font:700 12px Rajdhani,Arial;box-shadow:0 0 18px rgba(0,0,0,.55)'; document.body.appendChild(d); setTimeout(()=>d.remove(),3200); }
function pendingProps(){ try{return JSON.parse(localStorage.getItem(PENDING_PROPS_KEY)||'[]')}catch(e){return[]} }
function savePendingProps(arr){ localStorage.setItem(PENDING_PROPS_KEY,JSON.stringify(arr)); updateOfflineBadge(); }
function normTxt(v){ return String(v||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' '); }
function distMeters(aLat,aLng,bLat,bLng){
  const R=6371000, toRad=x=>x*Math.PI/180;
  const dLat=toRad((+bLat)-(+aLat)), dLng=toRad((+bLng)-(+aLng));
  const la1=toRad(+aLat), la2=toRad(+bLat);
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function isDuplicateProp(pt){
  const nome=normTxt(pt.nm||pt.nome); if(!nome) return false;
  const near=(p)=>{
    const pn=normTxt(p.nm||p.nome); if(pn!==nome) return false;
    const plat=parseFloat(p.lat), plng=parseFloat(p.lng); if(isNaN(plat)||isNaN(plng)||isNaN(pt.lat)||isNaN(pt.lng)) return true;
    return distMeters(pt.lat,pt.lng,plat,plng) <= 60;
  };
  return [...(window.PROPS||[]), ...(window.userPts||[]), ...(v7CloudProps||[]), ...pendingProps()].some(near);
}
function pushPendingPropOnce(pt){
  const arr=pendingProps();
  const tempCloud=v7CloudProps; // reaproveita validador contra a fila local
  const nome=normTxt(pt.nm||pt.nome);
  const exists=arr.some(p=>normTxt(p.nm||p.nome)===nome && (!pt.lat || !p.lat || distMeters(pt.lat,pt.lng,p.lat,p.lng)<=60));
  if(!exists){ arr.push(pt); savePendingProps(arr); return true; }
  savePendingProps(arr); return false;
}
function updateOfflineBadge(){
  const n=pendingProps().length + pendingVisits().length;
  const el=document.getElementById('syncStatusBadge') || (()=>{ const d=document.createElement('div'); d.id='syncStatusBadge'; d.style.cssText='position:fixed;left:10px;bottom:88px;z-index:9999;background:#111827;color:#ffd700;border:1px solid #ffd700;border-radius:10px;padding:7px 10px;font:700 11px Rajdhani,Arial;box-shadow:0 0 12px rgba(0,0,0,.45);display:none'; document.body.appendChild(d); return d; })();
  if(n>0){ el.style.display='block'; el.textContent=`🟡 ${n} registro(s) pendente(s) de sincronização`; } else { el.style.display='none'; }
}
function formProp(){
  const nm=document.getElementById('aNome').value.trim(); let lat=parseFloat(document.getElementById('aLat').value); let lng=parseFloat(document.getElementById('aLng').value);
  if((isNaN(lat)||isNaN(lng)) && window.map){ const c=map.getCenter(); lat=c.lat; lng=c.lng; }
  return {nm, nome:nm, tp:document.getElementById('aTipo').value.trim(), tipo:document.getElementById('aTipo').value.trim(), lat, lng,
    end:document.getElementById('aEnd').value.trim(), endereco:document.getElementById('aEnd').value.trim(), ph:document.getElementById('aTel').value.trim(), telefone:document.getElementById('aTel').value.trim(),
    dirt:document.getElementById('aDirt').checked, dt:new Date().toLocaleString('pt-BR'), maps:`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`};
}
async function savePropCloud(pt){
  if(isDuplicateProp(pt)) return {duplicado:true};
  const data={nome:pt.nm,tipo:pt.tp||'',endereco:pt.end||'',telefone:pt.ph||'',lat:pt.lat,lng:pt.lng,dirt:!!pt.dirt,maps:pt.maps,municipio:'Casa Branca',quadrante:(typeof classQ==='function'?classQ(pt.lat,pt.lng):''),origem:pt._offline?'offline_app':'app',usuario:v7User?.email||'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  return await addDoc(collection(db,'propriedades_cadastradas'),data);
}
function renderCloudProperties(){
  if(window.clearCloudPts) window.clearCloudPts();
  v7CloudProps.forEach(p=>window.renderCloudPt&&window.renderCloudPt(p,p.id));
  try{ if(document.getElementById('sheet')?.classList.contains('open')) selQ(activeQ||1); }catch(e){}
}
async function syncPendingProperties(){
  if(!v7User || !navigator.onLine) return;
  let arr=pendingProps(); if(!arr.length) { updateOfflineBadge(); return; }
  const rest=[];
  for(const pt of arr){
    try{
      const r=await savePropCloud({...pt,_offline:true});
      await auditV7(r?.duplicado?'propriedade_offline_duplicada_ignorada':'propriedade_sincronizada',pt.nm||pt.nome||'sem nome');
    }
    catch(e){ rest.push(pt); }
  }
  savePendingProps(rest); updateOfflineBadge();
  if(rest.length===0){
    console.log('SISRURAL: propriedades pendentes sincronizadas.');
    try{ toastV7('✅ Cadastros offline enviados para o Firebase.'); }catch(e){}
  }
}
async function migrateLocalPointsToCloudOnce(){
  if(!v7User || localStorage.getItem(MIGRATED_LOCAL_KEY)==='1') return;
  const arr=Array.isArray(window.userPts)?window.userPts:[];
  if(!arr.length){ localStorage.setItem(MIGRATED_LOCAL_KEY,'1'); return; }
  const pend=[];
  for(const pt of arr){
    try{ await savePropCloud({...pt, nome:pt.nm, tipo:pt.tp, endereco:pt.end, telefone:pt.ph, maps:`https://www.google.com/maps/dir/?api=1&destination=${pt.lat},${pt.lng}&travelmode=driving`}); await auditV7('propriedade_local_migrada',pt.nm||'sem nome'); }
    catch(e){ pend.push(pt); }
  }
  localStorage.setItem(MIGRATED_LOCAL_KEY,'1');
  window.userPts.length=0; pend.forEach(p=>window.userPts.push(p));
  try{ savePts(); userPtsG.clearLayers(); window.userPts.forEach((p,i)=>renderPt(p,i)); }catch(e){}
}
window.addEventListener('online',()=>{ syncPendingProperties(); syncPendingVisits(); });

window.salvar=async function(){
  const msg=document.getElementById('aMsg');
  const btn=document.getElementById('btnSalvarPonto');
  if(btn && btn.disabled) return;
  const pt=formProp();
  if(!pt.nm){msg.style.cssText='display:block;background:rgba(239,68,68,.15);color:#ef4444';msg.textContent='⚠️ Informe o nome da fazenda.';return;}
  if(isNaN(pt.lat)||isNaN(pt.lng)){msg.style.cssText='display:block;background:rgba(239,68,68,.15);color:#ef4444';msg.textContent='⚠️ Coordenadas inválidas. Use o GPS ou insira manualmente.';return;}
  if(isDuplicateProp(pt)){
    msg.style.cssText='display:block;background:rgba(245,158,11,.15);color:#f59e0b';
    msg.innerHTML='⚠️ Este ponto parece já estar cadastrado ou pendente. O SISRURAL evitou duplicidade.';
    return;
  }
  if(btn){ btn.disabled=true; btn.dataset.old=btn.innerHTML; btn.innerHTML='⏳ Salvando...'; btn.style.opacity='.65'; }
  const finish=(html,ok=true)=>{
    msg.style.cssText=`display:block;background:${ok?'rgba(34,197,94,.15)':'rgba(245,158,11,.15)'};color:${ok?'#22c55e':'#f59e0b'};line-height:1.35`;
    msg.innerHTML=html;
    try{ map.setView([pt.lat,pt.lng],15,{animate:true}); }catch(e){}
    setTimeout(()=>{ if(btn){ btn.disabled=false; btn.innerHTML=btn.dataset.old||'✅ SALVAR PONTO NO SISRURAL'; btn.style.opacity='1'; } },1800);
  };
  if(v7User && navigator.onLine){
    try{
      const r=await savePropCloud(pt); await auditV7(r?.duplicado?'propriedade_duplicada_ignorada':'propriedade_cadastrada',pt.nm);
      if(r?.duplicado){ finish('⚠️ Este ponto já existia no sistema. Não foi cadastrado novamente.',false); return; }
      finish(`✅ "${pt.nm}" salvo na nuvem e sincronizado.`,true);
      setTimeout(closeAdd,1400);
    }catch(e){
      const added=pushPendingPropOnce({...pt, erro:e.message, _offline:true});
      if(added){ userPts.push(pt); savePts(); renderPt(pt,userPts.length-1); }
      try{ if(document.getElementById('sheet')?.classList.contains('open')) selQ(activeQ||classQ(pt.lat,pt.lng)); }catch(e){}
      finish(`🟡 <b>SEM INTERNET / SEM ENVIO</b><br>Cadastro salvo no aparelho.<br>Quando o celular voltar a ter sinal, o SISRURAL enviará automaticamente.<br><b>Não clique novamente.</b>`,false);
      setTimeout(closeAdd,2600);
    }
  } else {
    const added=pushPendingPropOnce({...pt,_offline:true});
    if(added){ userPts.push(pt); savePts(); renderPt(pt,userPts.length-1); }
    try{ if(document.getElementById('sheet')?.classList.contains('open')) selQ(activeQ||classQ(pt.lat,pt.lng)); }catch(e){}
    finish(`🟡 <b>SEM INTERNET</b><br>"${pt.nm}" foi salvo no aparelho.<br>Quando voltar o sinal, o SISRURAL fará o envio automático.<br><b>Não é necessário clicar novamente.</b>`,false);
    setTimeout(closeAdd,3000);
  }
};

function v7ToDate(v){
  if(!v) return null;
  if(v.createdAt && typeof v.createdAt.toDate==='function') return v.createdAt.toDate();
  if(v.ultimaVisitaEm && typeof v.ultimaVisitaEm.toDate==='function') return v.ultimaVisitaEm.toDate();
  if(v.dataLocal){
    const parts=String(v.dataLocal).match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if(parts){ const d=new Date(+parts[3],+parts[2]-1,+parts[1]); if(!isNaN(d)) return d; }
  }
  return null;
}
function v7SameDay(a,b){ return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function v7MonthKey(d){ return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`:''; }
function v7AllPropsForReport(){
  const base=(window.PROPS||[]).map(p=>({nome:p.nm||p.nome,tipo:p.tp||p.tipo,lat:p.lat,lng:p.lng,quadrante:p.q||classQ(p.lat,p.lng),origem:'base'}));
  const cloud=(v7CloudProps||[]).map(p=>({nome:p.nome||p.nm,tipo:p.tipo||p.tp,lat:p.lat,lng:p.lng,quadrante:p.quadrante||classQ(p.lat,p.lng),origem:'nuvem',ultimaVisitaEm:p.ultimaVisitaEm,ultimaVisitaTexto:p.ultimaVisitaTexto}));
  const local=(window.userPts||[]).map(p=>({nome:p.nm||p.nome,tipo:p.tp||p.tipo,lat:p.lat,lng:p.lng,quadrante:p.q||classQ(p.lat,p.lng),origem:'local'}));
  const m=new Map();
  [...base,...cloud,...local].forEach(p=>{ const k=normTxt(p.nome)+'|'+(p.quadrante||''); if(p.nome&&!m.has(k)) m.set(k,p); });
  return [...m.values()];
}

function v7VisitQuadrante(v){ return v.quadrante || v.q || (v.lat&&v.lng?classQ(v.lat,v.lng):''); }
function v7VisitPropName(v){ return v.propriedade || v.propriedadeNome || v.nome || ''; }
function v7VisitObs(v){ return v.observacao || v.texto || ''; }
function v7FmtDate(d){ return d?d.toLocaleDateString('pt-BR'):''; }
function v7FmtHour(d){ return d?d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''; }
function v7QLabel(q){ return ({1:'Q1 - Alfa',2:'Q2 - Bravo',3:'Q3 - Charlie',4:'Q4 - Delta'}[String(q)]||q||''); }
function v7GetReportFilters(){
  const ini=document.getElementById('relDataIni')?.value||'';
  const fim=document.getElementById('relDataFim')?.value||'';
  const q=document.getElementById('relQuadrante')?.value||'';
  const busca=normTxt(document.getElementById('relBusca')?.value||'');
  const di=ini?new Date(ini+'T00:00:00'):null;
  const df=fim?new Date(fim+'T23:59:59'):null;
  return {ini,fim,q,busca,di,df};
}
function v7PrepareVisits(){
  return (v7Visits||[]).map(v=>({...v,_dt:v7ToDate(v),_q:String(v7VisitQuadrante(v)||''),_prop:v7VisitPropName(v),_obs:v7VisitObs(v)}));
}
function v7FilteredVisits(){
  const f=v7GetReportFilters();
  return v7PrepareVisits().filter(v=>{
    if(f.di && (!v._dt || v._dt<f.di)) return false;
    if(f.df && (!v._dt || v._dt>f.df)) return false;
    if(f.q && String(v._q)!==String(f.q)) return false;
    if(f.busca){
      const hay=normTxt([v._prop,v.usuarioNome,v.usuario,v.re,v._obs,v.municipio].join(' '));
      if(!hay.includes(f.busca)) return false;
    }
    return true;
  });
}
function v7ReportStats(){
  const now=new Date();
  const props=v7AllPropsForReport();
  const visits=v7PrepareVisits();
  const filtered=v7FilteredVisits();
  const today=visits.filter(v=>v7SameDay(v._dt,now));
  const month=visits.filter(v=>v7MonthKey(v._dt)===v7MonthKey(now));
  const byQ={1:0,2:0,3:0,4:0}; month.forEach(v=>{ if(byQ[v._q]!==undefined) byQ[v._q]++; });
  const todayQ={1:0,2:0,3:0,4:0}; today.forEach(v=>{ if(todayQ[v._q]!==undefined) todayQ[v._q]++; });
  const filtQ={1:0,2:0,3:0,4:0}; filtered.forEach(v=>{ if(filtQ[v._q]!==undefined) filtQ[v._q]++; });
  const byUser={}; month.forEach(v=>{ const u=v.usuarioNome||v.nome||v.usuario||'Não informado'; byUser[u]=(byUser[u]||0)+1; });
  const byUserFiltered={}; filtered.forEach(v=>{ const u=v.usuarioNome||v.nome||v.usuario||'Não informado'; byUserFiltered[u]=(byUserFiltered[u]||0)+1; });
  const visitedNames=new Set(visits.map(v=>normTxt(v._prop)).filter(Boolean));
  const never=props.filter(p=>!visitedNames.has(normTxt(p.nome)));
  const olderDays=(days)=>props.filter(p=>{
    const n=normTxt(p.nome); const pv=visits.filter(v=>normTxt(v._prop)===n && v._dt).sort((a,b)=>b._dt-a._dt)[0];
    if(!pv) return false;
    return (now-pv._dt)/(1000*60*60*24)>days;
  });
  const latestByProp=new Map();
  visits.filter(v=>v._prop&&v._dt).sort((a,b)=>b._dt-a._dt).forEach(v=>{ const k=normTxt(v._prop); if(!latestByProp.has(k)) latestByProp.set(k,v); });
  return {props,visits,filtered,today,month,byQ,todayQ,filtQ,byUser,byUserFiltered,never,older30:olderDays(30),older60:olderDays(60),older90:olderDays(90),latestByProp};
}
function v7BarLine(label,n,max){
  const pct=max?Math.max(4,Math.round((n/max)*100)):0;
  return `<div style="display:grid;grid-template-columns:95px 1fr 36px;align-items:center;gap:8px;margin:5px 0"><span>${label}</span><div style="height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#22c55e,#facc15);border-radius:999px"></div></div><b style="text-align:right">${n}</b></div>`;
}
function renderCommanderDashboard(){
  const el=document.getElementById('capDashboard'); if(!el) return;
  const st=v7ReportStats();
  const prod=Object.entries(st.byUser).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([u,n])=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0"><span>${u}</span><b>${n}</b></div>`).join('')||'<div>Nenhuma visita no mês.</div>';
  const prodFilt=Object.entries(st.byUserFiltered).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([u,n])=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0"><span>${u}</span><b>${n}</b></div>`).join('')||'<div>Nenhuma visita no filtro.</div>';
  const maxQ=Math.max(1,...Object.values(st.filtQ));
  const qBars=[1,2,3,4].map(q=>v7BarLine(v7QLabel(q),st.filtQ[q]||0,maxQ)).join('');
  const neverList=st.never.slice(0,5).map(p=>`<div style="border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0">${p.nome||''} <span style="color:#60a5fa">${v7QLabel(p.quadrante)}</span></div>`).join('')||'<div>Nenhuma pendência.</div>';
  el.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin-bottom:10px">
      <div class="v7-card"><b style="color:var(--ac);font-size:20px">${st.props.length}</b><br>Propriedades</div>
      <div class="v7-card"><b style="color:#4ade80;font-size:20px">${st.today.length}</b><br>Visitas hoje</div>
      <div class="v7-card"><b style="color:#facc15;font-size:20px">${st.month.length}</b><br>Visitas no mês</div>
      <div class="v7-card"><b style="color:#ef4444;font-size:20px">${st.never.length}</b><br>Nunca visitadas</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div class="v7-card"><b>Visitas do mês por quadrante</b>${[1,2,3,4].map(q=>v7BarLine(v7QLabel(q),st.byQ[q]||0,Math.max(1,...Object.values(st.byQ)))).join('')}</div>
      <div class="v7-card"><b>Produtividade no mês</b>${prod}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div class="v7-card"><b>Resultado do filtro atual</b><br><span style="font-size:22px;color:#38bdf8;font-weight:900">${st.filtered.length}</span> visitas<br>${qBars}</div>
      <div class="v7-card"><b>Produtividade no filtro</b>${prodFilt}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      <div class="v7-card"><b style="color:#ef4444">${st.never.length}</b><br>Nunca visitadas</div>
      <div class="v7-card"><b style="color:#f59e0b">${st.older30.length}</b><br>+30 dias</div>
      <div class="v7-card"><b style="color:#fb7185">${st.older60.length}</b><br>+60 dias</div>
      <div class="v7-card"><b style="color:#dc2626">${st.older90.length}</b><br>+90 dias</div>
    </div>
    <div class="v7-card" style="margin-top:8px"><b>Primeiras propriedades nunca visitadas</b>${neverList}</div>`;
}
['relDataIni','relDataFim','relQuadrante','relBusca'].forEach(id=>setTimeout(()=>{ const e=document.getElementById(id); if(e) e.oninput=renderCommanderDashboard; },500));
window.openCommanderReport=()=>{
  const st=v7ReportStats();
  const f=v7GetReportFilters();
  const today=new Date().toLocaleDateString('pt-BR');
  const visits=st.filtered.slice().sort((a,b)=>(b._dt||0)-(a._dt||0));
  const linhas=visits.map(v=>`<tr><td>${v.dataLocal||v7FmtDate(v._dt)}</td><td>${v.horaLocal||v7FmtHour(v._dt)}</td><td>${v._prop||''}</td><td>${v7QLabel(v._q)}</td><td>${v.usuarioNome||v.usuario||''}</td><td>${v._obs||''}</td><td>${v.maps?`<a href="${v.maps}">Mapa</a>`:''}</td></tr>`).join('');
  const periodo=(f.ini||f.fim)?`${f.ini||'início'} até ${f.fim||'hoje'}`:'Todos os registros';
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Relatório SISRURAL</title><link rel="stylesheet" href="./css/premium.css"></head><body><button onclick="window.print()">Imprimir / Salvar PDF</button><h1>SISRURAL - Relatório Operacional de Visitas</h1><p><b>2ª Companhia PM · 24º BPM/I</b><br>Emitido em ${today}<br>Período: ${periodo}<br>Quadrante: ${f.q?v7QLabel(f.q):'Todos'} · Busca: ${f.busca||'Todos'}</p><div class="box"><div><b>${st.props.length}</b><br>Propriedades</div><div><b>${st.filtered.length}</b><br>Visitas filtradas</div><div><b>${st.today.length}</b><br>Visitas hoje</div><div><b>${st.month.length}</b><br>Visitas no mês</div></div><h2>Visitas realizadas</h2><table><thead><tr><th>Data</th><th>Hora</th><th>Propriedade</th><th>Quadrante</th><th>Policial</th><th>Observação</th><th>Mapa</th></tr></thead><tbody>${linhas||'<tr><td colspan="7">Nenhuma visita localizada.</td></tr>'}</tbody></table><p style="margin-top:28px">_________________________________________<br>Comandante/Supervisor</p></body></html>`;
  const w=window.open('','_blank'); w.document.open(); w.document.write(html); w.document.close();
};
window.exportCommanderReportCSV=()=>{
  const st=v7ReportStats();
  const rows=[['data','hora','propriedade','quadrante','policial','observacao','maps']].concat(st.filtered.map(v=>[v.dataLocal||v7FmtDate(v._dt),v.horaLocal||v7FmtHour(v._dt),v._prop||'',v7QLabel(v._q),v.usuarioNome||v.usuario||'',v._obs||'',v.maps||'']));
  downloadCSV('sisrural-relatorio-visitas-capitao.csv',rows);
};

window.exportV7FarmsCSV=()=>{ const arr=[...(window.PROPS||[]),...(v7CloudProps.map(p=>({nm:p.nome,tp:p.tipo,lat:p.lat,lng:p.lng,end:p.endereco,ph:p.telefone,q:''}))),...((window.userPts||[]).map(p=>({nm:p.nm,tp:p.tp,lat:p.lat,lng:p.lng,end:p.end,ph:p.ph,q:''})))]; const rows=[['nome','tipo','telefone','endereco','lat','lng','quadrante','maps']].concat(arr.map(p=>[p.nm,p.tp,p.ph,p.end,p.lat,p.lng,p.q,`https://www.google.com/maps?q=${p.lat},${p.lng}`])); downloadCSV('sisrural-fazendas.csv',rows); };
window.exportV7VisitsCSV=()=>{ const rows=[['data','hora','propriedade','municipio','quadrante','observacao','usuario','nome','re','maps']].concat(v7Visits.map(v=>[v.dataLocal,v.horaLocal,v.propriedade,v.municipio,v.quadrante,v.observacao||v.texto,v.usuario,v.usuarioNome,v.re,v.maps])); downloadCSV('sisrural-visitas.csv',rows); };
function downloadCSV(name,rows){ const csv=rows.map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(';')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download=name; a.click(); }
