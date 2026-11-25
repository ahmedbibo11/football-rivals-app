/* HIDDEN XI — REVEAL ARENA v2: UI-only enhancements; no API or game-rule changes */
(()=>{
'use strict';
if(window.HiddenXIRevealArena)return;
window.HiddenXIRevealArena={version:'2.0.0'};
let view=null,viewSetByUser=false,toolsOpen=false,scheduled=false,lastPhase='';
const q=s=>document.querySelector(s),escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const game=q('#game'),stage=q('#stage'),lineups=q('.lineups');
if(!game||!stage||!lineups)return;
const selector={choose:'.pick-grid',reveal:'.reveal-stage',tactics:'.tactics-grid',finished:'.finish-trophy',match:'.match-board,.match-events',lobby:'.waiting-room'};
function phase(){
 for(const [name,sel] of Object.entries(selector))if(stage.querySelector(sel))return name;
 return 'loading';
}
function roomSide(){
 const guest=q('#guestName')?.value.trim().toLowerCase()||'';
 const host=q('#hostName')?.value.trim().toLowerCase()||'';
 const first=q('#lineup0')?.textContent.trim().toLowerCase()||'';
 const second=q('#lineup1')?.textContent.trim().toLowerCase()||'';
 if(guest&&guest===second&&guest!==first)return '1';
 if(host&&host===first&&host!==second)return '0';
 return '0';
}
const tabs=document.createElement('nav');tabs.className='hx2-team-tabs';tabs.setAttribute('aria-label','التبديل بين الفريقين');tabs.innerHTML='<button type="button" data-hx2-switch="0" aria-selected="true">تشكيلتي</button><button type="button" data-hx2-switch="1" aria-selected="false">المنافس</button>';
lineups.parentNode.insertBefore(tabs,lineups);
tabs.addEventListener('click',e=>{const b=e.target.closest('[data-hx2-switch]');if(!b)return;view=b.dataset.hx2Switch;viewSetByUser=true;syncTeams()});
function syncTeams(){
 if(!viewSetByUser&&q('#lineup1')?.textContent!=='بانتظار المنافس')view=roomSide();
 if(view===null)view='0';
 lineups.dataset.hx2Team=view;
 for(const b of tabs.querySelectorAll('button')){const s=b.dataset.hx2Switch;b.setAttribute('aria-selected',String(view===s));b.textContent=(s===view?'⚽ ':'')+(s==='0'?(q('#lineup0')?.textContent||'اللاعب الأول'):(q('#lineup1')?.textContent||'اللاعب الثاني'))+' · '+(q('#count'+(s==='0'?'One':'Two'))?.textContent?.replace(/\s*كارت.*/,'')||'0/11')}
 for(let i=0;i<2;i++){
  const el=q('#roster'+i);if(!el)continue;
  const used=el.querySelectorAll('.mini-slot.filled').length;
  const parent=el.parentElement;
  if(parent&&!parent.querySelector('.hx2-lineup-caption')){const caption=document.createElement('div');caption.className='hx2-lineup-caption';parent.append(caption)}
  const cap=parent?.querySelector('.hx2-lineup-caption');if(cap){const text=used===11?'التشكيلة مكتملة ✅':'كل لاعب بيظهر في مركزه بعد الجولة';const html='<span>'+text+'</span><strong>'+used+' / 11 لاعبين</strong>';if(cap.innerHTML!==html)cap.innerHTML=html}
  el.querySelectorAll('.mini-slot.filled').forEach(slot=>{if(!slot.hasAttribute('tabindex')){slot.tabIndex=0;slot.setAttribute('role','button');slot.setAttribute('aria-label','عرض تفاصيل '+(slot.querySelector('.name')?.textContent||'اللاعب'))}})
 }
}
function dialog(){
 let d=q('#hx2-player-modal');
 if(d)return d;
 d=document.createElement('div');d.id='hx2-player-modal';d.hidden=true;d.innerHTML='<div class="hx2-modal-panel" role="dialog" aria-modal="true" aria-labelledby="hx2-player-title"><button type="button" class="hx2-modal-close" aria-label="إغلاق">×</button><div class="hx2-player-star">✦</div><div class="hx2-player-rating"></div><h3 id="hx2-player-title"></h3><p class="hx2-player-position"></p><button type="button" class="hx2-modal-done">رجوع للملعب</button></div>';
 document.body.append(d);d.addEventListener('click',e=>{if(e.target===d||e.target.closest('.hx2-modal-close,.hx2-modal-done'))closeModal()});
 return d;
}
function closeModal(){const d=q('#hx2-player-modal');if(d){d.hidden=true;document.body.style.overflow=''}}
function playerDetail(slot){
 if(!slot.classList.contains('filled'))return;
 const d=dialog();d.querySelector('#hx2-player-title').textContent=slot.querySelector('.name')?.textContent||'لاعب';
 d.querySelector('.hx2-player-rating').textContent=slot.querySelector('.ovr')?.textContent||'—';
 d.querySelector('.hx2-player-position').textContent='المركز: '+(slot.querySelector('.position')?.textContent||'—');
 d.hidden=false;document.body.style.overflow='hidden';d.querySelector('.hx2-modal-close').focus();
}
lineups.addEventListener('click',e=>{const slot=e.target.closest('.mini-slot.filled');if(slot)playerDetail(slot)});
lineups.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.mini-slot.filled')){e.preventDefault();playerDetail(e.target)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();if(toolsOpen){toolsOpen=false;document.body.classList.remove('hx2-tools-open');toolButton?.setAttribute('aria-expanded','false')}}});
const toolButton=document.createElement('button');toolButton.className='hx2-tools-toggle';toolButton.type='button';toolButton.textContent='☷';toolButton.title='إظهار الميكروفون والإعدادات';toolButton.setAttribute('aria-label','إظهار الميكروفون وإعدادات اللعبة');toolButton.setAttribute('aria-expanded','false');document.body.append(toolButton);
toolButton.addEventListener('click',()=>{toolsOpen=!toolsOpen;document.body.classList.toggle('hx2-tools-open',toolsOpen);toolButton.setAttribute('aria-expanded',String(toolsOpen));toolButton.textContent=toolsOpen?'×':'☷'});
function enhanceStage(p){
 if(!stage.querySelector('.hx2-logo')&&(p==='choose'||p==='reveal'||p==='tactics'||p==='finished')){
 const logo=document.createElement('img');logo.className='hx2-logo';logo.src='/assets/brand/logo-fr.svg';logo.alt='FOOTBALL RIVALS';logo.width=68;logo.height=68;
 stage.insertBefore(logo,stage.firstChild);
 }
 if(p==='choose'){
  const vis=stage.querySelector('.choice-btn.visible .item-bottom');
  if(vis){const clean=vis.textContent.replace(/\s*[·•]\s*\d+\s*OVR\s*$/i,'').trim();if(clean&&clean!==vis.textContent)vis.textContent=clean}
 }
 if(p==='reveal'){const title=stage.querySelector('.stage-title');if(title)title.textContent='✦ تم الكشف عن اللاعب الخفي!';}
 if(p==='finished'){const title=stage.querySelector('.winner');if(title&&title.textContent&&!title.textContent.includes('الفائز'))title.setAttribute('data-hx2-winner','true')}
}
function sync(){
 const playing=!game.classList.contains('hidden');document.body.classList.toggle('hx2-playing',playing);
 if(!playing){document.body.classList.remove('hx2-tools-open');toolsOpen=false;toolButton.setAttribute('aria-expanded','false');return;}
 const p=phase();stage.dataset.hx2Phase=p;document.body.dataset.hx2Phase=p;
 syncTeams();
 if(lastPhase!==p){lastPhase=p;toolsOpen=false;document.body.classList.remove('hx2-tools-open');toolButton.setAttribute('aria-expanded','false');toolButton.textContent='☷';}
 enhanceStage(p);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}
new MutationObserver(schedule).observe(stage,{childList:true,subtree:false});
new MutationObserver(schedule).observe(game,{attributes:true,attributeFilter:['class']});
schedule();setInterval(schedule,1200);
})();
(()=>{const s=document.createElement('style');s.id='hx2-modal-styles';s.textContent="\n#hx2-player-modal[hidden]{display:none!important}\n#hx2-player-modal{position:fixed;inset:0;display:grid;place-items:center;z-index:120000;background:#010b18bf;backdrop-filter:blur(10px);padding:20px}\n.hx2-modal-panel{position:relative;max-width:340px;width:100%;border-radius:23px;border:1px solid #e4bd7d;padding:29px;text-align:center;color:#fff;background:radial-gradient(circle at 50% 15%,#2b556b,#091b30 76%);box-shadow:0 16px 90px #000b,inset 0 1px #ffe1a055}\n.hx2-modal-close{position:absolute;top:10px;left:11px;border:1px solid #64889b;border-radius:8px;width:32px;height:32px;background:#13344d;color:#fff;font-size:22px}\n.hx2-player-star{font-size:49px;color:#ffdda0;text-shadow:0 0 18px #facb618c}\n.hx2-player-rating{width:86px;height:86px;border-radius:18px;border:2px solid #ffe3a0;margin:8px auto 12px;display:grid;place-items:center;background:linear-gradient(130deg,#ffedb9,#b98432);font-size:39px;font-weight:1000;color:#192736}\n.hx2-modal-panel h3{font-size:24px;color:#fff8df;line-height:1.3;overflow-wrap:anywhere;margin:8px 0}\n.hx2-player-position{color:#b7d7e6;font-size:16px}\n.hx2-modal-done{width:100%;margin-top:15px;border:1px solid #ffe3a2;border-radius:12px;padding:11px;background:linear-gradient(120deg,#ffe4a5,#d4a24d);color:#162d3f;font-weight:900}\n#game .roster-grid .mini-slot.filled{cursor:pointer}\n#game .roster-grid .mini-slot.filled:focus-visible{outline:3px solid #fff7bd;outline-offset:2px}\n";document.head.append(s)})();