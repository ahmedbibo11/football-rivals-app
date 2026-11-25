/* RIVALS SEASONS 21 — real account progress, one-time rewards, frame collection */
(()=>{'use strict';
const $=x=>document.querySelector(x),API='/api/rivals-seasons',STORE='fr-rivals-id20';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frameNames={default:'عادي',bronze:'برونزي',steel:'فضي',emerald:'زمردي',sapphire:'ياقوتي',gold:'ذهبي',platinum:'بلاتيني'};
let auth=null,data=null,busy=false,toastTimer=null;
try{auth=JSON.parse(localStorage.getItem(STORE)||'null')}catch{}
const timer =()=>{if(!data)return;const end=Date.parse(data.season.ends);const remain=end-Date.now();const days=Math.max(0,Math.floor(remain/86400000));const hours=Math.max(0,Math.floor(remain/3600000)%24);$('#seasonLeft').textContent=remain>0?days+' يوم · '+hours+' ساعة':'انتهى الموسم';$('#seasonStatus').textContent=data.season.active?'SEASON 01 · LIVE NOW':'SEASON 01 · CLOSED'};
function toast(s,error=false){const x=$('#toast');x.textContent=s;x.classList.toggle('error',error);x.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.add('hidden'),4000)}
async function api(op,body={}){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
 try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
 body:JSON.stringify({op,profileId:auth?.id,profileToken:auth?.token,...body}),signal:abort.signal});
 const j=await r.json().catch(()=>({ok:false,error:'فشل قراءة رد السيرفر'}));if(!r.ok||j.ok===false)throw Object.assign(new Error(j.error||'حدث خطأ'),{code:j.code||'API_ERROR'});return j}
 finally{clearTimeout(timer)}
}
function view(){
 $('#content').classList.toggle('hidden',!data);
 $('#notConnected').classList.toggle('hidden',!!data);
 if(data){render();timer()}
}
function render(){
 const p=data.profile;
 $('#playerName').textContent=p.name;$('#playerId').textContent=p.id;
 $('#profileBadge').className='profile-badge '+p.frame;
 $('#level').textContent=String(p.level).padStart(2,'0');
 $('#rating').textContent=p.rating;$('#wins').textContent=p.wins;$('#points').textContent=p.cupPoints;
 $('#division').textContent=p.rating>=1400?'ELITE DIVISION':p.rating>=1150?'PRO DIVISION':'ROOKIE DIVISION';
 $('#dailyStreak').textContent='🔥 DAILY STREAK '+data.checkin.streak;
 $('#xpTotal').textContent=p.xp.toLocaleString('en-US')+' XP';
 $('#xpFrom').textContent='LEVEL '+p.level;$('#xpTo').textContent='LEVEL '+(p.level+1);
 $('#xpBar').style.width=Math.max(0,Math.min(100,p.levelProgress/p.levelNeed*100))+'%';
 $('#xpDescription').textContent=p.levelProgress+' / '+p.levelNeed+' XP للمستوى التالي · '+data.claimed+' / '+data.total+' أوسمة محصّلة';
 const division=p.rating>=1400?'ELITE':p.rating>=1150?'PRO':p.rating>=1050?'RISING STAR':'ROOKIE';
 $('#tier').textContent=division+' · LEVEL '+p.level;
 $('#tierText').textContent=p.wins+' انتصارات · '+p.played+' بطولات · أفضل سلسلة فوز '+p.bestStreak;
 $('#dailyInfo').textContent='سلسلة الحضور: '+data.checkin.streak+' يوم · مجموع الزيارات: '+data.checkin.total;
 const b=$('#checkinBtn');b.disabled=data.checkin.claimed||!data.season.active;b.textContent=data.checkin.claimed?'✓ استلمتها اليوم':data.season.active?'🎁 استلم 30 XP':'انتهى الموسم';
 $('#completeCount').textContent=data.claimed+' / '+data.total;
 $('#missionList').innerHTML=data.achievements.map(m=>{
 const ratio=Math.min(100,Math.round(m.progress/m.need*100));
 const mode=m.claimed?'owned':m.eligible&&data.season.active?'ready':'';
 const action=m.claimed?'✓ تم الاستلام':m.eligible&&data.season.active?'استلم':'مقفول 🔒';
 return '<div class="mission '+mode+'"><span class="mission-icon">'+m.icon+'</span><div class="mission-details">'+
 '<strong>'+escape(m.title)+'</strong><p>'+escape(m.description)+'</p>'+
 '<div class="mission-progress"><div class="bar"><span style="width:'+ratio+'%"></span></div><small>'+m.progress+' / '+m.need+'</small></div></div>'+
 '<div class="mission-right"><span>+'+m.xp+' XP</span><button data-claim="'+m.id+'" class="'+(m.claimed?'owned':!m.eligible||!data.season.active?'locked':'')+'" '+(m.claimed||!m.eligible||!data.season.active?'disabled':'')+'>'+action+'</button></div></div>';
 }).join('');
 const claimed=data.achievements.filter(a=>a.claimed);
 $('#trophyGrid').innerHTML=data.achievements.map(a=>'<div class="trophy-item '+(a.claimed?'claimed':'')+'" title="'+escape(a.description)+'">'+
 '<span class="trophy-icon">'+a.icon+'</span><strong>'+escape(a.title)+'</strong><small>'+escape(a.name)+'</small></div>').join('');
 $('#frames').innerHTML=Object.keys(frameNames).map(f=>{
 const owned=data.frames.includes(f),equipped=p.frame===f;
 return '<button class="frame-item '+f+(equipped?' equipped':'')+'" data-frame="'+f+'" '+(owned?'':'disabled')+' title="'+escape(frameNames[f])+'">'+
 '<span class="sample">FR</span><span>'+escape(frameNames[f])+'</span><small>'+(equipped?'✓ مُفعّل':owned?'اختار الإطار':'🔒 مقفول')+'</small></button>';
 }).join('');
}
async function refresh(){
 if(!auth?.id||!auth?.token){data=null;view();return}
 try{data=await api('status');view();loadRank()}
 catch(e){data=null;view();toast(e.message||'تعذر تحميل بيانات الموسم',true)}
}
async function run(btn,op,body,success){
 if(busy)return;busy=true;if(btn)btn.disabled=true;let succeeded=false;
 try{data=await api(op,body);succeeded=true;render();timer();toast(success)}
 catch(e){toast(e.message||'تعذر التنفيذ',true)}finally{busy=false;if(!succeeded&&btn?.isConnected)btn.disabled=false}
}
async function loadRank(){
 try{const r=await api('leaderboard');
 $('#leaderboard').innerHTML=r.players.length?r.players.slice(0,20).map((p,i)=>
 '<div class="rank-row"><span class="rank-pos">'+String(i+1).padStart(2,'0')+'</span>'+
 '<div class="rank-name"><b>'+escape(p.name)+'</b><small>'+p.wins+' كؤوس · '+p.played+' مباريات</small></div>'+
 '<span class="rank-rating">'+p.rating+'</span></div>').join(''):'<p>لوحة المتصدرين لسه بتستقبل أول الأبطال 🏆</p>'}
 catch{$('#leaderboard').innerHTML='<p>تعذر تحميل ترتيب اللاعبين</p>'}
}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('✅ تم النسخ')}catch{toast('الكود: '+text)}}
$('#checkinBtn').addEventListener('click',e=>run(e.currentTarget,'checkin',{},'🎁 استلمت مكافأة اليوم: +30 XP'));
$('#missionList').addEventListener('click',e=>{const b=e.target.closest('[data-claim]');if(b)run(b,'claim',{badge:b.dataset.claim},'🏅 مبروك! حصلت على وسام جديد')});
$('#frames').addEventListener('click',e=>{const b=e.target.closest('[data-frame]');if(b&&!b.disabled)run(b,'frame',{frame:b.dataset.frame},'✨ تم تفعيل الإطار!')});
$('#refreshRank').addEventListener('click',loadRank);
$('#recoveryBtn').addEventListener('click',()=>{if(auth)copy(auth.id+'.'+auth.token)});
$('#restoreBtn').addEventListener('click',async()=>{
 const val=$('#restoreInput').value.trim(),dot=val.indexOf('.');
 if(dot!==10||val.length<35)return toast('الكود بصيغة PLAYER-ID.SECRET-TOKEN',true);
 const prev=auth;auth={id:val.slice(0,dot).toUpperCase(),token:val.slice(dot+1)};
 try{data=await api('status');localStorage.setItem(STORE,JSON.stringify(auth));view();loadRank();toast('✅ تم استرجاع الهوية')}
 catch(e){auth=prev;toast(e.message||'الكود غير صحيح',true)}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&auth)refresh()});
setInterval(timer,60000);
if(auth?.id&&auth?.token)refresh();else {auth={id:'SESSION',token:'session'};refresh().catch(()=>{auth=null;view()})}
})();
