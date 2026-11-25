/* FR47 CAREER PATH — real UI bound to authoritative STARVERSE state. */
(()=>{'use strict';if(window.FR47Career)return;
const $=id=>document.getElementById(id),T=(ar,e)=>document.documentElement.lang==='en'?e:ar;
let state=null,renderedResult='',nextBusy=false;
function makeIntro(){
 if($('fr47-intro'))return;
 const el=document.createElement('section');el.className='fr47-intro';el.id='fr47-intro';
 el.innerHTML='<div class="fr47-kicker">⚡ FOOTBALL RIVALS · STAR ARENA</div>'+
 '<div class="fr47-intro-badge"><span>🛡</span><b>CAREER PATH</b><small>مسيرة اللاعب</small></div>'+
 '<div class="fr47-demo-crests">'+
 '<div class="fr47-demo-card"><img src="https://crests.football-data.org/524.png" referrerpolicy="no-referrer" alt="باريس سان جيرمان"><small>PSG</small></div>'+
 '<div class="fr47-demo-card active"><img src="https://crests.football-data.org/86.png" referrerpolicy="no-referrer" alt="ريال مدريد"><small>REAL</small></div>'+
 '<div class="fr47-demo-card"><img src="https://crests.football-data.org/559.png" referrerpolicy="no-referrer" alt="إشبيلية"><small>SEVILLA</small></div></div>'+
 '<h2 id="fr47-intro-title"></h2><p id="fr47-intro-desc"></p>'+
 '<div class="fr47-intro-tip"><b>✦ ×3</b><span id="fr47-tip-text"></span></div>'+
 '<div class="fr47-intro-stats"><span>🔥 <b>×3</b><small id="fr47-stat-mult"></small></span>'+
 '<span>★ <b>+ POINTS</b><small id="fr47-stat-score"></small></span>'+
 '<span>⏱ <b id="fr47-intro-time">20</b><small id="fr47-stat-seconds"></small></span></div>'+
 '<button id="fr47-start" type="button"><span id="fr47-start-label">ابدأ الجولة</span> <span aria-hidden="true">◀</span></button>'+
 '<p id="fr47-settings-note"></p>';
 $('setup')?.querySelector('.setup-panel')?.before(el);
 $('fr47-start')?.addEventListener('click',()=>$('create')?.click());
 el.addEventListener('error',e=>{if(e.target.matches('.fr47-demo-card img'))e.target.closest('.fr47-demo-card').classList.add('missing-logo')},true);
}
function syncSetup(){
 const show=!!$('setup')&&!$('setup').hidden&&!!document.querySelector('#setup [data-mode="clubs"].active');
 document.body.classList.toggle('fr47-career-setup',show);
 if(!show)return;makeIntro();
 $('fr47-intro-title').textContent=T('اكتشف اللاعب من مسيرته','Discover the player from their career');
 $('fr47-intro-desc').textContent=T('الشعارات بتظهر واحدة ورا التانية. كل ما تجاوب بدري، تضاعف نقاطك.','Club crests appear one by one. Answer early to earn more points.');
 $('fr47-tip-text').textContent=T('أعلى مكافأة عند معرفة اللاعب من أول شعار','Top multiplier for guessing from the first crest');
 $('fr47-stat-mult').textContent=T('مضاعف','MULTIPLIER');$('fr47-stat-score').textContent=T('كل جولة','PER ROUND');
 $('fr47-stat-seconds').textContent=T('ثانية','SECONDS');
 $('fr47-settings-note').textContent=T('⚙ اضبط الجولات والوقت والمنافسة من الإعدادات بالأسفل','⚙ Adjust rounds, time and match type in the settings below');
 $('fr47-intro-time').textContent=$('seconds')?.value||'20';
 const duo=!!document.querySelector('#setup [data-set-play="duo"].active');
 $('fr47-start-label').textContent=T(duo?'إنشاء غرفة التحدي':'ابدأ الجولة',duo?'Create challenge room':'Start round');
}
function mountHud(){
 if($('fr47-hud'))return;
 const h=document.createElement('div');h.className='fr47-hud';h.id='fr47-hud';
 h.innerHTML='<div class="fr47-stat"><span id="fr47-round-caption">الجولة</span><b id="fr47-round-num">1/10</b></div>'+
 '<div class="fr47-stat fr47-time"><span id="fr47-time-caption">الوقت</span><b id="fr47-time-num">20.0</b></div>'+
 '<div class="fr47-stat"><span id="fr47-score-caption">النقاط</span><b id="fr47-score-num">0</b></div>'+
 '<div class="fr47-stat fr47-flame"><span id="fr47-combo-caption">مضاعفك</span><b id="fr47-combo-num">×3</b></div>';
 $('play')?.querySelector('.game-top')?.before(h);
 const panel=$('play')?.querySelector('.question-panel');
 const menu=document.createElement('button');menu.id='fr47-menu';menu.className='fr47-menu';menu.type='button';menu.textContent='⋯';
 menu.setAttribute('aria-label','إنهاء المباراة والخروج');menu.addEventListener('click',()=>window.FR46RoomExit?.ask());panel?.prepend(menu);
 const badge=document.createElement('div');badge.id='fr47-mode-banner';badge.className='fr47-mode-banner';
 badge.innerHTML='<span class="fr47-shield">🛡</span><strong>CAREER PATH</strong><small>مسيرة اللاعب</small>';
 $('challengeIcon')?.before(badge);
 const steps=document.createElement('div');steps.id='fr47-timeline';steps.className='fr47-timeline';
 steps.innerHTML='<span class="fr47-line"></span><i data-fr47-step="0">1</i><i data-fr47-step="1">2</i><i data-fr47-step="2">3</i>';
 $('hints')?.before(steps);
 const award=document.createElement('div');award.id='fr47-bonus';award.className='fr47-bonus';
 award.innerHTML='<span>★</span><b id="fr47-bonus-multi">×3</b><span id="fr47-bonus-text"></span>';
 $('choices')?.before(award);
}
function mountReveal(){
 if($('fr47-reveal-scene'))return;
 const panel=$('reveal')?.querySelector('.panel.reveal');if(!panel)return;
 const div=document.createElement('div');div.id='fr47-reveal-scene';div.className='fr47-reveal-scene';
 div.innerHTML='<div id="fr47-reveal-banner" class="fr47-reveal-banner">✓ إجابة صحيحة!</div>'+
 '<div class="fr47-foil-card"><div class="fr47-foil-inner"><div class="fr47-halo"></div>'+
 '<div class="fr47-player-art" id="fr47-player-art"></div><div id="fr47-card-placeholder" class="fr47-player-placeholder">★</div>'+
 '<div class="fr47-foil-caption"><strong id="fr47-player-name">—</strong><span id="fr47-player-country"></span></div></div></div>'+
 '<div class="fr47-rewards"><div><span id="fr47-award-type"></span><b id="fr47-award-points">+0</b></div>'+
 '<div><span id="fr47-combo-type"></span><b id="fr47-award-mult">×1</b></div></div>'+
 '<button type="button" id="fr47-next"><span id="fr47-next-label">الجولة التالية</span> ◀</button>'+
 '<p id="fr47-next-status" role="status"></p>';
 panel.prepend(div);$('fr47-next')?.addEventListener('click',next);
}
function updateHUD(d){
 const q=d.question,me=d.role==='host'?0:1;
 $('fr47-round-num').textContent=q.round+'/'+d.total;
 $('fr47-score-num').textContent=(d.score?.[me]||0).toLocaleString('en-US');
 $('fr47-combo-num').textContent='×'+(q.clubMultiplier||1);
 $('fr47-round-caption').textContent=T('الجولة','ROUND');$('fr47-time-caption').textContent=T('الوقت','TIME');
 $('fr47-score-caption').textContent=T('نقاطك','SCORE');$('fr47-combo-caption').textContent=T('مضاعفك','MULTIPLIER');
 $('fr47-bonus-text').textContent=T('كل شعار إضافي يقلل المكافأة. جاوب بدري!','Each new crest reduces your multiplier. Guess early!');
 $('fr47-bonus-multi').textContent='×'+(q.clubMultiplier||1);
 $('fr47-mode-banner').querySelector('small').textContent=T('مسيرة اللاعب','Career path');
 $('fr47-menu').setAttribute('aria-label',T('إنهاء المباراة والخروج','End match and exit'));
 $('fr47-timeline')?.querySelectorAll('[data-fr47-step]').forEach((n,i)=>{const lit=i<q.hints.length;n.classList.toggle('lit',lit);n.textContent=lit?'✓':String(i+1)});
 document.body.classList.toggle('fr50-two-club',q.clubSlots===2);
 $('fr47-timeline')?.querySelectorAll('[data-fr47-step]').forEach((n,i)=>n.hidden=i>=(q.clubSlots||3));
 const grid=$('hints');if(grid){
  grid.querySelectorAll('.fr47-crest-locked').forEach(n=>n.remove());
  for(let i=q.hints.length;i<(q.clubSlots||3);i++){const e=document.createElement('div');e.className='fr47-crest-locked';e.innerHTML='<span>?</span><small>'+T('المحطة '+(i+1),'STOP '+(i+1))+'</small>';grid.append(e)}
  grid.querySelectorAll('.hint.club').forEach((n,i)=>n.setAttribute('data-fr47-index',String(i+1)));
 }
}
function tick(){
 if(!document.body.classList.contains('fr47-career-play')||!state?.question)return;
 const offset=state.serverTime-state.receivedAt,remaining=Math.max(0,(state.question.deadline-(Date.now()+offset))/1000);
 const timer=$('fr47-time-num');if(timer){timer.textContent=remaining.toFixed(1);timer.classList.toggle('urgent',remaining<5)}
}
function question(d){
 if(d?.question?.type!=='clubs'){document.body.classList.remove('fr47-career-play');state=null;return}
 mountHud();mountReveal();document.body.classList.remove('fr47-career-reveal','fr47-career-setup');
 document.body.classList.add('fr47-career-play');state={...d,receivedAt:Date.now()};updateHUD(d);tick();
}
const FLAG={'مصر':'🇪🇬','إسبانيا':'🇪🇸','البرتغال':'🇵🇹','فرنسا':'🇫🇷','الأرجنتين':'🇦🇷','البرازيل':'🇧🇷','ألمانيا':'🇩🇪','هولندا':'🇳🇱','بلجيكا':'🇧🇪','كرواتيا':'🇭🇷','السنغال':'🇸🇳','المغرب':'🇲🇦','النرويج':'🇳🇴','إيطاليا':'🇮🇹','بولندا':'🇵🇱','نيجيريا':'🇳🇬'};
function reveal(d){
 if(d?.question?.type!=='clubs'){document.body.classList.remove('fr47-career-reveal');return}
 mountReveal();document.body.classList.remove('fr47-career-play','fr47-career-setup');document.body.classList.add('fr47-career-reveal');state=null;
 const q=d.question,r=q.reveal,me=d.role==='host'?0:1,correct=r.chosen[me]===r.correct,key=d.room+':'+q.round;
 if(renderedResult===key)return;renderedResult=key;
 $('fr47-reveal-banner').classList.toggle('correct',correct);
 $('fr47-reveal-banner').textContent=correct?T('✓ إجابة صحيحة!','✓ CORRECT ANSWER!'):T('★ النجم هو...','★ THE STAR IS...');
 $('fr47-player-name').textContent=r.name||'—';$('fr47-player-country').textContent=(FLAG[r.country]||'⚽')+' '+(r.country||'');
 const photo=r.photo,art=$('fr47-player-art');
 if(photo?.file){
  const x=photo.cols>1?photo.col*100/(photo.cols-1):0,y=photo.rows>1?photo.row*100/(photo.rows-1):0;
  art.style.backgroundImage='url('+JSON.stringify(photo.file)+')';art.style.backgroundSize=(photo.cols*100)+'% '+(photo.rows*100)+'%';
  art.style.backgroundPosition=x+'% '+y+'%';$('fr47-card-placeholder').hidden=true;
 }else{art.style.backgroundImage='none';$('fr47-card-placeholder').hidden=false}
 $('fr47-award-type').textContent=T('نقاط الجولة','ROUND POINTS');$('fr47-combo-type').textContent=T('مضاعف المسيرة','CAREER MULTIPLIER');
 $('fr47-award-points').textContent='+'+Number(r.points?.[me]||0).toLocaleString('en-US');
 $('fr47-award-mult').textContent='×'+(r.multiplier?.[me]||1);
 $('fr47-next').disabled=false;nextBusy=false;
 $('fr47-next-label').textContent=T('الجولة التالية','Next round');
 $('fr47-next-status').textContent=T(d.solo?'الجولة التالية هتبدأ تلقائيًا':'اضغط التالي أو استنى الانتقال التلقائي','Next round starts automatically');
}
async function next(){
 if(nextBusy)return;let a;try{a=JSON.parse(localStorage.getItem('fr:starverse:v2:active')||'null')}catch{}
 if(!a?.room||!a?.token)return;nextBusy=true;$('fr47-next').disabled=true;
 $('fr47-next-status').textContent=T('جاري الانتقال...','Preparing next round…');
 try{
  const response=await fetch('/api/rivals-core',{method:'POST',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({op:'svNext',room:a.room,token:a.token})});
  const r=await response.json();if(!r.ok||!response.ok)throw Error(r.error||'Network error');
  $('fr47-next-status').textContent=r.stage==='reveal'?T('تم تسجيل جاهزيتك، في انتظار المنافس','Ready. Waiting for opponent'):T('جاهز للجولة التالية','Ready for the next round');
 }catch(e){$('fr47-next-status').textContent=T('الاتصال اتأخر، الانتقال التلقائي شغال','Connection delayed, auto-advance remains active');$('fr47-next').disabled=false;nextBusy=false}
}
function screen(id){
 if(id!=='play')document.body.classList.remove('fr47-career-play');
 if(id!=='reveal')document.body.classList.remove('fr47-career-reveal');
 requestAnimationFrame(syncSetup);
}
function init(){
 makeIntro();mountHud();mountReveal();syncSetup();
 document.addEventListener('click',e=>{if(e.target.closest('[data-mode],[data-set-play],[data-nav],#again'))setTimeout(syncSetup,0)});
 $('seconds')?.addEventListener('change',syncSetup);$('rounds')?.addEventListener('change',syncSetup);
 new MutationObserver(syncSetup).observe($('setup'),{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(syncSetup).observe(document.querySelector('[data-mode="clubs"]'),{attributes:true,attributeFilter:['class']});
 new MutationObserver(syncSetup).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 setInterval(tick,160);
}
window.FR47Career={screen,question,reveal,syncSetup};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();