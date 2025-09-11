export const COLORS: Record<number, string> = {
  2:'#0e4a63',4:'#10627e',8:'#1280a3',16:'#14a0c9',32:'#16c0ef',64:'#18d2ff',128:'#1df0e0',256:'#13d695',512:'#0ecf8b',1024:'#70f0a8',2048:'#bafbd7'
}
export const TILE_TEXT_COLOR = '#eaf7ff'
export const GRID_BG = '#141b24'
export const TILE_BG = '#1c2430'
export const TILE_BORDER = '#253140'
export function labelFor(value:number, useLabel:boolean){ if(!useLabel) return String(value); const map:Record<number,string>={2:'8-bit',4:'16-bit',8:'32-bit',16:'64-bit',32:'128-bit',64:'256-bit',128:'512-bit',256:'1 KB',512:'2 KB',1024:'1 MB',2048:'2 MB'}; return map[value] ?? String(value) }