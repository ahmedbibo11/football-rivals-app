/* FOOTBALL RIVALS · Account + Rivalry System 22.0 */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const teams=['⚽ اختار فريقك','الأهلي المصري','الزمالك','بيراميدز','الإسماعيلي','المصري','الاتحاد السكندري','ريال مدريد','برشلونة','أتلتيكو مدريد','ليفربول','مانشستر سيتي','مانشستر يونايتد','أرسنال','تشيلسي','توتنهام','بايرن ميونخ','بوروسيا دورتموند','باريس سان جيرمان','مارسيليا','يوفنتوس','إنتر ميلان','ميلان','نابولي','روما','بنفيكا','بورتو','الهلال','النصر','الاتحاد السعودي','الرجاء','الوداد','منتخب مصر','منتخب المغرب','منتخب الجزائر','منتخب السعودية','منتخب الأرجنتين','منتخب البرازيل','منتخب فرنسا','منتخب إسبانيا','منتخب إنجلترا'];
const avatars=['⚽','🦁','🐐','🦅','🔥','👑','🏆','⭐'];
let user=null,stats=null,activeRival=null,chosenAvatar='⚽',busy=false,toastTimer=null;
function notify(s,error=false){const el=$('#toast');el.textContent=s;el.classList.toggle('error',error);el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),4000)}
async function api(op,body={}){const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),10000);try{
 const r=await fetch('/api/rivals-account',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},cache:'no-store',signal:ac.signal,body:JSON.stringify({op,...body})});
 const j=await r.json().catch(()=>({ok:false,error:'مشكلة في رد السيرفر'}));if(!r.ok||!j.ok)throw Object.assign(new Error(j.error||'حدث خطأ'),{code:j.code||'ERROR'});return j
 }finally{clearTimeout(timer)}}

async function run(btn,fn){if(busy)return;busy=true;if(btn)btn.disabled=true;try{await fn()}catch(e){notify(e.message||'حصلت مشكلة في الاتصال',true)}finally{busy=false;if(btn?.isConnected)btn.disabled=false}}
function teamOptions(sel){sel.innerHTML=teams.map((x,i)=>'<option value="'+(i?esc(x):'')+'">'+esc(x)+'</option>').join('')}
teamOptions($('#regTeam'));teamOptions($('#editTeam'));
const login=$('#loginForm'),register=$('#registerForm');
function mode(which){const isLogin=which==='login';login.classList.toggle('hidden',!isLogin);register.classList.toggle('hidden',isLogin);$('#showLogin').classList.toggle('active',isLogin);$('#showRegister').classList.toggle('active',!isLogin)}
$('#showLogin').addEventListener('click',()=>mode('login'));$('#showRegister').addEventListener('click',()=>mode('register'));
async function afterLogin(u){user=u;$('#authArea').classList.add('hidden');$('#dashboard').classList.remove('hidden');render();window.dispatchEvent(new CustomEvent('rivals:login',{detail:u}));await Promise.all([refreshStats(),refreshMatches()]);}
function showGuest(){user=null;$('#dashboard').classList.add('hidden');$('#authArea').classList.remove('hidden')}
login.addEventListener('submit',e=>{e.preventDefault();run(login.querySelector('button[type=submit]'),async()=>{const j=await api('login',{login:$('#loginId').value,password:$('#loginPassword').value});$('#loginPassword').value='';await afterLogin(j.user);notify('✅ رجعت للملعب يا '+j.user.displayName)})});
register.addEventListener('submit',e=>{e.preventDefault();run(register.querySelector('button[type=submit]'),async()=>{const j=await api('register',{username:$('#regUser').value,displayName:$('#regDisplay').value,email:$('#regEmail').value,password:$('#regPassword').value,favoriteTeam:$('#regTeam').value});$('#regPassword').value='';await afterLogin(j.user);notify('🎉 حسابك اتعمل بنجاح!')})});
$('#passwordForm').addEventListener('submit',e=>{e.preventDefault();run($('#passwordForm').querySelector('button'),async()=>{await api('changePassword',{oldPassword:$('#oldPassword').value,newPassword:$('#newPassword').value});$('#oldPassword').value='';$('#newPassword').value='';notify('✅ كلمة السر اتغيرت، وباقي الجلسات اتقفلت')})});
$('#logout').addEventListener('click',()=>run($('#logout'),async()=>{await api('logout');stats=null;showGuest();window.dispatchEvent(new Event('rivals:logout'));notify('اتعمل تسجيل خروج بأمان')}));
function render(){if(!user)return;$('#displayName').textContent=user.displayName;$('#username').textContent='@'+user.username;$('#teamChip').textContent='⚽ '+(user.favoriteTeam||'اختار فريقك المفضل');$('#avatarPreview').textContent=user.avatar||'⚽';
 $('#accountEmail').textContent=user.email||'—';$('#editDisplay').value=user.displayName;$('#bio').value=user.bio||'';const selected=user.favoriteTeam||'';
 $('#editTeam').value=teams.includes(selected)?selected:'';$('#customTeam').value=teams.includes(selected)?'':selected;
 chosenAvatar=user.avatar||'⚽';$('#avatarList').innerHTML=avatars.map(a=>'<button class="avatar-pick '+(a===chosenAvatar?'selected':'')+'" data-avatar="'+esc(a)+'" aria-label="اختيار '+esc(a)+'">'+a+'</button>').join('');
 const old=localStorage.getItem('fr-rivals-id20');if(old){try{const j=JSON.parse(old);$('#legacySection').classList.toggle('hidden',j?.id===user.legacyId||!j?.token)}catch{$('#legacySection').classList.add('hidden')}}else $('#legacySection').classList.add('hidden');
}
async function refreshStats(){/* Account and league remain independent of retired tournaments. */}
function oneMatch(m){
 const mine=m.players.findIndex(x=>x.id===user.id),other=m.players[1-mine]||{};
 const result=m.winner===-1?'تعادل':m.winner===mine?'فوز':'خسارة',kind=m.winner===-1?'draw':m.winner===mine?'win':'loss';
 return '<div class="match"><div class="match-head"><span>'+esc(m.game)+'</span><small>'+esc(other.name||'منافس')+'</small></div><span class="match-status '+kind+'">'+result+'</span><div class="match-meta">'+new Date(m.date).toLocaleDateString('ar-EG')+' · '+esc(String(m.score[0]))+' - '+esc(String(m.score[1]))+' · '+esc(m.id)+'</div></div>';
}
async function refreshMatches(){try{const j=await api('history');const visibleMatches=(j.matches||[]).filter(m=>!/draft|auction|\bcup\b|مزاد|مزايد/i.test(String(m.game||'')));$('#matchHistory').innerHTML=visibleMatches.length?visibleMatches.map(oneMatch).join(''):'<div class="empty">لسه مفيش مواجهات محفوظة بين حسابين. العب WHO’S THE STAR أو HIDDEN XI مع صاحبك وأنتم مسجلين.</div>'}catch(e){$('#matchHistory').innerHTML='<div class="empty">'+esc(e.message)+'</div>'}}
$('#reloadHistory').addEventListener('click',()=>run($('#reloadHistory'),async()=>{await refreshMatches();await refreshStats();notify('تم تحديث تاريخ المباريات')}));
$('#avatarList').addEventListener('click',e=>{const b=e.target.closest('[data-avatar]');if(!b)return;chosenAvatar=b.dataset.avatar;for(const x of $('#avatarList').querySelectorAll('button'))x.classList.toggle('selected',x.dataset.avatar===chosenAvatar)});
$('#saveProfile').addEventListener('click',()=>run($('#saveProfile'),async()=>{
 const selected=$('#customTeam').value.trim()||$('#editTeam').value;
 const j=await api('update',{displayName:$('#editDisplay').value,favoriteTeam:selected,bio:$('#bio').value,avatar:chosenAvatar});
 user=j.user;render();window.dispatchEvent(new CustomEvent('rivals:profile',{detail:user}));notify('✅ البروفايل اتحفظ بنجاح')}));
$('#editTeam').addEventListener('change',()=>{if($('#editTeam').value)$('#customTeam').value=''});
$('#searchBtn').addEventListener('click',search);$('#searchPlayers').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
async function search(){let q=$('#searchPlayers').value.trim();if(q.length<2)return notify('اكتب حرفين على الأقل من اسم المستخدم',true);
 return run($('#searchBtn'),async()=>{const r=await api('search',{query:q});const all=r.players.filter(p=>p.id!==user.id);
 $('#searchResults').innerHTML=all.length?all.map(p=>'<button class="search-result" data-player="'+esc(p.id)+'"><span><b>'+esc(p.displayName)+'</b><small> @'+esc(p.username)+' · '+esc(p.favoriteTeam||'بدون فريق')+'</small></span><span class="action">شوف تاريخكم ↗</span></button>').join(''):'<div class="empty">مفيش لاعب بالاسم ده لسه.</div>';
 }) }
$('#searchResults').addEventListener('click',e=>{const b=e.target.closest('[data-player]');if(b)openRival(b.dataset.player)});
async function openRival(id){activeRival=id;return run(null,async()=>{const r=await api('h2h',{opponent:id});$('#rivalPanel').classList.remove('hidden');$('#rivalName').textContent=r.rival.displayName+' (@'+r.rival.username+')';$('#rivalTeam').textContent=r.rival.favoriteTeam||'مفيش فريق مفضل';
 $('#h2hWins').textContent=r.record.wins;$('#h2hLosses').textContent=r.record.losses;$('#h2hDraws').textContent=r.record.draws;
 $('#rivalMatches').innerHTML=r.matches.length?r.matches.map(oneMatch).join(''):'<div class="empty">أول مواجهة بينكم لسه ما اتلعبتش!</div>';
 $('#rivalPanel').scrollIntoView({behavior:'smooth',block:'nearest'});})}
$('#closeRival').addEventListener('click',()=>$('#rivalPanel').classList.add('hidden'));
$('#linkOld').addEventListener('click',()=>run($('#linkOld'),async()=>{const old=JSON.parse(localStorage.getItem('fr-rivals-id20')||'{}');if(!old.id||!old.token)throw new Error('مش لاقي هوية قديمة على الجهاز');
 if(!window.confirm('تربط تقدم RIVALS ID القديم بالحساب ده؟'))return;
 const r=await api('linkLegacy',{legacyId:old.id,legacyToken:old.token});
 user=r.user;render();await refreshStats();notify('✅ تم نقل هويتك القديمة بنجاح')}));
window.addEventListener('rivals:profile24',e=>{if(!user)return;user={...user,...e.detail};const team=user.favoriteTeam||'';const selector=$('#editTeam');if(selector){const option=[...selector.options].find(x=>x.value===team);selector.value=option?team:'';$('#customTeam').value=option?'':team}});
api('session').then(async x=>{if(x.authenticated)await afterLogin(x.user);else showGuest()}).catch(showGuest).finally(()=>window.dispatchEvent(new Event('fr41:account-ready')));
})();
