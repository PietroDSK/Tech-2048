import { Board, type Direction, type TraceMove, type TraceMerge, type TraceSpawn } from './board'
import { COLORS, GRID_BG, TILE_BG, TILE_BORDER, TILE_TEXT_COLOR, labelFor } from './theme'
import type { SFXLike } from './sfx'

type Phase = 'idle' | 'slide' | 'mergePop' | 'spawnPop'
interface AnimState { phase:Phase; t:number; duration:number; fromCells?:number[][]; toCells?:number[][]; moves?:TraceMove[]; merges?:TraceMerge[]; spawn?:TraceSpawn }

export class Game {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; board = new Board(4); tileGap=12; score=0; best=0; useLabels=false
  sfx?: SFXLike; setSFX(s: SFXLike){ this.sfx=s }; snapshot(){ return { score:this.score, cells:this.board.cells.map(r=>r.slice()) } }
  anim: AnimState = { phase:'idle', t:0, duration:0 }; rafId:number|null=null; inputLocked=false
  SLIDE_MS=180; POP_MS=110; TRAIL_STEPS=3; TRAIL_ALPHA=0.18; SQUASH_MAX=0.12
  constructor(canvas:HTMLCanvasElement){ const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Canvas 2D não suportado'); this.canvas=canvas; this.ctx=ctx; this.fitCanvas(); window.addEventListener('resize',()=>this.fitCanvas()) }
  setBest(v:number){ this.best=v } setLabels(v:boolean){ this.useLabels=v }
  newGame(){ this.stopAnim(); this.score=0; this.board.reset(); this.render() }
  step(dir:Direction){ if(this.inputLocked) return; const before=this.board.clone().cells.map(r=>r.slice()); const result=this.board.moveWithTrace(dir); if(!result.moved){ this.render(); return }
    this.score+=result.scoreDelta; this.sfx?.move()
    this.anim={ phase:'slide', t:0, duration:this.SLIDE_MS, fromCells:before, toCells:this.board.cells.map(r=>r.slice()), moves:result.moves, merges:result.merges, spawn:result.spawn }
    this.inputLocked=true; (this as any)._last=undefined; (this as any)._phaseStamp=this.anim.phase; this.tick()
  }
  fitCanvas(){ const rect=this.canvas.getBoundingClientRect(); const size=Math.min(rect.width,640); this.canvas.width=Math.floor(size); this.canvas.height=Math.floor(size); this.render() }
  render(){ const {ctx}=this; ctx.clearRect(0,0,this.canvas.width,this.canvas.height); this.drawGrid(); const N=this.board.size; for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const v=this.board.cells[r][c]; if(v>0){ const {x,y,s}=this.cellRect(r,c); this.drawTile(x,y,s,v,1) } } if(this.anim.phase!=='idle'){ this.renderAnim() } }
  renderAnim(){ const a=this.anim; const t=Math.min(1, a.duration ? a.t/a.duration : 1)
    if(a.phase==='slide'){ const base=a.fromCells ?? a.toCells ?? this.board.cells; const moves=a.moves ?? []; const movingSet=new Set(moves.map(m=>`${m.from.r}:${m.from.c}`)); this.drawGrid(); const N=this.board.size
      for(let r=0;r<N;r++) for(let c=0;c<N;c++){ if(movingSet.has(`${r}:${c}`)) continue; const v=base[r][c]; if(v>0){ const {x,y,s}=this.cellRect(r,c); this.drawTile(x,y,s,v,1) } }
      for(const m of moves){ const {x:x0,y:y0,s}=this.cellRect(m.from.r,m.from.c); const {x:x1,y:y1}=this.cellRect(m.to.r,m.to.c); const k=this.easeOutCubic(t); const x=x0+(x1-x0)*k, y=y0+(y1-y0)*k
        const horizontal=Math.abs(x1-x0)>Math.abs(y1-y0); const push=this.SQUASH_MAX*(1-this.easeOutCubic(t)); const scaleX=horizontal?(1+push):(1-push/2); const scaleY=horizontal?(1-push/2):(1+push)
        for(let i=1;i<=this.TRAIL_STEPS;i++){ const tk=k - i*(1/(this.TRAIL_STEPS+1)); if(tk<=0) continue; const tx=x0+(x1-x0)*tk; const ty=y0+(y1-y0)*tk; const alpha=this.TRAIL_ALPHA*(1 - i/(this.TRAIL_STEPS+1)); this.drawTileEx(tx,ty,s,m.value,{ alpha }) }
        this.drawTileEx(x,y,s,m.value,{ scaleX, scaleY }) }
      return }
    if(a.phase==='mergePop'){ const base=a.toCells ?? a.fromCells ?? this.board.cells; const merges=a.merges ?? []; this.drawGrid(); const N=this.board.size
      for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const v=base[r][c]; if(v>0){ const {x,y,s}=this.cellRect(r,c); const hit=merges.find(mm=>mm.at.r===r && mm.at.c===c); const scale = hit ? (1 + 0.15 * (1 - this.easeOutCubic(1 - t))) : 1; this.drawTile(x,y,s,v,scale) } } return }
    if(a.phase==='spawnPop'){ const base=a.toCells ?? a.fromCells ?? this.board.cells; this.drawGrid(); const N=this.board.size
      for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const v=base[r][c]; if(v>0){ const {x,y,s}=this.cellRect(r,c); let scale=1; if(a.spawn && a.spawn.at.r===r && a.spawn.at.c===c){ scale = 0.2 + 0.8 * this.easeOutCubic(t) } this.drawTile(x,y,s,v,scale) } } return }
  }
  tick=()=>{ const now=performance.now(); if((this as any)._phaseStamp!==this.anim.phase){ (this as any)._phaseStamp=this.anim.phase; (this as any)._last=now } if((this as any)._last===undefined) (this as any)._last=now
    let dt=now - (this as any)._last; dt=Math.max(0, Math.min(dt, 1000/30)); (this as any)._last=now
    if(this.anim.phase==='idle'){ this.rafId=null; this.render(); return } this.anim.t+=dt
    if(this.anim.t>=this.anim.duration){ if(this.anim.phase==='slide'){ if(this.anim.merges && this.anim.merges.length>0) this.sfx?.merge(1); this.anim={ phase:'mergePop', t:0, duration:this.POP_MS, toCells:this.board.cells.map(r=>r.slice()), merges:this.anim.merges, spawn:this.anim.spawn }
      } else if(this.anim.phase==='mergePop'){ if(this.anim.spawn) this.sfx?.spawn(); this.anim={ phase:'spawnPop', t:0, duration:this.POP_MS, toCells:this.board.cells.map(r=>r.slice()), spawn:this.anim.spawn }
      } else { this.anim={ phase:'idle', t:0, duration:0 }; this.inputLocked=false; this.render(); this.rafId=null; return } }
    this.renderPhaseOnly(); this.rafId=requestAnimationFrame(this.tick) }
  renderPhaseOnly(){ const {ctx}=this; ctx.clearRect(0,0,this.canvas.width,this.canvas.height); if(this.anim.phase==='idle'){ this.render() } else { this.renderAnim() } }
  stopAnim(){ if(this.rafId!==null){ cancelAnimationFrame(this.rafId); this.rafId=null } this.anim={ phase:'idle', t:0, duration:0 }; this.inputLocked=false }
  cellRect(r:number,c:number){ const W=this.canvas.width, N=this.board.size, gap=this.tileGap; const s=(W-gap*(N+1))/N; const x=gap+c*(s+gap), y=gap+r*(s+gap); return {x,y,s} }
  drawGrid(){ const {ctx}=this; const W=this.canvas.width, H=this.canvas.height, N=this.board.size, gap=this.tileGap; const cell=(W-gap*(N+1))/N
    ctx.fillStyle=GRID_BG; this.roundRect(ctx,0,0,W,H,18); ctx.fill(); ctx.fillStyle='#0f1520'
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const x=gap+c*(cell+gap), y=gap+r*(cell+gap); this.roundRect(ctx,x,y,cell,cell,12); ctx.fill(); ctx.strokeStyle='#1a2330'; ctx.lineWidth=1; ctx.stroke() } }
  drawTile(x:number,y:number,s:number,v:number,scale=1){ this.drawTileEx(x,y,s,v,{ scale }) }
  drawTileEx(x:number,y:number,s:number,v:number,opts?:{ scale?:number, scaleX?:number, scaleY?:number, alpha?:number }){ const {ctx}=this; const scaleX=opts?.scaleX ?? opts?.scale ?? 1, scaleY=opts?.scaleY ?? opts?.scale ?? 1, alpha=opts?.alpha ?? 1
    ctx.save(); ctx.globalAlpha=alpha; const cx=x+s/2, cy=y+s/2; ctx.translate(cx,cy); ctx.scale(scaleX,scaleY); ctx.translate(-cx,-cy)
    ctx.fillStyle = COLORS[v] ?? TILE_BG; this.roundRect(ctx,x,y,s,s,12); ctx.fill(); ctx.strokeStyle=TILE_BORDER; ctx.lineWidth=1.5; ctx.stroke()
    const grad=ctx.createLinearGradient(x,y,x,y+s); grad.addColorStop(0,'rgba(255,255,255,.08)'); grad.addColorStop(1,'rgba(0,0,0,.08)'); ctx.fillStyle=grad; this.roundRect(ctx,x,y,s,s,12); ctx.fill()
    ctx.fillStyle=TILE_TEXT_COLOR; ctx.font=`${Math.floor(s*0.32)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`; ctx.textAlign='center'; ctx.textBaseline='middle'; const text=labelFor(v,this.useLabels); ctx.fillText(text,x+s/2,y+s/2); ctx.restore() }
  roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ const rr=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath() }
  easeOutCubic(t:number){ return 1 - Math.pow(1 - t, 3) }
}