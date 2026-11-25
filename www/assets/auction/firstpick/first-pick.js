/* FR95 FIRST PICK — isolated client. The server is the authority on auction state and results. */
(()=>{'use strict';
const API='/api/auction-first-pick',ROOT='/auction/first-pick/',ASSET='/assets/auction/firstpick/';
const app=document.getElementById('fr95-root');
let fr117Leaving=false;
let session=null,room=null,mode='ai',difficulty=(()=>{try{const v=localStorage.getItem('fr:ai:difficulty:v1');return ['easy','medium','pro'].includes(v)?v:'medium'}catch(e){return 'medium'}})(),scene='entry',tab='lineup',lastSig='',busy=false,poll=null;
let localName='',plan={tactic:'balanced',subs:'balanced',coach:'base'},fr95Saved='',fr95LastSaveAttempt=0;
const L=window.localStorage,save=()=>{try{if(session)L.setItem('fr95:firstpick:session',JSON.stringify(session));else L.removeItem('fr95:firstpick:session')}catch(_){}};
const esc=(x)=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0)+'M',byId=x=>document.getElementById(x);
const stageLabel={lobby:'انتظار المنافس',auction:'المزايدة',pick:'حق الاختيار',reveal:'توزيع البطاقات',plan:'التشكيلة والتكتيك',result:'النتيجة'};
const posLabel={GK:'حارس',DF:'مدافع',MF:'وسط',FW:'هجوم',FLEX:'جوكر',SUB1:'احتياطي 1',SUB2:'احتياطي 2'};
const planName={attack:'هجومي',balanced:'متوازن',defense:'دفاعي'};
function card(p,extra=''){
 if(!p)return '<div class="fr95-player">لاعب غير متاح</div>';
 if(p.sprite?.cols===1&&p.sprite?.rows===1)return '<div class="fr95-player '+extra+'"><div class="fr95-player-art">'+spriteMarkup(p)+'</div></div>';
 const s=p.sprite||{},cols=Number(s.cols)||5,rows=Number(s.rows)||6;
 const sx=cols>1?(100*Number(s.col||0)/(cols-1)):0,sy=rows>1?(100*Number(s.row||0)/(rows-1)):0;
 const file=String(s.file||'').replace(/[^a-zA-Z0-9_./-]/g,'');
 const style='background-image:url(/cloud-v5/'+file+');background-size:'+(100*cols)+'% '+(100*rows)+'%;background-position:'+sx+'% '+sy+'%';
 return '<div class="fr95-player'+(extra?' '+extra:'')+'"><div class="fr95-player-art"><div class="fr95-sprite" style="'+style+'"></div><span class="fr95-ovr">'+Number(p.ovr||0)+'</span><span class="fr95-pos">'+esc(p.pos)+'</span></div><div class="fr95-player-name">'+esc(p.name)+'</div></div>';
}
function header(){
 return '<header class="fr97-entry-header"><a class="fr97-entry-back" href="/auction/" aria-label="العودة للمزادات">❮</a><a class="fr97-entry-brand" href="/" aria-label="FOOTBALL RIVALS">FR</a></header>';
}
function nav(){return '';}
function controls(){return session&&room?.stage!=='cancelled'?'<div class="fr95-game-controls"><button id="fr95-exit" class="fr95-btn danger">✕ إلغاء المباراة</button><button id="fr95-voice" class="fr95-btn ghost" title="ميكروفون صوتي خاص بمواجهة صديق 1v1">🎙 الميكروفون</button></div>':''}
function shell(title,inner,sub){
 const isGame=!!session;
 const poster='<figure class="fr97-entry-poster"><img src="/assets/auction/firstpick/entry-fr96.webp?v=fr98&frb=football-rivals-arena-bundled1124-bibo21_vercel_app" alt="FIRST PICK — مزاد الاختيار الأول" width="1086" height="1448" loading="eager" decoding="async"></figure>';
 const metrics='<div class="fr97-entry-metrics" aria-label="معلومات المزاد"><div class="fr97-metric"><strong>150M</strong><span>ميزانية لكل لاعب</span></div><div class="fr97-metric"><strong>7</strong><span>جولات مزاد</span></div><div class="fr97-metric"><strong>15s</strong><span>لكل دور</span></div></div>';
 app.innerHTML='<div class="fr95-root fr97-entry fr98-page '+(isGame?'fr98-game':'fr98-config')+'">'+header()+'<main class="fr98-main">'+
 '<div class="fr97-entry-heading"><h1>مزاد الاختيار الأول</h1><p>FIRST PICK AUCTION</p></div>'+
 (isGame||scene==='mode'?'':poster)+(scene==='mode'?'':metrics)+
 '<section class="fr95-panel fr98-panel" id="fr98-content"><h2 class="fr95-section-title">'+esc(title)+'</h2>'+
 (sub?'<p class="fr95-muted">'+esc(sub)+'</p>':'')+inner+(room&&['auction','pick','reveal','result'].includes(room.stage)?fr99Panels(room):'')+controls()+'</section></main></div>'+nav();
 if(room)fr99WirePanels(room);const exit=byId('fr95-exit');if(exit)exit.onclick=async()=>{if(!confirm('إلغاء المباراة للطرفين؟ لن تُسجل نتيجة.'))return;await fr123Cancel()};
}
function toast(msg){let e=document.querySelector('.fr95-toast');if(e)e.remove();e=document.createElement('div');e.className='fr95-toast';e.textContent=msg;document.body.append(e);setTimeout(()=>e.remove(),4200)}
async function api(payload,withAuth=true){
 const b={...payload};if(withAuth&&session){b.code=session.id;b.token=session.token}
 const res=await fetch(API,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
 let j;try{j=await res.json()}catch(_){throw Error('تعذر قراءة رد الخادم')}
 if(!res.ok||!j.ok){const codes={INVALID_ROOM_TOKEN:'جلسة الغرفة غير صالحة',ROOM_NOT_FOUND:'الغرفة غير موجودة أو انتهت',ROOM_UNAVAILABLE:'الغرفة ممتلئة أو بدأت',NOT_YOUR_TURN:'ليس دورك الآن',INVALID_BID:'العرض غير صالح',INSUFFICIENT_BUDGET:'الميزانية لا تكفي',BID_WINDOW_CLOSED:'انتهى وقت العرض',PICK_WINDOW_CLOSED:'انتهى وقت الاختيار',PLAN_LOCKED:'تم تثبيت الخطة بالفعل',INSUFFICIENT_AUTHENTIC_PLAYERS:'لا توجد بطاقات حقيقية كافية لهذا المركز',ROOM_BUSY_RETRY:'حدث تعارض مؤقت، حاول مجددًا',MATCH_FINISHED:'المباراة انتهت بالفعل ولا يمكن إلغاؤها',MATCH_NOT_ACTIVE:'هذه المباراة غير جارية',THEME_UNAVAILABLE:'لا يوجد عدد كافٍ من اللاعبين لهذا الفلتر',INVALID_THEME:'فلتر المزاد غير صالح'};
 throw Error(codes[j.error]||j.error||'تعذر تنفيذ الطلب')}
 return j;
}
function loadResult(j,force=false){if(fr117Leaving)return;
 if(j.id&&j.token){session={id:j.id,token:j.token};save()}
 if(j.room){const r=j.room;const sig=JSON.stringify([r.stage,r.roundIndex,r.slot,r.family,r.turn,r.highest,r.leader,r.pickWinner,r.winningBid,r.passed,r.lastReveal?.round,r.players.map(p=>[p.joined,p.budget,p.squad?.length,p.plan]),r.match?.score,r.match?.startedAt,tab]);
 const previousStage=room?.stage;room=r;if(r.stage==='result')window.FR101_SHARED_MATCH?.setFirstPickCancelAllowed?.(r.fr123Version===1&&!r.fr123Finalized);if(previousStage!==r.stage)app.scrollTo(0,0);if(force||sig!==lastSig){lastSig=sig;if(!(r.stage==='plan'&&previousStage==='plan'&&fr100Review&&!r.players[r.you].plan))render()}if(r.stage==='result'&&r.fr123Finalized)syncAccountResult(r)}
 updateClock();
}
async function doAction(op,data={}){
 if(busy||!session)return;busy=true;
 try{loadResult(await api({op,...data}),true)}catch(e){toast(e.message)}finally{busy=false}
}
async function syncAccountResult(r){
 if(!session||!r.match||!Array.isArray(r.match.score))return;
 const key=r.id+':'+r.match.startedAt+':'+r.you;
 if(fr95Saved===key||Date.now()-fr95LastSaveAttempt<12000)return;
 fr95LastSaveAttempt=Date.now();
 try{const response=await fetch('/api/fr93-results',{method:'POST',credentials:'same-origin',cache:'no-store',
 headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'commit',kind:'first-pick',code:r.id,token:session.token})});
 const j=await response.json();if(response.ok&&j.ok)fr95Saved=key;
 if(response.status===401)fr95Saved=key;}catch(e){}
}
async function refresh(){
 if(!session||busy)return;
 try{const old=session,j=await api({op:'state'});if(!session||session.id!==old.id||session.token!==old.token)return;loadResult(j)}catch(e){if(e.message.includes('جلسة الغرفة')){session=null;room=null;save();render()}else if(!document.querySelector('.fr95-toast'))toast(e.message)}
}
function inputName(){try{return L.getItem('fr:pentagon:name')||L.getItem('fr95:firstpick:name')||''}catch(_){return ''}}
function getName(){let name=byId('fr95-name')?.value?.trim()||inputName()||'لاعب';try{L.setItem('fr95:firstpick:name',name);L.setItem('fr:pentagon:name',name)}catch(_){}return name}
function setScene(name){scene=name;render();app.scrollTo(0,0)}
function fr140IncludeWomen(){try{return localStorage.getItem('fr:cards:includeWomen:v1')!=='false'}catch{return true}}
async function create(){
 if(busy)return;busy=true;try{const j=await api({op:'create',mode,difficulty,name:getName(),club:fr119ClubId,theme:fr123ThemeChoice,includeWomen:fr140IncludeWomen()},false);scene='game';loadResult(j,true)}catch(e){toast(e.message)}finally{busy=false}
}
async function join(id){if(busy)return;busy=true;try{const j=await api({op:'join',code:id,name:getName(),club:fr119ClubId},false);if(location.search)history.replaceState(null,'',ROOT);scene='game';loadResult(j,true)}catch(e){toast(e.message)}finally{busy=false}}
function intro(){
 app.innerHTML='<div class="fr123-ui app-shell"><header class="topbar"><a class="back" href="/auction/" aria-label="العودة إلى المزاد">❮</a><a class="brand" href="/auction/"><img src="/assets/brand/logo-fr.svg" alt="FOOTBALL RIVALS"><span>FOOTBALL <strong>RIVALS</strong></span></a><span class="mode-brand">الاختيار الأول <span>150M</span></span></header><main><section class="fr108-entry" aria-label="مزاد الاختيار الأول"><div class="fr108-hero"><figure class="fr108-poster"><img src="/assets/auction/firstpick/entry-fr96.webp?v=fr98" width="1086" height="1448" alt="مزاد الاختيار الأول — الملصق الرسمي للنجوم" fetchpriority="high"></figure><div class="fr108-story"><span class="fr108-kicker">FIRST PICK AUCTION · 150M</span><h1>مزاد الاختيار الأول</h1><p class="fr108-lede">بطاقتان في كل جولة، ومزايدة تحسم مين يختار الأول قبل مواجهة الفريقين.</p><div class="fr108-facts"><span><b>150M</b><small>الميزانية</small></span><span><b>07</b><small>جولات المزاد</small></span><span><b>15s</b><small>لكل دور</small></span></div><div class="fr108-main-actions"><button type="button" class="btn gold" id="fr97-start" aria-label="ابدأ الآن">ابدأ المزاد الآن</button><button type="button" class="btn ghost" id="fr97-show-rules">قواعد اللعبة</button></div></div></div><div class="fr108-section-label"><span>CHOOSE YOUR MODE</span><h2>اختر طريقة المنافسة</h2></div><div class="fr108-modes"><div class="panel mode-card fr108-mode"><span class="tag green fr108-chip">AI · THREE LEVELS</span><h3>🤖 ضد الذكاء الاصطناعي</h3><p>سهل أو متوسط أو احترافي، وكلهم يخضعوا لنفس قواعد المزاد.</p><button type="button" class="btn ghost block" id="fr97-ai">اختر منافسك</button></div><div class="panel mode-card battle fr108-mode fr108-mode-rival"><span class="tag red fr108-chip">1 VS 1 · REAL TIME</span><h3>⚔️ مواجهة صديق</h3><p>أنشئ غرفة، شارك الرابط وتنافسوا على حق الاختيار الأول بالتزامن.</p><button type="button" class="btn ghost block" id="fr97-pvp">إنشاء غرفة</button></div></div><details class="panel help" id="fr97-rules"><summary>قواعد مزاد الاختيار الأول بالتفصيل</summary><p>كل منافس يبدأ بميزانية 150 مليون. المزاد 7 جولات، ينتج عنها 5 لاعبين أساسيين و2 احتياطيين لكل فريق. تظهر بطاقتان حقيقيتان في كل جولة، وتتنافس على حق الاختيار الأول بينهما.</p><p>أول مزايدة تبدأ من 2 مليون، وأقل زيادة مليون. لكل دور 15 ثانية؛ الفائز يدفع عرضه ويختار بطاقة خلال 10 ثوانٍ، والخاسر يحصل على البطاقة الأخرى مقابل مليون واحد. بدون أي عروض، تتناوب أولوية الاختيار بين الطرفين.</p><p>بعد السبع جولات تختار المدرب والتكتيك وخطة تبديلات مناسبة. التعادل في المحاكاة يحسمه الترجيح.</p></details></section></main><footer class="foot">FOOTBALL RIVALS · AUCTION UNIVERSE · FIRST PICK</footer></div>'+nav();
 byId('fr97-start').onclick=()=>{mode='ai';setScene('mode')};
 byId('fr97-show-rules').onclick=()=>{const d=byId('fr97-rules');d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})};
 byId('fr97-ai').onclick=()=>{mode='ai';setScene('mode')};byId('fr97-pvp').onclick=()=>{mode='pvp';setScene('mode')};
}

function fr105LegacyIntro(){
 const html=[
 '<section class="fr97-entry" aria-label="FIRST PICK — شاشة الدخول">',
 '  <header class="fr97-entry-header">',
 '    <a class="fr97-entry-back" href="/auction/" aria-label="العودة للمزادات">❮</a>',
 '    <a class="fr97-entry-brand" href="/" aria-label="FOOTBALL RIVALS">FR</a>',
 '  </header>',
 '  <div class="fr97-entry-heading"><h1>مزاد الاختيار الأول</h1><p>FIRST PICK AUCTION</p></div>',
 '  <figure class="fr97-entry-poster"><img src="/assets/auction/firstpick/entry-fr96.webp?v=fr97" width="1086" height="1448" alt="FIRST PICK — هالاند ومبابي في مواجهة الاختيار الأول" fetchpriority="high" decoding="async"></figure>',
 '  <div class="fr97-entry-metrics" aria-label="معلومات المزاد">',
 '    <div class="fr97-metric"><strong>150M</strong><span>ميزانية لكل لاعب</span></div>',
 '    <div class="fr97-metric"><strong>7</strong><span>جولات مزاد</span></div>',
 '    <div class="fr97-metric"><strong>15s</strong><span>لكل دور</span></div>',
 '  </div>',
 '  <div class="fr97-entry-actions">',
 '    <button type="button" id="fr97-start" class="fr97-button fr97-primary">ابدأ الآن</button>',
 '    <button type="button" id="fr97-show-rules" class="fr97-button fr97-secondary">قواعد اللعبة</button>',
 '  </div>',
 '  <section class="fr97-modes" id="fr97-modes" aria-label="اختر طريقة اللعب">',
 '    <article class="fr97-mode-card">',
 '      <span class="fr97-mode-tag fr97-ai-tag">AI · THREE LEVELS</span>',
 '      <h2>🤖 ضد الذكاء الاصطناعي</h2>',
 '      <p>سهل أو متوسط أو احترافي، وكلهم يخضعوا لنفس قواعد المزاد.</p>',
 '      <button type="button" id="fr97-ai" class="fr97-mode-button">اختر منافسك</button>',
 '    </article>',
 '    <article class="fr97-mode-card fr97-pvp-card">',
 '      <span class="fr97-mode-tag fr97-pvp-tag">1 VS 1 · REAL TIME</span>',
 '      <h2>⚔️ مواجهة صديق</h2>',
 '      <p>أنشئ غرفة، شارك الرابط وتنافسوا على حق الاختيار الأول بالتزامن.</p>',
 '      <button type="button" id="fr97-pvp" class="fr97-mode-button">إنشاء غرفة</button>',
 '    </article>',
 '  </section>',
 '  <details class="fr97-rules" id="fr97-rules">',
 '    <summary>قواعد مزاد الاختيار الأول بالتفصيل</summary>',
 '    <p>كل منافس يبدأ بميزانية 150 مليون. المزاد 7 جولات، ينتج عنها 5 لاعبين أساسيين و2 احتياطيين لكل فريق. تظهر بطاقتان حقيقيتان في كل جولة، وتتنافس على حق الاختيار الأول بينهما.</p>',
 '    <p>أول مزايدة تبدأ من 2 مليون، وأقل زيادة مليون. لكل دور 15 ثانية؛ الفائز يدفع عرضه ويختار بطاقة خلال 10 ثوانٍ، والخاسر يحصل على البطاقة الأخرى مقابل مليون واحد. بدون أي عروض، تتناوب أولوية الاختيار بين الطرفين.</p>',
 '    <p>الخادم يحجز مليونًا عن كل جولة متبقية، فلا تتجاوز الميزانية. بعد السبع جولات تختار المدرب والتكتيك وخطة تبديلات ذكية هجومية أو متوازنة أو دفاعية. التبديلات بحد أقصى اثنين في مراكز مناسبة. التعادل في المحاكاة يحسمه الترجيح.</p>',
 '    <p>متاح ضد الذكاء الاصطناعي بثلاثة مستويات أو مواجهة صديق 1 ضد 1 برابط غرفة خاص.</p>',
 '  </details>',
 '  <footer class="fr97-entry-footer">FOOTBALL RIVALS · AUCTION UNIVERSE · FIRST PICK</footer>',
 '</section>'
 ].join('');
 app.innerHTML=html+nav();
 byId('fr97-start').onclick=()=>byId('fr97-modes').scrollIntoView({behavior:'smooth',block:'start'});
 byId('fr97-show-rules').onclick=()=>{const d=byId('fr97-rules');d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});};
 byId('fr97-ai').onclick=()=>{mode='ai';setScene('difficulty')};
 byId('fr97-pvp').onclick=()=>{mode='pvp';setScene('pvp')};
}

const FR119_CLUBS=[{id:'alahly',ar:'الأهلي المصري',crest:0,logo:'/assets/clubs/al-ahly.png'},{id:'real',ar:'ريال مدريد',crest:86},{id:'barca',ar:'برشلونة',crest:81},{id:'liverpool',ar:'ليفربول',crest:64},{id:'city',ar:'مانشستر سيتي',crest:65},{id:'arsenal',ar:'أرسنال',crest:57},{id:'bayern',ar:'بايرن ميونخ',crest:5},{id:'atleti',ar:'أتلتيكو مدريد',crest:78},{id:'milan',ar:'ميلان',crest:98}];
let fr119ClubId=(()=>{try{return L.getItem('fr:club:preferred:v1')||L.getItem('fr95:firstpick:club')||'real'}catch(e){return 'real'}})();
const FR123_THEMES=[['general','🌍 الوضع العام','كل الكروت الأصلية'],['england','🏴 الدوري الإنجليزي','لاعبون لعبوا بالدوري عبر التاريخ'],['spain','🇪🇸 الدوري الإسباني','لاعبون لعبوا بالليجا عبر التاريخ'],['clasico','⚔️ الكلاسيكو','ريال مدريد وبرشلونة'],['legends','👑 الأساطير','الأيقونات التاريخية'],['special','⭐ SPECIAL','كروت SPECIAL EDITION فقط']];
let fr123ThemeChoice='general',fr123ThemeStatus=null,fr123ThemePending=false;
function fr123Options(){
 if(fr123ThemePending||fr123ThemeStatus)return;
 fr123ThemePending=true;
 api({op:'options',includeWomen:fr140IncludeWomen()},false).then(j=>{
  fr123ThemeStatus=Object.fromEntries((j.themes||[]).map(x=>[x.id,x]));
  document.querySelectorAll('[data-fr123-theme]').forEach(b=>{
   const status=fr123ThemeStatus[b.dataset.fr123Theme];
   b.disabled=!status?.ready;b.title=b.disabled?'لا يوجد عدد كافٍ من اللاعبين لهذا الفلتر':'اختيار فلتر المزاد';
   const note=b.querySelector('.fr123-theme-note');if(note)note.textContent=b.disabled?'غير متاح حاليًا':(FR123_THEMES.find(t=>t[0]===b.dataset.fr123Theme)?.[2]||'');
  });
 }).catch(()=>{document.querySelectorAll('[data-fr123-theme]').forEach(b=>{b.disabled=b.dataset.fr123Theme!=='general'});toast('تعذر تحميل بعض الفلاتر، يمكنك اللعب بالوضع العام')}).finally(()=>{fr123ThemePending=false});
}
function modeScreen(){
 const invite=(new URLSearchParams(location.search).get('join')||'').trim().toUpperCase();
 const isJoin=!!invite;
 if(isJoin)mode='pvp';
 const clubs=FR119_CLUBS.map(c=>'<button type="button" class="club-option '+(fr119ClubId===c.id?'selected':'')+'" data-fr119-club="'+c.id+'" aria-pressed="'+(fr119ClubId===c.id)+'"><img src="'+(c.id==='alahly'?'/assets/clubs/al-ahly.png':'https://crests.football-data.org/'+c.crest+'.png')+'" alt="" loading="lazy"><span>'+esc(c.ar)+'</span></button>').join('');
 const themes=isJoin?'<section class="fr75-panel"><strong>🌍 فلتر المزاد يحدده منشئ الغرفة</strong><p>الفلتر واحد للطرفين، وسيظهر بعد الانضمام.</p></section>':'<section class="fr75-panel"><div class="fr75-head"><strong>🏆 اختار عالم المزاد</strong><span>ALL-TIME LEAGUES</span></div><div class="fr75-grid">'+FR123_THEMES.map(t=>{const available=fr123ThemeStatus?.[t[0]]?.ready;return '<button type="button" data-fr123-theme="'+t[0]+'" class="fr75-item" aria-pressed="'+(fr123ThemeChoice===t[0])+'" '+(t[0]!=='general'&&!available?'disabled':'')+'><strong>'+t[1]+'</strong><small class="fr123-theme-note">'+(fr123ThemeStatus&&!available?'غير متاح حاليًا':t[2])+'</small></button>'}).join('')+'</div><p>البطاقات المتاحة من مكتبة اللاعبين الحقيقية ووفق تصنيف المزاد المرجعي.</p></section>';
 const levels=[['easy','سهل'],['medium','متوسط'],['pro','احترافي']].map(c=>'<button type="button" data-fr119-level="'+c[0]+'" class="btn '+(difficulty===c[0]?'active':'ghost')+'" aria-pressed="'+(difficulty===c[0])+'">'+c[1]+'</button>').join('');
 app.innerHTML='<div class="fr123-ui app-shell"><header class="topbar"><button type="button" class="back" id="fr119-back-entry" aria-label="العودة">❮</button><a class="brand" href="/auction/"><img src="/assets/brand/logo-fr.svg" alt="FOOTBALL RIVALS"><span>FOOTBALL <strong>RIVALS</strong></span></a><span class="mode-brand">الاختيار الأول <span>150M</span></span></header><main><div class="top-intro"><span class="eyebrow">STEP 01 · READY FOR AUCTION</span><h1 class="h1">'+(isJoin?'الانضمام إلى غرفة':'جهّز منافستك')+'</h1><p>اختر ناديك وشعارك الحقيقي قبل بداية الجولات.</p></div><div class="split-2"><section class="panel stack"><div class="control"><label for="fr95-name">اسمك داخل المباراة</label><input id="fr95-name" class="input" maxlength="45" autocomplete="nickname" value="'+esc(inputName())+'"></div><div><h2 class="section-title">اختار ناديك</h2><div class="club-grid" role="group" aria-label="اختيار النادي">'+clubs+'</div>'+themes+'</div></section><section class="panel stack"><div><span class="eyebrow">GAME MODE</span><h2 class="section-title">طريقة اللعب</h2></div><div class="row-buttons"><button type="button" id="fr95-ai" class="btn '+(mode==='ai'?'gold':'ghost')+'" '+(isJoin?'disabled':'')+'>🤖 ضد AI</button><button type="button" id="fr95-pvp" class="btn '+(mode==='pvp'?'gold':'ghost')+'">⚔️ 1 ضد 1</button></div><div id="fr119-ai-settings"><h3>مستوى الذكاء الاصطناعي</h3><div class="difficulty">'+levels+'</div><p class="hint">كل المستويات بنفس الـ150M، والاختلاف في قرارات المزايدة.</p></div><div id="fr119-pvp-settings" hidden><h3>غرفة خاصة</h3><p class="hint">'+(isJoin?'كود الغرفة: '+esc(invite):'هتحصل فورًا على كود ورابط مشاركة؛ صاحبك يدخل منه مباشرة.')+'</p></div><button type="button" id="fr119-start-match" class="btn gold block">ابدأ التحدي</button><p class="hint">متاحة على الموبايل والكمبيوتر · قواعد موحدة للطرفين.</p></section></div><details class="panel help"><summary>قواعد مزاد الاختيار الأول بالتفصيل</summary><p>150 مليون لكل لاعب، و7 جولات لتكوين 5 أساسيين و2 احتياطيين. تظهر بطاقتان في كل جولة، ويتنافس اللاعبان على حق الاختيار الأول. الفائز يدفع عرضه ويختار، ويحصل الآخر على البطاقة الثانية بمليون. بعدها يختار كل طرف المدرب والتكتيك والتبديلات، ويحسم الترجيح التعادل.</p></details></main></div>'+nav();
 const pickMode=next=>{mode=next;for(const [id,v] of [['fr95-ai','ai'],['fr95-pvp','pvp']]){const b=byId(id);b.classList.toggle('gold',v===next);b.classList.toggle('ghost',v!==next);b.setAttribute('aria-pressed',String(v===next));}byId('fr119-ai-settings').hidden=next!=='ai';byId('fr119-pvp-settings').hidden=next!=='pvp';byId('fr119-start-match').textContent=isJoin?'انضم إلى الغرفة':next==='ai'?'ابدأ التحدي ضد AI':'أنشئ الغرفة الآن'};
 byId('fr95-ai').onclick=()=>pickMode('ai');byId('fr95-pvp').onclick=()=>pickMode('pvp');pickMode(mode);
 app.querySelectorAll('[data-fr119-club]').forEach(b=>b.onclick=()=>{fr119ClubId=b.dataset.fr119Club;try{L.setItem('fr95:firstpick:club',fr119ClubId);L.setItem('fr:club:preferred:v1',fr119ClubId)}catch(_){}app.querySelectorAll('[data-fr119-club]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))})});
 app.querySelectorAll('[data-fr119-level]').forEach(b=>b.onclick=()=>{difficulty=b.dataset.fr119Level;try{localStorage.setItem('fr:ai:difficulty:v1',difficulty)}catch(e){}app.querySelectorAll('[data-fr119-level]').forEach(x=>{x.classList.toggle('active',x===b);x.classList.toggle('ghost',x!==b);x.setAttribute('aria-pressed',String(x===b))})});
 app.querySelectorAll('[data-fr123-theme]').forEach(b=>b.onclick=()=>{if(b.disabled)return;fr123ThemeChoice=b.dataset.fr123Theme;app.querySelectorAll('[data-fr123-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
 byId('fr119-start-match').onclick=()=>isJoin?join(invite):create();
 byId('fr119-back-entry').onclick=()=>{if(isJoin)history.replaceState(null,'',ROOT);setScene('entry')};
 if(!isJoin)fr123Options();
}

function difficultyScreen(){
 shell('مواجهة الذكاء الاصطناعي','<div class="fr95-choices"><button data-d="easy" class="fr95-option">⭐ سهل</button><button data-d="medium" class="fr95-option active">⭐⭐ متوسط</button><button data-d="pro" class="fr95-option">⭐⭐⭐ احترافي</button></div>'+
 '<input id="fr95-name" class="fr95-input" maxlength="45" placeholder="اسم اللاعب" value="'+esc(inputName())+'"><button id="fr95-start" class="fr95-btn wide">بدء المزاد</button>','اختر مستوى المنافس — بدون أي مزايا غش أو ميزانية إضافية');
 document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{difficulty=b.dataset.d;try{localStorage.setItem('fr:ai:difficulty:v1',difficulty)}catch(e){}document.querySelectorAll('[data-d]').forEach(v=>v.classList.toggle('active',v===b))});
 byId('fr95-start').onclick=create;
}
function pvpScreen(){
 const code=new URLSearchParams(location.search).get('join');
 shell(code?'الانضمام لمواجهة صديق':'إنشاء غرفة مواجهة','<input id="fr95-name" class="fr95-input" maxlength="45" placeholder="اسم اللاعب" value="'+esc(inputName())+'">'+
 (code?'<div class="fr95-copy">'+esc(code)+'</div><button id="fr95-pvp-start" class="fr95-btn wide">الانضمام للغرفة</button>':
 '<button id="fr95-pvp-start" class="fr95-btn wide">إنشاء غرفة ومشاركة الرابط</button>'),
 'لا تبدأ الجولة حتى ينضم اللاعب الثاني');
 byId('fr95-pvp-start').onclick=()=>code?join(code):(mode='pvp',create());
}
function lobbyScreen(r){
 const url=location.origin+ROOT+'?join='+encodeURIComponent(r.id);
 shell('غرفة المواجهة','<div class="fr95-faceoff"><strong>'+esc(r.players[0].name)+'</strong><span>VS</span><strong>بانتظار المنافس</strong></div>'+
 '<p class="fr95-muted">كود الغرفة: <span class="fr95-inline-tag">'+esc(r.id)+'</span></p><div class="fr95-copy">'+esc(url)+'</div>'+
 '<button id="fr95-copy" class="fr95-btn wide">نسخ رابط الدعوة</button><p class="fr95-subhint fr95-spinner">● بانتظار انضمام المنافس…</p>','رابط الدعوة يفتح شاشة الانضمام مباشرة');
 byId('fr95-copy').onclick=async()=>{try{await navigator.clipboard.writeText(url);toast('تم نسخ رابط الدعوة')}catch(_){toast('انسخ الرابط من المربع بالأعلى')}};
}
function fr123ClubBadge(p){const n=Number(p?.club?.crest);return (p?.club?.id==='alahly'||p?.club?.ar==='الأهلي المصري')?'<img class="fr123-club-badge" src="/assets/clubs/al-ahly.png" alt="الأهلي المصري" loading="lazy">':n?'<img class="fr123-club-badge" src="https://crests.football-data.org/'+n+'.png" alt="'+esc(p.club.ar||'')+'" loading="lazy">':''}
function head(r){
 const mine=r.players[r.you],other=r.players[1-r.you],theme=FR123_THEMES.find(t=>t[0]===(r.theme||'general'));
 return '<div class="fr95-bid-head"><div class="fr95-budget">'+fr123ClubBadge(mine)+esc(mine.name)+'<strong>'+money(mine.budget)+'</strong></div><div class="fr95-round">الجولة <span>'+(r.roundIndex+1)+'/7</span><div>'+esc(posLabel[r.slot]||r.slot)+'</div><small class="fr123-theme-tag">'+esc(theme?.[1]||'الوضع العام')+'</small></div><div class="fr95-budget">'+fr123ClubBadge(other)+esc(other.name)+'<strong>'+money(other.budget)+'</strong></div></div>';
}
function clockMarkup(r){return '<div class="fr95-clock" id="fr95-clock" data-deadline="'+Number(r.deadline||0)+'">15</div>'}
function updateClock(){const c=byId('fr95-clock');if(!c)return;const deadline=Number(c.dataset.deadline)||0;const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));c.textContent=left;c.classList.toggle('urgent',left<=5)}
function bidScreen(r){
 const mine=r.turn===r.you,remaining=Math.max(0,r.players[r.you].budget-(6-r.roundIndex));
 const min=r.highest? r.highest+1:2;
 const controls='<div class="fr95-current">أعلى مزايدة <strong>'+money(r.highest)+'</strong></div>'+
 '<div class="fr95-bid-controls">'+[1,5,10].map(n=>'<button class="fr95-btn dark" data-bid="'+n+'" '+(!mine||Math.max(2,r.highest+n)>remaining?'disabled':'')+'>+'+n+'M</button>').join('')+
 '<button class="fr95-btn" id="fr95-pass" '+(!mine?'disabled':'')+'>انسحاب</button></div>'+
 '<p class="fr95-subhint">أقصى عرض متاح '+money(remaining)+' — يتبقى 1M لكل لاعب في الجولات المقبلة</p>';
 shell('ساحة المزايدة • '+(r.roundIndex+1)+' / 7',head(r)+
 '<div class="fr95-center">'+clockMarkup(r)+'</div><div class="fr95-duel">'+r.pair.map(p=>card(p)).join('')+'</div>'+controls+
 '<div class="fr95-status">'+(mine?'<span class="fr95-green">دورك الآن — اختر عرضك أو انسحب</span>':'في انتظار قرار '+esc(r.players[r.turn].name))+'</div>',
 'المزايدة على حق اختيار واحد من البطاقتين، والخاسر يأخذ البطاقة المتبقية بسعر 1M');
 document.querySelectorAll('[data-bid]').forEach(b=>b.onclick=()=>doAction('bid',{amount:Math.max(2,r.highest+Number(b.dataset.bid))}));
 byId('fr95-pass').onclick=()=>doAction('pass');
}
function pickScreen(r){
 const mine=r.pickWinner===r.you;
 const cards=r.pair.map((p,i)=>'<button data-pick="'+i+'" class="fr95-player" '+(!mine?'disabled':'')+'><div class="fr95-player-art">'+spriteMarkup(p)+'</div><div class="fr95-player-name">'+esc(p.name)+'</div><span class="fr95-inline-tag">اختيار هذا اللاعب</span></button>').join('');
 shell('حسم الاختيار الأول',head(r)+'<div class="fr95-center">'+clockMarkup(r)+'</div><p class="fr95-current">'+esc(r.players[r.pickWinner].name)+' فاز بحق الاختيار مقابل <strong>'+money(r.winningBid)+'</strong></p>'+
 '<div class="fr95-duel">'+cards+'</div><div class="fr95-status">'+(mine?'اختر لاعبك قبل انتهاء العد — البطاقة الثانية للمنافس مقابل 1M':'انتظار اختيار الخصم — ستحصل على الكارت المتبقي مقابل 1M')+'</div>',
 'لا تُخصم أي مبالغ مرتين عند إعادة الاتصال أو الضغط المتكرر');
 document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>doAction('pick',{choice:Number(b.dataset.pick)}));
}
function spriteMarkup(p){if(p?.sprite?.cols===1&&p?.sprite?.rows===1)return '<div class="fr95-sprite" style="background:url(/cloud-v5/'+String(p.sprite.file).replace(/[^a-zA-Z0-9_./-]/g,'')+') center/contain no-repeat"></div>';const s=p?.sprite||{},c=Number(s.cols)||5,rows=Number(s.rows)||6,file=String(s.file||'').replace(/[^a-zA-Z0-9_./-]/g,'');return '<div class="fr95-sprite" style="background-image:url(/cloud-v5/'+file+');background-size:'+(c*100)+'% '+(rows*100)+'%;background-position:'+(Number(s.col||0)/(c-1)*100)+'% '+(Number(s.row||0)/(rows-1)*100)+'%"></div><span class="fr95-ovr">'+Number(p.ovr||0)+'</span><span class="fr95-pos">'+esc(p.pos)+'</span>'}
function revealScreen(r){
 const rev=r.lastReveal;if(!rev){bidScreen(r);return}
 shell('تم توزيع البطاقتين','<div class="fr95-result-badge">✓ الجولة '+rev.round+' اكتملت</div>'+
 '<div class="fr95-duel">'+rev.assigned.map((x,i)=>'<div><h3 class="fr95-subtitle">'+esc(r.players[i].name)+'</h3>'+card(x.card)+'<div class="fr95-status">'+money(x.price)+' • '+(i===rev.win?'الفائز بالاختيار':'البطاقة المتبقية')+'</div></div>').join('')+'</div>'+
 '<p class="fr95-status fr95-spinner">جاري الانتقال للتشكيلة والجولة التالية…</p>',
 'الكارتان يظهران معًا، ثم يثبت كل كارت في التشكيلة الصحيحة');
}
/* FR99: server-backed live five-a-side formations, substitutes, spending and bid history.
   Runs inside FIRST PICK client closure, does not invent players or alter auction mechanics. */
let fr99View='formations';
const FR99_POS=['GK','DF','MF','FW','FLEX','SUB1','SUB2'];
const FR99_POS_AR=['حارس','مدافع','وسط','هجوم','جوكر','احتياطي 1','احتياطي 2'];
function fr99Face(card){
 if(!card||!card.sprite)return '<span class="fr99-placeholder">＋</span>';
 const s=card.sprite,c=Math.max(1,Number(s.cols)||1),rows=Math.max(1,Number(s.rows)||1);
 const x=c>1?100*Number(s.col||0)/(c-1):50,y=rows>1?100*Number(s.row||0)/(rows-1):50;
 const file=String(s.file||'').replace(/[^a-zA-Z0-9_./-]/g,'');
 const style='background-image:url(/cloud-v5/'+file+');background-size:'+(c===1&&rows===1?'contain':(c*100)+'% '+(rows*100)+'%')+';background-repeat:no-repeat;background-position:'+x+'% '+y+'%';
 return '<span class="fr99-face" style="'+style+'" role="img" aria-label="'+esc(card.name)+'"></span>';
}
function fr99Seat(player,index,compact){
 const entry=(player.squad||[])[index],card=entry?.card;
 return '<div class="fr99-seat '+(card?'has-player':'is-empty')+(compact?' fr99-compact':'')+'" data-fr99-slot="'+FR99_POS[index]+'">'+
  '<span class="fr99-slot-tag">'+FR99_POS[index]+'</span>'+fr99Face(card)+
  '<span class="fr99-seat-name" title="'+esc(card?.name||FR99_POS_AR[index])+'">'+esc(card?.name||FR99_POS_AR[index])+'</span>'+
  '<span class="fr99-rating">'+(card?Number(card.ovr||0):'–')+'</span>'+
 '</div>';
}
function fr99Pitch(player,index){
 const count=(player.squad||[]).length;
 const order=[[3],[2,4],[1],[0]];
 const rows=order.map((ids,n)=>'<div class="fr99-lane" data-zone="'+n+'">'+ids.map(i=>fr99Seat(player,i,true)).join('')+'</div>').join('');
 const bench=[5,6].map(i=>fr99Seat(player,i,true)).join('');
 return '<article class="fr99-team" data-fr99-team="'+index+'">'+
  '<header class="fr99-team-head"><div><strong>'+esc(player.name)+'</strong><small>'+(index===0?'الفريق الأول':'الفريق الثاني')+'</small></div><div class="fr99-money">'+money(player.budget)+'<small>'+count+'/7 لاعبين</small></div></header>'+
  '<div class="fr99-pitch"><span class="fr99-field-line"></span>'+rows+'</div>'+
  '<div class="fr99-bench-label">دكة الاحتياطي <span>2</span></div><div class="fr99-bench">'+bench+'</div>'+
 '</article>';
}
function fr99Substitutes(r){
 return '<div class="fr99-substitutes">'+[r.you,1-r.you].map(side=>{
  const p=r.players[side],subs=[5,6].map(i=>fr99Seat(p,i,false)).join('');
  return '<article class="fr99-sub-team"><h4>'+esc(p.name)+'</h4><div class="fr99-sub-cards">'+subs+'</div></article>';
 }).join('')+'</div><p class="fr99-info">البدلاء يظهرون بمجرد انتهاء جولتي الاحتياطي. لا ينزل لاعب إلا في مركز مؤهل له ضمن خطة التبديلات.</p>';
}
function fr99Budgets(r){
 return '<div class="fr99-spending">'+[r.you,1-r.you].map(side=>{
  const p=r.players[side],spent=150-Number(p.budget),pct=Math.max(0,Math.min(100,spent/150*100));
  const details=(p.squad||[]).map(x=>'<div class="fr99-budget-line"><span>'+esc(x.card?.name||'')+'</span><strong>'+money(x.price)+'</strong></div>').join('');
  return '<article class="fr99-spend-card"><h4>'+esc(p.name)+'</h4><strong>'+money(p.budget)+' <small>متبقي</small></strong><div class="fr99-bar"><span style="width:'+pct.toFixed(1)+'%"></span></div><p>إجمالي الشراء: '+money(spent)+' • '+p.squad.length+'/7 بطاقات</p>'+details+'</article>';
 }).join('')+'</div>';
}
function fr99History(r){
 const log=Array.isArray(r.bidLog)?r.bidLog:[];
 const items=log.slice(-20).reverse().map(e=>{
  const label=e.type==='bid'?'مزايدة':e.type==='pass'?'تمرير':e.type==='pick'?'اختيار اللاعب':'توزيع';
  const p=r.players[e.side||0],amount=e.amount!=null?' • '+money(e.amount):'';
  const nm=e.player?' • '+esc(e.player):'';
  return '<li><span>الجولة '+(Number(e.round)||1)+' • '+label+nm+'</span><strong>'+esc(p?.name||'')+amount+'</strong></li>';
 }).join('');
 const latest=r.highest>0?'<p class="fr99-live-bid">العرض الحالي: <strong>'+money(r.highest)+'</strong> من '+esc(r.players[r.leader]?.name||'')+'</p>':'<p class="fr99-live-bid">لم تُسجل مزايدة في الجولة الحالية بعد</p>';
 return '<div class="fr99-history">'+latest+(items?'<ol>'+items+'</ol>':'<p class="fr99-info">سجل العروض سيظهر هنا فور تقديم أول مزايدة.</p>')+'</div>';
}
/* FR100 Tactical Arena — UI replacements inside existing FIRST PICK closure. */
let fr100ActiveSide=-1,fr100OpenCard=-1,fr100Review=false;
const FR100_COST={"base":0,"advanced":8,"elite":16,"roberto_martinez":0,"nuno_espirito_santo":0,"vincenzo_italiano":0,"mikel_arteta":10,"unai_emery":10,"luis_enrique":10,"carlo_ancelotti":25,"jurgen_klopp":25,"xabi_alonso":25,"pep_guardiola":40,"diego_simeone":40,"jose_mourinho":40};
const FR100_COACH=[["roberto_martinez","روبرتو مارتينيز","roberto_martinez"],["nuno_espirito_santo","نونو إسبيريتو سانتو","nuno_espirito_santo"],["vincenzo_italiano","فينتشنزو إيتاليانو","vincenzo_italiano"],["mikel_arteta","ميكيل أرتيتا","mikel_arteta"],["unai_emery","أوناي إيمري","unai_emery"],["luis_enrique","لويس إنريكي","luis_enrique"],["carlo_ancelotti","كارلو أنشيلوتي","carlo_ancelotti"],["jurgen_klopp","يورجن كلوب","jurgen_klopp"],["xabi_alonso","تشابي ألونسو","xabi_alonso"],["pep_guardiola","بيب جوارديولا","pep_guardiola"],["diego_simeone","دييجو سيميوني","diego_simeone"],["jose_mourinho","جوزيه مورينيو","jose_mourinho"]];
const FR100_STYLE={attack:['هجومي','ضغط هجومي وفرص أكثر، مع مخاطرة دفاعية'],balanced:['متوازن','توازن بين الاستحواذ والدفاع والتحولات'],defense:['دفاعي','انضباط دفاعي ومحاولة تقليل الفرص الخطيرة']};
const FR100_SUB={attack:['هجومي','أفضلية للبديل الهجومي عند توافر مركز مناسب'],balanced:['متوازن','اختيار البديل وفق الأداء والمركز المناسب'],defense:['دفاعي','ترجيح البديل الدفاعي حسب احتياج المباراة']};
function fr100Card(p,i){
 const e=(p.squad||[])[i],card=e?.card;
 return '<button type="button" class="fr100-slot '+(card?'occupied':'vacant')+'" data-fr100-slot="'+i+'" aria-label="'+esc(card?card.name+' — تفاصيل اللاعب':FR99_POS_AR[i]+' — لم يُحسم بعد')+'">'+
 '<span class="fr100-slot-pos">'+FR99_POS[i]+'</span>'+
 (card?fr99Face(card):'<span class="fr100-empty">＋</span>')+
 '<span class="fr100-slot-name" title="'+esc(card?.name||FR99_POS_AR[i])+'">'+esc(card?.name||FR99_POS_AR[i])+'</span>'+
 '<span class="fr100-slot-ovr">'+(card?card.ovr:'—')+'</span></button>';
}
function fr100Detail(p){
 const e=(p.squad||[])[fr100OpenCard],card=e?.card;
 if(!card)return '<div class="fr100-help">اضغط على أي بطاقة لمعرفة الاسم الكامل ومركز اللاعب وتكلفة ضمه.</div>';
 const positions=Array.isArray(card.eligible)&&card.eligible.length?card.eligible.join(' / '):card.pos;
 return '<div class="fr100-detail">'+fr99Face(card)+'<div><strong>'+esc(card.name)+'</strong><span>'+esc(positions||FR99_POS[fr100OpenCard])+' • التقييم '+Number(card.ovr)+'</span><small>الصفقة: '+money(e.price)+' • '+esc(FR99_POS_AR[fr100OpenCard])+'</small></div></div>';
}
function fr100Pitch(r,side){
 const p=r.players[side],mine=side===r.you,count=(p.squad||[]).length;
 const columns=[[3],[2,4],[1],[0]];
 const rows=columns.map((a,i)=>'<div class="fr100-pitch-line" data-line="'+i+'">'+a.map(n=>fr100Card(p,n)).join('')+'</div>').join('');
 return '<div class="fr100-full-team">'+
 '<div class="fr100-team-heading"><div><strong>'+esc(p.name)+'</strong><span>'+(mine?'فريقك':'فريق المنافس')+' • '+count+'/7 لاعبين</span></div><div class="fr100-cash">'+money(p.budget)+'<small>المتبقي</small></div></div>'+
 '<div class="fr100-pitch"><div class="fr100-midline"></div>'+rows+'</div>'+
 '<div class="fr100-bench-title">دكة الاحتياطي <span>2</span></div><div class="fr100-bench-row">'+[5,6].map(i=>fr100Card(p,i)).join('')+'</div>'+
 fr100Detail(p)+'</div>';
}
function fr100Comparison(r){
 const stat=side=>{const p=r.players[side],main=p.squad.slice(0,5);return {
  budget:money(p.budget),count:p.squad.length,
  avg:main.length===5?(main.reduce((a,x)=>a+Number(x.card.ovr),0)/5).toFixed(1):'—'
 }};
 const mine=stat(r.you),opp=stat(1-r.you);
 return '<div class="fr100-compare"><div><b>'+esc(r.players[r.you].name)+'</b><span>'+mine.count+'/7 • '+mine.budget+' • متوسط '+mine.avg+'</span></div><strong>VS</strong><div><b>'+esc(r.players[1-r.you].name)+'</b><span>'+opp.count+'/7 • '+opp.budget+' • متوسط '+opp.avg+'</span></div></div>';
}
function fr100Bench(r){
 return '<div class="fr100-benches">'+[r.you,1-r.you].map(side=>{
 const p=r.players[side];
 return '<section class="fr100-bench-team"><h4>'+esc(p.name)+'</h4><div class="fr100-benches-grid">'+[5,6].map(i=>{
 const e=p.squad[i],card=e?.card;return '<div class="fr100-bench-player">'+(card?fr99Face(card):'<span class="fr100-empty">＋</span>')+
 '<strong>'+esc(card?.name||FR99_POS_AR[i])+'</strong><span>'+(card?'التقييم '+card.ovr+' • '+esc((card.eligible||[card.pos]).join(' / ')):'ينتظر نهاية الجولة')+'</span>'+
 '<small>'+(e?'الصفقة '+money(e.price):'')+'</small></div>';
 }).join('')+'</div></section>';
 }).join('')+'</div><p class="fr99-info">التبديل قرار من محرك المباراة؛ لا يدخل بديل إلا في مركز مناسب وفق الخطة والأداء.</p>';
}
function fr99Panels(r){
 const views=[['formations','الملعب'],['bench','البدلاء'],['budgets','الميزانية'],['history','المزايدات']];
 const choices=views.map(([id,label])=>'<button type="button" class="fr99-switch '+(fr99View===id?'active':'')+'" data-fr99-view="'+id+'" aria-pressed="'+(fr99View===id)+'">'+label+'</button>').join('');
 const side=fr100ActiveSide<0||!r.players[fr100ActiveSide]?r.you:fr100ActiveSide;
 let body='';
 if(fr99View==='formations'){
  body=fr100Comparison(r)+'<div class="fr100-team-toggle" role="group" aria-label="اختر الفريق المعروض">'+
  [r.you,1-r.you].map((i,j)=>'<button type="button" class="fr100-team-choice '+(i===side?'selected':'')+'" data-fr100-team="'+i+'" aria-pressed="'+(i===side)+'">'+(j===0?'فريقي':'المنافس')+'</button>').join('')+'</div>'+
  fr100Pitch(r,side);
 }else if(fr99View==='bench')body=fr100Bench(r);
 else if(fr99View==='budgets')body=fr99Budgets(r);
 else body=fr99History(r);
 return '<section id="fr99-lineup-panels" class="fr99-panels fr100-panels" aria-label="ملعب FIRST PICK وإدارة التشكيلة">'+
 '<div class="fr99-panels-head"><h3>غرفة الإدارة <span class="fr99-live-dot">●</span></h3><span class="fr99-progress">'+Math.min(7,Number(r.roundIndex)||0)+'/7 جولات مكتملة</span></div>'+
 '<div class="fr99-switches">'+choices+'</div><div class="fr99-panel-body" aria-live="polite">'+body+'</div></section>';
}
function fr99WirePanels(r){
 const node=document.getElementById('fr99-lineup-panels');if(!node)return;
 function change(){
 const n=document.getElementById('fr99-lineup-panels');if(!n)return;
 const temp=document.createElement('div');temp.innerHTML=fr99Panels(room||r);n.replaceWith(temp.firstElementChild);fr99WirePanels(room||r);
 }
 node.querySelectorAll('[data-fr99-view]').forEach(b=>b.onclick=()=>{
  if(b.dataset.fr99View===fr99View)return;fr99View=b.dataset.fr99View;fr100OpenCard=-1;change();
 });
 node.querySelectorAll('[data-fr100-team]').forEach(b=>b.onclick=()=>{
  const n=Number(b.dataset.fr100Team);if(n===fr100ActiveSide)return;fr100ActiveSide=n;fr100OpenCard=-1;change();
 });
 node.querySelectorAll('[data-fr100-slot]').forEach(b=>b.onclick=()=>{
  const n=Number(b.dataset.fr100Slot);fr100OpenCard=n===fr100OpenCard?-1:n;change();
 });
}
function fr100Choice(key,value,dict){
 return '<button type="button" data-fr100-choice="'+key+'" data-fr100-value="'+value+'" class="fr100-tactic '+(plan[key]===value?'selected':'')+'">'+
 '<strong>'+dict[value][0]+'</strong><span>'+dict[value][1]+'</span></button>';
}
function fr100ReviewHtml(r){
 const p=r.players[r.you],cost=FR100_COST[plan.coach]||0,coach=FR100_COACH.find(x=>x[0]===({base:'roberto_martinez',advanced:'mikel_arteta',elite:'carlo_ancelotti'}[plan.coach]||plan.coach));
 const starting=p.squad.slice(0,5),subs=p.squad.slice(5);
 const row=(e,i)=>'<div><span>'+FR99_POS_AR[i]+'</span><b>'+esc(e?.card?.name||'—')+'</b><small>'+(e?.card?.ovr||'—')+'</small></div>';
 return '<section class="fr100-review" id="fr100-final-review">'+
 '<h3>مراجعة الخطة قبل الاعتماد</h3><p>ده ملخص قراراتك؛ مش هتبدأ المحاكاة قبل ما تضغط على زر التأكيد.</p>'+
 '<div class="fr100-review-list">'+starting.map(row).join('')+'</div>'+
 '<h4>الاحتياطي</h4><div class="fr100-review-list">'+subs.map((e,i)=>row(e,i+5)).join('')+'</div>'+
 '<div class="fr100-review-summary">'+
 '<span>التكتيك <b>'+FR100_STYLE[plan.tactic][0]+'</b></span>'+
 '<span>التبديلات <b>'+FR100_SUB[plan.subs][0]+'</b></span>'+
 '<span>المدرب <b>'+esc(coach?.[1]||'')+'</b></span>'+
 '<span>تكلفة المدرب <b>'+money(cost)+'</b></span>'+
 '<span>ميزانيتك بعد المدرب <b>'+money(p.budget-cost)+'</b></span></div>'+
 '<p class="fr100-review-note">أفضلية الاستضافة تُحسم بعد خصم تكلفة المدربين للطرفين. التبديلات تخضع للمركز والأداء أثناء المباراة، وقد لا تُستخدم كلها.</p>'+
 '<div class="fr100-review-actions"><button type="button" id="fr100-edit-plan">تعديل الخطة</button>'+
 '<button type="button" id="fr100-final-confirm">تأكيد الخطة وبدء المباراة</button></div></section>';
}

function lineup(r){return fr99Panels(r)}
function planScreen(r){
 const mine=r.players[r.you],other=r.players[1-r.you],locked=!!mine.plan;
 if(locked&&mine.plan&&mine.plan.coach)plan={...mine.plan};
 const toggles='<div class="fr100-stage-switch"><button id="fr95-tab-lineup" class="'+(tab==='lineup'?'selected':'')+'">الملعب والتشكيلة</button>'+
 '<button id="fr95-tab-plan" class="'+(tab==='plan'?'selected':'')+'">المدرب والتكتيك</button></div>';
 let content=fr100Comparison(r)+toggles;
 if(tab==='lineup'){
  content+=fr99Panels(r)+'<button type="button" id="fr95-go-plan" class="fr95-btn wide">اختيار المدرب والتكتيك</button>';
 }else if(fr100Review&&!locked){
  content+=fr100ReviewHtml(r);
 }else{
  const group=(title,key,dict)=>'<section class="fr100-setting"><h3>'+title+'</h3><div class="fr100-tactics">'+
   ['attack','balanced','defense'].map(v=>fr100Choice(key,v,dict)).join('')+'</div></section>';
  content+=group('تكتيك المباراة','tactic',FR100_STYLE)+group('التبديلات الذكية','subs',FR100_SUB)+
  '<section class="fr100-setting"><h3>المدرب</h3><div class="fr100-coaches">'+
  FR100_COACH.map(q=>'<button type="button" data-fr100-coach="'+q[0]+'" class="fr100-coach-card '+((({base:'roberto_martinez',advanced:'mikel_arteta',elite:'carlo_ancelotti'}[plan.coach]||plan.coach)===q[0])?'selected':'')+'" '+(locked||FR100_COST[q[0]]>mine.budget?'disabled':'')+'>'+
  '<img src="/assets/auction/coaches/'+q[2]+'.webp" alt="'+q[1]+'" loading="lazy"><strong>'+q[1]+'</strong>'+
  '<span>'+money(FR100_COST[q[0]])+(FR100_COST[q[0]]>mine.budget?' · الرصيد غير كافٍ':'')+'</span></button>').join('')+'</div></section>'+
  '<div class="fr100-plan-preview"><div>التكتيك <b>'+FR100_STYLE[plan.tactic][0]+'</b></div>'+
  '<div>خطة البدلاء <b>'+FR100_SUB[plan.subs][0]+'</b></div>'+
  '<div>المتبقي بعد المدرب <b>'+money(mine.budget-(FR100_COST[plan.coach]||0))+'</b></div></div>'+
  '<div class="fr100-timeline"><strong>خطة تبديلات متوقعة</strong><span>قرب الدقيقة 55: تقييم الأداء والبديل المناسب</span><span>قرب الدقيقة 75: قرار ثانٍ عند الحاجة</span><small>المواعيد تقريبية والتبديل مشروط بالجاهزية والمركز.</small></div>'+
  '<button type="button" id="fr100-review-button" class="fr95-btn wide" '+(locked?'disabled':'')+'>'+(locked?'تم تثبيت خطتك':'مراجعة الخطة قبل اعتماد المحاكاة')+'</button>';
 }
 content+='<p class="fr95-status">'+(locked?'✓ تم اعتماد خطتك؛ '+(other.plan?'تُجهز نتيجة المباراة':'بانتظار اعتماد المنافس'):'تُحفظ الخطة مرة واحدة فقط بعد تأكيدك، ولا يتم خصم تكلفة المدرب إلا عند الاعتماد')+'</p>';
 shell('غرفة التكتيك',content,'5 أساسيين + 2 احتياطيين، وتبديلات ذكية مرتبطة بالمركز والأداء');
 byId('fr95-tab-lineup').onclick=()=>{tab='lineup';fr100Review=false;render();app.scrollTo(0,0)};
 byId('fr95-tab-plan').onclick=()=>{tab='plan';fr100Review=false;render();app.scrollTo(0,0)};
 const go=byId('fr95-go-plan');if(go)go.onclick=()=>{tab='plan';render();app.scrollTo(0,0)};
 document.querySelectorAll('[data-fr100-choice]').forEach(b=>b.onclick=()=>{if(locked)return;plan[b.dataset.fr100Choice]=b.dataset.fr100Value;fr100Review=false;render()});
 document.querySelectorAll('[data-fr100-coach]').forEach(b=>b.onclick=()=>{if(locked)return;plan.coach=b.dataset.fr100Coach;fr100Review=false;render()});
 const review=byId('fr100-review-button');if(review)review.onclick=()=>{if(locked)return;if((FR100_COST[plan.coach]||0)>mine.budget){toast('الميزانية لا تكفي للمدرب');return}fr100Review=true;render();requestAnimationFrame(()=>byId('fr100-final-review')?.scrollIntoView({block:'start',behavior:'auto'}))};
 const edit=byId('fr100-edit-plan');if(edit)edit.onclick=()=>{fr100Review=false;render()};
 const confirm=byId('fr100-final-confirm');if(confirm)confirm.onclick=()=>{if(locked)return;confirm.disabled=true;doAction('plan',{...plan})};
}


let fr123CancelPending=false,fr123FinishKey='',fr123FinishAttempt=0;
async function fr123Cancel(){
 if(fr123CancelPending||!session)return;
 fr123CancelPending=true;
 try{const old=session,j=await api({op:'leave'});if(session?.id===old.id&&session?.token===old.token)loadResult(j,true)}
 catch(e){toast(e.message);await refresh()}
 finally{fr123CancelPending=false}
}
async function fr123Finish(){
 if(!session||room?.stage!=='result'||room.fr123Version!==1||room.fr123Finalized)return;
 const old=session,key=room.id+':'+room.match?.startedAt;
 if(fr123FinishKey===key||Date.now()-fr123FinishAttempt<8000)return;
 fr123FinishAttempt=Date.now();fr123FinishKey=key;
 try{const j=await api({op:'finalize'});if(session?.id===old.id&&session?.token===old.token)loadResult(j)}
 catch(_){fr123FinishKey='';refresh()}
}
function fr123ClearSession(){
 session=null;room=null;lastSig='';fr123FinishKey='';fr123FinishAttempt=0;
 tab='lineup';plan={tactic:'balanced',subs:'balanced',coach:'base'};fr100Review=false;fr100ActiveSide=-1;fr100OpenCard=-1;fr99View='formations';
 save();window.FR101_SHARED_MATCH?.dispose();
 if(location.search)history.replaceState(null,'',ROOT);
}
function fr123CancelledScreen(r){
 const by=Number(r.cancelled?.by),name=r.players?.[by]?.name||'أحد اللاعبين';
 shell('تم إلغاء المباراة','<div class="fr120-official-result"><p>ألغى '+esc(name)+' المباراة. لم تُسجّل نتيجة لهذه المواجهة.</p><button id="fr123-cancel-new" type="button" class="fr95-btn">مباراة جديدة</button> <button id="fr123-cancel-back" type="button" class="fr95-btn ghost">العودة للمزاد</button></div>');
 byId('fr123-cancel-new').onclick=()=>{fr123ClearSession();scene='mode';mode='ai';render();app.scrollTo(0,0)};
 byId('fr123-cancel-back').onclick=()=>{fr123ClearSession();clearInterval(poll);location.assign('/auction/')};
}
function resultScreen(r){
 const m=r.match;
 if(!m?.fr101Match||!Array.isArray(m.fr101Match.events)){
  const score=Array.isArray(m?.score)?m.score:[0,0],a=r.players?.[0]?.name||'الفريق الأول',b=r.players?.[1]?.name||'الفريق الثاني';
  const extra=Array.isArray(m?.penalties)?'<p class="fr95-muted">ركلات الترجيح: '+m.penalties.join(' - ')+'</p>':'';
  shell('نتيجة المباراة','<div class="fr120-official-result"><p>النتيجة الرسمية المحفوظة</p><strong>'+esc(a)+' '+Number(score[0])+' - '+Number(score[1])+' '+esc(b)+'</strong>'+extra+'<p>تعذّر تشغيل العرض السينمائي، لكن النتيجة لم تُفقد.</p><button id="fr120-try-again" type="button" class="fr95-btn">إعادة محاولة العرض</button></div>');
  const retry=byId('fr120-try-again');if(retry)retry.onclick=()=>refresh();return;
 }
 const movie=window.FR101_SHARED_MATCH;if(!movie)throw Error('FR101_CINEMATIC_RUNTIME_MISSING');
 app.innerHTML='<div id="fr101-match" class="fr101-match-host"></div>';
 const serverMovie=m.fr101Match;
 const replayId='fr120:firstpick:local-replay:'+r.id+':'+m.startedAt;
 if(Date.now()>m.startedAt+Number(serverMovie.duration)+2000){let replayStart=Number(sessionStorage.getItem(replayId))||0;if(!replayStart){replayStart=Date.now();sessionStorage.setItem(replayId,String(replayStart));}serverMovie.startedAt=replayStart;}
 movie.onCancel=fr123Cancel;movie.onFinished=fr123Finish;
 movie.mount(byId('fr101-match'),{you:r.you,room:{code:r.id,stage:'match',fr123CanCancel:r.fr123Version===1&&!r.fr123Finalized,players:serverMovie.fr101Teams,match:serverMovie}});
 const host=byId('fr101-match');host.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b||!host.contains(b)||!['new','back-auction'].includes(b.dataset.action))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const choice=b.dataset.action;fr123ClearSession();
  if(choice==='new'){scene='mode';mode='ai';render();app.scrollTo(0,0)}else{clearInterval(poll);location.assign('/auction/')}
 },true);
}

function render(){
 if(room?.stage!=='result')window.FR101_SHARED_MATCH?.dispose();
 if(!session){
  if(scene==='entry')intro();else if(scene==='mode')modeScreen();else if(scene==='difficulty')difficultyScreen();else if(scene==='pvp')pvpScreen();else intro();return;
 }
 if(!room){shell('جاري استعادة الغرفة','<p class="fr95-muted fr95-spinner">انتظر استجابة الخادم…</p>');return}
 switch(room.stage){
  case 'lobby':lobbyScreen(room);break;
  case 'auction':bidScreen(room);break;
  case 'pick':pickScreen(room);break;
  case 'reveal':revealScreen(room);break;
  case 'plan':planScreen(room);break;
  case 'result':resultScreen(room);break;
  case 'forfeit':forfeitScreen(room);break;
  case 'cancelled':fr123CancelledScreen(room);break;
  default:shell('حالة غير متوقعة','<button class="fr95-btn" id="fr95-retry">إعادة محاولة</button>');byId('fr95-retry').onclick=refresh;
 }
 updateClock();
}
const params=new URLSearchParams(location.search);
try{const old=JSON.parse(L.getItem('fr95:firstpick:session')||'null');if(old?.id&&old?.token)session=old;}catch(_){}
if(params.get('join')&&(!session||session.id!==String(params.get('join')).toUpperCase())){session=null;room=null;scene='mode';mode='pvp'}
render();
if(session)refresh();
poll=setInterval(refresh,1300);setInterval(updateClock,250);
})();

;document.addEventListener('input',function(e){if(e.target&&e.target.id==='fr95-name'){try{const n=e.target.value.trim().slice(0,28);if(n)localStorage.setItem('fr:pentagon:name',n)}catch(_){}}});
