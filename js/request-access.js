// SISRURAL V9 - request-access.js
// Fallback imediato: garante que o botão Solicitar acesso sempre abra o formulário.
window.openRequestAccess = window.openRequestAccess || function(){
  const m=document.getElementById('v7RequestModal');
  const email=document.getElementById('v7Email')?.value || '';
  if(document.getElementById('reqEmail')) document.getElementById('reqEmail').value=email;
  if(m) m.classList.add('open');
};

// Reforço: se algum navegador bloquear o onclick inline, este evento mantém o botão funcional.
document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('btnSolicitarAcesso');
  if(btn){
    btn.disabled=false;
    btn.addEventListener('click',(ev)=>{ ev.preventDefault(); window.openRequestAccess(); });
  }
});
