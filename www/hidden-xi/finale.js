/* HIDDEN XI Reveal Arena — final result actions and cinematic finishing */
(()=>{'use strict';if(window.HiddenXIFinale2)return;window.HiddenXIFinale2=true;
const stage=document.querySelector('#stage');
if(!stage)return;
let pending=false;const enhance=()=>{
 pending=false;
 const p=stage.dataset.hx2Phase;
 if(p==='choose'||p==='reveal'||p==='tactics'||p==='finished'){
 const logo=stage.querySelector('.hx2-logo');
 if(logo&&!stage.querySelector('.hx2-brandline')){const line=document.createElement('span');line.className='hx2-brandline';line.textContent='HIDDEN XI · REVEAL ARENA';logo.insertAdjacentElement('afterend',line)}
 }
 if(p==='finished'&&!stage.querySelector('.hx2-result-actions')){
 const original=stage.querySelector('.finish-actions');
 if(!original)return;
 const controls=document.createElement('div');controls.className='hx2-result-actions';controls.innerHTML=
 '<button type="button" class="hx2-result-button" data-hx2-event="stats" aria-expanded="false">▥ إحصائيات المباراة</button>'+
 '<button type="button" class="hx2-result-button" data-hx2-event="lineups">♟ عرض التشكيلتين</button>'+
 '<button type="button" class="hx2-result-button" data-restart>⌂ العودة للواجهة</button>';
 original.insertAdjacentElement('beforebegin',controls);
 stage.classList.add('hx2-stats-folded');
 }
};
const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(enhance)}};
new MutationObserver(schedule).observe(stage,{childList:true,subtree:false});
stage.addEventListener('click',e=>{
 const b=e.target.closest('[data-hx2-event]');if(!b)return;
 if(b.dataset.hx2Event==='stats'){
  const closed=stage.classList.toggle('hx2-stats-folded');
  b.setAttribute('aria-expanded',String(!closed));b.textContent=closed?'▥ إحصائيات المباراة':'▣ إخفاء الإحصائيات';
  if(!closed)stage.querySelector('.match-events')?.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 if(b.dataset.hx2Event==='lineups'){
  document.querySelector('.hx2-team-tabs')?.scrollIntoView({behavior:'smooth',block:'center'});
 }
});
schedule();
})();