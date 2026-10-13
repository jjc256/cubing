import {parse} from './solver.js';
import {drawCube} from './orientation.js';
const $=id=>document.getElementById(id);
const goalNames=['Cross','1 X-cross','2 X-cross'];
let worker,run=0,original='',play=[],step=0,selected,chosen;

function preview(){
 const alg=[original,chosen?.rotation||'',...play.slice(0,step)].join(' ');
 drawCube($('cube'),alg);
 $('orientation-label').textContent=chosen?`White bottom · ${chosen.front} front`:'White top · Green front';
 $('preview-rotation').textContent=chosen?`Rotation applied: ${chosen.rotation}`:'';
 $('step-label').textContent=chosen?(step?`${step} / ${play.length} · ${play[step-1]}`:`0 / ${play.length}`):'Scramble';
 $('prev').disabled=step===0;
 $('next').disabled=step===play.length;
}
function showScramble(){selected?.classList.remove('selected');selected=null;chosen=null;play=[];step=0;preview();}
function stop(){worker?.terminate();worker=null;$('cancel').hidden=true;}
function solutionButton(solution){
 const button=document.createElement('button');button.className='solution';
 const meta=document.createElement('span');meta.className='solution-meta';
 const rotation=document.createElement('span');rotation.className='rotation';rotation.textContent=solution.rotation;
 const front=document.createElement('span');front.textContent=`${solution.front} front`;
 const slots=document.createElement('span');slots.textContent=solution.slots.join(' + ');
 meta.append(rotation,front,slots);
 const alg=document.createElement('span');alg.className='solution-alg';alg.textContent=solution.alg||'Already solved';
 button.append(meta,alg);
 button.onclick=()=>{selected?.classList.remove('selected');selected=button;button.classList.add('selected');chosen=solution;play=solution.alg?solution.alg.split(' '):[];step=0;preview();};
 return button;
}
function result(data){
 const card=$(`goal-${data.pairs}`);card.replaceChildren();
 const head=document.createElement('div');head.className='result-head';
 const name=document.createElement('div');name.className='goal-name';name.textContent=goalNames[data.pairs];
 const count=document.createElement('div');count.className='move-count';
 const strong=document.createElement('strong');strong.textContent=data.depth;
 const unit=document.createElement('span');unit.textContent='moves · optimal';count.append(strong,unit);head.append(name,count);
 card.append(head,solutionButton(data.solutions[0]));
 if(data.solutions.length>1){
  const details=document.createElement('details');details.className='alternatives';
  const summary=document.createElement('summary');summary.textContent=`${data.solutions.length-1} more optimal solutions`;
  details.append(summary);data.solutions.slice(1).forEach(s=>details.append(solutionButton(s)));card.append(details);
 }
}
function analyze(){
 const text=$('scramble').value.trim();
 try{if(!text)throw Error('Generate or enter a scramble first.');parse(text);}catch(e){$('error').textContent=e.message;return;}
 stop();run++;$('error').textContent='';original=text;showScramble();$('cancel').hidden=false;$('status').textContent='Preparing search…';$('results').replaceChildren();
 for(let pairs=0;pairs<3;pairs++){
  const card=document.createElement('article');card.id=`goal-${pairs}`;card.className='result';
  const h=document.createElement('h2');h.textContent=goalNames[pairs];
  const p=document.createElement('p');p.className='pending';p.textContent='Waiting';card.append(h,p);$('results').append(card);
 }
 const current=run;
 worker=new Worker('./worker.js',{type:'module'});
 worker.onmessage=({data})=>{
  if(current!==run)return;
  if(data.type==='progress'){
   $('status').textContent=data.phase==='tables'?`Preparing search tables (${data.table}/5)…`:`${goalNames[data.pairs]}: searching ${data.depth} moves…`;
   const pending=$(`goal-${data.pairs}`)?.querySelector('.pending');if(pending)pending.textContent=`Searching ${data.depth} moves…`;
  }
  if(data.type==='result')result(data);
  if(data.type==='done'){stop();$('status').textContent='Complete. Select a solution to preview it.';}
  if(data.type==='error'){stop();$('error').textContent=data.message;$('status').textContent='Search stopped.';}
 };
 worker.onerror=()=>{stop();$('error').textContent='The solver could not start. Refresh and try again.';};
 worker.postMessage({scramble:text});
}
$('generate').onclick=async()=>{
 stop();const id=++run;$('generate').disabled=true;$('error').textContent='';$('status').textContent='Generating scramble…';
 try{
  const {randomScrambleForEvent}=await import('https://cdn.cubing.net/v0/js/cubing/scramble');
  const scramble=await randomScrambleForEvent('333');
  if(id!==run)return;$('scramble').value=scramble.toString();analyze();
 }catch{
  if(id===run){$('error').textContent='Scramble generation needs internet access. You can still enter a scramble and solve it.';$('status').textContent='Enter a scramble to continue.';}
 }finally{$('generate').disabled=false;}
};
$('analyze').onclick=analyze;
$('cancel').onclick=()=>{stop();$('status').textContent='Stopped. Completed results are optimal.';document.querySelectorAll('.pending').forEach(p=>p.textContent='Search stopped');};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('scramble').value);$('status').textContent='Scramble copied.';}catch{$('error').textContent='Select and copy the scramble manually.';}};
$('prev').onclick=()=>{if(step>0)step--;preview();};
$('next').onclick=()=>{if(step<play.length)step++;preview();};
$('reset').onclick=showScramble;
$('scramble').oninput=()=>{
 stop();run++;$('results').replaceChildren();$('status').textContent='Select Solve to analyze this scramble.';
 try{parse($('scramble').value);original=$('scramble').value;showScramble();$('error').textContent='';}catch(e){$('error').textContent=e.message;}
};
preview();
