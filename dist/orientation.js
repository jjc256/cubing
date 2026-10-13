import {parse,names} from './solver.js';
// Scramble frame: U white, F green, R red. z2 puts white on D and keeps green on F.
const flip={U:'D',D:'U',R:'L',L:'R',F:'F',B:'B'};
const yaw={U:'U',D:'D',R:'F',F:'L',L:'B',B:'R'};
const remap=(alg,map)=>alg.trim()?alg.trim().split(/\s+/).map(t=>map[t[0]]+t.slice(1)).join(' '):'';
export function normalizeScramble(alg){parse(alg);return remap(alg,flip);}
export const fronts=['Green','Orange','Blue','Red'];
export function orientSolution(solution){
 let alg=solution.alg,best;
 for(let turn=0;turn<4;turn++){
  const tokens=alg?alg.split(' '):[];
  // All yaw frames have the same HTM length; prefer fewer B/L turns for execution.
  const cost=tokens.reduce((n,t)=>n+(t[0]==='B'?2:t[0]==='L'?1:0),0);
  const candidate={...solution,alg,rotation:['z2','z2 y','z2 y2',"z2 y'"][turn],front:fronts[turn],yaw:turn,slots:solution.slots.map(slot=>['FR','FL','BL','BR'][(['FR','FL','BL','BR'].indexOf(slot)+turn)%4]),cost};
  if(!best||cost<best.cost)best=candidate;
  alg=remap(alg,yaw);
 }
 return best;
}
export const normals={U:[0,1,0],R:[1,0,0],F:[0,0,1],D:[0,-1,0],L:[-1,0,0],B:[0,0,-1],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
export const colors={U:'#ffffff',R:'#df3030',F:'#149649',D:'#ffd500',L:'#ff8c00',B:'#2468dc'};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function stickersFor(alg){
 const stickers=[];
 for(const f of 'URFDLB')for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
  const n=normals[f],p=[...n],axes=[0,1,2].filter(i=>n[i]===0);p[axes[0]]=a;p[axes[1]]=b;stickers.push({p,n:[...n],color:f});
 }
 for(const tok of alg.trim().split(/\s+/).filter(Boolean)){
  const axis=normals[tok[0]];if(!axis)throw Error('Invalid display move');const whole='xyz'.includes(tok[0]),turns=tok.endsWith('2')?2:tok.endsWith("'")?3:1;
  for(let t=0;t<turns;t++)for(const s of stickers)if(whole||dot(s.p,axis)===1)for(const key of ['p','n']){const v=s[key],c=cross(axis,v),d=dot(axis,v);s[key]=axis.map((n,i)=>n*d-c[i]);}
 }
 return stickers;
}
export function drawCube(container,alg){
 const stickers=stickersFor(alg),layout={U:{r:[1,0,0],d:[0,0,1],cell:[2,1]},R:{r:[0,0,-1],d:[0,-1,0],cell:[3,2]},F:{r:[1,0,0],d:[0,-1,0],cell:[2,2]},D:{r:[1,0,0],d:[0,0,-1],cell:[2,3]},L:{r:[0,0,1],d:[0,-1,0],cell:[1,2]},B:{r:[-1,0,0],d:[0,-1,0],cell:[4,2]}};
 container.replaceChildren();
 for(const [f,v]of Object.entries(layout)){
  const el=document.createElement('div');el.className='face';el.style.gridColumn=v.cell[0];el.style.gridRow=v.cell[1];el.setAttribute('aria-label',f+' face');
  for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){
   const s=stickers.find(s=>dot(s.n,normals[f])===1&&dot(s.p,v.r)===x&&dot(s.p,v.d)===y),cell=document.createElement('div');cell.className='sticker';cell.style.background=colors[s.color];cell.dataset.color=s.color;if(x===0&&y===0)cell.textContent=f;el.append(cell);
  }container.append(el);
 }
}
