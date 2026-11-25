
/* FR103 uses exact shared FIVE/FR101/FR102 cinematic presentation in YA DOBAK. */
(function(){'use strict';
 const original=window.FRMatchday;
 if(!original)throw Error('FR103_MATCHDAY_MISSING');
 const oldLive=original.live,oldReset=original.reset;
 const $=s=>document.querySelector(s);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let room='',started=0,stored=new Map(),endKey='';
 const layout=['GK','RB','CB','CB','LB','CDM','CM','CM','RW','ST','LW'];
 function teams(g){
  return g.players.map((p,side)=>{
   const left=(p.roster||[]).slice();
   const squad=layout.map(position=>{
    const idx=left.findIndex(x=>x.slot===position),c=idx<0?null:left.splice(idx,1)[0];
    return {position,card:c?{...c,unique:String(c.id)}:{unique:'waiting-'+side+'-'+position,id:'waiting-'+side+'-'+position,name:position,ovr:0}};
   });
   return {name:p.name,side,club:{id:'yadobak-'+side,ar:p.club?.ar||p.name,name:p.club?.ar||p.name,stadium:p.club?.stadium||'YA DOBAK ARENA',crest:Number(p.club?.crest)||0},
    coach:{id:'yadobak',style:'balanced'},balance:Number(p.coins)||0,squad,bench:[]};
  });
 }
 function liveModel(g){
  const l=g.matchLive;
  if(!l)return null;
  if(room!==g.id){room=g.id;started=Number(l.startedAt)||Date.now();stored.clear();}
  for(const e of l.events||[])if(e&&e.id!=null)stored.set(e.id,e);
  const duration=Math.max(12000,90*Number(l.msPerMinute||1000)+Number(l.halftimeMs||6000));
  const goals=(l.goals||[]).map((v,i)=>{
   const side=Number(v.team)===1?1:0,c=g.players[side].roster.find(x=>String(x.id)===String(v.id)||x.name===v.player);
   return {id:'g'+i,minute:Math.max(1,Math.min(90,Number(v.minute)||1)),side,type:'goal',
    player:v.player||c?.name||'',playerId:String(c?.id||v.id||''),actorId:String(c?.id||v.id||''),actorSide:side,
    text:'هدف '+String(v.player||c?.name||''),cinematic:true,holdMs:5000};
  });
  const allowed=['chance','shot','save','miss','block','yellow','red','var','injury'];
  const clips=[...stored.values()].filter(e=>e.type!=='goal'&&allowed.includes(e.type)).slice(-24).map(e=>{
   const side=Number(e.team??e.side)===1?1:0,type=e.type==='shot'?'chance':e.type;
   const card=g.players[side].roster.find(x=>x.name===e.player||String(x.id)===String(e.playerId));
   return {id:'e'+e.id,minute:Math.max(1,Math.min(90,Number(e.minute)||1)),side,type,
    player:e.player||card?.name||'',playerId:String(card?.id||''),actorId:String(card?.id||''),actorSide:side,
    text:String(e.message||e.text||''),cinematic:['save','yellow','red','var','injury'].includes(type),holdMs:2200};
  });
  const events=[...goals,...clips].sort((a,b)=>a.minute-b.minute||String(a.id).localeCompare(String(b.id)));
  events.forEach((e,i)=>{e.cueIndex=i;e.showAt=Math.max(0,Math.min(duration-3000,e.minute/90*duration));e.endAt=e.showAt+e.holdMs});
  const model={engineVersion:'FR73',fr102Mode:'YA_DOBAK',fr103Live:true,fr103Frame:l.frame||null,
   startedAt:started,stadium:'YA DOBAK ARENA',regularDuration:duration,duration,
   events,score:l.score.slice(),winner:null,mvp:{side:0,player:teams(g)[0].squad[0].card},
   playerRatings:[[],[]],shots:[Number(l.stats?.[0]?.shots)||0,Number(l.stats?.[1]?.shots)||0],
   saves:[Number(l.stats?.[0]?.saves)||0,Number(l.stats?.[1]?.saves)||0],
   chances:[0,0],possession:[50,50],tactics:l.teams.map(t=>t.tactic),penalty:null};
  return {report:model,roster:teams(g),elapsed:Math.max(0,Math.min(duration-1700,Number(l.minute||0)/90*duration))};
 }
 function tactics(g,cb){
  const l=g.matchLive,el=$('#fr103-tactics');if(!l||!el)return;
  const options=[['balanced','⚖️ متوازن'],['attack','⚡ هجومي'],['counter','🏃 مرتدات'],['press','🔥 ضغط']];
  const chosen=l.teams[g.side]?.tactic||'balanced';
  el.innerHTML='<div class="fr103-tactic-head"><b>🧠 قراراتك التكتيكية · LIVE</b><span>الدقيقة '+Number(l.minute||0)+' / 90</span></div>'+
   '<div class="fr103-tactic-grid">'+options.map(([id,label])=>'<button type="button" data-fr103-tactic="'+id+'" '+
   (chosen===id?'class="active"':'')+(l.phase==='half'?' disabled':'')+'>'+label+'</button>').join('')+
   '</div><small>التغيير كل 8 دقائق · التغييرات '+Number(l.tacticsUsed?.[g.side]||0)+'/8 · النتيجة من السيرفر</small>';
  el.querySelectorAll('[data-fr103-tactic]').forEach(b=>b.onclick=()=>cb(b.dataset.fr103Tactic,b));
 }
 function live(g,cb,sprite){
  const shared=window.FR101_SHARED_MATCH;
  if(!shared?.mount||!shared.refresh)return oldLive(g,cb,sprite);
  const data=liveModel(g);if(!data)return;
  const stage=$('#stage');if(!stage)return;
  let root=$('#fr103-live');
  if(!root){
   shared.dispose();
   stage.innerHTML='<section class="stage-frame fr103-cinema"><div class="fr103-label">🔴 YA DOBAK · LIVE 11 VS 11</div>'+
    '<div id="fr103-live" class="fr102-match-host fr103-host"></div><p class="fr127-match-note">'+(g.mode==='ai'?'تحكم في سرعة المباراة وتخطي المحاكاة':'السرعة للطرفين · التخطي يتم بموافقة اللاعبين')+'</p><div id="fr103-tactics" class="fr103-tactics"></div></section>';
   root=$('#fr103-live');
   shared.onCancel=()=>window.FR46RoomExit?.ask();
   shared.onYaDobakRate=(rate,button)=>window.FR127Control?.('rate',rate,button);
   shared.onYaDobakSkip=button=>window.FR127Control?.('skip',null,button);
   shared.mount(root,{you:g.side,room:{code:g.id,stage:'match',players:data.roster,match:data.report,fr123CanCancel:true}});
  }
  shared.refresh(root,{you:g.side,room:{code:g.id,stage:'match',players:data.roster,match:data.report,fr123CanCancel:true}},data.elapsed);
  shared.setYaDobakServerRate?.(Number(g.matchLive?.playbackRate)||1);
  const skip=document.querySelector('#fr74-controls [data-fr74="skip"]');
  if(skip){const voted=!!g.matchLive?.skipVotes?.[g.side],other=!!g.matchLive?.skipVotes?.[1-g.side];skip.disabled=voted;skip.textContent=g.mode==='ai'?'⏭ تخطي المحاكاة للنتيجة':voted?'⏳ بانتظار موافقة المنافس على التخطي':other?'⏭ وافق على تخطي المباراة':'⏭ طلب تخطي المباراة للطرفين';}
  tactics(g,cb);
 }
 function finished(g,reset){
  const m=g.fr103Match,shared=window.FR101_SHARED_MATCH;
  if(!m?.events||!m.fr102Teams||!shared?.mount)return false;
  const key=String(g.id)+'|'+String(m.startedAt);
  if(endKey===key&&$('#fr103-final'))return true;
  endKey=key;shared.dispose();
  const stage=$('#stage');
  if(!stage)return false;
  stage.innerHTML='<section class="stage-frame fr103-cinema"><div class="fr103-label">🏟️ YA DOBAK · UNIFIED MATCH CINEMA</div>'+
   '<div id="fr103-final" class="fr102-match-host fr103-host"></div>'+
   '<div class="fr103-actions"><button type="button" id="fr103-new">🎮 تحدي جديد</button>'+
   '<button type="button" id="fr103-copy">⧉ نسخ رابط التقرير</button></div></section>'+
   (original.reportHtml?original.reportHtml(g):'');
  const finalRoot=$('#fr103-final');
  shared.mount(finalRoot,{you:g.side,room:{code:g.id+'-final',stage:'done',players:m.fr102Teams,match:m}});
  finalRoot.addEventListener('click',ev=>{const el=ev.target.closest('[data-action="new"],[data-action="back-auction"]');if(!el)return;ev.preventDefault();ev.stopImmediatePropagation();if(el.dataset.action==='new')reset();else location.href='/?view=games'},true);
  $('#fr103-new').onclick=reset;
  const copy=()=>navigator.clipboard?.writeText(location.origin+'/ya-dobak/?report='+encodeURIComponent(g.id)).catch(()=>{});
  $('#fr103-copy').onclick=copy;
  if($('#fr14-copy-report'))$('#fr14-copy-report').onclick=copy;
  return true;
 }
 function dispose(){
  window.FR101_SHARED_MATCH?.dispose();
  room='';started=0;stored.clear();endKey='';
 }
 original.live=live;
 original.reset=function(){dispose();if(typeof oldReset==='function')oldReset()};
 window.FR103_YADOBAK={finished,dispose,version:'FR103-FR73-ONE-PLAYER'};
})();
