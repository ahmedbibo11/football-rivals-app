/* FOOTBALL RIVALS FR57 — One integrated, in-flow toolbar for active games. */
(()=>{'use strict';if(window.FR57RoomControls)return;
const $=id=>document.getElementById(id);
const path=location.pathname.toLowerCase();
const type=path.startsWith('/who-star/')?'star':path.startsWith('/ya-dobak/')?'ya':path.startsWith('/hidden-xi/')?'xi':null;
if(!type)return;
let bar=null,busy=false,observer=null;
function visible(el){return !!el&&!el.hidden&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'}
function target(){
 if(type==='star'){for(const id of ['lobby','play','reveal','results']){const x=$(id);if(visible(x))return x}return null}
 return type==='ya'?visible($('arena'))?$('arena'):null:visible($('game'))?$('game'):null;
}
function relocate(){
 if(!bar)return;
 const area=target(),voice=$('fr-voice26'),exit=$('fr46-exit-btn'),panel=$('frv-panel');
 // Always capture legacy controls first, including lobby/landing state.
 if(voice&&voice.parentNode!==bar)bar.insertBefore(voice,bar.firstChild);
 if(exit&&exit.parentNode!==bar)bar.appendChild(exit);
 if(panel&&panel.parentNode!==bar)bar.appendChild(panel);
 if(!area){if(!bar.hidden)bar.hidden=true;return}
 if(bar.hidden)bar.hidden=false;
 if(bar.parentElement!==area){
  const before=type==='star'&&area.id==='play'?area.querySelector('.game-top')?.nextSibling:
   type==='star'&&area.id==='lobby'?area.querySelector('.heading')?.nextSibling:
   type==='xi'?area.querySelector('.game-toolbar')?.nextSibling:null;
  area.insertBefore(bar,before||area.firstChild);
 }
}
function sync(){if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;relocate()})}
function init(){
 if(bar)return;
 bar=document.createElement('section');bar.id='fr57-room-toolbar';
 bar.className='fr57-room-toolbar';bar.setAttribute('role','group');
 bar.setAttribute('aria-label','المايك وإنهاء المباراة / Room controls');
 bar.hidden=true;
 document.body.appendChild(bar);
 relocate();
 observer=new MutationObserver(sync);
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pageshow',sync);
 setInterval(sync,900);
}
window.FR57RoomControls={refresh:sync};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();