import {apply,buildTables,solve} from './solver.js';
import {normalizeScramble,orientSolution,rotationKey,compareSolutions,compareOrientedSolutions} from './orientation.js';
let tables;
onmessage=({data})=>{try{const s=apply(normalizeScramble(data.scramble));tables??=buildTables(p=>postMessage({type:'progress',...p}));for(let pairs=0;pairs<=2;pairs++){const result=solve(s,pairs,tables,{progress:p=>postMessage({type:'progress',...p}),solutionKey:rotationKey,compareSolutions,rankAll:true});result.solutions=result.solutions.map(orientSolution).sort(compareOrientedSolutions);postMessage({type:'result',...result});}postMessage({type:'done'});}catch(e){postMessage({type:'error',message:e.message});}};
