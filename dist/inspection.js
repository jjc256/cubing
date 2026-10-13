import {stickersFor,normals} from './orientation.js';
const same=(a,b)=>a.every((v,i)=>v===b[i]);
const key=colors=>[...colors].sort().join('');
const names={U:'white',R:'red',F:'green',D:'yellow',L:'orange',B:'blue'};
const positions=new Map(Object.entries({URF:[1,1,1],UFL:[-1,1,1],ULB:[-1,1,-1],UBR:[1,1,-1],DFR:[1,-1,1],DLF:[-1,-1,1],DBL:[-1,-1,-1],DRB:[1,-1,-1],UR:[1,1,0],UF:[0,1,1],UL:[-1,1,0],UB:[0,1,-1],DR:[1,-1,0],DF:[0,-1,1],DL:[-1,-1,0],DB:[0,-1,-1],FR:[1,0,1],FL:[-1,0,1],BL:[-1,0,-1],BR:[1,0,-1]}).map(([name,p])=>[p.join(','),name]));
function board(alg){
 const stickers=stickersFor(alg),grouped=new Map();
 for(const s of stickers){const p=s.p.join(',');if(!grouped.has(p))grouped.set(p,[]);grouped.get(p).push(s);}
 const pieces=new Map([...grouped.values()].map(p=>[key(p.map(s=>s.color)),p]));
 const centers=new Map(stickers.filter(s=>s.p.filter(v=>v!==0).length===1).map(s=>[s.n.join(','),s.color]));
 const solved=piece=>piece.every(s=>centers.get(s.n.join(','))===s.color);
 return {pieces,centers,solved};
}
export function connected(corner,edge){
 const shared=edge.map(s=>s.color);if(!shared.every(c=>corner.some(s=>s.color===c)))return false;
 const other=corner.find(s=>!shared.includes(s.color));
 return shared.every(c=>same(corner.find(s=>s.color===c).n,edge.find(s=>s.color===c).n))&&same(corner[0].p.map((v,i)=>v-edge[0].p[i]),other.n);
}
const signature=piece=>piece.map(s=>`${s.color}:${s.p}:${s.n}`).sort().join('|');
function state(b,target){
 const corner=b.pieces.get(key(['U',...target.colors])),edge=b.pieces.get(key(target.colors));
 return {corner,edge,cornerPosition:positions.get(corner[0].p.join(',')),edgePosition:positions.get(edge[0].p.join(',')),whiteFace:Object.entries(normals).find(([f,n])=>'URFDLB'.includes(f)&&same(n,corner.find(s=>s.color==='U').n))[0],cornerSolved:b.solved(corner),edgeSolved:b.solved(edge),pair:connected(corner,edge),cornerSignature:signature(corner),blocks:target.colors.map(c=>({color:c,joined:connected(corner,b.pieces.get(key(['U',c]))),position:positions.get(b.pieces.get(key(['U',c]))[0].p.join(','))}))};
}
const allFrom=(frames,start,test)=>frames.slice(start).every(test);
const words=colors=>colors.map(c=>names[c]).join('–');
function explainTarget(target,frames,moves){
 const initial=frames[0],last=frames.length-1,final=frames[last],title=words(target.colors),cornerName='white–'+title;
 const location=`The ${cornerName} corner is at ${initial.cornerPosition}, white facing ${initial.whiteFace}; the ${title} edge is at ${initial.edgePosition}.`;
 const result={slot:target.slot,colors:target.colors,title,kind:'none',notice:location,approach:'No simple inspection cue is recognized for this optimal route. A shortest sequence can be difficult to discover in inspection; compare the other alternatives for a preserved block or an edge you can keep fixed.',steps:[],evidence:{}};
 if(!final.cornerSolved||!final.edgeSolved)throw Error('Inspection target is not solved by this solution.');
 const finalD=last>0&&moves.at(-1)[0]==='D'&&frames[last-1].whiteFace==='D'&&!frames[last-1].cornerSolved&&frames[last-1].edgeSolved;
 let finish;
 if(finalD){
  const before=frames[last-1];let anchor=last-1,edgeAt=last-1;
  while(anchor>0&&frames[anchor-1].cornerSignature===before.cornerSignature)anchor--;
  while(edgeAt>0&&frames[edgeAt-1].edgeSolved)edgeAt--;
  finish={anchor,edgeAt,cornerPosition:before.cornerPosition,edgePosition:before.edgePosition,move:moves.at(-1),keyhole:edgeAt>anchor};
 }
 let block;
 for(let start=0;start<=Math.min(2,last);start++)for(let side=0;side<2;side++)if(!block&&(start===0||!initial.blocks[side].joined)&&allFrom(frames,start,f=>f.blocks[side].joined))block={start,side};
 const initialCue=(initial.pair&&allFrom(frames,0,f=>f.pair))||(initial.edgeSolved&&allFrom(frames,0,f=>f.edgeSolved))||(initial.cornerSolved&&allFrom(frames,0,f=>f.cornerSolved));
 if(block&&(block.start===0||!initialCue)){
  const crossColor=target.colors[block.side],crossName='white–'+names[crossColor],initialCross=initial.blocks[block.side];
  result.kind=block.start===0?'cross-block':block.start===1?'one-turn-block':'two-turn-block';
  result.notice=block.start===0?`The ${cornerName} corner (${initial.cornerPosition}) is already correctly connected to the ${crossName} cross edge (${initialCross.position}). Their shared stickers match: this is a block you can carry as one unit. The missing ${title} edge is at ${initial.edgePosition}.`:`The ${cornerName} corner (${initial.cornerPosition}) and ${crossName} cross edge (${initialCross.position}) can be connected in ${block.start} ${block.start===1?'turn':'turns'} at the start of this solution. Their initial positions are the inspection clue; the ${title} edge at ${initial.edgePosition} is the remaining piece to account for.`;
  result.approach='Build your cross around this corner–cross-edge block. Track the missing non-white edge while placing the block, rather than planning the cross and then starting F2L from scratch.';
  result.evidence.block=block;
  if(block.start)result.steps.push({moves:moves.slice(0,block.start).join(' '),text:`Connect the corner and ${crossName} edge. The resulting block survives every remaining turn.`});
  else result.steps.push({text:'The starting corner–cross-edge block survives the entire solution.'});
 }else if(initial.pair&&allFrom(frames,0,f=>f.pair)){
  result.kind='existing-pair';result.notice=`The ${cornerName} corner (${initial.cornerPosition}) and ${title} edge (${initial.edgePosition}) already form a correctly connected F2L pair.`;
  result.approach='Treat the pair as one unit. Look for cross moves that carry or avoid it, and arrange its insertion as part of completing the cross. This solution never splits the starting pair.';
  result.evidence.pairStart=0;
 }else if(initial.edgeSolved&&allFrom(frames,0,f=>f.edgeSolved)){
  result.kind='fixed-edge';result.notice=`The ${title} edge is already solved in ${target.slot}. Its ${cornerName} corner is at ${initial.cornerPosition}, white facing ${initial.whiteFace}.`;
  result.approach='Use the solved edge as an anchor. Plan where the corner must arrive while solving the cross; this solution keeps the edge fixed throughout, so only its corner needs to be brought into place.';
  result.evidence.fixedEdge=true;
 }else if(initial.cornerSolved&&allFrom(frames,0,f=>f.cornerSolved)){
  result.kind='fixed-corner';result.notice=`The ${cornerName} corner is already solved in ${initial.cornerPosition}. Its matching ${title} edge is at ${initial.edgePosition}.`;
  result.approach='Keep this corner in place and look for a route for its edge that uses an available corner position. This solution preserves the corner throughout; the edge insertion can be incorporated into the cross.';
  result.evidence.fixedCorner=true;
 }else{
  const pairStart=!initial.pair&&[1,2].find(i=>i<=last&&allFrom(frames,i,f=>f.pair));
  if(pairStart){result.kind=pairStart===1?'one-turn-pair':'two-turn-pair';result.notice=`${location} These pieces connect in ${pairStart} ${pairStart===1?'turn':'turns'} at the start of this solution.`;result.approach='Look for this short pairing setup first, then plan a cross that preserves the new pair. Here, the pair remains connected for the rest of the solution.';result.steps.push({moves:moves.slice(0,pairStart).join(' '),text:'Connect the F2L corner and edge; preserve them as one unit afterward.'});result.evidence.pairStart=pairStart;}
 }
 if(finish){
  const covered=result.evidence.block?.start??result.evidence.pairStart??0;
  result.evidence.finish=finish;
  if(result.kind==='none'){
   result.kind='predicted-d-finish';result.notice=location;
   result.approach='There is no ready-made starting block used by this route. The inspection task is to predict the corner’s D-layer position while planning the cross, then account for its edge before the final D alignment. This is a mental-tracking opportunity rather than an obvious starting pair.';
  }
  if(finish.keyhole){
   if(finish.anchor>covered)result.steps.push({moves:moves.slice(covered,finish.anchor).join(' '),text:`Place the corner at ${finish.cornerPosition}, white down. Keep the final D alignment for later.`});
   if(finish.edgeAt>covered)result.steps.push({moves:moves.slice(Math.max(finish.anchor,covered),finish.edgeAt).join(' '),text:`Put the ${title} edge into ${finish.edgePosition} without moving that corner. This is the edge-insertion window to look for in your cross plan.`});
  }else result.steps.push({moves:moves.slice(covered,last-1).join(' '),text:`Arrange the corner at ${finish.cornerPosition}, white down, and its edge at ${finish.edgePosition}. These are the positions to aim for: the last D turn will move the corner into its slot while leaving the middle-layer edge in place.`});
  if(finish.keyhole&&finish.edgeAt<last-1)result.steps.push({moves:moves.slice(Math.max(finish.edgeAt,covered),last-1).join(' '),text:'Complete the other cross work while keeping this edge solved and the corner fixed.'});
  result.steps.push({moves:finish.move,text:`Align the D layer. It brings the corner to its edge and completes ${target.slot} along with the cross.`});
 }else if(result.kind!=='none'){
  let covered=result.evidence.block?.start??result.evidence.pairStart??0;
  const cornerAt=frames.findIndex((_,i)=>allFrom(frames,i,f=>f.cornerSolved));
  const edgeAt=frames.findIndex((_,i)=>allFrom(frames,i,f=>f.edgeSolved));
  const pairedAt=frames.findIndex((_,i)=>allFrom(frames,i,f=>f.pair));
  const insertedAt=Math.max(cornerAt,edgeAt);result.evidence.arrivals={cornerAt,edgeAt,pairedAt,insertedAt};
  if(cornerAt<edgeAt){
   if(cornerAt>covered)result.steps.push({moves:moves.slice(covered,cornerAt).join(' '),text:`Place the ${cornerName} corner at ${frames[cornerAt].cornerPosition}, white down${result.evidence.block?', carrying its attached cross edge with it':''}. Its edge is then at ${frames[cornerAt].edgePosition}.`});
   covered=Math.max(covered,cornerAt);
   if(edgeAt>covered)result.steps.push({moves:moves.slice(covered,edgeAt).join(' '),text:`Insert the ${title} edge into ${target.slot} while keeping that corner solved. Planning around the fixed corner is what connects the cross work to this pair.`});
  }else if(edgeAt<cornerAt){
   if(edgeAt>covered)result.steps.push({moves:moves.slice(covered,edgeAt).join(' '),text:`Place the ${title} edge in ${target.slot} first. It becomes the fixed target for the incoming corner.`});
   covered=Math.max(covered,edgeAt);
   if(cornerAt>covered)result.steps.push({moves:moves.slice(covered,cornerAt).join(' '),text:`Bring the corner from ${frames[covered].cornerPosition} to ${frames[cornerAt].cornerPosition}, white down${result.evidence.block?', preserving its cross-edge block':''}. The matching edge stays solved while the corner arrives.`});
  }else{
   if(pairedAt>covered&&pairedAt<insertedAt){result.steps.push({moves:moves.slice(covered,pairedAt).join(' '),text:`Join the ${title} edge to the corner${result.evidence.block?' while preserving the original cross-edge block':''}. This creates a larger unit to carry into position.`});covered=pairedAt;}
   if(insertedAt>covered)result.steps.push({moves:moves.slice(covered,insertedAt).join(' '),text:`Carry the connected pair into ${target.slot}: the corner ends at ${frames[insertedAt].cornerPosition} and the edge at ${frames[insertedAt].edgePosition}. Account for the remaining cross edges without splitting this unit.`});
  }
  if(insertedAt<last)result.steps.push({moves:moves.slice(insertedAt).join(' '),text:'Finish the remaining cross edges while preserving this solved pair.'});
 }
 return result;
}
export function inspectionHints(scramble,solution,requiredPairs){
 if(!requiredPairs)return {hints:[],frame:`${solution.rotation} · ${solution.front} front`};
 const setup=[scramble,solution.rotation].join(' '),moves=solution.alg?solution.alg.split(' '):[],boards=[board(setup)];
 for(let i=1;i<=moves.length;i++)boards.push(board([setup,...moves.slice(0,i)].join(' ')));
 const center=face=>boards[0].centers.get(normals[face].join(','));
 const targets=solution.slots.slice(0,requiredPairs).map(slot=>({slot,colors:[...slot].map(center)}));
 return {frame:`Positions below are after ${solution.rotation}, before any face turns (${solution.front.toLowerCase()} front).`,hints:targets.map(target=>explainTarget(target,boards.map(b=>state(b,target)),moves))};
}
