/* FOOTBALL RIVALS FR54 CLUE HUNT — authoritative data only; no direct answer logic. */
(()=>{'use strict';
if(window.FR54ClueHunt)return;
const $=id=>document.getElementById(id),en=()=>document.documentElement.lang==='en';
const T=(ar,english)=>en()?english:ar;
let active=false,latest=null,lastId='',visible=1,selectedTab=0,originalChoices=null,originalExit=null,originalExitNext=null;
function validSprite(x){return x&&/^\/cloud-v5\/assets\/cards_\d+\.webp$/.test(x.file)&&[x.col,x.row,x.cols,x.rows].every(Number.isInteger)&&x.cols>0&&x.rows>0&&x.col>=0&&x.row>=0&&x.col<x.cols&&x.row<x.rows}
function setSprite(node,s){if(!validSprite(s))return false;node.style.backgroundImage='url("'+s.file+'")';node.style.backgroundSize=s.cols*100+'% '+s.rows*100+'%';node.style.backgroundPosition=(s.cols>1?s.col*100/(s.cols-1):0)+'% '+(s.rows>1?s.row*100/(s.rows-1):0)+'%';return true}
function mount(){
 const panel=document.querySelector('#play .question-panel');
 if(!panel)return null;
 let box=$('fr54-hunt');
 if(box)return box;
 box=document.createElement('section');box.className='fr54-hunt';box.id='fr54-hunt';
 box.innerHTML='<div class="fr54-title-row"><b class="fr54-tag">✦ FOOTBALL RIVALS · CLUE HUNT</b><span class="fr54-difficulty" id="fr54-difficulty"></span></div>'+
 '<div class="fr54-investigation"><img class="fr54-art" src="/assets/brand/fr54-clue-dossier.svg" width="720" height="415" alt=""><strong class="fr54-case-label" id="fr54-title"></strong></div>'+
 '<div class="fr54-clue-intro" id="fr54-section"></div><div class="fr54-tabs" id="fr54-tabs"></div>'+
 '<article class="fr54-clue-paper" aria-live="polite"><span class="fr54-clue-level" id="fr54-level"></span><p class="fr54-clue-copy" id="fr54-copy"></p><small class="fr54-clue-counter" id="fr54-counter"></small></article>'+
 '<div class="fr54-points-note"><span id="fr54-timer-note"></span><b class="fr54-multiplier" id="fr54-multiplier"></b></div>'+
 '<h3 class="fr54-answer-heading" id="fr54-answer-title"></h3><div class="fr54-options-slot" id="fr54-options"></div>'+
 '<div class="fr54-bottom" id="fr54-bottom"><span id="fr54-sync" class="fr54-sync"></span><span class="fr54-timer-orb" id="fr54-timer">20.0</span><span id="fr54-exit-slot"></span></div>';
 panel.appendChild(box);
 const header=document.querySelector('#play .game-top');if(header&&!$('fr54-round-info')){const info=document.createElement('div');info.id='fr54-round-info';info.className='fr54-round-info';header.appendChild(info)}
 const choices=$('choices');
 if(choices){originalChoices={parent:choices.parentNode,next:choices.nextSibling};$('fr54-options').appendChild(choices)}
 const exit=$('fr46-exit-btn');
 if(exit&&!document.getElementById('fr57-room-toolbar')){originalExit=exit.parentNode;originalExitNext=exit.nextSibling;$('fr54-exit-slot').appendChild(exit)}
 $('fr54-tabs').addEventListener('click',event=>{
  const el=event.target.closest('button[data-fr54-tab]');
  if(!el||el.disabled)return;selectedTab=Number(el.dataset.fr54Tab);updateClue();
 });
 return box;
}
function restore(){
 const choices=$('choices');
 if(choices&&originalChoices?.parent){
   const {parent,next}=originalChoices;
   if(next?.parentNode===parent)parent.insertBefore(choices,next);else parent.appendChild(choices);
 }
 originalChoices=null;
 const exit=$('fr46-exit-btn');
 if(exit&&originalExit){
   if(originalExitNext?.parentNode===originalExit)originalExit.insertBefore(exit,originalExitNext);else originalExit.appendChild(exit);
 }
 originalExit=null;originalExitNext=null;
 $('fr54-hunt')?.remove();
 $('fr54-round-info')?.remove();
}
function clearReveal(){
 const box=$('fr54-reveal'),exit=$('fr46-exit-btn');
 if(exit&&box?.contains(exit)){document.body.appendChild(exit);exit.classList.remove('fr55-reveal-exit')}
 box?.remove();
}
function close(){
 if(active){restore();active=false}
 clearReveal();
 document.body.classList.remove('fr54-clues-playing','fr54-clues-reveal');
 latest=null;lastId='';visible=1;selectedTab=0;
}
function localize(){
 if(!$('fr54-hunt'))return;
 $('fr54-title').textContent=T('مين النجم؟','WHO IS THE STAR?');
 const badge=$('challengeBadge');if(badge)badge.innerHTML='<strong>'+T('التحقيق','CLUE HUNT')+'</strong><small>'+T('CLUE HUNT','WHO AM I?')+'</small>';
 $('fr54-section').textContent=T('الأدلة السرية','SECRET CLUES');
 $('fr54-answer-title').textContent=T('اختار النجم الصحيح','CHOOSE THE STAR');
 $('fr54-timer-note').textContent=T('كل دليل بيكشف جزء من السر','EACH CLUE BRINGS YOU CLOSER');
 $('fr54-difficulty').textContent=T('تحقيق كروي','FOOTBALL MYSTERY');
 updateClue();
}
function updateClue(){
 if(!latest||!$('fr54-hunt'))return;
 const q=latest.question, count=Math.min(3,q.hints.length),hints=q.hints;
 visible=Math.max(1,count);
 if(selectedTab>=visible)selectedTab=visible-1;
 const tabs=$('fr54-tabs');tabs.replaceChildren();
 for(let i=0;i<3;i++){
  const opened=i<visible,btn=document.createElement('button');
  btn.type='button';btn.dataset.fr54Tab=String(i);btn.disabled=!opened;
  btn.className='fr54-tab'+(opened?' fr54-unlocked':'')+(i===selectedTab?' fr54-current':'');
  btn.innerHTML='<span aria-hidden="true">'+(opened?'✦':'🔒')+'</span>'+T('دليل '+(i+1),'CLUE '+(i+1));
  btn.setAttribute('aria-pressed',String(i===selectedTab));
  btn.setAttribute('aria-label',T('الدليل '+(i+1)+(opened?' مفتوح':' مغلق'),'Clue '+(i+1)+(opened?' revealed':' locked')));
  tabs.appendChild(btn);
 }
 const hard=[T('صعب','HARD'),T('متوسط','MEDIUM'),T('قوي','STRONG')];
 $('fr54-level').textContent=T('الدليل ','CLUE ')+(selectedTab+1)+' · '+hard[selectedTab];
 $('fr54-copy').textContent=hints[selectedTab]?.text||T('جاري كشف الدليل','Waiting for clue');
 $('fr54-counter').textContent=visible+'/3 '+T('أدلة مفتوحة','clues revealed');
 $('fr54-multiplier').textContent='×'+Math.max(1,4-visible)+' '+T('مضاعف','MULTIPLIER');
}
function decorateOptions(q){
 const buttons=[...document.querySelectorAll('#fr54-options .answer')];
 buttons.forEach((b,i)=>{
  let name=b.querySelector('.fr54-answer-name');
  if(!name){
    // Keep the original delegated answer button and its data-choice intact.
    let raw=[...b.childNodes].filter(x=>x.nodeType===3);
    raw.forEach(x=>x.remove());
    name=document.createElement('span');name.className='fr54-answer-name';
    b.appendChild(name);
  }
  name.textContent=q.options?.[i]||'—';
  let portrait=b.querySelector('.fr54-answer-avatar');
  if(!portrait){portrait=document.createElement('span');portrait.className='fr54-answer-avatar';portrait.setAttribute('aria-hidden','true');b.appendChild(portrait)}
  portrait.style.backgroundImage='none';
  if(!setSprite(portrait,q.optionArt?.[i])){
    portrait.textContent='★';portrait.style.display='grid';portrait.style.placeItems='center';portrait.style.color='#e8c376';
  }else{portrait.textContent='';portrait.style.display='block'}
 });
}
function question(d){
 if(d?.stage!=='question'||d?.question?.type!=='clues'){
  if(active||document.body.classList.contains('fr54-clues-reveal'))close();return;
 }
 clearReveal();
 if(!mount())return;
 active=true;latest=d;
 document.body.classList.remove('fr54-clues-reveal');document.body.classList.add('fr54-clues-playing');
 const id=d.room+':'+d.question.round;
 if(id!==lastId){lastId=id;selectedTab=0;visible=1}
 const count=Math.max(1,Math.min(3,d.question.hints?.length||1));
 if(count>visible)selectedTab=count-1;
 decorateOptions(d.question);
 if($('fr54-round-info'))$('fr54-round-info').innerHTML='<small>'+T('الجولة','ROUND')+'</small><b dir="ltr">'+Number(d.question.round)+' / '+Number(d.total)+'</b>';
 localize();
 const sync=$('fr54-sync');
 if(sync){sync.textContent=T('✓ تمت المزامنة','✓ SYNCED');sync.dataset.offline=$('offline')?.hidden===false?'true':'false'}
 const timer=$('timer'),orb=$('fr54-timer');
 if(timer&&orb)orb.textContent=timer.textContent;
}
function reveal(d){
 if(!d||d.stage!=='reveal'||d.question?.type!=='clues')return;
 if(active)restore();active=false;latest=null;
 document.body.classList.remove('fr54-clues-playing');document.body.classList.add('fr54-clues-reveal');
 const panel=document.querySelector('#reveal .panel.reveal');
 if(!panel)return;
 $('fr54-reveal')?.remove();
 const q=d.question,r=q.reveal;if(!r)return;
 const role=d.role==='guest'?1:0,correct=r.correct===r.chosen?.[role];
 const box=document.createElement('section');box.className='fr54-reveal';box.id='fr54-reveal';
 box.innerHTML='<div class="fr54-reveal-kicker">FOOTBALL RIVALS · CLUE HUNT</div><div class="fr54-reveal-head" id="fr54-result-head"></div>'+
 '<div class="fr54-result-art" id="fr54-result-art"><div class="fr54-result-card" id="fr54-result-card"></div></div>'+
 '<div class="fr54-result-name" id="fr54-result-name"></div><div class="fr54-result-meta" id="fr54-result-meta"></div>'+
 '<div class="fr55-used-clues" id="fr55-used-clues"><h3 id="fr55-used-title"></h3><div id="fr55-used-items"></div></div>'+'<div class="fr54-review"><div class="fr54-review-title" id="fr54-review-title"></div><div class="fr54-review-grid" id="fr54-review-grid"></div></div>'+
 '<div class="fr54-review-points" id="fr54-reveal-points"></div>'+'<div class="fr55-reveal-footer" id="fr55-reveal-footer"><span class="fr55-reveal-next" id="fr55-reveal-next"></span><span id="fr55-reveal-exit"></span></div>';
 panel.appendChild(box);
 $('fr54-result-head').textContent=correct?T('✓ إجابة صحيحة!','✓ CORRECT ANSWER!'):T('★ النجم اتكشف!','★ STAR REVEALED!');
 $('fr54-result-name').textContent=r.name||'—';
 const meta=$('fr54-result-meta');
 [r.positionAr||r.position||'',r.country||''].filter(Boolean).forEach(x=>{const s=document.createElement('span');s.textContent=x;meta.appendChild(s)});
 const mult=r.multiplier?.[role]||1;
 $('fr54-reveal-points').textContent=correct?('+'+Number(r.points?.[role]||0).toLocaleString('en-US')+' '+T('نقطة','POINTS')+' · ×'+mult):T('بدون نقاط لهذه الجولة','NO POINTS THIS ROUND');
 $('fr55-used-title').textContent=T('الأدلة التي ظهرت أثناء الجولة','CLUES REVEALED THIS ROUND');
 const hints=q.hints||[],shown=correct?Math.max(1,4-mult):Math.max(1,Math.min(3,hints.length));
 hints.slice(0,3).forEach((h,i)=>{const el=document.createElement('div');el.className='fr55-used-clue'+(i<shown?' is-used':'');const num=document.createElement('b');num.textContent=String(i+1);const content=document.createElement('span');content.textContent=h.text||'';el.append(num,content);$('fr55-used-items').appendChild(el)});
 $('fr55-reveal-next').textContent=T('الجولة التالية تبدأ تلقائيًا','NEXT ROUND STARTS AUTOMATICALLY');
 const exit=$('fr46-exit-btn');if(exit&&!document.getElementById('fr57-room-toolbar')){$('fr55-reveal-exit').appendChild(exit);exit.classList.add('fr55-reveal-exit')}
 const art=r.photo;const canvas=$('fr54-result-art'),card=$('fr54-result-card');
 if(setSprite(card,art)){
  canvas.classList.add('has-art');
  const preload=new Image();
  preload.onload=()=>{if(preload.naturalWidth&&preload.naturalHeight)canvas.style.setProperty('--fr54-reveal-ratio',String((preload.naturalWidth/art.cols)/(preload.naturalHeight/art.rows)))};
  preload.src=art.file;
 }else if(typeof r.portrait==='string'&&/^\/assets\/players\/career\/[a-z0-9_-]+\.webp$/.test(r.portrait)){
  canvas.classList.add('has-art');card.style.backgroundImage='url("'+r.portrait+'")';
  card.style.backgroundSize='contain';card.style.backgroundPosition='center';
 }
 $('fr54-review-title').textContent=T('مراجعة الاختيارات','ANSWER REVIEW');
 (q.options||[]).forEach((name,i)=>{
  const el=document.createElement('div');el.className='fr54-review-choice'+(i===r.correct?' correct':i===r.chosen?.[role]?' wrong':'');
  el.textContent='ABCD'[i]+' · '+name+(i===r.correct?' ✓':'');
  $('fr54-review-grid').appendChild(el);
 });
}
function screen(id){if(id!=='play'&&id!=='reveal')close();else if(id==='reveal'&&active){restore();active=false;document.body.classList.remove('fr54-clues-playing')}}
window.FR54ClueHunt={question,reveal,screen};
new MutationObserver(()=>{if(active)localize()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
setInterval(()=>{if(!active)return;const t=$('timer'),orb=$('fr54-timer');if(t&&orb)orb.textContent=t.textContent;const sync=$('fr54-sync');if(sync){const offline=$('offline')?.hidden===false;sync.dataset.offline=String(offline);sync.textContent=offline?T('⚠ جار الاتصال','⚠ RECONNECTING'):T('✓ تمت المزامنة','✓ SYNCED')}},170);
})();