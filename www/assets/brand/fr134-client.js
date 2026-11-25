/* FR134: one room-authenticated microphone and account sync for all active games. */
(()=>{'use strict';
const fetch0=window.fetch.bind(window),API='/api/fr95-voice',QUEUE='fr:career:fr134:pending';
const endpoints={'/api/auction-five':'five','/api/auction-ultimate':'ultimate','/api/auction-first-pick':'firstpick','/api/hidden-xi':'hidden','/api/ya-dobak':'dobak','/api/rivals-core':'star'};
let context=null,viewer=null,lastAccountCheck=0,lastAttempt={},sending=false;
const fr138Tracked=new Set(),fr138Saved=new Set(),fr138Attempt={};
const read=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||fallback}catch{return fallback}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
async function account(){
 lastAccountCheck=Date.now();try{const r=await fetch0('/api/rivals-account',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:'{"op":"session"}',cache:'no-store'}),j=await r.json();viewer=j.authenticated&&j.user?.id?String(j.user.id):null}catch{viewer=null}if(viewer&&context)fr138Track(context);return viewer;
}
async function post(data){const r=await fetch0(API,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const j=await r.json().catch(()=>({ok:false,code:'NETWORK_ERROR'}));if(!r.ok||!j.ok)throw Object.assign(new Error(j.code||'NETWORK_ERROR'),{code:j.code,status:r.status});return j}
function fr138Track(c){
 if(!viewer||!c?.token||['cancelled','forfeit'].includes(c.stage))return;
 const owner=viewer,key=owner+':'+c.kind+':'+c.code;
 if(fr138Tracked.has(key)||Date.now()-(fr138Attempt[key]||0)<15000)return;
 fr138Attempt[key]=Date.now();
 post({op:'track',kind:c.kind,code:c.code,token:c.token,owner}).then(()=>fr138Tracked.add(key)).catch(e=>{if(e.code==='ACCOUNT_CHANGED')account()});
}
function enqueue(c){
 if(!viewer)return;
 const q=read(QUEUE,[]),key=c.kind+':'+c.code+':'+viewer;
 if(fr138Saved.has(key))return;
 if(!q.some(x=>x.key===key)){q.push({key,owner:viewer,kind:c.kind,code:c.code,token:c.token,at:Date.now()});write(QUEUE,q.slice(-50))}
 syncQueue();
}
async function syncQueue(){
 if(sending)return;sending=true;
 try{
  if(!viewer||Date.now()-lastAccountCheck>60000)await account();
  if(!viewer)return;
  const q=read(QUEUE,[]),kept=[];let saved=0;
  for(const item of q){
   if(item.owner!==viewer||Date.now()-Number(item.at)>31*86400000){if(item.owner!==viewer&&Date.now()-Number(item.at)<31*86400000)kept.push(item);continue}
   if(Date.now()-(lastAttempt[item.key]||0)<12000){kept.push(item);continue}
   lastAttempt[item.key]=Date.now();
   try{await post({op:'commit',kind:item.kind,code:item.code,token:item.token,owner:item.owner});fr138Saved.add(item.key);saved++}
   catch(e){if(!['ROOM_NOT_FOUND','INVALID_ROOM_TOKEN','ROOM_ALREADY_LINKED','INVALID_ROOM','BAD_SCORE','MATCH_CANCELLED'].includes(e.code))kept.push(item);if(e.code==='ACCOUNT_CHANGED')account()}
  }
  const later=read(QUEUE,[]).filter(x=>!q.some(y=>y.key===x.key));write(QUEUE,[...kept,...later].slice(-50));if(saved)window.dispatchEvent(new CustomEvent('fr134:career-synced'));
 }finally{sending=false}
}
function observe(kind,b,j){
 if(!j?.ok)return;
 const room=j.room&&typeof j.room==='object'?j.room:j;
 const code=String(room.code||room.id||j.id||(typeof j.room==='string'?j.room:'')||b.code||b.id||b.room||'').toUpperCase();
 const token=String(j.token||b.token||'');
 if(!code||!token)return;
 const stage=room.stage||j.stage||'',mode=String(room.kind||room.type||room.mode||j.mode||'').toLowerCase();
 const next={kind,code,token,stage,human:!j.solo&&mode!=='ai'&&mode!=='bot'};
 if(context&&(context.code!==code||context.kind!==kind||context.token!==token))stopVoice();
 context=next;
 if(stage==='cancelled'||stage==='forfeit')stopVoice();
 fr138Track(next);
 const candidate=kind==='star'?stage==='finished':kind==='hidden'?['match','finished'].includes(stage):kind==='dobak'?['live','finished'].includes(stage):!!room.match&&['match','done','finished','result'].includes(stage);
 if(candidate){
  if(viewer)enqueue(next);else if(Date.now()-lastAccountCheck>15000)account().then(()=>{if(viewer)enqueue(next)});
 }
 scheduleUI();
}
window.fetch=function(input,init){
 let url='';try{const parsed=new URL(typeof input==='string'?input:input.url,location.href);if(parsed.origin===location.origin)url=parsed.pathname}catch{}
 const kind=endpoints[url];
 if(kind&&typeof init?.body==='string'){try{const b=JSON.parse(init.body);if((['create','svCreate'].includes(b.op)||b.op==='options'&&(kind==='hidden'||kind==='firstpick'))&&typeof b.includeWomen!=='boolean'){let includeWomen=true;try{includeWomen=localStorage.getItem('fr:cards:includeWomen:v1')!=='false'}catch{}init={...init,body:JSON.stringify({...b,includeWomen})}}}catch{}}
 const promise=fetch0(input,init);
 if(kind){let b={};try{b=JSON.parse(init?.body||'{}')}catch{};
  if(kind!=='star'||/^sv[A-Z]/.test(String(b.op||'')))promise.then(r=>{if(r.ok)r.clone().json().then(j=>observe(kind,b,j)).catch(()=>{})}).catch(()=>{});
 }
 return promise;
};
let stream=null,pc=null,audio=null,timer=null,active=false,voiceContext=null,side=-1,busy=false,offering=false,seen=new Set(),candidates=[],hadPeer=false,uiPending=false,status='المايك مقفول';
function statusText(s){status=s;const el=document.getElementById('fr134-voice-status');if(el&&el.textContent!==s)el.textContent=s;const old=document.getElementById('fr95-voice');if(old)old.title=s;updateButton()}
function updateButton(){
 for(const b of document.querySelectorAll('#fr134-mic,#fr95-voice')){
  const label=active?'🎙️ اقفل المايك':'🎙️ شغّل المايك';if(b.textContent!==label)b.textContent=label;b.setAttribute('aria-pressed',String(active));b.classList.toggle('fr134-mic-on',active);
 }
}
function gameTarget(){
 if(!context||!context.human||['cancelled','forfeit'].includes(context.stage))return null;
 if(context.kind==='firstpick')return null;
 if(context.kind==='five'||context.kind==='ultimate'){
  const code=new URLSearchParams(location.search).get('room');if(!code||code.toUpperCase()!==context.code)return null;
  return document.getElementById(context.kind==='five'?'app':'ux-app');
 }
 return document.body;
}
function refreshUI(){
 uiPending=false;
 if(context?.kind==='firstpick'){
  const b=document.getElementById('fr95-voice'),match=document.getElementById('fr101-match');
  if(b&&!document.getElementById('fr134-voice-status')){const n=document.createElement('span');n.id='fr134-voice-status';n.setAttribute('role','status');n.textContent=status;b.parentNode.appendChild(n)}
  if(!b&&match&&context.human&&!document.getElementById('fr-voice26')){const wrap=document.createElement('div');wrap.id='fr-voice26';wrap.className='fr134-room-mic';const mic=document.createElement('button');mic.id='fr134-mic';mic.type='button';const note=document.createElement('span');note.id='fr134-voice-status';note.setAttribute('role','status');note.textContent=status;wrap.append(mic,note);match.insertBefore(wrap,match.firstChild)}
  updateButton();return;
 }
 const target=gameTarget(),existing=document.getElementById('fr-voice26');
 if(!target){if(existing&&context?.kind!=='firstpick')existing.remove();updateButton();return}
 if(existing){updateButton();return}
 const wrap=document.createElement('div');wrap.id='fr-voice26';wrap.className='fr134-room-mic';
 const button=document.createElement('button');button.id='fr134-mic';button.type='button';button.setAttribute('aria-label','تشغيل أو إغلاق مايك المباراة');
 const label=document.createElement('span');label.id='fr134-voice-status';label.setAttribute('role','status');label.textContent=status;
 wrap.append(button,label);
 if(context.kind==='five'||context.kind==='ultimate')target.insertBefore(wrap,target.firstChild);else document.body.appendChild(wrap);
 updateButton();window.FR57RoomControls?.refresh?.();
}
function scheduleUI(){if(uiPending)return;uiPending=true;requestAnimationFrame(refreshUI)}
function resetPeer(){if(pc){pc.ontrack=null;pc.onicecandidate=null;pc.onconnectionstatechange=null;pc.close();pc=null}if(audio){audio.remove();audio=null}candidates=[];offering=false}
function stopVoice(){
 const old=voiceContext;active=false;voiceContext=null;side=-1;clearInterval(timer);timer=null;resetPeer();if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}seen.clear();hadPeer=false;statusText('المايك مقفول');
 if(old)post({op:'voice-leave',...old}).catch(()=>{});
}
async function signal(type,value){if(!active||!voiceContext)return;await post({op:'voice-push',...voiceContext,type,value})}
function peer(){
 if(pc)return pc;
 const p=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]});pc=p;
 stream.getTracks().forEach(t=>p.addTrack(t,stream));
 p.onicecandidate=e=>{if(e.candidate)signal('ice',e.candidate.toJSON()).catch(()=>{})};
 p.ontrack=e=>{
  if(!audio){audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.hidden=true;document.body.appendChild(audio)}
  audio.srcObject=e.streams[0];audio.play().catch(()=>statusText('اضغط على الصفحة لتشغيل صوت المنافس'));
 };
 p.onconnectionstatechange=()=>{if(p.connectionState==='connected')statusText('متصل بالمنافس');else if(p.connectionState==='failed')statusText('تعذر الاتصال الصوتي على هذه الشبكة');else if(p.connectionState==='disconnected')statusText('انقطع الاتصال مؤقتًا')};
 return p;
}
async function offer(){
 if(!active||side!==0||pc||offering)return;offering=true;
 try{const p=peer(),desc=await p.createOffer();await p.setLocalDescription(desc);await signal('offer',{type:desc.type,sdp:desc.sdp});statusText('جاري توصيل الصوت...')}catch{resetPeer();statusText('تعذر بدء الاتصال الصوتي')}finally{offering=false}
}
async function flush(){if(!pc?.remoteDescription)return;for(const x of candidates.splice(0))try{await pc.addIceCandidate(x)}catch{}}
async function process(message){
 if(!active||seen.has(message.id))return;seen.add(message.id);if(seen.size>300)seen=new Set([...seen].slice(-100));
 if(message.type==='hello'){if(side===0){resetPeer();await offer()}return}
 if(message.type==='bye'){resetPeer();hadPeer=false;statusText('مستني صاحبك يشغّل المايك');return}
 if(message.type==='ice'){if(pc?.remoteDescription){try{await pc.addIceCandidate(message.value)}catch{}}else candidates.push(message.value);return}
 if(message.type==='offer'&&side===1){const pending=candidates.slice();resetPeer();candidates=pending;const p=peer();await p.setRemoteDescription(message.value);await flush();const d=await p.createAnswer();await p.setLocalDescription(d);await signal('answer',{type:d.type,sdp:d.sdp});statusText('جاري توصيل الصوت...');return}
 if(message.type==='answer'&&side===0&&pc?.signalingState==='have-local-offer'){await pc.setRemoteDescription(message.value);await flush()}
}
async function poll(){
 if(!active||busy||!voiceContext)return;busy=true;
 try{const j=await post({op:'voice-pull',...voiceContext});if(!active)return;
  if(!j.peer&&hadPeer){resetPeer();statusText('مستني صاحبك يشغّل المايك')}
  hadPeer=!!j.peer;
  for(const m of j.messages||[])try{await process(m)}catch{statusText('مشكلة في توصيل الصوت')}
  if(j.peer&&side===0&&!pc)await offer();
 }catch(e){if(['ROOM_NOT_FOUND','INVALID_ROOM_TOKEN','ROOM_ENDED','VOICE_HUMAN_ONLY'].includes(e.code))stopVoice();else statusText('جاري إعادة الاتصال بالصوت...')}finally{busy=false}
}
async function startVoice(){
 if(active)return;
 if(!context){statusText('ادخل غرفة اللعب الأول');return}
 if(!context.human){statusText('المايك متاح عند اللعب مع شخص');return}
 if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){statusText('المتصفح لا يدعم المايك');return}
 const c={kind:context.kind,code:context.code,token:context.token};
 try{
  statusText('جارٍ طلب إذن المايك...');
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  const j=await post({op:'voice-open',...c});
  if(!context||context.code!==c.code||context.token!==c.token){stream.getTracks().forEach(t=>t.stop());stream=null;return}
  voiceContext=c;side=j.side;active=true;hadPeer=!!j.peer;statusText(j.peer?'جاري توصيل الصوت...':'مستني صاحبك يشغّل المايك');
  timer=setInterval(poll,1800);poll();
 }catch(e){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;statusText(e.code==='VOICE_HUMAN_ONLY'?'المايك متاح عند اللعب مع شخص':e.name==='NotAllowedError'?'اسمح للمتصفح باستخدام المايك':'تعذر تشغيل المايك')}
}
function click(e){const button=e.target.closest?.('#fr134-mic,#fr95-voice');if(!button)return;e.preventDefault();if(active)stopVoice();else startVoice()}
function init(){
 document.addEventListener('click',click,true);
 new MutationObserver(scheduleUI).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(active)poll();syncQueue();scheduleUI()}});
 window.addEventListener('pagehide',()=>{if(active)stopVoice();else{clearInterval(timer);resetPeer();if(stream)stream.getTracks().forEach(t=>t.stop())}});
 account().then(syncQueue);setInterval(syncQueue,25000);scheduleUI();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

