// Cubie positions follow UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR;
// corners: URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB. Orientation is Kociemba's convention.
export const names=['U','U2',"U'",'R','R2',"R'",'F','F2',"F'",'D','D2',"D'",'L','L2',"L'",'B','B2',"B'"];
const ep=[ [3,0,1,2,4,5,6,7,8,9,10,11], [8,1,2,3,11,5,6,7,4,9,10,0], [0,9,2,3,4,8,6,7,1,5,10,11], [0,1,2,3,5,6,7,4,8,9,10,11], [0,1,10,3,4,5,9,7,8,2,6,11], [0,1,2,11,4,5,6,10,8,9,3,7] ];
const cp=[ [3,0,1,2,4,5,6,7], [4,1,2,0,7,5,6,3], [1,5,2,3,0,4,6,7], [0,1,2,3,5,6,7,4], [0,2,6,3,4,1,5,7], [0,1,3,7,4,5,2,6] ];
const co=[ [0,0,0,0,0,0,0,0], [2,0,0,1,1,0,0,2], [1,2,0,0,2,1,0,0], [0,0,0,0,0,0,0,0], [0,1,2,0,0,2,1,0], [0,0,1,2,0,0,2,1] ];
export const E=Array.from({length:18},()=>new Uint8Array(24)), C=Array.from({length:18},()=>new Uint8Array(24));
for(let f=0;f<6;f++) for(let s=0;s<24;s++) {
 let e=s,c=s;
 for(let p=0;p<3;p++) {
  const de=ep[f].indexOf(e>>1); e=de*2+((e&1)^((f===2||f===5)&&[1,3,5,7,8,9,10,11].includes(de)&&ep[f][de]!==de?1:0));
  const dc=cp[f].indexOf(Math.floor(c/3)); c=dc*3+(c%3+co[f][dc])%3;
  E[f*3+p][s]=e; C[f*3+p][s]=c;
 }
}
// F/B flip precisely the four affected edges (the condition above restricts to moved edges).
export function solved(){return Uint8Array.from([8,10,12,14,16,18,20,22,12,15,18,21]);}
export function move(state,m,out=new Uint8Array(12)) {for(let i=0;i<8;i++)out[i]=E[m][state[i]];for(let i=8;i<12;i++)out[i]=C[m][state[i]];return out;}
export function parse(text){return text.trim()?text.trim().split(/\s+/).map(x=>{const i=names.indexOf(x);if(i<0)throw Error('Use standard face turns: U R F D L B, with 2 or apostrophe.');return i;}):[];}
export function apply(text){let s=solved();for(const m of parse(text))s=move(s,m);return s;}
export const slots=['FR','FL','BL','BR'];
const subsets=[[0,1,2,3],[0,1,4,8],[1,2,5,9],[2,3,6,10],[3,0,7,11]];
function index(s,ids){return ((s[ids[0]]*24+s[ids[1]])*24+s[ids[2]])*24+s[ids[3]];}
export function buildTables(progress=()=>{}){
 return subsets.map((ids,t)=>{
  progress({phase:'tables',table:t+1,total:5});
  const dist=new Uint8Array(24**4);dist.fill(255);const queue=new Uint32Array(24**4);
  const start=index(solved(),ids);dist[start]=0;queue[0]=start;let tail=1;
  for(let head=0;head<tail;head++){
   let n=queue[head],d=n%24;n=Math.floor(n/24);let c=n%24;n=Math.floor(n/24);let b=n%24,a=Math.floor(n/24),next=dist[queue[head]]+1;
   for(let m=0;m<18;m++){
    const j=((E[m][a]*24+E[m][b])*24+E[m][c])*24+(t?C[m][d]:E[m][d]);
    if(dist[j]===255){dist[j]=next;queue[tail++]=j;}
   }
  }
  return dist;
 });
}
export function goal(s,pairs){if(s[0]!==8||s[1]!==10||s[2]!==12||s[3]!==14)return false;let count=0;for(let p=0;p<4;p++)if(s[p+4]===(p+8)*2&&s[p+8]===(p+4)*3)count++;return count>=pairs;}
export function solve(initial,pairs,tables,{limit=5,progress=()=>{},maxNodes=Infinity}={}){
 if(![0,1,2].includes(pairs))throw Error('Invalid goal');
 const pairDistances=new Uint8Array(4);
 function heuristic(s){const cross=tables[0][index(s,subsets[0])];if(!pairs)return cross;
  for(let i=0;i<4;i++)pairDistances[i]=tables[i+1][index(s,subsets[i+1])];
  // The kth smallest pair bound is admissible for any k solved slots.
  let best=255;if(pairs===1){for(let i=0;i<4;i++)best=Math.min(best,pairDistances[i]);}else{for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)best=Math.min(best,Math.max(pairDistances[i],pairDistances[j]));}
  return Math.max(cross,best);
 }
 const stack=Array.from({length:31},()=>new Uint8Array(12));stack[0].set(initial);const path=[],solutions=[];let nodes=0,aborted=false,depth=heuristic(initial);
 function dfs(level,left,last){
  if(++nodes>maxNodes){aborted=true;return true;}
  const s=stack[level];if(heuristic(s)>left)return false;
  if(left===0){if(goal(s,pairs)){let solvedSlots=slots.filter((_,p)=>s[p+4]===(p+8)*2&&s[p+8]===(p+4)*3);solutions.push({alg:path.map(m=>names[m]).join(' '),slots:solvedSlots});return solutions.length>=limit;}return false;}
  for(let m=0;m<18;m++){
   const face=Math.floor(m/3);if(face===last)continue;
   // Opposite faces commute: retain one order without removing any shortest result.
   if(last>=0&&Math.abs(face-last)===3&&face<last)continue;
   move(s,m,stack[level+1]);path.push(m);const done=dfs(level+1,left-1,face);path.pop();if(done)return true;
  }return false;
 }
 const started=Date.now();for(;depth<=30;depth++){
  progress({phase:'search',pairs,depth,nodes,elapsed:Date.now()-started});
  dfs(0,depth,-1);if(aborted)throw Error('Search budget exceeded; optimality has not been established.');
  if(solutions.length)return {pairs,depth,solutions,nodes,ms:Date.now()-started};
 }throw Error('No solution found');
}
