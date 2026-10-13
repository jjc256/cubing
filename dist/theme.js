// Apply before loading styles to avoid flashing the wrong theme on startup.
(()=>{
 const key='cubing-prep-theme',media=window.matchMedia('(prefers-color-scheme: dark)');
 const valid=value=>['light','dark','system'].includes(value)?value:'system';
 let preference='system';try{preference=valid(localStorage.getItem(key));}catch{}
 function apply(){
  const theme=preference==='system'?(media.matches?'dark':'light'):preference;
  document.documentElement.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#141414':'#ffffff');
  const control=document.getElementById('theme');if(control)control.value=preference;
 }
 apply();
 media.addEventListener('change',()=>{if(preference==='system')apply();});
 document.addEventListener('DOMContentLoaded',()=>{
  const control=document.getElementById('theme');control.value=preference;
  control.addEventListener('change',()=>{
   preference=valid(control.value);
   try{if(preference==='system')localStorage.removeItem(key);else localStorage.setItem(key,preference);}catch{}
   apply();
  });
 });
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=valid(event.newValue);apply();}});
})();
