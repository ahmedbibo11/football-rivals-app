/* FOOTBALL RIVALS FR46 — confirmed leave/cancel, shared by every live game. */
(()=>{'use strict';
 if(window.FR46RoomExit)return;
 const route=location.pathname.toLowerCase();
 const config=route.startsWith('/who-star/')?
  {store:'fr:starverse:v2:active',api:'/api/rivals-core',kind:'star'}:
  route.startsWith('/hidden-xi/')?
  {store:'fr_hidden_xi_v1',api:'/api/hidden-xi',kind:'xi'}:
  route.startsWith('/ya-dobak/')?
  {store:'fr13-dobak',api:'/api/ya-dobak',kind:'dobak'}:null;
 if(!config)return;
 const library='/?view=games';
 let dialog,trigger,confirmBtn,cancelBtn,bodyText,titleText,errorText,requesting=false,notified=false;
 const isEN=()=>document.documentElement.lang==='en';
 function session(){
  try{
   const data=JSON.parse(localStorage.getItem(config.store)||'null');
   const id=config.kind==='star'?data?.room:data?.id;
   if(typeof id==='string'&&typeof data?.token==='string'&&id.length>=7&&data.token.length>=20)return {id,token:data.token};
  }catch{}
  return null;
 }
 function clearLocal(){try{localStorage.removeItem(config.store)}catch{}}
 function go(){location.assign(library)}
 function open(){
  if(!dialog)return;
  dialog.hidden=false;
  dialog.classList.add('fr46-open');
  (cancelBtn.hidden?confirmBtn:cancelBtn).focus();
 }
 function close(){if(!dialog||requesting||notified)return;dialog.hidden=true;dialog.classList.remove('fr46-open');trigger?.focus()}
 function localize(){
  const en=isEN(),active=!!session();
  if(trigger){trigger.textContent=en?(active?'✕ End match':'↩ Games library'):(active?'✕ إنهاء المباراة':'↩ مكتبة الألعاب');trigger.setAttribute('aria-label',en?'End match and leave':'إنهاء المباراة والخروج')}
  if(dialog&& !notified){
   titleText.textContent=en?'End this match?':'إنهاء المباراة والخروج؟';
   bodyText.textContent=en?'The match will be cancelled for both players. Your opponent will be notified. You can start a new match any time.':'هيتم إلغاء المباراة للطرفين وإبلاغ المنافس. تقدر تبدأ مباراة جديدة في أي وقت، من غير ما تستنى نهاية الجولات.';
   confirmBtn.textContent=en?'Confirm and exit':'تأكيد الإنهاء والخروج';
   cancelBtn.textContent=en?'Keep playing':'كمّل اللعب';
  }
 }
 function ask(){
  if(requesting||notified)return;
  if(!session()){clearLocal();return go()}
  errorText.textContent='';cancelBtn.hidden=false;confirmBtn.hidden=false;
  localize();open();
 }
 async function commit(){
  if(requesting)return;
  const current=session();
  if(!current){clearLocal();go();return}
  requesting=true;confirmBtn.disabled=true;cancelBtn.disabled=true;
  errorText.textContent='';
  const en=isEN();
  confirmBtn.textContent=en?'Cancelling…':'جاري إلغاء المباراة…';
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),11000);
  try{
   const payload=config.kind==='star'?{op:'svCancel',room:current.id,token:current.token}:{op:'cancel',id:current.id,token:current.token};
   const res=await fetch(config.api,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ctrl.signal});
   const data=await res.json().catch(()=>({ok:false,code:'BAD_RESPONSE'}));
   if(!res.ok||!data.ok){
    if(res.status===404||res.status===403||['MISSING','ROOM_NOT_FOUND','NO_ACCESS','BAD_AUTH','NOT_PLAYER'].includes(data.code)){clearLocal();go();return}
    throw new Error(data.error||(en?'Could not cancel the match':'تعذر إلغاء المباراة'));
   }
   if(data.stage!=='cancelled'&&data.stage!=='finished')throw new Error(en?'The server did not confirm cancellation':'السيرفر لم يؤكد إلغاء المباراة');
   clearLocal();go();
  }catch(e){
   if(e.name==='AbortError')errorText.textContent=en?'Connection timed out. Please retry.':'الاتصال بالسيرفر اتأخر. جرّب مرة تانية.';
   else errorText.textContent=e.message||(en?'Please try again.':'حاول مرة تانية.');
  }finally{
   clearTimeout(timer);requesting=false;confirmBtn.disabled=false;cancelBtn.disabled=false;localize();
  }
 }
 function notifiedCancel(data){
  if(notified||requesting||!data||data.stage!=='cancelled')return;
  notified=true;clearLocal();
  if(trigger)trigger.hidden=true;
  if(!dialog)mount();
  const en=isEN(),who=data.cancelReason;
  titleText.textContent=en?'Match cancelled':'المباراة اتلغت';
  bodyText.textContent=en?(who==='host_cancelled'?'The host ended this match for everyone.':who==='player_left'?'A player left, so this match has ended.':'This match was cancelled.'):who==='host_cancelled'?'صاحب الغرفة ألغى المباراة للجميع.':who==='player_left'?'أحد اللاعبين خرج، فتم إلغاء المباراة.':'تم إلغاء المباراة.';
  errorText.textContent='';cancelBtn.hidden=true;confirmBtn.hidden=false;
  confirmBtn.textContent=en?'Back to games':'العودة لمكتبة الألعاب';
  open();
 }
 function mount(){
  if(dialog)return;
  dialog=document.createElement('div');
  dialog.id='fr46-exit-overlay';dialog.className='fr46-exit-overlay';dialog.hidden=true;
  dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-labelledby','fr46-exit-title');
  const panel=document.createElement('section');panel.className='fr46-exit-panel';
  const emblem=document.createElement('div');emblem.className='fr46-exit-emblem';emblem.textContent='⚑';
  titleText=document.createElement('h2');titleText.id='fr46-exit-title';
  bodyText=document.createElement('p');
  errorText=document.createElement('p');errorText.className='fr46-exit-error';errorText.setAttribute('role','alert');errorText.setAttribute('aria-live','assertive');
  const row=document.createElement('div');row.className='fr46-exit-actions';
  confirmBtn=document.createElement('button');confirmBtn.type='button';confirmBtn.className='fr46-exit-confirm';confirmBtn.addEventListener('click',()=>notified?go():commit());
  cancelBtn=document.createElement('button');cancelBtn.type='button';cancelBtn.className='fr46-exit-keep';cancelBtn.addEventListener('click',close);
  row.append(cancelBtn,confirmBtn);panel.append(emblem,titleText,bodyText,errorText,row);dialog.append(panel);document.body.append(dialog);
  dialog.addEventListener('click',e=>{if(e.target===dialog&&!notified)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden&&!notified){e.preventDefault();close()}});
  document.body.classList.add('fr46-game');
  trigger=document.createElement('button');trigger.type='button';trigger.className='fr46-exit-fab';
  trigger.id='fr46-exit-btn';trigger.addEventListener('click',ask);document.body.append(trigger);
  localize();
 }
 window.FR46RoomExit={ask,notifiedCancel,go};
 window.addEventListener('fr46:room-cancelled',e=>notifiedCancel(e.detail));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 setInterval(()=>{if(dialog&&dialog.hidden&&!notified)localize()},1450);
 new MutationObserver(()=>{if(dialog&&dialog.hidden)localize()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
