(()=>{'use strict';
const $=x=>document.getElementById(x),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),API='/api/rivals-core';
let data=null,busy=false;
const fmt=n=>Number(n||0).toLocaleString('en-US');
const BADGES=[['FIRST_MATCH','🎯','أول مباراة'],['FIVE_CORRECT','🧠','5 إجابات صح'],['FIRST_VICTORY','⚔️','أول فوز مصنف'],['TEN_MATCHES','🔥','10 مباريات'],['STREAK_THREE','🚀','3 انتصارات متتالية'],['SILVER_RANK','🥈','SILVER'],['GOLD_RANK','🥇','GOLD'],['DIAMOND_RANK','💎','DIAMOND']];
const none=x=>'<div class="empty">'+x+'</div>';
const toast=s=>{$('toast').textContent=s;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,4100)};
async function api(op,b={}){let r=await fetch(API,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({...b,op:'lg'+op[0].toUpperCase()+op.slice(1)})});let d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'السيرفر مش متاح');return d}
async function star(op,b={}){let r=await fetch(API,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({...b,op:'sv'+op[0].toUpperCase()+op.slice(1)})});let d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'تعذر إنشاء الغرفة');return d}
const person=(u,buttons='')=>'<div class="person"><span class="avatar">'+esc(u.avatar||'⚽')+'</span><span class="detail"><b>'+esc(u.displayName||u.username)+'</b><small>@'+esc(u.username||'')+'</small></span>'+buttons+'</div>';
const btn=(action,id,label,danger=false)=>'<button type="button" '+(danger?'class="danger" ':'')+'data-action="'+action+'" data-target="'+esc(id)+'">'+label+'</button>';
function tab(name){document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));document.querySelectorAll('.pane').forEach(x=>x.hidden=x.id!==name)}
function showBoard(d){$('board').innerHTML=d.board?.length?d.board.map(x=>'<div class="boardentry"><span class="place">'+x.place+'</span><span class="avatar">'+esc(x.profile.avatar||'⚽')+'</span><span class="playerline"><b>'+esc(x.profile.displayName||x.profile.username)+'</b><small>'+esc(x.profile.favoriteTeam||'FOOTBALL RIVALS')+'</small></span><span class="scoreline"><b>'+fmt(x.points)+'</b><small>'+esc(x.tier.icon+' '+x.tier.name)+'</small></span></div>').join(''):none('أول فائز مصنف في الموسم هيظهر هنا! 🏆')}
function showMember(d){$('guest').hidden=d.authenticated;$('member').hidden=!d.authenticated;if(!d.authenticated){$('friendsGuest').hidden=false;$('friendsArea').hidden=true;return}
 const u=d.profile,s=d.stats||{},t=s.tier||{name:'BRONZE',icon:'🥉',next:{name:'SILVER',points:1100}};
 $('player').textContent=u.displayName||u.username;$('tierIcon').textContent=t.icon;$('tierName').textContent=t.name;$('rating').textContent=fmt(s.rating);
 const thresholds={BRONZE:1000,SILVER:1100,GOLD:1300,DIAMOND:1500,ELITE:1700},from=thresholds[t.name]||1000,to=t.next?.points||1700;
 $('progress').style.width=(t.next?Math.max(0,Math.min(100,100*(s.rating-from)/Math.max(1,to-from))):100)+'%';
 $('promotion').textContent=t.next?'باقي '+fmt(Math.max(0,to-s.rating))+' نقطة للصعود إلى '+t.next.name:'وصلت إلى ELITE 👑';
 $('position').textContent=d.position?'ترتيبك في الدوري: #'+d.position:'ابدأ مباراة مصنفة عشان يظهر ترتيبك';
 for(const [id,val] of [['games',s.played],['wins',s.wins],['streak',s.streak],['xp',s.xp],['accuracy',(s.accuracy||0)+'%'],['solo',s.soloPlayed]])$(id).textContent=id==='accuracy'?val:fmt(val);
 $('recent').hidden=!d.recent?.length;
 if(d.recent?.length)$('recentList').innerHTML=d.recent.map(r=>{const me=r.players?.find(p=>p.id===u.id),other=r.players?.find(p=>p.id!==u.id);return '<div class="result"><span>'+(r.ranked?'⚔️ مصنفة':'🎯 فردي')+' · '+esc(other?.name||"WHO'S THE STAR")+'</span><strong>'+fmt(me?.score||0)+'</strong></div>'}).join('');
 $('friendsGuest').hidden=true;$('friendsArea').hidden=false;
 $('pendingCount').hidden=!(d.requests?.length||d.invites?.length);$('pendingCount').textContent=String((d.requests?.length||0)+(d.invites?.length||0));
 $('friendsList').innerHTML=d.friends?.length?d.friends.map(x=>person(x,btn('challenge',x.id,'⚔️ تحدي')+btn('remove',x.id,'إزالة',true))).join(''):none('مفيش أصدقاء لسه. ابحث عن اسم صاحبك الأول.');
 $('requestsList').innerHTML=d.requests?.length?d.requests.map(x=>person(x,btn('accept',x.id,'قبول')+btn('decline',x.id,'رفض',true))).join(''):none('مفيش طلبات صداقة دلوقتي.');
 $('invitesList').innerHTML=d.invites?.length?d.invites.map(x=>'<div class="person"><span class="avatar">⚔️</span><span class="detail"><b>'+esc(x.from?.displayName||'صاحبك')+' بيتحداك!</b><small>WHO\'S THE STAR · '+esc(x.room)+'</small></span><a class="cta" href="/who-star/?join='+encodeURIComponent(x.room)+'">ادخل الغرفة ←</a></div>').join(''):none('مفيش دعوات مباريات حاليًا.');
}
function showMissions(d){const s=d.stats||{},dy=s.daily||{},earned=s.achievements||[],done=dy.bonus||[];
const tasks=[['FIRST_MATCH','🎮 العب مباراة',dy.matches||0,1,'40 XP'],['FIVE_CORRECT','🧠 5 إجابات صح',dy.correct||0,5,'40 XP'],['RANKED_WIN','🏆 فوز مصنف',dy.wins||0,1,'75 XP']];
$('dailyMissions').innerHTML=tasks.map(x=>'<div class="mission '+(done.includes(x[0])?'done':'')+'"><b>'+x[1]+'</b><p>'+(done.includes(x[0])?'✅ مكتملة':'التقدم '+Math.min(x[2],x[3])+' / '+x[3])+'</p><small>'+x[4]+'</small></div>').join('');
$('badges').innerHTML=BADGES.map(x=>'<div class="badge '+(earned.includes(x[0])?'on':'')+'"><span>'+x[1]+'</span><b>'+x[2]+'</b><small>'+(earned.includes(x[0])?'✓':'🔒')+'</small></div>').join('');
}
async function refresh(){try{const d=await api('dashboard');data=d;$('seasonName').textContent=d.season||'الجاري';showBoard(d);showMember(d);showMissions(d);$('notice').hidden=true}catch(e){$('notice').hidden=false;$('notice').textContent=e.message}}
async function action(type,target){if(busy)return;busy=true;try{if(type==='challenge'){const room=await star('create',{playType:'duo',mode:'mixed',rounds:10,seconds:20,difficulty:'adaptive',name:data?.profile?.displayName||'لاعب'});await api('invite',{target,room:room.room});try{localStorage.setItem('fr:starverse:v2:active',JSON.stringify({room:room.room,token:room.token}))}catch{}window.location.href='/who-star/';return}
 await api(type,{target});toast({request:'طلب الصداقة اتبعت',accept:'بقيتوا أصدقاء',decline:'تم رفض الطلب',remove:'تمت الإزالة'}[type]||'تم');await refresh()}catch(e){toast(e.message||'مشكلة مؤقتة')}finally{busy=false}}
async function search(){const q=$('searchName').value.trim();if(!/^[a-zA-Z0-9_]{2,20}$/.test(q))return toast('اكتب جزء من اسم المستخدم الإنجليزي');$('searchBtn').disabled=true;try{const r=await api('search',{query:q});const ids=new Set((data?.friends||[]).map(x=>x.id));$('searchResults').innerHTML=r.players?.length?r.players.map(x=>person(x,ids.has(x.id)?'<span class="muted">صديق ✓</span>':btn('request',x.id,'إضافة'))).join(''):none('لم نجد أسماء مطابقة')}catch(e){toast(e.message)}finally{$('searchBtn').disabled=false}}
document.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t)return tab(t.dataset.tab);const b=e.target.closest('[data-action]');if(b)action(b.dataset.action,b.dataset.target)});
$('searchBtn').addEventListener('click',search);$('searchName').addEventListener('keydown',e=>{if(e.key==='Enter')search()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});tab((['rank','friends','missions'].includes(new URLSearchParams(location.search).get('tab'))?new URLSearchParams(location.search).get('tab'):'rank'));refresh();setInterval(()=>{if(!document.hidden&&document.querySelector('#friends:not([hidden])'))refresh()},12000);
})();