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
const pairSets=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
const pairSubsets=pairSets.map(([i,j])=>[i+4,j+4,i+8,j+8]);
const deepSubsets=Array.from({length:4},(_,p)=>[p,(p+1)%4,(p+2)%4,p+4,p+8]);
function index(s,ids){return ((s[ids[0]]*24+s[ids[1]])*24+s[ids[2]])*24+s[ids[3]];}
function deepIndex(s,ids){return index(s,ids)*24+s[ids[4]];}
function buildPattern(ids){
 const dist=new Uint8Array(24**4);dist.fill(255);const queue=new Uint32Array(24**4);
 const start=index(solved(),ids);dist[start]=0;queue[0]=start;let tail=1;
 const A=ids[0]>=8?C:E,B=ids[1]>=8?C:E,G=ids[2]>=8?C:E,H=ids[3]>=8?C:E;
 for(let head=0;head<tail;head++){
  let n=queue[head],d=n%24;n=Math.floor(n/24);let c=n%24;n=Math.floor(n/24);let b=n%24,a=Math.floor(n/24),next=dist[queue[head]]+1;
  for(let m=0;m<18;m++){
   const j=((A[m][a]*24+B[m][b])*24+G[m][c])*24+H[m][d];
   if(dist[j]===255){dist[j]=next;queue[tail++]=j;}
  }
 }return dist;
}
export function buildTables(progress=()=>{}){
 return subsets.map((ids,t)=>{progress({phase:'tables',table:t+1,total:subsets.length});return buildPattern(ids);});
}
export function buildExtendedTables(progress=()=>{}){
 return pairSubsets.map((ids,t)=>{progress({phase:'extended-tables',table:t+1,total:pairSubsets.length});return buildPattern(ids);});
}
export function buildDeepTables(progress=()=>{}){
 return deepSubsets.map((ids,t)=>{
  progress({phase:'deep-tables',table:t+1,total:4});
  const dist=new Uint8Array(24**5);dist.fill(255);const queue=new Uint32Array(24**5);
  const start=deepIndex(solved(),ids);dist[start]=0;queue[0]=start;let tail=1;
  for(let head=0;head<tail;head++){
   let n=queue[head],e=n%24;n=Math.floor(n/24);let d=n%24;n=Math.floor(n/24);let c=n%24;n=Math.floor(n/24);let b=n%24,a=Math.floor(n/24),next=dist[queue[head]]+1;
   for(let m=0;m<18;m++){const j=(((E[m][a]*24+E[m][b])*24+E[m][c])*24+E[m][d])*24+C[m][e];if(dist[j]===255){dist[j]=next;queue[tail++]=j;}}
  }return dist;
 });
}
export function goal(s,pairs){if(s[0]!==8||s[1]!==10||s[2]!==12||s[3]!==14)return false;let count=0;for(let p=0;p<4;p++)if(s[p+4]===(p+8)*2&&s[p+8]===(p+4)*3)count++;return count>=pairs;}
export function solve(initial,pairs,tables,{limit=5,progress=()=>{},maxNodes=Infinity,solutionKey=s=>s.alg,compareSolutions=()=>0,rankAll=false,extendedTables}={}){
 if(!Number.isInteger(pairs)||pairs<0||pairs>4)throw Error('Invalid goal');
 const pairDistances=new Uint8Array(4);
 function heuristic(s){const cross=tables[0][index(s,subsets[0])];if(!pairs)return cross;
  for(let i=0;i<4;i++){pairDistances[i]=tables[i+1][index(s,subsets[i+1])];if(extendedTables?.blocks&&pairs>=3)pairDistances[i]=Math.max(pairDistances[i],extendedTables.blocks[i][deepIndex(s,deepSubsets[i])]);}
  // Any k solved slots must satisfy at least the kth-smallest pair lower bound.
  let a=pairDistances[0],b=pairDistances[1],c=pairDistances[2],d=pairDistances[3],t;
  if(a>b){t=a;a=b;b=t;}if(c>d){t=c;c=d;d=t;}if(a>c){t=a;a=c;c=t;}if(b>d){t=b;b=d;d=t;}if(b>c){t=b;b=c;c=t;}
  let bound=Math.max(cross,pairs===1?a:pairs===2?b:pairs===3?c:d);
  if(extendedTables&&pairs>=3){
   const e0=extendedTables[0][index(s,pairSubsets[0])],e1=extendedTables[1][index(s,pairSubsets[1])],e2=extendedTables[2][index(s,pairSubsets[2])],e3=extendedTables[3][index(s,pairSubsets[3])],e4=extendedTables[4][index(s,pairSubsets[4])],e5=extendedTables[5][index(s,pairSubsets[5])];
   const extra=pairs===4?Math.max(e0,e1,e2,e3,e4,e5):Math.min(Math.max(e0,e1,e3),Math.max(e0,e2,e4),Math.max(e1,e2,e5),Math.max(e3,e4,e5));
   bound=Math.max(bound,extra);
  }return bound;
 }
 const stack=Array.from({length:31},()=>new Uint8Array(12));stack[0].set(initial);const path=[],solutions=[],solutionIndices=new Map();let nodes=0,aborted=false,depth=heuristic(initial);
 function dfs(level,left,last){
  if(++nodes>maxNodes){aborted=true;return true;}
  if((nodes&262143)===0&&Date.now()-lastProgress>=500){lastProgress=Date.now();progress({phase:'search',pairs,depth,nodes,elapsed:lastProgress-started});}
  const s=stack[level];if(heuristic(s)>left)return false;
  if(left===0){if(goal(s,pairs)){let solvedSlots=slots.filter((_,p)=>s[p+4]===(p+8)*2&&s[p+8]===(p+4)*3);const candidate={alg:path.map(m=>names[m]).join(' '),slots:solvedSlots};const key=solutionKey(candidate),existing=solutionIndices.get(key);if(existing===undefined){solutionIndices.set(key,solutions.length);solutions.push(candidate);}else if(compareSolutions(candidate,solutions[existing])<0){solutions[existing]=candidate;}return !rankAll&&solutions.length>=limit;}return false;}
  for(let m=0;m<18;m++){
   const face=Math.floor(m/3);if(face===last)continue;
   // Opposite faces commute: retain one order without removing any shortest result.
   if(last>=0&&Math.abs(face-last)===3&&face<last)continue;
   move(s,m,stack[level+1]);path.push(m);const done=dfs(level+1,left-1,face);path.pop();if(done)return true;
  }return false;
 }
 const started=Date.now();let lastProgress=started;for(;depth<=30;depth++){
  progress({phase:'search',pairs,depth,nodes,elapsed:Date.now()-started});
  dfs(0,depth,-1);if(aborted)throw Error('Search budget exceeded; optimality has not been established.');
  if(solutions.length){solutions.sort(compareSolutions);return {pairs,depth,solutions:solutions.slice(0,limit),nodes,ms:Date.now()-started};}
 }throw Error('No solution found');
}
