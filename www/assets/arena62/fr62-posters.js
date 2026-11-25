/* FR62 — ORIGINAL POSTER INTEGRATION.
   Non-destructive overlay over FR61; no game engines, room code or server changes.
   Disable and remember: ?view=games&posters62=0
   Re-enable: ?view=games&posters62=1
   Remove script + stylesheet for full rollback. */
(function(){'use strict';
 if(location.pathname!=='/')return;
 const KEY='fr:posters62:enabled:v1';
 const POSTERS={
   star:'/assets/arena62/posters/star.png',
   dobak:'/assets/arena62/posters/dobak.png',
   hiddenxi:'/assets/arena62/posters/hiddenxi.png'
 };
 let enabled=true,observer=null,languageObserver=null,scheduled=false;
 function read(){try{return localStorage.getItem(KEY)}catch(e){return null}}
 function write(s){try{localStorage.setItem(KEY,s)}catch(e){}}
 function status(){
   let param=null;
   try{param=new URLSearchParams(location.search).get('posters62')}catch(e){}
   if(param==='0'||param==='1'){write(param);return param==='1'}
   return read()!=='0';
 }
 function compatible(){
   return enabled&&document.documentElement.lang!=='en'&&
     document.documentElement.dataset.fr61!=='disabled'&&
     !!document.querySelector('#fr61-arena');
 }
 function restore(card){
   if(!card)return;
   const img=card.querySelector('img.fr61-cover');
   if(img&&img.dataset.fr62Original){
     img.setAttribute('src',img.dataset.fr62Original);
     delete img.dataset.fr62Original;
   }
   card.removeAttribute('data-fr62-poster');
 }
 function decorate(card){
   if(!card)return;
   const id=card.getAttribute('data-fr61-game'),target=POSTERS[id];
   const img=card.querySelector('img.fr61-cover');
   if(!target||!img)return;
   if(!img.dataset.fr62Original)img.dataset.fr62Original=img.getAttribute('src')||'';
   if(img.getAttribute('src')!==target)img.setAttribute('src',target);
   img.setAttribute('width','1692');img.setAttribute('height','930');
   img.setAttribute('loading','lazy');img.setAttribute('decoding','async');
   img.style.objectFit='contain';
   card.dataset.fr62Poster='1';
   card.title=id==='star'?'مين النجم؟':id==='dobak'?'يا دوبك':'اللاعب الخفي';
   if(img.dataset.fr62ErrorHandler!=='1'){
     img.dataset.fr62ErrorHandler='1';
     img.addEventListener('error',()=>{if(img.getAttribute('src')===target){restore(card);card.dataset.fr62Failed='1'}});
   }
 }
 function update(){
   if(!document.documentElement||!document.getElementById('fr61-arena'))return;
   const canUse=compatible();
   const cards=document.querySelectorAll('#fr61-arena .fr61-pick[data-fr61-game]');
   for(const card of cards){
     if(!canUse){restore(card);continue}
     if(card.dataset.fr62Failed==='1')continue;
     decorate(card);
   }
   document.documentElement.dataset.fr62=canUse?'enabled':'disabled';
 }
 function schedule(){
   if(scheduled)return;
   scheduled=true;
   queueMicrotask(()=>{scheduled=false;try{update()}catch(e){console.warn('FR62 isolated fallback',e)}});
 }
 function setEnabled(value){
   enabled=!!value;write(enabled?'1':'0');schedule();
 }
 function init(){
   enabled=status();
   schedule();
   const area=document.getElementById('fr61-arena');
   if(area){
     observer=new MutationObserver(schedule);
     observer.observe(area,{childList:true,subtree:true});
   }
   languageObserver=new MutationObserver(schedule);
   languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-fr61']});
   window.FR62Posters={
      version:'FR62.1',enable:()=>setEnabled(true),disable:()=>setEnabled(false),
      isEnabled:()=>enabled,sourceDimensions:[1692,930],isOriginalPng:true
   };
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();