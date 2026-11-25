/* YA DOBAK v17 • STAT SNIPER ARENA • presentation layer; game/network rules preserved */
(()=>{'use strict';if(window.YaDobakSniper17)return;window.YaDobakSniper17={version:"17.0"};
const arena=document.querySelector('#arena'),stage=document.querySelector('#stage'),squads=document.querySelector('#squads');
if(!arena||!stage||!squads)return;
const positions=['GK','RB','CB','CB','LB','CDM','CM','CAM','RW','LW','ST'];
const tabs=document.createElement('nav');tabs.className='yd-squad-tabs';tabs.setAttribute('aria-label','اختيار تشكيلة الفريق');tabs.innerHTML='<button type="button" data-yd-team="0" aria-selected="true">BIBO</button><button type="button" data-yd-team="1" aria-selected="false">RIVAL</button>';
let team=0,squadSignature='',lastStage=null,toolOpen=false,scheduled=false,lastPhase='';
const tool=document.createElement('button');tool.type='button';tool.className='yd-tools-toggle';tool.textContent='☷';tool.title='الميكروفون والإعدادات';tool.setAttribute('aria-label','فتح أدوات الميكروفون واللغة والمظهر');tool.setAttribute('aria-expanded','false');document.body.append(tool);
tool.addEventListener('click',()=>{toolOpen=!toolOpen;document.body.classList.toggle('yd-tools-open',toolOpen);tool.setAttribute('aria-expanded',String(toolOpen));tool.textContent=toolOpen?'×':'☷'});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toolOpen){toolOpen=false;document.body.classList.remove('yd-tools-open');tool.setAttribute('aria-expanded','false');tool.textContent='☷'}});
const panel=document.querySelector('.squads-panel');if(panel)panel.querySelector('.section-head')?.insertAdjacentElement('afterend',tabs);
tabs.addEventListener('click',e=>{const btn=e.target.closest('[data-yd-team]');if(!btn)return;team=Number(btn.dataset.ydTeam);syncTeam()});
function syncTeam(){squads.dataset.ydTeam=String(team);for(const btn of tabs.querySelectorAll('button'))btn.setAttribute('aria-selected',String(Number(btn.dataset.ydTeam)===team))}
function parsePlayers(col){
 const roster=col.querySelector('.roster-list');if(!roster)return[];
 return Array.from(roster.children).map(x=>x.textContent.trim()).filter(x=>/·/.test(x)).map(raw=>{
  const bits=raw.split('·');const pos=(bits[0]||'').trim().toUpperCase();const remainder=bits.slice(1).join('·').trim();const rating=(remainder.match(/(\d{2,3})\s*$/)||[])[1]||'';
  const name=remainder.replace(/\s+\d{2,3}\s*$/,'').trim();
  return{pos,name,rating};
 });
}
function makePitch(col){
 const players=parsePlayers(col);const old=col.querySelector('.yd-pitch');old?.remove();col.querySelector('.yd-progress')?.remove();
 const pitch=document.createElement('div');pitch.className='yd-pitch';pitch.setAttribute('role','img');pitch.setAttribute('aria-label','ملعب يوضح تشكيل الفريق في 11 مركزًا');
 const used=new Set();
 for(const [i,pos]of positions.entries()){
  let which=players.findIndex((p,j)=>!used.has(j)&&p.pos===pos);
  if(which<0&&players.length>positions.length-1)which=players.findIndex((p,j)=>!used.has(j));
  let player=null;if(which>=0){player=players[which];used.add(which)}
  const slot=document.createElement('div');slot.className='yd-slot'+(player?' filled':'');slot.title=player?player.pos+' · '+player.name+' '+player.rating:pos+' · في انتظار اللاعب';
  const big=document.createElement('strong');big.textContent=player?(player.rating||'★'):pos;
  const small=document.createElement('small');small.textContent=player?(player.name||pos):'—';slot.append(big,small);pitch.append(slot);
 }
 const progress=document.createElement('div');progress.className='yd-progress';const label=document.createElement('span');label.textContent=players.length>=11?'تشكيلة مكتملة ✓':'بتتبني جولة بجولة';const track=document.createElement('span');track.className='yd-track';const fill=document.createElement('i');fill.style.width=(Math.min(players.length,11)/11*100)+'%';track.append(fill);const count=document.createElement('b');count.textContent=Math.min(players.length,11)+'/11';progress.append(label,track,count);col.append(pitch,progress);
}
function buildSquads(){
 const cols=squads.querySelectorAll(':scope>.squad-col');if(cols.length!==2)return;
 const signature=Array.from(cols).map(c=>c.querySelector('h4')?.textContent+'||'+Array.from(c.querySelectorAll('.roster-list>span')).map(s=>s.textContent).join('|')).join('///');
 if(signature!==squadSignature||!cols[0].querySelector('.yd-pitch')){squadSignature=signature;cols.forEach(makePitch)}
 tabs.querySelectorAll('button').forEach((b,i)=>{const label=document.querySelector('#p'+i+'name')?.textContent||cols[i].querySelector('h4')?.textContent?.replace(/\d+\/11/,'')||('PLAYER '+(i+1));const total=parsePlayers(cols[i]).length;const text=(i===team?'⚽ ':'')+label+' · '+Math.min(total,11)+'/11';if(b.textContent!==text)b.textContent=text});
 syncTeam();
}
function updateGauge(){
 const input=document.querySelector('#guessNumber'),range=document.querySelector('#guessRange'),control=document.querySelector('.guess-control');
 if(!input||!range||!control)return;
 const val=Math.min(99,Math.max(0,Number(input.value)||0));
 range.style.background='linear-gradient(to right,#ffe0a0 0%,#e4b254 '+val+'%,#173a50 '+val+'%,#173a50 100%)';
 if(!control.querySelector('.yd-guess-meter')){
  const meter=document.createElement('div');meter.className='yd-guess-meter';meter.innerHTML='<span>🎯 تخمينك الحالي</span><b class="yd-current-value">75 / 99</b>';control.querySelector('.range-labels')?.insertAdjacentElement('afterend',meter);
 }
 const current=control.querySelector('.yd-current-value');if(current)current.textContent=val+' / 99';
}
function syncStage(){
 const frame=stage.firstElementChild;
 if(frame===lastStage)return;
 lastStage=frame;
 const p=stage.querySelector('.guess-layout')?'guess':stage.querySelector('.reveal-board')?'reveal':stage.querySelector('.pack-card-reveal')?'shop':stage.querySelector('.match-score')?'match':'other';
 stage.dataset.ydPhase=p;
 if(p==='guess'){const input=stage.querySelector('#guessNumber');if(input)updateGauge()}
 if(p!==lastPhase){lastPhase=p;toolOpen=false;document.body.classList.remove('yd-tools-open');tool.setAttribute('aria-expanded','false');tool.textContent='☷'}
}
function sync(){
 const active=!arena.classList.contains('hidden');document.body.classList.toggle('yd-active',active);
 if(!active){document.body.classList.remove('yd-tools-open');return}
 syncStage();buildSquads();
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}
new MutationObserver(schedule).observe(arena,{attributes:true,attributeFilter:['class']});
new MutationObserver(schedule).observe(stage,{childList:true,subtree:false});
new MutationObserver(schedule).observe(squads,{childList:true,subtree:false});
stage.addEventListener('input',e=>{if(e.target.matches('#guessRange,#guessNumber'))requestAnimationFrame(updateGauge)});
stage.addEventListener('click',e=>{if(e.target.matches('#minus,#plus'))requestAnimationFrame(updateGauge)});
schedule();setInterval(schedule,1200);
})();