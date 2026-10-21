import {drawCube,stickersFor} from './orientation.js';
const $=id=>document.getElementById(id),colors={FR:'Green / orange',FL:'Green / red',BL:'Blue / red',BR:'Blue / orange'};
let startRotation='z2';
let worker,scramble='',selected=null,position=0,ticket=0;
function preview(){
 const moves=selected?.alg.split(/\s+/).filter(Boolean)||[];
 const display=scramble+(selected?' '+startRotation+' '+selected.before+' '+moves.slice(0,position).join(' '):'');
 drawCube($('cube'),display);
 const stickers=stickersFor(display),names={U:'White',D:'Yellow',F:'Green',B:'Blue',R:'Red',L:'Orange'},center=n=>names[stickers.find(s=>s.p.every((v,i)=>v===n[i])&&s.n.every((v,i)=>v===n[i])).color];
 $('orientation-label').textContent=selected?`${center([0,-1,0])} bottom · ${center([0,0,1])} front`:'White top · Green front';
 $('preview-rotation').textContent=selected?startRotation+' · Previous insertions applied':'';
 $('step-label').textContent=selected?`${selected.slot} · ${position} / ${moves.length}${position?' · '+moves[position-1]:''}`:'Scramble';
 $('prev').disabled=!selected||position===0;$('next').disabled=!selected||position===moves.length;
}
function render(steps){
 $('results').replaceChildren();
 steps.forEach((step,i)=>{
 const card=document.createElement('details');card.className='pair-card';
 const summary=document.createElement('summary');summary.textContent=`${i+1}. ${step.slot} pair`;
 const color=document.createElement('span');color.textContent=step.colors||colors[step.slot];summary.append(color);card.append(summary);
 const formula=document.createElement('div');formula.className='solution-alg';formula.textContent=step.alg||(step.solvedByEarlier?'Solved by an earlier insertion.':'Already solved in this scramble.');card.append(formula);
 if(step.setup){const breakdown=document.createElement('details');breakdown.className='inspection-plan';
 const label=document.createElement('summary');label.textContent='Setup and source algorithm';breakdown.append(label);
 const setup=document.createElement('p');setup.className='help';setup.textContent='Setup: '+step.setup;breakdown.append(setup);
 const original=document.createElement('p');original.className='help';original.textContent='Source: '+step.formula;breakdown.append(original);card.append(breakdown);}
 if(step.alg){const source=document.createElement('p');source.className='help';const link=document.createElement('a');link.href=step.url;link.target='_blank';link.rel='noopener';link.textContent=`${step.case} · SpeedCubeDB`;source.append(link);card.append(source);
 if(step.extraction){const note=document.createElement('p');note.className='help';note.textContent='The setup includes an extraction before aligning the source case.';card.append(note);}}
 const play=document.createElement('button');play.textContent='Preview insertion';play.onclick=()=>{selected=step;position=0;preview();};card.append(play);
 card.addEventListener('toggle',()=>{if(card.open){selected=step;position=0;preview();}});$('results').append(card);
 });
}
$('generate').onclick=async()=>{
 startRotation='z2';$('solve-orientation').textContent='Generate a scramble to choose a starting orientation.';
 const id=++ticket;worker?.terminate();$('results').replaceChildren();scramble='';selected=null;$('scramble').value='';$('copy').disabled=true;$('error').textContent='';$('status').textContent='Generating a random state…';$('generate').disabled=true;preview();
 try{const {randomScrambleForEvent}=await import('https://cdn.cubing.net/v0/js/cubing/scramble');const rawScramble=String(await randomScrambleForEvent('333'));if(id!==ticket)return;
 worker=new Worker('f2l-worker.js',{type:'module'});
 const fail=message=>{$('error').textContent=message;$('status').textContent='';$('generate').disabled=false;worker?.terminate();};
 worker.onerror=()=>fail('Could not prepare the F2L state. Try again.');
 worker.onmessage=({data})=>{if(id!==ticket)return;if(data.type==='status')$('status').textContent=data.message;else if(data.type==='error')fail(data.message);else{scramble=data.scramble;startRotation=data.rotation;$('solve-orientation').textContent=`After scrambling, apply ${data.rotation} · White bottom · ${data.front} front.`;$('scramble').value=scramble;render(data.steps);$('copy').disabled=false;$('generate').disabled=false;$('status').textContent='Four pairs · Formulas hidden';preview();worker.terminate();}};
 worker.postMessage({rawScramble});
 }catch(error){$('error').textContent='Could not generate a scramble. Check your connection and try again.';$('status').textContent='';$('generate').disabled=false;}
};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(scramble);$('status').textContent='Scramble copied.';}catch{$('error').textContent='Could not copy. Select and copy the scramble above.';}};
$('reset').onclick=()=>{selected=null;position=0;preview();};$('prev').onclick=()=>{position--;preview();};$('next').onclick=()=>{position++;preview();};preview();
