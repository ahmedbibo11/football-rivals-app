/* FR66 • PENTAGON AUCTION • standalone client, no mutations to other game surfaces. */
(()=>{'use strict';
const app=document.getElementById('app'),toast=document.getElementById('toast');
const API='/api/auction-five';
const CLUBS=[{id:'alahly',ar:'الأهلي المصري',crest:0,logo:'/assets/clubs/al-ahly.png'},{id:'real',ar:'ريال مدريد',crest:86},{id:'barca',ar:'برشلونة',crest:81},{id:'liverpool',ar:'ليفربول',crest:64},{id:'city',ar:'مانشستر سيتي',crest:65},{id:'arsenal',ar:'أرسنال',crest:57},{id:'bayern',ar:'بايرن ميونخ',crest:5},{id:'atleti',ar:'أتلتيكو مدريد',crest:78},{id:'milan',ar:'ميلان',crest:98}];
const POS=['GK','DEF','MID','FW','FLEX'],POSNAME={GK:'حارس مرمى',DEF:'مدافع',MID:'وسط',FW:'مهاجم',FLEX:'جوكر'};
let mode='ai',difficulty=(()=>{try{const v=localStorage.getItem('fr:ai:difficulty:v1');return ['easy','medium','pro'].includes(v)?v:'medium'}catch(e){return 'medium'}})(),clubId=(()=>{try{const v=localStorage.getItem('fr:club:preferred:v1');return ['alahly','real','barca','liverpool','city','arsenal','bayern','atleti','milan'].includes(v)?v:'real'}catch(e){return 'real'}})(),userName=(()=>{try{return localStorage.getItem('fr:pentagon:name')}catch(e){return ''}})()||'بيبو',screen='entry',session=null,view=null,rev=-1,clockOffset=0,pollBusy=false,actionBusy=false,interval=null,seenEvents=-1,joiningCode='';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const logo=c=>c?.id==='alahly'?'/assets/clubs/al-ahly.png':`https://crests.football-data.org/${Number(c?.crest)||86}.png`;
const btn=(text,act,cls='gold',extra='')=>`<button type="button" class="btn ${cls}" data-action="${act}" ${extra}>${text}</button>`;
const cardsprite=(card,cls='',caption=false)=>{if(!card?.sprite)return `<div class="card-sprite ${cls} placeholder">${card?.ovr||'?'}</div>`;const p=card.sprite,cols=Math.max(1,Number(p.cols)||5),rows=Math.max(1,Number(p.rows)||6),x=cols===1?50:Math.round(100*(Number(p.col)||0)/Math.max(1,cols-1)),y=rows===1?50:Math.round(100*(Number(p.row)||0)/Math.max(1,rows-1));const path='/cloud-v5/'+String(p.file).split('/').map(encodeURIComponent).join('/');return `<div class="card-sprite ${cls}" title="${safe(card.name)} ${card.ovr}" style="background-image:url('${path}');background-size:${cols===1&&rows===1?'contain':cols*100+'% '+rows*100+'%'};background-repeat:no-repeat;background-position:${x}% ${y}%;${String(p.file).includes('fr76-row-')?'aspect-ratio:.9;':''}">${caption&&cols!==1?`<span class="card-caption">${safe(card.name)} · ${card.ovr}</span>`:''}</div>`};
function notify(msg,err=false){toast.textContent=msg;toast.style.cssText=`position:fixed;bottom:22px;left:50%;transform:translateX(-50%);max-width:min(90vw,450px);z-index:99;padding:12px 19px;border-radius:12px;box-shadow:0 6px 20px #0009;background:${err?'#692b42':'#174d47'};color:#fff;font-weight:800;text-align:center;opacity:1`;setTimeout(()=>{toast.style.opacity='0'},3000)}
function clubPicker(){return `<div class="club-grid">${CLUBS.map(c=>`<button type="button" data-action="club" data-value="${c.id}" class="club-option ${c.id===clubId?'selected':''}"><img src="${logo(c)}" alt="${safe(c.ar)}" loading="lazy" onerror="this.style.visibility='hidden'"><span>${safe(c.ar)}</span></button>`).join('')}</div>`}
const rules=()=>`<details class="panel help"><summary>قواعد مزاد الخماسي بالتفصيل</summary><p>100 مليون لكل لاعب، 5 جولات: GK ثم DEF ثم MID ثم FW ثم FLEX. تبدأ كل بطاقة من 1M. المزايدة بالتناوب، 15 ثانية كاملة لكل دور. صاحب آخر عرض صحيح يفوز ويدفع السعر؛ الخاسر يحصل على كارت غامض مجاني من نفس المركز، وقد يكون أقوى أو قريبًا أو أضعف من المعروض. انتهاء الدور الأول دون عرض يسجل 1M تلقائيًا مع إعطاء المنافس فرصة 15 ثانية. الانسحاب الصريح قبل أي مزايدة يسمح بمرور الدور. الجوكر من لاعبين حقيقيين متعددي المراكز. بعد تكوين الفريق يختار كل لاعب مدربًا مجانيًا أو يرقّيه، وصاحب الرصيد الأعلى بعد الترقية يستضيف المباراة على ملعب النادي الذي اختاره. بعد المدربين تظهر مقارنة الفريقين، ثم تبدأ المحاكاة بعد تأكيد الجاهزية، وضربات ترجيح عند التعادل.</p></details>`;
function entry(){return `<section class="entry-screen" aria-label="مزاد الخماسي — شاشة الدخول"><img src="/assets/fr137/fiveentry.webp?frb=football-rivals-arena-bundled1124-bibo21_vercel_app" onerror="this.onerror=null;this.src='/assets/auction/five/entry.png'" width="1080" height="1920" alt="مزاد الخماسي، ملعب ومزايدة بين نجوم حقيقيين، ميزانية 100 مليون وخمس جولات" fetchpriority="high">
<a class="entry-back" href="/auction/" aria-label="العودة إلى المزاد"></a><button type="button" class="entry-cta" data-action="select" aria-label="ابدأ الآن"></button><button type="button" class="entry-rules" data-action="rules" aria-label="قواعد اللعبة"></button></section><div class="split-2 entry-more"><div class="panel mode-card"><span class="tag green">AI · THREE LEVELS</span><h3>🤖 ضد الذكاء الاصطناعي</h3><p>سهل أو متوسط أو احترافي، وكلهم يخضعوا لنفس قواعد المزاد.</p>${btn('اختر منافسك','choose-ai','ghost block')}</div><div class="panel mode-card battle"><span class="tag red">1 VS 1 · REAL TIME</span><h3>⚔️ مواجهة صديق</h3><p>أنشئ غرفة، شارك الرابط وتنافسوا على نفس اللاعبين بالتزامن.</p>${btn('إنشاء غرفة','choose-pvp','ghost block')}</div></div>${rules()}`}

/* FR75 historical leagues picker: creator chooses, joiner inherits. */
const FR75_MODES=[['general','🌍 الوضع العام','كل الكروت الأصلية'],['england','🏴 الدوري الإنجليزي','لاعبون لعبوا بالدوري عبر التاريخ'],['spain','🇪🇸 الدوري الإسباني','لاعبون لعبوا بالليجا عبر التاريخ'],['clasico','⚔️ الكلاسيكو','ريال مدريد وبرشلونة — مزاد مختلط'],['legends','👑 الأساطير','الأيقونات التاريخية والحراس البارزون'],['special','⭐ SPECIAL','كروت SPECIAL EDITION فقط']];
let fr75Choice='general';
function fr75Name(id){return FR75_MODES.find(x=>x[0]===id)?.[1]||FR75_MODES[0][1];}
function fr75Picker(){return screen==='join'?'<section class="fr75-panel"><strong>🌍 فلتر المزاد يحدده منشئ الغرفة</strong><p>الفلتر واحد للطرفين، وسيظهر بعد الانضمام، ولا يمكن تغييره أثناء المزاد.</p></section>':'<section class="fr75-panel"><div class="fr75-head"><strong>🏆 اختار عالم المزاد</strong><span>ALL-TIME LEAGUES</span></div><div class="fr75-grid">'+FR75_MODES.map(t=>'<button type="button" data-action="fr75-choice" data-value="'+t[0]+'" class="fr75-item" aria-pressed="'+(fr75Choice===t[0])+'"><strong>'+t[1]+'</strong><small>'+t[2]+'</small></button>').join('')+'</div><p>التصنيف مبني على سجلات أندية محددة في مكتبة اللعبة، ويشمل اللاعبين الحاليين والمعتزلين والأساطير. الكارت الغامض يلتزم بنفس الفلتر، وأي لاعب غير مصنف يظل في الوضع العام.</p></section>';}

function configure(){return `<div class="top-intro"><span class="eyebrow">STEP 01 · READY FOR AUCTION</span><h1 class="h1">${screen==='join'?'الانضمام إلى غرفة':'جهّز منافستك'}</h1><p>اختر ناديك وشعارك الحقيقي قبل بداية الجولات.</p></div><div class="split-2"><section class="panel stack"><div class="control"><label for="name">اسمك داخل المباراة</label><input id="name" class="input" maxlength="22" value="${safe(userName)}" autocomplete="nickname"></div><div><h2 class="section-title" style="margin:5px 0 13px">اختار ناديك</h2>${clubPicker()}${fr75Picker()}</div></section><section class="panel stack"><div><span class="eyebrow">GAME MODE</span><h2 class="section-title">طريقة اللعب</h2></div><div class="row-buttons">${btn('🤖 ضد AI','choose-ai',mode==='ai'?'gold':'ghost')}${btn('⚔️ 1 ضد 1','choose-pvp',mode==='pvp'?'gold':'ghost')}</div>${mode==='ai'?`<div><h3>مستوى الذكاء الاصطناعي</h3><div class="difficulty">${[['easy','سهل'],['medium','متوسط'],['pro','احترافي']].map(([id,label])=>`<button type="button" class="btn ${id===difficulty?'active':'ghost'}" data-action="difficulty" data-value="${id}">${label}</button>`).join('')}</div><p class="hint">كل المستويات بنفس الـ100M، والاختلاف في قرارات المزايدة.</p></div>`:`<div><h3>غرفة خاصة</h3><p class="hint">هتحصل فورًا على كود ورابط مشاركة؛ صاحبك يدخل منه مباشرة.</p></div>`}${screen==='join'?`<div class="control"><label>كود الغرفة</label><input class="input code" id="join-code" maxlength="10" value="${safe(joiningCode)}"></div>`:`<div></div>`}${btn(screen==='join'?'انضم إلى الغرفة':mode==='ai'?'ابدأ التحدي ضد AI':'أنشئ الغرفة الآن',screen==='join'?'join':'create','gold block')}<p class="hint">متاحة على الموبايل والكمبيوتر · قواعد موحدة للطرفين.</p></section></div>${rules()}`}
function fr130OwnerName(p){const name=String(p?.name||'').trim();return name?'<small class="fr130-owner-name" dir="auto" style="display:block;max-width:100%;font-size:clamp(10px,2.6vw,12px);line-height:1.3;font-weight:800;color:#c9e6ed;white-space:normal;overflow-wrap:anywhere;text-align:center">👤 '+safe(name)+'</small>':'';}
function crest(p){return `<img src="${logo(p.club)}" alt="${safe(p.club.ar)}" onerror="this.style.visibility='hidden'">`}
function room(){const s=view.room,p=s.players[view.you],other=s.players[1-view.you];return `<div class="top-intro"><span class="eyebrow">PRIVATE AUCTION ROOM · 1 VS 1</span><h1 class="h1">غرفة مزاد الخماسي</h1><p>الميزانية 100M لكل لاعب · الدور 15 ثانية · 5 مراكز · ${fr75Name(s.theme)}</p></div><div class="split-2"><div class="panel">${renderLobbyPlayer(p,true)}</div><div class="panel">${other?renderLobbyPlayer(other,false):'<div class="loading">في انتظار دخول المنافس…</div>'}</div></div><section class="panel gold-edge" style="margin-top:15px;text-align:center"><div class="eyebrow">ROOM CODE</div><div class="code">${safe(s.code)}</div><div class="row-buttons" style="justify-content:center;margin-top:14px">${btn('نسخ رابط الغرفة','share','gold')}${btn('نسخ الكود','copy-code','ghost')}</div><p class="hint">ادخل على نفس الرابط من موبايل ثاني للانضمام — الغرفة مخصصة للاعبين فقط.</p><div class="status ${s.players.every(x=>x?.ready)?'good':'warn'}">${s.players.every(x=>x?.ready)?'الطرفان جاهزان':'في انتظار جاهزية الطرفين'}</div><div class="row-buttons" style="justify-content:center;margin-top:12px">${btn(p.ready?'إلغاء جاهزيتي':'أنا جاهز',p.ready?'unready':'ready','ghost')}${view.you===0?btn('ابدأ المزاد','start','gold',s.players.every(x=>x?.ready)?'':'disabled'):''}</div></section>${rules()}`}
function renderLobbyPlayer(p,mine){return `<div class="lobby-player">${crest(p)}<div><strong>${safe(p.name)} ${mine?'(أنت)':''}</strong><br><span>${safe(p.club.ar)}</span><br><span class="tag ${p.ready?'green':'red'}">${p.ready?'جاهز':'غير جاهز'}</span></div></div>`}
const minslot=(p,pos)=>{const slot=p.squad.find(c=>c.position===pos);return `<div class="squad-slot"><div class="slot-art">${slot?cardsprite(slot.card):'<div class="placeholder" style="height:100%">+</div>'}</div><div style="min-width:0;flex:1"><div class="slot-label">${pos} · ${POSNAME[pos]}</div><div class="slot-name">${slot?safe(slot.card.name):'مكان فارغ'}</div></div><div class="slot-rating">${slot?slot.card.ovr:'—'}</div></div>`};
function squadSide(p,mySide){return `<section class="panel squad-side ${mySide?'left':'right'}"><h3>${mySide?'تشكيلتك':'تشكيلة المنافس'} · ${p.squad.length}/5</h3><div class="slots">${POS.map(pos=>minslot(p,pos)).join('')}</div></section>`}
function auction(){const s=view.room,p=s.players[view.you],o=s.players[1-view.you],m=s.market,isTurn=s.turn===view.you,bidAmount=s.amount,seed=Math.max(1,bidAmount+1),canBid=isTurn&&p.balance>bidAmount;return `<div class="auction-head"><div class="side-head">${crest(p)}<div><span class="name">${safe(p.name)} · أنت</span><span class="balance">${p.balance}M</span></div></div><div class="round-center"><strong>${s.round+1}/5</strong><small class="fr75-theme-tag">${fr75Name(s.theme)}</small><span>${POSNAME[m.position]}</span></div><div class="side-head right">${crest(o)}<div><span class="name">${safe(o.name)}</span><span class="balance">${o.balance}M</span></div></div></div><div class="auction-layout">${squadSide(p,true)}<section class="panel focus-market"><div class="market-head"><span class="tag gold">${m.position} · ${POSNAME[m.position]}</span><span class="position">${m.ovr} OVR · ${safe(m.pos)}</span></div>${cardsprite(m,'market-art',true)}<div class="row" style="margin:8px 0 14px"><div style="text-align:right"><div class="hint">أعلى مزايدة</div><div class="bid-price">${s.amount?s.amount:1}M</div></div><div style="text-align:left"><div class="hint">${isTurn?'دورك الآن':'دور المنافس'}</div><div class="timer" id="timer">15</div></div></div>${s.highest!==null?`<div class="status">صاحب أعلى عرض: ${safe(s.players[s.highest].name)} · ${s.amount}M</div>`:`<div class="status">السعر الافتتاحي 1M · لكل لاعب فرصة كاملة</div>`}${isTurn?`<div class="bid-controls"><div class="bid-inline">${btn('−','minus','ghost',canBid?'':'disabled')}<input id="bid-input" class="input" inputmode="numeric" type="number" min="${seed}" max="${p.balance}" step="1" value="${Math.min(p.balance,seed)}" aria-label="مبلغ المزايدة بالمليون">${btn('+','plus','ghost',canBid?'':'disabled')}</div><div class="quick">${btn('+5M','plus5','ghost',canBid?'':'disabled')}${btn('+10M','plus10','ghost',canBid?'':'disabled')}</div><div class="bid-actions">${btn('انسحاب','pass','red')}${btn('تأكيد المزايدة','bid','gold',canBid?'':'disabled')}</div></div>`:`<div class="await-turn" style="margin-top:14px">⌛ المنافس يفكر في عرضه… مؤقت 15 ثانية لكل دور.</div>`}<div class="state-note">الكارت الغامض مجاني وقد يكون أقوى أو متقاربًا أو أضعف! الفوز يضمن اللاعب المعروض لا الأقوى.</div></section>${squadSide(o,false)}</div>`}
function recap(){const s=view.room,r=s.lastRound;if(!r)return `<div class="loading">جارٍ الانتقال للجولة التالية…</div>`;return `<div class="recap-box panel gold-edge"><span class="eyebrow">ROUND COMPLETE · ${safe(r.position)}</span><h1 class="h1">${r.winner===null?'جولة بلا عروض':'تم حسم المزاد!'}</h1><p class="muted">${r.winner===null?'حصل الطرفان على بدائل مجانية حقيقية':`فاز ${safe(s.players[r.winner].name)} باللاعب الأصلي مقابل ${r.price}M`}</p><div class="recap-awards">${r.awards.map(a=>{const p=s.players[a.id];return `<div class="recap-award ${a.won?'winner':''}"><h3>${safe(p.name)}</h3>${cardsprite(a.card,'',false)}<strong>${safe(a.card.name)} · ${a.card.ovr}</strong><br><span>${a.won?`اللاعب الأصلي · ${a.paid}M`:'كارت غامض مجاني · نفس المركز'}</span></div>`}).join('')}</div><p class="hint">${s.round>=5?'اكشف كارتك وكارت المنافس قبل مرحلة المدربين…':'الجولة التالية تبدأ تلقائيًا…'}</p></div>`}
function coach(){
 const s=view.room,p=s.players[view.you],o=s.players[1-view.you],list=Array.isArray(view.coaches)?view.coaches:[];
 const tiers=[['base','BASE','مجاني',0],['pro','PRO','10M',10],['elite','ELITE','25M',25],['iconic','ICONIC','40M',40]];
 const pic=c=>'/assets/auction/coaches/'+encodeURIComponent(c.id)+'.webp';
 const card=c=>'<article class="coach-option fr69-card fr69-'+(c.level||'base')+'"><div class="fr69-art"><img src="'+pic(c)+'" width="768" height="1024" loading="lazy" decoding="async" alt="'+safe(c.name)+' — '+safe(c.tier)+'" onerror="this.closest(\'.fr69-art\').classList.add(\'fr69-art-missing\')"></div><div class="fr69-card-detail"><strong>'+safe(c.name)+'</strong><span>'+safe(c.ovr)+' OVR · '+(c.cost?c.cost+'M':'مجاني')+'</span></div>'+btn(c.cost>p.balance?'الرصيد غير كافٍ · '+c.cost+'M':'اختيار '+safe(c.name)+' · متبقي '+(p.balance-c.cost)+'M','coach','gold block', 'data-value="'+safe(c.id)+'" title="'+(c.cost>p.balance?'رصيدك '+p.balance+'M وتكلفة المدرب '+c.cost+'M':'المتبقي بعد الاختيار '+(p.balance-c.cost)+'M')+'" '+(c.cost>p.balance?'disabled':'') )+'</article>';
 const selector=tiers.map(([id,title,price])=>{const matches=list.filter(c=>(c.level===id)||((id==='base'?0:id==='pro'?10:id==='elite'?25:40)===c.cost));if(!matches.length)return '';return '<section class="fr69-tier-group"><header class="fr69-tier-header"><h2>'+title+'</h2><span>'+price+' · '+matches.length+' مدربين</span></header><div class="coach-grid fr69-grid">'+matches.map(card).join('')+'</div></section>'}).join('');
 let chosen='';if(p.coach){const c=p.coach;const known=list.find(x=>x.id===c.id)||c;const artwork=known.level?'<div class="fr69-selected-art"><img src="'+pic(known)+'" alt="'+safe(c.name)+'" loading="eager"></div>':'';chosen='<section class="panel gold-edge fr69-picked"><h2 class="section-title">تم تعيين '+safe(c.name)+'</h2>'+artwork+'<p class="muted">التأثير التكتيكي +'+safe(c.bonus)+' · رصيدك '+p.balance+'M</p><div class="status">'+(o.coach?'جارٍ تحديد الملعب والمحاكاة…':'ننتظر المنافس يختار مدربه…')+'</div></section>'}
 return '<div class="top-intro"><span class="eyebrow">FR TACTICIANS · POST AUCTION</span><h1 class="h1">اختر قائد فريقك</h1><p>12 مدربًا في أربعة مستويات. كل مدرب له كارت مستقل، والتكلفة والتأثير حسب المستوى.</p></div><div class="summary-strip"><div>رصيدك<strong>'+p.balance+'M</strong></div><div>رصيد المنافس<strong>'+o.balance+'M</strong></div><div>الحالة<strong>'+(p.coach?'تم':'اختيار')+'</strong></div></div>'+(p.coach?chosen:selector)+'<div class="panel fr69-stadium"><strong class="gold-label">أرض المباراة:</strong> صاحب الرصيد الأعلى بعد تعيين المدربين يستضيف على ملعب ناديه. التعادل يعني ملعبًا محايدًا.</div>';
}
function scoreForTime(m,elapsed){if(m?.engineVersion==='FR73')return fr73State(m,elapsed);let fraction=Math.max(0,Math.min(1,elapsed/(['FR71','FR72'].includes(m.engineVersion)?25000:(m.penalty?20000:25000))));let minute=Math.round(fraction*90);let scores=[0,0];for(const e of m.events)if(e.type==='goal'&&e.minute<=minute)scores[e.side]++;return {minute,scores,events:m.events.filter(e=>e.minute<=minute)}}
/* FR70 MATCH EXPERIENCE — deterministic visual-only presentation of authoritative server match events. */
let fr70LastTacticalFrame=-1;
const fr70Dots=[
 [{x:10,y:50},{x:30,y:35},{x:48,y:53},{x:64,y:34},{x:66,y:72}],
 [{x:90,y:50},{x:70,y:66},{x:53,y:42},{x:37,y:65},{x:35,y:28}]
];
function fr70Clock(m,elapsed){return Math.min(90,Math.max(0,Math.round(Math.min(elapsed,m.penalty?20000:25000)/Math.max(1,(m.penalty?20000:25000))*90)));}
function fr70RealCard(s){
 const m=s.match||{},mvp=m.mvp||{},side=mvp.side===1?1:0,star=mvp.player||{},team=s.players[side]||{},squad=Array.isArray(team.squad)?team.squad:[];
 const chosen=squad.find(v=>String(v.card?.unique)===String(star.unique)||String(v.card?.id)===String(star.id)||v.card?.name===star.name);
 return {card:star.sprite?star:(chosen?.card||star),side,stats:(m.playerRatings?.[side]||[]).find(v=>String(v.playerId)===String(star.unique))||mvp.stats||{},mvp,team};
}
function fr70EventName(e){return (e.type==='goal'?'⚽ هدف':e.type==='save'?'🧤 تصدٍ':e.type==='yellow'?'🟨 بطاقة صفراء':'⚡ فرصة')+' · '+safe(e.player||'');}
function fr70Markers(events,minute){return events.filter(e=>e.minute<=minute).slice(-7).map(e=>'<span class="fr70-timeline-item '+(e.type==='goal'?'fr70-timeline-goal':'')+'" title="'+safe(e.text||'')+'"><b>'+(e.type==='goal'?'⚽':e.type==='save'?'🧤':e.type==='yellow'?'🟨':'•')+'</b><small>'+Number(e.minute)+"'"+'</small></span>').join('')||'<span class="fr70-timeline-empty">تبدأ الأحداث مع صافرة البداية</span>';}
function fr70Pitch(s,minute){
 const names=['GK','DEF','MID','FW','FLEX'];
 return '<div class="fr70-pitch" id="fr70-pitch" role="img" aria-label="ملعب تكتيكي يوضح مواقع خمسة لاعبين لكل فريق وحركة توضيحية للكرة"><div class="fr70-pitch-lines"><span class="fr70-pitch-half"></span><span class="fr70-pitch-center"></span><span class="fr70-pitch-box left"></span><span class="fr70-pitch-box right"></span><span class="fr70-goal left"></span><span class="fr70-goal right"></span></div>'+s.players.map((p,side)=>names.map((n,i)=>{const spot=fr70Dots[side][i];return '<span class="fr70-dot side-'+side+'" data-fr70-side="'+side+'" data-fr70-slot="'+i+'" style="left:'+spot.x+'%;top:'+spot.y+'%" title="'+safe(p?.squad?.[i]?.card?.name||n)+'"><span>'+(i+1)+'</span></span>';}).join('')).join('')+'<span id="fr70-ball" class="fr70-ball" style="left:50%;top:50%" aria-hidden="true">⚽</span><span class="fr70-side-label left">'+safe(s.players[0]?.club?.ar||'')+'</span><span class="fr70-side-label right">'+safe(s.players[1]?.club?.ar||'')+'</span></div>';
}
function fr70Summary(s){const m=s.match,w=m.winner!=null?s.players[m.winner]:null;return '<div class="fr70-result-line"><span class="fr70-result-icon">🏆</span><div><span>نتيجة المباراة</span><strong>'+(w?'الفائز: '+safe(w.club.ar):'نهاية المباراة')+'</strong></div></div>';}
function fr70StatsBars(s){const m=s.match;const stats=[['الاستحواذ',(m.possession||[50,50]),'%'],['التسديدات',(m.shots||[0,0]),''],['الفرص الخطيرة',(m.chances||[0,0]),''],['التصديات',(m.saves||[0,0]),'']];return '<section class="fr70-stats panel"><h2>إحصائيات المباراة</h2><div class="fr70-stats-teams"><span>'+safe(s.players[0].club.ar)+'</span><span>'+safe(s.players[1].club.ar)+'</span></div>'+stats.map(([label,a,suffix])=>{const x=Math.max(0,Number(a[0])||0),y=Math.max(0,Number(a[1])||0),total=Math.max(1,x+y);return '<div class="fr70-stat"><div class="fr70-stat-top"><b>'+x+suffix+'</b><span>'+label+'</span><b>'+y+suffix+'</b></div><div class="fr70-stat-track"><span class="fr70-stat-a" style="width:'+(x/total*100).toFixed(1)+'%"></span><span class="fr70-stat-b" style="width:'+(y/total*100).toFixed(1)+'%"></span></div></div>';}).join('')+'</section>';}
function fr70Awards(s){
 const {card,side,stats,mvp,team}=fr70RealCard(s);const name=card.name||mvp.player?.name||'نجم المباراة';
 const rating=Number(stats.rating??mvp.rating??0),goals=Number(stats.goals||0),assists=Number(stats.assists||0),saves=Number(stats.saves||0);
 return '<section class="fr70-awards panel" aria-label="رجل المباراة"><div class="fr70-award-kicker">MATCH AWARDS · PERFORMANCE REPORT</div><div class="fr70-awards-top"><span>⭐ رجل المباراة</span><span>MAN OF THE MATCH 🏆</span></div><div class="fr70-awards-body"><div class="fr70-mvp-frame"><span class="fr70-mvp-glint"></span><div class="fr70-mvp-card">'+cardsprite(card,'fr70-mvp-sprite')+'</div><div class="fr70-mvp-caption">LEGENDARY PERFORMANCE</div></div><div class="fr70-mvp-info"><h2>'+safe(name)+'</h2><p>'+safe(team.club?.ar||'')+' · '+safe(team.name||'')+'</p><div class="fr70-mvp-rating"><strong>'+rating.toFixed(1)+'</strong><span>التقييم النهائي <small>من 10</small></span></div><div class="fr70-mvp-metrics"><div><strong>⚽ '+goals+'</strong><span>أهداف</span></div><div><strong>🎯 '+assists+'</strong><span>أسيست</span></div><div><strong>🧤 '+saves+'</strong><span>تصديات</span></div></div><button type="button" class="btn ghost fr70-save" data-action="fr70-download">⬇ حفظ كارت رجل المباراة PNG</button></div></div></section>';
}
function fr70Ratings(s){
 const old=fr68Results(s),start=old.indexOf('<section class="fr68-ratings');
 return '<details class="fr70-details panel"><summary>تقييمات اللاعبين العشرة <span>عرض التفاصيل</span></summary>'+(start>=0?old.slice(start):'<p>لا توجد بيانات تقييم متاحة.</p>')+'</details>';
}
function fr70Lineups(s){return '<details class="fr70-details panel"><summary>التشكيلتان النهائيتان <span>عرض التشكيلة</span></summary><div class="fr70-lineups">'+s.players.map(p=>'<div class="fr70-lineup"><h3>'+safe(p.club.ar)+' <small>'+safe(p.name)+'</small></h3><div class="squad-row">'+p.squad.map(v=>'<div class="mini">'+cardsprite(v.card)+'<span>'+safe(v.position)+'</span></div>').join('')+'</div></div>').join('')+'</div></details>';}
function fr70AfterMatch(s){
 return fr70Summary(s)+fr70Awards(s)+fr70StatsBars(s)+fr70Lineups(s)+fr70Ratings(s)+'<div class="fr70-buttons">'+btn('⚽ مباراة جديدة','new','gold btn-large')+btn('العودة إلى المزاد','back-auction','ghost')+'</div>';
}
/* FR71 authoritative matchday presentation. The previous FR70 renderer remains the fallback for existing rooms. */
const FR71_REGULAR=25000,FR71_KICK_MS=1750;
let fr71LastKick=-9,fr71LastMinute=-9,fr71ResultShown=false;
function fr71Icon(e){return ({injury:'🩹',goal:'⚽',save:'🧤',yellow:'🟨',red:'🟥',var:'📺',goal_disallowed:'🚫',block:'🛡️',miss:'🎯',chance:'⚡',free_kick:'🎯',penalty_awarded:'⚖️'})[e.type]||'⚽';}
function fr71Label(e){return ({injury:'إصابة لاعب',goal:'هدف',save:'تصدي الحارس',yellow:'بطاقة صفراء',red:'بطاقة حمراء',var:'مراجعة VAR',goal_disallowed:'هدف ملغي',block:'إنقاذ دفاعي',miss:'تسديدة ضائعة',chance:'هجمة خطيرة',free_kick:'ركلة حرة',penalty_awarded:'ركلة جزاء'})[e.type]||'حدث';}
function fr71EventLine(s,e){const owner=e.actorSide===1?1:e.actorSide===0?0:e.side;return '<article class="fr71-event fr71-event-'+safe(e.type)+'"><span class="fr71-event-minute">'+Number(e.minute)+"′"+'</span><span class="fr71-event-emoji">'+fr71Icon(e)+'</span><div><strong>'+safe(fr71Label(e))+' · '+safe(e.player||'')+'</strong><p>'+safe(e.text||'')+' · '+safe(s.players[owner]?.club?.ar||'')+'</p></div></article>';}
function fr71EventList(s,events){return events.length?events.slice(-13).reverse().map(e=>fr71EventLine(s,e)).join(''):'<p class="muted">صافرة البداية… المباراة انطلقت</p>';}
function fr71EventMarkers(events,minute){return events.filter(e=>e.minute<=minute).slice(-8).map(e=>'<span class="fr70-timeline-item '+(e.type==='goal'?'fr70-timeline-goal':'')+'" title="'+safe(e.text||'')+'"><b>'+fr71Icon(e)+'</b><small>'+Number(e.minute)+"′"+'</small></span>').join('')||'<span class="fr70-timeline-empty">انطلاق المباراة</span>';}
function fr71SquadCard(s,side,id){const match=s.players[side]?.squad?.find(slot=>String(slot.card?.unique)===String(id));return match?.card||null;}
function fr71Kicks(s,m,visible){
 const pen=m.penalty;if(!pen)return '';
 const seq=pen.sequence||[],shown=seq.slice(0,visible);
 const rows=s.players.map((p,side)=>{
   const kicks=shown.filter(k=>k.side===side);
   return '<div class="fr71-penalty-team"><span>'+safe(p.club?.ar||p.name)+'</span><strong>'+kicks.filter(k=>k.scored).length+'</strong><div class="fr71-kick-marks">'+Array.from({length:Math.max(5,kicks.length)},(_,i)=>i<kicks.length?'<span class="'+(kicks[i].scored?'hit':'miss')+'">'+(kicks[i].scored?'✓':'×')+'</span>':'<span class="pending">·</span>').join('')+'</div></div>';
 }).join('');
 const current=seq[Math.min(visible,seq.length-1)]||null;
 let stage='<div class="fr71-penalty-prompt">🏟️ استعداد لتسديد أول ركلة…</div>';
 if(current&&visible<seq.length){
   const kicker=fr71SquadCard(s,current.side,current.playerId),goalkeeper=fr71SquadCard(s,1-current.side,current.keeperId);
   stage='<div class="fr71-duel"><div class="fr71-duel-card"><span>🎯 المسدد</span>'+cardsprite(kicker,'fr71-sprite')+'<b>'+safe(current.player)+'</b></div><div class="fr71-versus">VS<small>ضربة '+(current.round)+'</small></div><div class="fr71-duel-card"><span>🧤 الحارس</span>'+cardsprite(goalkeeper,'fr71-sprite')+'<b>'+safe(current.keeper)+'</b></div></div>';
 }else if(visible>=seq.length)stage='<div class="fr71-penalty-prompt">🏆 نهاية ضربات الترجيح · الفائز '+safe(s.players[pen.winner]?.club?.ar||'')+'</div>';
 const last=shown[shown.length-1];
 const lane=last?'<div class="fr71-shot-lane '+(last.scored?'goal':last.outcome==='save'?'saved':'miss')+'"><div class="fr71-shot-target">'+(last.outcome==='save'?'🧤':'🥅')+'</div><span class="fr71-shot-ball">⚽</span></div>':'';
 return '<div class="fr71-penalty-score">'+rows+'</div>'+lane+stage+(last?'<p class="fr71-kick-feedback">'+(last.scored?'⚽ هدف من '+safe(last.player):last.outcome==='save'?'🧤 تصدي '+safe(last.keeper):'❌ ركلة ضائعة من '+safe(last.player))+'</p>':'');
}
function fr71Count(events,type,side){return events.filter(e=>e.actorSide===side&&(e.type===type||(type==='yellow'&&e.type==='red'&&e.subtype==='second-yellow'))).length;}
function fr71Match(){
 const s=view.room,m=s.match,p=s.players,elapsed=Math.max(0,Date.now()+clockOffset-m.startedAt),done=s.stage==='done'||elapsed>=m.duration,regular=Math.min(FR71_REGULAR,elapsed),minute=Math.min(90,Math.round(regular/FR71_REGULAR*90)),live=scoreForTime(m,regular),penaltyActive=!!m.penalty&&regular>=FR71_REGULAR,visible=done?(m.penalty?.sequence?.length||0):Math.min(m.penalty?.sequence?.length||0,Math.max(0,Math.floor((elapsed-FR71_REGULAR-800)/FR71_KICK_MS)+1)),last=live.events[live.events.length-1];
 fr71ResultShown=done;
 return '<div class="fr70-experience fr71-experience" data-fr71-stage="'+(done?'done':penaltyActive?'penalties':'regular')+'"><section class="fr70-header"><div class="fr70-kicker">'+(done?'FULL TIME · MATCH REPORT':penaltyActive?'PENALTY SHOOTOUT · LIVE':'FR72 · LIVE 5 VS 5')+'</div><h1>'+(done?'صافرة النهاية':penaltyActive?'ضربات الترجيح':'محاكاة المباراة')+'</h1><p>'+safe(m.stadium)+' · '+(m.home===null?'ملعب محايد':'أفضلية الأرض')+' · نتيجة السيرفر الرسمية</p></section><section class="fr70-stadium"><div class="fr70-scoreboard"><div class="fr70-club">'+crest(p[0])+'<strong>'+safe(p[0].club.ar)+'</strong>'+fr130OwnerName(p[0])+'</div><div class="fr70-score-block"><div id="scoreboard" class="fr70-score" dir="ltr">'+(done?m.score:live.scores).join(' - ')+'</div><div id="match-clock" class="fr70-clock">'+(penaltyActive?'PEN':minute+'′')+'</div></div><div class="fr70-club">'+crest(p[1])+'<strong>'+safe(p[1].club.ar)+'</strong>'+fr130OwnerName(p[1])+'</div></div><div class="fr70-progress-outer"><div id="fr70-progress" class="fr70-progress" style="width:'+(regular/FR71_REGULAR*100)+'%"></div></div><div id="fr71-pitch-wrap" '+(penaltyActive?'hidden':'')+'>'+fr70Pitch(s,minute)+'</div><section id="fr71-shootout" class="fr71-shootout" '+(!penaltyActive?'hidden':'')+'><div class="fr71-penalty-heading"><span>⚽ تحدي الأعصاب</span><strong>ركلات الترجيح</strong></div><div id="fr71-penalty-body">'+(m.penalty?fr71Kicks(s,m,visible):'')+'</div></section><div class="fr70-action" id="fr71-action"><span class="fr70-action-icon" id="fr70-action-icon">'+(last?fr71Icon(last):'⚽')+'</span><div><span class="fr70-action-kicker">أحداث المباراة</span><strong id="fr70-action-label">'+(last?safe(fr71Label(last))+' · '+safe(last.player):'بداية المباراة')+'</strong><small id="fr70-action-sub">'+(last?safe(last.text)+' · '+Number(last.minute)+'′':'المباراة جارية…')+'</small></div></div><div class="fr70-event-strip" id="fr70-event-strip">'+fr71EventMarkers(live.events,minute)+'</div><div class="fr70-tactics"><span>'+safe(m.tactics?.[0]||'')+'</span><span>'+safe(m.tactics?.[1]||'')+'</span></div></section><section class="fr71-discipline panel"><span id="fr71-yellow">🟨 إنذارات: '+fr71Count(live.events,'yellow',0)+' - '+fr71Count(live.events,'yellow',1)+'</span><span id="fr71-red">🟥 طرد: '+fr71Count(live.events,'red',0)+' - '+fr71Count(live.events,'red',1)+'</span></section><details class="fr70-details fr70-log" '+(done?'':'')+'><summary>الأحداث الدقيقة والقرارات التحكيمية <span>عرض التفاصيل</span></summary><div id="match-events" class="fr71-events">'+fr71EventList(s,done?m.events:live.events)+'</div></details>'+(done?'<div class="fr71-final-penalty">'+(m.penalty?'<p>نتيجة الترجيح: '+m.penalty.score.join(' - ')+'</p>':'')+'</div>'+fr70AfterMatch(s):'<p class="fr70-sync-note">النتيجة والحالات التحكيمية محسوبة مرة واحدة على السيرفر ومتزامنة للطرفين.</p>')+'</div>';
}
function fr71Tick(){
 if(!view?.room?.match||!['FR71','FR72'].includes(view.room.match.engineVersion))return;
 const s=view.room,m=s.match,elapsed=Math.max(0,Date.now()+clockOffset-m.startedAt),done=s.stage==='done'||elapsed>=m.duration,regular=Math.min(FR71_REGULAR,elapsed),minute=Math.round(regular/FR71_REGULAR*90),shootout=!!m.penalty&&elapsed>=FR71_REGULAR;
 if(done&&!fr71ResultShown){fr71ResultShown=true;render();return;}
 const clock=document.getElementById('match-clock');if(!clock)return;
 clock.textContent=done?'FT':shootout?'PEN':minute+'′';
 const progress=document.getElementById('fr70-progress');if(progress)progress.style.width=(regular/FR71_REGULAR*100)+'%';
 const live=scoreForTime(m,regular),sb=document.getElementById('scoreboard');if(sb)sb.textContent=(done?m.score:live.scores).join(' - ');
 if(m.engineVersion==='FR72')fr72PitchStatus(s,live.events);
 const pitch=document.getElementById('fr71-pitch-wrap'),pen=document.getElementById('fr71-shootout');if(pitch)pitch.hidden=shootout;if(pen)pen.hidden=!shootout;
 if(shootout&&m.penalty){
  const n=done?m.penalty.sequence.length:Math.min(m.penalty.sequence.length,Math.max(0,Math.floor((elapsed-FR71_REGULAR-800)/FR71_KICK_MS)+1));
  const box=document.getElementById('fr71-penalty-body');
  if(box&&fr71LastKick!==n){box.innerHTML=fr71Kicks(s,m,n);fr71LastKick=n;}
 }
 if(fr71LastMinute!==minute){
  fr71LastMinute=minute;
  const yellow=document.getElementById('fr71-yellow'),red=document.getElementById('fr71-red');if(yellow)yellow.textContent='🟨 إنذارات: '+fr71Count(live.events,'yellow',0)+' - '+fr71Count(live.events,'yellow',1);if(red)red.textContent='🟥 طرد: '+fr71Count(live.events,'red',0)+' - '+fr71Count(live.events,'red',1);
  const last=live.events[live.events.length-1],icon=document.getElementById('fr70-action-icon'),title=document.getElementById('fr70-action-label'),subtitle=document.getElementById('fr70-action-sub'),strip=document.getElementById('fr70-event-strip'),ev=document.getElementById('match-events');
  if(icon)icon.textContent=last?fr71Icon(last):'⚽';
  if(title)title.textContent=last?fr71Label(last)+' · '+last.player:'انطلاق المباراة';
  if(subtitle)subtitle.textContent=last?last.text+' · '+last.minute+'′':'المباراة جارية…';
  if(strip)strip.innerHTML=fr71EventMarkers(live.events,minute);
  if(ev)ev.innerHTML=fr71EventList(s,done?m.events:live.events);
 }
 if(!shootout){
  const balls=document.getElementById('fr70-ball'),tick=Math.floor(elapsed/700),wave=tick*.48,last=live.events[live.events.length-1];
  if(balls){let x=50+Math.sin(wave)*26,y=50+Math.cos(wave*.8)*22;if(last?.type==='goal'){x=last.side===0?89:11;y=50;}else if(last?.type==='save'){x=last.side===0?84:16;y=50;}balls.style.left=x+'%';balls.style.top=y+'%';}
  for(const dot of document.querySelectorAll('.fr70-dot')){const side=Number(dot.dataset.fr70Side),slot=Number(dot.dataset.fr70Slot),base=fr70Dots[side][slot];if(!base)continue;dot.style.left=(base.x+Math.sin(wave+slot*.9)*2.8)+'%';dot.style.top=(base.y+Math.cos(wave+slot)*2.4)+'%';}
 }
}

function match(){if(view?.room?.match?.engineVersion==='FR73')return fr73Match();if(['FR71','FR72'].includes(view?.room?.match?.engineVersion))return fr71Match();
 const s=view.room,m=s.match,p=s.players,elapsed=Math.max(0,Date.now()+clockOffset-m.startedAt),done=s.stage==='done'||elapsed>=m.duration,live=scoreForTime(m,elapsed),scores=done?m.score:live.scores,minute=done?90:live.minute,last=live.events[live.events.length-1];
 return '<div class="fr70-experience" data-fr70-state="'+(done?'done':'live')+'"><section class="fr70-header"><div class="fr70-kicker">'+(done?'FULL TIME · MATCH RESULT':'LIVE SIMULATION · 5 VS 5')+'</div><h1>'+(done?'صافرة النهاية':'محاكاة المباراة')+'</h1><p>'+safe(m.stadium)+' · '+(m.home===null?'ملعب محايد':'أفضلية الأرض')+' · 25 ثانية للمحاكاة</p></section><section class="fr70-stadium"><div class="fr70-scoreboard"><div class="fr70-club">'+crest(p[0])+'<strong>'+safe(p[0].club.ar)+'</strong>'+fr130OwnerName(p[0])+'</div><div class="fr70-score-block"><div id="scoreboard" class="fr70-score" dir="ltr">'+scores.join(' - ')+'</div><div id="match-clock" class="fr70-clock">'+(done?'90:00':minute+"'")+'</div></div><div class="fr70-club">'+crest(p[1])+'<strong>'+safe(p[1].club.ar)+'</strong>'+fr130OwnerName(p[1])+'</div></div><div class="fr70-progress-outer"><div id="fr70-progress" class="fr70-progress" style="width:'+(minute/90*100)+'%"></div></div>'+fr70Pitch(s,minute)+'<div class="fr70-action"><span class="fr70-action-icon" id="fr70-action-icon">'+(last?(last.type==='goal'?'⚽':last.type==='save'?'🧤':last.type==='yellow'?'🟨':'⚡'):'⚽')+'</span><div><span class="fr70-action-kicker">'+(done?'آخر أحداث المباراة':'أحداث مباشرة')+'</span><strong id="fr70-action-label">'+(last?fr70EventName(last):'بداية المباراة')+'</strong><small id="fr70-action-sub">'+(last?'الدقيقة '+Number(last.minute)+"' · "+safe(p[last.side]?.club?.ar||''):'المباراة جارية…')+'</small></div></div><div class="fr70-event-strip" id="fr70-event-strip">'+fr70Markers(done?m.events:live.events,minute)+'</div><div class="fr70-tactics"><span>'+safe(m.tactics?.[0]||'')+'</span><span>'+safe(m.tactics?.[1]||'')+'</span></div></section><details class="fr70-details fr70-log"><summary>أحداث المباراة بالتفصيل <span>فتح القائمة</span></summary><div id="match-events" class="timeline">'+eventHtml(done?m.events:live.events)+'</div><div id="penalty-result">'+(done&&m.penalty?penaltiesHtml(m.penalty,p):'')+'</div></details>'+(done?fr70AfterMatch(s):'<p class="fr70-sync-note">الأحداث والنتيجة محسوبة على السيرفر ومتزامنة بين الطرفين.</p>')+'</div>';
}
function fr70Tick(){if(['FR71','FR72','FR73'].includes(view?.room?.match?.engineVersion))return;
 if(!view?.room?.match||!['match','done'].includes(view.room.stage))return;
 const s=view.room,m=s.match,elapsed=Math.min(m.duration,Math.max(0,Date.now()+clockOffset-m.startedAt)),done=s.stage==='done'||elapsed>=m.duration,live=scoreForTime(m,elapsed),minute=done?90:live.minute;
 const progress=document.getElementById('fr70-progress');if(!progress)return;
 progress.style.width=(Math.max(0,Math.min(100,minute/90*100)))+'%';
 const last=live.events[live.events.length-1],label=document.getElementById('fr70-action-label'),sub=document.getElementById('fr70-action-sub'),icon=document.getElementById('fr70-action-icon');
 if(label)label.textContent=last?(last.type==='goal'?'⚽ هدف':last.type==='save'?'🧤 تصدٍ':last.type==='yellow'?'🟨 بطاقة صفراء':'⚡ فرصة')+' · '+(last.player||''):'بداية المباراة';
 if(sub)sub.textContent=last?'الدقيقة '+last.minute+"' · "+(s.players[last.side]?.club?.ar||''):'المباراة جارية…';
 if(icon)icon.textContent=last?(last.type==='goal'?'⚽':last.type==='save'?'🧤':last.type==='yellow'?'🟨':'⚡'):'⚽';
 const strip=document.getElementById('fr70-event-strip');if(strip&&strip.dataset.minute!==String(minute)){strip.innerHTML=fr70Markers(done?m.events:live.events,minute);strip.dataset.minute=String(minute);}
 const bucket=Math.floor(elapsed/750);if(bucket===fr70LastTacticalFrame)return;fr70LastTacticalFrame=bucket;
 const phase=bucket*0.46,balls=document.getElementById('fr70-ball');if(!balls)return;
 const side=last?.side===1?1:0,offense=last?last.side:bucket%2,goal=last?.type==='goal',save=last?.type==='save';
 let x=50+Math.sin(phase)*18,y=50+Math.cos(phase*0.76)*24;
 if(last&&goal){x=offense===0?88:12;y=50+Math.sin(phase)*8;}else if(last&&save){x=offense===0?84:16;y=50+Math.sin(phase)*13;}else if(last){x=offense===0?62+Math.sin(phase)*17:38-Math.sin(phase)*17;}
 balls.style.left=Math.max(6,Math.min(94,x))+'%';balls.style.top=Math.max(10,Math.min(90,y))+'%';
 const dots=document.querySelectorAll('.fr70-dot');for(const dot of dots){const side=Number(dot.dataset.fr70Side),slot=Number(dot.dataset.fr70Slot),base=fr70Dots[side][slot],swing=Math.sin(phase+slot*0.94+side)*3.2,drift=Math.cos(phase*.72+slot*1.7)*3.7;dot.style.left=Math.max(5,Math.min(95,base.x+swing))+'%';dot.style.top=Math.max(9,Math.min(91,base.y+drift))+'%';}
}
setInterval(fr70Tick,650);
async function fr70DownloadCard(){
 if(!view?.room?.match)return;
 const {card,stats,mvp,team}=fr70RealCard(view.room),canvas=document.createElement('canvas');canvas.width=900;canvas.height=1350;
 const c=canvas.getContext('2d');if(!c){notify('تعذر تجهيز الصورة',true);return;}
 const g=c.createLinearGradient(0,0,900,1350);g.addColorStop(0,'#081529');g.addColorStop(.56,'#102947');g.addColorStop(1,'#020916');c.fillStyle=g;c.fillRect(0,0,900,1350);
 c.strokeStyle='#e8bb59';c.lineWidth=14;c.strokeRect(30,30,840,1290);c.strokeStyle='#b88a3888';c.lineWidth=2;c.strokeRect(44,44,812,1262);
 c.textAlign='center';c.fillStyle='#e9ca80';c.font='bold 38px sans-serif';c.fillText('FOOTBALL RIVALS',450,115);c.font='bold 29px sans-serif';c.fillText('🏆 MAN OF THE MATCH',450,165);
 if(card?.sprite){try{let p=card.sprite,img=new Image();img.decoding='async';img.src='/cloud-v5/'+String(p.file).split('/').map(encodeURIComponent).join('/');await img.decode();let cols=Number(p.cols)||5,rows=Number(p.rows)||6,sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;c.drawImage(img,(Number(p.col)||0)*sw,(Number(p.row)||0)*sh,sw,sh,185,195,530,740);}catch(e){c.fillStyle='#142d4b';c.fillRect(185,195,530,740);c.fillStyle='#f0d48c';c.font='bold 31px sans-serif';c.fillText('FOOTBALL RIVALS',450,560);}}
 else{c.fillStyle='#142d4b';c.fillRect(185,195,530,740);c.fillStyle='#f0d48c';c.font='bold 31px sans-serif';c.fillText('FOOTBALL RIVALS',450,560);}
 c.fillStyle='#fff';c.font='bold 45px sans-serif';c.fillText(String(card?.name||mvp.player?.name||'PLAYER').slice(0,28),450,1010);c.font='28px sans-serif';c.fillStyle='#c9dcee';c.fillText(String(team.club?.ar||''),450,1060);
 c.fillStyle='#f2d282';c.font='bold 50px sans-serif';c.fillText('RATING '+Number(stats.rating??mvp.rating??0).toFixed(1)+' / 10',450,1134);
 c.fillStyle='#eff5ff';c.font='27px sans-serif';c.fillText('GOALS '+(stats.goals||0)+'   ASSISTS '+(stats.assists||0)+'   SAVES '+(stats.saves||0),450,1195);
 c.fillStyle='#a5bed7';c.font='21px sans-serif';c.fillText('FR70 · OFFICIAL MATCH REPORT',450,1270);
 const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='FR70_MVP_'+String(card?.name||'star').replace(/[^a-z0-9_-]/gi,'_')+'.png';document.body.appendChild(a);a.click();a.remove();notify('تم تجهيز صورة رجل المباراة');
}
function eventHtml(a){return a.length?a.slice(-9).reverse().map(e=>`<div class="event ${safe(e.type)}"><time>${e.minute}'</time><div><strong>${e.type==='goal'?'⚽':e.type==='save'?'🧤':e.type==='yellow'?'🟨':'⚡'} ${safe(e.text)} · ${safe(e.player)}</strong><div class="hint">${e.assist?`صناعة: ${safe(e.assist)} · `:''}${e.side===0?'الفريق الأول':'الفريق الثاني'}</div></div></div>`).join(''):'<div class="hint">الفرق تستعد لبداية المباراة…</div>'}
function penaltiesHtml(p,players){return `<div class="panel gold-edge" style="margin-top:13px;text-align:center"><h2>⚽ ضربات الترجيح</h2><div class="split-2">${players.map((a,i)=>`<div><strong>${safe(a.club.ar)}</strong><div style="font-size:25px;color:#f1d190">${p.score[i]}</div><div>${p.kicks[i].map(hit=>hit?'🟢':'🔴').join(' ')}</div></div>`).join('')}</div></div>`}
function statRow(label,a,b){return `<div class="stats-grid"><div>${a}</div><div>${safe(label)}</div><div>${b}</div></div>`}
function resultBottom(s){const m=s.match,w=s.players[m.winner],winnerIsYou=m.winner===view.you;return `<div class="winner-banner">🏆 ${winnerIsYou?'مبروك! فزت بالمباراة':'الفائز: '+safe(w.name)}</div><div class="panel"><h2 class="section-title">إحصائيات المباراة</h2>${statRow('الاستحواذ',m.possession[0]+'%',m.possession[1]+'%')}${statRow('التسديدات',m.shots[0],m.shots[1])}${statRow('الفرص الخطيرة',m.chances[0],m.chances[1])}${statRow('التصديات',m.saves[0],m.saves[1])}<div class="summary-strip"><div>رجل المباراة<strong style="font-size:19px">${safe(m.mvp.player.name)}</strong></div><div>قوة فريقك<strong>${m.teamStrength[view.you]}</strong></div><div>المدرب<strong style="font-size:14px">${safe(s.players[view.you].coach.name)}</strong></div></div></div><div class="results-squads" style="margin-top:14px">${s.players.map(p=>`<section class="panel"><strong>${safe(p.name)} · ${safe(p.club.ar)}</strong><div class="squad-row">${p.squad.map(a=>`<div class="mini">${cardsprite(a.card)}<span>${a.position}</span></div>`).join('')}</div></section>`).join('')}</div><div class="row-buttons" style="justify-content:center;margin:22px 0">${btn('مباراة جديدة','new','gold btn-large')}${btn('العودة إلى المزاد','back-auction','ghost')}</div>`}

let fr68MatchKey='',fr68Seen=new Set(),fr68GoalQueue=[],fr68OverlayBusy=false;
function fr68CoachArt(c){
 const ids={base:0,advanced:1,elite:2,legend:3,legendary:3},n=ids[c.id]??0;
 const palettes=[['#2c91b5','#0e3764','#b5dbfc'],['#397abb','#142c62','#dceafa'],['#707f96','#17263f','#e0ccaa'],['#b28a3d','#372818','#f8d98e']];
 const p=palettes[n],initials=['RM','MA','CA','PG'][n];
 return '<svg role="img" aria-label="'+safe(c.name)+'" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fr68P'+n+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs><rect width="160" height="160" rx="19" fill="url(#fr68P'+n+')"/><circle cx="80" cy="52" r="44" fill="none" stroke="'+p[2]+'" stroke-opacity=".16"/><path d="M8 160Q18 107 49 110L66 98H94L112 110Q144 108 152 160Z" fill="'+(n===3?'#302c35':'#152b44')+'" stroke="'+p[2]+'" stroke-opacity=".45"/><path d="M64 100L80 131 97 100 89 93H72Z" fill="#f5eee7"/><path d="M77 117L81 142 85 117 82 109Z" fill="'+p[0]+'"/><ellipse cx="81" cy="69" rx="27" ry="34" fill="'+(n===1?'#dba77e':n===2?'#c79b7a':'#d1a482')+'"/><path d="'+(n===2?'M53 62Q47 27 76 26Q108 21 109 56L105 48Q87 43 77 45Q65 45 56 57Z':'M53 64Q48 29 76 29Q110 25 109 64L103 49Q81 48 74 42Q63 48 53 64Z')+'" fill="'+(n===2?'#d6d1c8':n===3?'#29231f':'#292525')+'"/><path d="M69 80Q81 '+(n===3?'95':'87')+' 94 80" fill="none" stroke="#714d3e" stroke-width="1.9" stroke-linecap="round"/><circle cx="71" cy="68" r="2" fill="#342a2a"/><circle cx="91" cy="68" r="2" fill="#342a2a"/><rect x="112" y="125" width="40" height="23" rx="6" fill="#061c35" stroke="'+p[2]+'" stroke-opacity=".5"/><text x="132" y="141" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="800" fill="'+p[2]+'">'+initials+'</text></svg>';
}
function fr68Results(s){
 const m=s.match;if(!m||!Array.isArray(m.playerRatings))return '';
 const best=m.mvp||{},side=Number(best.side||0),star=best.player||{},stats=(m.playerRatings[side]||[]).find(r=>String(r.playerId)===String(star.unique))||best.stats||{};
 let html='<section class="fr68-awards panel" aria-label="جوائز المباراة"><div class="fr68-section-kicker">MATCH AWARDS · PERFORMANCE REPORT</div><h2 class="section-title">نجم المباراة</h2><div class="fr68-motm"><div class="fr68-motm-card">'+cardsprite(star,'fr68-star-card')+'</div><div class="fr68-motm-info"><span class="fr68-trophy">🏆 MAN OF THE MATCH</span><h3>'+safe(star.name||'نجم المباراة')+'</h3><p>'+safe(s.players[side]?.club?.ar||'')+' · '+safe(s.players[side]?.name||'')+'</p><div class="fr68-rating-badge fr68-rating-big">'+safe(stats.rating??best.rating??'—')+'</div><div class="fr68-award-stats"><span>⚽ '+(stats.goals||0)+' أهداف</span><span>🎯 '+(stats.assists||0)+' أسيست</span><span>🧤 '+(stats.saves||0)+' تصديات</span></div></div></div></section>';
 html+='<section class="fr68-ratings panel"><div class="fr68-section-kicker">PLAYER RATINGS · 5 VS 5</div><h2 class="section-title">تقييمات اللاعبين</h2><p class="hint">التقييم من 10، محسوب من أحداث المباراة والأداء الفعلي داخل المحاكاة.</p><div class="fr68-rating-teams">';
 for(let team=0;team<2;team++){
  const p=s.players[team];html+='<div class="fr68-rating-team"><h3>'+safe(p.club.ar)+' <small>'+safe(p.name)+'</small></h3>';
  for(const r of m.playerRatings[team]||[]){
   const slot=p.squad.find(v=>String(v.card.unique)===String(r.playerId)),card=slot?.card;
   const isBest=team===side&&String(r.playerId)===String(star.unique);
   html+='<div class="fr68-player-rating '+(isBest?'fr68-best':'')+'"><div class="fr68-player-thumb">'+cardsprite(card,'fr68-rating-sprite')+'</div><div class="fr68-player-line"><strong>'+safe(r.name)+'</strong><span>'+safe(r.position)+' · '+(r.goals?'⚽ '+r.goals+'  ':'')+(r.assists?'🎯 '+r.assists+'  ':'')+(r.saves?'🧤 '+r.saves:'')+'</span></div><strong class="fr68-rating-badge '+(r.rating>=8.5?'fr68-excellent':r.rating<6?'fr68-low':'')+'">'+Number(r.rating).toFixed(1)+'</strong></div>';
  }html+='</div>';
 }return html+'</div></section>';
}
function fr68GoalShowNext(){
 if(fr68OverlayBusy||!fr68GoalQueue.length)return;
 const event=fr68GoalQueue.shift(),p=view?.room?.players?.[event.side];
 if(!p)return;
 const slot=p.squad.find(a=>String(a.card.unique)===String(event.playerId)||a.card.name===event.player),card=slot?.card||null;
 fr68OverlayBusy=true;document.getElementById('fr68-goal-overlay')?.remove();
 const el=document.createElement('div');el.id='fr68-goal-overlay';el.className='fr68-goal-overlay';el.setAttribute('role','status');el.setAttribute('aria-live','assertive');
 el.innerHTML='<div class="fr68-goal-inner"><div class="fr68-goal-kicker">FOOTBALL RIVALS · GOAL REVEAL</div><div class="fr68-goal-head">⚽ جوووول!</div><div class="fr68-goal-card">'+cardsprite(card,'fr68-score-card')+'</div><h2>'+safe(card?.name||event.player)+'</h2><p>'+safe(p.club.ar)+' · الدقيقة '+Number(event.minute)+"'"+'</p>'+(event.assist?'<div class="fr68-goal-assist">🎯 صناعة: '+safe(event.assist)+'</div>':'')+'<div class="fr68-goal-label">+'+'1 GOAL</div></div>';
 document.body.append(el);
 setTimeout(()=>{el.classList.add('leaving');setTimeout(()=>{el.remove();fr68OverlayBusy=false;fr68GoalShowNext()},230)},1830);
}
function fr68GoalPulse(){
 if(view?.room?.match?.engineVersion==='FR73')return;
 if(!view?.room?.match||view.room.stage!=='match'){if(view?.room?.stage!=='done'){fr68MatchKey='';fr68Seen.clear();fr68GoalQueue=[];}return;}
 const m=view.room.match,key=String(view.room.code||'')+':'+m.startedAt,elapsed=Math.max(0,Date.now()+clockOffset-m.startedAt),current=scoreForTime(m,elapsed);
 if(key!==fr68MatchKey){fr68MatchKey=key;fr68Seen.clear();fr68GoalQueue=[];if(elapsed>2300)for(const e of current.events.filter(a=>a.type==='goal'))fr68Seen.add(e.minute+'|'+e.side+'|'+(e.playerId||e.player));return;}
 for(const e of current.events){if(e.type!=='goal')continue;const k=e.minute+'|'+e.side+'|'+(e.playerId||e.player);if(!fr68Seen.has(k)){fr68Seen.add(k);fr68GoalQueue.push(e);}}
 fr68GoalShowNext();
}
setInterval(fr68GoalPulse,175);

/* FR72 preview + cinematic events; fallback to FR71 for older matches. */
const fr72Types=new Set(['var','yellow','red','injury','goal_disallowed','penalty_awarded']);
let fr72CineKey='',fr72CineSeen=new Set(),fr72CineQueue=[],fr72CineBusy=false;
function fr72Money(p){const auction=p.squad.reduce((sum,slot)=>sum+Number(slot.paid||0),0);return {auction,coach:Number(p.coach?.cost||0),total:auction+Number(p.coach?.cost||0)};}
function fr72TeamCard(s,p,i){
 const pre=s.preMatch?.teams?.[i]||{},money=fr72Money(p);
 const star=p.squad.reduce((a,v)=>!a||Number(v.card.ovr)>Number(a.card.ovr)?v:a,null);
 const c=p.coach||{};
 return '<article class="fr72-team"><div class="fr72-team-heading">'+crest(p)+'<div><small>'+(i===view.you?'فريقك':'فريق المنافس')+'</small><h2>'+safe(p.club.ar)+'</h2><p>'+safe(p.name)+'</p></div></div><div class="fr72-strength"><strong>'+Number(pre.teamStrength??0).toFixed(1)+'</strong><span>القوة الإجمالية<br>TEAM STRENGTH</span></div><div class="fr72-players">'+p.squad.map(slot=>'<div class="fr72-player">'+cardsprite(slot.card,'fr72-sprite')+'<span>'+safe(slot.position)+' · '+safe(slot.card.name)+'</span></div>').join('')+'</div><div class="fr72-coach"><img src="/assets/auction/coaches/'+encodeURIComponent(c.id||'roberto_martinez')+'.webp" alt="'+safe(c.name||'')+'" loading="eager"><div><small>المدرب · '+Number(c.cost||0)+'M</small><b>'+safe(c.name||'')+'</b><span>التأثير التكتيكي +'+Number(c.bonus||0)+'</span></div></div><div class="fr72-star">⭐ نجم الفريق: <b>'+safe(star?.card?.name||'')+'</b> · '+Number(star?.card?.ovr||0)+' OVR</div><div class="fr72-finance"><div><span>تكلفة اللاعبين بالمزاد</span><strong>'+money.auction+'M</strong></div><div><span>المدرب</span><strong>'+money.coach+'M</strong></div><div class="fr72-finance-total"><span>إجمالي المصروف</span><strong>'+money.total+'M</strong></div><div><span>المتبقي من 100M</span><strong>'+Number(p.balance)+'M</strong></div><div><span>مجموع تقييمات الكروت</span><strong>'+Number(pre.totalOvr||0)+' OVR</strong></div></div><div class="fr72-ready-status '+(s.preMatch?.ready?.[i]?'yes':'')+'">'+(s.preMatch?.ready?.[i]?'✓ جاهز للمباراة':'◌ لم يؤكد الجاهزية')+'</div></article>';
}
function fr72Showdown(){
 const s=view.room,pre=s.preMatch,me=s.players[view.you],ready=!!pre?.ready?.[view.you];
 if(!pre)return '<section class="panel"><h2>جارٍ تجهيز المباراة…</h2></section>';
 return '<section class="fr72-prematch"><div class="fr72-prematch-heading"><span>FR72 · PRE-MATCH SHOWDOWN</span><h1>قبل صافرة البداية</h1><p>التشكيلتان النهائيتان، المدربون، القوة والتكلفة الحقيقية لكل فريق</p><div class="fr72-stadium">🏟️ '+safe(pre.stadium)+' · '+(pre.home===null?'ملعب محايد':'أفضلية الأرض: '+safe(s.players[pre.home].club.ar))+'</div></div><div class="fr72-team-grid">'+s.players.map((p,i)=>fr72TeamCard(s,p,i)).join('')+'</div><div class="fr72-kickoff panel"><p>'+(ready?(pre.ready.every(Boolean)?'جاهز! تبدأ المباراة الآن.':'تم تأكيد جاهزيتك، في انتظار المنافس…'):'بعد مراجعة الفرق اضغط بدء المباراة. لن تبدأ مواجهة 1VS1 حتى يؤكد الطرفان الجاهزية.')+'</p>'+btn(ready?'✓ جاهز — انتظار المنافس':'⚽ أنا جاهز · ابدأ المباراة','kickoff','gold fr72-start',ready?'disabled':'')+'</div></section>';
}
function fr72EventIdentity(s,e){
 const side=e.actorSide===0||e.actorSide===1?e.actorSide:e.side;
 const c=s.players[side]?.squad?.find(x=>String(x.card?.unique)===String(e.actorId||e.playerId))?.card;
 return {side,card:c||null,club:s.players[side]?.club?.ar||'',player:c?.name||e.player||''};
}
function fr72CineShow(){
 if(fr72CineBusy||!fr72CineQueue.length||document.getElementById('fr68-goal-overlay'))return;
 const e=fr72CineQueue.shift(),s=view?.room;if(!s||!s.players)return;
 const info=fr72EventIdentity(s,e),map={
  var:['📺','VAR REVIEW','مراجعة تقنية الفيديو','var'],
  yellow:['🟨','YELLOW CARD','بطاقة صفراء','yellow'],
  red:['🟥','RED CARD','طرد من المباراة','red'],
  injury:['🩹','INJURY STOPPAGE','توقف لإصابة لاعب','injury'],
  goal_disallowed:['🚫','NO GOAL','الهدف ملغي','cancel'],
  penalty_awarded:['⚖️','PENALTY DECISION','ركلة جزاء','penalty']
 };
 const item=map[e.type]||map.var;
 const el=document.createElement('div');el.className='fr72-cine fr72-cine-'+item[3];el.id='fr72-cine';
 el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 el.innerHTML='<div class="fr72-cine-panel"><div class="fr72-cine-kicker">FOOTBALL RIVALS · OFFICIAL MATCH EVENT</div><div class="fr72-cine-icon">'+item[0]+'</div><div class="fr72-cine-english">'+item[1]+'</div><div class="fr72-cine-title">'+item[2]+'</div>'+(info.card?'<div class="fr72-cine-player">'+cardsprite(info.card,'fr72-cine-sprite')+'</div>':'')+'<strong class="fr72-cine-name">'+safe(info.player)+'</strong><p>'+safe(e.text||'')+'</p><div class="fr72-cine-footer">'+safe(info.club)+' · الدقيقة '+Number(e.minute)+'′</div></div>';
 fr72CineBusy=true;document.body.append(el);
 setTimeout(()=>{el.classList.add('leaving');setTimeout(()=>{el.remove();fr72CineBusy=false;fr72CineShow()},200)},1800);
}
function fr72CinePulse(){
 const s=view?.room,m=s?.match;if(!m||m.engineVersion!=='FR72'||s.stage!=='match'){if(!m||s?.stage==='done'){fr72CineQueue=[];fr72CineKey='';fr72CineSeen.clear()}return}
 const key=String(s.code)+'|'+String(m.startedAt),elapsed=Math.max(0,Date.now()+clockOffset-m.startedAt);
 const live=scoreForTime(m,Math.min(25000,elapsed));
 if(fr72CineKey!==key){
  fr72CineKey=key;fr72CineQueue=[];fr72CineSeen=new Set();
  if(elapsed>1800){for(let i=0;i<live.events.length;i++)fr72CineSeen.add(i);}
 }
 for(let i=0;i<live.events.length;i++){
  if(fr72CineSeen.has(i))continue;
  fr72CineSeen.add(i);const e=live.events[i];if(fr72Types.has(e.type))fr72CineQueue.push(e);
 }
 fr72CineShow();
}
function fr72PitchStatus(s,events){
 const sidelined=[new Set(),new Set()],hurt=[new Set(),new Set()];
 for(const e of events){
  if(e.type==='red')sidelined[e.actorSide]?.add(String(e.actorId));
  if(e.type==='injury'){
   hurt[e.actorSide]?.add(String(e.actorId));
   if(e.subtype==='out')sidelined[e.actorSide]?.add(String(e.actorId));
  }
 }
 for(const dot of document.querySelectorAll('.fr70-dot')){
  const side=Number(dot.dataset.fr70Side),slot=Number(dot.dataset.fr70Slot),id=String(s.players[side]?.squad?.[slot]?.card?.unique||'');
  dot.style.display=sidelined[side]?.has(id)?'none':'';
  dot.classList.toggle('fr72-hurt',!!hurt[side]?.has(id));
 }
}
setInterval(fr72CinePulse,220);
/* FR73 • cinematic match director, server-timed scenes & post-match highlights */
let fr73LastBucket=-1,fr73LastShown=-1,fr73LastPenalty=-1,fr73ReplayTimer=null,fr73ReplayActive=false,fr73ReplayKey='';
function fr73Regular(m){return Math.max(120000,Number(m?.regularDuration)||120000)}
function fr73Clock(m,elapsed){
 const regular=fr73Regular(m),t=Math.max(0,Math.min(regular,elapsed));
 if(t>=regular)return 90;
 let priorAt=0,priorMinute=0;
 for(const e of m.events||[]){
  const nextAt=Number(e.showAt)||0,nextMinute=Math.max(priorMinute,Math.min(90,Number(e.minute)||0));
  if(t<nextAt)return Math.max(0,Math.min(90,Math.floor(priorMinute+(nextMinute-priorMinute)*(t-priorAt)/Math.max(1,nextAt-priorAt))));
  priorAt=nextAt;priorMinute=nextMinute;
 }
 return Math.max(0,Math.min(90,Math.floor(priorMinute+(90-priorMinute)*(t-priorAt)/Math.max(1,regular-priorAt))));
}
function fr73State(m,elapsed){
 const regular=fr73Regular(m),t=Math.max(0,Math.min(regular,elapsed));
 const events=(m.events||[]).filter(e=>Number(e.showAt)<=t),scores=[0,0];
 for(const e of events)if(e.type==='goal'&&(e.side===0||e.side===1))scores[e.side]++;
 return {minute:fr73Clock(m,t),events,scores};
}
function fr73PenaltyVisible(m,elapsed){
 return (m.penalty?.sequence||[]).filter(k=>elapsed>=Number(k.resultAt||k.showAt)).length;
}
function fr73Highlights(s){
 const m=s.match||{},all=(m.events||[]).map((e,index)=>({e,index})).filter(v=>v.e.cinematic);
 if(!all.length)return '<p class="muted">لا توجد لحظات مسجلة لإعادة العرض.</p>';
 return '<section class="fr73-highlights panel" aria-label="إعادة اللحظات الحاسمة"><div class="fr73-highlight-heading"><div><small>MATCH REPLAY · HIGHLIGHTS</small><h2>🎞️ لحظات المباراة الحاسمة</h2><p>شاهد المشاهد مرة ثانية من غير تغيير النتيجة.</p></div>'+btn('▶ تشغيل ملخص المباراة','fr73-replay-all','gold')+'</div><div class="fr73-replay-grid">'+all.map(({e,index})=>'<button type="button" class="fr73-replay-item" data-action="fr73-replay" data-value="'+index+'"><span class="fr73-replay-minute">'+Number(e.minute)+'′</span><span class="fr73-replay-icon">'+fr71Icon(e)+'</span><span class="fr73-replay-copy"><b>'+safe(fr71Label(e))+'</b><small>'+safe(e.player)+' · '+safe(e.text||'')+'</small></span><span class="fr73-replay-play">▶</span></button>').join('')+'</div></section>';
}
function fr73Match(){
 const s=view.room,m=s.match,p=s.players,elapsed=fr74Elapsed(m),done=fr74Finished(m,elapsed);
 const regular=fr73Regular(m),time=Math.min(regular,elapsed),live=fr73State(m,time);
 const shoot=!!m.penalty&&elapsed>=regular,seenKicks=done?m.penalty?.sequence?.length||0:fr73PenaltyVisible(m,elapsed);
 const last=live.events[live.events.length-1],mins=live.minute;
 const completed=done?'done':shoot?'penalty':'live';
 return '<div class="fr70-experience fr71-experience fr73-experience fr122-five" data-fr73-state="'+completed+'"><section class="fr70-header fr73-top"><div class="fr70-kicker">MATCHDAY · FIVE-A-SIDE</div><h1>'+(done?'صافرة النهاية':shoot?'ضربات الترجيح':'المباراة السينمائية')+'</h1><p>'+safe(m.stadium)+' · عرض متزامن للأحداث الحقيقية من السيرفر</p><div class="fr73-time-note"><span>⏱️ المباراة '+Math.ceil(regular/1000)+' ثانية</span><span>'+(m.penalty?'⚽ الترجيح له وقت مستقل':'🎬 كل لقطة تأخذ وقتها')+'</span></div></section><section class="fr70-stadium fr73-stadium"><div class="fr70-scoreboard"><div class="fr70-club">'+crest(p[0])+'<strong>'+safe(p[0].club.ar)+'</strong>'+fr130OwnerName(p[0])+'</div><div class="fr70-score-block"><div id="scoreboard" class="fr70-score" dir="ltr">'+(done?m.score:live.scores).join(' - ')+'</div><div id="match-clock" class="fr70-clock">'+(shoot?'PEN':mins+'′')+'</div></div><div class="fr70-club">'+crest(p[1])+'<strong>'+safe(p[1].club.ar)+'</strong>'+fr130OwnerName(p[1])+'</div></div><div class="fr70-progress-outer"><div class="fr70-progress" id="fr70-progress" style="width:'+Math.min(100,time/regular*100).toFixed(1)+'%"></div></div><div class="fr73-director-bar"><span id="fr73-stage-label">'+(shoot?'ركلات الترجيح':done?'نهاية المباراة':'اللعب جاري')+'</span><span id="fr73-time-left">'+fr74RealRemaining(m,elapsed)+' ثانية متبقية</span></div><div id="fr73-pitch" '+(shoot?'hidden':'')+'>'+fr70Pitch(s,mins)+'</div><section id="fr73-penalties" class="fr71-shootout" '+(!shoot?'hidden':'')+'><div class="fr71-penalty-heading"><span>SHOOTOUT · SEQUENTIAL REPLAY</span><strong>⚽ ضربات الترجيح</strong></div><div id="fr73-penalties-body">'+(m.penalty?fr71Kicks(s,m,seenKicks):'')+'</div></section><div class="fr70-action"><span class="fr70-action-icon" id="fr70-action-icon">'+(last?fr71Icon(last):'⚽')+'</span><div><span class="fr70-action-kicker">المشهد الحالي</span><strong id="fr70-action-label">'+(last?safe(fr71Label(last))+' · '+safe(last.player):'اللاعبون يستعدون للمباراة')+'</strong><small id="fr70-action-sub">'+(last?safe(last.text)+' · الدقيقة '+Number(last.minute)+'′':'انطلاق المباراة')+'</small></div></div><div id="fr70-event-strip" class="fr70-event-strip">'+fr71EventMarkers(live.events,mins)+'</div><div class="fr70-tactics"><span>'+safe(m.tactics?.[0]||'')+'</span><span>'+safe(m.tactics?.[1]||'')+'</span></div></section><section class="fr71-discipline panel"><span id="fr71-yellow">🟨 الإنذارات: '+fr71Count(live.events,'yellow',0)+' - '+fr71Count(live.events,'yellow',1)+'</span><span id="fr71-red">🟥 الطرد: '+fr71Count(live.events,'red',0)+' - '+fr71Count(live.events,'red',1)+'</span></section><details class="fr70-details fr70-log"><summary>أحداث المباراة بالتفصيل <span>فتح التقرير</span></summary><div id="match-events" class="fr71-events">'+fr71EventList(s,done?m.events:live.events)+'</div></details>'+(done?'<div class="fr71-final-penalty">'+(m.penalty?'<p>نتيجة ضربات الترجيح: '+m.penalty.score.join(' - ')+'</p>':'')+'</div>'+fr70AfterMatch(s)+fr73Highlights(s):'<p class="fr70-sync-note">المخرج السينمائي يلتزم بتوقيت موحد على السيرفر، ويعرض كل حدث بدون تداخل.</p>')+'</div>';
}
function fr73UpdateMatch(){
 if(!view?.room?.match||view.room.match.engineVersion!=='FR73')return;
 const s=view.room,m=s.match,elapsed=fr74Elapsed(m),regular=fr73Regular(m);
 const done=fr74Finished(m,elapsed),root=document.querySelector('.fr73-experience');
 if(!root)return;
 if(done&&root.dataset.fr73State!=='done'){render();return;}
 const shoot=!!m.penalty&&elapsed>=regular,regularTime=Math.min(regular,elapsed),live=fr73State(m,regularTime);
 const minute=live.minute,clock=document.getElementById('match-clock');
 if(clock)clock.textContent=done?'FT':shoot?'PEN':minute+'′';
 const score=document.getElementById('scoreboard');if(score)score.textContent=(done?m.score:live.scores).join(' - ');
 const prog=document.getElementById('fr70-progress');if(prog)prog.style.width=(regularTime/regular*100).toFixed(1)+'%';
 const left=document.getElementById('fr73-time-left');if(left)left.textContent=done?'FULL TIME':fr74RealRemaining(m,elapsed)+' ثانية متبقية';
 const stage=document.getElementById('fr73-stage-label');if(stage)stage.textContent=done?'نهاية المباراة':shoot?'⚽ الترجيح — ضربة بضربة':'⚽ اللعب مستمر';
 const pitch=document.getElementById('fr73-pitch'),pen=document.getElementById('fr73-penalties');if(pitch)pitch.hidden=shoot;if(pen)pen.hidden=!shoot;
 if(shoot&&m.penalty){
  const count=done?m.penalty.sequence.length:fr73PenaltyVisible(m,elapsed);
  const container=document.getElementById('fr73-penalties-body');
  if(container&&fr73LastPenalty!==count){fr73LastPenalty=count;container.innerHTML=fr71Kicks(s,m,count);}
 }
 if(fr73LastShown!==live.events.length){
  fr73LastShown=live.events.length;
  const last=live.events[live.events.length-1];
  const icon=document.getElementById('fr70-action-icon'),label=document.getElementById('fr70-action-label'),sub=document.getElementById('fr70-action-sub');
  if(icon)icon.textContent=last?fr71Icon(last):'⚽';
  if(label)label.textContent=last?fr71Label(last)+' · '+last.player:'اللاعبون يستعدون للمباراة';
  if(sub)sub.textContent=last?last.text+' · الدقيقة '+last.minute+'′':'انطلاق المباراة';
  const strip=document.getElementById('fr70-event-strip');if(strip)strip.innerHTML=fr71EventMarkers(live.events,minute);
  const events=document.getElementById('match-events');if(events)events.innerHTML=fr71EventList(s,done?m.events:live.events);
  const yellow=document.getElementById('fr71-yellow'),red=document.getElementById('fr71-red');
  if(yellow)yellow.textContent='🟨 الإنذارات: '+fr71Count(live.events,'yellow',0)+' - '+fr71Count(live.events,'yellow',1);
  if(red)red.textContent='🟥 الطرد: '+fr71Count(live.events,'red',0)+' - '+fr71Count(live.events,'red',1);
  if(!shoot)fr72PitchStatus(s,live.events);
 }
 if(!shoot){
  const frame=Math.floor(elapsed/800);
  if(frame!==fr73LastBucket){fr73LastBucket=frame;const wave=frame*.41,ball=document.getElementById('fr70-ball'),last=live.events[live.events.length-1];
   if(ball){let x=50+Math.sin(wave)*25,y=50+Math.cos(wave*.83)*21;if(last?.type==='goal'){x=last.side===0?90:10;y=50;}else if(last?.type==='save'){x=last.side===0?84:16;y=48;}ball.style.left=x+'%';ball.style.top=y+'%';}
   for(const dot of document.querySelectorAll('#fr73-pitch .fr70-dot')){const side=Number(dot.dataset.fr70Side),slot=Number(dot.dataset.fr70Slot),base=fr70Dots[side][slot];if(!base)continue;dot.style.left=(base.x+Math.sin(wave+slot*.75)*2.8)+'%';dot.style.top=(base.y+Math.cos(wave+slot*.69)*2.5)+'%';}
  }
 }
}
function fr73EventIdentity(s,e){
 const side=e.actorSide===0||e.actorSide===1?e.actorSide:e.side;
 const card=s.players[side]?.squad?.find(x=>String(x.card?.unique)===String(e.actorId||e.playerId))?.card||null;
 return {side,card,name:card?.name||e.player||'',club:s.players[side]?.club?.ar||''};
}
function fr73CinematicMarkup(s,e,replay=false){
 const who=fr73EventIdentity(s,e),kind=e.type==='goal'?'goal':e.type==='var'?'var':e.type==='red'?'red':e.type==='yellow'?'yellow':e.type==='injury'?'injury':e.type==='goal_disallowed'?'cancel':e.type==='penalty_awarded'?'penalty':'save';
 const header=e.type==='goal'?'GOOOOAL!':e.type==='var'?'VAR REVIEW':e.type==='red'?'RED CARD':e.type==='yellow'?'YELLOW CARD':e.type==='injury'?'INJURY TIME':e.type==='goal_disallowed'?'NO GOAL':e.type==='penalty_awarded'?'PENALTY GIVEN':'SUPER SAVE';
 return '<div class="fr73-cinema-panel fr73-'+kind+'"><div class="fr73-cinema-kicker">FOOTBALL RIVALS · '+(replay?'MATCH REPLAY':'LIVE MATCH EVENT')+'</div><div class="fr73-cinema-symbol">'+fr71Icon(e)+'</div><div class="fr73-cinema-head">'+header+'</div><div class="fr73-cinema-subhead">'+safe(fr71Label(e))+'</div>'+(who.card?'<div class="fr73-cinema-art">'+cardsprite(who.card,'fr73-cinema-sprite')+'</div>':'')+'<strong class="fr73-cinema-name">'+safe(who.name)+'</strong><p>'+safe(e.text||'')+'</p><div class="fr73-cinema-meta">'+safe(who.club)+' · الدقيقة '+Number(e.minute)+'′</div><div class="fr73-cinema-progress"><i></i></div></div>';
}
function fr73RemoveCinema(){
 const el=document.getElementById('fr73-cinema');if(el)el.remove();
}
function fr73MountCinema(s,e,key,remaining,replay=false){
 const active=document.getElementById('fr73-cinema');
 if(active?.dataset.key===key)return;
 if(active)active.remove();
 const el=document.createElement('div');el.id='fr73-cinema';el.className='fr73-cinema';el.dataset.key=key;
 el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 el.innerHTML=fr73CinematicMarkup(s,e,replay);
 const duration=Math.max(600,Number(remaining)||Number(e.holdMs)||4400);
 el.style.setProperty('--fr73-cine-duration',duration+'ms');
 document.body.append(el);
}
function fr73CinematicPulse(){
 const s=view?.room,m=s?.match;
 if(!m||m.engineVersion!=='FR73'||s.stage!=='match'||fr74Finished(m,fr74Elapsed(m))){
  if(!fr73ReplayActive)fr73RemoveCinema();
  return;
 }
 if(fr73ReplayActive)return;
 const elapsed=fr74Elapsed(m);
 const index=(m.events||[]).findIndex(e=>fr74ShouldCinematic(e)&&elapsed>=e.showAt&&elapsed<e.endAt);
 if(index<0){fr73RemoveCinema();return;}
 const e=m.events[index],key=String(s.code)+'|'+String(m.startedAt)+'|'+index;
 fr73MountCinema(s,e,key,Math.max(200,(e.endAt-elapsed)/fr74Prefs.rate));
}
function fr73StopReplay(){fr74StopReplay();
 if(fr73ReplayTimer!==null){clearTimeout(fr73ReplayTimer);fr73ReplayTimer=null;}
 fr73ReplayActive=false;fr73ReplayKey='';fr73RemoveCinema();
}
function fr73Replay(indices){fr74Replay(indices);return;
 const s=view?.room,m=s?.match;if(!m||m.engineVersion!=='FR73'||!fr74Finished(m,fr74Elapsed(m)))return;
 fr73StopReplay();
 const key=String(s.code)+'|'+String(m.startedAt),entries=indices.filter(i=>Number.isInteger(i)&&m.events[i]?.cinematic);
 if(!entries.length)return;
 fr73ReplayActive=true;fr73ReplayKey=key;
 let cursor=0;
 const next=()=>{
  if(!fr73ReplayActive||fr73ReplayKey!==key||!view?.room?.match||view.room.match.startedAt!==m.startedAt){fr73StopReplay();return;}
  if(cursor>=entries.length){fr73StopReplay();return;}
  const index=entries[cursor++],e=m.events[index],hold=Math.max(3400,Math.min(6300,Number(e.holdMs)||5000));
  fr73MountCinema(s,e,'replay-'+key+'-'+index,hold,true);
  fr73ReplayTimer=setTimeout(next,hold+950);
 };
 next();
}
setInterval(fr73CinematicPulse,180);
/* FR74 — viewer-local playback controller. Never writes match result or room state. */
const FR74_PREF_KEY='fr:five:fr74:prefs:v1';
const FR74_RATES=[1,1.5,2,4],FR74_MODES=['full','highlights','off'];
function fr74ReadPrefs(){
 let j={};try{j=JSON.parse(localStorage.getItem(FR74_PREF_KEY)||'{}')||{}}catch(e){}
 return {rate:FR74_RATES.includes(Number(j.rate))?Number(j.rate):1,mode:FR74_MODES.includes(j.mode)?j.mode:'full'};
}
const fr74Prefs=fr74ReadPrefs();
let fr74Play=null,fr74LastStore=0,fr74Collapsed=false,fr74UiSignature='',fr74ReplayState=null;
function fr74SavePrefs(){try{localStorage.setItem(FR74_PREF_KEY,JSON.stringify(fr74Prefs))}catch(e){}}
function fr74MatchKey(m){
 const room=view?.room;return 'fr:five:fr74:progress:'+String(room?.code||'unknown')+':'+String(view?.you??0)+':'+String(m?.startedAt||0);
}
function fr74StateFor(m){
 const key=fr74MatchKey(m);if(fr74Play?.key===key)return fr74Play;
 const now=Date.now(),baseline=Math.max(0,Math.min(m.duration,now+clockOffset-m.startedAt));
 let pos=baseline,skipped=false;
 try{
  const saved=JSON.parse(sessionStorage.getItem(key)||'null');
  if(saved&&saved.key===key&&Number.isFinite(saved.pos)&&Number.isFinite(saved.at)&&Number.isFinite(saved.rate)&&saved.rate>0&&saved.at<=now+30000){
   pos=Math.max(0,Math.min(m.duration,saved.pos+Math.max(0,now-saved.at)*saved.rate));
   skipped=!!saved.skipped;
  }
 }catch(e){}
 fr74Play={key,pos,anchor:now,rate:fr74Prefs.rate,skipped};
 fr74LastStore=0;return fr74Play;
}
function fr74Elapsed(m){
 if(!m)return 0;
 const s=fr74StateFor(m);
 if(s.skipped||view?.room?.stage==='done')return m.duration;
 return Math.max(0,Math.min(m.duration,s.pos+(Date.now()-s.anchor)*s.rate));
}
function fr74Finished(m,elapsed){return !!m&&(view?.room?.stage==='done'||Number(elapsed)>=Number(m.duration)||!!fr74StateFor(m).skipped);}
function fr74RealRemaining(m,elapsed){return Math.ceil(Math.max(0,Number(m.duration)-elapsed)/(1000*fr74Prefs.rate));}
function fr74Remember(force=false){
 if(!fr74Play)return;
 const now=Date.now();if(!force&&now-fr74LastStore<1100)return;
 fr74LastStore=now;const m=view?.room?.match;
 const pos=m?fr74Elapsed(m):fr74Play.pos;
 try{sessionStorage.setItem(fr74Play.key,JSON.stringify({key:fr74Play.key,pos,at:now,rate:fr74Play.rate,skipped:fr74Play.skipped}))}catch(e){}
}
function fr74ShouldCinematic(e){
 if(!e||fr74Prefs.mode==='off')return false;
 if(fr74Prefs.mode==='full')return !!e.cinematic;
 return ['goal','var','red','goal_disallowed','penalty_awarded'].includes(e.type);
}
function fr74CinemaLabel(){return ({full:'كل الكروت',highlights:'اللحظات المهمة',off:'بدون كروت'})[fr74Prefs.mode]||'كل الكروت';}
function fr74SetRate(rate){
 const next=Number(rate);if(!FR74_RATES.includes(next))return false;
 const m=view?.room?.match;
 if(m?.engineVersion==='FR73'){
  const state=fr74StateFor(m);
  const current=fr74Elapsed(m);
  state.pos=current;state.anchor=Date.now();state.rate=next;
 }
 if(fr74ReplayState){const replay=fr74ReplayState;replay.base=fr74ReplayProgress();replay.anchor=Date.now();replay.rate=next;}
 fr74Prefs.rate=next;fr74SavePrefs();fr74Remember(true);
 fr73RemoveCinema();fr73LastBucket=-1;fr73LastPenalty=-1;
 fr74UiSignature='';fr74EnsureControls();
 if(m?.engineVersion==='FR73')fr73UpdateMatch();
 return true;
}
function fr74SetMode(mode){
 if(!FR74_MODES.includes(mode))return false;
 fr74Prefs.mode=mode;fr74SavePrefs();fr73RemoveCinema();fr74UiSignature='';fr74EnsureControls();return true;
}
function fr74Skip(){
 const m=view?.room?.match;if(!m||m.engineVersion!=='FR73'||fr74Finished(m,fr74Elapsed(m)))return false;
 const state=fr74StateFor(m);state.pos=m.duration;state.anchor=Date.now();state.skipped=true;
 fr74Remember(true);fr73RemoveCinema();fr74StopReplay();
 fr74UiSignature='';render();return true;
}
let fr122CancelArmed=false;
function fr74ControlsMarkup(done){
 const rateButtons=FR74_RATES.map(n=>'<button type="button" data-fr74="speed" data-value="'+n+'" aria-pressed="'+(fr74Prefs.rate===n)+'" class="'+(fr74Prefs.rate===n?'fr74-active':'')+'">'+n+'×</button>').join('');
 const modes=[['full','كل الكروت'],['highlights','المهمة فقط'],['off','إخفاء الكروت']];
 const modeButtons=modes.map(([id,label])=>'<button type="button" data-fr74="mode" data-value="'+id+'" aria-pressed="'+(fr74Prefs.mode===id)+'" class="'+(fr74Prefs.mode===id?'fr74-active':'')+'">'+label+'</button>').join('');
 return '<div class="fr74-controls-inner"><div class="fr74-controls-heading"><div><b>🎛️ التحكم في المباراة</b><small>'+(done?'تحكم في إعادة المشاهد':'اختر سرعة العرض وطريقة ظهور الكروت')+'</small></div><button type="button" data-fr74="collapse" aria-expanded="'+(!fr74Collapsed)+'" class="fr74-collapse">'+(fr74Collapsed?'⚙️ فتح':'− تصغير')+'</button></div>'+(fr74Collapsed?'':'<div class="fr74-controls-body"><div class="fr74-control-line"><span>السرعة</span><div class="fr74-toggle-row fr74-speed-row">'+rateButtons+'</div></div><div class="fr74-control-line"><span>المؤثرات</span><div class="fr74-toggle-row fr74-mode-row">'+modeButtons+'</div></div><div class="fr74-controls-actions">'+(done?'': '<button type="button" data-fr74="skip" class="fr74-skip">⏭ تخطي المحاكاة للنتيجة</button><button type="button" data-action="fr122-cancel" class="fr122-cancel">'+(fr122CancelArmed?'تأكيد إلغاء المباراة للطرفين':'إلغاء المباراة')+'</button>'+(fr122CancelArmed?'<button type="button" data-action="fr122-cancel-back" class="fr122-cancel-back">تراجع</button>':''))+(fr74ReplayState?'<button type="button" data-fr74="stop-replay" class="fr74-replay-stop">■ إيقاف الملخص</button>':'')+'</div></div>')+'</div>';
}
function fr74HandleClick(event){
 const el=event.target?.closest?.('button[data-fr74]');if(!el||el.disabled)return;
 const action=el.dataset.fr74,value=el.dataset.value;
 if(action==='speed')fr74SetRate(value);
 if(action==='mode')fr74SetMode(value);
 if(action==='skip')fr74Skip();
 if(action==='stop-replay')fr74StopReplay();
 if(action==='collapse'){fr74Collapsed=!fr74Collapsed;fr74UiSignature='';fr74EnsureControls();}
}
function fr74EnsureControls(){
 const m=view?.room?.match,eligible=m?.engineVersion==='FR73'&&['match','done'].includes(view.room.stage);
 let el=document.getElementById('fr74-controls');
 if(!eligible){if(el)el.remove();fr74UiSignature='';return;}
 const pitchEnd=document.getElementById('fr73-penalties');
 if(!pitchEnd||!pitchEnd.parentElement){if(el)el.remove();fr74UiSignature='';return;}
 if(!el){el=document.createElement('section');el.id='fr74-controls';el.className='fr74-five-inline';el.setAttribute('role','region');el.setAttribute('aria-label','التحكم في سرعة المحاكاة والمؤثرات');el.addEventListener('click',fr74HandleClick);fr74UiSignature='';}
 if(el.parentElement!==pitchEnd.parentElement||pitchEnd.nextElementSibling!==el)pitchEnd.insertAdjacentElement('afterend',el);
 const done=fr74Finished(m,fr74Elapsed(m)),sig=[fr74Prefs.rate,fr74Prefs.mode,done,fr74Collapsed,!!fr74ReplayState].join(':');
 if(fr74UiSignature!==sig){el.innerHTML=fr74ControlsMarkup(done);fr74UiSignature=sig;}
 document.documentElement.style.setProperty('--fr74-speed',String(fr74Prefs.rate));
 fr74Remember();
}
function fr74ReplayProgress(){
 const p=fr74ReplayState;return p?Math.min(p.total,p.base+Math.max(0,Date.now()-p.anchor)*p.rate):0;
}
function fr74StopReplay(){
 const p=fr74ReplayState;if(p?.timer!==null&&p?.timer!==undefined)clearInterval(p.timer);
 fr74ReplayState=null;fr73ReplayActive=false;fr73ReplayKey='';fr73RemoveCinema();
 fr74UiSignature='';fr74EnsureControls();
}
function fr74ReplayTick(){
 const p=fr74ReplayState,s=view?.room,m=s?.match;
 if(!p||!m||m.engineVersion!=='FR73'||p.key!==String(s.code)+'|'+String(m.startedAt)){fr74StopReplay();return;}
 const pos=fr74ReplayProgress();if(pos>=p.total){fr74StopReplay();return;}
 let cumulative=0;
 for(let i=0;i<p.entries.length;i++){
  const item=p.entries[i],length=item.hold+item.gap;
  if(pos<cumulative+length){
   const part=pos-cumulative,e=m.events[item.index];
   if(part<item.hold){
    const key='fr74-replay-'+p.key+'-'+item.index+'-'+String(p.rate);
    fr73MountCinema(s,e,key,Math.max(200,(item.hold-part)/p.rate),true);
   }else fr73RemoveCinema();
   return;
  }
  cumulative+=length;
 }
 fr74StopReplay();
}
function fr74Replay(indices){
 const s=view?.room,m=s?.match;if(!m||m.engineVersion!=='FR73'||!fr74Finished(m,fr74Elapsed(m)))return;
 fr74StopReplay();
 const available=indices.filter(i=>Number.isInteger(i)&&m.events?.[i]?.cinematic);
 if(!available.length){notify('لا توجد لحظات سينمائية للعرض');return;}
 const entries=available.map(i=>({index:i,hold:Math.max(3400,Math.min(6300,Number(m.events[i].holdMs)||5000)),gap:950}));
 const key=String(s.code)+'|'+String(m.startedAt);
 fr74ReplayState={key,entries,total:entries.reduce((a,e)=>a+e.hold+e.gap,0),base:0,anchor:Date.now(),rate:fr74Prefs.rate,timer:null};
 fr73ReplayActive=true;fr73ReplayKey=key;
 fr74ReplayState.timer=setInterval(fr74ReplayTick,110);fr74ReplayTick();
 fr74UiSignature='';fr74EnsureControls();
}

function fr122CancelledScreen(){
 const by=view?.room?.cancelled?.by,players=view?.room?.players||[];
 const title=by===view?.you?'ألغيت المباراة':safe(players[by]?.name||'المنافس')+' ألغى المباراة';
 return '<section class="panel stack fr122-cancelled"><span class="eyebrow">MATCH CANCELLED</span><h1 class="h1">'+title+'</h1><p>انتهت المباراة للطرفين ولم تُسجل نتيجة.</p><div class="row-buttons">'+btn('ابدأ من جديد','new','gold')+btn('العودة إلى المزاد','back-auction','ghost')+'</div></section>';
}
function render(){let html;if(!view)html=screen==='entry'?entry():configure();else {switch(view.room.stage){case 'lobby':html=room();break;case 'auction':html=auction();break;case 'round-recap':html=recap();break;case 'coaches':html=coach();break;case 'showdown':html=fr72Showdown();break;case 'match':case 'done':html=match();break;case 'cancelled':html=fr122CancelledScreen();break;default:html='<div class="error">حالة اللعبة غير متاحة</div>'}}app.innerHTML=html;fr74EnsureControls();document.title=(view?'مزاد الخماسي · '+(view.room.stage==='auction'?'الجولة '+(view.room.round+1):'FOOTBALL RIVALS'):'مزاد الخماسي')+' | FOOTBALL RIVALS';refreshClock()}
async function post(op,extra={}){const req={op,...(session||{}),...extra};const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req),cache:'no-store'});let data=await r.json().catch(()=>({ok:false,error:'INVALID_RESPONSE'}));if(!r.ok||!data.ok)throw Error(data.error||`HTTP ${r.status}`);return data}
function accept(d){if(!d?.room)return;if(view?.room?.code===d.room.code&&Number.isFinite(d.room.version)&&d.room.version<rev)return;clockOffset=d.now-Date.now();if(d.token&&d.room.code){session={code:d.room.code,token:d.token};try{localStorage.setItem('fr:five:token:fr66:'+session.code,session.token)}catch(e){}history.replaceState(null,'',`/auction/five/?room=${encodeURIComponent(session.code)}`)}view=d;if(d.room.stage==='cancelled'){fr122CancelArmed=false;fr73StopReplay();}fr93FiveMaybeSync();if(rev!==d.room.version){rev=d.room.version;seenEvents=-1;render()}}
async function doPost(op,extra){if(actionBusy)return;actionBusy=true;try{let d=await post(op,extra);accept(d);return d}catch(e){notify(errorMsg(e.message),true);return null}finally{actionBusy=false}}
function errorMsg(e){return ({FR75_UNKNOWN_THEME:'نوع المزاد غير صالح',FR75_THEME_UNAVAILABLE:'عدد الكروت في هذا النمط غير كافٍ',INVALID_BID:'المبلغ غير صالح أو أكبر من الرصيد',NOT_ENOUGH_FOR_COACH:'لا يوجد رصيد كافٍ لشراء المدرب',MATCH_PREVIEW_REQUIRED:'شاشة المباراة غير جاهزة بعد',NOT_YOUR_TURN:'المزايدة ليست دورك الآن',TURN_EXPIRED:'انتهى المؤقت، تم تحديث الجولة',ROOM_NOT_FOUND:'الغرفة غير موجودة أو انتهت صلاحيتها',ROOM_FULL:'الغرفة مكتملة',ROOM_NOT_JOINABLE:'الغرفة بدأت أو لم تعد تقبل لاعبين',WAITING_FOR_READY:'يجب أن يكون الطرفان جاهزين',PERSISTENT_STORAGE_UNAVAILABLE:'خدمة الغرف غير متاحة حاليًا',INVALID_PLAYER_SESSION:'انتهت جلسة اللاعب، ادخل من رابط جديد',COACH_ALREADY_PICKED:'تم تثبيت مدربك بالفعل',MATCH_NOT_ACTIVE:'المباراة انتهت بالفعل ولا يمكن إلغاؤها'})[e]||e||'حدث خطأ غير متوقع'}
async function begin(){const nameInput=document.getElementById('name');if(nameInput)userName=nameInput.value.trim().slice(0,22)||'بيبو';try{localStorage.setItem('fr:pentagon:name',userName)}catch(e){}if(screen==='join'){const codeInput=document.getElementById('join-code');joiningCode=(codeInput?.value||joiningCode).trim().toUpperCase();const d=await doPost('join',{code:joiningCode,name:userName,club:clubId});if(d)await doPost('ready',{ready:true});return}
const d=await doPost('create',{kind:mode,difficulty,name:userName,club:clubId,theme:fr75Choice});if(!d)return;await doPost('ready',{ready:true});if(mode==='ai')await doPost('start')}
function clearSession(){fr73StopReplay();if(session?.code){try{localStorage.removeItem('fr:five:token:fr66:'+session.code)}catch(e){}}fr122CancelArmed=false;session=null;view=null;rev=-1;seenEvents=-1;screen='entry';history.replaceState(null,'','/auction/five/');render()}
function inputBid(){return document.getElementById('bid-input')}
function stepBid(step){const i=inputBid();if(!i||!view)return;const s=view.room,max=s.players[view.you].balance,min=s.amount+1;i.value=String(Math.max(min,Math.min(max,(Number(i.value)||min)+step)))}
async function clickAction(e){const target=e.target.closest('[data-action]');if(!target||target.disabled)return;const act=target.dataset.action,v=target.dataset.value;
switch(act){case 'select':screen='configure';render();break;case 'rules':{const detail=app.querySelector('.help');if(detail){detail.open=true;detail.scrollIntoView({behavior:'smooth',block:'start'})}break;}case 'choose-ai':mode='ai';screen='configure';render();break;case 'choose-pvp':mode='pvp';screen='configure';render();break;case 'club':{const n=document.getElementById('name');if(n)userName=n.value;clubId=v;try{localStorage.setItem('fr:club:preferred:v1',v)}catch(e){}render();break;}case 'difficulty':difficulty=v;try{localStorage.setItem('fr:ai:difficulty:v1',v)}catch(e){}render();break;case 'fr75-choice':if(FR75_MODES.some(t=>t[0]===v)){fr75Choice=v;render()}break;case 'create':case 'join':await begin();break;case 'ready':await doPost('ready',{ready:true});break;case 'unready':await doPost('ready',{ready:false});break;case 'start':await doPost('start');break;case 'bid':{const i=inputBid();if(!i)return;await doPost('bid',{amount:Number(i.value)});break}case 'pass':await doPost('pass');break;case 'plus':stepBid(1);break;case 'minus':stepBid(-1);break;case 'plus5':stepBid(5);break;case 'plus10':stepBid(10);break;case 'coach':{const candidate=(view?.coaches||[]).find(c=>c.id===v),funds=Number(view?.room?.players?.[view.you]?.balance||0);if(!candidate||Number(candidate.cost)>funds){notify('رصيدك '+funds+'M — سعر المدرب '+Number(candidate?.cost||0)+'M، اختيار غير مسموح',true);break;}await doPost('coach',{coach:v});break;}case 'kickoff':await doPost('kickoff');break;case 'share':{const url=`${location.origin}/auction/five/?room=${encodeURIComponent(session.code)}`;try{await navigator.clipboard.writeText(url);notify('تم نسخ رابط الدعوة')}catch(e){prompt('انسخ رابط الغرفة:',url)}break}case 'copy-code':try{await navigator.clipboard.writeText(session.code);notify('تم نسخ كود الغرفة')}catch(e){prompt('كود الغرفة:',session.code)}break;case 'fr73-replay':{const i=Number(v);if(Number.isInteger(i))fr73Replay([i]);break;}case 'fr73-replay-all':{const events=view?.room?.match?.events||[];fr73Replay(events.map((e,i)=>e.cinematic?i:-1).filter(i=>i>=0));break;}case 'fr70-download':await fr70DownloadCard();break;case 'fr122-cancel':if(view?.room?.stage!=='match')break;if(fr122CancelArmed){fr122CancelArmed=false;await doPost('cancel');fr74UiSignature='';fr74EnsureControls()}else{fr122CancelArmed=true;fr74UiSignature='';fr74EnsureControls()}break;case 'fr122-cancel-back':fr122CancelArmed=false;fr74UiSignature='';fr74EnsureControls();break;case 'new':clearSession();break;case 'back-auction':clearSession();location.href='/auction/';break;}}
function refreshClock(){if(view?.room?.match?.engineVersion==='FR73'&&['match','done'].includes(view.room.stage))return fr73UpdateMatch();if(['FR71','FR72'].includes(view?.room?.match?.engineVersion)&&['match','done'].includes(view.room.stage))return fr71Tick();if(!view)return;const s=view.room,now=Date.now()+clockOffset;if(s.stage==='auction'){const n=document.getElementById('timer');if(n){const secs=Math.max(0,Math.ceil((s.deadline-now)/1000));n.textContent=String(secs).padStart(2,'0');n.classList.toggle('warn',secs<=5)}}if(s.stage==='match'||s.stage==='done'){const m=s.match;if(!m)return;let elapsed=Math.max(0,Math.min(m.duration,now-m.startedAt)),atEnd=s.stage==='done'||elapsed>=m.duration,live=scoreForTime(m,elapsed);const c=document.getElementById('match-clock'),sb=document.getElementById('scoreboard'),ev=document.getElementById('match-events'),pn=document.getElementById('penalty-result');if(c)c.textContent=atEnd?'90:00':elapsed>(m.penalty?20000:25000)?'ضربات الترجيح':`${live.minute}'`;if(sb)sb.textContent=(atEnd?m.score:live.scores).join(' - ');if(ev&&seenEvents!==live.events.length){ev.innerHTML=eventHtml(atEnd?m.events:live.events);seenEvents=live.events.length}if(pn&&m.penalty&&elapsed>=20000){pn.innerHTML=penaltiesHtml(m.penalty,s.players)} }}
async function poll(){if(!session||pollBusy||actionBusy)return;const current={...session};pollBusy=true;try{const d=await post('state');if(session?.code===current.code&&session?.token===current.token)accept(d)}catch(e){if(session?.code===current.code&&session?.token===current.token&&(e.message==='ROOM_NOT_FOUND'||e.message==='INVALID_PLAYER_SESSION')){notify(errorMsg(e.message),true);clearSession()}}finally{pollBusy=false}}
function init(){app.addEventListener('click',e=>{clickAction(e).catch(err=>notify(errorMsg(err.message),true))});const query=new URLSearchParams(location.search),code=(query.get('room')||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(code){joiningCode=code;let saved='';try{saved=localStorage.getItem('fr:five:token:fr66:'+code)||''}catch(e){}if(saved){session={code,token:saved};screen='configure';render();poll().then(()=>{if(!view){session=null;screen='join';mode='pvp';render()}})}else{mode='pvp';screen='join';render()}}else render();interval=setInterval(poll,1000);setInterval(refreshClock,150)}

/* FR93: five-a-side room archives once the server-authored simulation concludes */
let fr93FiveKey='',fr93FiveAttempt=0,fr93FiveDone=false;
function fr93FiveMaybeSync(){
 try{
  const r=view?.room,m=r?.match;if(!r||!m||!session?.code||!session?.token)return;
  const finished=r.stage==='done'||(Number.isFinite(m.duration)&&Date.now()+clockOffset>=m.startedAt+m.duration);
  if(!finished)return;
  const key=r.code+':'+String(m.startedAt||0)+':'+String(view?.you);
  if(fr93FiveKey!==key){fr93FiveKey=key;fr93FiveDone=false;fr93FiveAttempt=0}
  if(fr93FiveDone||Date.now()-fr93FiveAttempt<12000)return;
  fr93FiveAttempt=Date.now();
  fetch('/api/fr93-results',{method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'commit',kind:'five',code:session.code,token:session.token})})
   .then(x=>x.json()).then(j=>{if(j.ok)fr93FiveDone=true}).catch(()=>{});
 }catch(e){}
}

init();})();
;document.addEventListener('input',function(e){if(e.target&&e.target.id==='name'){try{const n=e.target.value.trim().slice(0,28);if(n)localStorage.setItem('fr:pentagon:name',n)}catch(_){}}});
