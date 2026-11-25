(()=>{'use strict';
const API='/api/auction-ultimate',app=document.getElementById('ux-app'),KEY='fr:uxi:room:v1';
let uxEntryChosen=false;
let code=null,token=null,data=null,formKind='ai',lang='ar',poller=null,loading=false,stamp='',gameTimer=null,playSpeed=1,localMatchStart=0,skipped=false;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(ar,en)=>lang==='en'?en:ar;
function nameVal(){return String(localStorage.getItem('fr:pentagon:name')||localStorage.getItem('fr:uxi:name')||'').trim()}
function getLocal(c){try{return localStorage.getItem(KEY+':'+c)}catch{return null}}
function setLocal(c,t){try{localStorage.setItem(KEY+':'+c,t)}catch(e){}}
function storeName(s){try{localStorage.setItem('fr:uxi:name',String(s).trim().slice(0,28));localStorage.setItem('fr:pentagon:name',String(s).trim().slice(0,28))}catch(e){}}
function pref(){try{return localStorage.getItem('fr:cards:includeWomen:v1')!=='false'}catch{return true}}
function msg(s,type='error'){let x=$('#ux-message');if(!x){x=document.createElement('div');x.id='ux-message';app.prepend(x)}x.textContent=s;x.className=type==='error'?'ux-error':'ux-panel ux-success'}
function url(code){return location.origin+'/auction/ultimate/?room='+code}
async function request(op,other={},quiet=false){if(loading&&!quiet)return;try{if(!quiet)loading=true;const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({op,code,token,...other})}),j=await r.json();if(!j.ok){if(!quiet)msg(j.error==='CARD_NO_LONGER_AVAILABLE'?tr('المنافس اختار الكارت ده، اختار كارت تاني.','Your opponent already chose this card. Pick another.'):tr('تعذّر الإجراء: ','Action failed: ')+j.error);return null}if(j.token){code=j.room.code;token=j.token;setLocal(code,token);history.replaceState({},'',url(code))}data=j;paint();fr93UltimateMaybeSync();return j}catch(e){if(!quiet)msg(tr('تحقق من الاتصال ثم جرّب مرة ثانية.','Check your connection and try again.'));return null}finally{loading=false}}
function startPolling(){if(poller)clearInterval(poller);poller=setInterval(()=>{if(code&&token&&!document.hidden&&!loading)request('state',{},true);drawClock()},1200)}
function cardCss(c){const s=c&&c.sprite;if(!s||typeof s.file!=='string'||!/^assets\/[\w\/.-]+\.(webp|png|jpg)$/i.test(s.file))return '';const col=Math.min(20,Math.max(1,+s.cols||1)),rows=Math.min(20,Math.max(1,+s.rows||1)),x=col===1?50:Math.round(100*(+s.col||0)/(col-1)),y=rows===1?50:Math.round(100*(+s.row||0)/(rows-1));return 'background-image:url(/cloud-v5/'+s.file+');background-size:'+(col===1&&rows===1?'contain':col*100+'% '+rows*100+'%')+';background-repeat:no-repeat;background-position:'+x+'% '+y+'%'}
function playerCard(c,compact=false){if(c?.sprite?.cols===1&&c?.sprite?.rows===1)return '<div class="ux-playerart"><div class="ux-sprite" style="'+esc(cardCss(c))+'"></div></div>';if(!c)return '<div class="ux-playerart"><div class="ux-card-text">'+tr('مجاني','Free')+'</div></div>';return '<div class="ux-playerart"><div class="ux-sprite" style="'+esc(cardCss(c))+'"></div><span class="ux-ovr">'+esc(c.ovr)+'</span><div class="ux-card-text"><strong>'+esc(c.name)+'</strong><small>'+esc(c.pos)+(c.free?' · '+tr('مجاني','FREE'):'')+'</small></div></div>'}
function hero(){return "<section class=\"entry-screen fr84-entry\" aria-label=\"ULTIMATE XI\">\n<a class=\"entry-back fr84-back\" href=\"/auction/\" aria-label=\"العودة إلى المزاد\">❮</a>\n<span class=\"fr84-mark\">FR</span>\n<h1 class=\"fr84-title\"><span data-ux-lang=\"ar\">مزاد التشكيلة الكاملة</span><span data-ux-lang=\"en\">ULTIMATE XI AUCTION</span><small>ULTIMATE XI AUCTION</small></h1>\n<figure class=\"fr84-cover\"><img src=\"/assets/auction/ultimate/entry-fr83.webp?v=fr84&frb=football-rivals-arena-bundled1124-bibo21_vercel_app\" width=\"1024\" height=\"1280\" alt=\"ULTIMATE XI football players\" fetchpriority=\"high\"></figure>\n<div class=\"fr84-stats\"><div><strong>300M</strong><small data-ux-lang=\"ar\">ميزانية لكل لاعب</small><small data-ux-lang=\"en\">Budget per player</small></div><div><strong>11</strong><small data-ux-lang=\"ar\">جولات مزاد</small><small data-ux-lang=\"en\">Auction rounds</small></div><div><strong>15s</strong><small data-ux-lang=\"ar\">لكل دور</small><small data-ux-lang=\"en\">Per turn</small></div></div>\n<button class=\"entry-cta fr84-start\" data-ux-entry=\"start\" type=\"button\"><span data-ux-lang=\"ar\">ابدأ الآن</span><span data-ux-lang=\"en\">START NOW</span></button>\n<button class=\"entry-rules fr84-rules\" data-ux-entry=\"rules\" type=\"button\"><span data-ux-lang=\"ar\">قواعد اللعبة</span><span data-ux-lang=\"en\">GAME RULES</span></button>\n</section>\n<div class=\"split-2 entry-more fr84-modes\">\n<div class=\"panel mode-card\"><span class=\"tag green\">AI · THREE LEVELS</span><h3><span data-ux-lang=\"ar\">🤖 ضد الذكاء الاصطناعي</span><span data-ux-lang=\"en\">🤖 VS AI</span></h3><p><span data-ux-lang=\"ar\">سهل أو متوسط أو احترافي، بنفس قواعد المزاد.</span><span data-ux-lang=\"en\">Easy, medium or pro.</span></p><button type=\"button\" class=\"btn ghost block\" data-ux-entry=\"ai\"><span data-ux-lang=\"ar\">اختر منافسك</span><span data-ux-lang=\"en\">Choose opponent</span></button></div>\n<div class=\"panel mode-card battle\"><span class=\"tag red\">1 VS 1 · REAL TIME</span><h3><span data-ux-lang=\"ar\">⚔️ مواجهة صديق</span><span data-ux-lang=\"en\">⚔️ FRIEND CHALLENGE</span></h3><p><span data-ux-lang=\"ar\">أنشئ غرفة وشارك الرابط مع منافسك.</span><span data-ux-lang=\"en\">Create and share a room.</span></p><button type=\"button\" class=\"btn ghost block\" data-ux-entry=\"pvp\"><span data-ux-lang=\"ar\">إنشاء غرفة</span><span data-ux-lang=\"en\">Create room</span></button></div>\n</div>\n<details class=\"panel fr84-rulebook\" id=\"ux-fr84-rulebook\"><summary><span data-ux-lang=\"ar\">قواعد مزاد التشكيلة الكاملة بالتفصيل</span><span data-ux-lang=\"en\">ULTIMATE XI detailed rules</span></summary><div class=\"fr84-rulebody\">\n<p><span data-ux-lang=\"ar\">11 جولة مزايدة لكل فريق بميزانية 300 مليون، وبعدها 7 خانات بدلاء، حتى 3 اختيارات بكل خانة حسب المتاح.</span><span data-ux-lang=\"en\">11 auctions, 300M budget, then 7 subs with 3 choices per slot.</span></p>\n<p><span data-ux-lang=\"ar\">مفيش حجز ميزانية إجباري. لو فلوسك خلصت الفريق يكتمل بكروت مجانية. التبديلات تلقائية بحد أقصى 5.</span><span data-ux-lang=\"en\">Spend freely. Free replacements fill your squad; up to five automatic substitutions.</span></p></div></details>";}
function intro(){return fr85Intro();}
function roster(r){let us=r.players[data.you];if(!us)return '';const slots=['GK','RB','CB','CB','LB','CDM','CM','CAM','RW','ST','LW'];const grid=(arr,positions)=>'<div class="ux-rostergrid">'+arr.map((c,i)=>'<div title="'+esc(positions[i]||c.pos)+'">'+playerCard(c,true)+'</div>').join('')+'</div>';return '<details class="ux-roster"><summary>'+tr('تشكيلتي','My squad')+' · '+us.start.length+'/11 '+tr('أساسي','starters')+' · '+us.bench.length+'/7 '+tr('دكة','subs')+'</summary>'+grid(us.start,slots.slice(0,us.start.length))+(us.bench.length?'<h4>'+tr('البدلاء','Bench')+'</h4>'+grid(us.bench,[]):'')+'</details>'}
function status(r){const p=r.players;return '<div class="ux-statusbar"><div><small>'+tr('فريقي','MY TEAM')+'</small><strong>'+esc(p[data.you]?.name)+'</strong><small>'+esc(p[data.you]?.balance)+'M '+tr('متبقي','remaining')+'</small></div><span>VS</span><div><small>'+tr('المنافس','RIVAL')+'</small><strong>'+esc(p[1-data.you]?.name||tr('بانتظار منافس','Waiting'))+'</strong><small>'+esc(p[1-data.you]?.balance??'—')+'M</small></div></div>'}
function progression(done,total=11){return '<div class="ux-progress" aria-label="Progress">'+Array.from({length:total},(_,i)=>'<i class="'+(i<done?'done':i===done?'now':'')+'"></i>').join('')+'</div>'}
function auction(r){return fr87Auction(r);}
function bench(r){return fr88Bench(r);}
function coach(r){return fr85Coach(r);}
function waiting(r){return fr85Waiting(r);}
function match(r){return r.match?.engineVersion==='FR90'?fr90Match(r):fr89Match(r);}
function winner(r){const m=r.match,side=m.winner,p=r.players;return '<div class="ux-mvp"><span class="ux-eyebrow">'+tr('النتيجة النهائية','FINAL SCORE')+'</span><h2>'+esc(p[0].name)+' '+m.score[0]+' - '+m.score[1]+' '+esc(p[1].name)+'</h2>'+(m.pens?'<p>'+tr('ركلات الترجيح','Penalties')+': '+m.pens.join(' - ')+'</p>':'')+'<p>'+tr('الفائز: ','Winner: ')+esc(p[side].name)+'</p><hr style="border:0;border-top:1px solid #d5af56"><span class="ux-eyebrow">MAN OF THE MATCH</span><strong>'+esc(m.mvp.name)+'</strong><p>OVR '+m.mvp.ovr+'</p></div><h3>'+tr('تقييمات اللاعبين','Player ratings')+'</h3><div class="ux-ratings">'+m.ratings.flatMap((arr,side)=>arr.map(x=>'<div class="ux-rating"><span>'+esc(x.name)+'</span><b>'+(x.played===false?'—':x.score.toFixed(1))+'</b></div>')).join('')+'</div><div class="ux-actions"><a class="ux-gold" href="/auction/ultimate/">'+tr('مباراة جديدة','New match')+'</a><a class="ux-outline" href="/auction/">'+tr('العودة للمزاد','Auction modes')+'</a></div>'}
function fr89OldPlayback(){if(!data||data.room.stage!=='match')return;const r=data.room,m=r.match;const min=skipped?90:Math.min(90,Math.max(0,Math.floor((Date.now()-localMatchStart)*playSpeed/m.durationMs*90)));let score=[0,0],shows=[];for(const e of m.events){if(e.minute<=min){score=e.score;shows.push(e)}}$('#ux-score').textContent=score[0]+' - '+score[1];$('#ux-minute').textContent=min+'′';$('#ux-timelinebar').style.width=Math.round(min/90*100)+'%';$('#ux-events').innerHTML=shows.slice(-30).reverse().map(e=>'<div class="ux-event"><b>'+e.minute+'′</b><div><strong>'+esc(e.type==='goal'?'⚽ '+tr('هدف','Goal'):e.type==='sub'?'🔄 '+tr('تبديل','Substitute'):e.type==='yellow'?'🟨 '+tr('إنذار','Yellow card'):tr('فرصة','Chance'))+' · '+esc(e.player?.name)+'</strong><small>'+esc(r.players[e.side].name)+(e.other?' · '+esc(e.other.name):'')+'</small></div></div>').join('');const done=min>=90;const result=$('#ux-result');if(result){result.hidden=!done;if(done&&!result.innerHTML)result.innerHTML=winner(r)}}
function playback(){return data?.room?.match?.engineVersion==='FR90'?fr91Playback():fr89Playback()}
function drawClock(){const el=$('#ux-clock');if(!el||!data)return;const t=Math.max(0,Math.ceil((data.room.expiresAt-Date.now())/1000));el.textContent=t+'s';el.classList.toggle('low',t<=5)}
function paint(){if(!data){intro();return}const r=data.room,fingerprint=[r.stage,r.round,r.benchIndex,r.lead?.side,r.lead?.amount,r.benchPicked?.join(''),r.players.map(x=>x?.balance+':'+x?.ready+(r.stage==='lineup'?':'+x.start.map(c=>c.id).join(',')+':'+x.bench.map(c=>c.id).join(','):'')).join('|'),r.match?.startedAt].join(':');fr87Observe(r);if(stamp===fingerprint){drawClock();return}stamp=fingerprint;if(gameTimer){clearInterval(gameTimer);gameTimer=null}let html='<div class="ux-badges"><span>'+tr('ميزانية 300 مليون','300M BUDGET')+'</span><span>11+7</span><span>ULTIMATE XI</span></div>';if(r.stage==='waiting')html+=waiting(r);else if(r.stage==='lobby')html+=fr86Lobby(r);else if(r.stage==='auction')html+=auction(r);else if(r.stage==='bench')html+=bench(r);else if(r.stage==='lineup')html+=fr89Lineup(r);else if(r.stage==='coach')html+=coach(r);else if(r.stage==='match')html+=match(r);else if(r.stage==='cancelled')html+='<section class="ux-panel"><h3>'+tr('تم إلغاء المباراة','Match cancelled')+'</h3><p>'+tr('تم حفظ حالة الإلغاء للطرفين.','Cancellation is visible to both players.')+'</p><a class="ux-gold" href="/auction/ultimate/">'+tr('ابدأ لعبة جديدة','Start a new game')+'</a></section>';if(['waiting','lobby','auction','bench','lineup','coach','match'].includes(r.stage))html+='<div class="ux-actions ux-room-controls"><button type="button" class="ux-outline" data-action="cancel">'+tr('إلغاء المباراة','Cancel match')+'</button></div>';if(!['waiting','lobby','auction','bench','lineup','coach','match','cancelled'].includes(r.stage))html+='<section class="panel fr86-room"><h3>'+tr('تعذر عرض حالة الغرفة','Room state unavailable')+'</h3><p>'+tr('ابدأ مباراة جديدة إذا انتهت الغرفة.','Start a new game if the room expired.')+'</p><a class="btn gold block" href="/auction/ultimate/?v=fr86">'+tr('ابدأ مباراة جديدة','New game')+'</a></section>';app.innerHTML=html;drawClock();fr88AfterPaint(r);if(r.stage==='match'){if(!localMatchStart)localMatchStart=r.match.startedAt;gameTimer=setInterval(playback,400);playback()}}
async function beginCreate(e){e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')||'').slice(0,28);storeName(name);const opt=window.FR85Choice();const x=await request('create',{name,kind:formKind,difficulty:opt.difficulty,clubId:opt.clubId,theme:opt.theme,includeWomen:pref()});if(x)startPolling()}
async function beginJoin(e){e.preventDefault();const f=new FormData(e.target),name=String(f.get('name')||'').slice(0,28);storeName(name);const x=await request('join',{name,clubId:window.FR85Choice().clubId});if(x)startPolling()}
async function bid(e){e.preventDefault();const val=Number(new FormData(e.target).get('amount'));await request('bid',{amount:val})}
async function ready(e){e.preventDefault();const f=new FormData(e.target);await request('ready',{coach:f.get('coach'),tactic:f.get('tactic')})}
document.addEventListener('submit',e=>{if(e.target.id==='ux-create')beginCreate(e);else if(e.target.id==='ux-join')beginJoin(e);else if(e.target.id==='ux-bid')bid(e);else if(e.target.id==='ux-ready')ready(e)});
document.addEventListener('click',async e=>{const kind=e.target.closest('[data-kind]');if(kind){formKind=kind.dataset.kind;intro();return}
const plus=e.target.closest('[data-bid-increment]');if(plus&&data){const input=$('#ux-bid input'),min=(data.room.lead?.amount||0)+1;if(input){input.value=Math.min(data.room.players[data.you].balance,Math.max(min,Number(input.value||min)+Number(plus.dataset.bidIncrement))) }return}
const pick=e.target.closest('[data-bench]');if(pick){await request('bench',{index:Number(pick.dataset.bench)});return}
const action=e.target.closest('[data-action]');if(!action)return;const act=action.dataset.action;
if(act==='pass')await request('pass');if(act==='room-ready')await request('room-ready');if(act==='room-unready')await request('room-unready');if(act==='room-start')await request('room-start');if(act==='cancel'){if(confirm(tr('متأكد إنك عايز تلغي المباراة للطرفين؟','Cancel the match for both players?')))await request('cancel');return}
if(act==='copy'){try{await navigator.clipboard.writeText(url(code));msg(tr('تم نسخ الرابط','Link copied'),'success')}catch(e){msg(url(code),'success')}}
if(act==='share'){if(navigator.share)try{await navigator.share({title:'ULTIMATE XI',url:url(code)})}catch(e){}else{try{await navigator.clipboard.writeText(url(code));msg(tr('تم نسخ الرابط','Link copied'),'success')}catch(e){msg(url(code),'success')}}}
if(act==='speed'){playSpeed=playSpeed===1?2:playSpeed===2?4:1;action.textContent=playSpeed+'× '+tr('السرعة','Speed')}
if(act==='skip'){skipped=true;playback()}
});
$('#ux-lang').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('#ux-lang').textContent=lang==='ar'?'EN':'عربي';document.querySelectorAll('[data-ar][data-en]').forEach(n=>n.textContent=n.dataset[lang]);stamp='';paint()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&code&&token)request('state',{},true)});
function init(){try{lang=localStorage.getItem('fr:brand:lang')==='en'?'en':'ar'}catch(e){}document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('#ux-lang').textContent=lang==='ar'?'EN':'عربي';document.querySelectorAll('[data-ar][data-en]').forEach(n=>n.textContent=n.dataset[lang]);const room=new URLSearchParams(location.search).get('room');if(room&&/^[0-9a-f]{8}$/i.test(room)){code=room.toUpperCase();token=getLocal(code)}intro();if(code&&token){request('state',{},true);startPolling()}}
document.addEventListener('click',e=>{const el=e.target.closest('[data-ux-entry]');if(!el)return;const what=el.dataset.uxEntry;if(what==='rules'){const x=document.getElementById('ux-fr84-rulebook');if(x){x.open=!x.open;x.scrollIntoView({block:'start',behavior:'smooth'})}return}if(what==='ai'||what==='pvp')formKind=what;uxEntryChosen=true;intro();document.getElementById('ux-mode-actions')?.scrollIntoView({block:'start',behavior:'smooth'});});

const FR85_CLUBS=[['alahly','الأهلي المصري',0],['real','ريال مدريد',86],['barca','برشلونة',81],['liverpool','ليفربول',64],['city','مانشستر سيتي',65],['arsenal','أرسنال',57],['bayern','بايرن ميونخ',5],['atleti','أتلتيكو مدريد',78],['milan','ميلان',98]];
let fr85Club=(()=>{try{const v=localStorage.getItem('fr:club:preferred:v1');return ['alahly','real','barca','liverpool','city','arsenal','bayern','atleti','milan'].includes(v)?v:'real'}catch(e){return 'real'}})(),fr85Theme='general',fr85Difficulty=(()=>{try{const v=localStorage.getItem('fr:ai:difficulty:v1');return ['easy','medium','pro'].includes(v)?v:'medium'}catch(e){return 'medium'}})();
function fr85ClubPicker(){return '<div class="club-grid">'+FR85_CLUBS.map(([id,name,crest])=>'<button type="button" class="club-option '+(id===fr85Club?'selected':'')+'" data-fr85="club" data-value="'+id+'"><img src="'+(id==='alahly'?'/assets/clubs/al-ahly.png':'https://crests.football-data.org/'+crest+'.png')+'" alt="" loading="lazy"><span>'+name+'</span></button>').join('')+'</div>'}
function fr85ThemePicker(){const options=[['general','🌍 الوضع العام','كل الكروت الأصلية'],['england','🏴 الدوري الإنجليزي','لاعبون لعبوا بالدوري عبر التاريخ'],['spain','🇪🇸 الدوري الإسباني','لاعبون لعبوا بالليجا عبر التاريخ'],['clasico','⚔️ الكلاسيكو','ريال مدريد وبرشلونة'],['legends','👑 الأساطير','الأيقونات التاريخية'],['special','⭐ SPECIAL','كروت SPECIAL EDITION فقط']];return '<section class="fr75-panel"><div class="fr75-head"><strong>🏆 اختار عالم المزاد</strong><span>ALL-TIME LEAGUES</span></div><div class="fr75-grid">'+options.map(([id,name,desc])=>'<button type="button" data-fr85="theme" data-value="'+id+'" class="fr75-item '+(fr85Theme===id?'selected':'')+'"><strong>'+name+'</strong><small>'+desc+'</small></button>').join('')+'</div><p>التصنيف يستند إلى مكتبة الكروت ويحدده منشئ الغرفة للطرفين.</p></section>'}
function fr85Configure(){return '<div class="top-intro"><span class="eyebrow">STEP 01 · READY FOR AUCTION</span><h1 class="h1">جهّز منافستك</h1><p>اختر ناديك وشعارك الحقيقي قبل بداية الجولات.</p></div><form id="ux-create" class="split-2 fr85-config"><section class="panel stack"><div class="control"><label for="name">اسمك داخل المباراة</label><input id="name" class="input" name="name" maxlength="22" required value="'+esc(nameVal()||'بيبو')+'"></div><h2 class="section-title">اختار ناديك</h2>'+fr85ClubPicker()+fr85ThemePicker()+'</section><section class="panel stack"><span class="eyebrow">GAME MODE</span><h2 class="section-title">طريقة اللعب</h2><div class="row-buttons"><button type="button" class="btn '+(formKind==='ai'?'gold':'ghost')+'" data-fr85="mode" data-value="ai">🤖 ضد AI</button><button type="button" class="btn '+(formKind==='pvp'?'gold':'ghost')+'" data-fr85="mode" data-value="pvp">⚔️ 1 ضد 1</button></div>'+(formKind==='ai'?'<h3>مستوى الذكاء الاصطناعي</h3><div class="difficulty">'+[['easy','سهل'],['medium','متوسط'],['pro','احترافي']].map(([id,label])=>'<button type="button" class="btn '+(fr85Difficulty===id?'active':'ghost')+'" data-fr85="difficulty" data-value="'+id+'">'+label+'</button>').join('')+'</div><p class="hint">كل المستويات بنفس الـ300M، والاختلاف في قرارات المزايدة.</p>':'<h3>غرفة خاصة</h3><p class="hint">هتحصل فورًا على رابط مشاركة، وصاحبك يدخل منه مباشرة.</p>')+'<button class="btn gold block" type="submit">'+(formKind==='ai'?'ابدأ التحدي ضد AI':'أنشئ الغرفة الآن')+'</button><p class="hint">متاحة على الموبايل والكمبيوتر · قواعد موحدة للطرفين.</p></section></form><details class="panel fr84-rulebook"><summary>قواعد التشكيلة الكاملة بالتفصيل</summary><p>11 جولة مزاد، 300 مليون، 11 أساسي و7 بدلاء. كروت مجانية عند نفاد الميزانية وتبديلات تلقائية.</p></details>'}
function fr85Join(){const room=new URLSearchParams(location.search).get('room')||'';return '<div class="top-intro"><span class="eyebrow">PRIVATE AUCTION ROOM · 1 VS 1</span><h1 class="h1">انضم إلى غرفة المزاد</h1><p>اختر ناديك وشعارك قبل دخول الغرفة.</p></div><form id="ux-join" class="split-2 fr85-config"><section class="panel stack"><label for="name">اسمك داخل المباراة</label><input class="input" id="name" name="name" required value="'+esc(nameVal()||'بيبو')+'"><h2 class="section-title">اختار ناديك</h2>'+fr85ClubPicker()+'</section><section class="panel stack"><span class="eyebrow">ROOM CODE</span><div class="code">'+esc(room)+'</div><p>الغرفة لها نفس الإعدادات للطرفين.</p><button class="btn gold block" type="submit">انضم إلى الغرفة</button></section></form>'}
function fr85Intro(){const room=new URLSearchParams(location.search).get('room');app.innerHTML=room&&!token?fr85Join():uxEntryChosen?fr85Configure():hero()}
function fr85Crest(p){const club=FR85_CLUBS.find(c=>c[0]===p?.club)||FR85_CLUBS[0];return '<img class="fr85-crest" src="'+(club[0]==='alahly'?'/assets/clubs/al-ahly.png':'https://crests.football-data.org/'+club[2]+'.png')+'" alt="">'}
function fr85Side(p,title){return fr87Squad(p,title,!/المنافس|rival|opponent/i.test(title));}
function fr85Auction(r){const p=r.players[data.you],o=r.players[1-data.you],m=r.offer,lead=r.lead,leading=lead?.side===data.you,min=(lead?.amount||0)+1,can=!leading&&p.balance>=min;return '<div class="auction-head"><div class="side-head">'+fr85Crest(p)+'<div><span class="name">'+esc(p.name)+' · أنت</span><span class="balance">'+p.balance+'M</span></div></div><div class="round-center"><strong>'+(r.round+1)+'/11</strong><span>'+esc(r.slot)+'</span></div><div class="side-head right">'+fr85Crest(o)+'<div><span class="name">'+esc(o?.name)+'</span><span class="balance">'+(o?.balance??'—')+'M</span></div></div></div><div class="auction-layout fr85-auction-layout">'+fr85Side(p,'تشكيلتك')+'<section class="panel focus-market fr85-focus"><div class="market-head"><span class="tag gold">'+esc(r.slot)+'</span><span class="position">'+m.ovr+' OVR · '+esc(m.pos)+'</span></div><div class="fr85-offer">'+playerCard(m)+'</div><h3>'+esc(m.name)+'</h3><div class="row fr85-price"><div><span class="hint">أعلى مزايدة</span><div class="bid-price">'+(lead?.amount||1)+'M</div></div><div><span class="hint">'+(leading?'أنت صاحب أعلى عرض':'دورك في المزايدة')+'</span><div id="ux-clock" class="timer">15s</div></div></div><div class="status">'+(lead?'صاحب أعلى عرض: '+esc(r.players[lead.side].name):'السعر الافتتاحي 1M')+'</div><form id="ux-bid" class="bid-controls"><div class="bid-inline"><button type="button" class="btn ghost" data-fr85="step" data-value="-1" '+(can?'':'disabled')+'>−</button><input id="bid-input" class="input" type="number" name="amount" min="'+min+'" max="'+p.balance+'" value="'+Math.min(min,p.balance)+'" '+(can?'':'disabled')+'><button type="button" class="btn ghost" data-fr85="step" data-value="1" '+(can?'':'disabled')+'>+</button></div><div class="quick"><button type="button" data-bid-increment="5" class="btn ghost" '+(can?'':'disabled')+'>+5M</button><button type="button" data-bid-increment="10" class="btn ghost" '+(can?'':'disabled')+'>+10M</button></div><button class="btn gold block" type="submit" '+(can?'':'disabled')+'>تأكيد المزايدة</button></form><button class="btn ghost block" type="button" data-action="pass" '+(leading?'disabled':'')+'>انسحاب من الكارت</button></section>'+fr85Side(o,'تشكيلة المنافس')+'</div>'}
function fr85Waiting(r){const p=r.players[data.you],o=r.players[1-data.you];return '<div class="top-intro"><span class="eyebrow">PRIVATE AUCTION ROOM · 1 VS 1</span><h1 class="h1">غرفة مزاد التشكيلة الكاملة</h1><p>300M لكل لاعب · 15 ثانية للدور · 11 جولة</p></div><div class="split-2"><section class="panel fr85-room-player">'+fr85Crest(p)+'<h3>'+esc(p.name)+'</h3></section><section class="panel fr85-room-player">'+(o?fr85Crest(o)+'<h3>'+esc(o.name)+'</h3>':'<div class="loading">في انتظار دخول المنافس…</div>')+'</section></div><section class="panel gold-edge fr85-room"><span class="eyebrow">ROOM CODE</span><div class="code">'+esc(r.code)+'</div><div class="row-buttons"><button type="button" class="btn gold" data-action="copy">نسخ رابط الغرفة</button><button type="button" class="btn ghost" data-action="share">مشاركة الرابط</button></div></section>'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-fr85]');if(!b)return;const type=b.dataset.fr85,val=b.dataset.value;if(type==='step'){const input=document.getElementById('bid-input');if(input&&data){const min=(data.room.lead?.amount||0)+1;input.value=Math.min(data.room.players[data.you].balance,Math.max(min,Number(input.value||min)+Number(val)))}return}const input=document.querySelector('input[name="name"]');if(input)storeName(input.value);if(type==='club'){fr85Club=val;try{localStorage.setItem('fr:club:preferred:v1',val)}catch(e){}}if(type==='theme')fr85Theme=val;if(type==='difficulty'){fr85Difficulty=val;try{localStorage.setItem('fr:ai:difficulty:v1',val)}catch(e){}}if(type==='mode')formKind=val;fr85Intro()});
window.FR85Choice=()=>({clubId:fr85Club,theme:fr85Theme,difficulty:fr85Difficulty});


function fr85Bench(r){const me=r.players[data.you],op=r.players[1-data.you],picked=r.benchPicked[data.you];return '<div class="top-intro"><span class="eyebrow">BENCH DRAFT · '+(r.benchIndex+1)+'/7</span><h1 class="h1">سوق البدلاء السريع</h1><p>حتى 3 كروت لكل خانة حسب المتاح أو لاعب مجاني عند نفاد الرصيد.</p></div><div class="auction-head"><div class="side-head">'+fr85Crest(me)+'<div><span class="name">'+esc(me.name)+'</span><span class="balance">'+me.balance+'M</span></div></div><div class="round-center"><strong>'+(r.benchIndex+1)+'/7</strong><span>'+esc(r.slot)+'</span></div><div class="side-head right">'+fr85Crest(op)+'<div><span class="name">'+esc(op?.name)+'</span><span class="balance">'+(op?.balance??'—')+'M</span></div></div></div><div class="auction-layout fr85-auction-layout">'+fr85Side(me,'تشكيلتك')+'<section class="panel focus-market fr85-focus"><div class="market-head"><span class="tag gold">'+esc(r.slot)+'</span><span class="timer" id="ux-clock">25s</span></div><div class="fr85-choices">'+(r.benchOffers||[]).map((c,i)=>'<article class="fr85-choice">'+playerCard(c)+'<div class="bid-price">'+c.price+'M</div><button type="button" class="btn ghost block" data-bench="'+i+'" '+(picked||me.balance<c.price?'disabled':'')+'>شراء الكارت</button></article>').join('')+'</div><button type="button" class="btn gold block" data-bench="-1" '+(picked?'disabled':'')+'>لاعب مجاني</button>'+(picked?'<div class="status good">تم اختيارك · في انتظار المنافس</div>':'')+'</section>'+fr85Side(op,'تشكيلة المنافس')+'</div>'}
function fr85Coach(r){const me=r.players[data.you],choices=(data.coaches||[]).map(c=>[c.id,c.level.toUpperCase(),c.name,c.id,c.cost]);return '<div class="top-intro"><span class="eyebrow">MATCH PREPARATION · COACHES</span><h1 class="h1">اختار مدربك</h1><p>مدرب مجاني، أو ترقيات من ميزانيتك المتبقية. نفس عرض بطاقات مدربي الخماسي.</p></div><section class="panel gold-edge fr85-coaches">'+(!me.ready?'<form id="ux-ready"><div class="coach-grid fr69-grid">'+choices.map(([id,level,name,image,cost],i)=>'<label class="coach-option fr69-card fr69-'+id+(cost>me.balance?' fr-budget-locked':'')+'" '+(cost>me.balance?'aria-disabled="true" title="الرصيد غير كافٍ"':'')+'><input type="radio" name="coach" value="'+id+'" '+(!i?'checked':'')+' '+(cost>me.balance?'disabled':'')+'><div class="fr69-art"><img src="/assets/auction/coaches/'+image+'.webp" alt="'+name+'" width="768" height="1024" loading="lazy"></div><div class="fr69-card-detail"><strong>'+name+'</strong><span>'+level+' · '+(cost?cost+'M':'مجاني')+(cost>me.balance?' · الرصيد غير كافٍ':'')+'</span></div></label>').join('')+'</div><div class="control"><label>التكتيك</label><select class="input" name="tactic"><option value="balanced">متوازن</option><option value="attack">هجومي</option><option value="defense">دفاعي</option></select></div><button class="btn gold block">جاهز للمباراة</button></form>':'<div class="status good">تم تجهيز الفريق · انتظار المنافس</div>')+'</section>'+fr85Side(me,'تشكيلتك')}
function fr85Match(r){const a=r.players[0],b=r.players[1];return '<div class="fr70-experience fr85-match"><section class="fr70-header"><span class="fr70-kicker">FULL SQUAD MATCH · 11 VS 11</span><h1>محاكاة المباراة</h1><p>11 أساسي · 7 بدلاء · 5 تغييرات تلقائية</p></section><section class="fr70-stadium"><div class="fr70-scoreboard"><div class="fr70-club">'+fr85Crest(a)+'<strong>'+esc(fr130UltimateClub(a))+'</strong>'+fr130UltimateOwner(a)+'</div><div class="fr70-score-block"><div id="ux-score" class="fr70-score" dir="ltr">0 - 0</div><div id="ux-minute" class="fr70-clock">0′</div></div><div class="fr70-club">'+fr85Crest(b)+'<strong>'+esc(fr130UltimateClub(b))+'</strong>'+fr130UltimateOwner(b)+'</div></div><div class="fr70-progress-outer"><div class="fr70-progress" id="ux-timelinebar" style="width:0%"></div></div><div class="fr85-football-pitch"><div class="fr85-pitch-mark">ULTIMATE XI · MATCHDAY</div></div><div class="fr70-action"><span class="fr70-action-icon">⚽</span><div><span class="fr70-action-kicker">أحداث المباراة</span><strong>صافرة البداية</strong></div></div><div id="ux-events" class="ux-events fr70-event-strip"></div></section><div class="row-buttons fr85-match-actions"><button type="button" data-action="speed" class="btn ghost">السرعة 1×</button><button type="button" data-action="skip" class="btn gold">النتيجة النهائية</button></div><div id="ux-result" hidden></div></div>'}

function fr86Lobby(r){
 const p=r.players[data.you],o=r.players[1-data.you],ready=!!(p?.ready&&o?.ready),host=data.you===0;
 const player=(x,mine)=>'<section class="panel fr86-lobby-player">'+fr85Crest(x)+'<div><strong>'+esc(x?.name||'')+(mine?' · '+tr('أنت','You'):'')+'</strong><span class="tag '+(x?.ready?'green':'red')+'">'+(x?.ready?tr('جاهز','Ready'):tr('غير جاهز','Not ready'))+'</span></div></section>';
 return '<div class="top-intro"><span class="eyebrow">PRIVATE AUCTION ROOM · 1 VS 1</span><h1 class="h1">'+tr('غرفة مزاد التشكيلة الكاملة','ULTIMATE XI ROOM')+'</h1><p>'+tr('300 مليون لكل لاعب · 11 جولة · 15 ثانية','300M each · 11 rounds · 15 seconds')+'</p></div>'+
 '<div class="split-2">'+player(p,true)+player(o,false)+'</div>'+
 '<section class="panel gold-edge fr86-room"><span class="eyebrow">ROOM CODE</span><div class="code">'+esc(r.code)+'</div>'+
 '<div class="row-buttons"><button type="button" class="btn ghost" data-action="copy">'+tr('نسخ رابط الغرفة','Copy room link')+'</button><button type="button" class="btn ghost" data-action="share">'+tr('مشاركة الرابط','Share link')+'</button></div>'+
 '<div class="status '+(ready?'good':'warn')+'">'+(ready?tr('الطرفان جاهزان','Both ready'):tr('في انتظار جاهزية الطرفين','Waiting for players'))+'</div>'+
 '<div class="row-buttons"><button type="button" class="btn ghost" data-action="'+(p?.ready?'room-unready':'room-ready')+'">'+(p?.ready?tr('إلغاء جاهزيتي','Unready'):tr('أنا جاهز','Ready'))+'</button>'+
 (host?'<button type="button" class="btn gold" data-action="room-start" '+(ready?'':'disabled')+'>'+tr('ابدأ المزاد','Start auction')+'</button>':'')+'</div></section>';
}

/* FR87_UXI_AUCTION: preserve original card sprite and server semantics */
const FR87_SLOTS=['GK','RB','CB','CB','LB','CDM','CM','CAM','RW','ST','LW'];
let fr87LastCount=null,fr87PreviousMoney=null,fr87Room='',fr87Result='',fr87OverlayTimer=null;
function fr87Slot(p,i){const c=p?.start?.[i],role=FR87_SLOTS[i],original=String(c?.pos||'').toUpperCase(),alternative=!!c&&original!==role;return '<div class="fr87-slot fr88-slot '+(c?'filled':'empty')+'" title="'+esc(c?c.name+' · '+tr('خانة التشكيلة','Squad role')+': '+role+(alternative?' · '+tr('المركز الأصلي','Card position')+': '+original:''):role)+'">'+(c?'<div class="fr87-portrait" style="'+esc(cardCss(c))+'"></div><b class="fr87-rating">'+esc(c.ovr)+'</b>':'<div class="fr87-placeholder">+</div>')+'<strong>'+esc(c?.name||role)+'</strong><small>'+role+'</small>'+(alternative?'<em class="fr88-altpos">'+original+' → '+role+'</em>':'')+'</div>'}
function fr87Squad(p,label,mine){const start=p?.start||[],bench=p?.bench||[],rows=[[8,9,10],[5,6,7],[1,2,3,4],[0]];return '<section class="fr87-squad fr88-squad '+(mine?'home':'away')+'"><header>'+fr85Crest(p)+'<div><strong>'+label+'</strong><small>'+esc(p?.name||'')+' · '+start.length+'/11</small></div><b>'+start.length+'/11</b></header><div class="fr87-pitch">'+rows.map(row=>'<div class="fr87-line">'+row.map(i=>fr87Slot(p,i)).join('')+'</div>').join('')+'</div><div class="fr87-bench">'+tr('البدلاء','Bench')+' <b>'+bench.length+'/7</b></div>'+(bench.length?'<div class="fr88-subs">'+bench.map(c=>'<div class="fr88-sub" title="'+esc(c.name)+'"><div class="fr88-sub-art" style="'+esc(cardCss(c))+'"></div><strong>'+esc(c.name)+'</strong><small>'+esc(c.pos)+' · '+esc(c.ovr)+'</small></div>').join('')+'</div>':'<div class="fr88-no-subs">'+tr('لم تختَر بدلاء بعد','No substitutes yet')+'</div>')+'<details class="fr88-full-squad"><summary>'+tr('عرض البطاقات الأصلية بالحجم الكبير','View original full cards')+'</summary><div class="fr87-full">'+start.map(c=>'<div>'+playerCard(c)+'</div>').join('')+'</div>'+(bench.length?'<h4>'+tr('البدلاء','Substitutes')+'</h4><div class="fr87-full">'+bench.map(c=>'<div>'+playerCard(c)+'</div>').join('')+'</div>':'')+'</details></section>'}
function fr87Auction(r){
 const p=r.players[data.you],o=r.players[1-data.you],m=r.offer,lead=r.lead,leading=lead?.side===data.you,min=(lead?.amount||0)+1,can=!leading&&p.balance>=min;
 return '<div class="fr87-root">'+
 '<div class="fr87-score"><div class="fr87-score-team home">'+fr85Crest(p)+'<span><small>'+esc(p.name)+' · أنت</small><strong>'+p.balance+'M</strong></span></div><div class="fr87-round"><strong>'+(r.round+1)+'/11</strong><small>'+esc(r.slot)+'</small></div><div class="fr87-score-team away">'+fr85Crest(o)+'<span><small>'+esc(o?.name||'المنافس')+'</small><strong>'+(o?.balance??'—')+'M</strong></span></div></div>'+
 '<section class="fr87-market"><div class="fr87-top">⚒ '+(lead?'صاحب أعلى عرض: '+esc(r.players[lead.side].name):'السعر الافتتاحي 1M')+'</div>'+
 '<div class="fr87-hero"><div class="fr87-ovr"><small>OVR</small><strong>'+esc(m.ovr)+'</strong><small>'+esc(r.slot)+'</small></div><div class="fr87-maincard">'+playerCard(m)+'</div><div class="fr87-clock"><small>الوقت المتبقي</small><strong id="ux-clock" class="timer">15s</strong></div></div>'+
 '<h2>'+esc(m.name)+'</h2><div class="fr87-meta">'+esc(m.pos)+' · ULTIMATE XI</div>'+
 '<div class="fr87-auction-state"><div><small>أعلى مزايدة</small><strong>'+(lead?.amount||1)+'M</strong></div><div><small>صاحب العرض</small><b>'+esc(lead?r.players[lead.side].name:'سعر الافتتاح')+'</b></div></div>'+
 '<form id="ux-bid" class="fr87-bids bid-controls"><div class="fr87-inputs bid-inline"><button type="button" class="btn ghost" data-fr85="step" data-value="-1" '+(can?'':'disabled')+'>−</button><input id="bid-input" class="input" type="number" name="amount" min="'+min+'" max="'+p.balance+'" value="'+Math.min(min,p.balance)+'" '+(can?'':'disabled')+' aria-label="قيمة المزايدة"><button type="button" class="btn ghost" data-fr85="step" data-value="1" '+(can?'':'disabled')+'>+</button></div>'+
 '<div class="fr87-quick quick"><button type="button" data-bid-increment="5" class="btn ghost" '+(can?'':'disabled')+'>+5M</button><button type="button" data-bid-increment="10" class="btn ghost" '+(can?'':'disabled')+'>+10M</button></div>'+
 '<button class="btn gold block fr87-confirm" type="submit" '+(can?'':'disabled')+'>تأكيد المزايدة</button></form>'+
 '<button class="btn ghost block fr87-pass" type="button" data-action="pass" '+(leading?'disabled':'')+'>انسحاب من الكارت</button></section>'+
 '<div class="fr87-squad-heading"><strong>التشكيلتان الحيتان</strong><span>4-3-3 · '+Math.min(p.start.length,o.start.length)+'/11</span></div>'+
 '<div class="fr87-squads">'+fr87Squad(p,'تشكيلتك',true)+fr87Squad(o,'تشكيلة المنافس',false)+'</div>'+
 (fr87Result?'<div class="fr87-result">'+fr87Result+'</div>':'')+'</div>';
}
function fr87Award(c,p,amount,mine){
 const price=c?.free?tr('بديل مجاني','Free alternative'):Number.isFinite(amount)?(amount>0?tr('سعر الحسم ','Winning price ')+amount+'M':tr('لم يُخصم رصيد','No funds deducted')):tr('أضيف للتشكيلة','Added to squad');
 return '<div class="fr87-award '+(mine?'mine':'rival')+'"><header>'+fr85Crest(p)+'<strong>'+esc(p.name)+'</strong></header><div class="fr87-award-card">'+playerCard(c)+'</div><h3>'+esc(c.name)+'</h3><strong class="fr87-paid">'+(mine?'تشكيلتك':'تشكيلة المنافس')+' · '+price+'</strong></div>';
}
function fr87Reveal(r,index,cost){
 const me=r.players[data.you],op=r.players[1-data.you],a=me.start[index],b=op.start[index];if(!a||!b)return;
 document.getElementById('fr87-reveal')?.remove();
 const el=document.createElement('div');el.id='fr87-reveal';el.className='fr87-reveal';el.setAttribute('role','dialog');el.setAttribute('aria-label','حسم جولة المزاد');
 el.innerHTML='<div class="fr87-reveal-panel"><header><small>FOOTBALL RIVALS · ULTIMATE XI</small><button type="button" class="fr87-close" aria-label="إغلاق">×</button><h2>تم حسم الجولة '+(index+1)+'/11</h2><b>'+FR87_SLOTS[index]+'</b></header><div class="fr87-award-pair">'+fr87Award(a,me,cost[data.you],true)+fr87Award(b,op,cost[1-data.you],false)+'</div><p>تمت إضافة البطاقتين إلى التشكيلتين</p></div>';
 el.addEventListener('click',e=>{if(e.target===el||e.target.closest('.fr87-close'))el.remove()});document.body.appendChild(el);
 clearTimeout(fr87OverlayTimer);fr87OverlayTimer=setTimeout(()=>el.remove(),2300);
 fr87Result='<strong>آخر جولة '+(index+1)+'/11</strong><span>'+esc(me.name)+': '+esc(a.name)+' · '+esc(op.name)+': '+esc(b.name)+'</span>';
}
function fr87Observe(r){
 if(!r||!Array.isArray(r.players)||r.players.length!==2)return;
 if(r.stage!=='auction'&&r.stage!=='bench')return;
 const current=Math.min(...r.players.map(x=>x?.start?.length||0)),key=String(r.code||code||'');
 if(fr87Room!==key||fr87LastCount===null){fr87Room=key;fr87LastCount=current;fr87PreviousMoney=r.players.map(x=>x?.balance);return}
 if(current>fr87LastCount){
  const valid=current===fr87LastCount+1;
  const amount=r.players.map((x,i)=>valid&&Number.isFinite(+fr87PreviousMoney[i])?Math.max(0,+fr87PreviousMoney[i]-(+x.balance)):NaN);
  fr87Reveal(r,current-1,amount);fr87LastCount=current;
 }
 fr87PreviousMoney=r.players.map(x=>x?.balance);
}


/* FR88: ULTIMATE XI only — original art, unified squads, readable bench */
function fr88Bench(r){
 const me=r.players[data.you],op=r.players[1-data.you],picked=!!r.benchPicked?.[data.you];
 const cards=(r.benchOffers||[]).map((c,i)=>'<article class="fr88-option"><div class="fr88-option-art">'+playerCard(c)+'</div><div class="fr88-option-info"><strong>'+esc(c.name)+'</strong><small>'+esc(c.pos)+' · OVR '+esc(c.ovr)+'</small></div><div class="fr88-option-price">'+esc(c.price)+'M</div><button type="button" class="btn ghost fr88-option-buy" data-bench="'+i+'" '+(picked||c.taken||me.balance<c.price?'disabled':'')+'>'+(c.taken?tr('اختاره المنافس','Taken by opponent'):me.balance<c.price?tr('الرصيد لا يكفي','Insufficient funds'):tr('شراء الكارت','Buy card'))+'</button></article>').join('');
 return '<div class="fr87-root fr88-bench-page">'+
 '<header class="fr88-bench-intro"><span>BENCH DRAFT · '+(r.benchIndex+1)+'/7</span><h1>'+tr('سوق البدلاء السريع','Quick bench market')+'</h1><p>'+tr('حتى 3 كروت لكل خانة حسب المتاح، أو لاعب بديل مجاني.','Up to 3 available choices, or a free alternative.')+'</p></header>'+
 '<div class="fr87-score"><div class="fr87-score-team home">'+fr85Crest(me)+'<span><small>'+esc(me.name)+' · '+tr('أنت','You')+'</small><strong>'+esc(me.balance)+'M</strong></span></div><div class="fr87-round"><strong>'+(r.benchIndex+1)+'/7</strong><small>'+esc(r.slot)+'</small></div><div class="fr87-score-team away">'+fr85Crest(op)+'<span><small>'+esc(op?.name||'المنافس')+'</small><strong>'+esc(op?.balance??'—')+'M</strong></span></div></div>'+
 '<section class="fr88-bench-market"><div class="fr88-market-head"><div><strong>'+tr('اختر بطاقة بديلك','Choose your substitute')+'</strong><small>'+esc(r.slot)+'</small></div><div class="fr88-market-timer"><small>'+tr('الوقت المتبقي','Time left')+'</small><b id="ux-clock" class="timer">25s</b></div></div>'+
 '<div class="fr88-offers">'+cards+'</div><button type="button" class="btn gold block fr88-free" data-bench="-1" '+(picked?'disabled':'')+'>'+tr('اختيار بديل مجاني','Choose free alternative')+'</button>'+
 (picked?'<div class="fr88-waiting">'+tr('تم تسجيل اختيارك — في انتظار المنافس','Choice saved — waiting for opponent')+'</div>':'')+'</section>'+
 '<div class="fr87-squad-heading"><strong>'+tr('تشكيلتا الفريقين','Both squads')+'</strong><span>4-3-3 · 11/11</span></div><div class="fr87-squads">'+fr87Squad(me,tr('تشكيلتك','Your squad'),true)+fr87Squad(op,tr('تشكيلة المنافس','Opponent squad'),false)+'</div></div>';
}
function fr88AuctionStatus(r){
 const n=data?.you??0,me=r.players[n],lead=r.lead;
 if(lead?.side===n)return tr('أنت صاحب أعلى عرض — في انتظار رد المنافس أو انتهاء المؤقت','You are leading — waiting for the rival or timer');
 if(lead&&Number(me?.balance)<Number(lead.amount)+1)return tr('الرصيد لا يكفي لرفع العرض الحالي','Not enough balance to raise this bid');
 if(lead)return tr('المنافس صاحب أعلى عرض — زايد أو انسحب','Rival leads — bid higher or withdraw');
 return tr('سعر الافتتاح 1M — يمكنك بدء المزايدة','Opening price 1M — you can start bidding');
}
function fr88AfterPaint(r){
 if(r.stage!=='auction')return;
 const b=document.querySelector('.fr87-top');
 if(b){b.textContent=fr88AuctionStatus(r);b.classList.toggle('fr88-winning',r.lead?.side===data.you);}
}


/* FR89 full: ULTIMATE XI lineup and event-driven 2D Matchday */
let fr89Selected=null,fr89Paused=false,fr89PausedAt=0,fr89PauseTotal=0,fr89SeenGoal='',fr89MomentTimeout=null;
const fr89FieldPos=[[7,50],[22,13],[23,39],[23,62],[22,87],[36,19],[39,50],[36,81],[47,17],[47,50],[47,83]];
function fr89Fit(c,role){
 const pos=String(c?.pos||'').toUpperCase(),group=p=>p==='GK'?'GK':['RB','LB','CB','RWB','LWB'].includes(p)?'DF':['CDM','CM','CAM','RM','LM'].includes(p)?'MF':'FW';
 if(pos===role)return 1;if(pos==='GK'||role==='GK')return .48;if(group(pos)===group(role))return .91;
 const near={RB:['RM','RW'],LB:['LM','LW'],CB:['CDM'],CDM:['CB','CM'],CM:['CDM','CAM','RM','LM'],CAM:['CM','ST','CF'],RW:['RM','ST','CAM'],LW:['LM','ST','CAM'],ST:['CF','RW','LW','CAM']};
 return (near[role]||[]).includes(pos)?.8:.68;
}
function fr89Lineup(r){
 const p=r.players[data.you],opp=r.players[1-data.you],editable=!p.ready,rows=[[8,9,10],[5,6,7],[1,2,3,4],[0]];
 return '<div class="fr89-lineup"><header class="fr89-heading"><small>TEAM MANAGEMENT · ULTIMATE XI</small><h1>'+tr('إدارة التشكيلة','Manage your lineup')+'</h1><p>'+tr('بدّل أي أساسي مع أي بديل. التبديلات قبل المباراة لا تُحتسب ضمن التبديلات الخمسة.','Swap any starter with any substitute. Pre-match changes do not count toward five substitutions.')+'</p></header>'+
 '<div class="fr89-clubs"><div>'+fr85Crest(p)+'<strong>'+esc(p.name)+'</strong></div><b>4-3-3 · 11+7</b><div>'+fr85Crest(opp)+'<strong>'+esc(opp.name)+'</strong></div></div>'+
 '<section class="fr89-manager"><div class="fr89-manager-heading"><strong>'+tr('التشكيلة الأساسية','Starting XI')+'</strong><span>'+tr('اضغط أساسي ثم البديل','Pick starter, then substitute')+'</span></div>'+
 '<div class="fr89-management-pitch">'+rows.map(row=>'<div class="fr89-pitch-row">'+row.map(i=>{const c=p.start[i],role=FR87_SLOTS[i],eff=Math.round(c.ovr*fr89Fit(c,role));return '<button type="button" class="fr89-xi'+(fr89Selected===i?' selected':'')+'" data-fr89-start="'+i+'" '+(editable?'':'disabled')+'><span class="fr89-card-image" style="'+esc(cardCss(c))+'"></span><strong>'+esc(c.name)+'</strong><small>'+role+' · '+eff+'</small></button>'}).join('')+'</div>').join('')+'</div>'+
 '<div class="fr89-bench-head"><strong>'+tr('دكة البدلاء','Bench')+'</strong><span>7/7</span></div>'+
 '<div class="fr89-bench-grid">'+p.bench.map((c,i)=>'<button type="button" class="fr89-bench-card" data-fr89-bench="'+i+'" '+(editable?'':'disabled')+'><span class="fr89-card-image" style="'+esc(cardCss(c))+'"></span><strong>'+esc(c.name)+'</strong><small>'+esc(c.pos)+' · '+esc(c.ovr)+'</small></button>').join('')+'</div>'+
 '<div class="fr89-hint" id="fr89-hint">'+(fr89Selected===null?tr('اختار لاعبًا أساسيًا لتبديله','Select a starter to swap'):tr('اختار بديله من الدكة','Choose a bench replacement'))+'</div>'+
 '<div class="fr89-manager-actions"><button type="button" class="btn ghost" data-fr89-reset '+(editable?'':'disabled')+'>'+tr('استعادة التشكيلة','Restore lineup')+'</button>'+
 '<button type="button" class="btn gold" data-fr89-confirm '+(editable?'':'disabled')+'>'+tr('تأكيد التشكيلة','Confirm lineup')+'</button></div>'+
 (p.ready?'<div class="fr89-ready">'+tr('تشكيلتك جاهزة — انتظار المنافس','Lineup confirmed — waiting for rival')+' <button type="button" data-fr89-unready>'+tr('تعديل','Edit')+'</button></div>':'')+'</section>'+
 '<div class="fr89-rival"><h3>'+tr('تشكيلة المنافس','Rival XI')+'</h3>'+fr87Squad(opp,tr('تشكيلة المنافس','Rival squad'),false)+'</div></div>';
}
function fr89Pitch(r){
 return '<div class="fr89-field" id="fr89-field"><div class="fr89-touchline"></div><div class="fr89-middle"></div><div class="fr89-circle"></div><div class="fr89-box left"></div><div class="fr89-box right"></div>'+
 r.players.map((p,side)=>p.start.map((c,i)=>{const xy=fr89FieldPos[i],x=side===0?xy[0]:100-xy[0];return '<div class="fr89-marker '+(side?'away':'home')+'" data-side="'+side+'" data-index="'+i+'" style="left:'+x+'%;top:'+xy[1]+'%"><span>'+(i+1)+'</span><small>'+esc(c.name.split(' ').slice(-1)[0])+'</small></div>'}).join('')).join('')+
 '<div class="fr89-ball" id="fr89-ball">⚽</div></div>';
}
function fr130UltimateClub(p){return (FR85_CLUBS.find(c=>c[0]===p?.club)||FR85_CLUBS[0])[1]}
function fr130UltimateOwner(p){const name=String(p?.name||'').trim();return name?'<small class="fr130-owner-name" dir="auto" style="display:block;max-width:100%;font-size:clamp(10px,2.6vw,12px);line-height:1.3;font-weight:800;color:#c9e6ed;white-space:normal;overflow-wrap:anywhere;text-align:center">👤 '+esc(name)+'</small>':'';}
function fr89Match(r){
 const p=r.players;
 return '<section class="fr89-match"><header class="fr89-heading"><small>ULTIMATE XI · MATCHDAY LIVE</small><h1>'+tr('محاكاة المباراة','Match simulation')+'</h1><p>'+tr('ملعب حي مرتبط بالأحداث الفعلية · 5 تبديلات تلقائية بحد أقصى','Animated pitch driven by real match events · up to five automatic substitutions')+'</p></header>'+
 '<div class="fr89-stadium"><div class="fr89-scoreboard"><div>'+fr85Crest(p[0])+'<strong>'+esc(fr130UltimateClub(p[0]))+'</strong>'+fr130UltimateOwner(p[0])+'</div><div class="fr89-scoring"><strong id="ux-score">0 - 0</strong><span id="ux-minute">0′</span></div><div>'+fr85Crest(p[1])+'<strong>'+esc(fr130UltimateClub(p[1]))+'</strong>'+fr130UltimateOwner(p[1])+'</div></div>'+
 '<div class="fr89-progress"><div id="ux-timelinebar"></div></div>'+fr89Pitch(r)+
 '<div class="fr89-commentary"><strong id="fr89-event-title">'+tr('صافرة البداية','Kickoff')+'</strong><small id="fr89-event-details">'+tr('الفريقان على أرض الملعب','Both teams on the pitch')+'</small></div>'+
 '<div class="fr89-goal-moment" id="fr89-moment" hidden></div><div class="fr89-events-title">'+tr('أحداث المباراة','Match events')+'</div><div class="fr89-events" id="ux-events"></div></div>'+
 '<div class="fr89-controls"><button class="btn ghost" type="button" data-fr89-pause>'+tr('إيقاف مؤقت','Pause')+'</button><button class="btn ghost" type="button" data-action="speed">'+tr('السرعة','Speed')+' ×1</button><button class="btn gold" type="button" data-action="skip">'+tr('النتيجة النهائية','Final result')+'</button></div>'+
 '<div id="ux-result" hidden></div></section>';
}
function fr89Result(r){
 const m=r.match,p=r.players;
 return '<section class="fr89-final"><h2>'+tr('النتيجة النهائية','Full time')+'</h2><div class="fr89-final-score">'+fr85Crest(p[0])+'<strong>'+m.score.join(' - ')+'</strong>'+fr85Crest(p[1])+'</div>'+
 (m.pens?'<p>'+tr('ركلات الترجيح','Penalties')+': '+m.pens.join(' - ')+'</p>':'')+'<p>'+tr('الفائز','Winner')+': '+esc(p[m.winner].name)+'</p>'+
 '<div class="fr89-mvp"><span>MAN OF THE MATCH</span><div>'+playerCard(m.mvp)+'</div><strong>'+esc(m.mvp.name)+'</strong><small>OVR '+esc(m.mvp.ovr)+'</small></div>'+
 '<h3>'+tr('تقييمات اللاعبين','Player ratings')+'</h3><div class="fr89-ratings">'+m.ratings.map((arr,side)=>'<section><h4>'+esc(p[side].name)+'</h4>'+arr.map(x=>'<div><span>'+esc(x.name)+'</span><strong>'+(x.played===false?'—':Number(x.score).toFixed(1))+'</strong></div>').join('')+'</section>').join('')+'</div>'+
 '<div class="fr89-final-links"><a href="/auction/ultimate/">'+tr('مباراة جديدة','New match')+'</a><a href="/auction/">'+tr('العودة للمزاد','Auction')+'</a></div></section>';
}
function fr89RenderPitch(r,min,shown){
 const pitch=document.getElementById('fr89-field'),ball=document.getElementById('fr89-ball');if(!pitch||!ball)return;
 const active=r.players.map(p=>p.start.slice());for(const e of r.match.events||[]){if(e.minute>min)break;if(e.type==='sub'&&e.player&&e.other){const team=active[e.side],i=team.findIndex(x=>x.name===e.other.name);if(i>=0)team[i]=e.player}}
 for(let side=0;side<2;side++)for(let i=0;i<11;i++){const node=pitch.querySelector('[data-side="'+side+'"][data-index="'+i+'"]');if(node)node.querySelector('small').textContent=(active[side][i]?.name||'').split(' ').slice(-1)[0]}
 const latest=shown[shown.length-1],near=latest&&min-latest.minute<=4,side=near?latest.side:Math.floor(min/5)%2,ix=near?active[side].findIndex(c=>c.name===latest.player?.name):-1;
 const x=50+(side===0?1:-1)*(near?(latest.type==='goal'?36:latest.type==='chance'?25:14):10),y=near&&ix>=0?fr89FieldPos[ix][1]:50+Math.sin(min*.3)*16;
 ball.style.left=Math.max(5,Math.min(95,x))+'%';ball.style.top=Math.max(9,Math.min(91,y))+'%';
 pitch.querySelectorAll('.fr89-marker.highlight').forEach(n=>n.classList.remove('highlight'));if(near&&ix>=0)pitch.querySelector('[data-side="'+side+'"][data-index="'+ix+'"]')?.classList.add('highlight');
}
function fr89Playback(){
 if(!data||data.room.stage!=='match')return;
 const r=data.room,m=r.match,elapsed=Math.max(0,(fr89Paused?fr89PausedAt:Date.now())-localMatchStart-fr89PauseTotal);
 const min=skipped?90:Math.min(90,Math.floor(elapsed*playSpeed/m.durationMs*90)),shown=[];let score=[0,0];
 for(const e of m.events||[]){if(e.minute<=min){shown.push(e);score=e.score}}
 const a=document.getElementById('ux-score'),b=document.getElementById('ux-minute'),c=document.getElementById('ux-timelinebar');if(a)a.textContent=score.join(' - ');if(b)b.textContent=min+'′';if(c)c.style.width=Math.round(min/90*100)+'%';
 const feed=document.getElementById('ux-events');
 if(feed)feed.innerHTML=shown.slice(-16).reverse().map(e=>'<div class="fr89-event"><b>'+e.minute+'′</b><div><strong>'+esc(e.type==='goal'?'⚽ '+tr('هدف','Goal'):e.type==='sub'?'🔄 '+tr('تبديل','Substitution'):e.type==='yellow'?'🟨 '+tr('إنذار','Yellow'):tr('⚡ فرصة','Chance'))+'</strong><small>'+esc(e.player?.name||'')+(e.other?' ↔ '+esc(e.other.name):'')+' · '+esc(r.players[e.side].name)+'</small></div></div>').join('');
 fr89RenderPitch(r,min,shown);const e=shown[shown.length-1],key=e?.id||'';
 const title=document.getElementById('fr89-event-title'),detail=document.getElementById('fr89-event-details');
 if(title)title.textContent=e?(e.type==='goal'?tr('هدف!','GOAL!'):e.type==='sub'?tr('تبديل','Substitution'):e.type==='yellow'?tr('بطاقة صفراء','Yellow card'):tr('فرصة خطيرة','Big chance')):tr('صافرة البداية','Kickoff');
 if(detail)detail.textContent=e?e.player?.name+' · '+r.players[e.side].name:tr('الفريقان جاهزان','Teams ready');
 if(e?.type==='goal'&&key!==fr89SeenGoal&&min<90&&!skipped){const moment=document.getElementById('fr89-moment');if(moment){moment.hidden=false;moment.innerHTML='<span>⚽ '+tr('هدف!','GOAL!')+'</span><div class="fr89-goal-card">'+playerCard(e.player)+'</div><strong>'+esc(e.player.name)+'</strong><small>'+esc(r.players[e.side].name)+' · '+e.minute+'′</small>';clearTimeout(fr89MomentTimeout);fr89MomentTimeout=setTimeout(()=>{if(moment.isConnected)moment.hidden=true},2400)}}
 if(key)fr89SeenGoal=key;
 const result=document.getElementById('ux-result');if(result){result.hidden=min<90;if(min>=90&&!result.innerHTML)result.innerHTML=fr89Result(r)}
}
document.addEventListener('click',e=>{
 const st=e.target.closest('[data-fr89-start]'),bench=e.target.closest('[data-fr89-bench]'),reset=e.target.closest('[data-fr89-reset]'),confirm=e.target.closest('[data-fr89-confirm]'),unready=e.target.closest('[data-fr89-unready]');
 if(st||bench||reset||confirm||unready){
  e.preventDefault();if(!data||data.room.stage!=='lineup')return;if(data.room.players[data.you].ready&&!unready)return;
  if(st){fr89Selected=+st.dataset.fr89Start;document.querySelectorAll('.fr89-xi').forEach(n=>n.classList.toggle('selected',+n.dataset.fr89Start===fr89Selected));document.getElementById('fr89-hint').textContent=tr('دلوقتي اختار البديل','Now select a substitute');return}
  if(bench){if(fr89Selected===null){document.getElementById('fr89-hint').textContent=tr('اختار الأساسي الأول','Select a starter first');return}let i=fr89Selected;fr89Selected=null;request('lineup-swap',{startIndex:i,benchIndex:+bench.dataset.fr89Bench});return}
  fr89Selected=null;if(reset)request('lineup-reset');else if(confirm)request('lineup-ready');else if(unready)request('lineup-unready');return;
 }
 const pause=e.target.closest('[data-fr89-pause]');if(pause){fr89Paused=!fr89Paused;if(fr89Paused)fr89PausedAt=Date.now();else fr89PauseTotal+=Date.now()-fr89PausedAt;pause.textContent=fr89Paused?tr('استكمال','Resume'):tr('إيقاف مؤقت','Pause')}
});

/* FOOTBALL RIVALS FR90 — Ultimate XI event-linked tactical pitch and cinematic playback.
   This code executes inside the existing ULTIMATE XI closure, after FR89 helpers. */
let fr90SeenEvent=0, fr90SceneUntil=0, fr90Replay=null, fr90RoomStamp='', fr90ActivePlay=null;
const fr90Types={goal:['⚽','هدف!','GOAL!'],save:['🧤','تصدي حارس','Goalkeeper save'],miss:['🎯','تسديدة ضائعة','Missed shot'],block:['🛡️','إنقاذ دفاعي','Defensive block'],chance:['⚡','فرصة خطيرة','Big chance'],offside:['🚩','تسلل','Offside'],yellow:['🟨','إنذار','Yellow card'],red:['🟥','طرد','Red card'],free_kick:['🎯','ركلة حرة','Free kick'],var:['📺','مراجعة VAR','VAR review'],goal_disallowed:['🚫','هدف ملغي','Goal disallowed'],sub:['🔄','تبديل','Substitution']};
const fr90Label=t=>{const x=fr90Types[t]||['⚽','هجمة','Attack'];return x[0]+' '+tr(x[1],x[2])};
function fr90Match(r){
 const markup=fr89Match(r);
 return markup.replace('<div class="fr89-commentary">','<div class="fr90-possessions"><strong id="fr90-team">MATCHDAY</strong><span id="fr90-action">4-3-3</span><small id="fr90-pass">PASS</small></div><div class="fr89-commentary">')
 .replace('<div class="fr89-goal-moment" id="fr89-moment" hidden></div>','<div class="fr90-cinema" id="fr90-cinema" hidden></div>')
 .replace('<div class="fr89-events-title">','<div class="fr90-replay-panel"><strong>🎥 MATCH CONTROL</strong><button type="button" data-fr90-replay="latest">'+tr('إعادة آخر هجمة','Replay last attack')+'</button></div><div class="fr89-events-title">');
}
function fr90PlayAt(m,t){return m.plays.find(p=>t>=p.startMinute&&t<=p.endMinute+.4)||[...m.plays].reverse().find(p=>p.startMinute<=t)||m.plays[0]}
function fr90Segment(path,phase){
 if(!path?.length)return [50,50,0];
 const d=Math.min(.999999,Math.max(0,phase))*(path.length-1),i=Math.floor(d),v=d-i,e=v*v*(3-2*v),a=path[i],b=path[Math.min(i+1,path.length-1)];
 return [a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e,i];
}
function fr90PitchFrame(r,t){
 const field=document.getElementById('fr89-field'),ball=document.getElementById('fr89-ball');if(!field||!ball)return;
 let play=fr90PlayAt(r.match,t),phase=play?Math.max(0,Math.min(1,(t-play.startMinute)/Math.max(.1,play.endMinute-play.startMinute))):0;
 if(fr90Replay&&Date.now()-fr90Replay.started<fr90Replay.duration){play=r.match.plays.find(p=>p.id===fr90Replay.id)||play;phase=(Date.now()-fr90Replay.started)/fr90Replay.duration;field.classList.add('fr90-replaying')}
 else{fr90Replay=null;field.classList.remove('fr90-replaying')}
 fr90ActivePlay=play?.id;
 const xy=fr90Segment(play?.path,phase);ball.style.left=xy[0].toFixed(2)+'%';ball.style.top=xy[1].toFixed(2)+'%';
 const active=r.players.map(p=>p.start.slice());
 for(const e of r.match.events){if(e.minute>t)break;if(e.type!=='sub'||!e.player||!e.other)continue;const idx=active[e.side].findIndex(c=>c.name===e.other.name);if(idx>=0)active[e.side][idx]=e.player}
 const side=play?.side??0,idxActive=Math.min(10,[4,6,7,8,9,10][xy[2]]||9);
 for(let s=0;s<2;s++)for(let i=0;i<11;i++){
  const node=field.querySelector('[data-side="'+s+'"][data-index="'+i+'"]');if(!node)continue;
  const origin=fr89FieldPos[i],homeX=s===0?origin[0]:100-origin[0],shift=s===side?(xy[0]-50)*.12:(50-xy[0])*.05;
  node.style.left=Math.max(6,Math.min(94,homeX+shift))+'%';node.style.top=Math.max(7,Math.min(93,origin[1]+(xy[1]-origin[1])*.045))+'%';
  node.classList.toggle('highlight',s===side&&i===idxActive);
  const c=active[s][i],shortName=String(c?.name||'').split(' ').slice(-1)[0],title=String(c?.name||'')+' · '+FR87_SLOTS[i],label=node.querySelector('small');if(label.textContent!==shortName)label.textContent=shortName;if(node.title!==title)node.title=title;
 }
 const team=document.getElementById('fr90-team'),action=document.getElementById('fr90-action'),pass=document.getElementById('fr90-pass');
 if(team)team.textContent=play?r.players[side].name:'MATCHDAY';if(action)action.textContent=play?fr90Label(play.kind):'KICK OFF';if(pass)pass.textContent=play?'PASS '+(xy[2]+1)+'/'+(play.path.length-1):'READY';
}
function fr90Cinema(e,r){
 const box=document.getElementById('fr90-cinema');if(!box||!['goal','save','var','goal_disallowed','yellow','red','sub','block'].includes(e.type))return;
 box.className='fr90-cinema '+e.type;box.hidden=false;
 box.innerHTML='<small>FOOTBALL RIVALS · MATCHDAY</small><h3>'+fr90Label(e.type)+'</h3><div class="fr90-scene"><div class="fr90-scene-card">'+(e.player?playerCard(e.player):'')+'</div><div class="fr90-scene-info">'+fr85Crest(r.players[e.side])+'<strong>'+esc(e.player?.name||r.players[e.side].name)+'</strong><span>'+Math.round(e.minute)+'′ · '+esc(r.players[e.side].name)+'</span><p>'+esc(e.detail||'')+'</p></div></div>'+(e.playId?'<button data-fr90-replay="'+e.playId+'">'+tr('إعادة اللقطة','Replay scene')+'</button>':'');
 fr90SceneUntil=Date.now()+3600;
}
function fr90Stats(r){
 const s=r.match.stats||{},rows=[['possession',tr('الاستحواذ','Possession'),'%'],['shots',tr('التسديدات','Shots'),''],['onTarget',tr('على المرمى','On target'),''],['saves',tr('تصديات','Saves'),''],['chances',tr('فرص خطيرة','Big chances'),''],['passes',tr('تمريرات','Passes'),''],['fouls',tr('أخطاء','Fouls'),''],['yellow',tr('إنذارات','Yellow'),''],['red',tr('طرد','Red'),''],['var','VAR','']];
 return '<section class="fr90-stats"><h3>'+tr('إحصائيات المباراة','Match statistics')+'</h3>'+rows.map(([k,label,suff])=>{const values=s[k]||[0,0],pct=Math.round(100*values[0]/Math.max(1,values[0]+values[1]));return '<div class="fr90-stat"><div><b>'+values[0]+suff+'</b><span>'+label+'</span><b>'+values[1]+suff+'</b></div><div class="fr90-meter"><i style="width:'+pct+'%"></i></div></div>'}).join('')+'</section>';
}
function fr90Result(r){
 let html=fr89Result(r),events=r.match.events.filter(e=>['goal','var','goal_disallowed','save','red'].includes(e.type)).slice(-10).reverse();
 const highlights='<section class="fr90-highlights"><h3>🎬 '+tr('أهم اللقطات','Highlights')+'</h3>'+events.map(e=>'<button type="button" data-fr90-replay="'+e.playId+'"><b>'+Math.round(e.minute)+'′</b><strong>'+fr90Label(e.type)+'</strong><small>'+esc(e.player?.name||'')+'</small><span>▶</span></button>').join('')+'</section>';
 return html.replace('<h3>'+tr('تقييمات اللاعبين','Player ratings')+'</h3>',fr90Stats(r)+highlights+'<h3>'+tr('تقييمات اللاعبين','Player ratings')+'</h3>');
}
function fr90Playback(){
 if(!data||data.room.stage!=='match'||data.room.match?.engineVersion!=='FR90')return fr89Playback();
 const r=data.room,m=r.match,roomKey=r.code+':'+m.startedAt;
 if(fr90RoomStamp!==roomKey){fr90RoomStamp=roomKey;fr90SeenEvent=0;fr90Replay=null}
 const elapsed=Math.max(0,(fr89Paused?fr89PausedAt:Date.now())-localMatchStart-fr89PauseTotal),exact=skipped?90:Math.min(90,elapsed*playSpeed/m.durationMs*90),minute=Math.floor(exact);
 let shown=m.events.filter(e=>e.minute<=minute),score=[0,0];for(const e of shown)score=e.score;
 const sc=document.getElementById('ux-score'),clock=document.getElementById('ux-minute'),bar=document.getElementById('ux-timelinebar');
 if(sc)sc.textContent=score.join(' - ');if(clock)clock.textContent=minute+'′';if(bar)bar.style.width=Math.round(exact/90*100)+'%';fr90PitchFrame(r,exact);
 const feed=document.getElementById('ux-events');if(feed){const sig=shown.length+'|'+m.startedAt;if(feed.dataset.fr90!==sig){feed.dataset.fr90=sig;feed.innerHTML=shown.slice(-25).reverse().map(e=>'<div class="fr89-event fr90-event '+esc(e.type)+'"><b>'+Math.round(e.minute)+'′</b><div><strong>'+fr90Label(e.type)+'</strong><small>'+esc(e.player?.name||'')+' · '+esc(r.players[e.side].name)+'</small></div>'+(e.playId?'<button type="button" data-fr90-replay="'+e.playId+'">▶</button>':'')+'</div>').join('')}}
 const latest=shown.at(-1);if(latest){const title=document.getElementById('fr89-event-title'),sub=document.getElementById('fr89-event-details');if(title)title.textContent=fr90Label(latest.type);if(sub)sub.textContent=(latest.player?.name||'')+' · '+r.players[latest.side].name}
 if(latest?.id!==fr90SeenEvent&&!skipped&&minute<90){const noteworthy=[...shown].reverse().find(e=>e.id>fr90SeenEvent&&['goal','save','var','goal_disallowed','yellow','red','sub','block'].includes(e.type));if(noteworthy)fr90Cinema(noteworthy,r);fr90SeenEvent=latest?.id||0}
 const scene=document.getElementById('fr90-cinema');if(scene&&!scene.hidden&&Date.now()>fr90SceneUntil)scene.hidden=true;
 const result=document.getElementById('ux-result');if(result){result.hidden=minute<90;if(minute>=90&&!result.innerHTML)result.innerHTML=fr90Result(r)}
}
document.addEventListener('click',e=>{
 const btn=e.target.closest('[data-fr90-replay]');if(!btn||data?.room?.match?.engineVersion!=='FR90')return;
 const raw=btn.dataset.fr90Replay,id=raw==='latest'?(fr90ActivePlay||data.room.match.plays.at(-1)?.id):Number(raw);if(!id)return;
 e.preventDefault();fr90Replay={id:Number(id),started:Date.now(),duration:3400};fr90Playback();
});

/* FR91 THEATRICAL MATCH PRESENTATION — isolated ULTIMATE XI experience.
 * Server-authored match events drive every on-screen incident; no decorative fake events.
 */
let fr91RoomKey='',fr91Observed=0,fr91SceneQueue=[],fr91SceneTimer=null,fr91SceneActive=false,fr91CurrentScene=null;
const fr91Icon={goal:'⚽',yellow:'🟨',red:'🟥',injury:'🚑',var:'📺',goal_disallowed:'🚫',save:'🧤',sub:'🔄',block:'🛡️'};
const fr91Titles={
 goal:['هدف!','GOAL!'],yellow:['إنذار','YELLOW CARD'],red:['طرد','RED CARD'],
 injury:['إصابة','INJURY'],var:['مراجعة VAR','VAR REVIEW'],goal_disallowed:['الهدف ملغي','GOAL DISALLOWED'],
 save:['تصدي رائع','GREAT SAVE'],sub:['تبديل','SUBSTITUTION'],block:['إنقاذ دفاعي','DEFENSIVE BLOCK']
};
const fr91Major=new Set(Object.keys(fr91Titles));
function fr91EventName(t){const x=fr91Titles[t];return x?tr(x[0],x[1]):fr90Label(t)}
function fr91HasSource(r){return r?.match?.engineVersion==='FR90'}
function fr91SceneBox(){
 let el=document.getElementById('fr91-scene-overlay');
 if(!el){el=document.createElement('div');el.id='fr91-scene-overlay';el.className='fr91-overlay';el.hidden=true;
   el.setAttribute('role','dialog');el.setAttribute('aria-modal','false');el.setAttribute('aria-label',tr('حدث المباراة','Match incident'));
   document.body.appendChild(el);
 }
 return el;
}
function fr91SceneHTML(e,r){
 const kind=e.type,card=e.player,team=r.players[e.side]||{},icon=fr91Icon[kind]||'⚽';
 const subtitle=kind==='var'?tr('القرار بعد المراجعة هيظهر ضمن سجل الأحداث','Decision will appear in the event log'):
   kind==='injury'?tr('خروج اللاعب مصابًا ودخول البديل','Injured player replaced by a substitute'):
   kind==='goal'?tr('تم احتساب الهدف','Goal awarded'):esc(e.detail||'');
 const renderCard=card?'<div class="fr91-scene-art">'+playerCard(card)+'</div>':'';
 return '<div class="fr91-stage '+esc(kind)+'"><div class="fr91-stage-head">'+
   '<span class="fr91-stage-eyebrow">FOOTBALL RIVALS · MATCHDAY</span>'+
   '<button type="button" data-fr91-dismiss aria-label="'+tr('إغلاق','Close')+'">×</button></div>'+
   '<div class="fr91-event-kicker"><span>'+icon+'</span><h2>'+fr91EventName(kind)+'</h2><b>'+Math.round(e.minute)+'′</b></div>'+
   '<div class="fr91-stage-body">'+renderCard+'<div class="fr91-stage-details">'+fr85Crest(team)+
   '<strong>'+esc(card?.name||team.name||'')+'</strong><span>'+esc(team.name||'')+'</span><p>'+subtitle+'</p>'+
   (e.other?'<div class="fr91-secondary"><span>'+tr('اللاعب الآخر','Other player')+'</span><b>'+esc(e.other.name)+'</b></div>':'')+'</div></div>'+
   '<div class="fr91-stage-foot"><span>ULTIMATE XI • '+Math.round(e.minute)+' MIN</span>'+
   (e.playId?'<button type="button" data-fr91-play="'+Number(e.playId)+'">▶ '+tr('إعادة اللقطة','Replay scene')+'</button>':'')+'</div></div>';
}
function fr91CloseScene(){
 const el=document.getElementById('fr91-scene-overlay');if(el){el.hidden=true;el.innerHTML=''}
 if(fr91SceneTimer){clearTimeout(fr91SceneTimer);fr91SceneTimer=null}
 fr91SceneActive=false;fr91CurrentScene=null;
}
function fr91RunQueue(r){
 if(fr91SceneActive||!fr91SceneQueue.length)return;
 const e=fr91SceneQueue.shift();fr91CurrentScene=e;
 const el=fr91SceneBox();el.innerHTML=fr91SceneHTML(e,r);el.hidden=false;fr91SceneActive=true;
 const ms=e.type==='goal'?3800:e.type==='var'?2900:e.type==='goal_disallowed'?3100:3000;
 fr91SceneTimer=setTimeout(()=>{fr91CloseScene();if(data?.room?.stage==='match')fr91RunQueue(data.room)},ms);
}
function fr91QueueEvents(r,minute){
 const m=r.match,key=(r.code||'')+'|'+m.startedAt;
 if(key!==fr91RoomKey){
   fr91RoomKey=key;fr91CloseScene();fr91SceneQueue=[];
   // On returning midway through a match, don't replay all past alerts at once.
   fr91Observed=(m.events||[]).filter(e=>e.minute<minute-1).length;
 }
 if(skipped||minute>=90){fr91CloseScene();fr91SceneQueue=[];return}
 const fresh=(m.events||[]).filter(e=>e.minute<=minute).slice(fr91Observed);
 if(!fresh.length)return;
 for(const e of fresh){
   if(!fr91Major.has(e.type))continue;
   if(fr91SceneQueue.length<5)fr91SceneQueue.push(e);
 }
 fr91Observed+=(fresh.length);
 fr91RunQueue(r);
}
function fr91RatingClass(value){return value>=8.5?'elite':value>=7.5?'great':value>=6.5?'good':'low'}
function fr91Participant(r,side,rank,starter){
 const player=r.players[side],all=(player.start||[]).concat(player.bench||[]);
 const c=all[rank]||null;
 const record=r.match.ratings?.[side]?.[rank];
 return {c,record,isStarter:rank<11};
}
function fr91RatingIcons(m,side,c){
 if(!c)return '';
 const events=m.events||[],name=c.name;
 const goals=events.filter(e=>e.side===side&&e.type==='goal'&&e.player?.name===name).length;
 const assists=events.filter(e=>e.side===side&&e.type==='goal'&&e.other?.name===name).length;
 const y=events.some(e=>e.side===side&&e.type==='yellow'&&e.player?.name===name);
 const red=events.some(e=>e.side===side&&e.type==='red'&&e.player?.name===name);
 const injury=events.some(e=>e.side===side&&e.type==='injury'&&e.player?.name===name);
 const sub=events.some(e=>e.side===side&&e.type==='sub'&&(e.player?.name===name||e.other?.name===name));
 return (goals?'<span title="Goals">⚽ '+goals+'</span>':'')+(assists?'<span title="Assists">👟 '+assists+'</span>':'')+
   (y?'<span title="Yellow">🟨</span>':'')+(red?'<span title="Red">🟥</span>':'')+
   (injury?'<span title="Injury">🚑</span>':'')+(sub?'<span title="Sub">🔄</span>':'');
}
function fr91RatingRow(r,side,rank){
 const {c,record,isStarter}=fr91Participant(r,side,rank);
 if(!record)return '';
 const val=Number(record.score)||0,css=fr91RatingClass(val),grade=record.played===false?'—':val.toFixed(1);
 const card=c?'<div class="fr91-player-sprite" style="'+esc(cardCss(c))+'"></div>':'<div class="fr91-player-sprite blank"></div>';
 return '<div class="fr91-rating-row">'+card+'<div class="fr91-rating-name"><strong>'+esc(record.name)+'</strong>'+
 '<span>'+esc(c?.pos||record.pos||'')+' · '+(isStarter?tr('أساسي','Starter'):tr('بديل','Sub'))+'</span></div>'+
 '<div class="fr91-rating-events">'+fr91RatingIcons(r.match,side,c)+'</div>'+
 '<strong class="fr91-grade '+css+'">'+grade+'</strong></div>';
}
function fr91Ratings(r){
 const m=r.match;
 return '<section class="fr91-ratings"><h3>'+tr('تقييمات اللاعبين','Player ratings')+'</h3>'+
 '<div class="fr91-ratings-tabs" role="group" aria-label="'+tr('اختر الفريق','Choose team')+'">'+
 '<button class="active" type="button" data-fr91-team="0">'+esc(r.players[0].name)+'</button>'+
 '<button type="button" data-fr91-team="1">'+esc(r.players[1].name)+'</button></div>'+
 [0,1].map(side=>'<div class="fr91-ratings-panel" data-fr91-panel="'+side+'" '+(side===1?'hidden':'')+'>'+
 '<h4>'+tr('التشكيلة الأساسية','STARTING XI')+'</h4>'+
 (m.ratings?.[side]||[]).slice(0,11).map((_,i)=>fr91RatingRow(r,side,i)).join('')+
 '<h4>'+tr('دكة البدلاء','SUBSTITUTES')+'</h4>'+
 (m.ratings?.[side]||[]).slice(11).map((_,i)=>fr91RatingRow(r,side,i+11)).join('')+'</div>').join('')+'</section>';
}
function fr91TopPerformers(r){
 const m=r.match,players=[];
 for(let side=0;side<2;side++)for(let i=0;i<(m.ratings?.[side]||[]).length;i++){
   let rating=m.ratings[side][i],c=r.players[side].start.concat(r.players[side].bench)[i];
   if(rating&&c&&rating.played!==false)players.push({c,side,score:Number(rating.score)||0});
 }
 players.sort((a,b)=>b.score-a.score||b.c.ovr-a.c.ovr);
 return '<section class="fr91-top"><h3>'+tr('نجوم المباراة','TOP PERFORMERS')+'</h3><div class="fr91-top-grid">'+players.slice(0,3).map((p,i)=>
 '<article class="fr91-top-card"><span class="fr91-rank">#'+(i+1)+'</span><div class="fr91-top-art">'+playerCard(p.c)+'</div>'+
 '<strong>'+esc(p.c.name)+'</strong><small>'+esc(r.players[p.side].name)+'</small>'+
 '<span class="fr91-top-score">'+p.score.toFixed(1)+'</span></article>').join('')+'</div></section>';
}
function fr91Stats(r){
 const stats=r.match.stats||{},m=r.match;
 const offsides=[0,1].map(side=>m.events.filter(e=>e.side===side&&e.type==='offside').length);
 const injuries=[0,1].map(side=>m.events.filter(e=>e.side===side&&e.type==='injury').length);
 const rows=[
 ['possession',tr('الاستحواذ','Possession'),'%'],['shots',tr('التسديدات','Shots'),''],
 ['onTarget',tr('على المرمى','On target'),''],['chances',tr('الفرص الخطيرة','Big chances'),''],
 ['passes',tr('التمريرات','Passes'),''],['fouls',tr('الأخطاء','Fouls'),''],
 ['corners',tr('الركنيات','Corners'),''],['offsides',tr('التسللات','Offsides'),''],
 ['saves',tr('التصديات','Saves'),''],['yellow',tr('الإنذارات','Yellow cards'),''],
 ['red',tr('البطاقات الحمراء','Red cards'),''],['injuries',tr('الإصابات','Injuries'),''],
 ['var',tr('مراجعات VAR','VAR reviews'),'']];
 return '<section class="fr91-statistics"><header><span>FULL MATCH ANALYSIS</span><h3>'+tr('إحصائيات المباراة','Match statistics')+'</h3></header>'+
 '<div class="fr91-stat-teamnames"><strong>'+esc(r.players[0].name)+'</strong><strong>'+esc(r.players[1].name)+'</strong></div>'+
 rows.map(([key,label,suffix])=>{let raw=key==='offsides'?offsides:key==='injuries'?injuries:stats[key];
 if(!Array.isArray(raw)||raw.length!==2)return '';
 let a=Math.max(0,Number(raw[0])||0),b=Math.max(0,Number(raw[1])||0),pct=a+b>0?a/(a+b)*100:50;
 return '<div class="fr91-stat-item"><div class="fr91-stat-values"><b>'+a+suffix+'</b><span>'+label+'</span><b>'+b+suffix+'</b></div>'+
 '<div class="fr91-stat-track"><i style="width:'+pct.toFixed(1)+'%"></i></div></div>'}).join('')+'</section>';
}
function fr91Highlights(r){
 const events=(r.match.events||[]).filter(e=>['goal','save','injury','var','goal_disallowed','yellow','red','chance','sub'].includes(e.type));
 const scoreLabel=e=>e.type==='goal'?'<b>⚽</b>':e.type==='injury'?'<b>🚑</b>':e.type==='var'?'<b>📺</b>':'<b>'+esc(fr91Icon[e.type]||'▶')+'</b>';
 return '<section class="fr91-highlights"><header><h3>'+tr('أهم لقطات المباراة','MATCH HIGHLIGHTS')+'</h3><small>'+events.length+' '+tr('أحداث','events')+'</small></header><div class="fr91-highlight-list">'+
 events.slice(-14).reverse().map(e=>'<button type="button" data-fr90-replay="'+(e.playId||'latest')+'">'+scoreLabel(e)+
 '<span>'+Math.round(e.minute)+'′</span><div><strong>'+fr91EventName(e.type)+'</strong><small>'+esc(e.player?.name||r.players[e.side].name)+'</small></div><span class="fr91-playicon">▶</span></button>').join('')+
 '</div></section>';
}
function fr91Result(r){
 const m=r.match,p=r.players,score=m.score||[0,0];
 return '<section class="fr91-final"><div class="fr91-final-head"><span>FOOTBALL RIVALS • ULTIMATE XI</span><h2>'+tr('النتيجة النهائية','FULL TIME')+'</h2>'+
 '<div class="fr91-final-score"><div>'+fr85Crest(p[0])+'<strong>'+esc(fr130UltimateClub(p[0]))+'</strong>'+fr130UltimateOwner(p[0])+'</div><b>'+score.join(' - ')+'</b><div>'+fr85Crest(p[1])+'<strong>'+esc(fr130UltimateClub(p[1]))+'</strong>'+fr130UltimateOwner(p[1])+'</div></div>'+
 (m.pens?'<p>'+tr('ركلات الترجيح','Penalties')+': '+m.pens.join(' - ')+'</p>':'')+'</div>'+
 '<section class="fr91-motm"><div class="fr91-motm-head">★ MAN OF THE MATCH ★</div><div class="fr91-motm-body"><div class="fr91-motm-art">'+playerCard(m.mvp)+'</div>'+
 '<div><strong>'+esc(m.mvp?.name||'')+'</strong><span>OVR '+esc(m.mvp?.ovr||'—')+'</span><small>'+tr('أفضل لاعب في المباراة','Best player of the match')+'</small></div></div></section>'+
 fr91Stats(r)+fr91TopPerformers(r)+fr91Highlights(r)+fr91Ratings(r)+
 '<div class="fr91-final-actions"><a href="/auction/ultimate/">'+tr('مباراة جديدة','New match')+'</a><a href="/auction/">'+tr('العودة للمزاد','Back to auction')+'</a></div></section>';
}
function fr91Playback(){
 fr90Playback();
 if(!data||data.room.stage!=='match'||!fr91HasSource(data.room))return;
 const r=data.room,m=r.match;
 const elapsed=Math.max(0,(fr89Paused?fr89PausedAt:Date.now())-localMatchStart-fr89PauseTotal);
 const minute=skipped?90:Math.min(90,Math.floor(elapsed*playSpeed/m.durationMs*90));
 fr91QueueEvents(r,minute);
 // Replace the interim FR89/90 match summary exactly once without changing engine values.
 const box=document.getElementById('ux-result');
 if(box&&minute>=90&&!box.dataset.fr91){box.innerHTML=fr91Result(r);box.dataset.fr91='1';box.hidden=false}
}
document.addEventListener('click',e=>{
 const dismiss=e.target.closest('[data-fr91-dismiss]');if(dismiss){e.preventDefault();fr91CloseScene();if(data?.room?.stage==='match')fr91RunQueue(data.room);return}
 const play=e.target.closest('[data-fr91-play]');if(play){e.preventDefault();const id=Number(play.dataset.fr91Play);
   if(id&&data?.room?.match?.engineVersion==='FR90'){
      fr90Replay={id,started:Date.now(),duration:3300};fr91CloseScene();fr91Playback();
   }return}
 const team=e.target.closest('[data-fr91-team]');if(team){
   const root=team.closest('.fr91-ratings'),side=String(team.dataset.fr91Team);
   root.querySelectorAll('[data-fr91-team]').forEach(x=>x.classList.toggle('active',x.dataset.fr91Team===side));
   root.querySelectorAll('[data-fr91-panel]').forEach(x=>x.hidden=x.dataset.fr91Panel!==side);
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fr91SceneActive)fr91CloseScene()});


/* FR93: non-blocking, once-only account archive sync, server verifies the actual room */
let fr93RoomKey='',fr93Attempt=0,fr93Completed=false;
function fr93UltimateMaybeSync(){
 try{
  const r=data?.room,m=r?.match;
  if(!r||!m||r.stage!=='match'||!code||!token)return;
  const key=code+':'+String(m.startedAt||0)+':'+String(data.you);
  if(fr93RoomKey!==key){fr93RoomKey=key;fr93Completed=false;fr93Attempt=0}
  if(fr93Completed||Date.now()-fr93Attempt<12000)return;
  fr93Attempt=Date.now();
  fetch('/api/fr93-results',{method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'commit',kind:'ultimate',code,token})})
   .then(x=>x.json()).then(j=>{if(j.ok){fr93Completed=true;try{sessionStorage.setItem('fr93:saved:'+key,'1')}catch(e){}}})
   .catch(()=>{});
 }catch(e){}
}

init();
})();

;document.addEventListener('input',function(e){if(e.target&&e.target.id==='name'){try{const n=e.target.value.trim().slice(0,28);if(n)localStorage.setItem('fr:pentagon:name',n)}catch(_){}}});
