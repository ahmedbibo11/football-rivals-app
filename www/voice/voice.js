/* FOOTBALL RIVALS 26: real WebRTC audio, opt-in. Audio never goes through Redis. */
(()=>{'use strict';
const $=id=>document.getElementById('frv-'+id),API='/api/rivals-social';
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const path=location.pathname,game=path.startsWith('/who-star')?'SV':path.startsWith('/ya-dobak')?'YA':path.startsWith('/hidden-xi')?'HX':path.startsWith('/cloud-v5')?'DW':path.startsWith('/rivals-cup')?'CUP':path.startsWith('/penalty')?'PK':'CLUB';
function currentGame(){let x=null;if(game==='SV')x=get('fr:starverse:v2:active')?.room;if(game==='YA')x=get('fr13-dobak')?.id;if(game==='HX')x=get('fr_hidden_xi_v1')?.id;if(game==='DW')x=get('FR_V5_ROOM_SESSION_V1')?.room;if(game==='CUP')x=new URLSearchParams(location.search).get('room')||localStorage.getItem('fr-fullcup-original-room');return x&&/^[A-HJ-NP-Z2-9]{6,12}$/i.test(x)?game+'-'+String(x).toUpperCase():''}
let user=null,room='',pc=null,stream=null,remote=null,timer=null,busy=false,muted=false,silent=false,last=0,ice=[],offering=false;
function note(v,err){$('status').textContent=v;$('status').classList.toggle('bad',!!err)}
async function api(op,b){let c=new AbortController(),to=setTimeout(()=>c.abort(),11000);try{let r=await fetch(API,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},cache:'no-store',signal:c.signal,body:JSON.stringify({op,...b})});let v=await r.json();if(!r.ok||!v.ok)throw Object.assign(new Error(v.error||'فشل الاتصال'),{code:v.code});return v}finally{clearTimeout(to)}}
function ui(){for(const id of ['mute','speaker','copy','leave'])$(id).hidden=!room;$('join').hidden=!!room;$('roomtext').textContent=room||'—';$('mute').textContent=muted?'🎙️ تشغيل المايك':'🔇 كتم المايك';$('speaker').textContent=silent?'🔈 تشغيل المنافس':'🔊 كتم المنافس';$('floating').classList.toggle('live',!!room&&!muted);$('floating').textContent=document.documentElement.lang==='en'?!room?'🎙️ Mic':muted?'🔇 Unmute':'🎤 Mute':!room?'🎙️ مايك':muted?'🔇 افتح المايك':'🎤 كتم المايك';$('floating').setAttribute('aria-pressed',String(!!room&&!muted))}
function clearPeer(){if(pc){pc.ontrack=null;pc.onicecandidate=null;pc.close();pc=null}ice=[];offering=false;if(remote){remote.remove();remote=null}}
function stopAll(){clearPeer();if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
async function leave(){let old=room;room='';last=0;clearInterval(timer);timer=null;stopAll();ui();note('المايك مقفول. يمكنك الاتصال مجددًا.');if(old)api('voiceLeave',{room:old}).catch(()=>{})}
async function signal(type,value){if(room)await api('voiceSignal',{room,type,value})}
function makePeer(){if(pc)return pc;let p=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]});pc=p;
 stream.getTracks().forEach(t=>p.addTrack(t,stream));p.onicecandidate=e=>{if(e.candidate)signal('candidate',e.candidate.toJSON()).catch(()=>{})};
 p.ontrack=e=>{if(!remote){remote=document.createElement('audio');remote.id='frv-remote';remote.autoplay=true;remote.playsInline=true;remote.hidden=true;document.body.appendChild(remote)}remote.srcObject=e.streams[0];remote.muted=silent;remote.play().catch(()=>note('اضغط تشغيل صوت المنافس'))};
 p.onconnectionstatechange=()=>{let st=p.connectionState;if(st==='connected')note('✅ متصل بالمنافس — صوت مباشر');else if(st==='failed')note('فشل الاتصال الصوتي؛ شبكة الموبايل قد تحتاج TURN',true);else if(st==='disconnected')note('فقدنا الاتصال مؤقتًا',true)};
 return p}
async function sendOffer(){if(offering||pc||!stream)return;offering=true;try{let p=makePeer(),d=await p.createOffer();await p.setLocalDescription(d);await signal('offer',{type:d.type,sdp:d.sdp});note('جاري توصيل المكالمة...')}catch(e){note(e.message,true)}finally{offering=false}}
async function flush(){if(!pc?.remoteDescription)return;for(const v of ice.splice(0)){try{await pc.addIceCandidate(v)}catch{}}}
async function process(e){if(!room||e.from===user.id)return;if(e.type==='bye'){clearPeer();note('المنافس خرج من المكالمة');return}
 if(e.type==='candidate'){if(pc?.remoteDescription)try{await pc.addIceCandidate(e.value)}catch{}else ice.push(e.value);return}
 if(e.type==='offer'){if(pc?.signalingState==='have-local-offer')clearPeer();let p=makePeer();await p.setRemoteDescription(e.value);await flush();let d=await p.createAnswer();await p.setLocalDescription(d);await signal('answer',{type:d.type,sdp:d.sdp});note('جاري تفعيل الصوت...')}
 if(e.type==='answer'&&pc?.signalingState==='have-local-offer'){await pc.setRemoteDescription(e.value);await flush()}}
async function poll(){if(!room||busy)return;busy=true;try{let a=await api('voicePoll',{room,since:last});if(a.members?.length===2&&a.members[0].id===user.id&&!pc)await sendOffer();if(a.members?.length<2)note('مستني صاحبك يدخل غرفة الصوت 🎧');for(const e of a.events||[]){last=Math.max(last,e.seq);try{await process(e)}catch(x){note('مشكلة في اتصال الصوت: '+x.message,true)}}}catch(e){if(['NOT_MEMBER','VOICE_EXPIRED'].includes(e.code))leave();else note('تأخر الاتصال بالإشارات: '+e.message,true)}finally{busy=false}}
async function join(){if(room||!user)return;let selected=currentGame()||$('code').value.trim().toUpperCase();if(selected)$('code').value=selected;if(selected&&!/^[A-Z0-9-]{5,55}$/.test(selected)){note('كود الصوت غير صحيح',true);return}try{
 if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)throw Error('المتصفح لا يدعم الميكروفون أو اتصال WebRTC');
 note('جارٍ طلب إذن الميكروفون...');stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});let a=await api('voiceOpen',{room:selected||undefined});room=a.room;$('code').value=room;muted=false;last=0;ui();note(a.peerCount===2?'المنافس موجود، بنوصل المكالمة':'المايك شغال، شارك نفس الكود مع صاحبك');timer=setInterval(poll,1800);poll();
 }catch(e){stopAll();room='';ui();$('panel').hidden=false;note('تعذر تشغيل المايك: '+e.message,true)}}
function toggleMute(){muted=!muted;stream?.getAudioTracks().forEach(x=>x.enabled=!muted);ui();note(muted?'الميكروفون مكتوم':'الميكروفون شغال')}
function speaker(){silent=!silent;if(remote)remote.muted=silent;ui()}
async function copy(){let link=location.origin+location.pathname+'?voice='+encodeURIComponent(room);try{await navigator.clipboard.writeText(link);note('✅ رابط غرفة الصوت اتنسخ')}catch{note('كود الصوت: '+room)}}
function build(){
 let css=document.createElement('link');css.rel='stylesheet';css.href='/voice/voice.css?v=26';document.head.appendChild(css);
 let wrap=document.createElement('div');wrap.id='fr-voice26';wrap.innerHTML=[
 '<div class="frv-primary"><button id="frv-floating" type="button" aria-label="تشغيل أو كتم المايك" aria-pressed="false">🎙️ مايك</button><button id="frv-settings" type="button" aria-label="إعدادات الصوت" aria-expanded="false">⚙</button></div>',
 '<aside id="frv-panel" hidden dir="rtl" aria-label="غرفة الصوت">',
 '<div class="frv-head"><div><small>FOOTBALL RIVALS</small><strong>🎙️ RIVALS VOICE</strong></div><button id="frv-close">✕</button></div>',
 '<p class="frv-explain">مايك مباشر بين لاعبين. مقفول لحد ما تطلب تشغيله بنفسك. الصوت لا يُسجل على السيرفر.</p>',
 '<label for="frv-code">كود غرفة الصوت</label><input id="frv-code" maxlength="55" placeholder="كود الغرفة أو اتركه فارغًا" dir="ltr">',
 '<p id="frv-status" role="status">المايك مقفول</p>',
 '<div class="frv-actions"><button id="frv-join">🎤 تشغيل / انضمام</button><button id="frv-leave" hidden>📴 خروج</button><button id="frv-mute" hidden>🔇 كتم</button><button id="frv-speaker" hidden>🔊 الصوت</button><button id="frv-copy" hidden>🔗 دعوة</button></div>',
 '<small class="frv-code">غرفة: <b id="frv-roomtext">—</b></small>',
 '<a id="frv-login" href="/account/" hidden>👤 سجّل دخول RIVALS ID أولًا</a>',
 '</aside>'].join('');
 document.body.appendChild(wrap);
 $('floating').onclick=()=>{if(!room&&!user){$('panel').hidden=false;$('settings').setAttribute('aria-expanded','true');return}if(room)toggleMute();else join()};$('settings').onclick=()=>{$('panel').hidden=!$('panel').hidden;$('settings').setAttribute('aria-expanded',String(!$('panel').hidden))};$('close').onclick=()=>{$('panel').hidden=true;$('settings').setAttribute('aria-expanded','false')};$('join').onclick=join;$('leave').onclick=leave;$('mute').onclick=toggleMute;$('speaker').onclick=speaker;$('copy').onclick=copy;
 let q=new URLSearchParams(location.search).get('voice'),auto=currentGame();$('code').value=q&&/^[A-Z0-9-]{5,55}$/i.test(q)?q.toUpperCase():auto;
 fetch('/api/rivals-account',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:'{"op":"session"}'}).then(r=>r.json()).then(j=>{if(j.authenticated){user=j.user;note('جاهز. المايك مقفول افتراضيًا.')}else{$('join').disabled=true;$('login').hidden=false;note('سجّل دخول RIVALS ID لاستخدام المايك')}}).catch(()=>note('تعذر التحقق من الحساب',true));ui();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&room)poll()});window.addEventListener('pagehide',()=>{clearInterval(timer);stopAll()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
