/* FR49 — dynamic career result with independent real portraits. */
(()=>{'use strict';
const career=window.FR47Career;if(!career||career.fr49Enhanced)return;
career.fr49Enhanced=true;const oldReveal=career.reveal,$=id=>document.getElementById(id),en=()=>document.documentElement.lang==='en';
const T=(ar,english)=>en()?english:ar;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const flags={'مصر':'🇪🇬','السنغال':'🇸🇳','فرنسا':'🇫🇷','بولندا':'🇵🇱','بلجيكا':'🇧🇪','ألمانيا':'🇩🇪','ويلز':'🏴','هولندا':'🇳🇱','البرازيل':'🇧🇷','إسبانيا':'🇪🇸','نيجيريا':'🇳🇬','ساحل العاج':'🇨🇮','كوت ديفوار':'🇨🇮','الأرجنتين':'🇦🇷','البرتغال':'🇵🇹','إنجلترا':'🏴','إيطاليا':'🇮🇹','الكاميرون':'🇨🇲','المغرب':'🇲🇦','الغابون':'🇬🇦','كرواتيا':'🇭🇷','النرويج':'🇳🇴','غانا':'🇬🇭','الجزائر':'🇩🇿','الأوروغواي':'🇺🇾','أوروغواي':'🇺🇾'};
const posEN={GK:'Goalkeeper',CB:'Centre Back',RB:'Right Back',LB:'Left Back',DM:'Defensive Mid',CM:'Midfielder',AM:'Attacking Mid',RW:'Right Winger',LW:'Left Winger',ST:'Striker',FW:'Forward'};
let lastKey='',ready=false;
function mount(){
 const scene=$('fr47-reveal-scene');if(!scene||ready)return;
 const legacy=document.createElement('div');legacy.className='fr49-legacy';legacy.setAttribute('aria-hidden','true');
 while(scene.firstChild)legacy.append(scene.firstChild);scene.append(legacy);
 const stage=document.createElement('div');stage.id='fr49-result';stage.className='fr49-result';
 stage.innerHTML=[
 '<button type="button" class="fr49-exit" id="fr49-exit">✕ إنهاء</button>',
 '<div class="fr49-starline" aria-hidden="true">✦ <span>FOOTBALL RIVALS</span> ✦</div>',
 '<div class="fr49-result-banner" id="fr49-result-banner"><span class="fr49-check">✓</span><span id="fr49-headline"></span></div>',
 '<div class="fr49-reveal-layout">',
 '<aside class="fr49-career-history" aria-label="مسيرة اللاعب"><span class="fr49-aside-title" id="fr49-career-title"></span><div id="fr49-career-logos" class="fr49-career-logos"></div></aside>',
 '<div class="fr49-portrait-frame"><div class="fr49-card-gold"></div><div class="fr49-photo-glow"></div>',
 '<div class="fr49-photo-wrap"><div class="fr49-photo-loading" id="fr49-photo-loading" aria-hidden="true">✦</div><img id="fr49-player-photo" alt="" width="246" height="239" decoding="async" fetchpriority="high"></div>',
 '<div class="fr49-sparkle fr49-sp1" aria-hidden="true">✦</div><div class="fr49-sparkle fr49-sp2" aria-hidden="true">✦</div>',
 '<div class="fr49-player-label"><strong id="fr49-player-name"></strong><span id="fr49-player-latin"></span></div></div>',
 '<aside class="fr49-biography" aria-label="معلومات اللاعب"><div class="fr49-meta-cell"><span id="fr49-country-flag" class="fr49-big-flag" aria-hidden="true">⚽</span><span id="fr49-country-caption"></span><b id="fr49-country"></b></div><div class="fr49-meta-separator"></div>',
 '<div class="fr49-meta-cell"><span class="fr49-field-icon" aria-hidden="true">▦</span><span id="fr49-position-caption"></span><b id="fr49-position"></b></div></aside></div>',
 '<div class="fr49-rewards"><div class="fr49-reward"><span id="fr49-round-label"></span><b id="fr49-points">+0</b></div><div class="fr49-reward fr49-multiplier"><span id="fr49-multi-label"></span><b id="fr49-mult">×1</b></div></div>',
 '<section class="fr49-review" aria-label="مراجعة الاختيارات"><h3><span aria-hidden="true">⌕</span> <span id="fr49-review-title"></span></h3><div id="fr49-options" class="fr49-options"></div></section>',
 '<div class="fr49-next-slot" id="fr49-next-slot"></div>'
 ].join('');
 scene.append(stage);
 const next=$('fr47-next'),status=$('fr47-next-status');
 if(next){next.classList.add('fr49-next-button');$('fr49-next-slot').append(next)}
 if(status){status.classList.add('fr49-next-status');$('fr49-next-slot').after(status)}
 scene.classList.add('fr49-upgraded');$('fr49-exit')?.addEventListener('click',()=>window.FR46RoomExit?.ask());ready=true;
}
function paint(d){
 if(!d||d.stage!=='reveal'||d.question?.type!=='clubs'||!d.question.reveal)return;
 mount();const q=d.question,r=q.reveal,role=d.role==='host'?0:1,correct=r.chosen?.[role]===r.correct,key=d.room+':'+q.round+':'+role;
 if(key===lastKey)return;lastKey=key;
 document.body.classList.add('fr49-result-live');
 $('fr49-result-banner').classList.toggle('is-correct',correct);$('fr49-result-banner').classList.toggle('is-wrong',!correct);
 $('fr49-headline').textContent=correct?T('إجابة صحيحة!','CORRECT ANSWER!'):T('النجم اتكشف!','THE STAR IS REVEALED!');
 $('fr49-player-name').textContent=r.name||'';$('fr49-player-latin').textContent=r.latinName||'';
 const portrait=$('fr49-player-photo'),pending=$('fr49-photo-loading');
 portrait.classList.remove('loaded','failed');portrait.removeAttribute('src');pending.hidden=false;pending.textContent='✦';
 portrait.alt=T('صورة '+(r.name||'اللاعب'),'Portrait of '+(r.latinName||r.name||'player'));
 if(typeof r.portrait==='string'&&/^\/assets\/players\/career\/[a-z0-9_-]+\.webp$/.test(r.portrait)){
  portrait.onload=()=>{portrait.classList.add('loaded');pending.hidden=true};
  portrait.onerror=()=>{portrait.classList.add('failed');pending.textContent='★'};
  portrait.src=r.portrait;
  if(portrait.complete&&portrait.naturalWidth>0){portrait.classList.add('loaded');pending.hidden=true}
 }else{portrait.classList.add('failed');pending.textContent='★'}
 $('fr49-country-flag').textContent=flags[r.country]||'🌍';
 $('fr49-country-caption').textContent=T('الجنسية','NATIONALITY');$('fr49-country').textContent=r.country||'—';
 $('fr49-position-caption').textContent=T('المركز','POSITION');$('fr49-position').textContent=en()?(posEN[r.position]||r.position||'—'):(r.positionAr||r.position||'—');
 $('fr49-career-title').textContent=T('مسيرته في المود','CAREER ROUTE');
 const clubList=$('fr49-career-logos');clubList.replaceChildren();
 for(const [i,club] of (r.career||[]).slice(0,3).entries()){
  const row=document.createElement('div');row.className='fr49-club-row';
  row.innerHTML=(club.logo?'<img src="'+esc(club.logo)+'" alt="'+esc(club.name)+'" loading="eager" referrerpolicy="no-referrer">':'<span class="fr49-no-logo">⚽</span>')+'<span>'+esc(club.name||'')+'</span>';
  if(club.logo)row.querySelector('img').onerror=function(){this.remove();row.insertAdjacentHTML('afterbegin','<span class="fr49-no-logo">⚽</span>')};
  clubList.append(row);
  if(i<Math.min(2,(r.career||[]).length-1)){let arrow=document.createElement('i');arrow.className='fr49-path-arrow';arrow.textContent='⌄';clubList.append(arrow)}
 }
 $('fr49-round-label').textContent=T('نقاط الجولة','ROUND SCORE');$('fr49-multi-label').textContent=T('مضاعف الشعارات','CAREER MULTIPLIER');
 $('fr49-points').textContent='+'+Number(r.points?.[role]||0).toLocaleString('en-US');
 $('fr49-mult').textContent='×'+Number(r.multiplier?.[role]||1);
 $('fr49-exit').textContent=T('✕ إنهاء','✕ Exit');
 $('fr49-review-title').textContent=T('مراجعة الاختيارات','ANSWER REVIEW');
 const options=$('fr49-options');options.replaceChildren();
 (q.options||[]).forEach((name,i)=>{
  const row=document.createElement('div');row.className='fr49-option';
  if(i===r.correct)row.classList.add('correct');
  else if(i===r.chosen?.[role])row.classList.add('wrong');
  const mark=i===r.correct?'✓':i===r.chosen?.[role]?'✕':'';
  row.innerHTML='<span class="fr49-option-letter">'+String.fromCharCode(65+i)+'</span><span class="fr49-option-name">'+esc(name)+'</span><span class="fr49-option-mark" aria-hidden="true">'+mark+'</span>';
  options.append(row);
 });
 $('fr47-next-label').textContent=T('الجولة التالية','NEXT ROUND');
 $('fr47-next').setAttribute('aria-label',T('الانتقال للجولة التالية','Go to next round'));
}
career.reveal=function(d){oldReveal.call(career,d);paint(d)};
})();