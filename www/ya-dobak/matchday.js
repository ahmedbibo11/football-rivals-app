/* FOOTBALL RIVALS 14 LIVE MATCHDAY */
(()=>{'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let prev='',lastGoal=-1,goalAt=0;
function ready(g,start){
const host=g.side===0;
$('#stage').innerHTML='<section class="stage-frame fr14-ready"><div class="fr14-topline">🏟️ MATCHDAY 14.0 · TWO SQUADS COMPLETE</div><h2>التشكيلتان جاهزتان للمباراة!</h2><p>هتشوف الدقيقة والأهداف والهجمات مباشرة، وتقدر تغيّر خطتك أثناء الماتش. النتيجة النهائية مش هتظهر قبل نهاية الـ90 دقيقة.</p><div class="fr14-ready-squads">'+g.players.map(p=>'<div><b>'+esc(p.name)+'</b><strong>11 / 11</strong><small>'+p.coins+' COINS</small></div>').join('')+'</div>'+(host?'<div class="fr14-speeds"><button class="fr14-start" data-speed="blitz">🚀 BLITZ MATCH <small>30 ثانية + استراحة قصيرة واحتفالات الأهداف</small></button><button class="fr14-start" data-speed="quick">⚡ QUICK MATCH <small>90 ثانية + استراحة بين الشوطين</small></button><button class="fr14-start" data-speed="full">🏆 FULL MATCH <small>3 دقائق + استراحة بين الشوطين</small></button></div>':'<div class="fr14-wait">⏳ صاحب الغرفة هيبدأ المباراة، وهتدخلوا سوا تلقائيًا.</div>')+'</section>';
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>start(b.dataset.speed,b))
}
function pitch(l){
const f=l.frame;if(!f?.players)return'<div class="fr14-wait">⚽ جاري تجهيز الملعب…</div>';
let dots='';
for(let team=0;team<2;team++)for(let i=0;i<(f.players[team]||[]).length;i++){
const p=f.players[team][i];dots+='<circle cx="'+(p.x*100).toFixed(1)+'" cy="'+(p.y*56).toFixed(1)+'" r="1.35" class="fr14-dot '+(team===0?'a':'b')+'"/>';
}
const ball=f.ball||{x:.5,y:.5};
return '<svg viewBox="0 0 100 56" preserveAspectRatio="xMidYMid meet" role="img" aria-label="الملعب ومواقع اللاعبين والكرة">'
+'<rect width="100" height="56" fill="#124b39"/><path d="M10 0V56 M30 0V56 M50 0V56 M70 0V56 M90 0V56" stroke="#ffffff09" stroke-width="10"/>'
+'<g fill="none" stroke="#d9f5d6b0" stroke-width=".43"><rect x="1" y="1" width="98" height="54"/><path d="M50 1V55M1 16H15V40H1M99 16H85V40H99M1 22H6V34H1M99 22H94V34H99"/><circle cx="50" cy="28" r="9"/></g>'
+dots+'<circle cx="'+(ball.x*100).toFixed(1)+'" cy="'+(ball.y*56).toFixed(1)+'" r="1.15" fill="#fff3ab" stroke="#15272c" stroke-width=".45"/></svg>'
}
function stats(s){const a=s[0]||{},b=s[1]||{};return [['shots','تسديدات'],['onTarget','على المرمى'],['passes','تمريرات'],['saves','تصديات'],['xg','xG']].map(x=>'<div class="fr14-stat"><strong>'+Number(a[x[0]]||0).toFixed(x[0]==='xg'?2:0)+'</strong><span>'+x[1]+'</span><strong>'+Number(b[x[0]]||0).toFixed(x[0]==='xg'?2:0)+'</strong></div>').join('')}
function events(items,all=false){const a=(items||[]).slice().reverse().slice(0,all?300:12);return a.length?a.map(e=>'<div class="fr14-event '+(e.type==='goal'?'is-goal':'')+'"><b>'+e.minute+'′</b><span>'+esc(e.message)+'</span></div>').join(''):'<p class="fr14-no-events">⚽ لسه في بداية المباراة…</p>'}
function live(g,tactic,sprite){
 const l=g.matchLive;if(!l)return;
 const es=l.events||[],goal=l.celebration||null,id=goal?.id||-1;
 const showGoal=!!goal;
 const sig=[l.minute,l.phase,l.score.join(':'),es.length,l.teams.map(t=>t.tactic).join('/'),id,showGoal].join('|');
 if(sig===prev&&$('#fr14-match'))return;prev=sig;
 const tactics=[['balanced','⚖️ متوازن'],['attack','⚡ هجومي'],['counter','🏃 مرتدات'],['press','🔥 ضغط']];
 const chosen=l.teams[g.side].tactic,disable=l.phase==='half';
 const card=showGoal?g.players[goal.team]?.roster?.find(x=>x.name===goal.player):null;
 const overlay=showGoal?'<div class="fr14-goal"><div><span>⚽ GOOOOOOAL!</span><h2>'+esc(goal.player)+'</h2><p>'+goal.minute+'′ · '+esc(g.players[goal.team]?.name)+'</p>'+(card?sprite(card,false):'')+'</div></div>':'';
 $('#stage').innerHTML='<section class="stage-frame fr14-match" id="fr14-match"><div class="fr14-topline">🔴 LIVE MATCHDAY <b>'+(l.phase==='half'?'☕ HALF TIME':l.phase==='first'?'FIRST HALF':'SECOND HALF')+'</b></div>'
 +'<div class="fr14-scoreboard"><span>'+esc(g.players[0].name)+'</span><div><strong>'+l.score[0]+' : '+l.score[1]+'</strong><small>'+(l.phase==='half'?'45′ · استراحة الشوطين':l.minute+'′ / 90′')+'</small></div><span>'+esc(g.players[1].name)+'</span></div>'
 +'<div class="fr14-progress"><i style="width:'+(l.minute/90*100)+'%"></i></div><div class="fr14-pitch">'+pitch(l)+'<div>TACTICAL LIVE VIEW · SERVER TIMELINE</div></div>'
 +'<div class="fr14-match-grid"><article><h3>📡 أحداث المباراة</h3><div class="fr14-feed">'+events(es)+'</div></article><article><h3>📊 إحصائيات مباشرة</h3>'+stats(l.stats)
 +'<div class="fr14-tactics"><h3>🧠 قراراتك التكتيكية</h3><p>غيّر خطتك كل 8 دقائق لعب. القرار بيؤثر على فرص الهجوم والدفاع في الأحداث التالية.</p><div class="fr14-buttons">'+tactics.map(x=>'<button data-tactic="'+x[0]+'" '+(chosen===x[0]?'class="active"':'')+' '+(disable?'disabled':'')+'>'+x[1]+'</button>').join('')+'</div><small>خطتك: '+esc(chosen)+' · عدد تغييراتك: '+(l.tacticsUsed?.[g.side]||0)+'/8</small></div></article></div>'+overlay+'</section>';
 document.querySelectorAll('[data-tactic]').forEach(b=>b.onclick=()=>tactic(b.dataset.tactic,b))
}
function reportHtml(g){
 const m=g.match;if(!m)return'';
 return '<section class="fr14-report" id="fr14-report"><div class="fr14-report-head"><div><small>MATCH ARCHIVE · 30 DAYS</small><h3>📑 تقرير المباراة الكامل</h3></div><button id="fr14-copy-report">⧉ نسخ رابط التقرير</button></div><div class="fr14-report-score">'+esc(g.players[0].name)+' <strong>'+m.score[0]+' : '+m.score[1]+'</strong> '+esc(g.players[1].name)+'</div>'
 +'<div class="fr14-report-grid"><article><h4>📊 الإحصائيات</h4>'+stats(m.stats)+'</article><article><h4>⏱️ سجل الأحداث بالدقائق</h4><div class="fr14-report-events">'+events(m.events,true)+'</div></article></div><div class="fr14-report-foot">⭐ MAN OF THE MATCH · '+esc(m.motm?.name)+' · '+(m.speed==='blitz'?'30 SEC BLITZ':m.speed==='quick'?'QUICK':'FULL')+' MATCH</div></section>'
}
function reset(){prev='';lastGoal=-1;goalAt=0}
window.FRMatchday={ready,live,reportHtml,reset};
})();
