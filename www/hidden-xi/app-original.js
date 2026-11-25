/* FOOTBALL RIVALS — HIDDEN XI / The Fifth Game v1.0 */
(()=>{'use strict';
const $=s=>document.querySelector(s), stage=$('#stage');
const SLOTS=['GK','RB','CB','CB','LB','CDM','CM','CAM','RW','LW','ST'];
const STORE='fr_hidden_xi_v1',names=['لاعب 1','لاعب 2'];
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[ch]));
const num=x=>Number(x||0);
let auth=null,g=null,busy=false,clockDelta=0,renderKey='',lastStage='',online=true,sound=true,loading=false,toastTimer=null;
try{auth=JSON.parse(localStorage.getItem(STORE)||'null')}catch{}
const params=new URLSearchParams(location.search),invite=params.get('room');
if(invite&&/^[A-HJ-NP-Z2-9]{7}$/i.test(invite))$('#roomCode').value=invite.toUpperCase();
function save(){auth?localStorage.setItem(STORE,JSON.stringify(auth)):localStorage.removeItem(STORE)}
function soundFx(kind){
 if(!sound)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  soundFx.ctx=soundFx.ctx||new C();const c=soundFx.ctx;if(c.state==='suspended')c.resume().catch(()=>{});
  const notes=kind==='reveal'?[392,523,784]:kind==='victory'?[523,659,784,1046]:kind==='select'?[440,550]:[330];
  notes.forEach((f,i)=>{const o=c.createOscillator(),a=c.createGain(),t=c.currentTime+i*.085;
   o.type=kind==='victory'?'triangle':'sine';o.frequency.setValueAtTime(f,t);a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(.075,t+.01);a.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(a);a.connect(c.destination);o.start(t);o.stop(t+.19)});
 }catch{}
}
function toast(s,bad=false){
 const el=$('#toast');el.textContent=s;el.classList.toggle('error',bad);el.classList.remove('hidden');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),3700);
}
function connection(ok){
 online=ok;$('#connection').classList.toggle('offline',!ok);$('#connectionText').textContent=ok?'متصل مباشر':'محاولة اتصال';
}
async function api(op,extra={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
 try{
 const resp=await fetch('/api/hidden-xi',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
  body:JSON.stringify({op,id:auth?.id,token:auth?.token,...extra,...(['create','join'].includes(op)?{club:window.FR125Choice?.club||'real',theme:window.FR125Choice?.theme||'general'}:{})}),signal:controller.signal});
 const data=await resp.json().catch(()=>({ok:false,error:'الرد من السيرفر غير مفهوم'}));
 if(!resp.ok||!data.ok)throw Object.assign(new Error(data.error||'خطأ في الاتصال'),{code:data.code||'API_ERROR'});
 connection(true);return data;
 }finally{clearTimeout(timeout)}
}
function visibility(){
 const ok=!!auth;
 $('#auth').classList.toggle('hidden',ok);$('#game').classList.toggle('hidden',!ok);const entry=$('#fr125-root');if(entry)entry.hidden=ok;
}
function accept(d){
 if(!d||!d.ok)return;
 if(d.stage==='cancelled'){window.FR104_HIDDEN?.dispose();auth=null;g=null;save();visibility();window.dispatchEvent(new CustomEvent('fr46:room-cancelled',{detail:d}));return;}
 const previous=g?.stage,oldRev=g?.revision;
 clockDelta=num(d.serverAt)-Date.now();g=d;document.body.dataset.fr124Side=String(d.side);
 visibility();profile();renderSquads();
 if(previous!==d.stage&&previous){
  if(d.stage==='reveal')soundFx('reveal');else if(d.stage==='finished')soundFx('victory');
 }
 const key=d.stage+'|'+d.revision+'|'+(d.stage==='match'?'live':(d.match?.events?.length||0));
 if(key!==renderKey){renderKey=key;render();}else if(d.stage==='match')updateMatch();
 tickClock();
}
function profile(){
 names[0]=g.players?.[0]?.name||'PLAYER 1';names[1]=g.players?.[1]?.name||'PLAYER 2';
 for(let side=0;side<2;side++){const box=$('#fr125-crest'+side),club=g.players?.[side]?.club;if(box){box.textContent=String(side+1);const crest=Number(club?.crest)||0;if(club?.id==='alahly'||crest>0){const img=document.createElement('img');img.src=club?.id==='alahly'?'/assets/clubs/al-ahly.png':'https://crests.football-data.org/'+crest+'.png';img.alt=club.ar||'شعار النادي';box.textContent='';box.append(img)}}}
 const label=$('#fr125-theme-label');if(label)label.textContent=({general:'الوضع العام',england:'الدوري الإنجليزي',spain:'الدوري الإسباني',clasico:'الكلاسيكو',legends:'الأساطير',special:'SPECIAL'})[g.theme]||'الوضع العام';
 $('#gameCode').textContent=g.mode==='ai'?'VS AI · '+({easy:'سهل',medium:'متوسط',pro:'احترافي'}[g.difficulty]||'متوسط'):g.id;
 $('#copyBtn').style.display=g.mode==='ai'?'none':'';
 $('#playerOne').textContent=names[0];$('#playerTwo').textContent=names[1];
 $('#countOne').textContent=(g.players?.[0]?.roster?.length||0)+' / 11 كارت';
 $('#countTwo').textContent=(g.players?.[1]?.roster?.length||0)+' / 11 كارت';
 $('#roundLabel').textContent=String(Math.min(11,g.round+1)).padStart(2,'0')+' / 11';
 $('#roundBar').style.width=Math.min(100,g.round/11*100)+'%';
 $('#stageLabel').textContent={lobby:'WAITING ROOM',choose:'YOUR DECISION',reveal:'CARD REVEAL',tactics:'VIRUS PHASE',match:'LIVE MATCH',finished:'FULL TIME'}[g.stage]||'HIDDEN XI';
}
function art(c,mystery=false){
 if(mystery||!c)return '<div class="card-art mystery"><div class="mystery-content"><b>?</b><small>HIDDEN XI</small></div></div>';
 const s=c.sprite;
 if(s&&/^[a-z0-9_./-]+\.webp$/i.test(s.file)&&s.cols>=1&&s.rows>=1){
  const x=s.cols===1?50:100*s.col/Math.max(1,s.cols-1),y=s.rows===1?50:100*s.row/Math.max(1,s.rows-1);
  return '<div class="card-art '+(s.cols===1&&s.rows===1?'fr-complete-card':'')+'" title="'+esc(c.name)+' · '+num(c.ovr)+'">'+
   '<div class="card-sprite" style="background-image:url(/cloud-v5/'+esc(s.file)+');background-size:'+(s.cols===1&&s.rows===1?'contain':(s.cols*100)+'% '+(s.rows*100)+'%')+';background-repeat:no-repeat;background-position:'+x+'% '+y+'%"></div></div>';
 }
 return '<div class="card-art"><div class="card-fallback">⚽</div></div>';
}
function renderSquads(){
 for(let side=0;side<2;side++){
  const p=g.players?.[side]||{roster:[]};$('#lineup'+side).textContent=p.name||'بانتظار المنافس';
  const avg=p.roster.length?Math.round(p.roster.reduce((sum,c)=>sum+num(c.ovr),0)/p.roster.length):'—';
  $('#power'+side).textContent='AVG '+avg;
  $('#roster'+side).innerHTML=SLOTS.map((slot,i)=>{
   const c=p.roster[i];
   return '<div class="mini-slot '+(c?'filled':'')+'" title="'+(c?esc(c.name):esc(slot))+'">'+
     '<span class="position">'+esc(slot)+'</span>'+(c?'<span class="hx2-pitch-art">'+art(c)+'</span><b class="ovr">'+num(c.ovr)+'</b><span class="name">'+esc(c.name)+'</span>':
     '<span class="empty-number">'+String(i+1).padStart(2,'0')+'</span>')+'</div>';
  }).join('');
 }
}
function lobby(){
 return '<div class="waiting-room"><div class="stage-kicker">PRIVATE 1V1 MATCH</div><div class="wait-emoji">🎭</div>'+
  '<h2 class="stage-title">الغرفة جاهزة... في انتظار المنافس!</h2>'+
  '<p class="stage-desc">ابعث كود الغرفة أو رابط الدعوة لصاحبك. أول جولة هتبدأ تلقائيًا لما يدخل.</p>'+
  '<div class="waiting-code" dir="ltr">'+esc(g.id)+'</div><br>'+
  '<button class="btn btn-gold" data-copy>🔗 نسخ رابط الدعوة</button>'+
  '<p class="picking-note">11 جولة · 11 لاعب لكل فريق · كل جهاز له اختياراته</p></div>';
}
function choose(){
 const p=g.pick;if(!p)return '<div class="loading-screen">جاري تجهيز كروت الجولة...</div>';
 const mine=p.chooser===g.side,active=g.stage==='choose';
 const player=names[p.chooser];
 return '<div class="stage-kicker">ROUND '+(g.round+1)+' / 11 · '+esc(p.slot)+'</div>'+
  '<h2 class="stage-title">'+(mine?'دورك تختار يا '+esc(names[g.side])+'!':'الدور عند '+esc(player))+'</h2>'+
  '<p class="stage-desc">'+(mine?'يا تختار الكارت الواضح، يا تخاطر وتاخد الكارت الخفي. الكارت التاني هيروح لصاحبك!':'استنى اختيار صاحبك. الكارت اللي مش هيختاره هيبقى من نصيبك!')+'</p>'+
  '<div class="pick-grid">'+
  '<button class="choice-btn visible" data-choice="visible" '+(mine?'':'disabled')+'>'+
  '<span class="item-head">⭐ اللاعب الظاهر</span>'+art(p.visible)+
  '<span class="item-bottom">'+esc(p.visible.name)+' · '+num(p.visible.ovr)+' OVR</span>'+
  '<span class="select-chip">'+(mine?'اختار اللاعب':'واضح للجميع')+'</span></button>'+
  '<button class="choice-btn secret" data-choice="hidden" '+(mine?'':'disabled')+'>'+
  '<span class="item-head">🎭 اللاعب الخفي</span>'+art(null,true)+
  '<span class="item-bottom">ممكن أسطورة... وممكن مفاجأة!</span>'+
  '<span class="select-chip">'+(mine?'خاطر واختر المجهول':'سرّي بالكامل')+'</span></button></div>'+
  '<div class="turn-banner">'+(mine?'⚡ القرار في إيدك':'⏳ المنافس بيختار الآن')+' · <strong>المركز: '+esc(p.slot)+'</strong></div>';
}
function reveal(){
 const p=g.pick,first=p.chooser,second=1-first;
 const chosen=p.choice==='hidden'?p.secret:p.visible;
 const leftover=p.choice==='hidden'?p.visible:p.secret;
 return '<div class="reveal-stage">'+
 '<div class="stage-kicker">THE REVEAL · ROUND '+(g.round+1)+'</div>'+
 '<h2 class="stage-title">🎉 لحظة كشف الكارت الخفي!</h2>'+
 '<p class="stage-desc">'+esc(names[first])+' اختار '+(p.choice==='hidden'?'المجهول 🎭':'المضمون ⭐')+'، والكارت الآخر راح لمنافسه.</p>'+
 '<div class="reveal-grid">'+
 '<div class="reveal-slot"><span class="reveal-label">اختيار صاحب الدور</span>'+art(chosen)+
 '<span class="player-tag">'+esc(names[first])+'</span><strong>'+esc(chosen.name)+' · '+num(chosen.ovr)+'</strong></div>'+
 '<div class="reveal-slot"><span class="reveal-label">الكارت المتبقي</span>'+art(leftover)+
 '<span class="player-tag">'+esc(names[second])+'</span><strong>'+esc(leftover.name)+' · '+num(leftover.ovr)+'</strong></div>'+
 '</div><div class="reveal-footer">✨ الجولة التالية تبدأ تلقائيًا · <span class="countdown" id="revealCountdown">5</span> ثواني</div></div>';
}
function options(owner){
 return '<option value="none">— بدون استخدام —</option>'+SLOTS.map((slot,i)=>
 '<option value="'+i+'">'+(i+1)+' · '+esc(slot)+' · '+esc(owner.roster?.[i]?.name||'لاعب')+'</option>').join('');
}
function tactics(){
 const self=g.players[g.side],opp=g.players[1-g.side],ownReady=!!self.ready;
 if(ownReady)return '<div class="waiting-room"><div class="stage-kicker">VIRUS LOCKED IN</div><div class="wait-emoji">🛡️</div>'+
 '<h2 class="stage-title">اختياراتك اتحفظت في السر!</h2><p class="stage-desc">مستني اختيار المنافس. بعدها هيتكشف أثر الفيروس والمضاد، وتبدأ المباراة النهائية تلقائيًا.</p>'+
 '<div class="waiting-code">'+(g.players.every(p=>p.ready)?'2 / 2':'1 / 2')+'</div></div>';
 return '<div class="stage-kicker">FINAL PHASE · VIRUS & ANTIVIRUS</div>'+
 '<h2 class="stage-title">🦠 لحظة الحسم قبل المباراة!</h2>'+
 '<p class="stage-desc">مرة واحدة تقدر تسرق لاعب في نفس المركز، ومرة واحدة تحمي لاعبك. اختيارك سري حتى صاحبك يثبت اختياره.</p>'+
 '<div class="tactics-grid">'+
 '<div class="tactic-panel"><div class="tactic-icon">🦠</div><h3>الفيروس — سرقة لاعب</h3>'+
 '<p>اختار لاعبًا من فريق <b>'+esc(opp.name)+'</b> عايز تبدّله بلاعبك في نفس المركز. لو المنافس حمى المركز، العملية تفشل.</p>'+
 '<select id="attackSlot" aria-label="المركز المستهدف بالفيروس">'+options(opp)+'</select></div>'+
 '<div class="tactic-panel"><div class="tactic-icon">🛡️</div><h3>مضاد الفيروس — حماية لاعب</h3>'+
 '<p>اختار واحدًا من لاعبيك تحميه. لو المنافس استهدف المركز ده، الكارت يفضل عندك.</p>'+
 '<select id="shieldSlot" aria-label="المركز المحمي بمضاد الفيروس">'+options(self)+'</select></div></div>'+
 '<div class="section-kicker" style="margin-top:19px">YOUR MATCH PLAN</div><div class="tactic-choices">'+
 '<label><input type="radio" name="style" value="attack">⚔️ هجومي</label>'+
 '<label><input type="radio" name="style" value="balanced" checked>⚖️ متوازن</label>'+
 '<label><input type="radio" name="style" value="defend">🛡️ دفاعي</label></div>'+
 '<div class="tactic-action"><button class="btn btn-gold" data-commit>🔒 تثبيت الفيروس والمضاد والخطة</button></div>';
}
function virusLog(){
 if(!g.virusReport?.length)return '<div class="virus-report"><div>🤝 محدش استخدم الفيروس. التشكيلتان كما هما!</div></div>';
 return '<div class="virus-report">'+g.virusReport.map(a=>
 '<div>'+(a.blocked?'🛡️ '+esc(names[1-a.attacker])+' صدّ فيروس '+esc(names[a.attacker])+' في '+esc(SLOTS[a.slot])+'!':
 a.mirror?'🦠 المنافسان استهدفا نفس المركز '+esc(SLOTS[a.slot]):
 '🦠 '+esc(names[a.attacker])+' خطف '+esc(a.from||'لاعب')+' مقابل '+esc(a.to||'لاعب')+' ('+esc(SLOTS[a.slot])+')')+'</div>').join('')+'</div>';
}
function match(){if(g.fr104Report?.events&&window.FR104_HIDDEN?.matchMarkup)return window.FR104_HIDDEN.matchMarkup(g,virusLog());
 const m=g.match||{score:[0,0],minute:0,events:[]};
 return '<div class="stage-kicker">LIVE MATCHDAY · HIDDEN XI</div>'+
 '<h2 class="stage-title">🏟️ الآن... مواجهة التشكيلتين!</h2>'+virusLog()+
 '<div class="match-clock"><span id="matchMinute">'+num(m.minute)+"'"+'</span></div>'+
 '<div class="match-score"><b id="score0">'+num(m.score[0])+'</b><span class="colon">:</span><b id="score1">'+num(m.score[1])+'</b></div>'+
 '<div class="match-track"><span id="matchBar" style="width:'+num(m.minute)/90*100+'%"></span></div>'+
 '<p class="stage-desc">النتيجة بتظهر هدف بهدف. مفيش كشف لنتيجة المباراة قبل الدقيقة 90.</p>'+
 '<div class="match-events" id="matchEvents">'+eventsHtml(m.events)+'</div>';
}
function eventsHtml(events){
 if(!events?.length)return '<div class="match-event">⏳ الفريقان بيبدأوا المباراة... تابع الهجمات لحظة بلحظة!</div>';
 return [...events].reverse().slice(0,12).map(e=>'<div class="match-event '+(e.kind==='goal'?'goal':'')+'"><span class="min">'+e.minute+"'</span><span>"+
 (e.kind==='goal'?'⚽ جوووول! '+esc(e.player)+' يسجل لصالح '+esc(names[e.side]):
 '🔥 فرصة خطيرة لـ '+esc(names[e.side]))+'</span></div>').join('');
}
function updateMatch(){if(window.FR104_HIDDEN?.update(g,stage))return;
 if(!g?.match||!$('#matchMinute'))return;
 $('#matchMinute').textContent=num(g.match.minute)+"'";
 $('#score0').textContent=num(g.match.score?.[0]);$('#score1').textContent=num(g.match.score?.[1]);
 $('#matchBar').style.width=Math.min(100,num(g.match.minute)/90*100)+'%';
 if($('#matchEvents'))$('#matchEvents').innerHTML=eventsHtml(g.match.events);
}
function finished(){if(g.fr104Report?.events&&window.FR104_HIDDEN?.finishedMarkup)return window.FR104_HIDDEN.finishedMarkup(g,virusLog());
 const m=g.match,s=m?.score||[0,0],winner=s[0]===s[1]?'تعادل مثير!':names[s[0]>s[1]?0:1]+' بطل المباراة!';
 return '<div class="stage-kicker">FULL TIME · THE FINAL RESULT</div>'+
 '<div class="finish-trophy">🏆</div><h2 class="winner">'+esc(winner)+'</h2>'+
 '<div class="match-score"><b>'+num(s[0])+'</b><span class="colon">:</span><b>'+num(s[1])+'</b></div>'+
 '<p class="stage-desc">انتهت 90 دقيقة! تقييم قوة الفريق: '+esc(names[0])+' '+(m.strength?.[0]||0)+' — '+esc(names[1])+' '+(m.strength?.[1]||0)+'</p>'+
 virusLog()+'<div class="match-events">'+eventsHtml(m.events)+'</div>'+
 '<div class="finish-actions"><button class="btn btn-gold" data-restart>🏟️ مواجهة جديدة</button></div>';
}
function render(){
 if(!g)return;
 stage.innerHTML= g.stage==='lobby'?lobby():g.stage==='choose'?choose():g.stage==='reveal'?reveal():g.stage==='tactics'?tactics():g.stage==='match'?match():g.stage==='finished'?finished():'<div class="loading-screen">جارِ تجهيز الجولة...</div>';
 window.FR104_HIDDEN?.afterRender(g,stage);
}
function tickClock(){
 if(!g)return;
 const current=Date.now()+clockDelta;let deadline=0;
 if(g.stage==='choose')deadline=g.pick?.deadline||0;
 if(g.stage==='reveal')deadline=g.pick?.revealUntil||0;
 if(g.stage==='tactics')deadline=g.tacticsUntil||0;
 if(g.stage==='match')deadline=(g.match?.started||0)+(g.match?.duration||0);
 $('#timer').textContent=deadline?Math.max(0,Math.ceil((deadline-current)/1000))+'s':'--';
 if($('#revealCountdown'))$('#revealCountdown').textContent=Math.max(0,Math.ceil((deadline-current)/1000));
 if(g.stage==='match'){
  const min=Math.max(0,Math.min(90,Math.floor((current-g.match.started)/g.match.duration*90)));
  if($('#matchMinute'))$('#matchMinute').textContent=min+"'";
  if($('#matchBar'))$('#matchBar').style.width=min/90*100+'%';
 }
}
async function action(op,args={},btn){
 if(busy)return;busy=true;if(btn)btn.disabled=true;
 try{const d=await api(op,args);if(op==='choose'||op==='tactics')soundFx('select');accept(d)}
 catch(e){toast(e.message||'تعذر الاتصال بالسيرفر',true)}
 finally{busy=false;if(btn?.isConnected)btn.disabled=false}
}
async function create(){
 const name=$('#hostName').value.trim();if(name.length<2)return toast('اكتب اسمك الأول',true);
 if(busy)return;busy=true;$('#createBtn').disabled=true;
 try{const d=await api('create',{name});auth={id:d.id,token:d.token};save();accept(d);toast('الغرفة اتعملت! ابعت الدعوة لصاحبك')}
 catch(e){toast(e.message||'فشل إنشاء الغرفة',true)}
 finally{busy=false;$('#createBtn').disabled=false}
}
async function fr94CreateAI(){
 const name=$('#hostName').value.trim(),difficulty=document.querySelector('input[name="fr94-ai-level"]:checked')?.value||'medium';
 if(name.length<2)return toast('اكتب اسمك الأول',true);
 if(busy)return;busy=true;const btn=$('#fr94AiBtn');btn.disabled=true;
 try{const d=await api('create',{name,mode:'ai',difficulty});auth={id:d.id,token:d.token};save();accept(d);toast('🤖 بدأ التحدي ضد الذكاء الاصطناعي')}
 catch(e){toast(e.message||'تعذر إنشاء تحدي الذكاء الاصطناعي',true)}
 finally{busy=false;btn.disabled=false}
}

async function join(){
 const name=$('#guestName').value.trim(),id=$('#roomCode').value.trim().toUpperCase();
 if(name.length<2||id.length!==7)return toast('اكتب اسمك وكود الغرفة المكوّن من 7 حروف',true);
 if(busy)return;busy=true;$('#joinBtn').disabled=true;
 try{const d=await api('join',{name,id});auth={id:d.id,token:d.token};save();accept(d);toast('دخلت المواجهة! يلا نبدأ')}
 catch(e){toast(e.message||'تعذر الدخول',true)}
 finally{busy=false;$('#joinBtn').disabled=false}
}
function restart(){window.FR104_HIDDEN?.dispose();auth=null;g=null;renderKey='';save();visibility();window.scrollTo({top:0,behavior:'smooth'});toast('تقدر تبدأ تحدي جديد دلوقتي')}
async function copyLink(){
 if(!g)return;const link=location.origin+'/hidden-xi/?room='+g.id;
 try{await navigator.clipboard.writeText(link);toast('✅ رابط الدعوة اتنسخ!')}
 catch{toast('رابط الغرفة: '+link)}
}
async function poll(){
 if(loading||!auth)return;loading=true;
 try{const d=await api('state');accept(d)}
 catch(e){
  connection(false);
  if(e.code==='ROOM_NOT_FOUND'||e.code==='BAD_AUTH'){restart();toast('الغرفة انتهت أو لم تعد موجودة',true)}
 }
 finally{loading=false}
}
$('#createBtn').addEventListener('click',create);
$('#fr94AiBtn').addEventListener('click',fr94CreateAI);
$('#joinBtn').addEventListener('click',join);
$('#copyBtn').addEventListener('click',copyLink);
$('#leaveBtn').addEventListener('click',()=>window.FR46RoomExit?.ask());
stage.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-copy'))return copyLink();
 if(b.hasAttribute('data-restart'))return restart();
 if(b.hasAttribute('data-choice'))return action('choose',{choice:b.dataset.choice},b);
 if(b.hasAttribute('data-commit')){
  const attack=$('#attackSlot')?.value||'none',shield=$('#shieldSlot')?.value||'none';
  const style=document.querySelector('input[name="style"]:checked')?.value||'balanced';
  return action('tactics',{attack,shield,style},b)
 }
});
$('#rulesBtn').addEventListener('click',()=>$('#rulesModal').classList.remove('hidden'));
$('#closeRules').addEventListener('click',()=>$('#rulesModal').classList.add('hidden'));
$('#understood').addEventListener('click',()=>$('#rulesModal').classList.add('hidden'));
$('#rulesModal').addEventListener('click',e=>{if(e.target.id==='rulesModal')$('#rulesModal').classList.add('hidden')});
$('#soundBtn').addEventListener('click',e=>{sound=!sound;e.currentTarget.textContent=sound?'♫':'♪';toast(sound?'🔊 الصوت شغال':'🔇 الصوت اتقفل')});
$('#roomCode').addEventListener('input',e=>{e.target.value=e.target.value.replace(/[^A-Za-z0-9]/g,'').toUpperCase()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&auth)poll()});
window.FR125_CLIENT_READY=true;visibility();if(auth)poll();
setInterval(()=>{if(!document.hidden&&auth)poll()},1200);
setInterval(tickClock,250);
})();

;(()=>{const st=document.createElement('style');st.textContent='#stage .choice-btn .card-art.fr-complete-card,#stage .reveal-slot .card-art.fr-complete-card{aspect-ratio:2/3!important;background:transparent!important;border:0!important;border-radius:0!important}#stage .card-art.fr-complete-card .card-sprite{background-position:center!important;background-size:contain!important}';document.head.append(st)})();
