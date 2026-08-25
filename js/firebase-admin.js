// SISRURAL V9.1 - firebase-admin.js - LOGIN FIX
import { firebaseConfig, ADMIN_EMAIL, APP_INFO, ADMIN_EMAILS_FIXOS } from '../config.firebase.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getStorage, ref as storageRef, getBlob } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
let v7User=null, v7Profile=null, v7Requests=[], v7Visits=[], v7Audits=[], v7CloudProps=[], v7Users=[], v7Devices=[]; window.v7CloudProps=v7CloudProps;
const PENDING_PROPS_KEY='sisrural_pending_props_v1';
const MIGRATED_LOCAL_KEY='sisrural_local_props_migrated_v1';
const ADMIN = ADMIN_EMAIL || 'ferpozzer@gmail.com';
const ADMIN_EMAILS = Array.from(new Set([String(ADMIN).toLowerCase(),'ferpozzer@gmail.com',...(Array.isArray(ADMIN_EMAILS_FIXOS)?ADMIN_EMAILS_FIXOS:[]).map(e=>String(e).toLowerCase())]));
const $v=id=>document.getElementById(id);
const emailKey = email => String(email||'').toLowerCase().replace(/[^a-z0-9]/g,'_');
const DEVICE_KEY='sisrural_device_id_v1';
function getSisruralDeviceId(){
  try{
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){
      const raw=(globalThis.crypto?.randomUUID?.() || ('dev-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
      id='sis-'+raw;
      localStorage.setItem(DEVICE_KEY,id);
    }
    return id;
  }catch(e){ return 'sessao-'+Date.now()+'-'+Math.random().toString(36).slice(2); }
}
function devicePlatformInfo(){
  const ua=navigator.userAgent||'';
  let plataforma='Navegador';
  if(/Android/i.test(ua)) plataforma='Android / PWA';
  else if(/iPhone|iPad|iPod/i.test(ua)) plataforma='iPhone/iPad / PWA';
  else if(/Windows/i.test(ua)) plataforma='Windows';
  else if(/Macintosh|Mac OS/i.test(ua)) plataforma='macOS';
  return {plataforma,userAgent:ua.slice(0,240),idioma:navigator.language||'',tela:`${screen?.width||0}x${screen?.height||0}`};
}
async function registerCurrentDevice(){
  if(!v7User) return;
  try{
    const deviceId=getSisruralDeviceId();
    const info=devicePlatformInfo();
    const ref=doc(db,'dispositivos_acesso',deviceId);
    const snap=await getDoc(ref);
    const old=snap.exists()?snap.data():{};
    await setDoc(ref,{
      deviceId,
      usuarioUid:v7User.uid,
      email:String(v7User.email||'').toLowerCase(),
      nome:v7Profile?.nome||v7User.email||'',
      re:v7Profile?.re||'',
      perfil:v7Profile?.perfil||'Policial',
      plataforma:info.plataforma,
      userAgent:info.userAgent,
      idioma:info.idioma,
      tela:info.tela,
      status:old.status||'Pendente',
      primeiroAcesso:old.primeiroAcesso||serverTimestamp(),
      ultimoAcesso:serverTimestamp(),
      observacao:'Fase A - registro de dispositivo sem bloqueio'
    },{merge:true});
  }catch(e){ console.warn('SISRURAL: falha ao registrar dispositivo (não bloqueante).',e); }
}
function perfilNorm(p){ return String(p||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
function isAdminGeral(){ const email=String(v7User?.email||'').toLowerCase(); const p=perfilNorm(v7Profile?.perfil); return !!v7User && (ADMIN_EMAILS.includes(email) || ['administrador','administrador geral','comandante'].includes(p)); }
function isSupervisor(){ const p=perfilNorm(v7Profile?.perfil); return ['supervisor','capitao','capitao pm','tenente'].includes(p); }
function canOpenAdminPanel(){ return isAdminGeral() || isSupervisor(); }
function isAdmin(){ return isAdminGeral(); }
async function auditV7(acao,detalhe){ try{ await addDoc(collection(db,'auditoria'),{acao,detalhe,usuario:v7User?.email||'',createdAt:serverTimestamp(),app:'SISRURAL V10.3 CAMPO FIX'}); }catch(e){} }
function generateTemporarySecret(){
  try{
    const bytes=new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return 'Sr!'+Array.from(bytes,b=>b.toString(36).padStart(2,'0')).join('').slice(0,30)+'9a';
  }catch(e){
    return 'Sr!'+Date.now().toString(36)+Math.random().toString(36).slice(2)+'9a';
  }
}
async function createAuthUserForPolice(email,nome){
  const appName='sisrural-create-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const app2=initializeApp(firebaseConfig, appName);
  const auth2=getAuth(app2);
  let created=false, exists=false;
  try{
    try{
      const cred=await createUserWithEmailAndPassword(auth2,email,generateTemporarySecret());
      created=true;
      try{ await updateProfile(cred.user,{displayName:nome||email}); }catch(e){}
      try{ await signOut(auth2); }catch(e){}
    }catch(e){
      if(e.code==='auth/email-already-in-use') exists=true;
      else throw e;
    }
    await sendPasswordResetEmail(auth2,email);
    return {created,exists,resetSent:true};
  }catch(e){
    e.accountCreated=created;
    e.accountExists=exists;
    throw e;
  }finally{
    try{ await deleteApp(app2); }catch(e){}
  }
}


// ─────────────────────────────────────────────────────────────
// SISRURAL V11.1 DEV – Fotos de referência da propriedade via Cloudinary
// Máximo 2 fotos. O navegador comprime a imagem, envia ao Cloudinary e
// o Firestore guarda apenas URLs/metadados. A fila offline continua em IndexedDB.
// Leitura de fotos antigas do Firebase Storage é mantida por compatibilidade.
// ─────────────────────────────────────────────────────────────
const PROPERTY_PHOTO_MAX=2;
const PROPERTY_PHOTO_MAX_EDGE=1280;
const PROPERTY_PHOTO_QUALITY=.74;
const CLOUDINARY_CLOUD_NAME='bgbxcibj';
const CLOUDINARY_UPLOAD_PRESET='sisrural_propriedades';
const CLOUDINARY_API_KEY='796842865729662'; // chave pública; nunca incluir API Secret no cliente
const CLOUDINARY_UPLOAD_URL=`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
let propertyPhotoBlobs=[null,null];
let propertyPhotoObjectUrls=[];
let viewerPhotoObjectUrls=[];
let existingPhotoEdit={propertyId:'',baseIndex:null,blobs:[null,null],objectUrls:[],existingUrls:['',''],nome:''};
const PHOTO_DB='sisrural_media_v1', PHOTO_STORE='property_photos';
function photoDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(PHOTO_DB,1);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains(PHOTO_STORE)) db.createObjectStore(PHOTO_STORE,{keyPath:'id'}); };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function photoDbPut(rec){ const db=await photoDb(); return new Promise((res,rej)=>{ const tx=db.transaction(PHOTO_STORE,'readwrite'); tx.objectStore(PHOTO_STORE).put(rec); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }
async function photoDbAll(){ const db=await photoDb(); return new Promise((res,rej)=>{ const tx=db.transaction(PHOTO_STORE,'readonly'); const r=tx.objectStore(PHOTO_STORE).getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); }); }
async function photoDbDelete(id){ const db=await photoDb(); return new Promise((res,rej)=>{ const tx=db.transaction(PHOTO_STORE,'readwrite'); tx.objectStore(PHOTO_STORE).delete(id); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }
async function compressPropertyPhoto(file){
  if(!file || !String(file.type||'').startsWith('image/')) throw Error('Selecione uma imagem válida.');
  const bmp=await createImageBitmap(file);
  const scale=Math.min(1,PROPERTY_PHOTO_MAX_EDGE/Math.max(bmp.width,bmp.height));
  const w=Math.max(1,Math.round(bmp.width*scale)), h=Math.max(1,Math.round(bmp.height*scale));
  const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
  canvas.getContext('2d',{alpha:false}).drawImage(bmp,0,0,w,h); try{bmp.close();}catch(e){}
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Falha ao comprimir a foto.')),'image/jpeg',PROPERTY_PHOTO_QUALITY));
}
function clearPhotoObjectUrls(arr){ while(arr.length){ try{URL.revokeObjectURL(arr.pop())}catch(e){} } }
window.resetPropertyPhotoInputs=()=>{
  propertyPhotoBlobs=[null,null]; clearPhotoObjectUrls(propertyPhotoObjectUrls);
  for(let i=0;i<2;i++){
    const input=$v('aFoto'+(i+1)), img=$v('aFotoPreview'+(i+1)), empty=$v('aFotoEmpty'+(i+1));
    if(input) input.value=''; if(img){img.removeAttribute('src');img.style.display='none';} if(empty) empty.style.display='flex';
  }
  const st=$v('aFotoStatus'); if(st) st.textContent='Até 2 fotos opcionais. O SISRURAL comprime automaticamente antes do envio.';
};
window.handlePropertyPhotoInput=async(index,input)=>{
  const st=$v('aFotoStatus');
  try{
    const file=input?.files?.[0]; if(!file){propertyPhotoBlobs[index]=null;return;}
    if(st) st.textContent='⏳ Otimizando foto...';
    const blob=await compressPropertyPhoto(file); propertyPhotoBlobs[index]=blob;
    if(propertyPhotoObjectUrls[index]) try{URL.revokeObjectURL(propertyPhotoObjectUrls[index])}catch(e){}
    const url=URL.createObjectURL(blob); propertyPhotoObjectUrls[index]=url;
    const img=$v('aFotoPreview'+(index+1)), empty=$v('aFotoEmpty'+(index+1)); if(img){img.src=url;img.style.display='block';} if(empty) empty.style.display='none';
    const kb=Math.round(blob.size/1024); if(st) st.textContent=`✅ Foto ${index+1} pronta (${kb} KB). Máximo de 2 fotos por propriedade.`;
  }catch(e){ input.value=''; propertyPhotoBlobs[index]=null; if(st) st.textContent='⚠️ '+e.message; }
};
async function queuePropertyPhotos(batchId,blobs,propertyId=''){
  for(let i=0;i<blobs.length;i++) if(blobs[i]) await photoDbPut({id:`${batchId}_${i}`,batchId,index:i,blob:blobs[i],propertyId,createdAt:Date.now()});
  await refreshPendingPhotoBadge();
}
async function bindPhotoBatchToProperty(batchId,propertyId){
  const all=await photoDbAll(); for(const r of all.filter(x=>x.batchId===batchId)){ r.propertyId=propertyId; await photoDbPut(r); }
}
async function uploadPhotoToCloudinary(blob){
  const send=async(includeApiKey=false)=>{
    const body=new FormData();
    body.append('file',blob,'foto.jpg');
    body.append('upload_preset',CLOUDINARY_UPLOAD_PRESET);
    // Alguns ambientes Cloudinary retornam "Unknown API key" mesmo com preset unsigned.
    // A API key é identificador público (não é o API Secret) e pode ser enviada no retry.
    if(includeApiKey) body.append('api_key',CLOUDINARY_API_KEY);
    const resp=await fetch(CLOUDINARY_UPLOAD_URL,{method:'POST',body});
    let data=null; try{data=await resp.json();}catch(e){}
    return {resp,data};
  };

  let {resp,data}=await send(false);
  const firstError=String(data?.error?.message||'');
  if(!resp.ok && /unknown api key/i.test(firstError)){
    ({resp,data}=await send(true));
  }
  if(!resp.ok || !data?.secure_url){
    const detail=String(data?.error?.message||`Falha no envio da foto (${resp.status}).`);
    throw Error(`${detail} [Cloudinary: ${CLOUDINARY_CLOUD_NAME} / preset: ${CLOUDINARY_UPLOAD_PRESET}]`);
  }
  return {url:data.secure_url,publicId:data.public_id||'',width:data.width||0,height:data.height||0,bytes:data.bytes||blob.size};
}
async function persistCloudinaryPhotoSlot(propertyId,index,uploaded){
  const ref=doc(db,'propriedades_cadastradas',propertyId);
  const snap=await getDoc(ref); const old=snap.exists()?snap.data():{};
  const urls=[old.foto1Url||'',old.foto2Url||''];
  const ids=[old.foto1PublicId||'',old.foto2PublicId||''];
  urls[index]=uploaded.url; ids[index]=uploaded.publicId||'';
  const patch={
    [`foto${index+1}Url`]:uploaded.url,
    [`foto${index+1}PublicId`]:uploaded.publicId||'',
    fotosUrls:urls.filter(Boolean),
    fotosPublicIds:ids.filter(Boolean),
    fotosQuantidade:urls.filter(Boolean).length,
    fotosProvider:'cloudinary',
    fotosAtualizadasEm:serverTimestamp()
  };
  await setDoc(ref,patch,{merge:true});
}
async function uploadQueuedPhotosForProperty(propertyId,batchId=''){
  const all=await photoDbAll();
  const rows=all.filter(r=>r.propertyId===propertyId || (batchId && r.batchId===batchId));
  if(!rows.length) return [];
  const urls=[];
  for(const r of rows.sort((a,b)=>a.index-b.index)){
    // V11.3: se o Cloudinary já recebeu a imagem mas o Firestore falhou,
    // reutiliza a URL salva na fila e NÃO envia a mesma foto novamente.
    let uploaded = r.uploadedUrl ? {
      url:r.uploadedUrl,
      publicId:r.uploadedPublicId||'',
      width:r.uploadedWidth||0,
      height:r.uploadedHeight||0,
      bytes:r.uploadedBytes||r.blob?.size||0
    } : null;
    if(!uploaded){
      uploaded=await uploadPhotoToCloudinary(r.blob);
      r.uploadedUrl=uploaded.url;
      r.uploadedPublicId=uploaded.publicId||'';
      r.uploadedWidth=uploaded.width||0;
      r.uploadedHeight=uploaded.height||0;
      r.uploadedBytes=uploaded.bytes||0;
      r.lastError='';
      await photoDbPut(r);
    }
    try{
      await persistCloudinaryPhotoSlot(propertyId,r.index,uploaded);
      urls.push(uploaded.url);
      await photoDbDelete(r.id);
    }catch(e){
      r.lastError=String(e?.message||e||'Falha ao gravar URL da foto no Firestore.');
      r.lastAttemptAt=Date.now();
      await photoDbPut(r);
      throw e;
    }
  }
  await refreshPendingPhotoBadge(); return urls;
}
async function savePhotosForCloudProperty(propertyId,blobs){
  const clean=blobs.filter(Boolean).slice(0,PROPERTY_PHOTO_MAX); if(!clean.length) return [];
  const batchId='photo-'+Date.now()+'-'+Math.random().toString(36).slice(2); await queuePropertyPhotos(batchId,clean,propertyId);
  return await uploadQueuedPhotosForProperty(propertyId,batchId);
}
async function repairPendingPhotoQueue(){
  // V11.4: remove apenas resíduos impossíveis de sincronizar de versões antigas.
  // Fotos sem propertyId só são preservadas quando ainda pertencem a um cadastro
  // de propriedade realmente pendente (_photoBatchId). Também elimina duplicatas
  // do mesmo slot, mantendo o registro mais recente/mais avançado.
  const all=await photoDbAll();
  const activeBatches=new Set(pendingProps().map(p=>p?._photoBatchId).filter(Boolean));
  const keep=[];
  const byKey=new Map();
  for(const r of all){
    if(!r) continue;
    if(!r.propertyId && !activeBatches.has(r.batchId)){
      try{ await photoDbDelete(r.id); }catch(e){}
      continue;
    }
    const key=`${r.propertyId||('batch:'+r.batchId)}::${Number(r.index)||0}`;
    const prev=byKey.get(key);
    if(!prev){ byKey.set(key,r); continue; }
    // prioriza item que já foi enviado ao Cloudinary; em empate, o mais recente
    const score=x=>(x.uploadedUrl?1e15:0)+(Number(x.createdAt)||0);
    const winner=score(r)>=score(prev)?r:prev;
    const loser=winner===r?prev:r;
    byKey.set(key,winner);
    try{ await photoDbDelete(loser.id); }catch(e){}
  }
  await refreshPendingPhotoBadge();
}
async function syncPendingPropertyPhotos(){
  if(!v7User || !navigator.onLine) return;
  await repairPendingPhotoQueue();
  const all=await photoDbAll();
  const ids=[...new Set(all.map(r=>r.propertyId).filter(Boolean))];
  let lastError='';
  for(const id of ids){
    try{ await uploadQueuedPhotosForProperty(id); }
    catch(e){ lastError=String(e?.message||e||'Falha no envio'); console.warn('SISRURAL: foto pendente ainda não enviada.',e); }
  }
  window.__sisruralLastPhotoSyncError=lastError;
  await refreshPendingPhotoBadge();
}
async function refreshPendingPhotoBadge(){
  try{
    const n=(await photoDbAll()).length; let el=$v('photoSyncBadge');
    if(!el){el=document.createElement('div');el.id='photoSyncBadge';el.style.cssText='position:fixed;left:10px;bottom:126px;z-index:9999;background:#111827;color:#93c5fd;border:1px solid #60a5fa;border-radius:10px;padding:7px 10px;font:700 11px Rajdhani,Arial;box-shadow:0 0 12px rgba(0,0,0,.45);display:none';document.body.appendChild(el);}
    el.style.display=n?'block':'none';
    if(n){
      const err=window.__sisruralLastPhotoSyncError||'';
      const curto=err?String(err).replace(/\s+/g,' ').slice(0,72):'';
      el.textContent=`📷 ${n} foto(s) aguardando envio${err?' · '+curto:''}`;
      el.title=err||'Fotos aguardando sincronização';
    }
  }catch(e){}
}
window.openPropertyPhotos=async(propertyId)=>{
  if(!v7User){ alert('Faça login no SISRURAL para visualizar as fotos.'); return; }
  const modal=$v('v7PhotoModal'), list=$v('v7PhotoList'), title=$v('v7PhotoTitle'); if(!modal||!list) return;
  modal.classList.add('open'); list.innerHTML='<div class="v7-small">⏳ Carregando fotos de referência...</div>'; clearPhotoObjectUrls(viewerPhotoObjectUrls);
  try{
    let p=(v7CloudProps||[]).find(x=>String(x.id)===String(propertyId));
    if(!p){const snap=await getDoc(doc(db,'propriedades_cadastradas',propertyId)); if(snap.exists()) p={id:snap.id,...snap.data()};}
    if(!p) throw Error('Propriedade não localizada.'); title.textContent='📷 '+(p.nome||'Fotos da propriedade');
    const urls=[p.foto1Url||'',p.foto2Url||''].filter(Boolean).length
      ? [p.foto1Url||'',p.foto2Url||''].filter(Boolean)
      : (Array.isArray(p.fotosUrls)?p.fotosUrls.filter(Boolean).slice(0,2):[]);
    const cards=[];
    if(urls.length){
      for(let i=0;i<urls.length;i++) cards.push(`<div class="property-photo-view-card"><img src="${urls[i]}" alt="Foto ${i+1} da propriedade" loading="lazy"><div>Foto ${i+1}</div></div>`);
    }else{
      // Compatibilidade com eventuais fotos antigas gravadas no Firebase Storage.
      const paths=Array.isArray(p.fotosPaths)?p.fotosPaths.slice(0,2):[];
      for(let i=0;i<paths.length;i++){
        const blob=await getBlob(storageRef(storage,paths[i])); const url=URL.createObjectURL(blob); viewerPhotoObjectUrls.push(url);
        cards.push(`<div class="property-photo-view-card"><img src="${url}" alt="Foto ${i+1} da propriedade"><div>Foto ${i+1}</div></div>`);
      }
    }
    if(!cards.length){list.innerHTML='<div class="v7-card"><b>Nenhuma foto cadastrada.</b><br><span class="v7-small">As fotos são opcionais e servem apenas como referência visual da propriedade.</span></div>';return;}
    list.innerHTML=`<div class="property-photo-view-grid">${cards.join('')}</div>`;
  }catch(e){ list.innerHTML='<div class="v7-card" style="color:#dc2626"><b>Não foi possível abrir as fotos.</b><br><span class="v7-small">'+String(e.message||e)+'</span></div>'; }
};
window.closePropertyPhotos=()=>{clearPhotoObjectUrls(viewerPhotoObjectUrls); $v('v7PhotoModal')?.classList.remove('open');};
window.closeExistingPropertyPhotoEditor=()=>{ clearPhotoObjectUrls(existingPhotoEdit.objectUrls); existingPhotoEdit={propertyId:'',baseIndex:null,blobs:[null,null],objectUrls:[],existingUrls:['',''],nome:''}; $v('v7PhotoEditModal')?.classList.remove('open'); };
function setExistingPhotoPreview(index,url){
  const img=$v('eFotoPreview'+(index+1)), empty=$v('eFotoEmpty'+(index+1));
  if(img){ if(url){img.src=url;img.style.display='block';}else{img.removeAttribute('src');img.style.display='none';} }
  if(empty) empty.style.display=url?'none':'flex';
}
function existingPhotoCount(){ return [0,1].filter(i=>existingPhotoEdit.blobs[i]||existingPhotoEdit.existingUrls[i]).length; }
function updateExistingPhotoStatus(extra=''){
  const st=$v('eFotoStatus'); if(st) st.textContent=`${existingPhotoCount()}/2 fotos vinculadas.${extra?' '+extra:''}`;
}
async function openExistingPropertyPhotoEditor(propertyId,baseIndex=null){
  if(!v7User) return alert('Faça login para adicionar fotos.');
  let p=(v7CloudProps||[]).find(x=>String(x.id)===String(propertyId));
  if(!p && propertyId){ try{const snap=await getDoc(doc(db,'propriedades_cadastradas',propertyId)); if(snap.exists()) p={id:snap.id,...snap.data()};}catch(e){} }
  if(!p) return alert('Propriedade não localizada na nuvem.');
  clearPhotoObjectUrls(existingPhotoEdit.objectUrls);
  existingPhotoEdit={propertyId:p.id,baseIndex,blobs:[null,null],objectUrls:[],existingUrls:[p.foto1Url||'',p.foto2Url||''],nome:p.nome||p.nm||'Propriedade'};
  if(!existingPhotoEdit.existingUrls.some(Boolean) && Array.isArray(p.fotosUrls)) existingPhotoEdit.existingUrls=[p.fotosUrls[0]||'',p.fotosUrls[1]||''];
  for(let i=0;i<2;i++){ const inp=$v('eFoto'+(i+1)); if(inp) inp.value=''; setExistingPhotoPreview(i,existingPhotoEdit.existingUrls[i]); }
  const t=$v('v7PhotoEditTitle'); if(t) t.textContent='📷 '+existingPhotoEdit.nome;
  const sub=$v('v7PhotoEditSub'); if(sub) sub.textContent='Adicione ou substitua fotos de referência. As fotos ficam no cadastro da propriedade e podem ser atualizadas em qualquer visita.';
  updateExistingPhotoStatus('Toque em uma foto para adicionar ou substituir.');
  $v('v7PhotoEditModal')?.classList.add('open');
}
window.openPhotoEditorForCloud=(id)=>{ try{map.closePopup();}catch(e){} return openExistingPropertyPhotoEditor(id,null); };
window.openPhotoEditorForBase=async(idx)=>{
  if(!v7User) return alert('Faça login para adicionar fotos.');
  try{map.closePopup();}catch(e){}
  const b=(window.PROPS||[])[Number(idx)]; if(!b) return alert('Propriedade não localizada.');
  const nome=normTxt(b.nm||b.nome||'');
  let cp=(v7CloudProps||[]).find(x=>normTxt(x.nome||x.nm||'')===nome || (x.lat&&x.lng&&distMeters(+x.lat,+x.lng,+b.lat,+b.lng)<=60));
  if(!cp){
    if(!navigator.onLine) return alert('Para vincular fotos a este cadastro antigo pela primeira vez, conecte o aparelho à internet. Depois disso, futuras fotos poderão entrar na fila offline.');
    const data={nome:b.nm||b.nome||'Propriedade',tipo:b.tp||b.tipo||'',endereco:b.end||'',telefone:b.ph||'',lat:b.lat,lng:b.lng,dirt:!!b.dirt,maps:b.gmaps||`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=driving`,municipio:'Casa Branca',quadrante:b.q||classQ(b.lat,b.lng),origem:'base_enriquecida',usuario:v7User?.email||'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    const ref=await addDoc(collection(db,'propriedades_cadastradas'),data); cp={id:ref.id,...data};
    await auditV7('propriedade_base_vinculada',data.nome);
  }
  return openExistingPropertyPhotoEditor(cp.id,Number(idx));
};
window.handleExistingPropertyPhotoInput=async(index,input)=>{
  try{
    const file=input?.files?.[0]; if(!file){existingPhotoEdit.blobs[index]=null;setExistingPhotoPreview(index,existingPhotoEdit.existingUrls[index]);return;}
    updateExistingPhotoStatus('Otimizando foto...');
    const blob=await compressPropertyPhoto(file); existingPhotoEdit.blobs[index]=blob;
    if(existingPhotoEdit.objectUrls[index]) try{URL.revokeObjectURL(existingPhotoEdit.objectUrls[index])}catch(e){}
    const url=URL.createObjectURL(blob); existingPhotoEdit.objectUrls[index]=url; setExistingPhotoPreview(index,url);
    updateExistingPhotoStatus(`Foto ${index+1} pronta (${Math.round(blob.size/1024)} KB).`);
  }catch(e){ input.value=''; existingPhotoEdit.blobs[index]=null; updateExistingPhotoStatus('⚠️ '+(e.message||e)); }
};
window.saveExistingPropertyPhotos=async()=>{
  const id=existingPhotoEdit.propertyId; if(!id) return alert('Propriedade não localizada.');
  const changed=existingPhotoEdit.blobs.some(Boolean); if(!changed){ window.closeExistingPropertyPhotoEditor(); return; }
  const btn=$v('btnSalvarFotosExistentes'); if(btn){btn.disabled=true;btn.textContent='⏳ Salvando fotos...';}
  const batchId='photo-edit-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  try{
    await queuePropertyPhotos(batchId,existingPhotoEdit.blobs,id);
    if(navigator.onLine){ await uploadQueuedPhotosForProperty(id,batchId); await auditV7('fotos_propriedade_atualizadas',existingPhotoEdit.nome); updateExistingPhotoStatus('✅ Fotos sincronizadas.'); }
    else updateExistingPhotoStatus('🟡 Fotos salvas no aparelho e aguardando internet.');
    setTimeout(()=>window.closeExistingPropertyPhotoEditor(),900);
  }catch(e){ updateExistingPhotoStatus('🟡 Fotos na fila para sincronização. '+String(e?.message||e).slice(0,100)); }
  finally{ if(btn){btn.disabled=false;btn.textContent='📷 Salvar fotos da propriedade';} refreshPendingPhotoBadge(); }
};

// V11.8 - Cadastro único de atividade/plantio/colheita para propriedades existentes.
let existingSeasonEdit={propertyId:'',baseIndex:null,nome:''};
function fillSeasonMonthSelect(id,value){ const e=$v(id); if(e) e.value=value?String(value):''; }
async function findOrCreateCloudPropertyForBase(baseIndex){
  const b=(window.PROPS||[])[Number(baseIndex)]; if(!b) throw new Error('Propriedade não localizada.');
  const nome=normTxt(b.nm||b.nome||'');
  let cp=(v7CloudProps||[]).find(x=>normTxt(x.nome||x.nm||'')===nome || (x.lat&&x.lng&&distMeters(+x.lat,+x.lng,+b.lat,+b.lng)<=60));
  if(cp) return cp;
  if(!navigator.onLine) throw new Error('Conecte o aparelho à internet para vincular este cadastro antigo pela primeira vez.');
  const data={nome:b.nm||b.nome||'Propriedade',tipo:b.tp||b.tipo||'',atividade:b.tp||b.tipo||'',plantioInicio:0,plantioFim:0,colheitaInicio:0,colheitaFim:0,epocaPlantio:'',epocaColheita:'',sazonalidadeConfigurada:false,endereco:b.end||'',telefone:b.ph||'',lat:b.lat,lng:b.lng,dirt:!!b.dirt,maps:b.gmaps||`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=driving`,municipio:'Casa Branca',quadrante:b.q||classQ(b.lat,b.lng),origem:'base_enriquecida',usuario:v7User?.email||'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  const ref=await addDoc(collection(db,'propriedades_cadastradas'),data); cp={id:ref.id,...data};
  await auditV7('propriedade_base_vinculada_safra',data.nome);
  return cp;
}
async function openExistingPropertySeasonEditor(propertyId,baseIndex=null){
  if(!v7User) return alert('Faça login para cadastrar atividade e safra.');
  let p=(v7CloudProps||[]).find(x=>String(x.id)===String(propertyId));
  if(!p && propertyId){ try{const snap=await getDoc(doc(db,'propriedades_cadastradas',propertyId)); if(snap.exists()) p={id:snap.id,...snap.data()};}catch(e){} }
  if(!p) return alert('Propriedade não localizada na nuvem.');
  existingSeasonEdit={propertyId:p.id,baseIndex,nome:p.nome||p.nm||'Propriedade'};
  const title=$v('v7SeasonEditTitle'); if(title) title.textContent='🌱 '+existingSeasonEdit.nome;
  const atividade=$v('eAtividade'); if(atividade) atividade.value=p.atividade||p.tipo||p.tp||'';
  fillSeasonMonthSelect('ePlantioIni',Number(p.plantioInicio)||0); fillSeasonMonthSelect('ePlantioFim',Number(p.plantioFim)||0);
  fillSeasonMonthSelect('eColheitaIni',Number(p.colheitaInicio)||0); fillSeasonMonthSelect('eColheitaFim',Number(p.colheitaFim)||0);
  const st=$v('eSeasonStatus'); if(st) st.textContent=p.sazonalidadeConfigurada?'✅ Dados já cadastrados. Altere somente se houver mudança na atividade ou calendário.':'Preencha uma única vez e salve. Estes dados permanecem no cadastro da propriedade.';
  $v('v7SeasonEditModal')?.classList.add('open');
}
window.closeExistingPropertySeasonEditor=()=>{ existingSeasonEdit={propertyId:'',baseIndex:null,nome:''}; $v('v7SeasonEditModal')?.classList.remove('open'); };
window.openSeasonEditorForCloud=(id)=>{ try{map.closePopup();}catch(e){} return openExistingPropertySeasonEditor(id,null); };
window.openSeasonEditorForBase=async(idx)=>{ try{map.closePopup();}catch(e){} try{ const p=await findOrCreateCloudPropertyForBase(idx); return openExistingPropertySeasonEditor(p.id,Number(idx)); }catch(e){ alert(e.message||e); } };
window.saveExistingPropertySeason=async()=>{
  const id=existingSeasonEdit.propertyId; if(!id) return alert('Propriedade não localizada.');
  const atividade=String($v('eAtividade')?.value||'').trim();
  const plantioInicio=Number($v('ePlantioIni')?.value)||0, plantioFim=Number($v('ePlantioFim')?.value)||0;
  const colheitaInicio=Number($v('eColheitaIni')?.value)||0, colheitaFim=Number($v('eColheitaFim')?.value)||0;
  if(!atividade) return alert('Informe a atividade/cultura principal.');
  if(!plantioInicio||!plantioFim) return alert('Informe o início e o fim da época de plantio.');
  if(!colheitaInicio||!colheitaFim) return alert('Informe o início e o fim da época de colheita.');
  if(!navigator.onLine) return alert('Para salvar os dados permanentes de plantio e colheita, conecte o aparelho à internet.');
  const btn=$v('btnSalvarSafraExistente'); if(btn){btn.disabled=true;btn.textContent='⏳ Salvando...';}
  try{
    const data={tipo:atividade,atividade,plantioInicio,plantioFim,colheitaInicio,colheitaFim,epocaPlantio:monthRangeLabel(plantioInicio,plantioFim),epocaColheita:monthRangeLabel(colheitaInicio,colheitaFim),sazonalidadeConfigurada:true,sazonalidadeAtualizadaEm:serverTimestamp(),sazonalidadeUsuario:v7User?.email||'',updatedAt:serverTimestamp()};
    await updateDoc(doc(db,'propriedades_cadastradas',id),data);
    const p=(v7CloudProps||[]).find(x=>String(x.id)===String(id)); if(p) Object.assign(p,data,{sazonalidadeConfigurada:true});
    await auditV7('sazonalidade_propriedade_salva',existingSeasonEdit.nome+' | '+atividade+' | plantio '+data.epocaPlantio+' | colheita '+data.epocaColheita);
    const st=$v('eSeasonStatus'); if(st) st.textContent='✅ Atividade, plantio e colheita salvos no cadastro.';
    renderCommanderDashboard(); renderCommanderStatisticalDashboard();
    setTimeout(()=>window.closeExistingPropertySeasonEditor(),900);
  }catch(e){ const st=$v('eSeasonStatus'); if(st) st.textContent='⚠️ '+String(e.message||e); }
  finally{ if(btn){btn.disabled=false;btn.textContent='🌱 Salvar atividade e safra';} }
};

function propertyPhotoLink(propertyId){
  if(!propertyId) return '';
  const u=new URL(location.href); u.search=''; u.hash=''; u.searchParams.set('fotos',propertyId); return u.toString();
}
function propertyPhotoCount(p){
  if(!p) return 0;
  const slots=[p.foto1Url||'',p.foto2Url||''].filter(Boolean); if(slots.length) return slots.length;
  if(Array.isArray(p.fotosUrls)&&p.fotosUrls.length) return Math.min(2,p.fotosUrls.filter(Boolean).length);
  if(Array.isArray(p.fotosPaths)&&p.fotosPaths.length) return Math.min(2,p.fotosPaths.length);
  return Number(p.fotosQuantidade)||0;
}
function hasPropertyPhotos(p){ return propertyPhotoCount(p)>0; }
function v7PropertyForVisit(v){
  if(v?.propriedadeId){const byId=(v7CloudProps||[]).find(p=>String(p.id)===String(v.propriedadeId));if(byId)return byId;}
  const nome=normTxt(v?._prop||v?.propriedade||''); return (v7CloudProps||[]).find(p=>normTxt(p.nome||p.nm)===nome)||null;
}
let photoDeepLinkHandled=false;
function maybeOpenPhotoDeepLink(){
  if(photoDeepLinkHandled||!v7User) return; const id=new URL(location.href).searchParams.get('fotos'); if(!id) return;
  const exists=(v7CloudProps||[]).some(p=>String(p.id)===String(id)); if(!exists) return;
  photoDeepLinkHandled=true; setTimeout(()=>window.openPropertyPhotos(id),250);
}

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
window.v7ForgotPassword=async()=>{
  const msg=$v('v7LoginMsg');
  const email=String($v('v7Email')?.value||'').trim().toLowerCase();
  msg.classList.remove('ok');
  if(!email){
    msg.style.display='block';
    msg.textContent='Informe seu e-mail e clique novamente em “Esqueci minha senha”.';
    return;
  }
  try{
    await sendPasswordResetEmail(auth,email);
    msg.style.display='block';
    msg.classList.add('ok');
    msg.textContent='E-mail enviado. Abra sua caixa de entrada e use o link do Firebase para definir uma nova senha.';
  }catch(e){
    msg.style.display='block';
    msg.classList.remove('ok');
    msg.textContent='Não foi possível enviar o e-mail agora. Confira o endereço informado e tente novamente.';
  }
};
window.v7Logout=async()=>{ await signOut(auth); location.reload(); };
onAuthStateChanged(auth, async u=>{
  if(!u){ showLogin(); return; }
  v7User=u; v7Profile=await loadProfile(u); showLogged(); await registerCurrentDevice(); auditV7('login','Usuário entrou no sistema'); startRealtime();
});
function startRealtime(){
  onSnapshot(query(collection(db,'solicitacoes_acesso'),orderBy('createdAt','desc')),s=>{v7Requests=s.docs.map(d=>({id:d.id,...d.data()})); renderRequests();});
  onSnapshot(query(collection(db,'visitas'),orderBy('createdAt','desc')),s=>{v7Visits=s.docs.map(d=>({id:d.id,...d.data()})); renderCommanderDashboard(); renderCommanderStatisticalDashboard();});
  onSnapshot(query(collection(db,'auditoria'),orderBy('createdAt','desc')),s=>{v7Audits=s.docs.map(d=>({id:d.id,...d.data()})); renderAudit();});
  onSnapshot(collection(db,'usuarios'),s=>{v7Users=s.docs.map(d=>({docId:d.id,...d.data()})); renderUsersList();});
  onSnapshot(collection(db,'dispositivos_acesso'),s=>{v7Devices=s.docs.map(d=>({docId:d.id,...d.data()})); renderDevicesList();});
  onSnapshot(collection(db,'propriedades_cadastradas'),s=>{v7CloudProps=s.docs.map(d=>({id:d.id,...d.data()})); window.v7CloudProps=v7CloudProps; renderCloudProperties(); renderCommanderDashboard(); renderCommanderStatisticalDashboard(); maybeOpenPhotoDeepLink();});
  repairPendingPhotoQueue().then(()=>syncPendingProperties()).catch(()=>syncPendingProperties());
  syncPendingVisits();
  syncPendingPropertyPhotos();
  refreshPendingPhotoBadge();
  migrateLocalPointsToCloudOnce();
  setTimeout(()=>autoSyncAll('login'),1200);
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
window.openAdminPanel=()=>{ if(!canOpenAdminPanel()) return alert('Acesso restrito.'); $v('admNome').value=v7Profile.nome||''; $v('admRe').value=v7Profile.re||''; $v('admGrad').value=v7Profile.graduacao||''; const pf=$v('admPerfilTxt'); if(pf) pf.value=v7Profile?.perfil||'Policial'; $v('v7AdminModal').classList.add('open'); renderUsersList(); renderDevicesList(); renderRequests(); renderAudit(); renderCommanderDashboard(); renderCommanderStatisticalDashboard(); updateOfflineBadge(); const ss=$v('syncStatus'); if(ss) ss.innerHTML='Pendências no aparelho: '+(pendingProps().length+pendingVisits().length); };
window.saveMyBasicProfile=async()=>{
  if(!v7User) return; const data={nome:$v('admNome').value,re:$v('admRe').value,graduacao:$v('admGrad').value,email:v7User.email,companhia:APP_INFO.companhia,status:v7Profile?.status||'Ativo',updatedAt:serverTimestamp()}; await setDoc(doc(db,'usuarios',v7User.uid),data,{merge:true}); await setDoc(doc(db,'usuarios',emailKey(v7User.email)),{...data,uid:v7User.uid,perfil:v7Profile?.perfil||'Policial'},{merge:true}); v7Profile={...v7Profile,...data}; showLogged(); auditV7('perfil_atualizado','Usuário atualizou dados básicos'); alert('Dados salvos. O perfil funcional só pode ser alterado por Administrador Geral.'); };
window.approveReq=async(id)=>{ 
  if(!isAdminGeral()) return alert('Somente Administrador Geral pode aprovar acesso.'); 
  const r=v7Requests.find(x=>x.id===id); if(!r)return; 
  const perfil=prompt('Perfil do usuário: Policial, Supervisor ou Administrador Geral','Policial')||'Policial'; 
  const email=String(r.email||'').trim().toLowerCase();
  const data={nome:r.nome,email,re:r.re,graduacao:r.graduacao,telefone:r.telefone,perfil,status:'Ativo',companhia:APP_INFO.companhia,approvedBy:v7User.email,approvedAt:serverTimestamp()}; 
  await setDoc(doc(db,'usuarios',emailKey(email)),data,{merge:true}); 
  await setDoc(doc(db,'solicitacoes_acesso',id),{status:'Aprovado',perfilAprovado:perfil,approvedBy:v7User.email,approvedAt:serverTimestamp()},{merge:true}); 
  let authMsg='';
  try{
    const cr=await createAuthUserForPolice(email,r.nome||email);
    authMsg=cr.created
      ?`

Usuário criado no Firebase Authentication.
Um e-mail foi enviado para ${email} para que o policial defina a própria senha.`
      :`

O e-mail já existia no Firebase Authentication.
Foi enviado um link para ${email} para definir/redefinir a senha.`;
    auditV7('acesso_aprovado',`${email} como ${perfil}. Auth: ${cr.created?'criado':'já existia'}; link de senha enviado`);
  }catch(e){
    const estado=e.accountCreated?'A conta foi criada, porém o e-mail de definição de senha não pôde ser enviado.':'Não foi possível concluir o Authentication.';
    authMsg=`

ATENÇÃO: perfil aprovado. ${estado}
O policial pode usar “Esqueci minha senha” na tela de login.`;
    auditV7('acesso_aprovado_auth_erro',`${email}: ${e.message||e}`);
  }
  alert('Acesso aprovado no SISRURAL.'+authMsg); 
  renderRequests(); renderUsersList(); 
};
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
    let authText='';
    try{
      const cr=await createAuthUserForPolice(email,nome);
      authText=cr.created
        ?`<br>✅ Usuário criado no Firebase Authentication.<br>📧 Link para definição de senha enviado para <b>${email}</b>.`
        :`<br>ℹ️ Este e-mail já existia no Firebase Authentication.<br>📧 Link para definir/redefinir a senha enviado para <b>${email}</b>.`;
      await auditV7('policial_cadastrado',`${nome} (${email}) como ${perfil}. Auth: ${cr.created?'criado':'já existia'}; link de senha enviado`);
    }catch(e){
      const detalhe=e.accountCreated?'A conta foi criada, mas o e-mail de senha não pôde ser enviado.':'Não foi possível concluir o Authentication.';
      authText=`<br><span style="color:#b45309">⚠️ Perfil salvo. ${detalhe} O policial pode usar “Esqueci minha senha” na tela de login.</span>`;
      await auditV7('policial_cadastrado_auth_erro',`${email}: ${e.message||e}`);
    }
    if(msg) msg.innerHTML='✅ Perfil salvo no SISRURAL.'+authText;
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
    await syncPendingPropertyPhotos();
    await auditV7('sincronizacao_manual','Administrador acionou sincronização manual.');
    updateOfflineBadge();
    const fotosPend=(await photoDbAll()).length;
    const fotoErr=window.__sisruralLastPhotoSyncError||'';
    if(el) el.innerHTML=(fotoErr?'⚠️':'✅')+' Sincronização concluída. Pendências: '+(pendingProps().length+pendingVisits().length)+' cadastro(s)/visita(s) e '+fotosPend+' foto(s).'+(fotoErr?'<br><small>Fotos: '+String(fotoErr).replace(/[<>]/g,'').slice(0,180)+'</small>':'');
    try{toastV7('✅ Dados sincronizados.');}catch(e){}
  }catch(e){ if(el) el.innerHTML='⚠️ Falha na sincronização: '+(e.message||e); }
};
window.refreshSisruralData=async()=>{
  try{
    await syncPendingProperties();
    await syncPendingVisits();
    await syncPendingPropertyPhotos();
    if(typeof renderCloudProperties==='function') renderCloudProperties();
    if(typeof renderCommanderDashboard==='function') renderCommanderDashboard(); if(typeof renderCommanderStatisticalDashboard==='function') renderCommanderStatisticalDashboard();
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
function deviceStatusOptions(sel){
  const opts=['Pendente','Autorizado','Revogado'];
  return opts.map(o=>`<option ${String(sel||'Pendente')===o?'selected':''}>${o}</option>`).join('');
}
function deviceDate(v){
  try{ if(v?.seconds) return new Date(v.seconds*1000).toLocaleString('pt-BR'); }catch(e){}
  return '-';
}
function renderDevicesList(){
  const el=$v('v7DevicesList'); if(!el) return;
  if(!isAdminGeral()){ el.innerHTML='<div class="v7-card v7-small">Somente Administrador Geral visualiza dispositivos.</div>'; return; }
  const arr=[...(v7Devices||[])].sort((a,b)=>(b.ultimoAcesso?.seconds||0)-(a.ultimoAcesso?.seconds||0));
  if(!arr.length){ el.innerHTML='<div class="v7-card v7-small">Nenhum dispositivo registrado ainda. Eles aparecerão automaticamente após o próximo login.</div>'; return; }
  el.innerHTML=arr.map((d,i)=>{
    const sid='deviceStatus_'+i;
    const short=String(d.deviceId||d.docId||'').slice(-12);
    return `<div class="v7-card device-card"><div class="device-head"><div><b>${d.nome||d.email||'Usuário'}</b><div class="v7-small">${d.email||''}${d.re?` · RE ${d.re}`:''}<br>${d.plataforma||'Dispositivo'} · Tela ${d.tela||'-'}<br>ID: ...${short}<br>Último acesso: ${deviceDate(d.ultimoAcesso)}</div></div><span class="device-badge device-${String(d.status||'Pendente').toLowerCase()}">${d.status||'Pendente'}</span></div><div class="device-actions"><select class="field-inp" id="${sid}">${deviceStatusOptions(d.status)}</select><button class="btn-primary" onclick="saveDeviceStatus('${d.docId||d.deviceId}','${sid}')">Salvar dispositivo</button></div></div>`;
  }).join('');
}
window.saveDeviceStatus=async(id,selId)=>{
  if(!isAdminGeral()) return alert('Somente Administrador Geral pode gerenciar dispositivos.');
  const status=$v(selId)?.value||'Pendente';
  await setDoc(doc(db,'dispositivos_acesso',id),{status,updatedBy:v7User.email,updatedAt:serverTimestamp(),...(status==='Autorizado'?{aprovadoPor:v7User.email,aprovadoEm:serverTimestamp()}:{})},{merge:true});
  await auditV7('dispositivo_status_alterado',`${id}: ${status}`);
  alert(`Dispositivo marcado como ${status}. Nesta Fase A o status ainda não bloqueia o acesso.`);
};
function renderAudit(){ const el=$v('v7Audit'); if(!el)return; el.innerHTML=v7Audits.slice(0,20).map(a=>`<div class="v7-card"><b>${a.acao||''}</b><div class="v7-small">${a.detalhe||''}<br>${a.usuario||''}</div></div>`).join('')||'<div class="v7-card v7-small">Sem auditoria.</div>'; }
function allVisitProps(){
  const base=(window.PROPS||[]).map((p,i)=>({key:'base_'+i,id:'base_'+i,baseIndex:i,source:'base',nome:p.nm,municipio:'Casa Branca',quadrante:p.q,lat:p.lat,lng:p.lng,maps:p.gmaps||`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}));
  const cloud=(v7CloudProps||[]).filter(p=>p.origem!=='base_enriquecida').map(p=>({key:'cloud_'+p.id,id:p.id,source:'cloud',nome:p.nome||p.nm||'Propriedade cadastrada',municipio:p.municipio||'Casa Branca',quadrante:p.quadrante||p.q||classQ(parseFloat(p.lat),parseFloat(p.lng)),lat:parseFloat(p.lat),lng:parseFloat(p.lng),maps:p.maps||`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`}));
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
  const visits=v7UniqueVisits(v7Visits||[]).filter(v=>((v.propriedade||'').trim()===nome)).sort((a,b)=>{
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
function visitClientId(){
  try{ if(crypto?.randomUUID) return 'vis_'+crypto.randomUUID(); }catch(e){}
  return 'vis_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
}
function pendingVisits(){
  try{
    const arr=JSON.parse(localStorage.getItem(PENDING_VISITS_KEY)||'[]');
    const seen=new Set();
    return (Array.isArray(arr)?arr:[]).filter(v=>{
      const k=v.clientVisitId||[normTxt(v.propriedade),normTxt(v.usuario),v.createdAtLocal||'',normTxt(v.observacao||v.texto)].join('|');
      if(seen.has(k)) return false; seen.add(k); return true;
    });
  }catch(e){return[]}
}
function savePendingVisits(arr){ localStorage.setItem(PENDING_VISITS_KEY,JSON.stringify(arr)); updateOfflineBadge(); }
function queuePendingVisitOnce(data){
  const arr=pendingVisits();
  const id=data.clientVisitId||'';
  if(id && arr.some(v=>v.clientVisitId===id)){ savePendingVisits(arr); return false; }
  arr.push(data); savePendingVisits(arr); return true;
}
async function saveVisitCloud(data,p){
  // V11.9: gravação idempotente. A mesma visita sempre usa o mesmo ID,
  // portanto uma falha/reconexão nunca cria uma segunda visita no Firestore.
  const clientVisitId=data.clientVisitId||visitClientId();
  data.clientVisitId=clientVisitId;
  const cloudData={...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  await setDoc(doc(db,'visitas',clientVisitId),cloudData,{merge:true});
  if(p && p.source==='cloud'){
    await setDoc(doc(db,'propriedades_cadastradas',p.id),{ultimaVisitaTexto:`${data.dataLocal} ${data.horaLocal} · ${data.usuarioNome}`,ultimaVisitaObs:data.observacao,ultimaVisitaPor:data.usuario,ultimaVisitaEm:serverTimestamp()},{merge:true});
  }
  return clientVisitId;
}
async function syncPendingVisits(){
  if(!v7User || !navigator.onLine) return;
  let arr=pendingVisits(); if(!arr.length) return;
  const rest=[];
  for(const item of arr){
    try{
      if(!item.clientVisitId) item.clientVisitId=visitClientId();
      const p=allVisitProps().find(x=>String(x.id)===String(item.propriedadeId)||String(x.nome)===String(item.propriedade));
      await saveVisitCloud(item,p);
      await auditV7('visita_sincronizada',item.propriedade||'sem nome');
    }catch(e){ rest.push(item); }
  }
  savePendingVisits(rest);
  if(rest.length===0){ console.log('SISRURAL: visitas pendentes sincronizadas.'); try{toastV7('✅ Visitas pendentes sincronizadas.');}catch(e){} }
}
window.saveV7Visit=async()=>{
  const msg=$v('v7VisitMsg');
  const btn=$v('btnSalvarVisita');
  if(btn?.disabled) return;
  if(btn){ btn.disabled=true; btn.dataset.old=btn.innerHTML; btn.innerHTML='⏳ Salvando visita...'; btn.style.opacity='.65'; }
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
      clientVisitId:visitClientId(),
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
        msg.innerHTML='<span style="color:#4ade80">✅ Visita registrada e sincronizada uma única vez.</span>';
      }catch(e){
        queuePendingVisitOnce(data);
        msg.innerHTML='<span style="color:#f59e0b">🟡 Falha de conexão. Visita salva uma única vez no aparelho e será sincronizada automaticamente.</span>';
      }
    }else{
      queuePendingVisitOnce(data);
      msg.innerHTML='<span style="color:#f59e0b">📡 Sem conexão. Visita salva uma única vez no aparelho e será sincronizada automaticamente quando a internet voltar.</span>';
    }
    $v('v7VisitTexto').value='';
    setTimeout(()=>{ if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.old||'Salvar visita';btn.style.opacity='1';} closeV7Modal('v7VisitModal'); },1600);
  }catch(e){
    if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.old||'Salvar visita';btn.style.opacity='1';}
    msg.innerHTML='<span style="color:#ef4444">'+e.message+'</span>';
  }
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
const MONTHS_SHORT=['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function monthRangeLabel(a,b){ a=Number(a)||0;b=Number(b)||0; if(!a&&!b)return ''; if(a&&!b)return MONTHS_SHORT[a]; if(!a&&b)return MONTHS_SHORT[b]; return a===b?MONTHS_SHORT[a]:`${MONTHS_SHORT[a]}–${MONTHS_SHORT[b]}`; }
function monthInRange(month,start,end){ month=Number(month);start=Number(start);end=Number(end); if(!month||!start||!end)return false; return start<=end?(month>=start&&month<=end):(month>=start||month<=end); }
function formProp(){
  const nm=document.getElementById('aNome').value.trim(); let lat=parseFloat(document.getElementById('aLat').value); let lng=parseFloat(document.getElementById('aLng').value);
  if((isNaN(lat)||isNaN(lng)) && window.map){ const c=map.getCenter(); lat=c.lat; lng=c.lng; }
  const plantioInicio=Number(document.getElementById('aPlantioIni')?.value)||0, plantioFim=Number(document.getElementById('aPlantioFim')?.value)||0;
  const colheitaInicio=Number(document.getElementById('aColheitaIni')?.value)||0, colheitaFim=Number(document.getElementById('aColheitaFim')?.value)||0;
  return {nm, nome:nm, tp:document.getElementById('aTipo').value.trim(), tipo:document.getElementById('aTipo').value.trim(), lat, lng,
    plantioInicio,plantioFim,colheitaInicio,colheitaFim,epocaPlantio:monthRangeLabel(plantioInicio,plantioFim),epocaColheita:monthRangeLabel(colheitaInicio,colheitaFim),
    end:document.getElementById('aEnd').value.trim(), endereco:document.getElementById('aEnd').value.trim(), ph:document.getElementById('aTel').value.trim(), telefone:document.getElementById('aTel').value.trim(),
    dirt:document.getElementById('aDirt').checked, dt:new Date().toLocaleString('pt-BR'), maps:`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`};
}
async function savePropCloud(pt){
  if(isDuplicateProp(pt)) return {duplicado:true};
  const data={nome:pt.nm,tipo:pt.tp||'',atividade:pt.tp||'',plantioInicio:Number(pt.plantioInicio)||0,plantioFim:Number(pt.plantioFim)||0,colheitaInicio:Number(pt.colheitaInicio)||0,colheitaFim:Number(pt.colheitaFim)||0,epocaPlantio:pt.epocaPlantio||'',epocaColheita:pt.epocaColheita||'',endereco:pt.end||'',telefone:pt.ph||'',lat:pt.lat,lng:pt.lng,dirt:!!pt.dirt,maps:pt.maps,municipio:'Casa Branca',quadrante:(typeof classQ==='function'?classQ(pt.lat,pt.lng):''),origem:pt._offline?'offline_app':'app',usuario:v7User?.email||'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  return await addDoc(collection(db,'propriedades_cadastradas'),data);
}
function renderCloudProperties(){
  if(window.clearCloudPts) window.clearCloudPts();
  v7CloudProps.forEach(p=>{
    // Cadastros-base enriquecidos servem para fotos/dados no Firestore, mas não criam um segundo marcador sobre o ponto oficial já existente.
    if(p.origem==='base_enriquecida') return;
    window.renderCloudPt&&window.renderCloudPt(p,p.id);
  });
  try{ if(document.getElementById('sheet')?.classList.contains('open')) selQ(activeQ||1); }catch(e){}
}
async function syncPendingProperties(){
  if(!v7User || !navigator.onLine) return;
  let arr=pendingProps(); if(!arr.length) { updateOfflineBadge(); return; }
  const rest=[];
  for(const pt of arr){
    try{
      const r=await savePropCloud({...pt,_offline:true});
      if(!r?.duplicado && r?.id && pt._photoBatchId){ await bindPhotoBatchToProperty(pt._photoBatchId,r.id); try{await uploadQueuedPhotosForProperty(r.id,pt._photoBatchId);}catch(e){console.warn('SISRURAL: cadastro sincronizado; fotos permanecem na fila.',e);} }
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
function ensureConnectionBanner(){
  let el=document.getElementById('sisConnectionBanner');
  if(!el){
    el=document.createElement('div'); el.id='sisConnectionBanner';
    el.style.cssText='position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:12000;max-width:min(92vw,720px);background:#7c2d12;color:#fff7ed;border:1px solid #fb923c;border-radius:12px;padding:9px 14px;font:800 12px Rajdhani,Arial;box-shadow:0 4px 18px rgba(0,0,0,.55);display:none;text-align:center';
    document.body.appendChild(el);
  }
  return el;
}
function updateConnectionBanner(showOnlineToast=false){
  const el=ensureConnectionBanner();
  if(!navigator.onLine){
    el.style.display='block';
    el.innerHTML='📡 SEM CONEXÃO / SEM DADOS MÓVEIS<br><span style="font-weight:600">Continue trabalhando normalmente. O SISRURAL salvará no aparelho e sincronizará automaticamente quando a internet voltar.</span>';
  }else{
    el.style.display='none';
    if(showOnlineToast) try{toastV7('✅ Conexão restabelecida. Sincronizando pendências...');}catch(e){}
  }
}
setTimeout(()=>updateConnectionBanner(false),500);

let autoSyncBusy=false, autoSyncLast=0;
async function hasSisruralPending(){
  if(pendingProps().length||pendingVisits().length) return true;
  try{return (await photoDbAll()).length>0;}catch(e){return false;}
}
async function autoSyncAll(reason='automatico'){
  if(autoSyncBusy||!v7User||!navigator.onLine) return;
  const now=Date.now(); if(now-autoSyncLast<8000) return;
  if(!(await hasSisruralPending())) return;
  autoSyncBusy=true; autoSyncLast=now;
  try{ await syncPendingProperties(); await syncPendingVisits(); await syncPendingPropertyPhotos(); updateOfflineBadge(); }
  catch(e){ console.warn('SISRURAL: sincronização automática pendente.',reason,e); }
  finally{ autoSyncBusy=false; }
}
window.addEventListener('online',()=>{ updateConnectionBanner(true); setTimeout(()=>autoSyncAll('reconexao'),700); });
window.addEventListener('offline',()=>updateConnectionBanner(false));
window.addEventListener('focus',()=>autoSyncAll('foco'));
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') autoSyncAll('retorno_app'); });
setInterval(()=>autoSyncAll('periodica'),45000);

window.salvar=async function(){
  const msg=document.getElementById('aMsg');
  const btn=document.getElementById('btnSalvarPonto');
  if(btn && btn.disabled) return;
  const pt=formProp();
  const selectedPhotos=propertyPhotoBlobs.filter(Boolean).slice(0,PROPERTY_PHOTO_MAX);
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
      let fotoMsg='';
      if(selectedPhotos.length && r?.id){
        try{
          await savePhotosForCloudProperty(r.id,selectedPhotos);
          fotoMsg=`<br>📷 ${selectedPhotos.length} foto(s) enviada(s).`;
        }catch(e){
          // V11.3: savePhotosForCloudProperty JÁ colocou as fotos na fila.
          // Não enfileirar novamente, evitando 2 fotos virarem 4 pendências.
          console.warn('SISRURAL: fotos permaneceram na fila para nova tentativa.',e);
          fotoMsg=`<br>🟡 Cadastro salvo; foto(s) aguardando sincronização.<br><small>${String(e?.message||e||'')}</small>`;
        }
      }
      finish(`✅ "${pt.nm}" salvo na nuvem e sincronizado.${fotoMsg}`,true);
      window.resetPropertyPhotoInputs();
      setTimeout(closeAdd,1800);
    }catch(e){
      let photoBatchId=''; if(selectedPhotos.length){photoBatchId='photo-'+Date.now()+'-'+Math.random().toString(36).slice(2); try{await queuePropertyPhotos(photoBatchId,selectedPhotos,'');}catch(err){console.warn(err);} }
      const added=pushPendingPropOnce({...pt, erro:e.message, _offline:true, _photoBatchId:photoBatchId});
      if(added){ userPts.push(pt); savePts(); renderPt(pt,userPts.length-1); }
      try{ if(document.getElementById('sheet')?.classList.contains('open')) selQ(activeQ||classQ(pt.lat,pt.lng)); }catch(e){}
      finish(`🟡 <b>SEM INTERNET / SEM ENVIO</b><br>Cadastro salvo no aparelho.<br>Quando o celular voltar a ter sinal, o SISRURAL enviará automaticamente.<br><b>Não clique novamente.</b>`,false);
      setTimeout(closeAdd,2600);
    }
  } else {
    let photoBatchId=''; if(selectedPhotos.length){photoBatchId='photo-'+Date.now()+'-'+Math.random().toString(36).slice(2); try{await queuePropertyPhotos(photoBatchId,selectedPhotos,'');}catch(err){console.warn(err);} }
    const added=pushPendingPropOnce({...pt,_offline:true,_photoBatchId:photoBatchId});
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
  // V11.6: preserva os metadados das fotos vindos do Firestore no Painel do Capitão.
  // Antes, o mapeamento descartava foto1Url/foto2Url/fotosUrls e a deduplicação
  // priorizava a base estática, fazendo o painel mostrar "0 com fotos" mesmo após upload.
  const base=(window.PROPS||[]).map(p=>({
    nome:p.nm||p.nome,tipo:p.tp||p.tipo,lat:p.lat,lng:p.lng,
    quadrante:p.q||classQ(p.lat,p.lng),origem:'base'
  }));
  const local=(window.userPts||[]).map(p=>({
    nome:p.nm||p.nome,tipo:p.tp||p.tipo,lat:p.lat,lng:p.lng,
    quadrante:p.q||classQ(p.lat,p.lng),origem:'local'
  }));
  const cloud=(v7CloudProps||[]).map(p=>({
    id:p.id,
    nome:p.nome||p.nm,
    tipo:p.tipo||p.tp,atividade:p.atividade||p.tipo||p.tp||'',
    plantioInicio:Number(p.plantioInicio)||0,plantioFim:Number(p.plantioFim)||0,colheitaInicio:Number(p.colheitaInicio)||0,colheitaFim:Number(p.colheitaFim)||0,epocaPlantio:p.epocaPlantio||'',epocaColheita:p.epocaColheita||'',sazonalidadeConfigurada:!!p.sazonalidadeConfigurada,
    lat:p.lat,lng:p.lng,
    quadrante:p.quadrante||classQ(p.lat,p.lng),
    municipio:p.municipio||'',
    endereco:p.endereco||'',
    telefone:p.telefone||'',
    maps:p.maps||'',
    origem:'nuvem',
    ultimaVisitaEm:p.ultimaVisitaEm,
    ultimaVisitaTexto:p.ultimaVisitaTexto,
    foto1Url:p.foto1Url||'',
    foto2Url:p.foto2Url||'',
    foto1PublicId:p.foto1PublicId||'',
    foto2PublicId:p.foto2PublicId||'',
    fotosUrls:Array.isArray(p.fotosUrls)?p.fotosUrls:[],
    fotosPublicIds:Array.isArray(p.fotosPublicIds)?p.fotosPublicIds:[],
    fotosPaths:Array.isArray(p.fotosPaths)?p.fotosPaths:[],
    fotosQuantidade:Number(p.fotosQuantidade)||0,
    fotosProvider:p.fotosProvider||''
  }));
  const m=new Map();
  // Base/local entram primeiro; a nuvem entra por último e prevalece/mescla os dados,
  // garantindo que cadastro sincronizado e URLs das fotos sejam usados no painel/relatório.
  [...base,...local,...cloud].forEach(p=>{
    if(!p.nome) return;
    const k=normTxt(p.nome)+'|'+(p.quadrante||'');
    m.set(k,{...(m.get(k)||{}),...p});
  });
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
function v7UniqueVisits(list=v7Visits||[]){
  // V11.9: também neutraliza duplicidades históricas já existentes no Firestore.
  // Para registros antigos sem clientVisitId, usa assinatura operacional (propriedade + policial + data/hora + observação).
  const seen=new Set(), out=[];
  for(const v of (list||[])){
    const k=v.clientVisitId || [normTxt(v7VisitPropName(v)),normTxt(v.usuario||v.usuarioNome),String(v.dataLocal||''),String(v.horaLocal||''),normTxt(v7VisitObs(v))].join('|');
    if(seen.has(k)) continue; seen.add(k); out.push(v);
  }
  return out;
}
function v7PrepareVisits(){
  return v7UniqueVisits(v7Visits||[]).map(v=>({...v,_dt:v7ToDate(v),_q:String(v7VisitQuadrante(v)||''),_prop:v7VisitPropName(v),_obs:v7VisitObs(v)}));
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

function commanderLast30Quadrants(st){
  const now=new Date(), cut=new Date(now.getTime()-30*24*60*60*1000);
  const counts={1:0,2:0,3:0,4:0}, props={1:0,2:0,3:0,4:0};
  (st.props||[]).forEach(p=>{ const q=String(p.quadrante||''); if(props[q]!==undefined) props[q]++; });
  (st.visits||[]).forEach(v=>{ if(v._dt && v._dt>=cut){ const q=String(v._q||''); if(counts[q]!==undefined) counts[q]++; } });
  const rows=[1,2,3,4].map(q=>({q,count:counts[q]||0,props:props[q]||0,ratio:props[q]?counts[q]/props[q]:0}));
  const min=Math.min(...rows.map(x=>x.count));
  const least=rows.filter(x=>x.count===min);
  return {counts,props,rows,least,cut,now};
}
function seasonalPolicingRecommendation(props){
  const seasonal=Array.from({length:12},(_,i)=>{const m=i+1,plantio=(props||[]).filter(p=>monthInRange(m,p.plantioInicio,p.plantioFim)).length,colheita=(props||[]).filter(p=>monthInRange(m,p.colheitaInicio,p.colheitaFim)).length;return {m,label:MONTHS_SHORT[m],plantio,colheita,score:plantio+(colheita*1.5)};});
  const configured=(props||[]).filter(p=>p.plantioInicio&&p.plantioFim&&p.colheitaInicio&&p.colheitaFim).length;
  const ranked=seasonal.filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.m-b.m);
  const top=ranked.slice(0,3);
  const current=seasonal[new Date().getMonth()];
  const text=!configured?'Ainda não há dados sazonais suficientes. Cadastre atividade, plantio e colheita nas propriedades para gerar a recomendação.':(!top.length?'Não há janela sazonal identificada nos cadastros atuais.':`Priorizar presença preventiva e visitas nos meses de ${top.map(x=>x.label).join(', ')}, que concentram maior atividade sazonal cadastrada. O índice considera plantio + peso 1,5 para colheita, por representar, em regra operacional, maior circulação de trabalhadores, veículos, insumos e escoamento de produção. Não representa previsão de crime.`);
  return {seasonal,configured,ranked,top,current,text};
}
function commanderQuadrantAlertHtml(st){
  const a=commanderLast30Quadrants(st), names=a.least.map(x=>v7QLabel(x.q)).join(' e '), details=a.rows.map(x=>`${v7QLabel(x.q)}: ${x.count}`).join(' · ');
  return `<div class="v7-card" style="margin-bottom:10px;border:1px solid #f59e0b;background:rgba(245,158,11,.08)"><b style="color:#f59e0b">⚠️ Alerta de cobertura — últimos 30 dias</b><div style="margin-top:5px"><b>${names}</b> ${a.least.length>1?'foram os quadrantes menos visitados':'foi o quadrante menos visitado'}, com ${a.least.map(x=>x.count).join(' / ')} visita(s).</div><div class="v7-small" style="margin-top:4px">${details}. Recomenda-se avaliar redistribuição das visitas, considerando também a quantidade de propriedades e a situação operacional.</div></div>`;
}
function renderCommanderDashboard(){
  const el=document.getElementById('capDashboard'); if(!el) return;
  const st=v7ReportStats();
  const prod=Object.entries(st.byUser).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([u,n])=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0"><span>${u}</span><b>${n}</b></div>`).join('')||'<div>Nenhuma visita no mês.</div>';
  const prodFilt=Object.entries(st.byUserFiltered).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([u,n])=>`<div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0"><span>${u}</span><b>${n}</b></div>`).join('')||'<div>Nenhuma visita no filtro.</div>';
  const maxQ=Math.max(1,...Object.values(st.filtQ));
  const qBars=[1,2,3,4].map(q=>v7BarLine(v7QLabel(q),st.filtQ[q]||0,maxQ)).join('');
  const neverList=st.never.slice(0,5).map(p=>`<div style="border-bottom:1px solid rgba(255,255,255,.06);padding:3px 0">${p.nome||''} <span style="color:#60a5fa">${v7QLabel(p.quadrante)}</span></div>`).join('')||'<div>Nenhuma pendência.</div>';
  const propsWithPhotos=st.props.filter(hasPropertyPhotos);
  const photoList=propsWithPhotos.slice(0,12).map(p=>`<div class="v7-card" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 0"><div><b>${p.nome||'Propriedade'}</b><br><span class="v7-small">${v7QLabel(p.quadrante)} · ${propertyPhotoCount(p)} foto(s)</span></div><button class="btn-secondary" style="width:auto;min-width:110px;margin:0" onclick="openPropertyPhotos('${p.id}')">📷 Ver fotos</button></div>`).join('')||'<div class="v7-card">Nenhuma propriedade com foto cadastrada.</div>';
  const quadrantAlert=commanderQuadrantAlertHtml(st);
  el.innerHTML=`
    ${quadrantAlert}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">
      <div class="v7-card"><b style="color:var(--ac);font-size:20px">${st.props.length}</b><br>Propriedades</div>
      <div class="v7-card"><b style="color:#2563eb;font-size:20px">${propsWithPhotos.length}</b><br>Com fotos</div>
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
    <div class="v7-card" style="margin-top:8px"><b>Primeiras propriedades nunca visitadas</b>${neverList}</div>
    <div class="v7-card" style="margin-top:8px"><b>📷 Propriedades com fotos de referência</b><div class="v7-small" style="margin:4px 0 8px">Clique para abrir as imagens de referência da propriedade.</div>${photoList}</div>`;
}
['relDataIni','relDataFim','relQuadrante','relBusca'].forEach(id=>setTimeout(()=>{ const e=document.getElementById(id); if(e) e.oninput=()=>{renderCommanderDashboard();renderCommanderStatisticalDashboard();}; },500));
window.showCommanderPanel=(mode='operacional')=>{
  const op=$v('capDashboard'), st=$v('capStatsDashboard'), bo=$v('capTabOperacional'), bs=$v('capTabEstatistico');
  const stats=mode==='estatistico'; if(op) op.style.display=stats?'none':'block'; if(st) st.style.display=stats?'block':'none';
  if(bo){bo.className=stats?'btn-secondary':'btn-primary';bo.style.margin='0';} if(bs){bs.className=stats?'btn-primary':'btn-secondary';bs.style.margin='0';}
  if(stats) renderCommanderStatisticalDashboard(); else renderCommanderDashboard();
};
function commanderStatisticalData(){
  const st=v7ReportStats(), props=st.props, visits=st.filtered;
  const visitedNames=new Set(visits.map(v=>normTxt(v._prop)).filter(Boolean));
  const propsScope=(()=>{const q=v7GetReportFilters().q;return q?props.filter(p=>String(p.quadrante)===String(q)):props;})();
  const visitedProps=propsScope.filter(p=>visitedNames.has(normTxt(p.nome)));
  const coverage=propsScope.length?Math.round((visitedProps.length/propsScope.length)*100):0;
  const photos=propsScope.filter(hasPropertyPhotos).length;
  const activity={}; propsScope.forEach(p=>{const a=(p.atividade||p.tipo||'Não informado').trim()||'Não informado';activity[a]=(activity[a]||0)+1;});
  const topActivities=Object.entries(activity).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const currentMonth=new Date().getMonth()+1;
  const plantingNow=propsScope.filter(p=>monthInRange(currentMonth,p.plantioInicio,p.plantioFim));
  const harvestNow=propsScope.filter(p=>monthInRange(currentMonth,p.colheitaInicio,p.colheitaFim));
  const withSeason=propsScope.filter(p=>p.plantioInicio||p.colheitaInicio);
  const monthly=[]; const now=new Date();
  for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1),key=v7MonthKey(d);monthly.push({label:d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}),count:st.visits.filter(v=>v7MonthKey(v._dt)===key).length});}
  const seasonal=Array.from({length:12},(_,i)=>({m:i+1,label:MONTHS_SHORT[i+1],plantio:propsScope.filter(p=>monthInRange(i+1,p.plantioInicio,p.plantioFim)).length,colheita:propsScope.filter(p=>monthInRange(i+1,p.colheitaInicio,p.colheitaFim)).length}));
  return {st,propsScope,visitedProps,coverage,photos,topActivities,currentMonth,plantingNow,harvestNow,withSeason,monthly,seasonal};
}
function renderCommanderStatisticalDashboard(){
  const el=$v('capStatsDashboard'); if(!el) return; const d=commanderStatisticalData();
  const maxM=Math.max(1,...d.monthly.map(x=>x.count));
  const maxA=Math.max(1,...d.topActivities.map(x=>x[1]));
  const qProp={1:0,2:0,3:0,4:0},qVisited={1:0,2:0,3:0,4:0}; d.propsScope.forEach(p=>{if(qProp[p.quadrante]!==undefined)qProp[p.quadrante]++;}); d.visitedProps.forEach(p=>{if(qVisited[p.quadrante]!==undefined)qVisited[p.quadrante]++;});
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">
    <div class="v7-card"><b style="font-size:20px;color:#2563eb">${d.coverage}%</b><br>Cobertura no filtro</div>
    <div class="v7-card"><b style="font-size:20px;color:#22c55e">${d.visitedProps.length}</b><br>Propriedades visitadas</div>
    <div class="v7-card"><b style="font-size:20px;color:#f59e0b">${d.st.filtered.length}</b><br>Visitas no período</div>
    <div class="v7-card"><b style="font-size:20px;color:#8b5cf6">${d.photos}</b><br>Cadastros com fotos</div>
    <div class="v7-card"><b style="font-size:20px;color:#0ea5e9">${d.withSeason.length}</b><br>Com sazonalidade</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
    <div class="v7-card"><b>Cobertura por quadrante</b>${[1,2,3,4].map(q=>{const pct=qProp[q]?Math.round(qVisited[q]/qProp[q]*100):0;return v7BarLine(v7QLabel(q),pct,100).replace(`<b style="text-align:right">${pct}</b>`,`<b style="text-align:right">${pct}%</b>`)}).join('')}</div>
    <div class="v7-card"><b>Atividades / culturas cadastradas</b>${d.topActivities.map(([a,n])=>v7BarLine(a,n,maxA)).join('')||'<div>Sem atividades informadas.</div>'}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
    <div class="v7-card"><b>Plantio e colheita no mês atual</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><div><b style="font-size:22px;color:#22c55e">${d.plantingNow.length}</b><br>Em época de plantio</div><div><b style="font-size:22px;color:#f59e0b">${d.harvestNow.length}</b><br>Em época de colheita</div></div><div class="v7-small" style="margin-top:8px">A sazonalidade ajuda a antecipar maior fluxo de pessoas, veículos, insumos e produção na área rural.</div></div>
    <div class="v7-card"><b>Evolução das visitas · 12 meses</b>${d.monthly.map(x=>v7BarLine(x.label,x.count,maxM)).join('')}</div>
  </div>
  <div class="v7-card"><b>Calendário sazonal das propriedades</b><div style="overflow:auto;margin-top:8px"><table style="width:100%;border-collapse:collapse"><tr><th style="text-align:left">Mês</th><th>Plantio</th><th>Colheita</th></tr>${d.seasonal.map(x=>`<tr><td>${x.label}</td><td style="text-align:center">${x.plantio}</td><td style="text-align:center">${x.colheita}</td></tr>`).join('')}</table></div></div>`;
}
window.openCommanderStatisticalReport=()=>{
  const d=commanderStatisticalData(), f=v7GetReportFilters(), now=new Date(), esc=x=>String(x||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmt=v=>{if(!v)return '';const [a,m,dd]=String(v).split('-');return a&&m&&dd?`${dd}/${m}/${a}`:v;};
  const periodo=(f.ini||f.fim)?`${f.ini?fmt(f.ini):'início'} até ${f.fim?fmt(f.fim):'hoje'}`:'Todos os registros';
  const reportBrasao=new URL('./icons/brasao-24bpmi.png',location.href).href;
  const qRows=[1,2,3,4].map(q=>{const ps=d.propsScope.filter(p=>String(p.quadrante)===String(q)),vn=new Set(d.st.filtered.filter(v=>String(v._q)===String(q)).map(v=>normTxt(v._prop)));const vis=ps.filter(p=>vn.has(normTxt(p.nome))).length,pct=ps.length?Math.round(vis/ps.length*100):0;return `<tr><td>${v7QLabel(q)}</td><td>${ps.length}</td><td>${vis}</td><td>${pct}%</td><td>${d.st.filtQ[q]||0}</td></tr>`;}).join('');
  const activityRows=d.topActivities.map(([a,n])=>`<tr><td>${esc(a)}</td><td>${n}</td></tr>`).join('')||'<tr><td colspan="2">Não informado</td></tr>';
  const seasonalRows=d.seasonal.map(x=>`<tr><td>${x.label}</td><td>${x.plantio}</td><td>${x.colheita}</td></tr>`).join('');
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Estatístico do Capitão - SISRURAL</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:12px}.printbar{padding:10px 24px;background:#f8fafc;border-bottom:1px solid #ccc}.btn{padding:8px 12px;margin-right:6px;background:#0f172a;color:#fff;border:0;border-radius:5px;font-weight:700}.page{max-width:1120px;margin:auto;padding:22px 28px}.header{border:2px solid #111;padding:12px;display:grid;grid-template-columns:80px 1fr 190px;align-items:center}.header img{max-width:64px;max-height:72px}.org{text-align:center;text-transform:uppercase}.org h1{font-size:18px;margin:0}.org h2{font-size:14px;margin:3px}.meta{border-left:1px solid #111;padding-left:12px;font-size:11px}.title{text-align:center;background:#e5e7eb;border:1px solid #111;padding:8px;margin:12px 0;font-size:16px;font-weight:800}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.card{border:1px solid #111;padding:8px}.card b{font-size:18px;display:block}table{width:100%;border-collapse:collapse;margin:10px 0 18px}th,td{border:1px solid #333;padding:6px}th{background:#e5e7eb}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.note{border:1px solid #777;padding:9px;background:#f8fafc}.rodape{margin-top:24px;border-top:1px solid #aaa;padding-top:8px;text-align:center;font-size:10px}@media print{.printbar{display:none}.page{padding:10mm}.header,.cards{break-inside:avoid}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="printbar"><button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button><button class="btn" onclick="window.close()">Fechar</button></div><div class="page"><div class="header"><div><img src="${esc(reportBrasao)}"></div><div class="org"><h1>Polícia Militar do Estado de São Paulo</h1><h2>24º BPM/I</h2><h2>2ª Companhia PM</h2><h2>Patrulha Rural de Casa Branca</h2></div><div class="meta"><b>Emitido em:</b><br>${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}<br><br><b>Sistema:</b><br>SISRURAL V11.9</div></div><div class="title">Relatório Estatístico do Capitão</div><p><b>Período:</b> ${esc(periodo)} &nbsp; <b>Quadrante:</b> ${esc(f.q?v7QLabel(f.q):'Todos')}</p><div class="cards"><div class="card"><b>${d.propsScope.length}</b>Propriedades</div><div class="card"><b>${d.visitedProps.length}</b>Visitadas</div><div class="card"><b>${d.coverage}%</b>Cobertura</div><div class="card"><b>${d.st.filtered.length}</b>Visitas no período</div><div class="card"><b>${d.photos}</b>Com fotos</div></div><h3>1. Cobertura territorial e atividade operacional</h3><table><tr><th>Quadrante</th><th>Propriedades</th><th>Visitadas</th><th>Cobertura</th><th>Visitas no período</th></tr>${qRows}</table><div class="grid2"><div><h3>2. Atividades / culturas</h3><table><tr><th>Atividade</th><th>Cadastros</th></tr>${activityRows}</table></div><div><h3>3. Sazonalidade no mês atual</h3><table><tr><th>Indicador</th><th>Quantidade</th></tr><tr><td>Propriedades em época de plantio</td><td>${d.plantingNow.length}</td></tr><tr><td>Propriedades em época de colheita</td><td>${d.harvestNow.length}</td></tr><tr><td>Cadastros com dados sazonais</td><td>${d.withSeason.length}</td></tr></table></div></div><h3>4. Calendário anual de plantio e colheita</h3><table><tr><th>Mês</th><th>Em plantio</th><th>Em colheita</th></tr>${seasonalRows}</table><h3>5. Indicadores de acompanhamento</h3><table><tr><th>Nunca visitadas</th><th>+30 dias</th><th>+60 dias</th><th>+90 dias</th><th>Cadastros com fotos</th></tr><tr><td>${d.st.never.length}</td><td>${d.st.older30.length}</td><td>${d.st.older60.length}</td><td>${d.st.older90.length}</td><td>${d.photos}</td></tr></table><div class="note"><b>Leitura gerencial:</b> os indicadores permitem acompanhar cobertura territorial, regularidade das visitas, produtividade, perfil das atividades rurais e sazonalidade de plantio/colheita, apoiando o planejamento do policiamento e a avaliação de resultados.</div><div class="rodape">Relatório estatístico gerado automaticamente pelo SISRURAL para apoio ao comando e planejamento operacional.</div></div></body></html>`;
  const w=window.open('about:blank','_blank'); if(!w) return alert('Permita pop-ups para gerar o relatório.'); w.document.open(); w.document.write(html); w.document.close();
};
window.openCommanderReport=()=>{
  const st=v7ReportStats();
  const f=v7GetReportFilters();
  const hoje=new Date();
  const hojeBR=hoje.toLocaleDateString('pt-BR');
  const horaBR=hoje.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const esc=(x)=>String(x||'').replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const visits=st.filtered.slice().sort((a,b)=>(a._dt||0)-(b._dt||0));
  const linhas=visits.map((v,i)=>{const pp=v7PropertyForVisit(v);const fotoLink=(pp&&hasPropertyPhotos(pp))?propertyPhotoLink(pp.id):'';return `<tr><td>${i+1}</td><td>${esc(v.dataLocal||v7FmtDate(v._dt))}</td><td>${esc(v.horaLocal||v7FmtHour(v._dt))}</td><td>${esc(v._prop)}</td><td>${esc(v7QLabel(v._q))}</td><td>${esc(v.usuarioNome||v.usuario)}</td><td>${esc(v._obs)}</td><td>${v.maps?`<a target="_blank" href="${esc(v.maps)}">Abrir</a>`:''}</td><td>${fotoLink?`<a target="_blank" href="${esc(fotoLink)}">📷 Ver fotos</a>`:'-'}</td></tr>`;}).join('');
  const fmtFiltroData=(v)=>{ if(!v) return ''; const [a,m,d]=String(v).split('-'); return (a&&m&&d)?`${d}/${m}/${a}`:String(v); };
  const periodo=(f.ini||f.fim)?`${f.ini?fmtFiltroData(f.ini):'início'} até ${f.fim?fmtFiltroData(f.fim):'hoje'}`:'Todos os registros';
  const quadrante=f.q?v7QLabel(f.q):'Todos';
  const busca=f.busca||'Todos';
  const reportBrasao=new URL('./icons/brasao-24bpmi.png',location.href).href;
  const seasonRec=seasonalPolicingRecommendation(st.props);
  const qAlert=commanderLast30Quadrants(st);
  const qAlertNames=qAlert.least.map(x=>v7QLabel(x.q)).join(' e ');
  const qAlertDetails=qAlert.rows.map(x=>`${v7QLabel(x.q)}: ${x.count} visita(s)`).join(' · ');
  const topSeasonRows=seasonRec.top.length?seasonRec.top.map((x,i)=>`<tr><td>${i+1}ª</td><td>${x.label}</td><td>${x.plantio}</td><td>${x.colheita}</td><td>${x.score.toFixed(1)}</td></tr>`).join(''):`<tr><td colspan="5">Aguardando preenchimento dos dados de plantio e colheita das propriedades.</td></tr>`;
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Operacional de Visitas - SISRURAL</title>
  <style>
    *{box-sizing:border-box} body{margin:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.35} .page{max-width:1120px;margin:0 auto;padding:22px 28px 36px}.printbar{position:sticky;top:0;background:#f8fafc;border-bottom:1px solid #cbd5e1;padding:10px 28px;display:flex;gap:8px;z-index:5}.btn{border:1px solid #0f172a;background:#0f172a;color:#fff;border-radius:6px;padding:9px 14px;font-weight:700;cursor:pointer}.btn2{background:#fff;color:#0f172a}.header{border:2px solid #111;padding:12px 14px;margin-bottom:12px;display:grid;grid-template-columns:80px 1fr 190px;gap:12px;align-items:center}.brasao{width:64px;height:72px;display:flex;align-items:center;justify-content:center;background:transparent}.brasao img{max-width:100%;max-height:100%;object-fit:contain;background:transparent}.org{text-align:center;text-transform:uppercase}.org h1{font-size:18px;margin:0 0 4px;font-weight:800}.org h2{font-size:15px;margin:2px 0}.meta{font-size:11px;border-left:1px solid #111;padding-left:12px}.title{text-align:center;border:1px solid #111;background:#e5e7eb;padding:8px;margin:12px 0;font-size:16px;font-weight:800;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.card{border:1px solid #111;padding:9px;background:#fff}.card b{font-size:18px;display:block}.info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.info div{border:1px solid #111;padding:8px}table{border-collapse:collapse;width:100%;margin-top:10px;font-size:11px}th,td{border:1px solid #333;padding:5px 6px;vertical-align:top}th{background:#e5e7eb;text-align:left;text-transform:uppercase;font-size:10px}.obs{max-width:260px}.assinaturas{display:grid;grid-template-columns:1fr 1fr;gap:70px;margin-top:44px;text-align:center}.linha{border-top:1px solid #111;padding-top:6px}.planejamento{border:1px solid #b45309;background:#fffbeb;padding:10px;margin:10px 0}.alerta{border:1px solid #dc2626;background:#fef2f2;padding:10px;margin:10px 0}.rodape{margin-top:26px;border-top:1px solid #999;padding-top:8px;font-size:10px;color:#333;text-align:center}@media print{.printbar{display:none}.page{padding:12mm;max-width:none}.header{break-inside:avoid}.grid,.info{break-inside:avoid} a{color:#111;text-decoration:none} body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="printbar"><button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button><button class="btn btn2" onclick="window.close()">Fechar</button></div>
  <div class="page">
    <div class="header"><div class="brasao"><img src="${esc(reportBrasao)}" alt="Brasão do 24º BPM/I"></div><div class="org"><h1>Polícia Militar do Estado de São Paulo</h1><h2>24º BPM/I</h2><h2>2ª Companhia PM</h2><h2>Patrulha Rural de Casa Branca</h2></div><div class="meta"><b>Emitido em:</b><br>${hojeBR} às ${horaBR}<br><br><b>Sistema:</b><br>SISRURAL V11.9</div></div>
    <div class="title">Relatório Operacional de Visitas</div>
    <div class="info"><div><b>Período:</b> ${esc(periodo)}<br><b>Quadrante:</b> ${esc(quadrante)}<br><b>Filtro:</b> ${esc(busca)}</div><div><b>Finalidade:</b> acompanhamento da Patrulha Rural, produtividade operacional e controle de visitas às propriedades cadastradas.</div></div>
    <div class="grid" style="grid-template-columns:repeat(5,1fr)"><div class="card"><b>${st.props.length}</b>Propriedades cadastradas</div><div class="card"><b>${st.props.filter(hasPropertyPhotos).length}</b>Com fotos</div><div class="card"><b>${st.filtered.length}</b>Visitas no filtro</div><div class="card"><b>${st.today.length}</b>Visitas hoje</div><div class="card"><b>${st.month.length}</b>Visitas no mês</div></div>
    <h3>1. Visitas realizadas</h3>
    <table><thead><tr><th>Nº</th><th>Data</th><th>Hora</th><th>Propriedade</th><th>Quadrante</th><th>Policial</th><th>Observação</th><th>Mapa</th><th>Fotos</th></tr></thead><tbody>${linhas||'<tr><td colspan="9">Nenhuma visita localizada para os filtros selecionados.</td></tr>'}</tbody></table>
    <h3>2. Resumo estatístico</h3>
    <table><tbody><tr><th>Q1 - Alfa</th><td>${st.filtQ[1]||0}</td><th>Q2 - Bravo</th><td>${st.filtQ[2]||0}</td><th>Q3 - Charlie</th><td>${st.filtQ[3]||0}</td><th>Q4 - Delta</th><td>${st.filtQ[4]||0}</td></tr><tr><th>Nunca visitadas</th><td>${st.never.length}</td><th>+30 dias</th><td>${st.older30.length}</td><th>+60 dias</th><td>${st.older60.length}</td><th>+90 dias</th><td>${st.older90.length}</td></tr></tbody></table>
    <h3>3. Planejamento sazonal recomendado</h3>
    <div class="planejamento"><b>Leitura automática do SISRURAL:</b> ${esc(seasonRec.text)}<br><br><b>Mês atual:</b> ${esc(seasonRec.current.label)} — ${seasonRec.current.plantio} propriedade(s) em plantio e ${seasonRec.current.colheita} em colheita. <b>Cadastros sazonais completos:</b> ${seasonRec.configured}/${st.props.length}.</div>
    <table><thead><tr><th>Prioridade</th><th>Mês</th><th>Plantio</th><th>Colheita</th><th>Índice sazonal</th></tr></thead><tbody>${topSeasonRows}</tbody></table>
    <h3>4. Alerta de cobertura territorial</h3>
    <div class="alerta"><b>Quadrante(s) menos visitado(s) nos últimos 30 dias:</b> ${esc(qAlertNames)}.<br>${esc(qAlertDetails)}.<br><b>Orientação:</b> avaliar reforço de visitas nos quadrantes com menor cobertura, conciliando a demanda operacional, número de propriedades cadastradas e a sazonalidade agrícola.</div>
    <div class="assinaturas"><div class="linha">Comandante da Companhia</div><div class="linha">Responsável pela Patrulha Rural</div></div>
    <div class="rodape">Relatório gerado automaticamente pelo SISRURAL. Dados dependem da sincronização dos dispositivos em campo.</div>
  </div></body></html>`;
  const w=window.open('','_blank'); w.document.open(); w.document.write(html); w.document.close();
};
window.exportCommanderReportCSV=()=>{
  const st=v7ReportStats();
  const rows=[['data','hora','propriedade','quadrante','policial','observacao','maps']].concat(st.filtered.map(v=>[v.dataLocal||v7FmtDate(v._dt),v.horaLocal||v7FmtHour(v._dt),v._prop||'',v7QLabel(v._q),v.usuarioNome||v.usuario||'',v._obs||'',v.maps||'']));
  downloadCSV('sisrural-relatorio-visitas-capitao.csv',rows);
};

window.exportV7FarmsCSV=()=>{ const arr=[...(window.PROPS||[]),...(v7CloudProps.map(p=>({nm:p.nome,tp:p.tipo,lat:p.lat,lng:p.lng,end:p.endereco,ph:p.telefone,q:''}))),...((window.userPts||[]).map(p=>({nm:p.nm,tp:p.tp,lat:p.lat,lng:p.lng,end:p.end,ph:p.ph,q:''})))]; const rows=[['nome','tipo','telefone','endereco','lat','lng','quadrante','maps']].concat(arr.map(p=>[p.nm,p.tp,p.ph,p.end,p.lat,p.lng,p.q,`https://www.google.com/maps?q=${p.lat},${p.lng}`])); downloadCSV('sisrural-fazendas.csv',rows); };
window.exportV7VisitsCSV=()=>{ const rows=[['data','hora','propriedade','municipio','quadrante','observacao','usuario','nome','re','maps']].concat(v7UniqueVisits(v7Visits||[]).map(v=>[v.dataLocal,v.horaLocal,v.propriedade,v.municipio,v.quadrante,v.observacao||v.texto,v.usuario,v.usuarioNome,v.re,v.maps])); downloadCSV('sisrural-visitas.csv',rows); };
function downloadCSV(name,rows){ const csv=rows.map(r=>r.map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(';')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download=name; a.click(); }
