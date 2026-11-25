(()=>{'use strict';
const ROOT=document.getElementById('fr79-women-control');
if(!ROOT)return;
const BUTTON=document.getElementById('fr79-women-button');
const STATE=document.getElementById('fr79-women-state');
const SUB=document.getElementById('fr79-women-description');
const SAVE=document.getElementById('fr79-women-save');
const TITLE=document.getElementById('fr79-women-title');
const EYEBROW=document.getElementById('fr79-women-eyebrow');
const DETAIL=document.getElementById('fr79-women-detail');
const KEY='fr:cards:includeWomen:v1';
const preference=()=>window.FR78WomenPreference;
const get=()=>{try{return preference()?.get?preference().get():localStorage.getItem(KEY)!=='false'}catch{return true}};
const set=v=>{try{if(preference()?.set)preference().set(v);else localStorage.setItem(KEY,String(v));return true}catch{return false}};
const strings={
 ar:{title:'كروت اللاعبات',eyebrow:'CARD POOL · تفضيلات الألعاب',on:'مشاركة',off:'مستبعدة',
      descOn:'مسموح بظهور كروت اللاعبات المصنّفة في الألعاب الجديدة.',descOff:'لن تظهر كروت اللاعبات المصنّفة في سحب الألعاب الجديدة.',
      detail:'الاختيار يُحفظ لكل الألعاب · منشئ الغرفة يحدد القاعدة للطرفين',
      save:'يُطبَّق عند بدء لعبة جديدة',scope:'التصفية تغطي الكروت التي تم التحقق من تصنيفها'},
 en:{title:"Women's cards",eyebrow:'CARD POOL · GAME PREFERENCES',on:'Included',off:'Excluded',
      descOn:"Verified women's cards may appear in new games.",descOff:"Verified women's cards are excluded from new games.",
      detail:'Saved across games · the room creator sets the rule for both players',
      save:'Applies to newly created games',scope:'Only verified card classifications are covered'}
};
function draw(){const on=get(),lang=document.documentElement.lang==='en'?'en':'ar',x=strings[lang];ROOT.dataset.enabled=String(on);BUTTON.setAttribute('aria-pressed',String(on));BUTTON.setAttribute('aria-label',x.title+': '+(on?x.on:x.off));STATE.textContent=on?x.on:x.off;SUB.textContent=on?x.descOn:x.descOff;TITLE.textContent=x.title;EYEBROW.textContent=x.eyebrow;DETAIL.textContent=x.detail;SAVE.textContent=x.save;ROOT.querySelector('.fr79-scope').textContent=x.scope;}
BUTTON.addEventListener('click',()=>{const next=!get();if(!set(next))return;draw();document.dispatchEvent(new CustomEvent('fr:cards-preference-changed',{detail:{includeWomen:next}}));});
window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)draw()});
new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
draw();
})();