export const identityFrame=()=>({U:'U',D:'D',R:'R',L:'L',F:'F',B:'B'});
const frames={x:{U:'F',F:'D',D:'B',B:'U',R:'R',L:'L'},y:{U:'U',D:'D',R:'B',B:'L',L:'F',F:'R'},z:{U:'L',L:'D',D:'R',R:'U',F:'F',B:'B'}};
const expansions={r:'x L',l:"x' R",u:'y D',d:"y' U",f:'z B',b:"z' F",M:"x' R L'",E:"y' U D'",S:"z F' B"};
export function flattenNotation(alg,initial=identityFrame()){
 let frame={...initial};const out=[];
 function token(t){if(!/^(?:[URFDLB]w?|[urfdlbMESxyz])(?:2|')?$/.test(t))throw Error('Invalid cube move: '+t);
 const face=t.includes('w')?t[0].toLowerCase():t[0],power=t.endsWith('2')?2:t.endsWith("'")?3:1;
 if(expansions[face]){for(let k=0;k<power;k++)for(const part of expansions[face].split(' '))token(part);}
 else if(frames[face]){for(let k=0;k<power;k++){const previous=frame;frame=Object.fromEntries(Object.keys(previous).map(f=>[f,previous[frames[face][f]]]));}}
 else out.push(frame[face]+t.slice(1));
 }for(const t of alg.trim().split(/\s+/).filter(Boolean))token(t);
 return {alg:out.join(' '),frame};
}
const key=f=>['U','D','R','L','F','B'].map(k=>f[k]).join('');
export function alignFrame(from,to){
 const queue=[{frame:from,alg:''}],seen=new Set([key(from)]);
 for(const current of queue){if(key(current.frame)===key(to))return current.alg;
 for(const turn of ['y',"y'",'y2','x',"x'",'x2','z',"z'",'z2']){const next=flattenNotation(turn,current.frame).frame,id=key(next);if(!seen.has(id)){seen.add(id);queue.push({frame:next,alg:[current.alg,turn].filter(Boolean).join(' ')});}}}
 throw Error('Invalid cube orientation');
}

export function simplifyNotation(alg){
 const stack=[],power=t=>t.endsWith('2')?2:t.endsWith("'")?3:1,base=t=>t.replace(/[2']$/,'');
 for(const token of alg.trim().split(/\s+/).filter(Boolean)){
  if(stack.length&&base(stack.at(-1))===base(token)){const n=(power(stack.pop())+power(token))%4;if(n)stack.push(base(token)+(n===2?'2':n===3?"'":''));}
  else stack.push(token);
 }return stack.join(' ');
}
