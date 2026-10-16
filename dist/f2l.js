import {flattenNotation,identityFrame,alignFrame} from './notation.js';
import {apply,move,parse,solved} from './solver.js';
import {normalizeScramble} from './orientation.js';
export const slotNames=['FR','FL','BL','BR'];
const yaw={U:'U',D:'D',R:'F',F:'L',L:'B',B:'R'};
export const inverse=alg=>alg.trim()?alg.trim().split(/\s+/).reverse().map(t=>t.endsWith('2')?t:t.endsWith("'")?t.slice(0,-1):t+"'").join(' '):'';
export function execute(state,alg){for(const m of parse(alg))state=move(state,m);return state;}
export const crossSolved=s=>s.slice(0,4).every((v,i)=>v===solved()[i]);
export function solvedMask(s){let mask=0;for(let p=0;p<4;p++)if(s[p+4]===(p+8)*2&&s[p+8]===(p+4)*3)mask|=1<<p;return mask;}
const fingerprint=(s,p)=>`${p}:${s[p+4]}:${s[p+8]}`;
const rotate=alg=>alg.split(' ').map(t=>yaw[t[0]]+t.slice(1)).join(' ');
const turns=alg=>alg.trim()?alg.trim().split(/\s+/).length:0;
function simplify(alg){const stack=[];for(const t of alg.trim().split(/\s+/).filter(Boolean)){if(stack.length&&stack.at(-1)[0]===t[0]){const p=stack.pop(),power=x=>x.endsWith('2')?2:x.endsWith("'")?3:1,n=(power(p)+power(t))%4;if(n)stack.push(t[0]+(n===2?'2':n===3?"'":''));}else stack.push(t);}return stack.join(' ');}
const score=alg=>turns(alg)*100+alg.split(' ').reduce((n,t)=>n+(t[0]==='B'?2:t[0]==='L'?1:0),0);
export function buildF2LCatalog(data){
 const patterns=new Map(),seen=new Map();
 for(const entry of data.entries){
  let rotated=entry.alg;
  for(let orientation=0;orientation<4;orientation++){
   const slot=(entry.slot+orientation)%4;
   for(const auf of ['', 'U','U2',"U'"]){
    const alg=simplify([auf,rotated].join(' ')),id=entry.case+':'+slot+':'+alg+':'+orientation;const rank=entry.rank??0;if(seen.has(id)&&seen.get(id)<=rank)continue;seen.set(id,rank);
    const source=apply(inverse(alg));if(!crossSolved(source))throw Error('Catalog formula changes the cross.');
    if(solvedMask(source)&(1<<slot))continue;
    const preserved=solvedMask(apply(alg)),caseName=entry.case,collection=caseName.startsWith('AF2L')?'AdvancedF2L':'F2L';
    const candidate={slot,alg,preserved,sourceAlg:entry.sourceAlg||entry.alg,sourceYaw:orientation,auf,rank:entry.rank??0,case:caseName,collection,url:`https://speedcubedb.com/a/3x3/${collection}/${encodeURIComponent(caseName.replaceAll(' ','_'))}`,score:score(alg)};
    const key=fingerprint(source,slot);if(!patterns.has(key))patterns.set(key,[]);patterns.get(key).push(candidate);
   }rotated=rotate(rotated);
  }
 }
 for(const list of patterns.values())list.sort((a,b)=>a.rank-b.rank||Math.min(a.sourceYaw,4-a.sourceYaw)-Math.min(b.sourceYaw,4-b.sourceYaw)||a.score-b.score||a.case.localeCompare(b.case));
 return patterns;
}
function direct(state,slot,locked,catalog){
 for(const entry of catalog.get(fingerprint(state,slot))||[]){
  if((entry.preserved&locked)!==locked)continue;
  const after=execute(state,entry.alg);
  if(crossSolved(after)&&(solvedMask(after)&locked)===locked&&(solvedMask(after)&(1<<slot)))return {...entry,after};
 }return null;
}
const extracts=Array.from({length:4},(_,p)=>{
 let a="R U R'",b="R U' R'";for(let r=0;r<p;r++){a=rotate(a);b=rotate(b);}return [a,b];
});
function withExtraction(state,target,locked,catalog){
 const seen=new Set();
 function search(current,prefix,depth){
  const found=direct(current,target,locked,catalog);if(found)return {...found,alg:simplify([prefix,found.alg].join(' ')),extraction:prefix};
  if(!depth)return null;
  const visit=fingerprint(current,target)+':'+depth;if(seen.has(visit))return null;seen.add(visit);
  const corner=Math.floor(current[8+target]/3)-4,edge=Math.floor(current[4+target]/2)-8;
  for(const slot of new Set([corner,edge].filter(p=>p>=0&&p<4)))for(const u of ['', 'U','U2',"U'"])for(const extraction of extracts[slot]){
   const setup=simplify([u,extraction].join(' ')),after=execute(current,setup);
   if(!crossSolved(after)||(solvedMask(after)&locked)!==locked)continue;
   const answer=search(after,[prefix,setup].filter(Boolean).join(' '),depth-1);if(answer)return answer;
  }return null;
 }
 return search(state,'',3);
}
export function solveF2L(initial,catalog){
 if(!crossSolved(initial))throw Error('The white cross must be solved before F2L.');
 let state=initial,prior='';const steps=[],recorded=new Set();
 while(recorded.size<4){
  const locked=solvedMask(state);
  for(let p=0;p<4;p++)if((locked&(1<<p))&&!recorded.has(p)){steps.push({slot:slotNames[p],alg:'',before:prior,alreadySolved:true,solvedByEarlier:!!prior});recorded.add(p);}
  if(recorded.size===4)break;
  let best;
  for(let p=0;p<4;p++)if(!recorded.has(p)){const answer=direct(state,p,locked,catalog);if(answer&&(!best||answer.score<best.score))best=answer;}
  if(!best)for(let p=0;p<4&&!best;p++)if(!recorded.has(p))best=withExtraction(state,p,locked,catalog);
  if(!best)throw Error('No cross-preserving insertion was found. Generate another state.');
  const verified=execute(state,best.alg);if(!crossSolved(verified)||(solvedMask(verified)&locked)!==locked||!(solvedMask(verified)&(1<<best.slot)))throw Error('Insertion verification failed.');
  steps.push({slot:slotNames[best.slot],alg:best.alg,before:prior,case:best.case,collection:best.collection,url:best.url,sourceAlg:best.sourceAlg,sourceYaw:best.sourceYaw,auf:best.auf,extraction:best.extraction||''});recorded.add(best.slot);
  prior=[prior,best.alg].filter(Boolean).join(' ');state=verified;
 }
 return {steps,alg:prior};
}
export function crossSolvedScramble(raw,correction){return simplify([raw,normalizeScramble(correction)].filter(Boolean).join(' '));}

// Keep the source execution intact; only the setup changes with the current grip.
export function presentF2L(plan){
 let frame=identityFrame(),prior='';const steps=[];
 for(const step of plan.steps){
  if(!step.alg){steps.push({...step,before:prior});continue;}
  const setup=[];
  if(step.extraction){setup.push(alignFrame(frame,identityFrame()),step.extraction);frame=identityFrame();}
  const desired=flattenNotation(["","y'",'y2','y'][step.sourceYaw]).frame;
  setup.push(alignFrame(frame,desired),step.auf);frame=desired;
  const setupAlg=setup.filter(Boolean).join(' '),alg=[setupAlg,step.sourceAlg].filter(Boolean).join(' ');
  frame=flattenNotation(step.sourceAlg,frame).frame;
  steps.push({...step,fixedAlg:step.alg,before:prior,setup:setupAlg,formula:step.sourceAlg,alg});
  prior=[prior,alg].filter(Boolean).join(' ');
 }return {steps,alg:prior};
}
