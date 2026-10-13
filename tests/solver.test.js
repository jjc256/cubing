import assert from 'node:assert/strict';
import {E,C,solved,move,apply,parse,goal,buildTables,solve} from '../dist/solver.js';
for(let f=0;f<6;f++)for(const table of [E,C])for(let s=0;s<24;s++){let n=s;for(let i=0;i<4;i++)n=table[f*3][n];assert.equal(n,s);assert.equal(table[f*3+2][table[f*3][s]],s);assert.equal(table[f*3+1][s],table[f*3][table[f*3][s]]);}
assert.throws(()=>parse('Rw'));assert.throws(()=>parse('R3'));
assert.deepEqual(apply("R U F2 D L' B B' L D' F2 U' R'"),solved());assert.equal(move(solved(),6)[1],19);assert.equal(move(solved(),6)[4],11);assert.equal(move(solved(),6)[8],16);
console.time('tables');const tables=buildTables();console.timeEnd('tables');
function bfs(start,pairs,max){let frontier=[start],seen=new Set([start.join(',')]);for(let depth=0;depth<=max;depth++){const next=[];for(const s of frontier){if(goal(s,pairs))return depth;if(depth===max)continue;for(let m=0;m<18;m++){const n=move(s,m),key=n.join(',');if(!seen.has(key)){seen.add(key);next.push(n);}}}frontier=next;}}
for(const scramble of ['', 'R','F2',"R U F'","D R2 F"]){const s=apply(scramble);for(let pairs=0;pairs<=2;pairs++){const r=solve(s,pairs,tables);assert.equal(r.depth,bfs(s,pairs,3),`${scramble}, ${pairs}`);for(const answer of r.solutions){assert.equal(parse(answer.alg).length,r.depth);let end=s;for(const m of parse(answer.alg))end=move(end,m);assert.ok(goal(end,pairs));}}}
console.log('Move identities, known turns, replay, and independent BFS optimality passed.');
const s=apply("R U2 F' L2 D B2 R2 F U' B L' D2 R' U F2 D' L U2 B' R");for(let pairs=0;pairs<=2;pairs++){const r=solve(s,pairs,tables,{limit:5,maxNodes:100000000,progress:p=>console.log('search',p.pairs,p.depth,p.nodes)});for(const answer of r.solutions){let end=s;for(const m of parse(answer.alg))end=move(end,m);assert.ok(goal(end,pairs));}console.log('Full scramble',pairs,JSON.stringify(r));}
// Independent sticker geometry checks the cube conventions and solved pieces.
const normals={U:[0,1,0],R:[1,0,0],F:[0,0,1],D:[0,-1,0],L:[-1,0,0],B:[0,0,-1]};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function stickerGoal(alg,pairs){let stickers=[];for(const n of Object.values(normals))for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){let p=[...n],axes=[0,1,2].filter(i=>n[i]===0);p[axes[0]]=a;p[axes[1]]=b;stickers.push({p,n:[...n],home:[...n]});}for(const t of alg.trim().split(/\s+/).filter(Boolean)){let axis=normals[t[0]];for(let turn=0;turn<(t.endsWith('2')?2:t.endsWith("'")?3:1);turn++)for(const s of stickers)if(dot(s.p,axis)===1)for(const k of ['p','n']){let c=cross(axis,s[k]),d=dot(axis,s[k]);s[k]=axis.map((v,i)=>v*d-c[i]);}}
const correct=p=>stickers.filter(s=>s.p.every((v,i)=>v===p[i])).every(s=>s.n.every((v,i)=>v===s.home[i]));if(![[1,-1,0],[0,-1,1],[-1,-1,0],[0,-1,-1]].every(correct))return false;let count=0;for(const [x,z] of [[1,1],[-1,1],[-1,-1],[1,-1]])if(correct([x,-1,z])&&correct([x,0,z]))count++;return count>=pairs;}
let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};const {names}=await import('../dist/solver.js');
for(let sample=0;sample<12;sample++){const scramble=Array.from({length:20},()=>names[Math.floor(random()*18)]).join(' ');for(let pairs=0;pairs<=2;pairs++){const r=solve(apply(scramble),pairs,tables,{limit:1,maxNodes:100000000});assert.ok(stickerGoal(scramble+' '+r.solutions[0].alg,pairs));console.log('Geometric replay',sample,pairs,r.depth,r.ms+'ms');}}
console.log('All tests passed.');

import {normalizeScramble,orientSolution,stickersFor,fronts} from '../dist/orientation.js';
assert.equal(normalizeScramble("U R F2 D' L B"),"D L F2 U' R B");
function physicalGoal(alg,pairs){
 const stickers=stickersFor(alg);
 const sticker=(p,n)=>stickers.find(s=>s.p.every((v,i)=>v===p[i])&&s.n.every((v,i)=>v===n[i]));
 const down=[0,-1,0];
 const center=n=>sticker(n,n).color;
 assert.equal(center(down),'U','White center must be on bottom');
 const correct=p=>stickers.filter(s=>s.p.every((v,i)=>v===p[i])).every(s=>s.color===center(s.n));
 if(![[1,-1,0],[0,-1,1],[-1,-1,0],[0,-1,-1]].every(correct))return false;
 let count=0;for(const [x,z]of [[1,1],[-1,1],[-1,-1],[1,-1]])if(correct([x,-1,z])&&correct([x,0,z]))count++;
 return count>=pairs;
}
const solvedTop=stickersFor('');
assert.equal(solvedTop.find(s=>s.p.join()==='0,1,0').color,'U');
assert.equal(solvedTop.find(s=>s.p.join()==='0,0,1').color,'F');
const observedFronts=new Set();
for(let sample=0;sample<16;sample++){
 const scramble=sample===0?'R':Array.from({length:20},()=>names[Math.floor(random()*18)]).join(' ');
 const normalized=normalizeScramble(scramble);
 for(let pairs=0;pairs<=2;pairs++){
  const result=solve(apply(normalized),pairs,tables,{limit:5,maxNodes:100000000});
  if(sample===0)assert.equal(result.depth,bfs(apply(normalized),pairs,3));
  for(const base of result.solutions){
   const oriented=orientSolution(base);observedFronts.add(oriented.front);
   assert.equal(parse(oriented.alg).length,result.depth,'Yaw must preserve HTM');
   assert.ok(stickerGoal(normalized+' '+base.alg,pairs));
   const physical=scramble+' '+oriented.rotation+' '+oriented.alg;
   assert.ok(physicalGoal(physical,pairs),physical);
   const front=stickersFor(physical).find(s=>s.p.join()==='0,0,1').color;
   assert.equal(front,['F','L','B','R'][oriented.yaw]);
  }
 }
}
assert.deepEqual([...observedFronts].sort(),[...fronts].sort());
console.log('White-top scrambling, white-bottom solutions, all four front colors, HTM, and physical replay passed.');

import {rotationKey,compareSolutions,compareOrientedSolutions} from '../dist/orientation.js';
assert.equal(rotationKey("R U F2 L'"),rotationKey("F U L2 B'"),'Yaw equivalents should have one key');
assert.equal(rotationKey("R L2 U F"),rotationKey("L2 R U F"),'Opposite-face ordering should not create duplicates');
assert.notEqual(rotationKey("B' R D F D' L F'"),rotationKey("R' F B D' R D L'"),'Distinct pasted algorithms must remain distinct');
const duplicateFixture=apply("R2 L2 F2 B2");
const raw=solve(duplicateFixture,0,tables,{limit:100});
const unique=solve(duplicateFixture,0,tables,{limit:5,solutionKey:rotationKey,compareSolutions});
assert.equal(unique.depth,raw.depth);
assert.ok(unique.solutions.length<raw.solutions.length,'Fixture must include equivalent results');
assert.equal(unique.solutions.length,new Set(raw.solutions.map(rotationKey)).size,'Deduplicate before filling the result limit');
assert.equal(new Set(unique.solutions.map(rotationKey)).size,unique.solutions.length);
for(let i=1;i<unique.solutions.length;i++)assert.ok(compareSolutions(unique.solutions[i-1],unique.solutions[i])<=0);
// A duplicate class must retain the preferred representative even if found later.
const collapsed=solve(duplicateFixture,0,tables,{limit:5,solutionKey:()=>0,compareSolutions:(a,b)=>a.alg<b.alg?-1:a.alg>b.alg?1:0});
assert.equal(collapsed.solutions.length,1);
assert.equal(collapsed.solutions[0].alg,raw.solutions.map(s=>s.alg).sort()[0]);
for(let sample=0;sample<6;sample++){
 const scramble=Array.from({length:20},()=>names[Math.floor(random()*18)]).join(' ');
 for(let pairs=0;pairs<=2;pairs++){
  const r=solve(apply(normalizeScramble(scramble)),pairs,tables,{limit:5,solutionKey:rotationKey,compareSolutions});
  const display=r.solutions.map(orientSolution);
  assert.equal(new Set(display.map(rotationKey)).size,display.length);
  for(let i=1;i<display.length;i++)assert.ok(compareOrientedSolutions(display[i-1],display[i])<=0);
  for(const answer of display)assert.ok(physicalGoal(scramble+' '+answer.rotation+' '+answer.alg,pairs));
 }
}
console.log('Rotation deduplication, commuting turns, distinct alternatives, representative tiebreaks, and physical replay passed.');

const globallyRanked=solve(duplicateFixture,0,tables,{limit:1,rankAll:true,solutionKey:rotationKey,compareSolutions});
const allRanked=solve(duplicateFixture,0,tables,{limit:100,solutionKey:rotationKey,compareSolutions});
assert.deepEqual(globallyRanked.solutions,[allRanked.solutions[0]],'Rank across the entire optimal depth before applying the limit');
console.log('Global tiebreak ranking before the display limit passed.');
const messages=[];globalThis.onmessage=null;globalThis.postMessage=m=>messages.push(m);
await import('../dist/worker.js');
globalThis.onmessage({data:{scramble:'R2 L2 F2 B2'}});
const results=messages.filter(m=>m.type==='result');assert.equal(results.length,3);assert.equal(messages.at(-1).type,'done');
for(const r of results){assert.equal(new Set(r.solutions.map(rotationKey)).size,r.solutions.length);for(let i=1;i<r.solutions.length;i++)assert.ok(compareOrientedSolutions(r.solutions[i-1],r.solutions[i])<=0);for(const s of r.solutions)assert.ok(physicalGoal('R2 L2 F2 B2 '+s.rotation+' '+s.alg,r.pairs));}
delete globalThis.onmessage;delete globalThis.postMessage;
console.log('Worker integration passed for all three goals.');

import {inspectionHints,connected} from '../dist/inspection.js';
const keyhole=inspectionHints("U' L D L'",{rotation:'z2',front:'Green',slots:['FR'],alg:"R U' R' D"},1).hints[0];
assert.equal(keyhole.kind,'cross-block');
assert.ok(keyhole.notice.includes('DLF')&&keyhole.notice.includes('(DL)')&&keyhole.notice.includes('UF'));
assert.deepEqual(keyhole.evidence.finish,{anchor:0,edgeAt:3,cornerPosition:'DLF',edgePosition:'FR',move:'D',keyhole:true});
assert.ok(keyhole.steps.some(s=>s.moves==="R U' R'"&&s.text.includes('without moving that corner')));
assert.equal(keyhole.steps.at(-1).moves,'D');
const existingPair=inspectionHints('L D',{rotation:'z2',front:'Green',slots:['FR'],alg:"U' R'"},1).hints[0];
assert.equal(existingPair.kind,'existing-pair');
const difficult=inspectionHints('F R B D L',{rotation:'z2',front:'Green',slots:['FR'],alg:"R' U' B' L' F'"},1).hints[0];
assert.equal(difficult.kind,'none');assert.ok(difficult.approach.includes('No simple inspection cue'));
assert.equal(inspectionHints('',{rotation:'z2',front:'Green',slots:[],alg:''},0).hints.length,0);
// Mere adjacency is insufficient: shared sticker orientation must agree.
const model=stickersFor('z2'),corner=model.filter(s=>s.p.join()==='1,-1,1'),edge=model.filter(s=>s.p.join()==='0,-1,1');
assert.ok(connected(corner,edge));
const flipped=edge.map((s,i)=>({...s,n:edge[1-i].n}));assert.equal(connected(corner,flipped),false);
for(const result of results)for(const solution of result.solutions){const inspection=inspectionHints('R2 L2 F2 B2',solution,result.pairs);assert.equal(inspection.hints.length,result.pairs);assert.ok(inspection.hints.every(h=>h.notice&&h.approach));}
for(let sample=0;sample<8;sample++){
 const scramble=Array.from({length:20},()=>names[Math.floor(random()*18)]).join(' ');
 for(let pairs=1;pairs<=2;pairs++){
  const r=solve(apply(normalizeScramble(scramble)),pairs,tables,{limit:3});
  for(const answer of r.solutions){const oriented=orientSolution(answer),hints=inspectionHints(scramble,oriented,pairs);assert.equal(hints.hints.length,pairs);assert.ok(physicalGoal(scramble+' '+oriented.rotation+' '+oriented.alg,pairs));for(const hint of hints.hints){if(hint.evidence.finish?.keyhole)assert.ok(hint.evidence.finish.edgeAt>hint.evidence.finish.anchor);if(hint.kind==='none')assert.equal(hint.steps.length,0);}}
 }
}
console.log('Inspection clues, preserved pair priority, keyhole finish, false-positive rejection, complex-route fallback, and full-scramble integration passed.');

import {buildExtendedTables,buildDeepTables} from '../dist/solver.js';
const extended=buildExtendedTables();extended.blocks=buildDeepTables();
assert.throws(()=>solve(solved(),5,tables));assert.throws(()=>solve(solved(),3.5,tables));
for(const scramble of ['', 'R','F2',"R U F'","D R2 F"]){for(const pairs of [3,4]){const initial=apply(scramble),r=solve(initial,pairs,tables,{extendedTables:extended,limit:5});assert.equal(r.depth,bfs(initial,pairs,3));for(const solution of r.solutions){let end=initial;for(const m of parse(solution.alg))end=move(end,m);assert.ok(goal(end,pairs));}}}
const extendedScramble="R U2 F' L2 D B2 R2 F U' B L' D2 R' U F2 D' L U2 B' R";
let lastDepth=0;
for(const pairs of [3,4]){
 const initial=apply(normalizeScramble(extendedScramble));
 const result=solve(initial,pairs,tables,{extendedTables:extended,limit:1,maxNodes:100000000});assert.ok(result.depth>=lastDepth);lastDepth=result.depth;
 const solution=orientSolution(result.solutions[0]);assert.ok(physicalGoal(extendedScramble+' '+solution.rotation+' '+solution.alg,pairs));assert.ok(solution.slots.length>=pairs);
 const hints=inspectionHints(extendedScramble,solution,pairs);assert.equal(hints.hints.length,pairs);
}
// The Worker exposes larger goals on demand and returns all requested goals.
const extendedMessages=[];globalThis.onmessage=null;globalThis.postMessage=m=>extendedMessages.push(m);
// The imported Worker module retains its handler; reimport with a new URL for this request.
await import('../dist/worker.js?extended-test');globalThis.onmessage({data:{scramble:'R2 L2 F2 B2',goals:[3,4]}});
const extendedResults=extendedMessages.filter(m=>m.type==='result');assert.deepEqual(extendedResults.map(r=>r.pairs),[3,4]);assert.equal(extendedMessages.at(-1).type,'done');
for(const r of extendedResults)for(const solution of r.solutions){assert.ok(physicalGoal('R2 L2 F2 B2 '+solution.rotation+' '+solution.alg,r.pairs));assert.equal(inspectionHints('R2 L2 F2 B2',solution,r.pairs).hints.length,r.pairs);}
delete globalThis.onmessage;delete globalThis.postMessage;
console.log('3/4 X-cross BFS optimality, full-scramble replay, inspection hints, and on-demand Worker integration passed.');
