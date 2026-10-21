import {flattenNotation,alignFrame,identityFrame} from '../dist/notation.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildTables,solve,apply,names,move} from '../dist/solver.js';
import {buildF2LCatalog,solveF2L,execute,solvedMask,crossSolved,crossSolvedScramble,inverse,presentF2L,pairVisibility,f2lOrientation} from '../dist/f2l.js';
import {normalizeScramble,stickersFor} from '../dist/orientation.js';
const catalog=buildF2LCatalog(JSON.parse(fs.readFileSync(new URL('../dist/f2l-cases.json',import.meta.url))));console.log('patterns',catalog.size,'per slot',[0,1,2,3].map(i=>[...catalog.keys()].filter(k=>k.startsWith(i+':')).length));
const tables=buildTables();let seed=42;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};let advanced=0,extracted=0;
for(let i=0;i<300;i++){
 const raw=Array.from({length:25},()=>names[Math.floor(rand()*18)]).join(' '),initial=apply(normalizeScramble(raw)),cross=solve(initial,0,tables,{limit:1}).solutions[0].alg;
 const corrected=crossSolvedScramble(raw,cross),state=apply(normalizeScramble(corrected));if(!crossSolved(state))throw Error('cross');
 const result=solveF2L(state,catalog);if(solvedMask(execute(state,result.alg))!==15)throw Error('bad final');advanced+=result.steps.filter(s=>s.collection==='AdvancedF2L').length;extracted+=result.steps.filter(s=>s.extraction).length;
 const whiteCross=stickersFor(corrected).filter(s=>s.p[1]===1&&Math.abs(s.p[0])+Math.abs(s.p[2])===1&&s.n[1]===1);assert.equal(whiteCross.length,4);assert.ok(whiteCross.every(s=>s.color==='U'));
 const stickers=stickersFor(corrected+' z2 '+result.alg),centers=stickers.filter(s=>s.p.filter(v=>v!==0).length===1);for(const sticker of stickers.filter(s=>s.p[1]<=0)){const center=centers.find(c=>c.n.every((v,j)=>v===sticker.n[j]));assert.equal(sticker.color,center.color);}
 const ergonomic=presentF2L(result);assert.deepEqual(execute(state,flattenNotation(ergonomic.alg).alg),execute(state,result.alg));
 const finalFrame=flattenNotation(ergonomic.alg).frame;
 const ergonomicStickers=stickersFor(corrected+' z2 '+ergonomic.alg+' '+alignFrame(finalFrame,identityFrame()));
 const signature=ss=>ss.map(s=>[...s.p,...s.n,s.color].join(',')).sort();assert.deepEqual(signature(ergonomicStickers),signature(stickers));
 for(let i=0;i<result.steps.length;i++){assert.deepEqual(execute(state,flattenNotation(ergonomic.steps[i].before+' '+ergonomic.steps[i].alg).alg),execute(state,result.steps[i].before+' '+result.steps[i].alg));if(result.steps[i].alg)assert.equal(ergonomic.steps[i].formula,result.steps[i].sourceAlg);}
 let current=state;assert.equal(result.steps.length,4);for(const step of result.steps){assert.deepEqual(execute(state,step.before),current);const locked=solvedMask(current);current=execute(current,step.alg);assert.ok(crossSolved(current));assert.equal(solvedMask(current)&locked,locked);}
}
console.log('300 random corrected states solved',advanced,'advanced algorithms',extracted,'extractions');

assert.ok(advanced>0);assert.ok(extracted>0);
const data=JSON.parse(fs.readFileSync(new URL('../dist/f2l-cases.json',import.meta.url)));assert.equal(new Set(data.entries.map(e=>e.case)).size,95);for(const e of data.entries)assert.ok(crossSolved(apply(e.alg)));
const messages=[];globalThis.self=globalThis;globalThis.postMessage=m=>messages.push(m);globalThis.fetch=async()=>({ok:true,json:async()=>data});
await import('../dist/f2l-worker.js');await self.onmessage({data:{rawScramble:"R U F2 B' D L2 U2 R'"}});const result=messages.find(m=>m.type==='result');assert.ok(result,JSON.stringify(messages));assert.equal(solvedMask(execute(f2lOrientation(result.scramble,result.yaw).state,flattenNotation(result.steps.map(s=>s.alg).join(' ')).alg)),15);console.log('F2L worker integration passed.');

// Regression: source tabs must retain their target slots, not all become FR.
assert.deepEqual([...new Set(data.entries.map(e=>e.slot))].sort(),[0,1,2,3]);
for(const [slot,alg] of [[0,"U R U' R'"],[1,"U F U' F'"],[2,"U L U' L'"],[3,"U B U' B'"]])assert.ok(data.entries.some(e=>e.case==='F2L 1'&&e.slot===slot&&e.alg===alg));
for(const list of catalog.values())for(const entry of list){assert.ok(!entry.url.includes('%20'));assert.ok(entry.url.includes(entry.case.replaceAll(' ','_')));}
// Check side alignment too: white stickers alone do not prove a solved cross.
const physical=stickersFor(result.scramble),centers=physical.filter(s=>s.p.filter(v=>v!==0).length===1);
for(const sticker of physical.filter(s=>s.p[1]===1&&Math.abs(s.p[0])+Math.abs(s.p[2])===1)){const center=centers.find(c=>c.n.every((v,i)=>v===sticker.n[i]));assert.equal(sticker.color,center.color);}
console.log('Source slot mapping, underscore links and full cross sticker alignment passed.');

// AF2L tabs are viewing frames. AF2L 25 targets BR in its default
// frame, not FR. Its pair is trapped in the neighboring F2L slot.
for(const entry of data.entries.filter(e=>e.case==='AF2L 25')){
 const source=apply(inverse(entry.alg)),p=entry.slot;
 assert.equal(p,(3+entry.sourceOrientation)%4);
 assert.equal(source[4+p],17+2*((p+1)%4));
 assert.equal(source[8+p],12+3*((p+1)%4));
}
// User-reported scramble: the old map manufactured an AF2L 25
// green/orange match after unnecessary extractions.
const reported="L B' R' F D B D2 R' U R2 F R2 U2 B' D2 B' R2 F2 R2 U2 L2 D L R2 F L' B R'";
const start=apply(normalizeScramble(reported)),plan=solveF2L(start,catalog);
assert.ok(crossSolved(start));assert.equal(plan.steps[0].extraction,'');
assert.notEqual(plan.steps.find(s=>s.slot==='FR').case,'AF2L 25');
for(const step of plan.steps){const before=execute(start,step.before),after=execute(before,step.alg);assert.ok(crossSolved(after));assert.equal(solvedMask(after)&solvedMask(before),solvedMask(before));}
const replay=stickersFor(reported+' z2 '+plan.alg),faceCenters=replay.filter(s=>s.p.filter(v=>v!==0).length===1);
for(const sticker of replay.filter(s=>s.p[1]<=0)){const center=faceCenters.find(c=>c.n.every((v,i)=>v===sticker.n[i]));assert.equal(sticker.color,center.color);}
console.log('AF2L 25 intended target and reported-scramble physical replay passed.');

// All source alternatives for a case must describe the same intended
// pair state, after undoing the tab's viewing frame and allowing AUF.
const yaw={U:'U',D:'D',R:'F',F:'L',L:'B',B:'R'};
const rotate=a=>a.split(' ').map(t=>yaw[t[0]]+t.slice(1)).join(' ');
const orbit=(state,p)=>{const keys=[];for(let i=0;i<4;i++){keys.push(`${state[p+4]}:${state[p+8]}`);state=move(state,0);}return keys.sort()[0];};
for(const name of new Set(data.entries.map(e=>e.case))){
 const keys=new Set();for(const entry of data.entries.filter(e=>e.case===name)){
  let alg=entry.alg,p=entry.slot;for(let i=0;i<(4-entry.sourceOrientation)%4;i++){alg=rotate(alg);p=(p+1)%4;}
  keys.add(orbit(apply(inverse(alg)),p));
 }assert.equal(keys.size,1,`${name}: source alternatives must match the same target pair`);
}
console.log('All 95 cases agree on intended pair across source alternatives and viewing frames.');

// Prefer the first listed variant even when a later one is shorter.
const preferred="U R' F R F2 U F",shorter="R' F R F'";
const ranked=buildF2LCatalog({entries:[{case:'F2L 1',slot:0,alg:preferred,rank:0},{case:'F2L 1',slot:0,alg:shorter,rank:1}]});
const preferredPlan=solveF2L(apply(inverse(preferred)),ranked);assert.equal(preferredPlan.steps.find(s=>s.slot==='FR').alg,preferred);
for(const list of catalog.values())for(let i=1;i<list.length;i++)assert.ok(list[i-1].rank<=list[i].rank);
for(const name of new Set(data.entries.map(e=>e.case)))assert.ok(data.entries.some(e=>e.case===name&&e.rank===0),`${name} has its first listed algorithm`);
assert.ok(data.entries.some(e=>e.rank===0&&/[MESurfdlb]/.test(e.sourceAlg)));
console.log('Source ordering, first-listed coverage, and slice/wide first variants passed.');

const ergonomicScramble="L2 U' L F B R F2 D F D2 R2 U2 F2 U2 B' R2 B2 D2 B D2 U L D F2 B' D2 L R2";
const ergonomicPlan=presentF2L(solveF2L(apply(normalizeScramble(ergonomicScramble)),catalog));
assert.equal(ergonomicPlan.steps[0].case,'F2L 13');assert.equal(ergonomicPlan.steps[0].formula,"d L' U L U' L' U' L");assert.equal(ergonomicPlan.steps[0].setup,'U2');
console.log('Original ergonomic formulas, grip changes, slice/wide playback, and sequential reorientation passed.');

// Buried back corners are harder to recognize than back edges; top-back
// pieces remain visible from above. Measure relative to the actual grip.
const hidden=apply('');hidden[8]=18;hidden[4]=20;
assert.equal(pairVisibility(hidden,0).cost,67);
assert.equal(pairVisibility(hidden,0,flattenNotation('y2').frame).cost,7);
hidden[8]=6;hidden[4]=6;assert.equal(pairVisibility(hidden,0).cost,0);
const visibilityFixtures=[
 ["U D L2 B2 D2 F R F B' F2 D2 U2 R2 D F2 R F2 U L2 B' R' F'",'BL'],
 ["L2 D2 B' D2 B2 D2 F D2 B L' R F L' F' R' U2 L' F' B2 R'",'BR']
];
for(const [scramble,expected] of visibilityFixtures){const state=apply(normalizeScramble(scramble)),answer=solveF2L(state,catalog),first=answer.steps.find(s=>s.alg);assert.equal(first.slot,expected);assert.equal(first.recognition.cost,0);}
// Independent exhaustive enumeration verifies real lookahead, not simply
// greedy current visibility. Every branch in this fixture has a direct case.
const lookaheadState=apply(normalizeScramble("L' D2 F' L' F' L' B L U' F' D L2 U' D2 R' D B' F' R' U R U F L2 B"));
function enumerateOrders(state,path=[]){
 const locked=solvedMask(state);if(locked===15)return [{path,cost:0}];
 const frame=flattenNotation(presentF2L({steps:path}).alg).frame,out=[];
 for(let p=0;p<4;p++)if(!(locked&(1<<p))){
  const entry=(catalog.get(`${p}:${state[p+4]}:${state[p+8]}`)||[]).find(e=>(e.preserved&locked)===locked);assert.ok(entry,'fixture requires direct insertion for every branch');
  for(const child of enumerateOrders(execute(state,entry.alg),[...path,entry]))out.push({path:child.path,cost:pairVisibility(state,p,frame).cost+.5*child.cost});
 }return out;
}
const orders=enumerateOrders(lookaheadState),lookaheadPlan=solveF2L(lookaheadState,catalog);
assert.equal(lookaheadPlan.lookaheadCost,Math.min(...orders.map(o=>o.cost)));
const visibleRoots=new Set(orders.filter(o=>pairVisibility(lookaheadState,o.path[0].slot).cost===0).map(o=>o.path[0].slot));assert.ok(visibleRoots.size>1);
const rootCosts=[...visibleRoots].map(p=>Math.min(...orders.filter(o=>o.path[0].slot===p).map(o=>o.cost)));assert.ok(Math.max(...rootCosts)>Math.min(...rootCosts));
console.log('Back-piece visibility, current-grip orientation, easier-pair priority and exhaustive full-order lookahead passed.');

// A uniform draw selects each viable unsolved first pair, including hidden
// pairs. Each selected branch still uses visibility lookahead thereafter.
const randomizedFirst=new Set();
for(let i=0;i<4;i++){
 const result=solveF2L(lookaheadState,catalog,{randomFirst:true,random:()=> (i+.5)/4});
 const first=result.steps.find(s=>s.alg);randomizedFirst.add(first.slot);
 assert.equal(first.slot,['FR','FL','BL','BR'][i]);
 assert.equal(solvedMask(execute(lookaheadState,result.alg)),15);
 const rootIndex=i,expected=Math.min(...orders.filter(o=>o.path[0].slot===rootIndex).map(o=>o.cost));assert.equal(result.lookaheadCost,expected);
 const ergonomic=presentF2L(result);assert.deepEqual(execute(lookaheadState,flattenNotation(ergonomic.alg).alg),execute(lookaheadState,result.alg));
}
assert.equal(randomizedFirst.size,4);
let draws=0;
assert.equal(solveF2L(apply(''),catalog,{randomFirst:true,random:()=>{draws++;return 0;}}).steps.filter(s=>s.alg).length,0);assert.equal(draws,0);
const onePair=apply(inverse("U R U' R'"));
assert.equal(solveF2L(onePair,catalog,{randomFirst:true,random:()=>.999}).steps.find(s=>s.alg).slot,'FR');
console.log('Uniform first-pair choice, solved-pair exclusion, complete replay, and remaining-pair lookahead passed.');

// Each starting yaw gets its own local solving frame; the source algorithm
// does not undo a cosmetic rotation. Replay real stickers in all four frames.
for(let yaw=0;yaw<4;yaw++){
 const oriented=f2lOrientation(reported,yaw),plan=presentF2L(solveF2L(oriented.state,catalog,{randomFirst:true,random:()=>.5}));
 assert.ok(crossSolved(oriented.state));assert.equal(solvedMask(execute(oriented.state,flattenNotation(plan.alg).alg)),15);
 const endFrame=flattenNotation(plan.alg).frame,ss=stickersFor(reported+' '+oriented.rotation+' '+plan.alg+' '+alignFrame(endFrame,identityFrame())),centers=ss.filter(s=>s.p.filter(v=>v!==0).length===1);
 for(const sticker of ss.filter(s=>s.p[1]<=0)){const center=centers.find(c=>c.n.every((v,i)=>v===sticker.n[i]));assert.equal(sticker.color,center.color);}
 const start=stickersFor(reported+' '+oriented.rotation),names={U:'White',D:'Yellow',F:'Green',B:'Blue',R:'Red',L:'Orange'};
 const front=start.find(s=>s.p.join(',')==='0,0,1'&&s.n.join(',')==='0,0,1');assert.equal(names[front.color],oriented.front);
 const right=start.find(s=>s.p.join(',')==='1,0,0'&&s.n.join(',')==='1,0,0');assert.deepEqual(oriented.pairColors.FR.toLowerCase().split(' / ').sort(),[names[front.color],names[right.color]].map(s=>s.toLowerCase()).sort());
}
console.log('All four starting fronts, physical F2L replay, and orientation-dependent pair colors passed.');
