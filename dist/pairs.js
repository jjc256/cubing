import {stickersFor,normals} from './orientation.js';
const equal=(a,b)=>a.every((v,i)=>v===b[i]);
export const colorNames={U:'white',R:'red',F:'green',D:'yellow',L:'orange',B:'blue'};
const slots={FR:[1,1],FL:[-1,1],BL:[-1,-1],BR:[1,-1]};
const pieceKey=colors=>[...colors].sort().join('');
const positionNames=new Map(Object.entries({URF:[1,1,1],UFL:[-1,1,1],ULB:[-1,1,-1],UBR:[1,1,-1],DFR:[1,-1,1],DLF:[-1,-1,1],DBL:[-1,-1,-1],DRB:[1,-1,-1],UR:[1,1,0],UF:[0,1,1],UL:[-1,1,0],UB:[0,1,-1],DR:[1,-1,0],DF:[0,-1,1],DL:[-1,-1,0],DB:[0,-1,-1],FR:[1,0,1],FL:[-1,0,1],BL:[-1,0,-1],BR:[1,0,-1]}).map(([name,p])=>[p.join(','),name]));
function pieces(stickers){const byPosition=new Map();for(const s of stickers){const key=s.p.join(',');if(!byPosition.has(key))byPosition.set(key,[]);byPosition.get(key).push(s);}return new Map([...byPosition.values()].map(piece=>[pieceKey(piece.map(s=>s.color)),piece]));}
const signature=piece=>piece.map(s=>`${s.color}:${s.p}:${s.n}`).sort().join('|');
function snapshot(stickers,targets){
 const groups=pieces(stickers),centers=new Map(stickers.filter(s=>s.p.filter(v=>v!==0).length===1).map(s=>[s.n.join(','),s.color]));
 const correct=piece=>piece.every(s=>centers.get(s.n.join(','))===s.color);
 const pairStates=targets.map(target=>{
  const corner=groups.get(target.cornerKey),edge=groups.get(target.edgeKey);
  const aligned=target.colors.every(color=>equal(corner.find(s=>s.color===color).n,edge.find(s=>s.color===color).n));
  const whiteNormal=corner.find(s=>s.color==='U').n;
  const connected=equal(corner[0].p.map((v,i)=>v-edge[0].p[i]),whiteNormal);
  const [x,z]=slots[target.slot];
  const inserted=equal(corner[0].p,[x,-1,z])&&equal(edge[0].p,[x,0,z])&&correct(corner)&&correct(edge);
  return {...target,status:inserted?'inserted':aligned&&connected?'paired':'separated',cornerPosition:positionNames.get(corner[0].p.join(',')),edgePosition:positionNames.get(edge[0].p.join(',')),cornerSignature:signature(corner),edgeSignature:signature(edge),positions:[corner[0].p.join(','),edge[0].p.join(',')]};
 });
 const whiteEdges=[...groups.values()].filter(piece=>piece.length===2&&piece.some(s=>s.color==='U'));
 const cross=whiteEdges.filter(piece=>piece[0].p[1]===-1&&correct(piece)).length;
 return {pairs:pairStates,cross};
}
export function explainSolution(scramble,solution,requiredPairs){
 const setup=[scramble,solution.rotation].join(' '),start=stickersFor(setup);
 const centers=face=>start.find(s=>equal(s.p,normals[face])&&equal(s.n,normals[face])).color;
 const targets=solution.slots.slice(0,requiredPairs).map((slot,i)=>{const colors=[...slot].map(centers);return {label:String.fromCharCode(65+i),slot,colors,cornerKey:pieceKey(['U',...colors]),edgeKey:pieceKey(colors)};});
 const moves=solution.alg?solution.alg.split(' '):[],frames=[snapshot(start,targets)];
 for(let i=0;i<moves.length;i++){
  const current=snapshot(stickersFor([setup,...moves.slice(0,i+1)].join(' ')),targets),previous=frames[i],events=[];
  for(let p=0;p<targets.length;p++){
   const before=previous.pairs[p],after=current.pairs[p],label=after.label;
   if(before.status!==after.status){
    events.push({label,kind:after.status,text:after.status==='inserted'?`${label} inserted in ${after.slot}`:after.status==='paired'?`${label} paired${before.status==='inserted'?' and moved out of its slot':''}`:`${label} ${before.status==='inserted'?'leaves its slot and separates':'separates'}`});
   }else{const cornerMoved=before.cornerSignature!==after.cornerSignature,edgeMoved=before.edgeSignature!==after.edgeSignature;if(cornerMoved||edgeMoved)events.push({label,kind:'moved',text:after.status==='paired'?`Moves paired ${label}`:`Moves ${label} ${cornerMoved&&edgeMoved?'corner and edge':cornerMoved?'corner':'edge'}`});}
  }
  if(current.cross!==previous.cross)events.push({kind:'cross',text:`Cross: ${current.cross}/4 edges solved`});
  current.move=moves[i];current.events=events;current.note=events.length?events.map(e=>e.text).join('. '):'No target pair changes.';frames.push(current);
 }
 return {targets,frames};
}
