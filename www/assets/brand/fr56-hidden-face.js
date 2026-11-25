/* FOOTBALL RIVALS FR56 — Hidden Face premium UI.
 * Existing server remains authoritative for answers, points and room syncing.
 * Source player artwork stays unchanged; only a cropped central face appears before reveal.
 */
(()=>{'use strict';
if(window.FR56HiddenFace)return;
const $=id=>document.getElementById(id),isEn=()=>document.documentElement.lang==='en',T=(ar,en)=>isEn()?en:ar;
let active=false,revealing=false,questionId='',lastCount=1,session=null;
let choicesRestore=null,exitRestore=null;
function validSprite(s){
 return !!s&&/^\/cloud-v5\/assets\/cards_\d+\.webp$/.test(s.file)&&
 [s.col,s.row,s.cols,s.rows].every(Number.isInteger)&&s.cols>0&&s.rows>0&&
 s.col>=0&&s.col<s.cols&&s.row>=0&&s.row<s.rows;
}
function atlas(node,s){
 if(!validSprite(s))return false;
 const x=s.cols>1?s.col*100/(s.cols-1):0,y=s.rows>1?s.row*100/(s.rows-1):0;
 node.style.backgroundImage='url("'+s.file+'")';
 node.style.backgroundSize=(s.cols*100)+'% '+(s.rows*100)+'%';
 node.style.backgroundPosition=x+'% '+y+'%';
 return true;
}
function restoreExit(){
 const exit=$('fr46-exit-btn');
 if(!exit||!exitRestore)return;
 const {parent,next}=exitRestore;
 if(next&&next.parentNode===parent)parent.insertBefore(exit,next);
 else parent.appendChild(exit);
 exit.classList.remove('fr56-reveal-exit');
 exitRestore=null;
}
function captureExit(slot){
 const exit=$('fr46-exit-btn');
 if(!slot||!exit||document.getElementById('fr57-room-toolbar'))return;
 if(!exitRestore)exitRestore={parent:exit.parentNode,next:exit.nextSibling};
 slot.appendChild(exit);
}
function unmount(){
 if(choicesRestore){
  const root=$('choices'),{parent,next}=choicesRestore;
  if(root&&parent){
   if(next&&next.parentNode===parent)parent.insertBefore(root,next);
   else parent.appendChild(root);
  }
  choicesRestore=null;
 }
 restoreExit();
 $('fr56-face-ui')?.remove();
 $('fr56-round')?.remove();
 $('fr56-reveal-ui')?.remove();
 document.body.classList.remove('fr56-face-playing','fr56-face-reveal');
 active=false;revealing=false;session=null;questionId='';lastCount=1;
}
function setup(){
 const panel=document.querySelector('#play .question-panel');
 if(!panel)return null;
 let root=$('fr56-face-ui');if(root)return root;
 root=document.createElement('section');root.className='fr56-face-ui';root.id='fr56-face-ui';
 root.innerHTML='<div class="fr56-heading"><span>FOOTBALL RIVALS · HIDDEN FACE</span><b id="fr56-hero-tag"></b></div>'+
 '<h2 class="fr56-title" id="fr56-title"></h2><div class="fr56-stage-label" id="fr56-stage-label"></div>'+
 '<div class="fr56-stages" id="fr56-stages"></div>'+
 '<div class="fr56-face-stage" id="fr56-face-stage" data-step="1"><div class="fr56-halo"></div>'+
 '<div class="fr56-face-window" role="img" id="fr56-window"><div class="fr56-photo-tile" id="fr56-photo-tile"></div>'+
 '<div class="fr56-no-image" id="fr56-no-image" hidden>?</div>'+
 '<i class="fr56-corner tl"></i><i class="fr56-corner tr"></i><i class="fr56-corner bl"></i><i class="fr56-corner br"></i>'+
 '<div class="fr56-scanline" aria-hidden="true"></div></div>'+
 '<div class="fr56-step-caption"><span id="fr56-current-stage"></span><b id="fr56-multi">×3</b></div></div>'+
 '<div class="fr56-hint-card"><b id="fr56-hint-title"></b><span id="fr56-hint-body"></span></div>'+
 '<h3 class="fr56-answer-heading" id="fr56-answer-title"></h3>'+
 '<div class="fr56-options-slot" id="fr56-options-slot"></div>'+
 '<div class="fr56-bottom"><span class="fr56-sync" id="fr56-sync"></span><span id="fr56-exit-slot"></span></div>';
 panel.appendChild(root);
 const header=document.querySelector('#play .game-top');
 if(header&&!$('fr56-round')){const round=document.createElement('div');round.className='fr56-round';round.id='fr56-round';header.appendChild(round)}
 const choices=$('choices');
 if(choices){choicesRestore={parent:choices.parentNode,next:choices.nextSibling};$('fr56-options-slot').appendChild(choices)}
 captureExit($('fr56-exit-slot'));
 return root;
}
function localize(){
 if(!active||!$('fr56-face-ui'))return;
 const badge=$('challengeBadge');
 if(badge)badge.innerHTML='<strong>'+T('الوجه الخفي','HIDDEN FACE')+'</strong><small>'+T('HIDDEN FACE','FACE UNLOCK')+'</small>';
 $('fr56-title').textContent=T('مين اللاعب في الصورة؟','WHO IS THE PLAYER?');
 $('fr56-stage-label').textContent=T('مراحل كشف الوجه','FACE REVEAL STAGES');
 $('fr56-hero-tag').textContent=T('كشف تدريجي','PROGRESSIVE REVEAL');
 $('fr56-answer-title').textContent=T('اختار النجم الصحيح','CHOOSE THE PLAYER');
 const num=Math.max(1,Math.min(3,session?.question?.hints?.length||1));
 $('fr56-hint-title').textContent=T('التلميح '+num,'HINT '+num);
 $('fr56-hint-body').textContent=session?.question?.hints?.[num-1]?.text||T('شوف ملامح اللاعب','Study the player');
 $('fr56-current-stage').textContent=T('مرحلة الكشف '+num+' / 3','UNLOCK '+num+' / 3');
 $('fr56-multi').textContent='×'+(4-num);
 const row=$('fr56-round');if(row)row.innerHTML='<small>'+T('الجولة','ROUND')+'</small><b dir="ltr">'+Number(session?.question?.round||1)+' / '+Number(session?.total||1)+'</b>';
 const stage=$('fr56-face-stage');if(stage)stage.dataset.step=String(num);
 const steps=$('fr56-stages');if(steps){
  steps.replaceChildren();for(let i=1;i<=3;i++){
   const el=document.createElement('div');
   el.className='fr56-stage'+(i<=num?' is-unlocked':'')+(i===num?' is-current':'');
   const label=document.createElement('span');label.textContent=T('كشف '+i,'STAGE '+i);
   const numIcon=document.createElement('span');numIcon.className='fr56-stage-dot';numIcon.textContent=i<=num?'✦':'🔒';
   el.append(numIcon,label);steps.appendChild(el);
  }
 }
}
function question(d){
 if(d?.stage!=='question'||d?.question?.type!=='face'){
  if(active||revealing)unmount();return;
 }
 if(revealing)unmount();
 if(!setup())return;
 active=true;session=d;document.body.classList.remove('fr56-face-reveal');document.body.classList.add('fr56-face-playing');
 const key=d.room+':'+d.question.round,first=questionId!==key;
 if(first){questionId=key;lastCount=1;const tile=$('fr56-photo-tile');
  const good=atlas(tile,d.question.photo);
  $('fr56-no-image').hidden=good;
  tile.hidden=!good;
  $('fr56-window').setAttribute('aria-label',T('صورة لاعب يتم كشف وجهه تدريجيًا','Gradually revealing the player portrait'));
 }
 const level=Math.max(1,Math.min(3,d.question.hints?.length||1));
 if(level>lastCount)lastCount=level;
 localize();
 const sync=$('fr56-sync');
 if(sync){const offline=$('offline')?.hidden===false;sync.dataset.offline=String(offline);sync.textContent=offline?T('جار إعادة الاتصال','RECONNECTING'):T('✓ تمت المزامنة','✓ SYNCED')}
}
function reveal(d){
 if(d?.stage!=='reveal'||d.question?.type!=='face')return;
 // Existing renderReveal only calls this after the authoritative server discloses the answer.
 const r=d.question.reveal;if(!r)return;
 if(active){
  if(choicesRestore){
   const el=$('choices'),{parent,next}=choicesRestore;
   if(el){if(next?.parentNode===parent)parent.insertBefore(el,next);else parent.appendChild(el)}
   choicesRestore=null;
  }
  $('fr56-face-ui')?.remove();$('fr56-round')?.remove();active=false;
  restoreExit();
 }
 revealing=true;session=d;
 document.body.classList.remove('fr56-face-playing');document.body.classList.add('fr56-face-reveal');
 $('fr56-reveal-ui')?.remove();
 const panel=document.querySelector('#reveal .panel.reveal');if(!panel)return;
 const box=document.createElement('section');box.className='fr56-reveal-ui';box.id='fr56-reveal-ui';
 box.innerHTML='<div class="fr56-reveal-kicker">FOOTBALL RIVALS · HIDDEN FACE</div>'+
 '<h2 class="fr56-reveal-heading" id="fr56-reveal-heading"></h2>'+
 '<div class="fr56-reveal-art" id="fr56-reveal-art"><div class="fr56-reveal-card" id="fr56-reveal-card"></div></div>'+
 '<strong class="fr56-reveal-name" id="fr56-reveal-name"></strong>'+
 '<div class="fr56-reveal-info" id="fr56-reveal-info"></div>'+
 '<div class="fr56-reveal-points" id="fr56-reveal-points"></div>'+
 '<div class="fr56-review"><h3 id="fr56-review-title"></h3><div class="fr56-review-grid" id="fr56-review-grid"></div></div>'+
 '<div class="fr56-next"><span id="fr56-next-title"></span><span id="fr56-reveal-exit-slot"></span></div>';
 panel.appendChild(box);
 const i=d.role==='guest'?1:0,correct=r.chosen?.[i]===r.correct,score=Number(r.points?.[i]||0);
 $('fr56-reveal-heading').textContent=correct?T('★ إجابة صحيحة!','★ CORRECT ANSWER!'):T('★ النجم اتكشف!','★ THE STAR REVEALED!');
 $('fr56-reveal-name').textContent=r.name||'—';
 $('fr56-review-title').textContent=T('مراجعة الاختيارات','ANSWER REVIEW');
 $('fr56-next-title').textContent=T('السؤال التالي يبدأ تلقائيًا','NEXT QUESTION STARTS AUTOMATICALLY');
 const multi=Number(r.multiplier?.[i]||1);
 $('fr56-reveal-points').textContent=correct?'+'+score.toLocaleString('en-US')+' '+T('نقطة · مضاعف','POINTS · MULTIPLIER')+' ×'+multi:T('بدون نقاط في الجولة','NO POINTS THIS ROUND');
 const info=$('fr56-reveal-info');
 [r.positionAr||r.position||'',r.country||''].filter(Boolean).forEach(val=>{
  const el=document.createElement('span');el.textContent=val;info.appendChild(el);
 });
 const art=$('fr56-reveal-art'),card=$('fr56-reveal-card'),sprite=r.photo||r.portraitAtlas;
 if(atlas(card,sprite)){
  art.classList.add('has-card');
  const image=new Image();
  image.onload=()=>{if(image.naturalWidth>0&&image.naturalHeight>0){
   art.style.setProperty('--fr56-card-ratio',String((image.naturalWidth/sprite.cols)/(image.naturalHeight/sprite.rows)));
  }};
  image.src=sprite.file;
 }else if(typeof r.portrait==='string'&&/^\/assets\/players\/career\/[a-z0-9_-]+\.webp$/.test(r.portrait)){
  art.classList.add('has-card');card.style.backgroundImage='url("'+r.portrait+'")';
  card.style.backgroundSize='contain';card.style.backgroundPosition='center';
 }
 for(const [j,name] of (d.question.options||[]).entries()){
  const el=document.createElement('div');el.className='fr56-review-item'+(j===r.correct?' correct':j===r.chosen?.[i]?' incorrect':'');
  el.textContent='ABCD'[j]+' · '+name+(j===r.correct?' ✓':'');
  $('fr56-review-grid').appendChild(el);
 }
 captureExit($('fr56-reveal-exit-slot'));
 const exit=$('fr46-exit-btn');if(exit)exit.classList.add('fr56-reveal-exit');
}
function screen(id){
 if(id!=='play'&&id!=='reveal'){if(active||revealing)unmount();return}
 if(id==='reveal'&&active){
  // The question card must release original DOM elements before result stage.
  if(choicesRestore){const el=$('choices'),{parent,next}=choicesRestore;
   if(el){if(next?.parentNode===parent)parent.insertBefore(el,next);else parent.appendChild(el)}
   choicesRestore=null;
  }
  $('fr56-face-ui')?.remove();$('fr56-round')?.remove();
  restoreExit();active=false;
 }
 if(id==='play'&&revealing)unmount();
}
window.FR56HiddenFace={question,reveal,screen};
new MutationObserver(()=>{if(active)localize()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
setInterval(()=>{if(!active)return;const node=$('fr56-sync');
 if(!node)return;const offline=$('offline')?.hidden===false;node.dataset.offline=String(offline);
 node.textContent=offline?T('⚠ إعادة الاتصال','⚠ RECONNECTING'):T('✓ تمت المزامنة','✓ SYNCED');
},450);
})();