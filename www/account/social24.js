/* FOOTBALL RIVALS 24.0 · Player pictures, club badges, social and leagues */
(()=>{'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let me=null,clubs=[],friends={accepted:[],incoming:[],outgoing:[]},target=null,busy=false;
const social='/api/rivals-social',upload='/api/rivals-social';
async function api(op,body={},endpoint=social){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
 try{const res=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,...body}),signal:controller.signal,cache:'no-store'});
 const x=await res.json();if(!res.ok||!x.ok)throw new Error(x.error||'مشكلة في السيرفر');return x}
 finally{clearTimeout(timer)}}
function toast(txt,bad=false){const box=$('#toast');if(!box)return;box.textContent=txt;box.classList.toggle('error',bad);box.classList.remove('hidden');setTimeout(()=>box.classList.add('hidden'),4300)}
function asset(url,alt){return url?'<img src="'+esc(url)+'" alt="'+esc(alt)+'" loading="lazy">':''}
function imageAvatar(u){return u?.avatarMode==='club'&&u.clubLogoUrl?asset(u.clubLogoUrl,'شعار النادي'):u?.avatarMode==='photo'&&u.avatarUrl?asset(u.avatarUrl,'صورة اللاعب'):esc(u?.avatar||'⚽')}
function display(){if(!me)return;$('#s24Avatar').innerHTML=imageAvatar(me);
 $('#s24Display').textContent=me.displayName||me.username;$('#s24Club').textContent=me.favoriteTeam||'اختار ناديك';
 $('#s24Badge').innerHTML=(asset(me.clubLogoUrl,'شعار النادي')||'⚽')+' '+esc(me.favoriteTeam||'اختار ناديك');
 $('#s24ClubSelect').value=me.clubId||'';
 const main=$('#avatarPreview');if(main)main.innerHTML=imageAvatar(me);
 const chip=$('#teamChip');if(chip)chip.innerHTML=(asset(me.clubLogoUrl,'شعار النادي')||'⚽')+' '+esc(me.favoriteTeam||'اختار فريقك');
 for(const b of document.querySelectorAll('[data-mode]'))b.classList.toggle('s24-selected',b.dataset.mode===(me.avatarMode||'emoji'));
 window.dispatchEvent(new CustomEvent('rivals:profile24',{detail:me}));
}
function person(u,actions){return '<div class="s24-item"><div class="s24-pic">'+imageAvatar(u)+'</div><div class="s24-person"><b>'+esc(u.displayName)+'</b><small>@'+esc(u.username)+' · '+esc(u.favoriteTeam||'بدون نادي')+'</small></div><div class="s24-buttons">'+(actions||'')+'</div></div>'}
function listFriends(){const rows=friends;
 $('#s24IncomingCount').textContent=rows.incoming.length;$('#s24FriendsCount').textContent=rows.accepted.length;
 $('#s24Incoming').innerHTML=rows.incoming.length?rows.incoming.map(x=>person(x.user,'<button data-action="friendAccept" data-id="'+x.user.id+'">قبول</button><button class="s24-danger" data-action="friendDecline" data-id="'+x.user.id+'">رفض</button>')).join(''):'<div class="s24-empty">مفيش طلبات جديدة</div>';
 $('#s24Outgoing').innerHTML=rows.outgoing.length?rows.outgoing.map(x=>person(x.user,'<span class="s24-pending">في انتظار القبول</span>')).join(''):'<div class="s24-empty">مفيش طلبات مرسلة</div>';
 $('#s24Friends').innerHTML=rows.accepted.length?rows.accepted.map(x=>person(x.user,'<button data-action="challenge" data-id="'+x.user.id+'">⚔️ تحدّي</button><button data-action="viewRival" data-id="'+x.user.id+'">سجل مواجهاتكم</button><button data-action="friendRemove" data-id="'+x.user.id+'" class="s24-danger">×</button>')).join(''):'<div class="s24-empty">ابحث عن صاحبك وابعت له طلب صداقة</div>';
}
async function refresh(){if(!me)return;
 const outcomes=await Promise.allSettled([api('friends'),api('challenges'),api('leagues')]);
 if(outcomes[0].status==='fulfilled'){friends=outcomes[0].value;listFriends()}
 if(outcomes[1].status==='fulfilled'){const rows=outcomes[1].value.challenges;
 $('#s24Challenges').innerHTML='<div class="s24-empty">لا توجد دعوات ألعاب متاحة</div>';}
 if(outcomes[2].status==='fulfilled'){const rows=outcomes[2].value.leagues;
 $('#s24Leagues').innerHTML=rows.length?rows.map(l=>'<div class="s24-item"><span class="s24-league-icon">🏆</span><div class="s24-person"><b>'+esc(l.name)+'</b><small>كود الدعوة: '+esc(l.code)+'</small></div><div class="s24-buttons"><button data-action="leagueDetails" data-code="'+esc(l.code)+'">الترتيب</button><button data-action="copyCode" data-code="'+esc(l.code)+'">نسخ</button></div></div>').join(''):'<div class="s24-empty">ابدأ دوري جديد مع أصحابك</div>'}
}
async function session(){const j=await api('session',{},'/api/rivals-account');if(j.authenticated){me=j.user;display();await refresh()}}
async function chooseClub(){const clubId=$('#s24ClubSelect').value;if(!clubId)throw Error('اختار النادي من القائمة');const x=await api('club',{clubId});me.clubId=x.club.id;me.favoriteTeam=x.club.name;display();toast('✅ تم حفظ فريقك المفضل')}
async function mode(mode){const x=await api('avatarMode',{mode});me.avatarMode=x.mode;display();toast('✅ اتغيرت صورة البروفايل')}
async function canvasImage(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('مسموح JPG أو PNG أو WebP فقط');
 if(file.size>8*1024*1024)throw Error('الصورة الأصلية أكبر من 8 ميجا');
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas'),side=280;c.width=side;c.height=side;
 const ctx=c.getContext('2d'),scale=Math.max(side/img.width,side/img.height),w=img.width*scale,h=img.height*scale;
 ctx.drawImage(img,(side-w)/2,(side-h)/2,w,h);
 for(const q of [.82,.72,.60,.48,.35]){const value=c.toDataURL('image/webp',q);if(value.length<=100000)return value}
 throw Error('الصورة كبيرة حتى بعد الضغط؛ اختر صورة أصغر');
 }finally{URL.revokeObjectURL(url)}
}
async function uploadPic(file,kind){if(busy)return;busy=true;
 try{toast('جاري ضغط الصورة ورفعها...');const image=await canvasImage(file);const r=await api('upload',{kind,image},upload);
 if(kind==='avatar'){me.avatarUrl=r.url;me.avatarMode='photo'}else me.clubLogoUrl=r.url;
 display();toast('✅ الصورة محفوظة على السيرفر')}
 catch(e){toast(e.message,true)}finally{busy=false}}
async function action(a,b){
 if(a==='saveClub')return chooseClub();
 if(a==='refresh')return refresh();
 if(a==='removePhoto'||a==='removeLogo'){const kind=a==='removePhoto'?'avatar':'club';await api('upload',{action:'remove',kind},upload);
 if(kind==='avatar'){me.avatarUrl='';me.avatarMode='emoji'}else{me.clubLogoUrl='';if(me.avatarMode==='club')me.avatarMode='emoji'}display();return toast('تم حذف الصورة')}
 if(['friendAccept','friendDecline','friendRemove'].includes(a)){await api(a,{target:b.dataset.id});await refresh();return toast('✅ تم تحديث حالة الصداقة')}
 if(a==='challenge'){const r=await api('challenge',{target:b.dataset.id,game:'cup'});
 localStorage.setItem('fr-rivals-cup-active',r.challenge.room);location.href=r.url;return}
 if(a==='viewRival'){const user=friends.accepted.find(x=>x.user.id===b.dataset.id)?.user;
 if(!user)return;$('#searchPlayers').value=user.username;$('#searchBtn').click();
 return setTimeout(()=>document.querySelector('#searchResults [data-player="'+user.id+'"]')?.click(),400)}
 if(a==='leagueCreate'){const name=$('#s24LeagueName').value.trim();const r=await api('leagueCreate',{name});$('#s24LeagueName').value='';await refresh();return toast('🏆 دوري '+r.league.name+' اتعمل. الكود: '+r.league.code)}
 if(a==='leagueJoin'){const code=$('#s24LeagueCode').value.trim().toUpperCase(),r=await api('leagueJoin',{code});await refresh();return toast('✅ انضميت لدوري '+r.league.name)}
 if(a==='copyCode'){await navigator.clipboard.writeText(b.dataset.code);return toast('✅ كود الدوري اتنسخ')}
 if(a==='leagueDetails'){const data=await api('leagueDetails',{code:b.dataset.code});
 $('#s24Standings').innerHTML='<h3>🏆 '+esc(data.league.name)+' <small>'+esc(data.league.code)+'</small></h3><div class="s24-league-stats">'+data.standings.map((x,i)=>'<div><span class="s24-rank">'+(i+1)+'</span><span class="s24-league-name">'+esc(x.user.displayName)+'<small>'+esc(x.user.favoriteTeam||'')+'</small></span><b>'+x.points+' نقطة</b><small>'+x.played+' لعب · '+x.wins+' فوز</small></div>').join('')+'</div>';$('#s24Standings').scrollIntoView({behavior:'smooth',block:'nearest'});return}
}
async function init(){
 const fragment=await fetch('/account/social24-fragment.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('لا يمكن تحميل واجهة الأصدقاء');return r.text()});
 const root=document.createElement('section');root.id='social24';root.innerHTML=fragment;const rival=$('#rivalPanel .rival-top');if(rival){const ask=document.createElement('button');ask.type='button';ask.id='s24RivalRequest';ask.className='s24-primary';ask.textContent='➕ أضف صديق';ask.disabled=true;rival.appendChild(ask)}const dash=$('#dashboard');const cols=dash.querySelector('.columns');dash.insertBefore(root,cols);
 const clubResponse=await api('clubs');clubs=clubResponse.clubs;
 $('#s24ClubSelect').innerHTML='<option value="">اختار ناديك</option>'+clubs.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+' — '+esc(c.country)+'</option>').join('');
 root.addEventListener('click',async e=>{const b=e.target.closest('[data-s24],[data-mode],[data-action]');if(!b||busy)return;busy=true;
 try{if(b.dataset.mode)await mode(b.dataset.mode);else await action(b.dataset.s24||b.dataset.action,b)}
 catch(e){toast(e.message,true)}finally{busy=false}});
 $('#s24AvatarFile').addEventListener('change',e=>{const file=e.target.files[0];if(file)uploadPic(file,'avatar');e.target.value=''});
 $('#s24LogoFile').addEventListener('change',e=>{const file=e.target.files[0];if(file)uploadPic(file,'club');e.target.value=''});
 const sendRequest=async()=>{if(!target)return;try{await api('friendRequest',{target});await refresh();toast('✅ طلب الصداقة اتبعت')}catch(e){toast(e.message,true)}};
 $('#s24Request').addEventListener('click',sendRequest);$('#s24RivalRequest')?.addEventListener('click',sendRequest);
 $('#searchResults')?.addEventListener('click',e=>{const b=e.target.closest('[data-player]');if(!b)return;target=b.dataset.player;$('#s24Request').disabled=false;if($('#s24RivalRequest'))$('#s24RivalRequest').disabled=false});
 window.addEventListener('rivals:login',e=>{me=e.detail;display();refresh()});
 window.addEventListener('rivals:profile',e=>{me=e.detail;display()});
 window.addEventListener('rivals:logout',()=>{me=null;target=null});
 await session();
}
init().catch(e=>console.warn('RIVALS 24 social',e));
})();
