import {apply,buildTables,solve} from './solver.js';
import {normalizeScramble} from './orientation.js';
import {buildF2LCatalog,crossSolvedScramble,solveF2L,presentF2L} from './f2l.js';
let resources;
self.onmessage=async({data})=>{try{
 postMessage({type:'status',message:'Preparing F2L…'});
 resources??=Promise.all([fetch('f2l-cases.json').then(r=>{if(!r.ok)throw Error('Could not load F2L cases.');return r.json();}).then(buildF2LCatalog),Promise.resolve().then(buildTables)]);
 const [catalog,tables]=await resources;
 const result=solve(apply(normalizeScramble(data.rawScramble)),0,tables,{limit:1});
 const correction=result.solutions[0].alg;
 const scramble=crossSolvedScramble(data.rawScramble,correction);
 const plan=presentF2L(solveF2L(apply(normalizeScramble(scramble)),catalog));
 postMessage({type:'result',scramble,steps:plan.steps});
 }catch(error){postMessage({type:'error',message:error.message});}};
