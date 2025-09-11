import type { Direction } from './board'
export function setupKeyboard(onDir: (d:Direction)=>void){
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase()
    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){ e.preventDefault() }
    if(k==='arrowup'||k==='w') onDir('up')
    if(k==='arrowdown'||k==='s') onDir('down')
    if(k==='arrowleft'||k==='a') onDir('left')
    if(k==='arrowright'||k==='d') onDir('right')
  })
}
export function setupTouch(el: HTMLElement, onDir: (d:Direction)=>void){
  let sx=0, sy=0, active=false; const threshold=24
  el.addEventListener('touchstart', (e) => { active=true; const t=e.touches[0]; sx=t.clientX; sy=t.clientY }, {passive:true})
  el.addEventListener('touchmove', (e) => {
    if(!active) return; const t=e.touches[0]; const dx=t.clientX-sx; const dy=t.clientY-sy
    if(Math.abs(dx)<threshold && Math.abs(dy)<threshold) return; active=false
    if(Math.abs(dx)>Math.abs(dy)) onDir(dx>0?'right':'left'); else onDir(dy>0?'down':'up')
  }, {passive:true})
  el.addEventListener('touchend', ()=>{ active=false })
}