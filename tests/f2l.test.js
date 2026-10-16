import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildTables,solve,apply,names} from '../dist/solver.js';
import {buildF2LCatalog,solveF2L,execute,solvedMask,crossSolved,crossSolvedScramble} from '../dist/f2l.js';
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
