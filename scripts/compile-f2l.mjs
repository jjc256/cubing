import fs from 'node:fs';
import {apply,solved} from '../dist/solver.js';
const inverseYaw={U:'U',D:'D',R:'B',B:'L',L:'F',F:'R'};
function flatten(alg){let frame={U:'U',D:'D',R:'R',L:'L',F:'F',B:'B'},out=[];for(const t of alg.split(' ')){if(t[0]==='y'){for(let k=0;k<(t.endsWith('2')?2:t.endsWith("'")?3:1);k++){const previous=frame;frame=Object.fromEntries(Object.keys(previous).map(f=>[f,previous[inverseYaw[f]]]));}}else out.push(frame[t[0]]+t.slice(1));}return out.join(' ');}
const source=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),entries=[],seen=new Set();
for(const item of source){const alg=flatten(item.alg),s=apply(alg),id=item.slot+':'+alg;if(seen.has(id)||!s.slice(0,4).every((v,i)=>v===solved()[i]))continue;seen.add(id);// Advanced cases keep the occupied FR slot as an anchor; their target
// cycles BR, BL, FL for each group of three. The tab is a yaw frame,
// not the target pair. Basic cases target FR in the default frame.
const baseSlot=item.case.startsWith('AF2L')?[3,2,1][(Number(item.case.match(/ (\d+)/)[1])-1)%3]:0;
const targetSlot=(baseSlot+item.slot)%4;
entries.push({case:item.case,slot:targetSlot,sourceOrientation:item.slot,alg});}
const collection={sources:['https://speedcubedb.com/a/3x3/F2L','https://speedcubedb.com/a/3x3/AdvancedF2L'],retrieved:'2026-10-15',notation:'Face turns; source y rotations are flattened into a fixed frame.',entries};
fs.writeFileSync(new URL('../dist/f2l-cases.json',import.meta.url),JSON.stringify(collection));console.log(entries.length,new Set(entries.map(e=>e.case)).size,fs.statSync(new URL('../dist/f2l-cases.json',import.meta.url)).size);
