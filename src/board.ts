export type Cell = number
export type Direction = 'up' | 'down' | 'left' | 'right'

export interface MoveResult { moved: boolean; scoreDelta: number; merged: boolean }
export interface TraceMove { from:{r:number,c:number}; to:{r:number,c:number}; value:number; mergedPiece?:boolean }
export interface TraceMerge { at:{r:number,c:number}; newValue:number }
export interface TraceSpawn { at:{r:number,c:number}; value:number }
export interface MoveWithTrace extends MoveResult { moves:TraceMove[]; merges:TraceMerge[]; spawn?:TraceSpawn }

export class Board {
  size:number; cells: Cell[][]
  constructor(size=4){ this.size=size; this.cells=Array.from({length:size},()=>Array.from({length:size},()=>0)) }
  clone(): Board { const b=new Board(this.size); b.cells=this.cells.map(r=>r.slice()); return b }
  loadFrom(cells: number[][]){
    if(cells.length!==this.size || cells.some(r=>r.length!==this.size)) throw new Error('Dimensão inválida para loadFrom')
    for(let r=0;r<this.size;r++) for(let c=0;c<this.size;c++) this.cells[r][c]=cells[r][c]
  }
  reset(){ for(let r=0;r<this.size;r++) for(let c=0;c<this.size;c++) this.cells[r][c]=0; this.spawn(); this.spawn() }
  emptyPositions():[number,number][]{ const res: [number,number][]=[]; for(let r=0;r<this.size;r++) for(let c=0;c<this.size;c++) if(this.cells[r][c]===0) res.push([r,c]); return res }
  spawn(): void { const e=this.emptyPositions(); if(!e.length) return; const [r,c]=e[Math.floor(Math.random()*e.length)]; this.cells[r][c]=Math.random()<0.9?2:4 }
  spawnWithReturn(): TraceSpawn | undefined { const e=this.emptyPositions(); if(!e.length) return; const [r,c]=e[Math.floor(Math.random()*e.length)]; const value=Math.random()<0.9?2:4; this.cells[r][c]=value; return {at:{r,c}, value} }
  canMove(): boolean {
    if(this.emptyPositions().length>0) return true
    for(let r=0;r<this.size;r++) for(let c=0;c<this.size;c++){ const v=this.cells[r][c]; if(r+1<this.size && this.cells[r+1][c]===v) return true; if(c+1<this.size && this.cells[r][c+1]===v) return true }
    return false
  }
  move(dir:Direction){ const r=this.moveWithTrace(dir); return { moved:r.moved, scoreDelta:r.scoreDelta, merged:r.merged } }
  moveWithTrace(dir:Direction){
    const N=this.size, before=this.clone().cells
    let moved=false, scoreDelta=0, mergedFlag=false
    const moves:TraceMove[]=[], merges:TraceMerge[]=[]
    const getter=(i:number,j:number):[number,number]=>{ if(dir==='left') return [i,j]; if(dir==='right') return [i,N-1-j]; if(dir==='up') return [j,i]; return [N-1-j,i] }
    const setter=(i:number,j:number,v:number)=>{ if(dir==='left') this.cells[i][j]=v; else if(dir==='right') this.cells[i][N-1-j]=v; else if(dir==='up') this.cells[j][i]=v; else this.cells[N-1-j][i]=v }
    for(let i=0;i<N;i++){
      const vals:number[]=[]; const pos:{r:number,c:number}[]=[]
      for(let j=0;j<N;j++){ const [r,c]=getter(i,j); const v=before[r][c]; if(v!==0){ vals.push(v); pos.push({r,c}) } }
      const after:number[]=[]; const srcIndexForDest:number[][]=[]; let p=0
      while(p<vals.length){ if(p+1<vals.length && vals[p]===vals[p+1]){ const newV=vals[p]*2; after.push(newV); srcIndexForDest.push([p,p+1]); scoreDelta+=newV; mergedFlag=true; p+=2 } else { after.push(vals[p]); srcIndexForDest.push([p]); p+=1 } }
      while(after.length<N){ after.push(0); srcIndexForDest.push([]) }
      for(let j=0;j<N;j++){
        const [r,c]=getter(i,j); const v=after[j]; setter(i,j,v)
        const contributors=srcIndexForDest[j]
        if(contributors.length===1){ const idx=contributors[0]; const from=pos[idx]; const to={r,c}; if(!(from.r===to.r && from.c===to.c)){ moved=true; moves.push({ from, to, value: vals[idx] }) } }
        else if(contributors.length===2){ const idxA=contributors[0], idxB=contributors[1]; const fromA=pos[idxA], fromB=pos[idxB]; const to={r,c}; if(!(fromA.r===to.r && fromA.c===to.c) || !(fromB.r===to.r && fromB.c===to.c)) moved=true
          moves.push({ from:fromA, to, value: vals[idxA] }); moves.push({ from:fromB, to, value: vals[idxB], mergedPiece:true }); merges.push({ at: to, newValue: v })
        }
      }
    }
    let spawn=undefined; if(moved){ spawn=this.spawnWithReturn() }
    return { moved, scoreDelta, merged:mergedFlag, moves, merges, spawn }
  }
}