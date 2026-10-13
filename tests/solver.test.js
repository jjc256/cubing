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
