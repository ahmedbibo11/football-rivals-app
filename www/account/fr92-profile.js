(()=>{'use strict';
const ROOT=document.getElementById('root'),PAGE_IDS=['identity','career','matches','rivals','trophies','settings'],LABELS=['هويتي','مسيرتي','مبارياتي','منافسيني','إنجازاتي','إعداداتي'],ICONS=['👤','📈','⚔️','🤝','🏆','⚙️'];
const CLUBS=[
['alahly','الأهلي المصري','مصر','/assets/clubs/al-ahly.png','#9e2434'],
['zamalek','الزمالك','مصر','https://upload.wikimedia.org/wikipedia/en/1/1e/ZamalekSC.png','#f4f4f4'],
['realmadrid','ريال مدريد','إسبانيا','https://crests.football-data.org/86.png','#d9bc73'],
['barcelona','برشلونة','إسبانيا','https://crests.football-data.org/81.png','#803259'],
['liverpool','ليفربول','إنجلترا','https://crests.football-data.org/64.png','#c52339'],
['mancity','مانشستر سيتي','إنجلترا','https://crests.football-data.org/65.png','#6ab5e5'],
['manutd','مانشستر يونايتد','إنجلترا','https://crests.football-data.org/66.png','#d42432'],
['arsenal','أرسنال','إنجلترا','https://crests.football-data.org/57.png','#c52435'],
['chelsea','تشيلسي','إنجلترا','https://crests.football-data.org/61.png','#234eb2'],
['bayern','بايرن ميونخ','ألمانيا','https://crests.football-data.org/5.png','#c52b42'],
['dortmund','بوروسيا دورتموند','ألمانيا','https://crests.football-data.org/4.png','#f4d400'],
['psg','باريس سان جيرمان','فرنسا','https://crests.football-data.org/524.png','#2a4c8b'],
['atletico','أتلتيكو مدريد','إسبانيا','https://crests.football-data.org/78.png','#b42f44'],
['juventus','يوفنتوس','إيطاليا','https://crests.football-data.org/109.png','#ffffff'],
['inter','إنتر ميلان','إيطاليا','https://crests.football-data.org/108.png','#4c84b1'],
['milan','ميلان','إيطاليا','https://crests.football-data.org/98.png','#ce2c31'],
['napoli','نابولي','إيطاليا','https://crests.football-data.org/113.png','#3d9ad4'],
['hilal','الهلال','السعودية','','#2b5c9d'],
['nassr','النصر','السعودية','','#d6b94c'],
['ajax','أياكس','هولندا','https://crests.football-data.org/678.png','#bd2d41']
];
const st={user:null,tab:new URLSearchParams(location.search).get('tab')||'identity',mode:'all',matchMode:'all',game:'all',history:null,historyError:'',friends:null,challenges:null,leagues:null,search:[],rival:null,standings:null,clubs:null,selectedClub:null,loading:{},authMode:'login',lock:false,toastTimer:0,historyFetched:false,friendFetched:false,leaguesFetched:false,challengeFetched:false};
if(!PAGE_IDS.includes(st.tab))st.tab='identity';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number.isFinite(Number(x))?Number(x):0;
const stat=(v,k)=>'<div class="stat"><strong>'+esc(v)+'</strong><small>'+esc(k)+'</small></div>';
const fmt=(v)=>new Intl.NumberFormat('en-US').format(v);
const plural=(v)=>Number.isFinite(v)?String(v):'—';
function toast(msg,bad){if(ROOT.hidden)return;let x=document.getElementById('fr92-toast');if(!x){x=document.createElement('div');x.id='fr92-toast';x.className='toast';document.body.appendChild(x)}x.textContent=msg;x.className='toast'+(bad?' bad':'');clearTimeout(st.toastTimer);st.toastTimer=setTimeout(()=>x.classList.add('hidden'),4000)}
async function call(endpoint,op,body={}){const c=new AbortController(),timer=setTimeout(()=>c.abort(),14000);try{const r=await fetch('/api/'+endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,...body}),cache:'no-store',signal:c.signal});const j=await r.json().catch(()=>({ok:false,error:'تعذر قراءة الخادم'}));if(!r.ok||!j.ok)throw new Error(j.error||'تعذر إتمام الطلب');return j}finally{clearTimeout(timer)}}
const account=(op,data)=>call('rivals-account',op,data),social=(op,data)=>call('rivals-social',op,data);
function clubByUser(u){return CLUBS.find(c=>c[0]===u?.clubId)||CLUBS.find(c=>c[1]===u?.favoriteTeam)||null}
function crest(u,cls=''){const c=clubByUser(u);const url=(u?.clubLogoUrl&&u?.avatarMode==='club'?u.clubLogoUrl:'')||c?.[3]||'';return '<div class="club-crest '+cls+'" title="'+esc(c?.[1]||u?.favoriteTeam||'')+'">'+(url?'<img src="'+esc(url)+'" alt="'+esc(c?.[1]||'شعار النادي')+'" loading="lazy">':'<span>⚽</span>')+'</div>'}
function avatar(u,cls=''){const src=u?.avatarUrl&&u?.avatarMode==='photo'?u.avatarUrl:null;return '<div class="avatar '+cls+'">'+(src?'<img alt="صورة اللاعب" src="'+esc(src)+'" loading="lazy">':esc(u?.avatar||'👤'))+'</div>'}
const meId=()=>String(st.user?.id||'');
function fr138GameName(value){const name=String(value||'غير محدد'),map={'HIDDEN XI':'اللاعب الخفي','YA DOBAK':'يا دوبك','ULTIMATE XI':'مزاد التشكيلة الكاملة'};return map[name.toUpperCase()]||name}
function normRecord(x){const players=Array.isArray(x.players)?x.players:[],mine=players.findIndex(p=>String(p?.id)===meId()),mineIndex=mine<0?0:mine,other=players[1-mineIndex]||{};
let mode=x.mode||x.kind||x.type||'';
if(/ai|bot|computer/i.test(mode)||/ai|ذكاء/i.test(String(other?.id||'')+' '+String(other?.name||'')))mode='ai';
else if(/solo|individual|single|فردي/i.test(mode))mode='solo';
else mode=players.length===2?'pvp':'solo';
let win=x.winner===-1?'draw':x.winner===mineIndex?'win':x.winner==null?'unknown':'loss';
const originalScore=Array.isArray(x.score)?x.score:[x.score||'—','—'];const score=mineIndex===1?[originalScore[1],originalScore[0]]:originalScore;
return {id:String(x.id||''),mode,game:fr138GameName(x.game||x.gameId),at:x.date||x.createdAt||null,score,other,win,points:Number.isFinite(Number(x.points))?Number(x.points):null,raw:x};
}
function records(){return (st.history||[]).map(normRecord)}
function filtered(mode=st.mode,game=st.game){return records().filter(m=>(mode==='all'||m.mode===mode)&&(game==='all'||m.game===game))}
function tally(items){const done=items.filter(x=>x.win!=='unknown'),w=done.filter(x=>x.win==='win').length,l=done.filter(x=>x.win==='loss').length,d=done.filter(x=>x.win==='draw').length;return {count:done.length,w,l,d,pct:done.length?Math.round(w/done.length*100):null}}
function uniqueGames(){return [...new Set(records().map(x=>x.game))].sort()}
function dateText(s){if(!s)return 'تاريخ غير محدد';const d=new Date(s);return Number.isFinite(d.getTime())?d.toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}):'تاريخ غير محدد'}
function winLabel(s){return s==='win'?'فوز':s==='loss'?'خسارة':s==='draw'?'تعادل':'غير محسوم'}
function tabHead(en,title,sub,icon){return '<div class="page-head"><div><div class="eyebrow">'+en+'</div><h1>'+title+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</div><span>'+icon+'</span></div>'}
function section(title,extra=''){return '<div class="section-title"><h2>'+title+'</h2><span>'+extra+'</span></div>'}
function empty(title,sub=''){return '<div class="empty"><strong>'+esc(title)+'</strong>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div>'}
function matchRow(m){const kind=m.win==='win'?'good':m.win==='loss'?'bad':'gold';const x=m.score||[];const value=m.mode==='solo'?(m.points===null?'—':fmt(m.points)+' نقطة'):esc(String(x[0]??'—'))+' - '+esc(String(x[1]??'—'));return '<button class="result" style="width:100%;color:inherit;text-align:right" data-match="'+esc(m.id)+'"><span class="club-crest sm">'+(m.mode==='ai'?'🤖':m.mode==='solo'?'⭐':'⚔️')+'</span><span class="body"><strong>'+esc(m.game)+'</strong><small>'+(m.mode==='pvp'?'ضد '+esc(m.other.name||'لاعب'):m.mode==='ai'?'ضد AI':'جولة فردية')+' · '+esc(dateText(m.at))+'</small></span><span class="end"><span class="badge '+kind+'">'+winLabel(m.win)+'</span><span class="score">'+value+'</span></span></button>'}
function boxStat(title,value,meta){return '<div class="stat"><strong>'+esc(value)+'</strong><small>'+title+'</small>'+(meta?'<small>'+esc(meta)+'</small>':'')+'</div>'}
function identity(){const u=st.user,items=records(),summary=tally(items.filter(x=>x.mode!=='solo')),club=clubByUser(u),winner=summary.count?fmt(summary.w):'—';return tabHead('01 / PLAYER ID','هويتي','بطاقتك الرسمية في عالم FOOTBALL RIVALS','👤')+
'<div class="player-hero"><div class="eyebrow" style="color:#ffdf91">FOOTBALL RIVALS · OFFICIAL PLAYER ID</div><div class="hero-line">'+avatar(u)+'<div class="identity-meta"><div class="hero-name">'+esc(u.displayName||u.username)+'</div><small>@'+esc(u.username||'')+'</small><small>RIVALS ID · '+esc(u.id||'')+'</small></div></div>'+
'<div class="club-hero">'+crest(u)+'<div><strong>'+esc(u.favoriteTeam||'اختار ناديك المفضل')+'</strong><div class="subtle">هوية التشجيع · CLUB IDENTITY</div></div><button class="btn tiny" data-tab="settings" style="margin-right:auto">تغيير</button></div>'+
'<div class="hero-stats">'+[['⚔️',summary.count?fmt(summary.count):'—','مواجهات موثقة'],['🏆',winner,'انتصارات'],['📈',summary.pct===null?'—':summary.pct+'%','نسبة الفوز']].map(x=>'<div class="hero-stat"><b>'+x[1]+'</b><span>'+x[0]+' '+x[2]+'</span></div>').join('')+'</div></div>'+
section('بوابة مسيرتك','PLAYER UNIVERSE')+
'<div class="quick-grid">'+[['career','📈','مسيرتي','إحصائيات AI والأشخاص والفردي'],['matches','⚔️','مبارياتي','النتائج والمنافسون'],['rivals','🤝','منافسيني','الأصدقاء والتحديات'],['trophies','🏆','إنجازاتي','الكؤوس ودوريات الأصدقاء']].map(x=>'<button class="quick-card" data-tab="'+x[0]+'"><span class="sym">'+x[1]+'</span><span><b>'+x[2]+'</b><small>'+x[3]+'</small></span></button>').join('')+'</div>'+
section('آخر نشاط مسجّل','REAL MATCH DATA')+
(items.length?'<div class="list">'+items.slice(0,3).map(matchRow).join('')+'</div>':empty('لا يوجد تاريخ مباريات موثّق في الحساب بعد','أي نتائج قديمة غير مرتبطة بالحساب لن تتحول تلقائيًا إلى انتصارات.'))+
'<div class="box-note" style="margin-top:12px">البيانات المعروضة مأخوذة من سجل الحساب، ولا يتم إنشاء أرقام تجريبية أو ترتيب عالمي وهمي.</div>';
}
function career(){
 const mode=st.mode,items=filtered(mode,'all'),matches=items.filter(x=>x.mode!=='solo'),sum=tally(matches),solo=items.filter(x=>x.mode==='solo'),points=solo.filter(x=>x.points!==null).map(x=>x.points);
 const shown=mode==='solo'?[['الجولات',solo.length],['مجموع النقاط',points.length?fmt(points.reduce((a,b)=>a+b,0)):'—'],['أفضل نتيجة',points.length?fmt(Math.max(...points)):'—'],['متوسط النقاط',points.length?fmt(Math.round(points.reduce((a,b)=>a+b,0)/points.length)):'—']]:[['المباريات',sum.count],['الفوز',sum.w],['الخسارة',sum.l],['التعادل',sum.d],['نسبة الفوز',sum.pct===null?'—':sum.pct+'%'],...(mode==='all'?[['جولات فردية',solo.length]]:[])];
 const games=[...new Set(items.map(x=>x.game))].sort(),recent=items.slice(0,8).reverse();
 return tabHead('02 / CAREER CENTER','مسيرتي الكروية','إحصائيات كل الألعاب ضد الأشخاص والذكاء الاصطناعي والفردي','📈')+
 '<div class="modes">'+[['all','الكل'],['pvp','ضد أشخاص'],['ai','ضد AI'],['solo','فردي']].map(x=>'<button class="'+(mode===x[0]?'active':'')+'" data-mode="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+
 '<div class="card pad"><div class="eyebrow">VERIFIED CAREER STATS</div><div class="stats" style="margin-top:11px">'+shown.map(x=>stat(x[1],x[0])).join('')+'</div></div>'+
 section('تطور النتائج','LAST 8')+
 '<div class="card pad">'+(recent.length?'<div class="bars">'+recent.map((x,i)=>'<div><i style="height:'+Math.max(8,x.win==='win'?87:x.win==='draw'?55:x.win==='loss'?25:40)+'px"></i><small>'+(i+1)+'</small></div>').join('')+'</div>':empty('لا توجد نتائج موثّقة لهذا النوع'))+'</div>'+
 section('إحصائيات كل لعبة','PER GAME')+
 (games.length?'<div class="card">'+games.map(g=>{
  const rows=items.filter(x=>x.game===g),multi=rows.filter(x=>x.mode!=='solo'),single=rows.filter(x=>x.mode==='solo'),t=tally(multi),best=single.filter(x=>x.points!==null).map(x=>x.points);
  const count=(t.count?t.count+' مباراة':'')+(t.count&&single.length?' · ':'')+(single.length?single.length+' فردي':'');
  const value=t.pct!==null?t.pct+'%':best.length?fmt(Math.max(...best))+' نقطة':'—';
  return '<div class="metric"><div><strong>'+esc(g)+'</strong><div class="subtle">'+esc(count||'0 مباراة')+'</div></div><strong>'+value+'</strong></div>';
 }).join('')+'</div>':empty('مفيش نتائج محفوظة لهذا النوع من اللعب'))+
 (st.fr138Pending?'<div class="box-note" style="margin-top:12px">'+st.fr138Pending+' مواجهة لم تنتهِ أو تنتظر المزامنة؛ تُضاف نتيجتها بعد اعتمادها من السيرفر.</div>':'')+
 (st.historyError?'<div class="warning" style="margin-top:12px">'+esc(st.historyError)+'</div>':'');
}
function matches(){const all=filtered(st.matchMode,'all'),modes=[['all','الكل'],['pvp','أشخاص'],['ai','AI'],['solo','فردي']];return tabHead('03 / MATCH ARCHIVE','مبارياتي','سجل المواجهات والنتائج والمنافسين والتواريخ','⚔️')+
'<div class="modes">'+modes.map(x=>'<button data-matchmode="'+x[0]+'" class="'+(st.matchMode===x[0]?'active':'')+'">'+x[1]+'</button>').join('')+'</div>'+
'<div class="card pad" style="margin:10px 0"><div class="flex between"><b>كل المباريات المحفوظة</b><span class="badge">'+all.length+' سجل</span></div><div class="subtle">استخدم نوع اللعب أو افتح مباراة لتعرف تفاصيلها.</div></div>'+
(all.length?'<div class="list">'+all.map(m=>matchRow(m)+(st.selectedMatch===m.id?fr135MatchDetails(m):'')).join('')+'</div>':empty('لا توجد مباريات مؤكدة في السجل الحالي','المواجهات غير المرتبطة بحسابك لن تُعرض كأنها محفوظة.'))+
(st.fr138Pending?'<div class="box-note" style="margin-top:10px">'+st.fr138Pending+' مواجهة لم تنتهِ أو تنتظر المزامنة.</div>':'')+
(st.historyError?'<div class="warning" style="margin-top:10px">'+esc(st.historyError)+'</div>':'');
}
function friendRow(row,mode){const u=row.user||row;const actions=mode==='accepted'?'<button class="btn tiny" data-friend="challenge" data-id="'+esc(u.id)+'">⚔️ تحدي</button><button class="btn tiny" data-friend="h2h" data-id="'+esc(u.id)+'">H2H</button>':mode==='incoming'?'<button class="btn tiny gold" data-friend="friendAccept" data-id="'+esc(u.id)+'">قبول</button><button class="btn tiny" data-friend="friendDecline" data-id="'+esc(u.id)+'">رفض</button>':mode==='search'?'<button class="btn tiny gold" data-friend="friendRequest" data-id="'+esc(u.id)+'">إضافة</button><button class="btn tiny" data-friend="h2h" data-id="'+esc(u.id)+'">H2H</button>':'<span class="badge">بانتظار القبول</span>';return '<div class="social-row">'+avatar(u,'sm')+'<div><strong>'+esc(u.displayName||u.username)+'</strong><small>@'+esc(u.username||'')+' · '+esc(u.favoriteTeam||'بدون نادي')+'</small></div><div class="actions">'+actions+'</div></div>'}
function rivals(){const f=st.friends,accepted=f?.accepted||[],incoming=f?.incoming||[],outgoing=f?.outgoing||[];const people=records().filter(x=>x.mode==='pvp');const rivals=new Map();for(const m of people){let id=String(m.other.id||m.other.name||'');if(!id)continue;let row=rivals.get(id)||{name:m.other.name||'منافس',id,w:0,l:0,d:0,games:0,last:m};row.games++;if(m.win==='win')row.w++;else if(m.win==='loss')row.l++;else if(m.win==='draw')row.d++;rivals.set(id,row)}
return tabHead('04 / RIVAL NETWORK','منافسيني','أصدقاؤك وطلبات الصداقة وكل مواجهة بينكما','🤝')+
'<div class="card pad"><h2>ابحث عن منافس</h2><div class="subtle">اسم المستخدم أو اسم العرض</div><form id="fr92-search" class="search" style="margin-top:10px"><input name="query" minlength="2" required placeholder="اكتب اسم اللاعب..."><button class="btn gold" type="submit">بحث</button></form><div class="list" style="margin-top:10px">'+(st.search?.length?st.search.map(x=>friendRow(x,'search')).join(''):'')+'</div></div>'+
section('الأصدقاء',''+accepted.length)+
(accepted.length?'<div class="list">'+accepted.map(x=>friendRow(x,'accepted')).join('')+'</div>':empty('لسه مفيش أصدقاء','ابحث عن لاعب وابعت له طلب صداقة.'))+
section('طلبات الصداقة',incoming.length+' وارد')+
(incoming.length?'<div class="list">'+incoming.map(x=>friendRow(x,'incoming')).join('')+'</div>':empty('لا توجد طلبات جديدة'))+
(outgoing.length?section('الطلبات المرسلة',outgoing.length+' معلقة')+'<div class="list">'+outgoing.map(x=>friendRow(x,'outgoing')).join('')+'</div>':'')+
section('سجل المنافسين','HEAD TO HEAD')+
(rivals.size?'<div class="card">'+[...rivals.values()].sort((a,b)=>b.games-a.games).map(x=>'<div class="metric"><div><strong>'+esc(x.name)+'</strong><div class="subtle">'+x.games+' مواجهة · '+x.w+' فوز · '+x.d+' تعادل · '+x.l+' خسارة</div></div><button class="btn tiny" data-friend="h2h" data-id="'+esc(x.id)+'">التفاصيل</button></div>').join('')+'</div>':empty('لا توجد مواجهات موثّقة ضد أشخاص بعد'))+
section('دعوات التحدي','LIVE CHALLENGES')+
(challengeList());
}
function challengeList(){const raw=st.challenges;const rows=Array.isArray(raw)?raw:Array.isArray(raw?.incoming)?raw.incoming:[];return rows.length?'<div class="list">'+rows.map(c=>'<div class="social-row"><span>⚔️</span><div><strong>'+esc(c.from?.displayName||c.fromName||'دعوة تحدي')+'</strong><small>'+esc(c.game||'RIVALS CUP')+'</small></div>'+(c.url?'<a class="btn tiny gold" href="'+esc(c.url)+'">افتح التحدي</a>':'<span class="subtle">في انتظار بدء الغرفة</span>')+'</div>').join('')+'</div>':empty('لا توجد دعوات تحدي متاحة')}
function achievements(){const all=records(),pvp=all.filter(x=>x.mode==='pvp'),wins=all.filter(x=>x.win==='win'),games=new Set(all.map(x=>x.game)),award=[['🥇','أول فوز','مباراة موثقة واحدة',wins.length>=1],['🔥','سلسلة البداية','3 انتصارات موثقة',wins.length>=3],['⚔️','ملك المواجهات','10 مواجهات PvP',pvp.length>=10],['🌍','متعدد الألعاب','نتائج في 3 ألعاب',games.size>=3],['👑','أسطورة المنافسة','25 فوزًا موثقًا',wins.length>=25],['🏆','أستاذ المسيرة','50 مباراة محفوظة',all.length>=50]],got=award.filter(x=>x[3]).length;return tabHead('05 / TROPHY ROOM','إنجازاتي','الكؤوس والأوسمة والدوريات المرتبطة بالنتائج','🏆')+
'<div class="trophy-hero"><div class="eyebrow" style="text-align:center;color:#ffe2a2">MY TROPHY CABINET</div><div class="trophy-symbol">🏆</div><h2 style="color:var(--gold)">كل نتيجة موثّقة لها قيمة</h2><div class="stats" style="margin-top:13px">'+stat(got,'إنجازات مفتوحة')+stat(award.length,'إجمالي الأوسمة')+stat(st.leagues?.length??'—','دورياتي')+'</div></div>'+
section('الأوسمة والميداليات','ACHIEVEMENTS')+
'<div class="trophy-grid">'+award.map(a=>'<div class="medal '+(a[3]?'':'locked')+'"><span class="symbol">'+(a[3]?a[0]:'🔒')+'</span><b>'+a[1]+'</b><small>'+a[2]+'</small><span class="badge '+(a[3]?'good':'')+'" style="display:inline-block;margin-top:7px">'+(a[3]?'مفتوح':'مغلق')+'</span></div>').join('')+'</div>'+
section('دوريات الأصدقاء','PRIVATE LEAGUES')+
'<div class="card pad"><div class="list">'+(st.leagues?.length?st.leagues.map(l=>'<div class="social-row"><span>🏆</span><div><strong>'+esc(l.name)+'</strong><small>كود: '+esc(l.code)+'</small></div><button class="btn tiny" data-league="'+esc(l.code)+'">الترتيب</button></div>').join(''):empty('لم تشترك في دوري أصدقاء بعد'))+'</div>'+
'<form id="fr92-league-create" class="search" style="margin-top:12px"><input name="name" placeholder="اسم الدوري الجديد" maxlength="45" required><button class="btn gold">إنشاء</button></form>'+
'<form id="fr92-league-join" class="search" style="margin-top:9px"><input name="code" placeholder="كود دعوة الدوري" required><button class="btn">انضمام</button></form></div>';
}
function clubChoices(){const selected=st.selectedClub||st.user?.clubId||clubByUser(st.user)?.[0]||'';return '<div class="clubs">'+CLUBS.map(c=>'<button class="club-choice '+(c[0]===selected?'selected':'')+'" data-club="'+c[0]+'"><span class="club-crest">'+(c[3]?'<img src="'+esc(c[3])+'" alt="'+esc(c[1])+'" loading="lazy">':'⚽')+'</span><span>'+c[1]+'</span></button>').join('')+'</div>'}
function settings(){const u=st.user,club=CLUBS.find(c=>c[0]===(st.selectedClub||u.clubId))||clubByUser(u);return tabHead('06 / ACCOUNT CONTROL','إعداداتي','هوية اللاعب والنادي المفضل والخصوصية والأمان','⚙️')+
'<div class="card pad"><div class="eyebrow">PERSONAL IDENTITY</div><h2>هويتك الشخصية</h2><div class="flex" style="margin:13px 0">'+avatar(u)+'<div><strong>'+esc(u.displayName||u.username)+'</strong><div class="subtle">@'+esc(u.username)+'</div><button class="btn tiny" type="button" data-upload="avatar" style="margin-top:8px">📷 تغيير الصورة</button></div></div>'+
'<form id="fr92-profile-save" class="fields"><div class="field"><label>اسم العرض</label><input name="displayName" maxlength="40" required value="'+esc(u.displayName)+'"></div><div class="field"><label>نبذة عنك</label><textarea name="bio" maxlength="400" placeholder="اكتب نبذة كروية قصيرة...">'+esc(u.bio||'')+'</textarea></div><div class="field"><label>الرمز الشخصي</label><div class="badges">'+['⚽','🦁','👑','🏆','⭐','🔥','🦅','🐐'].map(a=>'<label class="medal-inline"><input name="avatar" type="radio" value="'+a+'" '+((u.avatar||'⚽')===a?'checked':'')+'> '+a+'</label>').join('')+'</div></div><button class="btn gold full" type="submit">💾 حفظ بيانات البروفايل</button></form></div>'+
section('اختار ناديك الحقيقي','OFFICIAL CLUB IDENTITY')+
'<div class="card pad"><div class="subtle">20 ناديًا مختارًا، الأهلي والزمالك في المقدمة. احتفظ بهوية FOOTBALL RIVALS مع أجواء ناديك.</div>'+
'<div class="club-selected">'+crest({...u,clubId:club?.[0]},'')+'<div><b>'+esc(club?.[1]||u.favoriteTeam||'اختر ناديك')+'</b><div class="subtle">'+esc(club?.[2]||'')+'</div></div></div>'+
clubChoices()+'<button class="btn gold full" type="button" data-action="saveClub" style="margin-top:13px">⚽ اعتماد النادي المختار</button></div>'+
section('الصورة والشعار','PHOTO & BADGE')+
'<div class="card pad"><div class="button-grid"><button class="btn" data-upload="avatar">📷 ارفع صورتك</button><button class="btn" data-upload="club">🛡️ ارفع شعارك</button></div><div class="button-grid" style="margin-top:8px"><button class="btn tiny" data-action="avatarPhoto">اعرض صورتي</button><button class="btn tiny" data-action="avatarClub">اعرض الشعار</button></div><div class="form-hint">لإظهار صورتك أو شعارك المخصص في الهوية. النادي الرسمي يتم اختياره من القائمة.</div></div>'+
section('حماية الحساب','ACCOUNT SECURITY')+
'<div class="card pad"><div class="field"><label>البريد المرتبط بالحساب</label><div class="box-note">'+esc(u.email||'غير متاح')+'</div></div><form id="fr92-password" class="fields" style="margin-top:13px"><div class="field"><label>كلمة المرور الحالية</label><input name="oldPassword" type="password" required autocomplete="current-password"></div><div class="field"><label>كلمة المرور الجديدة</label><input name="newPassword" type="password" required minlength="10" autocomplete="new-password"></div><button class="btn gold full">🔐 تغيير كلمة المرور</button></form><div class="warning" style="margin-top:12px">استعادة كلمة المرور عبر البريد غير مفعّلة على الخادم الحالي، فلا نعِد بإرسال رسائل غير متاحة.</div><button class="btn full" style="margin-top:12px" data-action="logout">تسجيل الخروج</button></div>';
}
function shell(){return '<div class="shell"><header class="topbar"><a class="brand" href="/"><img src="/assets/brand/logo-fr.svg" alt="FR"><div><b>FOOTBALL <em>RIVALS</em></b><small>THE GAME ARENA</small></div></a><div class="top-actions"><span class="badge gold">RIVALS ID 2.0</span><button class="icon-btn" data-tab="settings" title="الإعدادات">⚙️</button></div></header><div id="fr92-tabs" class="tabs" role="tablist">'+PAGE_IDS.map((id,i)=>'<button role="tab" aria-selected="'+(st.tab===id)+'" class="tab '+(st.tab===id?'active':'')+'" data-tab="'+id+'">'+LABELS[i]+'</button>').join('')+'</div><main id="fr92-page" class="page">'+(st.tab==='identity'?identity():st.tab==='career'?career():st.tab==='matches'?matches():st.tab==='rivals'?rivals():st.tab==='trophies'?achievements():settings())+'</main></div><input type="file" id="fr92-file" accept="image/png,image/jpeg,image/webp" hidden>'}
function auth(){return '<div class="shell"><header class="topbar"><a class="brand" href="/"><img src="/assets/brand/logo-fr.svg" alt=""><div><b>FOOTBALL <em>RIVALS</em></b><small>THE GAME ARENA</small></div></a></header><section class="auth"><div class="head"><img src="/assets/brand/logo-fr.svg" alt=""><div class="eyebrow" style="text-align:center">RIVALS ID 2.0</div><h1>هويتك الكروية تبدأ هنا</h1><p class="subtle">حساب واحد لكل الألعاب وسجل مسيرة موثق.</p></div><div class="card"><div class="auth-tabs"><button class="'+(st.authMode==='login'?'active':'')+'" data-auth="login">تسجيل الدخول</button><button class="'+(st.authMode==='register'?'active':'')+'" data-auth="register">إنشاء حساب</button></div><form id="fr92-auth" class="fields">'+(st.authMode==='register'?'<div class="field"><label>اسم المستخدم بالإنجليزية</label><input name="username" pattern="[A-Za-z0-9_]{3,20}" minlength="3" maxlength="20" required autocomplete="username"></div><div class="field"><label>اسم العرض</label><input name="displayName" maxlength="40" required></div><div class="field"><label>البريد الإلكتروني</label><input name="email" type="email" required autocomplete="email"></div>':'<div class="field"><label>اسم المستخدم أو البريد الإلكتروني</label><input name="login" required autocomplete="username"></div>')+'<div class="field"><label>كلمة المرور</label><input name="password" type="password" required minlength="'+(st.authMode==='register'?'10':'1')+'" autocomplete="'+(st.authMode==='register'?'new-password':'current-password')+'"></div><button class="btn gold full" type="submit">'+(st.authMode==='register'?'اصنع هويتك':'ادخل إلى مسيرتك')+'</button></form><div class="box-note" style="margin-top:12px">نفس حساب FOOTBALL RIVALS القديم، مش محتاج تعمل حساب جديد.</div></div></section></div>'}
function draw(){ROOT.innerHTML=st.user?shell():auth();if(!ROOT.hidden)document.title='RIVALS ID 2.0 — '+(st.user?LABELS[PAGE_IDS.indexOf(st.tab)]:'تسجيل الدخول')+' | FOOTBALL RIVALS';}

/* FR93: verified server-side results + legacy account archive; never invent scores */
async function fr93Results(data){const r=await fetch('/api/fr93-results',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'السجل غير متاح');return j}
async function fr134Results(data){const r=await fetch('/api/fr95-voice',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.code||'السجل غير متاح');return j}
async function fetchHistory(){
 if(!st.user)return;
 const [old,verified,unified]=await Promise.allSettled([account('history'),fr93Results({op:'history'}),fr134Results({op:'history'})]);
 const matches=[],ids=new Set();
 for(const j of [unified.status==='fulfilled'?unified.value:null,verified.status==='fulfilled'?verified.value:null,old.status==='fulfilled'?old.value:null]){
  for(const m of (Array.isArray(j?.matches)?j.matches:[])){const k=String(m.id||'');if(k&&ids.has(k))continue;if(k)ids.add(k);matches.push(m)}
 }
 matches.sort((a,b)=>new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0));
 st.history=matches;st.historyFetched=true;
 st.fr138Pending=unified.status==='fulfilled'?Number(unified.value?.pending)||0:0;st.historyError=unified.status==='rejected'||unified.value?.syncError?'تعذر مزامنة جزء من سجل المباريات، جرّب إعادة فتح الصفحة.':(old.status==='rejected'&&verified.status==='rejected'?'تعذر تحميل السجل السابق للمباريات.':'');
}
let fr138PendingTimer=null,fr138RecoveryRunning=false,fr138RecoveryOwner='',fr138RecoveryAttempts=0;
const fr138RecoveredOwners=new Set();
function fr138SchedulePending(){
 if(fr138PendingTimer||!st.user||ROOT.hidden||!st.fr138Pending)return;
 fr138PendingTimer=setTimeout(async()=>{fr138PendingTimer=null;if(!st.user||ROOT.hidden)return;await fetchHistory();draw();fr138SchedulePending()},12000);
}
function fr138Sessions(){
 const out=[];
 try{
  for(const [kind,key] of [['hidden','fr_hidden_xi_v1'],['star','fr:starverse:v2:active']]){
   const x=JSON.parse(localStorage.getItem(key)||'null'),code=x?.id||x?.room;
   if(code&&x?.token)out.push({kind,code:String(code).toUpperCase(),token:String(x.token)});
  }
 }catch{}
 return out;
}
async function fr138RecoverRecent(){
 if(!st.user||ROOT.hidden||fr138RecoveryRunning)return;
 const owner=meId();if(fr138RecoveredOwners.has(owner))return;
 if(fr138RecoveryOwner!==owner){fr138RecoveryOwner=owner;fr138RecoveryAttempts=0}
 fr138RecoveryRunning=true;fr138RecoveryAttempts++;
 try{
  const jobs=[fr134Results({op:'recover-recent',owner}),...fr138Sessions().map(s=>fr134Results({op:'recover',...s,owner}))];
  const results=await Promise.allSettled(jobs);if(!st.user||meId()!==owner)return;
  await fetchHistory();if(!ROOT.hidden)draw();fr138SchedulePending();
  const scan=results[0];
  if(scan.status==='fulfilled'&&scan.value?.more&&fr138RecoveryAttempts<10)setTimeout(fr138RecoverRecent,2500);
  else{fr138RecoveredOwners.add(owner);if(scan.status==='rejected'){st.historyError=st.historyError||'تعذر استعادة بعض المباريات السابقة حاليًا.';if(!ROOT.hidden)draw()}}
 }catch{if(st.user&&meId()===owner){st.historyError=st.historyError||'تعذر استعادة بعض المباريات السابقة حاليًا.';if(!ROOT.hidden)draw()}}
 finally{fr138RecoveryRunning=false}
}
function fr138AfterRefresh(){
 if(!st.user||ROOT.hidden)return;
 fr138SchedulePending();
 if(!fr138RecoveredOwners.has(meId())&&!fr138RecoveryRunning)setTimeout(fr138RecoverRecent,0);
}

async function fr93RecoverRecent(){
 if(!st.user)return;
 const keys=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('fr:uxi:room:v1:'))keys.push({kind:'ultimate',code:k.split(':').pop(),token:localStorage.getItem(k)});
 if(k?.startsWith('fr:five:token:fr66:'))keys.push({kind:'five',code:k.split(':').pop(),token:localStorage.getItem(k)})}}catch(e){return}
 for(const item of keys.slice(-14)){
  if(!item.token)continue;
  try{await fr93Results({op:'commit',...item})}catch(e){}
 }
}

async function fetchSocial(section){if(!st.user)return;const list=section==='rivals'?[['friends','friends'],['challenges','challenges']]:section==='trophies'?[['leagues','leagues']]:[];if(!list.length)return;const r=await Promise.allSettled(list.map(x=>social(x[1])));for(let i=0;i<list.length;i++){if(r[i].status==='fulfilled'){const key=list[i][0],data=r[i].value;st[key]=key==='friends'?data:key==='challenges'?(data.challenges||[]):data.leagues||[]}}}
async function open(tab){if(!PAGE_IDS.includes(tab))return;st.tab=tab;history.replaceState(null,'',location.pathname+'?tab='+tab);draw();scrollTo({top:0,behavior:'instant'});if(tab==='rivals'||tab==='trophies'){await fetchSocial(tab);if(st.tab===tab)draw()}}
async function refresh(){await Promise.allSettled([fetchHistory(),fetchSocial(st.tab)]);draw();fr138AfterRefresh()}
async function run(fn){if(st.lock)return;st.lock=true;try{await fn()}catch(e){toast(e.message||'حصلت مشكلة',true)}finally{st.lock=false}}
async function upload(file,kind){if(!file)throw Error('اختار صورة أولاً');if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('اختار JPG أو PNG أو WebP');if(file.size>8*1024*1024)throw Error('الصورة أكبر من 8 ميجا');
const image=await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{try{const c=document.createElement('canvas'),size=280;c.width=c.height=size;const ctx=c.getContext('2d'),scale=Math.max(size/im.width,size/im.height),w=im.width*scale,h=im.height*scale;ctx.drawImage(im,(size-w)/2,(size-h)/2,w,h);let data='';for(const q of [.8,.68,.54,.42,.3]){data=c.toDataURL('image/webp',q);if(data.length<=100000)break}URL.revokeObjectURL(url);if(data.length>100000)reject(Error('تعذر ضغط الصورة'));else resolve(data)}catch(e){reject(e)}};im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('صورة غير صالحة'))};im.src=url});
const j=await social('upload',{kind,image});if(kind==='avatar'){st.user.avatarUrl=j.url;st.user.avatarMode='photo'}else st.user.clubLogoUrl=j.url;toast('✅ تم حفظ الصورة على الخادم');draw()}
function fr135MatchDetails(m){
 const raw=m.raw||{},d=raw.details;
 if(!d)return '<div class="card pad fr135-match-detail"><strong>تفاصيل المباراة</strong><p class="subtle">التفاصيل الإضافية غير محفوظة لهذه المباراة القديمة.</p></div>';
 const info=[raw.difficulty?'المستوى: '+raw.difficulty:'',raw.theme?'فلتر الكروت: '+raw.theme:'',raw.gameMode?'المود: '+raw.gameMode:''].filter(Boolean);
 const stats=Array.isArray(d.stats)?d.stats:[],teams=Array.isArray(d.teams)?d.teams:[],events=Array.isArray(d.events)?d.events:[],rounds=Array.isArray(d.rounds)?d.rounds:[];
 const teamBlock=(t,i)=>{
  const players=Array.isArray(t.players)?t.players:[],ratings=Array.isArray(t.ratings)?t.ratings:[];
  const playerList=players.map(p=>{
   const found=ratings.find(r=>r.name&&r.name.toLowerCase()===String(p.name||'').toLowerCase());
   const rating=found?.rating??p.rating;
   return '<li><span>'+esc(p.name)+(p.bench?' <small>احتياطي</small>':'')+'</span><span>'+esc(p.position||'')+(p.ovr!=null?' · '+esc(p.ovr):'')+(rating!=null?' · ⭐ '+esc(rating):'')+'</span></li>';
  }).join('');
  return '<details class="fr135-squad"><summary><b>'+esc(i===0?'فريقك':'فريق المنافس')+' · '+esc(t.name||'—')+'</b><small>'+players.length+' لاعب</small></summary>'+
   (t.club?'<p>النادي: '+esc(t.club)+'</p>':'')+(t.coach?'<p>المدرب: '+esc(t.coach)+'</p>':'')+(t.tactic?'<p>الخطة: '+esc(t.tactic)+'</p>':'')+
   (players.length?'<ul>'+playerList+'</ul>':'<p class="subtle">لا توجد تشكيلات محفوظة لهذه اللعبة.</p>')+'</details>';
 };
 return '<section class="card pad fr135-match-detail" aria-label="تفاصيل المباراة">'+
  '<div class="flex between"><strong>'+esc(m.game)+' · تفاصيل المباراة</strong><button class="btn tiny" type="button" data-fr135-close>إغلاق</button></div>'+
  '<p class="subtle">'+esc(dateText(m.at))+' · '+esc(winLabel(m.win))+' · '+esc(m.mode==='solo'?(m.points??'—')+' نقطة':m.score.join(' - '))+'</p>'+
  (info.length?'<p class="subtle">'+info.map(esc).join(' · ')+'</p>':'')+
  (d.mvp?.name?'<div class="fr135-mvp">⭐ رجل المباراة: <b>'+esc(d.mvp.name)+'</b>'+(d.mvp.rating!=null?' · التقييم '+esc(d.mvp.rating):'')+'</div>':'')+
  (stats.length?'<div class="fr135-stats"><h3>إحصائيات المباراة</h3>'+stats.map(x=>'<div><b>'+esc(x.values?.[0]??'—')+'</b><span>'+esc(x.label)+'</span><b>'+esc(x.values?.[1]??'—')+'</b></div>').join('')+'</div>':'')+
  (teams.length?'<div class="fr135-teams">'+teams.map(teamBlock).join('')+'</div>':'')+
  (events.length?'<details class="fr135-squad"><summary><b>أحداث المباراة</b><small>'+events.length+' حدث</small></summary><ul>'+events.map(e=>'<li><span>'+(e.minute!=null?esc(e.minute)+'′ ':'')+esc(e.text||e.type||'حدث')+'</span><span>'+esc(e.player||'')+'</span></li>').join('')+'</ul></details>':'')+
  (rounds.length?'<details class="fr135-squad"><summary><b>جولات التحدي</b><small>'+rounds.length+' جولة</small></summary><ul>'+rounds.map(r=>'<li><span>الجولة '+esc(r.round??'—')+' · '+esc(r.type)+'</span><span>'+esc(r.answer)+'</span></li>').join('')+'</ul></details>':'')+
  '</section>';
}

function detailedMatch(m){let text='اللعبة: '+m.game+'\nالنوع: '+(m.mode==='pvp'?'ضد لاعب':m.mode==='ai'?'ضد AI':'فردي')+'\nالنتيجة: '+m.score.join(' - ')+'\nالتاريخ: '+dateText(m.at)+'\nالمنافس: '+(m.other.name||'—');alert(text)}
async function h2h(id){const r=await account('h2h',{opponent:id});st.rival=r;const text='سجل المواجهات مع '+r.rival.displayName+'\nالفوز: '+r.record.wins+' · التعادل: '+r.record.draws+' · الخسارة: '+r.record.losses+'\nمباريات محفوظة: '+r.matches.length;alert(text)}
document.addEventListener('error',e=>{if(!ROOT.contains(e.target))return;const img=e.target;if(img?.tagName!=='IMG'||!img.closest('.club-crest')||img.dataset.fr941Fallback)return;img.dataset.fr941Fallback='1';img.classList.add('broken');const frame=img.closest('.club-crest'),a=String(img.alt||'');const id=img.closest('[data-club]')?.dataset.club||st.user?.clubId||'';const name=id==='alahly'||a.includes('الأهلي')?'الأهلي':id==='zamalek'||a.includes('الزمالك')?'الزمالك':'⚽';const label=document.createElement('span');label.className='fr941-crest-text';label.textContent=name;frame.appendChild(label)},true);
document.addEventListener('click',e=>{if(!ROOT.contains(e.target))return;const tab=e.target.closest('[data-tab]');if(tab){e.preventDefault();open(tab.dataset.tab);return}
const a=e.target.closest('[data-auth]');if(a){st.authMode=a.dataset.auth;draw();return}
const m=e.target.closest('[data-mode]');if(m){st.mode=m.dataset.mode;draw();return}
const mf=e.target.closest('[data-matchmode]');if(mf){st.matchMode=mf.dataset.matchmode;draw();return}
const co=e.target.closest('[data-club]');if(co){st.selectedClub=co.dataset.club;draw();return}
const close=e.target.closest('[data-fr135-close]');if(close){st.selectedMatch=null;draw();return}const match=e.target.closest('[data-match]');if(match){let x=records().find(r=>r.id===match.dataset.match);if(x){st.tab='matches';st.matchMode='all';st.selectedMatch=st.selectedMatch===x.id?null:x.id;draw();requestAnimationFrame(()=>document.querySelector('.fr135-match-detail')?.scrollIntoView({block:'nearest'}))}return}
const friend=e.target.closest('[data-friend]');if(friend){run(async()=>{const id=friend.dataset.id,action=friend.dataset.friend;if(action==='h2h')return h2h(id);if(action==='challenge'){const r=await social('challenge',{target:id,game:'cup'});if(r.url)location.href=r.url;else toast('تم إرسال التحدي');return}await social(action,{target:id});await fetchSocial('rivals');draw();toast('تم تحديث الأصدقاء')});return}
const league=e.target.closest('[data-league]');if(league){run(async()=>{const r=await social('leagueDetails',{code:league.dataset.league});const rows=r.standings||[];alert('ترتيب دوري '+r.league.name+'\n'+rows.map((x,i)=>(i+1)+'. '+x.user.displayName+' — '+x.points+' نقطة').join('\n'))});return}
const uploadB=e.target.closest('[data-upload]');if(uploadB){const file=document.getElementById('fr92-file');file.dataset.kind=uploadB.dataset.upload;file.click();return}
const btn=e.target.closest('[data-action]');if(btn){run(async()=>{const act=btn.dataset.action;if(act==='logout'){await account('logout');st.user=null;st.history=null;st.friends=null;draw();toast('تم تسجيل الخروج');return}if(act==='saveClub'){const id=st.selectedClub||st.user.clubId;if(!id)return toast('اختار النادي الأول',true);const club=CLUBS.find(x=>x[0]===id);if(!club)throw Error('النادي غير موجود');await social('club',{clubId:id});st.user.clubId=id;st.user.favoriteTeam=club[1];toast('✅ تم اعتماد نادي '+club[1]);draw();return}if(act==='avatarPhoto'||act==='avatarClub'){const mode=act==='avatarPhoto'?'photo':'club';await social('avatarMode',{mode});st.user.avatarMode=mode;draw();toast('تم تحديث هوية الصورة')}});return}});
document.addEventListener('change',e=>{if(!ROOT.contains(e.target))return;if(e.target.id!=='fr92-file')return;const file=e.target.files[0],kind=e.target.dataset.kind;e.target.value='';run(()=>upload(file,kind))});
document.addEventListener('submit',e=>{if(!ROOT.contains(e.target))return;const form=e.target;if(!/^fr92-/.test(form.id))return;e.preventDefault();const d=Object.fromEntries(new FormData(form).entries());run(async()=>{if(form.id==='fr92-auth'){const op=st.authMode==='register'?'register':'login',r=await account(op,d);st.user=r.user;await refresh();toast('أهلًا بيك في RIVALS ID 2.0');return}if(form.id==='fr92-profile-save'){const r=await account('update',{displayName:d.displayName,bio:d.bio,avatar:d.avatar||st.user.avatar,favoriteTeam:st.user.favoriteTeam||''});st.user=r.user;draw();toast('✅ تم حفظ البروفايل');return}if(form.id==='fr92-password'){await account('changePassword',d);form.reset();toast('✅ كلمة السر اتغيّرت');return}if(form.id==='fr92-search'){const r=await account('search',{query:d.query});st.search=(r.players||[]).filter(x=>x.id!==meId());draw();return}if(form.id==='fr92-league-create'){const r=await social('leagueCreate',{name:d.name});await fetchSocial('trophies');draw();toast('تم إنشاء الدوري: '+r.league.name);return}if(form.id==='fr92-league-join'){const r=await social('leagueJoin',{code:d.code.trim().toUpperCase()});await fetchSocial('trophies');draw();toast('انضممت إلى الدوري: '+r.league.name)}})});
window.addEventListener('fr137:profile-shown',()=>{const tab=new URLSearchParams(location.search).get('tab');if(PAGE_IDS.includes(tab))st.tab=tab;(async()=>{const j=await account('session');st.user=j.authenticated&&j.user?j.user:null;draw();if(st.user)await refresh()})().catch(()=>toast('تعذر الاتصال بخادم الحسابات',true))});
window.addEventListener('fr134:career-synced',()=>{if(st.user)refresh()});
(async()=>{try{const j=await account('session');if(j.authenticated&&j.user){st.user=j.user;draw();await refresh();fr93RecoverRecent().then(()=>{if(st.user)refresh()}).catch(()=>{})}else draw()}catch(e){draw();toast('تعذر الاتصال بخادم الحسابات',true)}})();
})();
