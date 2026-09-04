// SISRURAL V9 - mapa-ui.js
// ── CLOCK
(function tick(){
  document.getElementById('clk').textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  setTimeout(tick,10000);
})();

// ── DADOS GEOGRÁFICOS
const CX=-21.7771,CY=-47.0852;
// Limites reais do município Casa Branca/SP – cobrindo todo o território (IBGE 864 km²)
const N=-21.570,S=-22.000,W=-47.280,E=-46.900;
const MX=(N+S)/2,MY=(W+E)/2;
const QC=['#22d3ee','#fb923c','#4ade80','#c084fc'];

const QDATA=[
  {id:1,nome:'Q1 – ALFA · NOROESTE',km:{ns:23.9,lo:19.6,area:217,diag:30.9},
    divisas:['N: Mococa (Rio Mogi Pardo)','W: Tambaú (SP-340 Norte)','Contém: Distrito Lagoa Branca'],
    roads:['SP-340 Norte (→ Mococa)','Vic. Lagoa Branca','Est. Vic. Profª Laura B. Nunes','Ferrovia FCA/Vale'],
    roadKeys:['sp340N','vicLagoa','vicLauraNunes','rail'],
    dirt:['Est. do Rocheto (acesso Faz. Três Marias)','Vicinal s/ nome km 6 → Tambaú','Est. da Cabanha (acesso Batemarco)']},
  {id:2,nome:'Q2 – BRAVO · NORDESTE',km:{ns:23.9,lo:19.6,area:217,diag:30.9},
    divisas:['NE: Mococa (Rio Pardo)','E: SJ do Rio Pardo (SP-350)','Contém: Pomar Jabuticaba (maior SP)'],
    roads:['SP-350 (→ SJ.Rio Pardo)','SP-340 (trecho NE)','Vic. Venda Branca'],
    roadKeys:['sp350','sp340N','vicVenda'],
    dirt:['Vicinal FAZ BOA VISTA (jabuticaba)','Vicinal do Pomar (s/ nome)','Est. acesso Faz. Casa Branca']},
  {id:3,nome:'Q3 – CHARLIE · SUDOESTE',km:{ns:23.9,lo:19.6,area:217,diag:30.9},
    divisas:['W: Tambaú (SP-340 Sul)','SW: São Simão','S: Aguaí (limite sul)'],
    roads:['SP-340 Sul (→ Tambaú)','SP-215 (→ Vargem Grande do Sul)','Vic. SW'],
    roadKeys:['sp340S','sp215','vicSW'],
    dirt:['Est. Lagoa Branca–Venda Branca (vicinal)','Acesso Faz. Prudente do Morro','Vicinal s/ nome → São Simão']},
  {id:4,nome:'Q4 – DELTA · SUDESTE',km:{ns:23.9,lo:19.6,area:217,diag:30.9},
    divisas:['SE: Itobi (ex-distrito)','SE: Santa Cruz das Palmeiras','S: Aguaí'],
    roads:['SP-350 Sul (→ Itobi)','Est. Municipal Venda Branca','Vic. S.Cruz Palmeiras'],
    roadKeys:['sp350','vicVendaB','vicSE'],
    dirt:['Est. Lagoa Branca–Venda Branca KM 8-15','Acesso Faz. Cachoeirinha','Est. Pomar Jabuticaba SE']},
];

const PROPS=[
  // Q1 NW
  {nm:'Faz. Três Marias (Rocheto)',tp:'Grãos/Batata/Maquinário',ico:'🌾',lat:-21.7430544,lng:-47.1301689,r:4.7,rc:43,ph:null,end:'Est. Vicinal p/ Tambaú, Km 6',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.7430544,-47.1301689&travelmode=driving'},
  {nm:'Faz. Boa Vista Rocheto',tp:'Agropecuária/Grãos',ico:'🌾',lat:-21.7599106,lng:-47.1693823,r:5.0,rc:2,ph:'+55 19 98310-6666',end:'Vicinal – Rural NW',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.7599106,-47.1693823&travelmode=driving'},
  {nm:'Sítio Água Boa',tp:'Produtor rural/Horticultura',ico:'🌿',lat:-21.7182992,lng:-47.1921095,r:null,rc:null,ph:null,end:'Est. Vicinal – NW (15 km)',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.7182992,-47.1921095&travelmode=driving'},
  {nm:'Faz. São José do Jardim',tp:'Café/Laranja/Rural',ico:'🏡',lat:-21.6499463,lng:-47.1527269,r:5.0,rc:2,ph:null,end:'Zona Rural NW – próx. Mococa',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.6499463,-47.1527269&travelmode=driving'},
  {nm:'Cabanha Batemarco',tp:'Criação de Animais',ico:'🐄',lat:-21.7536107,lng:-47.0862222,r:1.0,rc:1,ph:'+55 19 3679-8104',end:'Est. Rural Municipal – NW',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.7536107,-47.0862222&travelmode=driving'},
  {nm:'Faz. Santa Gertrudes',tp:'Pecuária/Grãos',ico:'🐄',lat:-21.6920,lng:-47.1640,r:null,rc:null,ph:null,end:'Vicinal s/ nome – NW, 12 km',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.6920,-47.1640&travelmode=driving'},
  {nm:'Faz. Lagoa do Cedro',tp:'Laranja/Batatinha/Pivô',ico:'🍊',lat:-21.6350,lng:-47.1200,r:null,rc:null,ph:null,end:'Est. Rocheto – NW, próx. Rio Mogi Pardo',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.6350,-47.1200&travelmode=driving'},
  // Q2 NE
  {nm:'Fazenda Casa Branca',tp:'Propriedade Rural',ico:'🌾',lat:-21.6746261,lng:-47.0613497,r:null,rc:null,ph:null,end:'Zona Rural NE',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.6746261,-47.0613497&travelmode=driving'},
  {nm:'A Boa Terra Orgânicos',tp:'Produção Orgânica/Loja',ico:'🥦',lat:-21.750647,lng:-46.9942499,r:4.9,rc:51,ph:null,end:'Rod. SP-350 – NE',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.750647,-46.9942499&travelmode=driving'},
  {nm:'Pomar Boa Vista (Jabuticaba)',tp:'Maior pomar SP/Agroturismo',ico:'🍇',lat:-21.7108,lng:-47.0090,r:4.9,rc:30,ph:null,end:'Rod. SP-350, km 8 de CB',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.7108,-47.0090&travelmode=driving'},
  {nm:'Faz. Santa Cruz (Venda Branca)',tp:'Laranja/Café/Pecuária',ico:'🌾',lat:-21.6920,lng:-46.9850,r:null,rc:null,ph:null,end:'Vicinal Venda Branca – NE',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.6920,-46.9850&travelmode=driving'},
  {nm:'Faz. São Joaquim',tp:'Grãos/Soja/Milho',ico:'🌽',lat:-21.7300,lng:-46.9600,r:null,rc:null,ph:null,end:'Vicinal – NE, próx. SJ Rio Pardo',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.7300,-46.9600&travelmode=driving'},
  {nm:'Sítio Recanto Verde',tp:'Horticultura/Frutas',ico:'🌿',lat:-21.6600,lng:-47.0300,r:null,rc:null,ph:null,end:'Est. Vicinal – NE, 10 km',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.6600,-47.0300&travelmode=driving'},
  // Q3 SW
  {nm:'Faz. Prudente do Morro',tp:'Pecuária/Grãos/Eventos',ico:'🐄',lat:-21.8071512,lng:-47.1819968,r:4.8,rc:12,ph:'+55 19 99819-2980',end:'Vicinal – SW, 14 km',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.8071512,-47.1819968&travelmode=driving'},
  {nm:'Faz. Venda Branca (SW)',tp:'Laranja/Rural',ico:'🏡',lat:-21.9554313,lng:-47.1250425,r:null,rc:null,ph:null,end:'Venda Branca – SW',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.9554313,-47.1250425&travelmode=driving'},
  {nm:'Faz. Cachoeirinha Comercial',tp:'Agropecuária/Pivô',ico:'🏭',lat:-21.9453160,lng:-47.1155059,r:null,rc:null,ph:'+55 19 3607-2010',end:'Est. Lagoa Branca–Venda Branca',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.9453160,-47.1155059&travelmode=driving'},
  {nm:'Fazenda Paraíso',tp:'Pecuária/Soja',ico:'🌾',lat:-21.9578085,lng:-47.1066324,r:4.8,rc:17,ph:'+55 19 3607-2065',end:'Zona Rural SW – Venda Branca',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.9578085,-47.1066324&travelmode=driving'},
  {nm:'Faz. Santo Antônio (SW)',tp:'Cana/Laranja',ico:'🌾',lat:-21.8600,lng:-47.1600,r:null,rc:null,ph:null,end:'Vicinal SW – 18 km',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.8600,-47.1600&travelmode=driving'},
  {nm:'Faz. São Benedito do Morro',tp:'Pecuária/Grãos',ico:'🐄',lat:-21.9100,lng:-47.1900,r:null,rc:null,ph:null,end:'Vicinal SW – próx. Tambaú',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.9100,-47.1900&travelmode=driving'},
  // Q4 SE
  {nm:'Fazenda Cachoeirinha',tp:'Pecuária/Rural',ico:'🌿',lat:-21.9144116,lng:-47.0871129,r:5.0,rc:2,ph:null,end:'Estrada – Venda Branca SE',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.9144116,-47.0871129&travelmode=driving'},
  {nm:'Seu Pé de Jabuticaba',tp:'Pomar/Agroturismo',ico:'🍇',lat:-21.8924463,lng:-47.0115315,r:4.8,rc:51,ph:'+55 19 97138-4382',end:'FAZ BOA VISTA – Lagoa Branca SE',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.8924463,-47.0115315&travelmode=driving'},
  {nm:'Faz. São Carlos',tp:'Ecoturismo/Aves',ico:'🦜',lat:-21.8221875,lng:-47.0391719,r:4.7,rc:18,ph:null,end:'Zona Rural SE – 7 km',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.8221875,-47.0391719&travelmode=driving'},
  {nm:'Sítio Refúgio dos Pássaros',tp:'Sítio/Eventos/Eco',ico:'🌿',lat:-21.8031755,lng:-47.0637221,r:5.0,rc:43,ph:'+55 19 99299-7439',end:'Est. Velha p/ Lagoa Branca',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.8031755,-47.0637221&travelmode=driving'},
  {nm:'Chácara Recanto Casa Branca',tp:'Hospedagem Rural',ico:'🏠',lat:-21.8330426,lng:-47.0678296,r:4.0,rc:13,ph:'+55 19 99363-3062',end:'SP-340 km 231 – Lagoa Branca',dirt:false,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.8330426,-47.0678296&travelmode=driving'},
  {nm:'Faz. Casa Blanca',tp:'Rural/Gestão',ico:'🏡',lat:-21.9502747,lng:-47.0728602,r:5.0,rc:1,ph:null,end:'Lagoa Branca – SE',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.9502747,-47.0728602&travelmode=driving'},
  {nm:'Faz. Santa Veridiana (séc.XIX)',tp:'Laranja/Pecuária/Histórica',ico:'🏛',lat:-21.8750,lng:-47.0450,r:null,rc:null,ph:null,end:'Vicinal – SE, 12 km',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.8750,-47.0450&travelmode=driving'},
  {nm:'Faz. Boa Esperança (SE)',tp:'Grãos/Soja/Pivô',ico:'🌾',lat:-21.9300,lng:-46.9700,r:null,rc:null,ph:null,end:'Vicinal – SE, próx. Itobi',dirt:true,gmaps:'https://www.google.com/maps/dir/?api=1&destination=-21.9300,-46.9700&travelmode=driving'},
];

function classQ(lat,lng){const n=lat>MX,w=lng<MY;return n&&w?1:n&&!w?2:!n&&w?3:4;}
window.PROPS=PROPS;
PROPS.forEach(p=>{p.municipio='Casa Branca';p.q=classQ(p.lat,p.lng);});

const FARM_REFS=[
  {q:1,nm:'REF-Q1 · Faz. Lagoa do Cedro',lat:-21.6920,lng:-47.1640,
   nota:'Âncora NW: 12 km via Est. do Rocheto (terra). Corredor vicinal divisa Mococa/Tambaú.',
   maps:'https://www.google.com/maps/search/?api=1&query=-21.6920,-47.1640',
   nav:'https://www.google.com/maps/dir/?api=1&destination=-21.6920,-47.1640&travelmode=driving',
   ico:'⭐',col:'#22d3ee',km:'12 km de CB'},
  {q:2,nm:'REF-Q2 · Pomar Boa Vista',lat:-21.7108,lng:-47.0090,
   nota:'Âncora NE: maior pomar jabuticaba SP. SP-350 km 8 – placas visíveis. Muito movimento em safra.',
   maps:'https://www.google.com/maps/search/?api=1&query=-21.7108,-47.0090',
   nav:'https://www.google.com/maps/dir/?api=1&destination=-21.7108,-47.0090&travelmode=driving',
   ico:'⭐',col:'#fb923c',km:'8 km de CB'},
  {q:3,nm:'REF-Q3 · Faz. Prudente do Morro',lat:-21.8071512,lng:-47.1819968,
   nota:'Âncora SW: 14 km de CB (terra). Referência consolidada. Corredor SW → Tambaú/São Simão.',
   maps:'https://www.google.com/maps/search/?api=1&query=-21.8071512,-47.1819968',
   nav:'https://www.google.com/maps/dir/?api=1&destination=-21.8071512,-47.1819968&travelmode=driving',
   ico:'⭐',col:'#4ade80',km:'14 km de CB'},
  {q:4,nm:'REF-Q4 · Faz. São Carlos',lat:-21.8221875,lng:-47.0391719,
   nota:'Âncora SE: 7 km de CB, acesso pavimentado. Corredor SP-340/SP-350 Sul.',
   maps:'https://www.google.com/maps/search/?api=1&query=-21.8221875,-47.0391719',
   nav:'https://www.google.com/maps/dir/?api=1&destination=-21.8221875,-47.0391719&travelmode=driving',
   ico:'⭐',col:'#c084fc',km:'7 km de CB'},
];

// ── MAPA
const map=L.map('map',{center:[CX,CY],zoom:10,zoomControl:false});
L.control.zoom({position:'bottomleft'}).addTo(map);

const osmT=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM',maxZoom:19});
const satT=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxZoom:19});
const satLbl=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{opacity:.8,maxZoom:19});
let satOn=false; osmT.addTo(map);

// ── QUADRANTES / MALHAS MUNICIPAIS · V15.2 EXP
// A malha oficial é obtida da API de Malhas Geográficas do IBGE. Cada município é
// dividido em quatro setores operacionais (Alfa/Bravo/Charlie/Delta) pelo eixo médio
// do próprio território, e os polígonos são recortados pelo limite municipal.
const quadsG=L.layerGroup().addTo(map);
const municipalG=L.layerGroup().addTo(map);
const qPoly={};
const V15_MUNICIPAL_CFG={
  'Casa Branca':{code:'3510807',center:[-21.773,-47.086],zoom:11,area:864.225,fallback:[[-22.000,-47.280],[-21.570,-46.900]]},
  'Santa Cruz das Palmeiras':{code:'3546306',center:[-21.827,-47.249],zoom:11,area:295.330,fallback:[[-21.990,-47.390],[-21.680,-47.120]]},
  'Tambaú':{code:'3553302',center:[-21.705,-47.274],zoom:11,area:561.788,fallback:[[-21.930,-47.470],[-21.500,-47.080]]},
  'Itobi':{code:'3523800',center:[-21.737,-46.975],zoom:12,area:138.986,fallback:[[-21.850,-47.080],[-21.620,-46.850]]}
};
window.V15_ACTIVE_AREA='Casa Branca';
window.V15_ACTIVE_QDATA=QDATA;
window.V15_MUNICIPAL_CACHE={};

function v15GeoCoords(g){
  const out=[]; const walk=x=>{if(!Array.isArray(x))return; if(typeof x[0]==='number'&&typeof x[1]==='number')out.push(x); else x.forEach(walk)};
  walk(g?.coordinates); return out;
}
function v15BoundsFromGeoJSON(fc){
  let minLng=Infinity,maxLng=-Infinity,minLat=Infinity,maxLat=-Infinity;
  (fc?.features||[]).forEach(f=>v15GeoCoords(f.geometry).forEach(([lng,lat])=>{minLng=Math.min(minLng,lng);maxLng=Math.max(maxLng,lng);minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);}));
  return Number.isFinite(minLat)?{minLat,maxLat,minLng,maxLng}:null;
}
function v15ClipRing(ring,b){
  let pts=(ring||[]).slice();
  const clip=(arr,inside,intersect)=>{const o=[];if(!arr.length)return o;let S=arr[arr.length-1];for(const E of arr){const Ein=inside(E),Sin=inside(S);if(Ein){if(!Sin)o.push(intersect(S,E));o.push(E);}else if(Sin)o.push(intersect(S,E));S=E;}return o;};
  const vx=(S,E,x)=>{const d=E[0]-S[0];const t=Math.abs(d)<1e-12?0:(x-S[0])/d;return [x,S[1]+t*(E[1]-S[1])];};
  const hy=(S,E,y)=>{const d=E[1]-S[1];const t=Math.abs(d)<1e-12?0:(y-S[1])/d;return [S[0]+t*(E[0]-S[0]),y];};
  pts=clip(pts,p=>p[0]>=b.minLng,(S,E)=>vx(S,E,b.minLng));
  pts=clip(pts,p=>p[0]<=b.maxLng,(S,E)=>vx(S,E,b.maxLng));
  pts=clip(pts,p=>p[1]>=b.minLat,(S,E)=>hy(S,E,b.minLat));
  pts=clip(pts,p=>p[1]<=b.maxLat,(S,E)=>hy(S,E,b.maxLat));
  if(pts.length>=3){const a=pts[0],z=pts[pts.length-1];if(a[0]!==z[0]||a[1]!==z[1])pts.push([...a]);}
  return pts;
}
function v15ClipGeometry(geom,b){
  if(!geom)return null;
  const clipPoly=poly=>{const rings=(poly||[]).map(r=>v15ClipRing(r,b)).filter(r=>r.length>=4);return rings.length?rings:null;};
  if(geom.type==='Polygon'){const c=clipPoly(geom.coordinates);return c?{type:'Polygon',coordinates:c}:null;}
  if(geom.type==='MultiPolygon'){const c=geom.coordinates.map(clipPoly).filter(Boolean);return c.length?{type:'MultiPolygon',coordinates:c}:null;}
  return null;
}
function v15QuadrantBox(bounds,id){
  const midLat=(bounds.minLat+bounds.maxLat)/2,midLng=(bounds.minLng+bounds.maxLng)/2;
  return id===1?{minLat:midLat,maxLat:bounds.maxLat,minLng:bounds.minLng,maxLng:midLng}:
         id===2?{minLat:midLat,maxLat:bounds.maxLat,minLng:midLng,maxLng:bounds.maxLng}:
         id===3?{minLat:bounds.minLat,maxLat:midLat,minLng:bounds.minLng,maxLng:midLng}:
                {minLat:bounds.minLat,maxLat:midLat,minLng:midLng,maxLng:bounds.maxLng};
}
function v15BuildQData(municipio,bounds){
  const cfg=V15_MUNICIPAL_CFG[municipio], ns=Math.max(1,(bounds.maxLat-bounds.minLat)*111.1), lo=Math.max(1,(bounds.maxLng-bounds.minLng)*103.5);
  const names=['Q1 – ALFA · NOROESTE','Q2 – BRAVO · NORDESTE','Q3 – CHARLIE · SUDOESTE','Q4 – DELTA · SUDESTE'];
  return names.map((nome,i)=>({id:i+1,nome,km:{ns:(ns/2).toFixed(1),lo:(lo/2).toFixed(1),area:Math.round((cfg?.area||0)/4),diag:(Math.hypot(ns/2,lo/2)).toFixed(1)},divisas:[`Município: ${municipio}`,`Setor ${['Alfa','Bravo','Charlie','Delta'][i]} · ${['Noroeste','Nordeste','Sudoeste','Sudeste'][i]}`],roads:[],roadKeys:[],dirt:[]}));
}
async function v15FetchMunicipalGeo(municipio){
  if(window.V15_MUNICIPAL_CACHE[municipio])return window.V15_MUNICIPAL_CACHE[municipio];
  const cfg=V15_MUNICIPAL_CFG[municipio]; if(!cfg)return null;
  const urls=[
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${cfg.code}?formato=application/vnd.geo+json&qualidade=minima`,
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${cfg.code}?formato=application/geo+json&qualidade=minima`
  ];
  for(const url of urls){try{const r=await fetch(url,{cache:'force-cache'});if(!r.ok)continue;const j=await r.json();if(j?.type==='FeatureCollection'&&j.features?.length){window.V15_MUNICIPAL_CACHE[municipio]=j;return j;}}catch(e){console.warn('SISRURAL: malha IBGE indisponível',municipio,e);}}
  return null;
}
function v15FallbackFeature(municipio){
  const [[s,w],[n,e]]=V15_MUNICIPAL_CFG[municipio].fallback;
  return {type:'FeatureCollection',features:[{type:'Feature',properties:{nome:municipio,fallback:true},geometry:{type:'Polygon',coordinates:[[[w,s],[e,s],[e,n],[w,n],[w,s]]]}}]};
}
function v15UpdateTabs(municipio){
  const subs=['NOROESTE','NORDESTE','SUDOESTE','SUDESTE'];
  const isCompany=municipio==='2ª Companhia';
  const tabs=document.getElementById('v15QuadrantTabs'); if(tabs)tabs.style.display=isCompany?'none':'';
  [1,2,3,4].forEach(i=>{
    const t=document.getElementById('tab'+i);if(!t)return;
    const sub=t.querySelector('.qtab-sub');if(sub)sub.textContent=subs[i-1];
    const badge=t.querySelector('.pb'); if(badge&&municipio!=='Casa Branca'){badge.textContent='● SETOR';badge.className='pb pN';}
    t.title=`${municipio} · Q${i}`;
  });
}
function v15ApplyMapLayerContext(area){
  const casa=area==='Casa Branca'||area==='2cia';
  [roadsG,dirtG,refsG].forEach(g=>{try{if(casa){if(!map.hasLayer(g))g.addTo(map);}else if(map.hasLayer(g))g.remove();}catch(e){}});
  try{propsG.clearLayers(); if(casa)propMks.forEach(m=>propsG.addLayer(m));}catch(e){}
  // Nuvem e pontos locais são redesenhados respeitando município ativo.
  try{cloudPtsG.clearLayers();window.cloudPropMks={};(window.v7CloudProps||[]).forEach(p=>renderCloudPt(p,p.id));}catch(e){}
  try{userPtsG.clearLayers();(window.userPts||[]).forEach((p,i)=>renderPt(p,i));}catch(e){}
}
async function v15RenderArea(area){
  window.V15_ACTIVE_AREA=area;
  quadsG.clearLayers(); municipalG.clearLayers(); Object.keys(qPoly).forEach(k=>delete qPoly[k]); closeSheet();
  v15ApplyMapLayerContext(area);
  if(area==='2cia'){
    let union=null;
    for(const municipio of Object.keys(V15_MUNICIPAL_CFG)){
      const fc=(await v15FetchMunicipalGeo(municipio))||v15FallbackFeature(municipio);
      const layer=L.geoJSON(fc,{style:{color:'#facc15',weight:2,fillColor:'#0ea5e9',fillOpacity:.045,dashArray:'7 5'}}).bindTooltip(municipio,{sticky:true,direction:'center',className:'v15-municipio-tip'}).addTo(municipalG);
      const b=layer.getBounds(); union=union?union.extend(b):L.latLngBounds(b);
    }
    window.V15_ACTIVE_QDATA=QDATA; v15UpdateTabs('2ª Companhia');
    if(union?.isValid())map.fitBounds(union,{padding:[35,35],animate:true});
    return;
  }
  const fc=(await v15FetchMunicipalGeo(area))||v15FallbackFeature(area), bounds=v15BoundsFromGeoJSON(fc);
  if(!bounds){const a=V15_MUNICIPAL_CFG[area];map.setView(a.center,a.zoom);return;}
  window.V15_ACTIVE_QDATA=v15BuildQData(area,bounds); v15UpdateTabs(area);
  L.geoJSON(fc,{style:{color:'#facc15',weight:2.2,fillOpacity:0,dashArray:'8 5'}}).bindTooltip(area,{sticky:true}).addTo(municipalG);
  for(let id=1;id<=4;id++){
    const qb=v15QuadrantBox(bounds,id), features=[];
    (fc.features||[]).forEach(f=>{const g=v15ClipGeometry(f.geometry,qb);if(g)features.push({type:'Feature',properties:{q:id,municipio:area},geometry:g});});
    const qfc={type:'FeatureCollection',features},col=QC[id-1],qd=window.V15_ACTIVE_QDATA[id-1];
    const layer=L.geoJSON(qfc,{style:{color:col,weight:2,fillColor:col,fillOpacity:.12,dashArray:'6 4',opacity:.9}});
    layer.on('click',()=>{selQ(id);openSheet();});
    layer.bindPopup(`<div class="pt" style="color:${col}">${area} · Q${id} – ${['ALFA','BRAVO','CHARLIE','DELTA'][id-1]}</div><div class="ps">Setor operacional municipal · ~${qd.km.area} km²</div>`,{maxWidth:260});
    layer.addTo(quadsG); qPoly[id]=layer;
  }
  const lb=L.geoJSON(fc).getBounds(); if(lb.isValid())map.fitBounds(lb,{padding:[35,35],animate:true});
  selQ(1); closeSheet();
}
window.v15ClassQMunicipal=function(lat,lng,municipio){
  municipio=municipio||window.V15_ACTIVE_AREA||'Casa Branca';
  if(municipio==='2cia')municipio='Casa Branca';
  const fc=window.V15_MUNICIPAL_CACHE[municipio],cfg=V15_MUNICIPAL_CFG[municipio];
  let b=fc?v15BoundsFromGeoJSON(fc):null;
  if(!b&&cfg){const [[s,w],[n,e]]=cfg.fallback;b={minLat:s,maxLat:n,minLng:w,maxLng:e};}
  if(!b)return classQ(lat,lng);
  const midLat=(b.minLat+b.maxLat)/2,midLng=(b.minLng+b.maxLng)/2,north=lat>midLat,west=lng<midLng;
  return north&&west?1:north&&!west?2:!north&&west?3:4;
};

// ── AUDITORIA DE LOCALIZAÇÃO · V15.14 EXP
// Valida a coordenada contra a malha municipal real (IBGE) quando disponível.
// Não altera dados automaticamente. Perto da divisa = conferência; distante = suspeita.
function v15PointInRing(lat,lng,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const xi=+ring[i][0], yi=+ring[i][1], xj=+ring[j][0], yj=+ring[j][1];
    const hit=((yi>lat)!==(yj>lat)) && (lng < (xj-xi)*(lat-yi)/(yj-yi||1e-15)+xi);
    if(hit)inside=!inside;
  }
  return inside;
}
function v15PointInPolygon(lat,lng,coords){
  if(!Array.isArray(coords)||!coords.length)return false;
  if(!v15PointInRing(lat,lng,coords[0]))return false;
  for(let i=1;i<coords.length;i++) if(v15PointInRing(lat,lng,coords[i]))return false;
  return true;
}
function v15PointInGeometry(lat,lng,geom){
  if(!geom)return false;
  if(geom.type==='Polygon')return v15PointInPolygon(lat,lng,geom.coordinates);
  if(geom.type==='MultiPolygon')return geom.coordinates.some(p=>v15PointInPolygon(lat,lng,p));
  return false;
}
function v15SegDistMeters(lat,lng,a,b){
  const R=6371000, rad=Math.PI/180, cos=Math.cos(lat*rad);
  const ax=(+a[0]-lng)*rad*cos*R, ay=(+a[1]-lat)*rad*R;
  const bx=(+b[0]-lng)*rad*cos*R, by=(+b[1]-lat)*rad*R;
  const dx=bx-ax,dy=by-ay, den=dx*dx+dy*dy;
  const t=den?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/den)):0;
  return Math.hypot(ax+dx*t,ay+dy*t);
}
function v15GeometryEdgeDistance(lat,lng,geom){
  let min=Infinity;
  const ringDist=ring=>{for(let i=1;i<ring.length;i++)min=Math.min(min,v15SegDistMeters(lat,lng,ring[i-1],ring[i]));};
  if(geom?.type==='Polygon')geom.coordinates.forEach(ringDist);
  if(geom?.type==='MultiPolygon')geom.coordinates.forEach(poly=>poly.forEach(ringDist));
  return min;
}
function v15FallbackDistance(lat,lng,b){
  const latM=111100, lngM=111100*Math.cos(lat*Math.PI/180);
  const dx=lat<b.minLat?(b.minLat-lat)*latM:lat>b.maxLat?(lat-b.maxLat)*latM:0;
  const dy=lng<b.minLng?(b.minLng-lng)*lngM:lng>b.maxLng?(lng-b.maxLng)*lngM:0;
  return Math.hypot(dx,dy);
}
window.v15AssessPropertyLocation=async function(lat,lng,municipio){
  lat=Number(lat);lng=Number(lng);const allowed=['Casa Branca','Santa Cruz das Palmeiras','Tambaú','Itobi'];municipio=allowed.includes(String(municipio||''))?String(municipio):'Casa Branca';
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||!municipio||municipio==='2cia')return {status:'unknown',label:'⚪ Não avaliada',distanceMeters:null,inside:false,municipio};
  const fc=(await v15FetchMunicipalGeo(municipio))||v15FallbackFeature(municipio);
  const real=!!(fc&&!fc.features?.some(f=>f.properties?.fallback));
  const inside=(fc?.features||[]).some(f=>v15PointInGeometry(lat,lng,f.geometry));
  if(inside)return {status:'ok',label:'🟢 Localização compatível',distanceMeters:0,inside:true,municipio,source:real?'IBGE':'referência aproximada'};
  let d=Infinity;
  (fc?.features||[]).forEach(f=>{d=Math.min(d,v15GeometryEdgeDistance(lat,lng,f.geometry));});
  if(!Number.isFinite(d)){
    const cfg=V15_MUNICIPAL_CFG[municipio];
    if(cfg){const [[s,w],[n,e]]=cfg.fallback;d=v15FallbackDistance(lat,lng,{minLat:s,maxLat:n,minLng:w,maxLng:e});}
  }
  const status=d<=5000?'warn':'bad';
  return {status,label:status==='warn'?'🟡 Próxima da divisa · conferir':'🔴 Localização suspeita · distante',distanceMeters:d,inside:false,municipio,source:real?'IBGE':'referência aproximada'};
};


// ── RODOVIAS
const RDS={
  sp340N:{nm:'SP-340 Norte (→ Mococa)',c:'#fbbf24',w:4,pts:[[-21.618,-47.140],[-21.660,-47.110],[-21.695,-47.094],[-21.735,-47.090],[-21.777,-47.085],[-21.840,-47.037],[-21.890,-46.993]]},
  sp340S:{nm:'SP-340 Sul (→ Tambaú)',c:'#fbbf24',w:4,pts:[[-21.777,-47.085],[-21.830,-47.152],[-21.870,-47.183],[-21.955,-47.240]]},
  sp350:{nm:'SP-350 (→ Itobi/SJ.Rio Pardo)',c:'#fbbf24',w:4,pts:[[-21.777,-47.085],[-21.733,-47.003],[-21.710,-46.973],[-21.678,-46.945],[-21.618,-46.912]]},
  sp215:{nm:'SP-215 (→ Vargem Grande do Sul)',c:'#fbbf24',w:4,pts:[[-21.862,-47.230],[-21.820,-47.165],[-21.777,-47.085],[-21.718,-47.004],[-21.688,-46.963]]},
  vicLagoa:{nm:'Vicinal – Lagoa Branca',c:'#64748b',w:2.5,d:'6 4',pts:[[-21.655,-47.115],[-21.625,-47.105],[-21.617,-47.095]]},
  vicLauraNunes:{nm:'Est. Vic. Profª Laura B. Nunes',c:'#64748b',w:2.5,d:'6 4',pts:[[-21.618,-47.094],[-21.660,-47.095],[-21.690,-47.080]]},
  vicVenda:{nm:'Vicinal – Venda Branca',c:'#64748b',w:2.5,d:'6 4',pts:[[-21.745,-47.032],[-21.712,-47.007],[-21.673,-46.973]]},
  vicVendaB:{nm:'Est. Municipal Venda Branca',c:'#64748b',w:2.5,d:'6 4',pts:[[-21.750,-47.085],[-21.810,-47.020],[-21.880,-46.970]]},
  vicSW:{nm:'Vicinal – Área SW',c:'#64748b',w:2.5,d:'6 4',pts:[[-21.810,-47.100],[-21.860,-47.058],[-21.910,-47.160]]},
  vicSE:{nm:'Vicinal – S.Cruz Palmeiras',c:'#64748b',w:2.5,d:'6 4',pts:[[-21.830,-47.008],[-21.900,-46.994],[-21.924,-46.980]]},
  rail:{nm:'Ferrovia FCA/Vale – Mogiana',c:'#334155',w:2.5,d:'4 4',pts:[[-21.790,-47.148],[-21.777,-47.085],[-21.718,-46.958],[-21.686,-46.937]]},
};
const roadsG=L.layerGroup().addTo(map);
Object.entries(RDS).forEach(([k,r])=>{
  const pl=L.polyline(r.pts,{color:r.c,weight:r.w,opacity:.9,dashArray:r.d||null});
  pl.bindPopup(`<div class="pt" style="color:${r.c}">${r.nm}</div><div class="ps">DER-SP · RENOVIAS</div>`,{maxWidth:220});
  roadsG.addLayer(pl);
  const mid=r.pts[Math.floor(r.pts.length/2)];
  roadsG.addLayer(L.marker(mid,{icon:L.divIcon({className:'',html:`<div style="background:rgba(7,12,23,.9);border:1px solid ${r.c};border-radius:4px;padding:1px 6px;font-family:'JetBrains Mono',monospace;font-size:8px;color:${r.c};white-space:nowrap;pointer-events:none">${r.nm.split('(')[0].split('–')[0].trim()}</div>`,iconAnchor:[35,7]})}));
});

// ── ESTRADAS DE TERRA
const DIRTS=[
  {nm:'Est. Rocheto – Faz. Três Marias',maps:'https://www.google.com/maps/search/?api=1&query=-21.743,-47.130',pts:[[-21.770,-47.090],[-21.743,-47.130],[-21.740,-47.145]]},
  {nm:'Vicinal s/nome NW km 6 → Tambaú',maps:'https://www.google.com/maps/search/?api=1&query=-21.718,-47.192',pts:[[-21.770,-47.090],[-21.730,-47.135],[-21.718,-47.192]]},
  {nm:'Est. Cabanha Batemarco',maps:'https://www.google.com/maps/search/?api=1&query=-21.7536,-47.0862',pts:[[-21.777,-47.085],[-21.754,-47.086]]},
  {nm:'Vicinal Pomar Boa Vista',maps:'https://www.google.com/maps/search/?api=1&query=-21.711,-47.009',pts:[[-21.752,-47.000],[-21.733,-46.998],[-21.711,-47.009]]},
  {nm:'Acesso Faz. Casa Branca NE',maps:'https://www.google.com/maps/search/?api=1&query=-21.6746,-47.0613',pts:[[-21.680,-47.070],[-21.675,-47.063],[-21.675,-47.055]]},
  {nm:'Est. Lagoa Branca–Venda Branca Km1-8',maps:'https://www.google.com/maps/search/?api=1&query=-21.835,-47.068',pts:[[-21.777,-47.085],[-21.810,-47.068],[-21.835,-47.068]]},
  {nm:'Acesso Faz. Prudente do Morro',maps:'https://www.google.com/maps/search/?api=1&query=-21.8072,-47.1820',pts:[[-21.790,-47.150],[-21.807,-47.182]]},
  {nm:'Est. Lagoa Branca–Venda Branca Km8-15',maps:'https://www.google.com/maps/search/?api=1&query=-21.880,-47.110',pts:[[-21.835,-47.068],[-21.865,-47.095],[-21.910,-47.115]]},
  {nm:'Vicinal SE – Faz. São Carlos',maps:'https://www.google.com/maps/search/?api=1&query=-21.8222,-47.0392',pts:[[-21.803,-47.064],[-21.822,-47.039]]},
  {nm:'Vicinal SE – Faz. Cachoeirinha',maps:'https://www.google.com/maps/search/?api=1&query=-21.9144,-47.0871',pts:[[-21.870,-47.060],[-21.900,-47.083],[-21.914,-47.087]]},
];
const dirtG=L.layerGroup().addTo(map);
DIRTS.forEach(dr=>{
  const pl=L.polyline(dr.pts,{color:'#92400e',weight:2.5,opacity:.9,dashArray:'4 3'});
  pl.bindPopup(`<div class="pt" style="color:#d97706">🟫 ${dr.nm}</div><div class="ps">ESTRADA DE TERRA / VICINAL</div><div class="pr"><span>Navegar</span><span><a href="${dr.maps}" target="_blank" style="color:#ffd700">📍 Abrir Maps ↗</a></span></div>`,{maxWidth:250});
  dirtG.addLayer(pl);
});

// ── MARCADORES FAZENDAS
const propsG=L.layerGroup().addTo(map);
const propMks=[];
PROPS.forEach((p,i)=>{
  const col=QC[p.q-1],big=p.r&&p.r>=4.7,sz=big?30:24;
  const mk=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',
    html:`<div style="background:rgba(7,12,23,.93);border:2px solid ${col};border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.6)"><span style="transform:rotate(45deg);font-size:${big?14:11}px">${p.ico}</span></div>`,
    iconAnchor:[sz/2,sz]})});
  const dtag=p.dirt?'🟫 terra':'🛣 asfalto';
  mk.bindPopup(`<div class="pt" style="color:${col}">${p.ico} ${p.nm}</div><div class="ps">Q${p.q}·${['ALFA','BRAVO','CHARLIE','DELTA'][p.q-1]} · ${p.tp}</div>${p.r?`<div class="pop-rating">${'★'.repeat(Math.floor(p.r))} ${p.r} (${p.rc})</div>`:''}<div class="pr"><span>Endereço</span><span>${p.end}</span></div><div class="pr"><span>Acesso</span><span>${dtag}</span></div>${p.ph?`<div class="pr"><span>Tel</span><span><a href="tel:${p.ph}" style="color:var(--ac)">${p.ph}</a></span></div>`:''}<div class="pr"><span>GPS</span><span>${Math.abs(p.lat).toFixed(4)}°S ${Math.abs(p.lng).toFixed(4)}°W</span></div><div class="pr"><span>Navegar</span><span><a href="${p.gmaps}" target="_blank" style="color:#4ade80;font-weight:700">🧭 Abrir Maps ↗</a></span></div><div style="margin-top:8px;display:grid;gap:6px"><button onclick="openVisitForBase(${i})" style="width:100%;background:#ffd700;color:#07111f;border:0;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📋 Registrar visita</button><button onclick="openPhotoEditorForBase(${i})" style="width:100%;background:#0f766e;color:#fff;border:1px solid #14b8a6;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📷 Adicionar / atualizar fotos</button><button onclick="openSeasonEditorForBase(${i})" style="width:100%;background:#166534;color:#fff;border:1px solid #22c55e;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">🌱 Atividade / plantio / colheita</button><button onclick="openOccurrenceForBase(${i})" style="width:100%;background:#b91c1c;color:#fff;border:1px solid #ef4444;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">🚨 Registrar ocorrência</button><button onclick="openHistoryForBase(${i})" style="width:100%;background:#1e293b;color:#e5e7eb;border:1px solid #334155;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📜 Histórico</button></div>`,{maxWidth:290});
  propsG.addLayer(mk); propMks.push(mk);
});
window.refreshBasePropertyPopup=function(i){
  const p=PROPS[Number(i)],mk=propMks[Number(i)]; if(!p||!mk)return;
  const col=QC[p.q-1],dtag=p.dirt?'🟫 terra':'🛣 asfalto';
  mk.setPopupContent(`<div class="pt" style="color:${col}">${p.ico||'🏡'} ${p.nm}</div><div class="ps">Q${p.q}·${['ALFA','BRAVO','CHARLIE','DELTA'][p.q-1]} · ${p.tp||'Propriedade rural'}</div>${p.r?`<div class="pop-rating">${'★'.repeat(Math.floor(p.r))} ${p.r} (${p.rc})</div>`:''}<div class="pr"><span>Endereço</span><span>${p.end||''}</span></div><div class="pr"><span>Acesso</span><span>${dtag}</span></div>${p.ph?`<div class="pr"><span>Tel</span><span><a href="tel:${p.ph}" style="color:var(--ac)">${p.ph}</a></span></div>`:''}<div class="pr"><span>GPS</span><span>${Math.abs(p.lat).toFixed(4)}°S ${Math.abs(p.lng).toFixed(4)}°W</span></div><div class="pr"><span>Navegar</span><span><a href="${p.gmaps}" target="_blank" style="color:#4ade80;font-weight:700">🧭 Abrir Maps ↗</a></span></div><div style="margin-top:8px;display:grid;gap:6px"><button onclick="openVisitForBase(${i})" style="width:100%;background:#ffd700;color:#07111f;border:0;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📋 Registrar visita</button><button onclick="openPhotoEditorForBase(${i})" style="width:100%;background:#0f766e;color:#fff;border:1px solid #14b8a6;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📷 Adicionar / atualizar fotos</button><button onclick="openSeasonEditorForBase(${i})" style="width:100%;background:#166534;color:#fff;border:1px solid #22c55e;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">🌱 Atividade / plantio / colheita</button><button onclick="openOccurrenceForBase(${i})" style="width:100%;background:#b91c1c;color:#fff;border:1px solid #ef4444;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">🚨 Registrar ocorrência</button><button onclick="openHistoryForBase(${i})" style="width:100%;background:#1e293b;color:#e5e7eb;border:1px solid #334155;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📜 Histórico</button></div>`);
};

// ── REF MARKERS
const refsG=L.layerGroup().addTo(map);
const refMks=[];
FARM_REFS.forEach((f,i)=>{
  const mk=L.marker([f.lat,f.lng],{icon:L.divIcon({className:'',
    html:`<div style="position:relative;display:inline-block"><div style="background:rgba(7,12,23,.96);border:2.5px solid ${f.col};border-radius:10px;padding:4px 9px;display:flex;align-items:center;gap:5px;box-shadow:0 0 16px ${f.col}55;white-space:nowrap"><span style="font-size:15px">${f.ico}</span><span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;color:${f.col}">${f.nm.split('·')[1]?.trim()||f.nm}</span></div><div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${f.col}"></div></div>`,
    iconAnchor:[70,40]})});
  mk.bindPopup(`<div class="pt" style="color:${f.col}">${f.ico} ${f.nm}</div><div class="ps">ÂNCORA TÁTICA Q${f.q} · ${f.km}</div><div class="pr"><span>Nota</span><span>${f.nota}</span></div><div class="pr"><span>GPS</span><span>${Math.abs(f.lat).toFixed(4)}°S ${Math.abs(f.lng).toFixed(4)}°W</span></div><div class="pr"><span>Ver no Maps</span><span><a href="${f.maps}" target="_blank" style="color:#ffd700">📍 Abrir ↗</a></span></div><div class="pr"><span>Navegação</span><span><a href="${f.nav}" target="_blank" style="color:#4ade80;font-weight:700">🧭 Navegar agora ↗</a></span></div>`,{maxWidth:290});
  refsG.addLayer(mk); refMks.push(mk);
});

// Ponto PM fixo removido: referências oficiais serão cadastradas pelo próprio sistema.

// Rio
L.polyline([[-21.562,-47.048],[-21.596,-47.008],[-21.645,-46.968]],{color:'#38bdf8',weight:3,opacity:.7}).addTo(map).bindPopup(`<div class="pt" style="color:#38bdf8">💧 Rio Mogi Pardo</div><div class="ps">DIVISA NATURAL CASA BRANCA ↔ MOCOCA</div>`,{maxWidth:200});

// ── PONTOS PM (localStorage)
const userPtsG=L.layerGroup().addTo(map);
const cloudPtsG=L.layerGroup().addTo(map);
window.userPtsG=userPtsG;
window.cloudPtsG=cloudPtsG;
window.cloudPropMks={};
let userPts=[]; window.userPts=userPts;
try{const r=localStorage.getItem('sisrural_pm_v1');if(r)userPts=JSON.parse(r);}catch(e){} window.userPts=userPts;

function savePts(){try{localStorage.setItem('sisrural_pm_v1',JSON.stringify(userPts));}catch(e){}}

function renderPt(p,i){
  const municipio=p.municipio||'Casa Branca'; const activeMun=window.V15_ACTIVE_AREA||'Casa Branca'; if(activeMun!=='2cia'&&municipio!==activeMun)return;
  const col='#22c55e';
  const mk=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',
    html:`<div style="position:relative;display:inline-block"><div style="background:rgba(7,12,23,.96);border:2px solid ${col};border-radius:9px;padding:3px 8px;display:flex;align-items:center;gap:4px;box-shadow:0 0 12px ${col}44;white-space:nowrap"><span style="font-size:13px">📌</span><span style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;color:${col}">${p.nm}</span></div><div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${col}"></div></div>`,
    iconAnchor:[55,35]})});
  mk.bindPopup(`<div class="pt" style="color:${col}">📌 ${p.nm}</div><div class="ps">PONTO PM · ${p.dt||''}</div>${p.tp?`<div class="pr"><span>Tipo</span><span>${p.tp}</span></div>`:''} ${p.end?`<div class="pr"><span>End.</span><span>${p.end}</span></div>`:''} ${p.ph?`<div class="pr"><span>Tel</span><span>${p.ph}</span></div>`:''}<div class="pr"><span>Acesso</span><span>${p.dirt?'🟫 Terra':'🛣 Asfalto'}</span></div><div class="pr"><span>GPS</span><span>${Math.abs(p.lat).toFixed(4)}°S ${Math.abs(p.lng).toFixed(4)}°W</span></div><div class="pr"><span>Navegar</span><span><a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving" target="_blank" style="color:#4ade80;font-weight:700">🧭 Abrir Maps ↗</a></span></div><div style="margin-top:6px;text-align:center"><span onclick="delPt(${i})" style="font-size:9px;color:#ef4444;cursor:pointer;border:1px solid rgba(239,68,68,.3);border-radius:4px;padding:2px 8px;font-family:'JetBrains Mono',monospace">🗑 Remover</span></div>`,{maxWidth:270});
  userPtsG.addLayer(mk);
}
function renderCloudPt(p,id){
  const col='#22d3ee';
  const lat=parseFloat(p.lat), lng=parseFloat(p.lng);
  if(isNaN(lat)||isNaN(lng)) return;
  const nm=p.nm||p.nome||'Propriedade cadastrada';
  const tp=p.tp||p.tipo||'Cadastro rural';
  const end=p.end||p.endereco||'';
  const ph=p.ph||p.telefone||'';
  const maps=p.maps||`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const municipio=p.municipio||'Casa Branca';
  const activeMun=window.V15_ACTIVE_AREA||'Casa Branca';
  if(activeMun!=='2cia'&&municipio!==activeMun)return;
  const q=p.quadrante||window.v15ClassQMunicipal?.(lat,lng,municipio)||(typeof classQ==='function'?classQ(lat,lng):'');
  const mk=L.marker([lat,lng],{icon:L.divIcon({className:'',
    html:`<div style="position:relative;display:inline-block"><div style="background:rgba(7,12,23,.96);border:2px solid ${col};border-radius:9px;padding:3px 8px;display:flex;align-items:center;gap:4px;box-shadow:0 0 12px ${col}44;white-space:nowrap"><span style="font-size:13px">☁️</span><span style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;color:${col}">${nm}</span></div><div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${col}"></div></div>`,
    iconAnchor:[55,35]})});
  mk.bindPopup(`<div class="pt" style="color:${col}">☁️ ${nm}</div><div class="ps">CADASTRO SINCRONIZADO · ${tp}</div>${q?`<div class="pr"><span>Quadrante</span><span>Q${q}</span></div>`:''}${end?`<div class="pr"><span>End.</span><span>${end}</span></div>`:''}${ph?`<div class="pr"><span>Tel</span><span><a href="tel:${ph}" style="color:var(--ac)">${ph}</a></span></div>`:''}<div class="pr"><span>GPS</span><span>${Math.abs(lat).toFixed(5)}°S ${Math.abs(lng).toFixed(5)}°W</span></div>${p.ultimaVisitaTexto?`<div class="pr"><span>Última visita</span><span style="color:#ffd700">${p.ultimaVisitaTexto}</span></div>`:''}<div class="pr"><span>Navegar</span><span><a href="${maps}" target="_blank" style="color:#4ade80;font-weight:700">🧭 Abrir Maps ↗</a></span></div><div class="pr"><span>Status</span><span style="color:#4ade80">Sincronizado</span></div><div style="margin-top:8px;display:grid;gap:6px"><button onclick="openVisitForCloud('${id}')" style="width:100%;background:#ffd700;color:#07111f;border:0;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📋 Registrar visita</button><button onclick="openPhotoEditorForCloud('${id}')" style="width:100%;background:#0f766e;color:#fff;border:1px solid #14b8a6;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📷 Adicionar / atualizar fotos</button><button onclick="openSeasonEditorForCloud('${id}')" style="width:100%;background:#166534;color:#fff;border:1px solid #22c55e;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">🌱 Atividade / plantio / colheita</button><button onclick="openOccurrenceForCloud('${id}')" style="width:100%;background:#b91c1c;color:#fff;border:1px solid #ef4444;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">🚨 Registrar ocorrência</button><button onclick="openHistoryForCloud('${id}')" style="width:100%;background:#1e293b;color:#e5e7eb;border:1px solid #334155;border-radius:8px;padding:8px;font-weight:800;cursor:pointer">📜 Histórico</button></div>`,{maxWidth:290});
  cloudPtsG.addLayer(mk);
  window.cloudPropMks[id]=mk;
}
window.renderCloudPt=renderCloudPt;
window.clearCloudPts=()=>{cloudPtsG.clearLayers(); window.cloudPropMks={};};
function delPt(i){userPts.splice(i,1);savePts();userPtsG.clearLayers();userPts.forEach((p,i)=>renderPt(p,i));map.closePopup();}
userPts.forEach((p,i)=>renderPt(p,i));

// ── CONTROLES
let lsh={roads:true,props:true,refs:true,dirt:true,user:true};
function togSat(){
  satOn=!satOn;
  if(satOn){osmT.remove();satT.addTo(map);satLbl.addTo(map);}
  else{satT.remove();satLbl.remove();osmT.addTo(map);}
  document.getElementById('bSat').textContent=satOn?'🗺':'🛰';
}
function togLayer(k){
  lsh[k]=!lsh[k];
  const g={roads:roadsG,props:propsG,refs:refsG,dirt:dirtG,user:userPtsG}[k];
  if(k==='user'){
    if(lsh[k]){ userPtsG.addTo(map); cloudPtsG.addTo(map); }
    else{ userPtsG.remove(); cloudPtsG.remove(); }
  } else {
    lsh[k]?g.addTo(map):g.remove();
  }
  const btn={roads:'bRoads',props:'bProps',refs:'bRef',dirt:'bDirt',user:'bUser'}[k];
  document.getElementById(btn).classList.toggle('on',lsh[k]);
}
function rv(){window.setSisruralOperationalArea?.(window.V15_ACTIVE_AREA||'Casa Branca');}
// V15.2 EXP: a seleção territorial redesenha a malha e os quadrantes do município ativo.
window.setSisruralOperationalArea=function(area){ return v15RenderArea(area||'2cia'); };

// ── SHEET
let shOpen=false,activeQ=1;
function openSheet(){shOpen=true;document.getElementById('sheet').classList.add('open');document.getElementById('sbg').classList.add('open');}
function closeSheet(){shOpen=false;document.getElementById('sheet').classList.remove('open');document.getElementById('sbg').classList.remove('open');}
function togSheet(){shOpen?closeSheet():openSheet();}

let sy=0;
document.getElementById('sheet').addEventListener('touchstart',e=>{sy=e.touches[0].clientY;},{passive:true});
document.getElementById('sheet').addEventListener('touchend',e=>{
  const dy=e.changedTouches[0].clientY-sy;
  if(dy>60)closeSheet();else if(dy<-40)openSheet();
},{passive:true});

function selQ(id){
  activeQ=id;
  const col=QC[id-1],qd=(window.V15_ACTIVE_QDATA||QDATA)[id-1];
  [1,2,3,4].forEach(q=>document.getElementById('tab'+q).classList.toggle('active',q===id));
  Object.entries(qPoly).forEach(([qid,p])=>{
    const a=parseInt(qid)===id;
    p.setStyle({fillOpacity:a?.25:.10,weight:a?2.5:1.5,opacity:a?1:.7});
  });
  document.getElementById('pName').textContent=(window.V15_ACTIVE_AREA&&window.V15_ACTIVE_AREA!=='2cia'?window.V15_ACTIVE_AREA+' · ':'')+qd.nome;
  document.getElementById('pName').style.color=col;
  document.getElementById('pArea').textContent=qd.km.area;
  document.getElementById('pDiag').textContent=qd.km.diag;
  document.getElementById('sheet').style.setProperty('--qc',col);
  const activeMun=window.V15_ACTIVE_AREA||'Casa Branca';
  const props=PROPS.filter(p=>p.q===id && (activeMun==='2cia'||(p.municipio||'Casa Branca')===activeMun));
  const cloudPropsForQuad=(window.v7CloudProps||[]).filter(p=>{
    const lat=parseFloat(p.lat), lng=parseFloat(p.lng);
    const q=p.quadrante||p.q||window.v15ClassQMunicipal?.(lat,lng,p.municipio||'Casa Branca')||(typeof classQ==='function'?classQ(lat,lng):'');
    const mun=p.municipio||'Casa Branca'; return String(q)===String(id) && (activeMun==='2cia'||mun===activeMun);
  });
  const localPropsForQuad=(window.userPts||[]).filter(p=>{
    const lat=parseFloat(p.lat), lng=parseFloat(p.lng);
    const q=p.quadrante||p.q||window.v15ClassQMunicipal?.(lat,lng,p.municipio||'Casa Branca')||(typeof classQ==='function'?classQ(lat,lng):'');
    const mun=p.municipio||'Casa Branca'; return String(q)===String(id) && (activeMun==='2cia'||mun===activeMun);
  });
  document.getElementById('pProps').textContent=props.length + cloudPropsForQuad.length + localPropsForQuad.length;
  document.getElementById('sDivisas').innerHTML=qd.divisas.map(d=>`<div class="dtag">${d}</div>`).join('');
  document.getElementById('sRoads').innerHTML=qd.roads.map((r,i)=>`<div class="rtag" onclick="zR('${qd.roadKeys[i]}')">${r}</div>`).join('');
  document.getElementById('sDirt').innerHTML=qd.dirt.map(d=>`<div class="dtag" style="border-color:rgba(146,64,14,.4);background:rgba(146,64,14,.1)">🟫 ${d}</div>`).join('');
  const ref=FARM_REFS.find(f=>f.q===id);
  document.getElementById('sRef').innerHTML=ref?`<div class="ref-card" style="--ref-col:${ref.col}" onclick="zRef(${id-1})"><div class="ref-ico-w" style="border-color:${ref.col}">${ref.ico}</div><div class="ref-info"><div class="ref-name" style="color:${ref.col}">${ref.nm}</div><div class="ref-nota">${ref.nota}</div><div class="ref-btns"><a class="ref-btn ref-btn-maps" href="${ref.maps}" target="_blank" onclick="event.stopPropagation()">📍 Ver no Maps</a><a class="ref-btn ref-btn-nav" href="${ref.nav}" target="_blank" onclick="event.stopPropagation()">🧭 Navegar</a></div><div class="ref-gps">${Math.abs(ref.lat).toFixed(4)}°S · ${Math.abs(ref.lng).toFixed(4)}°W · ${ref.km}</div></div></div>`:'';
  const baseHtml=props.map((p,i)=>{
    const idx=PROPS.indexOf(p);
    const dtag=p.dirt?`<span style="font-size:7px;background:rgba(146,64,14,.2);color:#d97706;border-radius:3px;padding:1px 4px">🟫 terra</span>`:`<span style="font-size:7px;background:rgba(34,197,94,.1);color:#4ade80;border-radius:3px;padding:1px 4px">🛣 asf.</span>`;
    return `<div class="prop-card" onclick="zProp(${idx})"><div class="prop-ico-w" style="border-color:${col}">${p.ico}</div><div class="prop-info"><div class="prop-name">${p.nm}</div><div class="prop-type">${p.tp}</div><div class="prop-meta">${p.r?`<span style="font-size:10px;color:var(--ac)">⭐${p.r}</span>`:''}${dtag}</div><div class="prop-addr">${p.end}</div><a class="nav-btn" href="${p.gmaps}" target="_blank" onclick="event.stopPropagation()">📍 Navegar no Maps</a></div><div class="prop-arrow">›</div></div>`;
  }).join('');
  const cloudHtml=cloudPropsForQuad.map(p=>{
    const nm=p.nome||p.nm||'Propriedade cadastrada';
    const tp=p.tipo||p.tp||'Cadastro rural';
    const end=p.endereco||p.end||'';
    const lat=parseFloat(p.lat), lng=parseFloat(p.lng);
    const maps=p.maps||`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    return `<div class="prop-card" onclick="zCloudProp('${p.id}')"><div class="prop-ico-w" style="border-color:#22d3ee">☁️</div><div class="prop-info"><div class="prop-name">${nm}</div><div class="prop-type">${tp} · sincronizado</div><div class="prop-meta"><span style="font-size:7px;background:rgba(34,211,238,.1);color:#22d3ee;border-radius:3px;padding:1px 4px">☁️ nuvem</span></div><div class="prop-addr">${end}</div><a class="nav-btn" href="${maps}" target="_blank" onclick="event.stopPropagation()">📍 Navegar no Maps</a></div><div class="prop-arrow">›</div></div>`;
  }).join('');
  const localHtml=localPropsForQuad.map((p)=>{
    const idx=(window.userPts||[]).indexOf(p);
    const nm=p.nome||p.nm||'Propriedade cadastrada';
    const tp=p.tipo||p.tp||'Cadastro local';
    const end=p.endereco||p.end||'';
    const lat=parseFloat(p.lat), lng=parseFloat(p.lng);
    const maps=p.maps||`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    return `<div class="prop-card" onclick="zUserProp(${idx})"><div class="prop-ico-w" style="border-color:#22c55e">📌</div><div class="prop-info"><div class="prop-name">${nm}</div><div class="prop-type">${tp} · aparelho</div><div class="prop-meta"><span style="font-size:7px;background:rgba(34,197,94,.1);color:#22c55e;border-radius:3px;padding:1px 4px">📌 local/pendente</span></div><div class="prop-addr">${end}</div><a class="nav-btn" href="${maps}" target="_blank" onclick="event.stopPropagation()">📍 Navegar no Maps</a></div><div class="prop-arrow">›</div></div>`;
  }).join('');
  document.getElementById('sProps').innerHTML=(baseHtml+cloudHtml+localHtml)||`<div style="padding:16px;text-align:center;color:var(--mu);font-size:10px;font-family:'JetBrains Mono',monospace">Nenhuma prop. cadastrada neste setor</div>`;
  const qlayer=qPoly[id];
  if(qlayer&&typeof qlayer.getBounds==='function'&&qlayer.getBounds().isValid()) map.fitBounds(qlayer.getBounds(),{padding:[60,60],animate:true});
  openSheet();
}

window.zProp=function zProp(i){const p=PROPS[i];map.setView([p.lat,p.lng],15,{animate:true});setTimeout(()=>propMks[i].openPopup(),400);closeSheet();}
window.zCloudProp=function zCloudProp(id){const p=(window.v7CloudProps||[]).find(x=>x.id===id); if(!p)return; const lat=parseFloat(p.lat),lng=parseFloat(p.lng); map.setView([lat,lng],15,{animate:true}); const mk=(window.cloudPropMks||{})[id]; if(mk)setTimeout(()=>mk.openPopup(),400); closeSheet();}
window.zUserProp=function zUserProp(i){const p=(window.userPts||[])[i]; if(!p)return; const lat=parseFloat(p.lat),lng=parseFloat(p.lng); map.setView([lat,lng],15,{animate:true}); try{ const layers=userPtsG.getLayers(); const mk=layers[i]; if(mk)setTimeout(()=>mk.openPopup(),400); }catch(e){} closeSheet();}
function zRef(i){const f=FARM_REFS[i];map.setView([f.lat,f.lng],14,{animate:true});setTimeout(()=>refMks[i].openPopup(),400);closeSheet();}
function zR(k){const r=RDS[k];if(r){map.fitBounds(L.polyline(r.pts).getBounds(),{padding:[60,60],animate:true});}closeSheet();}

// ── TOAST
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

// ── MODAL ADD
let miniMapInst=null, miniMk=null;

function openAdd(){
  const m=document.getElementById('mAdd');
  m.classList.add('open');
  ['aNome','aTipo','aEnd','aTel'].forEach(id=>document.getElementById(id).value='');
  ['aPlantioIni','aPlantioFim','aColheitaIni','aColheitaFim'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  try{ window.resetPropertyPhotoInputs && window.resetPropertyPhotoInputs(); }catch(e){}
  document.getElementById('aMsg').style.display='none';
  // Mostra o mapa de cadastro imediatamente, mesmo sem GPS ou sem internet.
  const c=(window.map&&map.getCenter)?map.getCenter():{lat:CX,lng:CY};
  document.getElementById('aLat').value=Number(c.lat).toFixed(6);
  document.getElementById('aLng').value=Number(c.lng).toFixed(6);
  document.getElementById('miniMapWrap').style.display='block';
  document.getElementById('gpsTxt').textContent='Toque no mapa abaixo para ajustar o ponto, ou aguarde o GPS.';
  document.getElementById('gpsCoord').textContent=`${Math.abs(c.lat).toFixed(5)}°S  ${Math.abs(c.lng).toFixed(5)}°W  (centro do mapa)`;
  document.getElementById('gpsIco').textContent='📍';
  initMiniMap(c.lat,c.lng);
  // GPS automático atualiza o ponto se conseguir sinal.
  captGPS();
}
function closeAdd(){
  document.getElementById('mAdd').classList.remove('open');
  if(miniMapInst){miniMapInst.remove();miniMapInst=null;miniMk=null;}
}

function captGPS(){
  const txt=document.getElementById('gpsTxt');
  const coord=document.getElementById('gpsCoord');
  const ico=document.getElementById('gpsIco');
  const retry=document.getElementById('gpsRetry');
  txt.textContent='Obtendo localização GPS…';
  coord.textContent='Aguarde…';
  ico.textContent='📡';
  retry.style.display='none';
  if(!navigator.geolocation){
    txt.textContent='⚠️ GPS não disponível neste dispositivo';
    coord.textContent='Insira as coordenadas manualmente abaixo';
    ico.textContent='⚠️';
    retry.style.display='none';
    return;
  }
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude;
    const lng=pos.coords.longitude;
    document.getElementById('aLat').value=lat.toFixed(6);
    document.getElementById('aLng').value=lng.toFixed(6);
    txt.textContent='✅ Localização obtida com sucesso!';
    coord.textContent=`${Math.abs(lat).toFixed(5)}°S  ${Math.abs(lng).toFixed(5)}°W  ±${Math.round(pos.coords.accuracy)}m`;
    ico.textContent='✅';
    retry.style.display='block';
    retry.textContent='↺ Atualizar';
    initMiniMap(lat,lng);
  }, err=>{
    const msg={1:'Permissão negada – ative o GPS',2:'Sinal GPS indisponível',3:'Tempo esgotado'}[err.code]||'Erro GPS';
    txt.textContent='⚠️ '+msg;
    coord.textContent='Use o ponto já aberto no mapa abaixo ou toque no local correto.';
    ico.textContent='⚠️';
    retry.style.display='block';
    retry.textContent='↺ Tentar novamente';
    try{
      const lat=parseFloat(document.getElementById('aLat').value)||CX;
      const lng=parseFloat(document.getElementById('aLng').value)||CY;
      initMiniMap(lat,lng);
    }catch(e){}
  },{enableHighAccuracy:true,timeout:25000,maximumAge:60000});
}

function initMiniMap(lat,lng){
  const wrap=document.getElementById('miniMapWrap');
  wrap.style.display='block';
  if(miniMapInst){
    miniMapInst.setView([lat,lng],16);
    if(miniMk) miniMk.setLatLng([lat,lng]);
    return;
  }
  setTimeout(()=>{
    miniMapInst=L.map('miniMap',{center:[lat,lng],zoom:16,zoomControl:false,attributionControl:false});
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(miniMapInst);
    miniMk=L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(34,197,94,.8)"></div>',iconAnchor:[7,7]})}).addTo(miniMapInst);
    miniMapInst.on('click',e=>{
      miniMk.setLatLng(e.latlng);
      document.getElementById('aLat').value=e.latlng.lat.toFixed(6);
      document.getElementById('aLng').value=e.latlng.lng.toFixed(6);
      document.getElementById('gpsCoord').textContent=`${Math.abs(e.latlng.lat).toFixed(5)}°S  ${Math.abs(e.latlng.lng).toFixed(5)}°W  (ajustado manualmente)`;
    });
  },100);
}

function updateMiniMap(){
  const lat=parseFloat(document.getElementById('aLat').value);
  const lng=parseFloat(document.getElementById('aLng').value);
  if(!isNaN(lat)&&!isNaN(lng)){
    if(miniMapInst){miniMapInst.setView([lat,lng],16);if(miniMk)miniMk.setLatLng([lat,lng]);}
    else initMiniMap(lat,lng);
  }
}

function salvar(){
  const nm=document.getElementById('aNome').value.trim();
  const lat=parseFloat(document.getElementById('aLat').value);
  const lng=parseFloat(document.getElementById('aLng').value);
  const msg=document.getElementById('aMsg');
  if(!nm){msg.style.cssText='display:block;background:rgba(239,68,68,.15);color:#ef4444';msg.textContent='⚠️ Informe o nome da fazenda.';return;}
  if(isNaN(lat)||isNaN(lng)){msg.style.cssText='display:block;background:rgba(239,68,68,.15);color:#ef4444';msg.textContent='⚠️ Coordenadas inválidas. Use o GPS ou insira manualmente.';return;}
  const pt={nm,tp:document.getElementById('aTipo').value.trim(),lat,lng,
    end:document.getElementById('aEnd').value.trim(),ph:document.getElementById('aTel').value.trim(),
    dirt:document.getElementById('aDirt').checked,dt:new Date().toLocaleString('pt-BR'),
    municipio:(document.getElementById('aMunicipio')?.value||window.V15_ACTIVE_AREA||'Casa Branca')};
  pt.q=window.v15ClassQMunicipal?.(lat,lng,pt.municipio)||classQ(lat,lng);
  userPts.push(pt);savePts();renderPt(pt,userPts.length-1);
  try{ if(document.getElementById('sheet')?.classList.contains('open')) selQ(activeQ||classQ(lat,lng)); }catch(e){}
  map.setView([lat,lng],15,{animate:true});
  msg.style.cssText='display:block;background:rgba(34,197,94,.15);color:#22c55e';
  msg.textContent=`✅ "${nm}" salvo com sucesso!`;
  setTimeout(closeAdd,1400);
}

// ── MODAL QR
function openQR(){
  const m=document.getElementById('mQR');m.classList.add('open');
  const wrap=document.getElementById('qrWrap');wrap.innerHTML='';
  const cnv=document.createElement('canvas');wrap.appendChild(cnv);
  const APP_URL='https://subtenenteesargento-spec.github.io/SISRURAL/';
  const url=APP_URL;
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
  s.onload=()=>new QRious({element:cnv,value:url,size:220,background:'#ffffff',foreground:'#0c1520',level:'H'});
  if(!window.QRious){document.head.appendChild(s);}
  else{new QRious({element:cnv,value:url,size:220,background:'#ffffff',foreground:'#0c1520',level:'H'});}
}
function closeQR(){document.getElementById('mQR').classList.remove('open');}

// ── INIT
selQ(1);
setTimeout(()=>{map.setView([CX,CY],10);closeSheet();},300);
