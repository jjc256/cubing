import {apply,buildTables,buildExtendedTables,buildDeepTables,solve} from './solver.js';
import {normalizeScramble,orientSolution,rotationKey,compareSolutions,compareOrientedSolutions} from './orientation.js';
let tables,extendedTables;
onmessage=({data})=>{
 try{
  const goals=data.goals??[0,1,2];
  if(!Array.isArray(goals)||!goals.length||goals.some(p=>!Number.isInteger(p)||p<0||p>4))throw Error('Invalid goals');
  const s=apply(normalizeScramble(data.scramble));
  tables??=buildTables(p=>postMessage({type:'progress',...p}));
  for(const pairs of [...new Set(goals)]){
   if(pairs>=3&&!extendedTables){extendedTables=buildExtendedTables(p=>postMessage({type:'progress',pairs,...p}));extendedTables.blocks=buildDeepTables(p=>postMessage({type:'progress',pairs,...p}));}
   const result=solve(s,pairs,tables,{progress:p=>postMessage({type:'progress',...p}),solutionKey:rotationKey,compareSolutions,rankAll:true,extendedTables:pairs>=3?extendedTables:undefined});
   result.solutions=result.solutions.map(orientSolution).sort(compareOrientedSolutions);postMessage({type:'result',...result});
  }postMessage({type:'done'});
 }catch(e){postMessage({type:'error',message:e.message});}
};
