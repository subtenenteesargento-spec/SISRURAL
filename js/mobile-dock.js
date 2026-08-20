(function(){
  const mq = window.matchMedia('(max-width: 820px)');
  const dock = document.getElementById('mapDock');
  const handle = document.getElementById('mapDockHandle');
  if(!dock || !handle) return;
  const KEY_OPEN='sisrural_mobile_dock_open';
  const KEY_Y='sisrural_mobile_dock_y';

  function applyMode(){
    if(!mq.matches){
      dock.classList.remove('dock-open');
      handle.style.removeProperty('top');
      return;
    }
    const open=localStorage.getItem(KEY_OPEN)==='1';
    dock.classList.toggle('dock-open',open);
    handle.classList.toggle('dock-open',open);
    handle.textContent=open?'×':'☰';
    const saved=parseFloat(localStorage.getItem(KEY_Y));
    if(Number.isFinite(saved)){
      const max=Math.max(88, window.innerHeight-130);
      handle.style.top=Math.min(Math.max(saved,88),max)+'px';
      dock.style.top=Math.min(Math.max(saved-8,80),Math.max(80,window.innerHeight-420))+'px';
    }
  }
  function setOpen(open){
    localStorage.setItem(KEY_OPEN,open?'1':'0');
    dock.classList.toggle('dock-open',open);
    handle.classList.toggle('dock-open',open);
    handle.textContent=open?'×':'☰';
  }
  handle.addEventListener('click',e=>{
    if(handle.dataset.dragged==='1'){handle.dataset.dragged='0';return;}
    setOpen(!dock.classList.contains('dock-open'));
  });

  let dragging=false,startY=0,startTop=0;
  handle.addEventListener('pointerdown',e=>{
    if(!mq.matches)return;
    dragging=true; startY=e.clientY;
    startTop=parseFloat(getComputedStyle(handle).top)||Math.max(110,window.innerHeight*.36);
    handle.setPointerCapture?.(e.pointerId);
  });
  handle.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const delta=e.clientY-startY;
    if(Math.abs(delta)>5) handle.dataset.dragged='1';
    const max=Math.max(88,window.innerHeight-130);
    const top=Math.min(Math.max(startTop+delta,88),max);
    handle.style.top=top+'px';
    dock.style.top=Math.min(Math.max(top-8,80),Math.max(80,window.innerHeight-420))+'px';
  });
  function end(){
    if(!dragging)return; dragging=false;
    const top=parseFloat(getComputedStyle(handle).top);
    if(Number.isFinite(top))localStorage.setItem(KEY_Y,String(top));
  }
  handle.addEventListener('pointerup',end);
  handle.addEventListener('pointercancel',end);
  window.addEventListener('resize',applyMode);
  mq.addEventListener?.('change',applyMode);
  applyMode();
})();
