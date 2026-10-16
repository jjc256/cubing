import fs from 'node:fs';
import {apply,solved} from '../dist/solver.js';
const frames={
 x:{U:'F',F:'D',D:'B',B:'U',R:'R',L:'L'},
 y:{U:'U',D:'D',R:'B',B:'L',L:'F',F:'R'},
 z:{U:'L',L:'D',D:'R',R:'U',F:'F',B:'B'}
};
const expansions={r:"x L",l:"x' R",u:"y D",d:"y' U",f:"z B",b:"z' F",M:"x' R L'",E:"y' U D'",S:"z F' B"};
function flatten(alg){let frame={U:'U',D:'D',R:'R',L:'L',F:'F',B:'B'},out=[];
 function token(t){const face=t.includes('w')?t[0].toLowerCase():t[0],power=t.endsWith('2')?2:t.endsWith("'")?3:1;
  if(expansions[face]){for(let k=0;k<power;k++)for(const part of expansions[face].split(' '))token(part);}
  else if(frames[face]){for(let k=0;k<power;k++){const previous=frame;frame=Object.fromEntries(Object.keys(previous).map(f=>[f,previous[frames[face][f]]]));}}
  else out.push(frame[face]+t.slice(1));
 }for(const t of alg.split(' '))token(t);return out.join(' ');
}
const source=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),entries=[],seen=new Set();
for(const item of source){const alg=flatten(item.alg),s=apply(alg),id=item.case+':'+item.slot+':'+alg;if(seen.has(id)||!s.slice(0,4).every((v,i)=>v===solved()[i]))continue;seen.add(id);// Advanced cases keep the occupied FR slot as an anchor; their target
// cycles BR, BL, FL for each group of three. The tab is a yaw frame,
// not the target pair. Basic cases target FR in the default frame.
const baseSlot=item.case.startsWith('AF2L')?[3,2,1][(Number(item.case.match(/ (\d+)/)[1])-1)%3]:0;
const targetSlot=(baseSlot+item.slot)%4;
entries.push({case:item.case,slot:targetSlot,sourceOrientation:item.slot,rank:item.rank,sourceAlg:item.alg,alg});}
const collection={sources:['https://speedcubedb.com/a/3x3/F2L','https://speedcubedb.com/a/3x3/AdvancedF2L'],retrieved:'2026-10-15',notation:'Face turns; source y rotations are flattened into a fixed frame.',entries};
fs.writeFileSync(new URL('../dist/f2l-cases.json',import.meta.url),JSON.stringify(collection));console.log(entries.length,new Set(entries.map(e=>e.case)).size,fs.statSync(new URL('../dist/f2l-cases.json',import.meta.url)).size);
