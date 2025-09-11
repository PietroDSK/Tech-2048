export interface SFXLike { enabled:boolean; move():void; merge(intensity?:number):void; spawn():void }
export class SFX implements SFXLike {
  ctx: AudioContext | null = null; enabled=true
  constructor(enabled=true){ this.enabled=enabled; if(typeof window!=='undefined' && 'AudioContext' in window){ try{ this.ctx=new AudioContext() }catch{ this.ctx=null } } }
  private beep(freq=440, duration=0.08, type:OscillatorType='sine', gain=0.06){
    if(!this.enabled || !this.ctx) return
    const now=this.ctx.currentTime
    const osc=this.ctx.createOscillator(); const g=this.ctx.createGain()
    osc.type=type; osc.frequency.setValueAtTime(freq, now)
    g.gain.setValueAtTime(gain, now); g.gain.exponentialRampToValueAtTime(0.0001, now+duration)
    osc.connect(g).connect(this.ctx.destination); osc.start(now); osc.stop(now+duration+0.02)
  }
  move(){ this.beep(320, 0.06, 'square', 0.04) }
  merge(intensity=1){ this.beep(520*intensity, 0.1, 'triangle', 0.06) }
  spawn(){ this.beep(220, 0.07, 'sawtooth', 0.035) }
}