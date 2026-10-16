import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildTables,solve,apply,names,move} from '../dist/solver.js';
import {buildF2LCatalog,solveF2L,execute,solvedMask,crossSolved,crossSolvedScramble,inverse} from '../dist/f2l.js';
import {normalizeScramble,stickersFor} from '../dist/orientation.js';
const catalog=buildF2LCatalog(JSON.parse(fs.readFileSync(new URL('../dist/f2l-cases.json',import.meta.url))));console.log('patterns',catalog.size,'per slot',[0,1,2,3].map(i=>[...catalog.keys()].filter(k=>k.startsWith(i+':')).length));
const tables=buildTables();let seed=42;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};let advanced=0,extracted=0;
for(let i=0;i<300;i++){
 const raw=Array.from({length:25},()=>names[Math.floor(rand()*18)]).join(' '),initial=apply(normalizeScramble(raw)),cross=solve(initial,0,tables,{limit:1}).solutions[0].alg;
 const corrected=crossSolvedScramble(raw,cross),state=apply(normalizeScramble(corrected));if(!crossSolved(state))throw Error('cross');
 const result=solveF2L(state,catalog);if(solvedMask(execute(state,result.alg))!==15)throw Error('bad final');advanced+=result.steps.filter(s=>s.collection==='AdvancedF2L').length;extracted+=result.steps.filter(s=>s.extraction).length;
 const whiteCross=stickersFor(corrected).filter(s=>s.p[1]===1&&Math.abs(s.p[0])+Math.abs(s.p[2])===1&&s.n[1]===1);assert.equal(whiteCross.length,4);assert.ok(whiteCross.every(s=>s.color==='U'));
 const stickers=stickersFor(corrected+' z2 '+result.alg),centers=stickers.filter(s=>s.p.filter(v=>v!==0).length===1);for(const sticker of stickers.filter(s=>s.p[1]<=0)){const center=centers.find(c=>c.n.every((v,j)=>v===sticker.n[j]));assert.equal(sticker.color,center.color);}
 let current=state;assert.equal(result.steps.length,4);for(const step of result.steps){assert.deepEqual(execute(state,step.before),current);const locked=solvedMask(current);current=execute(current,step.alg);assert.ok(crossSolved(current));assert.equal(solvedMask(current)&locked,locked);}
}
console.log('300 random corrected states solved',advanced,'advanced algorithms',extracted,'extractions');

assert.ok(advanced>0);assert.ok(extracted>0);
const data=JSON.parse(fs.readFileSync(new URL('../dist/f2l-cases.json',import.meta.url)));assert.equal(new Set(data.entries.map(e=>e.case)).size,95);for(const e of data.entries)assert.ok(crossSolved(apply(e.alg)));
const messages=[];globalThis.self=globalThis;globalThis.postMessage=m=>messages.push(m);globalThis.fetch=async()=>({ok:true,json:async()=>data});
await import('../dist/f2l-worker.js');await self.onmessage({data:{rawScramble:"R U F2 B' D L2 U2 R'"}});const result=messages.find(m=>m.type==='result');assert.ok(result,JSON.stringify(messages));assert.equal(solvedMask(execute(apply(normalizeScramble(result.scramble)),result.steps.map(s=>s.alg).join(' '))),15);console.log('F2L worker integration passed.');

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
assert.ok(crossSolved(start));assert.equal(plan.steps[0].slot,'FR');assert.equal(plan.steps[0].case,'AF2L 6a');assert.equal(plan.steps[0].extraction,'');
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
