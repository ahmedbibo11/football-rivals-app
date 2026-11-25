/* YA DOBAK — STAT WARS · FOOTBALL RIVALS 13.0 */
(()=>{'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STATS=['السرعة','التسديد','التمرير','المراوغة','الدفاع','القوة البدنية'];
const order=['trash','medium','premium','legendary'],TAGS={trash:'TRASH',medium:'MEDIUM',premium:'PREMIUM',legendary:'LEGENDARY'};
let auth=null,game=null,clockOffset=0,renderKey='',busy=false,lastPoll=0,selected='medium',boost=0,lastPurchase=null,online=false;
try{auth=JSON.parse(localStorage.getItem('fr13-dobak')||'null')}catch{}
const url=new URLSearchParams(location.search),invite=url.get('room');
if(invite&&auth&&String(auth.id||'').toUpperCase()!==String(invite).trim().toUpperCase())auth=null;
function toast(message,bad=false){const el=$('#toast');el.textContent=message;el.style.borderColor=bad?'#ff7d7d':'#81f5ca';el.classList.remove('hidden');clearTimeout(toast.id);toast.id=setTimeout(()=>el.classList.add('hidden'),3000)}
function save(){if(auth)localStorage.setItem('fr13-dobak',JSON.stringify(auth));else localStorage.removeItem('fr13-dobak')}
function visible(){const active=!!auth;$('#entry').classList.toggle('hidden',active);$('#arena').classList.toggle('hidden',!active);if(active)$('#matchRoom').textContent=auth.id;const root=$('#fr127-root');if(root)root.hidden=active}
async function req(op,params={}){
 const r=await fetch('/api/ya-dobak',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({op,id:auth?.id,token:auth?.token,...params,...(['create','join'].includes(op)?{club:window.FR127Choice?.club||'real',mode:window.FR127Choice?.mode||'pvp',difficulty:window.FR127Choice?.difficulty||'medium'}:{})})});
 const d=await r.json().catch(()=>({ok:false,code:'BAD_RESPONSE'}));if(!r.ok||d.ok===false)throw Object.assign(new Error(d.error||d.code||'فشل اتصال'),{code:d.code||'UNKNOWN',status:r.status});return d
}
function profile(){if(!game)return;
 for(let i=0;i<2;i++){const box=$('#fr127-crest'+i),club=game.players[i]?.club,id=Number(club?.crest)||0;if(box&&box.dataset.crest!==String(club?.id||id)){box.dataset.crest=String(club?.id||id);box.textContent=i?'🔵':'🟢';if(club?.id==='alahly'||(id>0&&id<999)){const image=document.createElement('img');image.src=club?.id==='alahly'?'/assets/clubs/al-ahly.png':'https://crests.football-data.org/'+id+'.png';image.alt=club.ar||'شعار النادي';box.textContent='';box.append(image)}}}
 $('#p0name').textContent=game.players[0]?.name||'HOST';$('#p1name').textContent=game.players[1]?.name||'CHALLENGER';
 $('#p0coins').textContent=game.players[0]?.coins??0;$('#p1coins').textContent=game.players[1]?.coins??0;
 $('#scoreProgress').textContent=game.stage==='finished'?'FULL TIME':game.stage==='shop'?'TRANSFER MARKET':'ROUND '+(game.round+1)+' / '+game.rounds;
 $('#progressDots').innerHTML=Array.from({length:7},(_,i)=>'<i class="'+(i<=game.round?'on':'')+'"></i>').join('');
 const squad=$('#squads');
 const signature=game.players.map(p=>p?.roster.map(c=>c.id).join('|')||'').join(':');
 if(squad.dataset.signature!==signature){
  squad.dataset.signature=signature;
  squad.innerHTML=game.players.map((p,i)=>'<div class="squad-col"><h4>'+esc(p?.name||'بانتظار المنافس')+' <b>'+(p?.roster.length||0)+'/11</b></h4><div class="roster-list">'+(p?.roster.map(c=>'<span data-fr127-sprite="'+esc(JSON.stringify(c.sprite||null))+'" class="'+(c.kind==='mystery'?'mystery':'')+'">'+esc(c.slot)+' · '+esc(c.name)+' '+c.ovr+'</span>').join('')||'<span>في انتظار أول كارت</span>')+'</div></div>').join('');
 }
}
function sprite(c,hidden=false,maskOverall=false){
 if(!c)return'<div class="card-frame no-sprite"><span class="fallback">🎴</span></div>';
 const s=c.sprite;let body;
 if(s&&/^[a-z0-9_./-]+\.webp$/i.test(s.file)&&s.cols>=1&&s.rows>=1){
  const x=s.cols===1?50:100*s.col/Math.max(1,s.cols-1),y=s.rows===1?50:100*s.row/Math.max(1,s.rows-1);
  body='<div class="sprite" style="background-image:url(/cloud-v5/'+esc(s.file)+');background-size:'+(s.cols===1&&s.rows===1?'contain':(s.cols*100)+'% '+(s.rows*100)+'%')+';background-repeat:no-repeat;background-position:'+x+'% '+y+'%"></div>'
 }else body='<div class="fallback">⚽</div>';
 return '<div class="card-frame '+(hidden?'hidden-stat':'')+(maskOverall?' mask-ovr':'')+(s?'':' no-sprite')+'">'+body+
 (hidden?'<div class="privacy">🔒 الإحصائية مخفية<br>خمّن قبل الكشف!</div>':'<div class="player-name">'+esc(c.name)+'</div>')+'</div>'
}
function mysteryPortrait(c){
 const a=c?.sprite;
 if(!a||!/^[a-z0-9_./-]+\.webp$/i.test(a.file)||!a.cols||!a.rows)return '<div class="fr142-portrait fallback-portrait">⚽</div>';
 // Crop just the subject's torso/face from the central part of its original FUT
 // sprite tile, WITHOUT exposing upper-left OVR or bottom six stats. The
 // backing sprite artwork is never altered and appears whole at reveal.
 const zoom=2.55,fx=.53,fy=.43;
 const sx=(zoom*(a.col+fx)-.5)/(a.cols*zoom-1)*100;
 const sy=(zoom*(a.row+fy)-.5)/(a.rows*zoom-1)*100;
 return '<div class="fr142-portrait"><div class="fr142-face" style="background-image:url(/cloud-v5/'+esc(a.file)+');background-size:'+(a.cols*zoom*100)+'% '+(a.rows*zoom*100)+'%;background-position:'+sx+'% '+sy+'%"></div><div class="fr142-portrait-shine"></div></div>'
}
function portraitCard(c){
 if(!c)return '<div class="fr15-portrait-card"><div class="fr15-portrait-fallback">⚽</div></div>';
 const s=c.sprite;
 let body='<div class="fr15-portrait-fallback">⚽</div>';
 if(s&&/^[a-z0-9_./-]+\.webp$/i.test(s.file)&&s.cols>=1&&s.rows>=1){
  const x=s.cols===1?50:100*s.col/Math.max(1,s.cols-1),y=s.rows===1?50:100*s.row/Math.max(1,s.rows-1);
  body='<div class="sprite fr15-portrait-art" style="background-image:url(/cloud-v5/'+esc(s.file)+');background-size:'+(s.cols===1&&s.rows===1?'contain':(s.cols*100)+'% '+(s.rows*100)+'%')+';background-repeat:no-repeat;background-position:'+x+'% '+y+'%"></div>';
 }
 return '<div class="fr15-portrait-card" role="img" aria-label="صورة اللاعب '+esc(c.name)+'، بدون أرقام التقييم أو الإحصائيات">'+
 '<div class="fr15-portrait-badge">🔒 SECRET STAT</div><div class="fr15-portrait-photo">'+body+'</div>'+
 '<div class="fr15-portrait-cut"></div><div class="fr15-portrait-details"><span class="fr15-portrait-marker">⚽ FUT PLAYER</span>'+
 '<strong>'+esc(c.name)+'</strong><span class="fr15-portrait-role">'+esc(c.pos)+' · '+esc(c.edition||'FIFA FUT')+'</span>'+
 '</div><div class="fr15-portrait-corner">✦</div></div>'
}
const FR_SPECIAL_STAT_MASKS={"fr-vol2-051":[[39.82,72.65,7.5,2.8],[39.82,77.31,7.5,2.8],[39.82,81.83,7.5,2.8],[70.18,72.61,7.5,2.8],[70.18,77.28,7.5,2.8],[70.18,81.79,7.5,2.8]],"fr-vol2-052":[[39.91,72.38,7.5,2.8],[39.91,77.0,7.5,2.8],[39.91,81.52,7.5,2.8],[70.45,72.34,7.5,2.8],[70.45,77.0,7.5,2.8],[70.45,81.56,7.5,2.8]],"fr-vol2-053":[[41.18,72.45,7.5,2.8],[41.18,77.29,7.5,2.8],[41.18,82.14,7.5,2.8],[73.46,72.48,7.5,2.8],[73.46,77.33,7.5,2.8],[73.46,82.14,7.5,2.8]],"fr-vol2-054":[[40.79,72.95,7.5,2.8],[40.79,77.44,7.5,2.8],[40.79,81.85,7.5,2.8],[73.97,72.99,7.5,2.8],[73.97,77.47,7.5,2.8],[73.97,81.85,7.5,2.8]],"fr-vol2-055":[[40.14,71.73,7.5,2.8],[40.14,76.24,7.5,2.8],[40.14,80.8,7.5,2.8],[74.76,71.73,7.5,2.8],[74.76,76.28,7.5,2.8],[74.76,80.8,7.5,2.8]],"fr-vol2-056":[[39.5,73.46,7.5,2.8],[39.5,78.63,7.5,2.8],[39.5,82.64,7.5,2.8],[74.2,73.46,7.5,2.8],[74.2,78.05,7.5,2.8],[74.2,82.54,7.5,2.8]],"fr-vol2-057":[[39.54,72.52,7.5,2.8],[39.54,77.08,7.5,2.8],[39.54,81.78,7.5,2.8],[73.97,72.48,7.5,2.8],[73.97,77.11,7.5,2.8],[73.97,81.74,7.5,2.8]],"fr-vol2-058":[[40.26,74.13,7.5,2.8],[40.26,78.25,7.5,2.8],[40.26,82.45,7.5,2.8],[71.82,74.13,7.5,2.8],[71.82,78.29,7.5,2.8],[71.82,82.48,7.5,2.8]],"fr-vol2-059":[[41.02,72.47,7.5,2.8],[41.02,77.09,7.5,2.8],[41.02,81.69,7.5,2.8],[73.6,72.5,7.5,2.8],[73.6,77.09,7.5,2.8],[73.6,81.72,7.5,2.8]],"fr-vol2-060":[[40.47,73.21,7.5,2.8],[40.47,77.08,7.5,2.8],[40.47,81.42,7.5,2.8],[73.97,72.74,7.5,2.8],[73.97,77.04,7.5,2.8],[73.97,81.42,7.5,2.8]],"fr-vol2-061":[[40.4,72.1,7.5,2.8],[40.4,76.77,7.5,2.8],[40.4,80.38,7.5,2.8],[73.95,72.72,7.5,2.8],[73.95,76.73,7.5,2.8],[73.95,80.64,7.5,2.8]],"fr-vol2-062":[[40.65,74.15,7.5,2.8],[40.65,78.27,7.5,2.8],[40.65,82.43,7.5,2.8],[72.91,74.15,7.5,2.8],[72.91,78.27,7.5,2.8],[72.91,82.46,7.5,2.8]],"fr-vol2-063":[[40.47,74.42,7.5,2.8],[40.47,78.47,7.5,2.8],[40.47,82.55,7.5,2.8],[72.26,74.46,7.5,2.8],[72.26,78.5,7.5,2.8],[72.26,82.59,7.5,2.8]],"fr-vol2-064":[[40.56,73.91,7.5,2.8],[40.56,77.82,7.5,2.8],[40.56,81.61,7.5,2.8],[73.74,73.91,7.5,2.8],[73.74,77.85,7.5,2.8],[73.74,81.65,7.5,2.8]],"fr-vol2-066":[[40.84,74.51,7.5,2.8],[40.84,78.23,7.5,2.8],[40.84,82.79,7.5,2.8],[73.74,74.33,7.5,2.8],[73.74,78.23,7.5,2.8],[73.74,81.85,7.5,2.8]],"fr-vol2-067":[[43.06,70.32,7.5,2.8],[43.06,74.83,7.5,2.8],[43.06,80.44,7.5,2.8],[70.5,70.17,7.5,2.8],[70.5,74.65,7.5,2.8],[70.5,79.25,7.5,2.8]],"fr-vol2-068":[[40.74,72.41,7.5,2.8],[40.74,76.5,7.5,2.8],[40.74,80.62,7.5,2.8],[74.57,72.34,7.5,2.8],[74.57,76.75,7.5,2.8],[74.57,80.62,7.5,2.8]],"fr-vol2-069":[[40.12,73.37,7.5,2.8],[40.12,77.17,7.5,2.8],[40.12,81.11,7.5,2.8],[74.46,73.33,7.5,2.8],[74.46,77.17,7.5,2.8],[74.46,81.07,7.5,2.8]],"fr-vol2-070":[[40.47,74.13,7.5,2.8],[40.47,78.18,7.5,2.8],[40.47,82.3,7.5,2.8],[73.0,74.13,7.5,2.8],[73.0,78.22,7.5,2.8],[73.0,82.34,7.5,2.8]],"fr-vol2-071":[[39.47,71.35,7.5,2.8],[39.47,75.4,7.5,2.8],[39.47,79.48,7.5,2.8],[74.73,71.35,7.5,2.8],[74.73,75.36,7.5,2.8],[74.73,80.2,7.5,2.8]],"fr-vol2-072":[[39.82,72.14,7.5,2.8],[39.82,76.08,7.5,2.8],[39.82,80.1,7.5,2.8],[73.6,71.78,7.5,2.8],[73.6,76.08,7.5,2.8],[73.6,80.1,7.5,2.8]],"fr-vol2-073":[[40.28,70.84,7.5,2.8],[40.28,74.89,7.5,2.8],[40.28,78.97,7.5,2.8],[75.08,70.84,7.5,2.8],[75.08,74.85,7.5,2.8],[75.08,78.97,7.5,2.8]],"fr-vol2-074":[[40.12,71.76,7.5,2.8],[40.12,75.56,7.5,2.8],[40.12,79.46,7.5,2.8],[74.09,71.76,7.5,2.8],[74.09,75.56,7.5,2.8],[74.09,79.46,7.5,2.8]],"fr-vol2-075":[[39.7,72.43,7.5,2.8],[39.7,76.44,7.5,2.8],[39.7,80.28,7.5,2.8],[75.38,72.39,7.5,2.8],[75.38,76.41,7.5,2.8],[75.38,80.24,7.5,2.8]],"fr-vol2-076":[[40.47,72.27,7.5,2.8],[40.47,76.28,7.5,2.8],[40.47,80.48,7.5,2.8],[73.92,72.95,7.5,2.8],[73.92,76.5,7.5,2.8],[73.92,80.26,7.5,2.8]],"fr-vol2-077":[[40.14,70.89,7.34,2.8],[40.14,74.76,7.34,2.8],[40.14,79.72,7.34,2.8],[74.39,70.86,7.34,2.8],[74.39,74.73,7.34,2.8],[74.39,78.6,7.34,2.8]],"fr-vol2-078":[[40.24,71.69,7.43,2.8],[40.24,75.3,7.43,2.8],[40.24,78.92,7.43,2.8],[75.04,71.62,7.43,2.8],[75.04,75.27,7.43,2.8],[75.04,78.92,7.43,2.8]],"fr-vol2-079":[[39.03,72.92,7.5,2.8],[39.03,76.71,7.5,2.8],[39.03,81.16,7.5,2.8],[74.16,72.41,7.5,2.8],[74.16,76.68,7.5,2.8],[74.16,81.2,7.5,2.8]],"fr-vol2-080":[[40.24,73.14,7.5,2.8],[40.24,76.57,7.5,2.8],[40.24,80.04,7.5,2.8],[75.22,72.99,7.5,2.8],[75.22,76.57,7.5,2.8],[75.22,80.08,7.5,2.8]],"fr-vol2-081":[[40.47,72.32,7.43,2.8],[40.47,75.68,7.43,2.8],[40.47,78.9,7.43,2.8],[74.53,72.25,7.43,2.8],[74.53,75.65,7.43,2.8],[74.53,78.87,7.43,2.8]],"fr-vol2-082":[[40.54,74.15,7.43,2.8],[72.98,73.5,7.43,2.8],[40.54,77.76,7.43,2.8],[72.98,77.76,7.43,2.8],[40.54,81.31,7.43,2.8],[72.98,81.31,7.43,2.8]],"fr-vol2-083":[[40.28,74.29,7.34,2.8],[74.48,73.61,7.34,2.8],[40.28,77.87,7.34,2.8],[74.48,77.84,7.34,2.8],[40.28,81.45,7.34,2.8],[74.48,81.45,7.34,2.8]],"fr-vol2-084":[[39.84,73.42,7.34,2.8],[74.04,74.11,7.34,2.8],[39.84,77.55,7.34,2.8],[74.04,77.55,7.34,2.8],[39.84,80.98,7.34,2.8],[74.04,80.98,7.34,2.8]],"fr-vol2-085":[[40.05,73.06,7.48,2.8],[74.25,73.03,7.48,2.8],[40.05,76.28,7.48,2.8],[74.25,76.32,7.48,2.8],[40.05,79.61,7.48,2.8],[74.25,79.61,7.48,2.8]],"fr-vol2-086":[[39.96,73.21,7.5,2.8],[71.24,73.21,7.5,2.8],[39.96,78.05,7.5,2.8],[71.24,78.02,7.5,2.8],[39.96,82.54,7.5,2.8],[71.24,83.11,7.5,2.8]],"fr-vol2-087":[[40.77,74.56,7.29,2.8],[74.09,74.53,7.29,2.8],[40.77,78.25,7.29,2.8],[74.09,78.22,7.29,2.8],[40.77,81.43,7.29,2.8],[74.09,81.4,7.29,2.8]],"fr-vol2-088":[[42.32,77.98,7.15,2.8],[69.3,77.51,7.15,2.8],[42.32,81.7,7.15,2.8],[69.3,81.74,7.15,2.8],[42.32,85.83,7.15,2.8],[69.3,85.79,7.15,2.8]],"fr-vol2-089":[[40.13,73.64,7.5,2.8],[73.4,73.61,7.5,2.8],[40.13,76.64,7.5,2.8],[73.4,76.64,7.5,2.8],[40.13,79.93,7.5,2.8],[73.4,81.2,7.5,2.8]],"fr-vol2-091":[[40.61,76.71,7.2,2.8],[73.97,76.32,7.2,2.8],[40.61,79.68,7.2,2.8],[73.97,79.57,7.2,2.8],[40.61,83.01,7.2,2.8],[73.97,83.01,7.2,2.8]],"fr-vol2-093":[[40.63,75.49,7.34,2.8],[74.97,75.49,7.34,2.8],[40.63,78.6,7.34,2.8],[74.97,78.6,7.34,2.8],[40.63,81.74,7.34,2.8],[74.97,81.7,7.34,2.8]],"fr-vol2-094":[[40.95,75.81,6.83,2.8],[75.75,75.81,6.83,2.8],[40.95,78.78,6.83,2.8],[75.75,78.78,6.83,2.8],[40.95,81.85,6.83,2.8],[75.75,81.85,6.83,2.8]],"fr-vol2-095":[[39.84,76.32,7.01,2.8],[74.04,76.32,7.01,2.8],[39.84,79.28,7.01,2.8],[74.04,79.28,7.01,2.8],[39.84,82.25,7.01,2.8],[74.04,82.25,7.01,2.8]],"fr-vol2-096":[[39.68,76.68,6.74,2.8],[75.13,76.21,6.74,2.8],[39.68,79.68,6.74,2.8],[75.13,79.68,6.74,2.8],[39.68,82.61,6.74,2.8],[75.13,82.64,6.74,2.8]],"fr-vol2-097":[[39.82,76.66,6.92,2.8],[73.97,76.66,6.92,2.8],[39.82,79.73,6.92,2.8],[73.97,79.77,6.92,2.8],[39.82,82.81,6.92,2.8],[73.97,82.81,6.92,2.8]],"fr-vol2-098":[[40.49,74.26,7.25,2.8],[75.06,74.33,7.25,2.8],[40.49,77.91,7.25,2.8],[75.06,77.91,7.25,2.8],[40.49,81.05,7.25,2.8],[75.06,81.05,7.25,2.8]],"fr-vol2-099":[[40.19,75.92,7.06,2.8],[40.19,78.99,7.06,2.8],[40.19,82.1,7.06,2.8],[75.22,75.2,7.06,2.8],[75.22,78.92,7.06,2.8],[75.22,82.03,7.06,2.8]],"fr-vol2-100":[[40.54,75.63,6.55,2.8],[74.04,76.21,6.55,2.8],[40.54,79.17,6.55,2.8],[74.04,79.14,6.55,2.8],[40.54,82.1,6.55,2.8],[74.04,82.1,6.55,2.8]],"fr-prism-2700a67d5699":[[29.79,75.95,7.5,2.8],[30.07,79.86,7.5,2.8],[29.96,83.97,7.5,2.8],[61.04,75.95,7.5,2.8],[61.24,79.88,7.5,2.8],[61.49,83.95,7.5,2.8]],"fr-prism-3ea2b8e697a8":[[29.31,76.23,7.46,2.8],[61.78,76.23,7.46,2.8],[29.28,80.55,7.46,2.8],[61.72,80.55,7.46,2.8],[29.42,84.95,7.46,2.8],[61.65,84.95,7.46,2.8]],"fr-prism-c681e718f4fb":[[28.79,74.21,7.24,2.8],[61.46,74.18,7.24,2.8],[28.71,78.58,7.24,2.8],[61.07,78.6,7.24,2.8],[28.99,83.08,7.24,2.8],[61.71,83.1,7.24,2.8]],"fr-prism-cabfbabedecc":[[30.92,76.43,7.16,2.8],[60.61,76.43,7.16,2.8],[30.47,80.59,7.16,2.8],[60.22,80.59,7.16,2.8],[30.25,84.61,7.16,2.8],[60.81,84.63,7.16,2.8]],"fr-prism-9f38954f063c":[[31.78,75.75,7.5,2.8],[60.48,75.73,7.5,2.8],[31.56,80.08,7.5,2.8],[60.58,80.08,7.5,2.8],[31.01,84.32,7.5,2.8],[60.67,84.29,7.5,2.8]],"fr-prism-5ab9e3f68580":[[30.75,76.83,7.16,2.8],[60.58,76.83,7.16,2.8],[30.61,81.04,7.16,2.8],[60.06,81.02,7.16,2.8],[30.75,85.17,7.16,2.8],[60.53,85.24,7.16,2.8]],"fr-prism-e0ec48316f8a":[[24.6,78.54,7.43,2.8],[46.12,78.54,7.43,2.8],[67.37,78.54,7.43,2.8],[24.6,83.37,7.43,2.8],[45.99,83.37,7.43,2.8],[67.57,83.35,7.43,2.8]],"fr-prism-b311a1a7d52e":[[31.47,78.0,7.29,2.8],[60.78,77.98,7.29,2.8],[31.5,82.24,7.29,2.8],[60.72,82.24,7.29,2.8],[31.0,86.39,7.29,2.8],[60.67,86.39,7.29,2.8]],"fr-prism-4e699242b391":[[23.25,83.52,7.5,3.6],[34.17,83.52,7.5,3.6],[44.78,83.52,7.5,3.6],[55.31,83.49,7.5,3.6],[66.08,83.52,7.5,3.6],[77.11,83.52,7.5,3.6]],"fr-prism-dee7dd3dd7fc":[[33.04,78.29,7.5,2.8],[57.1,78.27,7.5,2.8],[33.04,83.05,7.5,2.8],[57.1,83.03,7.5,2.8],[33.04,87.51,7.5,2.8],[56.9,87.51,7.5,2.8]],"fr-prism-819ca8bec178":[[23.28,82.62,7.42,3.6],[34.22,82.62,7.42,3.6],[44.69,82.62,7.42,3.6],[55.61,82.66,7.42,3.6],[66.42,82.64,7.42,3.6],[77.39,82.62,7.42,3.6]],"fr-prism-e80042ed3fb8":[[22.75,82.53,7.5,3.6],[33.75,82.53,7.5,3.6],[44.5,82.53,7.5,3.6],[55.25,82.63,7.5,3.6],[66.14,82.53,7.5,3.6],[77.28,82.55,7.5,3.6]],"fr-prism-29a11a144720":[[23.72,83.46,7.5,3.6],[34.28,83.46,7.5,3.6],[44.78,83.46,7.5,3.6],[55.53,83.46,7.5,3.6],[66.17,83.46,7.5,3.6],[76.83,83.46,7.5,3.6]],"fr-prism-aa81b82502a6":[[24.31,81.56,7.5,3.6],[34.81,81.56,7.5,3.6],[45.11,81.56,7.5,3.6],[55.39,81.56,7.5,3.6],[65.75,81.56,7.5,3.6],[76.25,81.56,7.5,3.6]],"fr-prism-b2d4164fac6e":[[23.5,82.82,7.5,3.6],[34.39,82.8,7.5,3.6],[45.06,82.82,7.5,3.6],[55.69,82.82,7.5,3.6],[66.53,82.82,7.5,3.6],[77.33,82.8,7.5,3.6]],"fr-prism-458705819f66":[[23.53,82.61,7.27,3.6],[34.33,82.66,7.27,3.6],[44.94,82.66,7.27,3.6],[55.83,82.63,7.27,3.6],[66.64,82.61,7.27,3.6],[77.67,82.61,7.27,3.6]],"fr-prism-2a1c5e256dd3":[[23.31,83.47,7.42,3.6],[34.14,83.44,7.42,3.6],[44.86,83.44,7.42,3.6],[55.64,83.44,7.42,3.6],[66.53,83.47,7.42,3.6],[77.42,83.47,7.42,3.6]],"fr-prism-f0657258fae2":[[23.53,82.79,7.46,3.6],[34.22,82.79,7.46,3.6],[44.64,82.79,7.46,3.6],[55.58,82.81,7.46,3.6],[66.47,82.79,7.46,3.6],[77.36,82.81,7.46,3.6]],"fr-prism-6edfaddc4a81":[[26.25,78.35,6.71,3.6],[35.86,78.35,6.71,3.6],[45.25,78.35,6.71,3.6],[54.67,78.33,6.71,3.6],[64.33,78.35,6.71,3.6],[73.97,78.33,6.71,3.6]],"fr-prism-9852485432de":[[23.67,80.82,7.5,3.6],[34.39,80.84,7.5,3.6],[45.11,80.84,7.5,3.6],[55.86,80.82,7.5,3.6],[66.75,80.82,7.5,3.6],[77.36,81.06,7.5,3.6]],"fr-prism-970e1ea370ed":[[23.14,82.48,7.5,3.6],[34.08,82.48,7.5,3.6],[44.94,82.46,7.5,3.6],[55.83,82.48,7.5,3.6],[66.92,82.46,7.5,3.6],[77.81,82.48,7.5,3.6]],"fr-prism-0eae5b652dfb":[[23.14,82.77,7.42,3.6],[33.94,82.77,7.42,3.6],[44.72,82.77,7.42,3.6],[55.56,82.77,7.42,3.6],[66.47,82.77,7.42,3.6],[77.36,82.77,7.42,3.6]],"fr-prism-14c2a295758e":[[23.11,81.2,7.5,3.6],[34.08,81.2,7.5,3.6],[44.89,81.2,7.5,3.6],[55.78,81.22,7.5,3.6],[66.75,81.2,7.5,3.6],[77.69,81.22,7.5,3.6]],"fr-prism-180939acea82":[[23.0,81.2,7.5,3.6],[33.92,81.2,7.5,3.6],[44.75,81.18,7.5,3.6],[55.75,81.18,7.5,3.6],[66.64,81.2,7.5,3.6],[77.56,81.2,7.5,3.6]],"fr-prism-44a82eced2e3":[[23.53,82.29,7.42,3.6],[34.19,82.31,7.42,3.6],[45.06,82.31,7.42,3.6],[56.0,82.31,7.42,3.6],[67.06,82.31,7.42,3.6],[77.92,82.31,7.42,3.6]],"fr-prism-44e68106cb0d":[[24.03,85.0,7.35,3.6],[34.5,84.98,7.35,3.6],[44.81,84.96,7.35,3.6],[55.56,84.94,7.35,3.6],[66.08,84.96,7.35,3.6],[76.44,84.44,7.35,3.6]],"fr-prism-7fdc297f64ea":[[23.17,80.77,7.5,3.6],[33.97,80.77,7.5,3.6],[44.86,80.77,7.5,3.6],[55.75,80.77,7.5,3.6],[66.69,80.77,7.5,3.6],[77.64,80.77,7.5,3.6]],"fr-prism-a33764a2b08f":[[23.19,79.77,7.5,3.6],[33.97,79.77,7.5,3.6],[44.81,79.77,7.5,3.6],[55.75,79.74,7.5,3.6],[66.53,79.74,7.5,3.6],[77.39,79.74,7.5,3.6]],"fr-prism-e4202a896a32":[[23.28,80.68,7.5,3.6],[33.97,80.68,7.5,3.6],[44.72,80.68,7.5,3.6],[55.67,80.66,7.5,3.6],[66.47,80.63,7.5,3.6],[77.39,80.66,7.5,3.6]],"fr-prism-9c0df213dbbc":[[22.92,81.14,7.42,3.6],[33.81,81.14,7.42,3.6],[44.53,81.14,7.42,3.6],[55.81,81.14,7.42,3.6],[66.64,81.14,7.42,3.6],[77.22,81.14,7.42,3.6]],"fr-prism-a356c4b3cd55":[[23.06,80.51,7.42,3.6],[33.94,80.53,7.42,3.6],[45.0,80.53,7.42,3.6],[55.89,80.51,7.42,3.6],[67.06,80.51,7.42,3.6],[77.92,80.51,7.42,3.6]],"fr-prism-10a0ecbf9687":[[24.31,78.92,7.42,3.6],[34.64,78.94,7.42,3.6],[45.19,78.92,7.42,3.6],[55.61,78.94,7.42,3.6],[66.03,78.94,7.42,3.6],[76.47,78.94,7.42,3.6]],"fr-prism-a90516d12017":[[23.72,79.23,7.42,3.6],[34.44,79.18,7.42,3.6],[45.28,79.16,7.42,3.6],[56.28,79.16,7.42,3.6],[67.03,79.16,7.42,3.6],[77.92,79.14,7.42,3.6]],"fr-prism-f71a88994bdc":[[24.42,79.35,7.32,3.6],[34.92,79.35,7.32,3.6],[45.42,79.33,7.32,3.6],[55.94,79.33,7.32,3.6],[66.53,79.35,7.32,3.6],[77.28,79.33,7.32,3.6]],"fr-prism-8da33f2bc608":[[24.5,79.14,7.42,3.6],[34.83,79.12,7.42,3.6],[45.08,79.12,7.42,3.6],[55.69,79.36,7.42,3.6],[65.83,79.12,7.42,3.6],[76.0,79.12,7.42,3.6]],"fr-prism-82cdcf8ebc28":[[24.14,76.9,7.5,3.6],[34.56,76.87,7.5,3.6],[45.08,76.83,7.5,3.6],[55.56,76.83,7.5,3.6],[66.03,76.81,7.5,3.6],[76.53,76.81,7.5,3.6]],"fr-prism-9a45484e05bc":[[22.17,78.16,7.5,3.6],[33.69,78.16,7.5,3.6],[45.39,78.16,7.5,3.6],[56.92,78.16,7.5,3.6],[68.69,78.16,7.5,3.6],[80.17,78.16,7.5,3.6]],"fr-vol2-090":[[39.93,74.44,7.2,3.2],[74.83,74.44,7.2,3.2],[39.93,77.85,7.2,3.2],[74.83,77.85,7.2,3.2],[39.93,81.1,7.2,3.2],[74.83,81.1,7.2,3.2]],"fr-prism-855a3963d5e5":[[26.53,76.1,6.5,3.6],[36.09,76.1,6.5,3.6],[45.65,76.1,6.5,3.6],[55.21,76.1,6.5,3.6],[64.76,76.1,6.5,3.6],[74.32,76.1,6.5,3.6]],"fr-prism-dbb9d09e5aa0":[[30.2,75.9,7.2,3.0],[60.67,75.9,7.2,3.0],[30.2,79.8,7.2,3.0],[60.67,79.8,7.2,3.0],[30.2,83.6,7.2,3.0],[60.67,83.6,7.2,3.0]],"fr-prism-cb8c853e7f04":[[30.2,76.4,7.2,3.0],[30.2,80.8,7.2,3.0],[30.2,84.9,7.2,3.0],[60.67,76.4,7.2,3.0],[60.67,80.8,7.2,3.0],[60.67,84.9,7.2,3.0]],"fr-prism-bb71e5d64d16":[[30.2,76.9,7.2,3.0],[60.67,76.9,7.2,3.0],[30.2,80.7,7.2,3.0],[60.67,80.7,7.2,3.0],[30.2,84.5,7.2,3.0],[60.67,84.5,7.2,3.0]],"fr-prism-977ae58fab9a":[[30.2,77.3,7.2,3.0],[60.67,77.3,7.2,3.0],[30.2,81.3,7.2,3.0],[60.67,81.3,7.2,3.0],[30.2,85.2,7.2,3.0],[60.67,85.2,7.2,3.0]],"fr-prism-3aac97f8345b":[[30.2,77.7,7.2,3.0],[63.06,77.7,7.2,3.0],[30.2,81.6,7.2,3.0],[63.06,81.6,7.2,3.0],[30.2,85.5,7.2,3.0],[63.06,85.5,7.2,3.0]]};
function abilityCard(c,stat){
 // Render the exact FUT sprite at its native card aspect, without extra zoom
 // or blur. Only the queried attribute value is covered.
 const raw=sprite(c,false,false);
 if(stat===6)return sprite(c,false,true);if(!Number.isInteger(stat)||stat<0||stat>5)return raw;
 const label=(c?.pos==='GK'?['DIV','HAN','KIC','REF','SPE','POS']:['PAC','SHO','PAS','DRI','DEF','PHY'])[stat];
 const pos=c?.source==='FR_COLLECTION_708'?[[19.3,78,9,6],[31.3,78,9,6],[43.5,78,9,6],[56,78,9,6],[68.3,78,9,6],[80.5,78,9,6]][stat]:FR_SPECIAL_STAT_MASKS[c?.id]?.[stat];
 const geometry=pos?' style="left:'+pos[0]+'%!important;top:'+pos[1]+'%!important;width:'+pos[2]+'%!important;height:'+pos[3]+'%!important;transform:translate(-50%,-50%)!important;font-size:clamp(8px,1.4vw,11px)!important"':'';
 const cover='<div class="fr16-ability-cover fr16-ability-'+stat+'"'+geometry+' aria-hidden="true">?</div>';
 return raw.slice(0,-6)+cover+'</div>'
}
function stageHead(kicker,title,clock){
 return '<div class="stage-head"><div><span class="phase">'+esc(kicker)+'</span><h2>'+title+'</h2></div>'+(clock?'<div class="round-timer" id="countdown"><span>--</span><small>SEC</small></div>':'')+'</div>'
}
function renderLobby(){
 $('#stage').innerHTML='<section class="stage-frame">'+stageHead('PRIVATE TWO-PLAYER ROOM','🎮 الغرفة جاهزة',false)+
 '<div class="waiting" style="padding:40px 15px"><div style="font-size:59px">📲</div><h2>ابعث الكود لصاحبك</h2><p>أول ما يدخل من موبايله، الجولة الأولى هتبدأ تلقائيًا.</p><div style="font:900 42px Barlow Condensed;letter-spacing:5px;color:#ffe0a5">'+esc(auth.id)+'</div>'+
 '<button class="gold-btn" id="shareInvite" style="max-width:290px;margin:14px auto">🔗 نسخ رابط الدعوة</button></div></section>';
 $('#shareInvite').addEventListener('click',copyInvite)
}
function renderGuess(){
 const q=game.quiz,me=game.players[game.side],opponent=game.players[1-game.side];if(!q)return;
 const locked=q.myGuess!==null;
 $('#stage').innerHTML='<section class="stage-frame">'+stageHead(q.jackpot?'⚡ JACKPOT ROUND · DOUBLE COINS':'🎯 STAT GUESSING · ROUND '+(game.round+1),'خـمّـن إحصائية اللاعب!',true)+
 '<div class="guess-layout"><div class="card-stage card-stage-featured"><div class="featured-wrap fr16-guess-wrap">'+abilityCard(q.card,q.stat)+'<div class="fr16-ability-caption">🎯 '+esc(q.statLabel)+' فقط مخفية · باقي كارت FIFA أصلي وواضح</div></div></div>'+
 '<div class="guess-control"><span class="stat-chip">🎯 '+esc(q.statLabel)+'</span><h3>الرقم الصحيح كام من 0 لـ 99؟</h3><p>اللاعب الأقرب للرقم الحقيقي ياخد الكارت. إجابة المنافس هتفضل مخفية لحد الكشف.</p>'+
 (q.jackpot?'<div class="jackpot">🎰 JACKPOT ×2 — الكوينز هتتضاعف في الجولة دي!</div>':'')+
 (q.attempt>1?'<div class="jackpot">🤝 تعادل! إحصائية جديدة لحسم الجولة.</div>':'')+
 (locked?'<div class="locked-answer">🔒 تخمينك اتثبت: '+q.myGuess+'<div style="font-size:12px;margin-top:6px">في انتظار المنافس أو انتهاء الوقت…</div></div>':
 '<div class="number-row"><button id="minus" aria-label="نقص واحد">−</button><input id="guessNumber" type="number" min="0" max="99" value="75" inputmode="numeric" aria-label="التخمين"><button id="plus" aria-label="زيادة واحد">+</button></div>'+
 '<input id="guessRange" class="range-slider" type="range" min="0" max="99" value="75"><div class="range-labels"><span>0</span><span>99</span></div><button class="gold-btn" id="lockGuess">🔒 تثبيت التخمين</button>')+
 '<div class="waiting">المنافس: <strong style="color:#c8ffdf">'+esc(opponent?.name)+'</strong> · '+(opponent?.guessed?'✅ ثبّت تخمينه':'⏳ لسه بيختار')+'</div></div></div></section>';
 if(!locked){
  const number=$('#guessNumber'),range=$('#guessRange');const set=v=>{const x=Math.max(0,Math.min(99,Math.round(Number(v)||0)));number.value=x;range.value=x};
  $('#minus').onclick=()=>set(Number(number.value)-1);$('#plus').onclick=()=>set(Number(number.value)+1);
  number.oninput=()=>{if(number.value!==''&&!Number.isNaN(Number(number.value)))set(number.value)};
  range.oninput=()=>set(range.value);
  $('#lockGuess').onclick=()=>doGuess()
 }
}
function renderReveal(){
 const r=game.reveal;if(!r)return;
 const winner=Number(r.winner),mine=Number(game.side)===1?1:0,order=[mine,1-mine];
 const cards=order.map(side=>{
  const player=game.players[side],won=side===winner,card=won?r.card:r.loserCard;
  return '<article class="fr129-reveal-card '+(won?'is-winner':'')+'">'+
   '<div class="fr129-card-owner"><span>'+(side===mine?'أنت':'المنافس')+'</span><strong>'+esc(player?.name||'لاعب')+'</strong><small>'+(won?'🏆 كارت الفائز':'🎴 الكارت البديل')+'</small></div>'+
   '<div class="fr129-card-art">'+sprite(card,false)+'</div></article>';
 }).join('');
 const picks=order.map(side=>{
  const player=game.players[side];return '<div class="pick-result '+(side===winner?'winner':'')+'"><small>'+esc(player?.name||'لاعب')+'</small><strong>'+(r.guesses?.[side]??'—')+'</strong><small>الفرق: '+(r.diff?.[side]??'لم يخمن')+'</small><b>+'+(Number(r.earned?.[side])||0)+' COINS</b></div>';
 }).join('');
 $('#stage').innerHTML='<section class="stage-frame fr129-reveal">'+stageHead(r.jackpot?'🎰 JACKPOT ×2 · CARD REVEAL':'✨ ROUND RESULT · CARD REVEAL','اتكشفت الحقيقة!',false)+
  '<div class="fr129-actual"><span>الإجابة الصحيحة · '+esc(r.statLabel||STATS[r.stat]||'التقييم')+'</span><strong>'+esc(r.actual)+'</strong></div>'+
  '<div class="fr129-reveal-cards" aria-label="كارت الفائز وكارت المنافس">'+cards+'</div>'+
  '<div class="reveal-board fr129-details"><div class="reveal-picks">'+picks+'</div></div>'+
  '<div class="reveal-summary">🏆 '+esc(game.players[winner]?.name||'الفائز')+' كسب '+esc(r.card?.name||'الكارت')+' · '+esc(game.players[Number(r.loser)]?.name||'المنافس')+' حصل على '+esc(r.loserCard?.name||'الكارت البديل')+'</div>'+
  '<div class="reveal-footer">الكارتان الأصليان للتشكيلتين · الجولة التالية تبدأ تلقائيًا بعد الكشف</div></section>';
}

function packReveal(){
 const x=lastPurchase;if(!x||Date.now()-x.at>6400)return'';
 return '<div class="pack-card-reveal fr130-pack-reveal"><div class="fr130-pack-card">'+sprite(x.card,false)+'</div><div class="fr130-pack-info"><strong>✨ لاعب جديد!</strong><h3>'+esc(x.card.name)+'</h3><p>'+esc(x.card.slot)+' · OVR '+esc(x.card.ovr)+'</p><small>باقتك: '+esc(TAGS[x.card.kind]||x.card.kind)+' · صرفت '+esc(x.card.paid)+' كوين</small></div></div>';
}

function renderShop(){
 const p=game.players[game.side],count=p.roster.length-7,done=p.roster.length>=11,slot=game.slots[p.roster.length],op=game.players[1-game.side],spec=game.tiers[selected],price=spec.price+boost*2;
 $('#stage').innerHTML='<section class="stage-frame">'+stageHead('💰 YA DOBAK · CARD MARKET','سوق اللاعبين · كمّل تشكيلتك',false)+
 '<div class="shop-header"><p class="subtle">إنت جمعت <b>'+p.totalEarned+'</b> كوين. لسه '+Math.max(0,4-count)+' كروت في المتجر'+(done?' · تشكيلتك اكتملت!':' · المركز التالي: '+esc(slot))+'</p><div class="wallet"><b>'+p.coins+'</b> COINS</div></div>'+
 '<div class="pack-grid">'+order.map(key=>{const c=game.tiers[key];return'<button type="button" data-tier="'+key+'" class="pack '+key+(selected===key?' selected':'')+'" '+(done?'disabled':'')+'><strong>'+esc(c.label).toUpperCase()+'</strong><div class="packprice">'+c.price+'</div><small>كوين</small><span>OVR '+c.min+'+</span></button>'}).join('')+'</div>'+
 (done?'<div class="locked-answer">✅ خلصت مشترياتك! في انتظار '+esc(op?.name)+' يكمل تشكيلته ('+(op?.roster.length||0)+'/11).</div>':
 '<div class="boost-row"><h4>⚡ ارفع التقييم المضمون</h4><input id="boost" type="range" min="0" max="5" value="'+boost+'"><div class="boost-info"><span>+<b id="boostValue">'+boost+'</b> OVR</span><span>+<b id="boostCost">'+(boost*2)+'</b> كوين</span></div></div>'+
 '<button id="buyPack" class="gold-btn" '+(p.coins<price?'disabled':'')+'>🎴 افتح '+esc(TAGS[selected])+' · '+price+' كوين · ضمان '+(spec.min+boost)+'+</button>'+
 '<div class="my-pack">بطاقة واحدة في مركز <strong>'+esc(slot)+'</strong> · ميزانيتك بعد الفتح: '+Math.max(0,p.coins-price)+' كوين</div>')+
 packReveal()+'</section>';
 if(!done){
  document.querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>{selected=b.dataset.tier;renderShop()});
  $('#boost').oninput=e=>{boost=Number(e.target.value);const p=game.players[game.side];$('#boostValue').textContent=boost;$('#boostCost').textContent=boost*2;const price=game.tiers[selected].price+boost*2;$('#buyPack').textContent='🎴 افتح '+TAGS[selected]+' · '+price+' كوين · ضمان '+(game.tiers[selected].min+boost)+'+';$('#buyPack').disabled=p.coins<price;document.querySelector('.my-pack').textContent='بطاقة في مركز '+slot+' · ميزانيتك بعد الفتح: '+Math.max(0,p.coins-price)+' كوين'};
  $('#buyPack').onclick=()=>doBuy()
 }
}
function renderFinished(){
 const m=game.match,score=m.score,winner=score[0]===score[1]?-1:score[0]>score[1]?0:1;
 const yourWinner=winner===game.side,goalList=(m.goals||[]).slice(-20);
 $('#stage').innerHTML='<section class="stage-frame">'+stageHead('🏟️ YA DOBAK FINAL · MATCH DAY','المـبـاراة الـنهـائـية!',false)+
 '<div class="final-banner"><div class="eyebrow">FULL TIME · 90 MINUTES</div><h2>'+(winner===-1?'🤝 تعادل مثير بين الفريقين':yourWinner?'🏆 مبروك! أنت البطل':'⚔️ منافسك كسب المباراة')+'</h2>'+
 '<div class="final-score"><small>'+esc(game.players[0].name)+'</small><strong>'+score[0]+' : '+score[1]+'</strong><small>'+esc(game.players[1].name)+'</small></div>'+
 '</div><div class="motm-panel"><div class="motm-kicker">⭐ MAN OF THE MATCH · FIFA FUT CARD</div><div class="motm-feature"><div class="motm-portrait">'+sprite(m.motm,false)+'</div><div class="motm-info"><span class="motm-award">🏅 BEST ON THE PITCH</span><h3>'+esc(m.motm?.name||'PLAYER')+'</h3><div class="motm-rating">'+esc(m.motm?.ovr||'–')+' <small>OVR</small></div><p>'+esc(m.motm?.pos||m.motm?.slot||'')+' · '+esc(m.motm?.edition||'FUT')+'</p><div class="motm-performance">⚽ '+(m.motm?.goals||0)+' هدف · '+esc(m.teams[m.motm?.side||0]?.name||'')+'</div></div></div></div>'+
 '<div class="reveal-board" style="margin-top:14px"><div class="glass"><h3 style="color:#ffe0a6">📊 إحصائيات المباراة</h3>'+['shots','onTarget','passes','saves','xg'].map((k)=>'<div style="display:flex;justify-content:space-between;border-bottom:1px solid #42647c;padding:9px;color:#cce2e5;font-size:12px"><b>'+((m.stats[0][k]||0).toFixed?Number(m.stats[0][k]||0).toFixed(k==='xg'?2:0):m.stats[0][k]||0)+'</b><span>'+({shots:'التسديدات',onTarget:'على المرمى',passes:'التمريرات',saves:'تصديات الحراس',xg:'الأهداف المتوقعة'}[k])+'</span><b>'+Number(m.stats[1][k]||0).toFixed(k==='xg'?2:0)+'</b></div>').join('')+'</div>'+
 '<div class="glass"><h3 style="color:#ffe0a6">⚽ الأهداف</h3><ul class="final-goals">'+(goalList.length?goalList.map(g=>'<li>⚽ '+g.minute+'′ · '+esc(g.player)+' · '+esc(game.players[g.team]?.name)+'</li>').join(''):'<li>مفيش أهداف في المباراة دي</li>')+'</ul></div></div>'+
 '<button class="gold-btn" id="playAgain" style="margin-top:14px">🎮 ابدأ تحدي جديد</button></section>'+window.FRMatchday.reportHtml(game);
 $('#playAgain').onclick=reset;
 const link=$('#fr14-copy-report');if(link)link.onclick=()=>{
  const u=location.origin+'/ya-dobak/?report='+auth.id;
  navigator.clipboard?.writeText(u).then(()=>toast('✅ رابط التقرير اتنسخ')).catch(()=>toast(u))
 }
}
function render(){
 if(!game)return;if(game.stage!=='live'&&game.stage!=='finished')window.FR103_YADOBAK?.dispose();visible();profile();
 const sig=[game.stage,game.round,game.quiz?.attempt,game.quiz?.myGuess,game.players.map(x=>x?.roster.length),game.reveal?.at,game.players.map(x=>x?.coins),game.tie?.at,game.matchLive?.minute,game.matchLive?.phase,game.matchLive?.events?.length,game.matchLive?.celebration?.id,game.matchLive?.playbackRate,JSON.stringify(game.matchLive?.skipVotes||[]),game.matchLive?.teams?.map(t=>t.tactic).join(','),game.match?.at].join('|');
 if(sig===renderKey)return;renderKey=sig;
 if(game.stage==='lobby')renderLobby();else if(game.stage==='guess')renderGuess();else if(game.stage==='reveal')renderReveal();else if(game.stage==='shop')renderShop();
 else if(game.stage==='matchReady')window.FRMatchday?.ready(game,(speed,btn)=>call('matchStart',{speed},btn));
 else if(game.stage==='live')window.FRMatchday?.live(game,(tactic,btn)=>call('tactic',{tactic},btn),sprite);
 else if(game.stage==='finished'){if(!window.FR103_YADOBAK?.finished(game,reset))renderFinished();}
 tickClock()
}
function accept(data){
 if(!data)return;
 if(data.stage==='cancelled'){auth=null;game=null;save();window.FRMatchday?.reset();visible();window.dispatchEvent(new CustomEvent('fr46:room-cancelled',{detail:data}));return;}clockOffset=data.serverAt-Date.now();
 if(game?.stage==='shop'&&data.players?.[data.side]?.roster?.length>game.players[game.side]?.roster.length){
  const arr=data.players[data.side].roster;lastPurchase={card:arr[arr.length-1],at:Date.now()};
 }
 game=data;
 if(game.stage==='finished'&&auth){
  try{
   const saved=JSON.parse(localStorage.getItem('fr14-reports')||'[]');
   const fresh=[{id:auth.id,token:auth.token,at:Date.now()},...saved.filter(x=>x.id!==auth.id)].slice(0,12);
   localStorage.setItem('fr14-reports',JSON.stringify(fresh))
  }catch{}
 }
 online=true;$('#syncState').textContent='● متصل بالسيرفر';render()
}
async function call(op,data={},button=null){
 if(busy)return;busy=true;const label=button?.textContent;if(button){button.disabled=true;button.textContent='⏳ جاري التنفيذ…'}
 try{const out=await req(op,data);accept(out)}catch(e){toast(e.message,true);if(button){button.disabled=false;button.textContent=label}}
 finally{busy=false}
}
function doGuess(){
 if(!game?.quiz||game.quiz.myGuess!==null)return;const v=Number($('#guessNumber').value);
 if(!Number.isInteger(v)||v<0||v>99)return toast('الرقم لازم يكون من 0 إلى 99',true);
 call('guess',{round:game.round,attempt:game.quiz.attempt,value:v},$('#lockGuess'))
}
function doBuy(){if(game?.stage!=='shop')return;call('buy',{tier:selected,boost},$('#buyPack'))}
async function create(){
 if(busy)return;busy=true;const btn=$('#createBtn');btn.disabled=true;
 try{const result=await req('create',{name:$('#hostName').value});auth={id:result.id,token:result.token};save();accept(result);toast('✅ الغرفة اتعملت! ابعت الكود لصاحبك')}
 catch(e){toast(e.message,true)}finally{btn.disabled=false;busy=false}
}
async function join(){
 if(busy)return;busy=true;const btn=$('#joinBtn');btn.disabled=true;
 try{const result=await req('join',{id:$('#roomCode').value,name:$('#guestName').value});auth={id:result.id,token:result.token};save();accept(result);toast('⚡ دخلت التحدي! يلا خمن')}
 catch(e){toast(e.message,true)}finally{btn.disabled=false;busy=false}
}
function reset(){auth=null;game=null;lastPurchase=null;renderKey='';window.FRMatchday?.reset();save();visible();toast('✅ تقدر تعمل غرفة جديدة أو تنضم لغرفة تانية')}
async function copyInvite(){
 const text=location.origin+'/ya-dobak/?room='+auth.id;
 try{await navigator.clipboard.writeText(text);toast('✅ رابط الدعوة اتنسخ')}catch{toast('شارك الرابط: '+text)}
}
function tickClock(){
 const el=$('#countdown');if(!el||!game?.quiz)return;
 const remain=Math.max(0,Math.ceil((game.quiz.deadline-Date.now()-clockOffset)/1000));
 el.innerHTML='<span>'+remain+'</span><small>SEC</small>';el.classList.toggle('warn',remain<=6)
}
async function poll(){
 if(!auth||poll.busy)return;poll.busy=true;
 try{const data=await req('state');accept(data)}
 catch(e){online=false;$('#syncState').textContent='↻ إعادة الاتصال…';
  if(['ROOM_NOT_FOUND','NO_SESSION','NOT_PLAYER'].includes(e.code)){auth=null;game=null;renderKey='';save();window.FRMatchday?.reset();visible();toast('انتهت الغرفة السابقة، تقدر تبدأ تحدي جديد',true);return}
  if(!['RETRY','مزامنة سريعة، أعد المحاولة'].includes(e.message))console.warn('YaDobak sync',e.message)}
 finally{poll.busy=false}
}
function init(){
 $('#createBtn').onclick=create;$('#joinBtn').onclick=join;$('#copyRoom').onclick=()=>{navigator.clipboard?.writeText(auth.id).then(()=>toast('✅ الكود اتنسخ')).catch(()=>toast(auth.id))};
 $('#leaveBtn').onclick=()=>window.FR46RoomExit?.ask();
 $('#howTo').onclick=()=>$('#rulesModal').classList.remove('hidden');
 $('#closeRules').onclick=$('#rulesDone').onclick=()=>$('#rulesModal').classList.add('hidden');
 $('#rulesModal').addEventListener('click',e=>{if(e.target===$('#rulesModal'))$('#rulesModal').classList.add('hidden')});
 const reportCode=new URLSearchParams(location.search).get('report');
 if(reportCode&&/^[A-HJ-NP-Z2-9]{8}$/.test(reportCode.toUpperCase())){
  try{
   const saved=JSON.parse(localStorage.getItem('fr14-reports')||'[]');
   const x=(auth?.id===reportCode.toUpperCase()?auth:saved.find(z=>z.id===reportCode.toUpperCase()));
   if(x){
    auth={id:x.id,token:x.token};save();
    req('report').then(d=>{game={...d,stage:'finished',side:d.side??0,round:7};visible();renderKey='';render()})
     .catch(e=>toast('تعذر فتح التقرير: '+e.message,true))
   }else toast('التقرير متاح على الجهاز الذي لعب المباراة فقط',true)
  }catch{}
 }
 if(invite)$('#roomCode').value=invite.toUpperCase().slice(0,8);
 visible();if(auth&&!reportCode)poll();setInterval(()=>{if(!reportCode)poll()},850);setInterval(tickClock,160);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&auth)poll()})
}
window.FR127Control=(op,value,button)=>op==='rate'?call('playback',{rate:value},button):call('skip',{},button);
window.FR127_CLIENT_READY=true;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
