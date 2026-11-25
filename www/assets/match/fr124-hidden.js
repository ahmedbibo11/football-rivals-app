/* HIDDEN XI uses its own authoritative result and the shared FR73/FR74 display. */
(()=>{'use strict';
 const shared=()=>window.FR101_SHARED_MATCH;
 let root=null,finalKey='';
 function markup(log,finished){
  return '<div class="fr104-heading">'+(finished?'🏆 HIDDEN XI · FULL TIME':'🔴 HIDDEN XI · LIVE 11 VS 11')+'</div>'+
   '<div class="fr104-cinema"><div id="'+(finished?'fr104-final':'fr104-live')+'" class="fr104-host"></div></div>'+
   '<section class="fr104-virus">'+(log||'')+'</section><button type="button" data-restart hidden>مواجهة جديدة</button>';
 }
 function matchMarkup(g,log){return markup(log,false)}
 function finishedMarkup(g,log){return markup(log,true)}
 function wire(host,stage){
  if(host.dataset.fr124Bound)return;
  host.dataset.fr124Bound='1';
  host.addEventListener('click',event=>{
   const button=event.target.closest('[data-action="new"],[data-action="back-auction"]');
   if(!button)return;
   event.preventDefault();event.stopImmediatePropagation();
   if(button.dataset.action==='back-auction')location.href='/?view=games';
   else stage.querySelector('[data-restart]')?.click();
  },true);
 }
 function update(g,stage){
  if(g?.stage!=='match'||!g.fr104Report?.events)return false;
  const host=stage?.querySelector('#fr104-live'),mv=shared();
  if(!host||!mv?.mount||!mv?.refresh)return false;
  const report=g.fr104Report;
  const room={code:g.id,stage:'match',players:report.fr102Teams,match:report,fr123CanCancel:true};
  if(host!==root){mv.dispose();root=host;finalKey='';mv.onCancel=()=>window.FR46RoomExit?.ask();wire(host,stage);mv.mount(host,{you:g.side,room})}
  mv.refresh(host,{you:g.side,room},0);
  return true;
 }
 function afterRender(g,stage){
  if(!g||!stage)return;
  if(g.stage==='match'){update(g,stage);return}
  if(g.stage==='finished'&&g.fr104Report?.events&&shared()?.mount){
   const host=stage.querySelector('#fr104-final');if(!host)return;
   const key=g.id+'-'+g.fr104Report.startedAt;
   if(host===root&&key===finalKey)return;
   shared().dispose();root=host;finalKey=key;wire(host,stage);
   shared().mount(host,{you:g.side,room:{code:key+'-final',stage:'match',players:g.fr104Report.fr102Teams,match:g.fr104Report}});
   shared().showAuthoritativeFinal?.();return;
  }
  dispose();
 }
 function dispose(){shared()?.dispose();root=null;finalKey=''}
 window.FR104_HIDDEN={matchMarkup,finishedMarkup,update,afterRender,dispose,version:'FR124'};
})();
