(()=>{
'use strict';
const names={
star:{ar:'مين النجم؟',en:"WHO'S THE STAR"},
dobak:{ar:'يا دوبك',en:'YA DOBAK'},
hiddenxi:{ar:'اللاعب الخفي',en:'HIDDEN XI'}
};
const categories={knowledge:['star','dobak','hiddenxi']};
const lang=()=>window.FRBrand?.getLang?.()==='en'?'en':'ar';
let filter='all';
const gamesContainer=document.getElementById('frHomeCovers');
const featured=document.getElementById('frHomeFeatured');
const find=q=>document.querySelector(q);
if(!gamesContainer||!featured)return;
const covers=[...gamesContainer.querySelectorAll('.fr-cover')];
if(covers.length!==3){console.warn('FR: expected 3 game covers',covers.length);return;}
const featuredIds=['star','hiddenxi','dobak'];
for(const id of featuredIds){
 const original=covers.find(c=>c.dataset.game===id);
 if(original){
   const clone=original.cloneNode(true);
   clone.classList.add('fr-featured-card');
   featured.appendChild(clone);
 }
}
const originals={};
[...gamesContainer.querySelectorAll('.fr-cover'),...featured.querySelectorAll('.fr-cover')].forEach(card=>{
 const b=card.querySelector('b');
 if(b){
  originals[card.dataset.game]=b.innerHTML;
  b.classList.add('fr-native-title');
 }
 card.setAttribute('aria-label',names[card.dataset.game]?.ar||card.dataset.game);
});
const insight=find('.fr-insights'),summary=find('#frHomeSummary');
if(insight&&summary){
 const rank=insight.querySelector('.fr-rank');
 const daily=[...insight.querySelectorAll('.fr-box')].find(e=>!e.classList.contains('fr-rank')&&!e.classList.contains('fr-guide-box'));
 if(rank){rank.classList.add('fr-summary-card');summary.appendChild(rank)}
 if(daily){daily.classList.add('fr-summary-card','fr-daily-card');summary.appendChild(daily)}
 const guide=insight.querySelector('.fr-guide-box'), modes=find('#modes');
 if(guide&&modes){
  const details=document.createElement('details');
  details.className='fr-guide-details';
  const caption=document.createElement('summary');
  caption.textContent='ⓘ شرح اللعبة والقواعد';
  caption.dataset.frArenaAr='ⓘ شرح اللعبة والقواعد';
  caption.dataset.frArenaEn='ⓘ Game rules & guide';
  details.appendChild(caption);
  details.appendChild(guide);
  modes.appendChild(details);
 }
}
let guideGame='star';
const playRoutes={star:'/who-star/',dobak:'/ya-dobak/',hiddenxi:'/hidden-xi/'};
function updateGuideForSelection(){
 const entry=window.FRBrand?.content?.[guideGame]?.[lang()];
 if(!entry)return;
 const active=document.querySelector('[data-home-guide].active')?.dataset.homeGuide||'how';
 const title=document.getElementById('frFeaturedTitle'),copy=document.getElementById('frFeaturedCopy'),link=document.getElementById('frFeaturedPlay');
 if(title)title.textContent=entry.title;
 if(copy&&Array.isArray(entry[active])){copy.replaceChildren();const ol=document.createElement('ol');entry[active].forEach(line=>{const li=document.createElement('li');li.textContent=line;ol.appendChild(li)});copy.appendChild(ol)}
 if(link)link.href=playRoutes[guideGame]||'/';
}
document.addEventListener('click',e=>{
 const card=e.target.closest('[data-game]');
 if(card){guideGame=card.dataset.game;requestAnimationFrame(updateGuideForSelection)}
 if(e.target.closest('[data-home-guide]'))requestAnimationFrame(updateGuideForSelection);
},true);
const deepGame=new URLSearchParams(location.search).get('game');
if(deepGame&&names[deepGame])guideGame=deepGame;
const empty=find('#frLibraryEmpty');
const input=find('#frLibrarySearch');
function visibleGame(c){
 const id=c.dataset.game;
 const category=filter==='all'||(categories[filter]||[]).includes(id);
 const needle=(input?.value||'').trim().toLocaleLowerCase();
 const search=!needle||[names[id]?.ar,names[id]?.en,id].some(x=>(x||'').toLocaleLowerCase().includes(needle));
 return category&&search;
}
function applyFilter(){
 let shown=0;
 covers.forEach(c=>{let vis=visibleGame(c);c.hidden=!vis;if(vis)shown++});
 if(empty)empty.hidden=shown!==0;
}
function updateLocale(){
 const l=lang(),en=l==='en';
 document.querySelectorAll('.fr-bottom-nav [data-fr-arena-ar],#home .fr-home-featured [data-fr-arena-ar],#games [data-fr-arena-ar],.fr-guide-details [data-fr-arena-ar]').forEach(el=>{el.textContent=el.dataset[en?'frArenaEn':'frArenaAr']});
 [...gamesContainer.querySelectorAll('.fr-cover'),...featured.querySelectorAll('.fr-cover')].forEach(c=>{
  const title=names[c.dataset.game]?.[l];if(!title)return;
  c.querySelector('.fr-native-title').textContent=title;
  c.setAttribute('aria-label',title);
  c.title=title;
 });
 if(input){input.placeholder=en?'Search games':'ابحث عن لعبة';input.setAttribute('aria-label',input.placeholder)}
 const genLabels={
 all:[ 'الكل','All'],knowledge:['🧠 ذكاء','🧠 Trivia'],
 };
 document.querySelectorAll('[data-fr-filter]').forEach(el=>el.textContent=(genLabels[el.dataset.frFilter]||[el.textContent,el.textContent])[en?1:0]);
 if(empty)empty.textContent=en?'No games match your search.':'لا توجد ألعاب مطابقة للبحث.';
 const title=find('#games .subhead h1');if(title)title.textContent=en?'Games library':'مكتبة الألعاب';
 const subtitle=find('#games .subhead small');if(subtitle)subtitle.textContent=en?'8 FOOTBALL GAMES':'8 ألعاب كروية';
 const guide=find('.fr-guide-details summary');if(guide)guide.textContent=en?'ⓘ Game rules & guide':'ⓘ شرح اللعبة والقواعد';
 applyFilter();
 updateGuideForSelection();
}
document.querySelectorAll('[data-fr-filter]').forEach(b=>b.addEventListener('click',()=>{
 filter=b.dataset.frFilter;
 document.querySelectorAll('[data-fr-filter]').forEach(x=>{const active=x.dataset.frFilter===filter;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});
 applyFilter();
}));
input?.addEventListener('input',applyFilter);
window.FRArenaOrganize={updateLocale,applyFilter};
const priorChange=window.FRBrand?.onChange;
if(window.FRBrand)window.FRBrand.onChange=(...args)=>{if(typeof priorChange==='function')priorChange(...args);updateLocale()};
function syncNav(){
 const home=!document.getElementById('home')?.hidden;
 document.querySelectorAll('[data-fr-nav]').forEach(el=>{
  const active=el.dataset.frNav===(home?'home':'games');
  if(el.dataset.frNav==='league'||el.dataset.frNav==='account')return;
  el.classList.toggle('active',active);
  if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
 });
}
window.addEventListener('popstate',()=>requestAnimationFrame(syncNav));
document.addEventListener('click',e=>{if(e.target.closest('[data-play],[data-home],[data-games],[data-game]'))requestAnimationFrame(syncNav)});
syncNav();
updateLocale();
})();

/* FR33 STAGE06 — Hub functions */
/* FOOTBALL RIVALS FR33 / Stage 06 — UI layer. The original game routes and engines are untouched. */
(()=>{'use strict';
const games=document.getElementById('games'),modes=document.getElementById('modes');
const covers=document.getElementById('frHomeCovers');
if(!games||!modes||!covers||covers.querySelectorAll('.fr-cover').length!==8)return;
document.body.classList.add('fr33-hub');
const categories={knowledge:['star','secret30','hiddenxi','dobak'],duels:['penalty'],clubs:['club']};
const titles={
star:['مين النجم؟',"Who's the Star?"],secret30:['السر 30','Secret 30'],
penalty:['صراع الجزاء','Penalty Clash'],dobak:['يا دوبك','Ya Dobak'],hiddenxi:['اللاعب الخفي','Hidden XI'],
club:['إمبراطورية النادي','Club Empire']};
const ar=()=>document.documentElement.lang!=='en',L=(a,b)=>ar()?a:b;
const $=s=>document.querySelector(s);
const status=document.createElement('div');status.id='fr33LibraryStatus';status.className='fr33-library-status';status.setAttribute('aria-live','polite');
const count=document.createElement('span');count.id='fr33LibraryCount';
const clear=document.createElement('button');clear.type='button';clear.id='fr33LibraryReset';
status.append(count,clear);covers.before(status);
const search=$('#frLibrarySearch'),empty=$('#frLibraryEmpty');
let filter='all';
function visible(){
 const term=(search?.value||'').trim().toLocaleLowerCase();
 return [...covers.querySelectorAll('.fr-cover')].filter(x=>{let id=x.dataset.game;return (filter==='all'||categories[filter]?.includes(id))&&
  (!term||[id,...(titles[id]||[])].some(s=>s.toLocaleLowerCase().includes(term)))}).length;
}
function refresh(){
 const active=$('#games [data-fr-filter].active');
 filter=active?.dataset.frFilter||'all';
 const n=visible();
 count.textContent=L(n+' من '+covers.querySelectorAll('.fr-cover').length+' ألعاب متاحة',n+' of '+covers.querySelectorAll('.fr-cover').length+' games available');
 clear.textContent=L('↺ مسح الفلاتر','↺ Clear filters');
 clear.hidden=!(filter!=='all'||(search?.value||'').trim());
 search?.setAttribute('placeholder',L('ابحث باسم اللعبة بالعربي أو الإنجليزي','Search games in Arabic or English'));
 search?.setAttribute('aria-label',L('ابحث عن لعبة','Search games'));
 if(empty&&!empty.hidden)empty.textContent=L('مفيش ألعاب مطابقة. امسح الفلاتر أو جرّب اسم تاني.','No matching games. Clear filters or try another name.');
}
function soon(){requestAnimationFrame(refresh)}
search?.addEventListener('input',soon);
games.addEventListener('click',e=>{if(e.target.closest('[data-fr-filter]'))soon()});
clear.addEventListener('click',()=>{search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));const reset=$('#games [data-fr-filter="all"]');reset?.click();search.focus();soon()});
const detail=document.createElement('div');detail.className='fr33-mode-details';detail.id='fr33ModeDetails';
const headline=document.createElement('div');headline.className='fr33-mode-meta';
const modeCount=document.createElement('span');modeCount.id='fr33ModeCount';
const guide=document.createElement('details');guide.className='fr33-quick-rules';
const guideSummary=document.createElement('summary');
const ruleList=document.createElement('ol');guide.append(guideSummary,ruleList);
detail.append(headline,guide);$('#modeBanner')?.after(detail);
let lastId=null,lastLang=null,lastModeCount=-1;
function resolveGame(){
 const queryId=new URLSearchParams(location.search).get('game');
 const ids=Object.keys(titles);
 if(queryId&&ids.includes(queryId))return queryId;
 const banner=$('#modeBanner');
 const classMatch=banner?.querySelector('.thumb')?.className.match(/\b(star|dobak|hiddenxi)\b/);
 return classMatch?.[0]||null;
}
function renderDetails(){
 const id=resolveGame(),l=ar()?'ar':'en',cnt=$('#modesList')?.querySelectorAll('a.mode').length||0;
 if(!id||!titles[id])return;
 if(id===lastId&&l===lastLang&&cnt===lastModeCount)return;
 lastId=id;lastLang=l;lastModeCount=cnt;
 const banner=$('#modeBanner');if(banner){banner.dataset.fr33Game=id;banner.style.setProperty('--fr33-cover','url("/assets/brand/covers-ar/'+id+'.webp")')}
 const metadata=window.FRBrand?.content?.[id]?.[l];
 const explanation=Array.isArray(metadata?.how)?metadata.how:[];
 modeCount.textContent=L(cnt+' أوضاع لعب متاحة',cnt+' available game modes');
 headline.replaceChildren();
 const title=document.createElement('strong');title.textContent=titles[id][ar()?0:1];
 headline.append(title,modeCount);
 guideSummary.textContent=L('ⓘ إزاي تلعب؟ افتح الشرح','ⓘ How to play? View guide');
 ruleList.replaceChildren();explanation.forEach(s=>{const li=document.createElement('li');li.textContent=s;ruleList.appendChild(li)});
 guide.hidden=!explanation.length;
}
const banner=$('#modeBanner');
if(banner)new MutationObserver(()=>requestAnimationFrame(renderDetails)).observe(banner,{childList:true,subtree:false});
const ml=$('#modesList');
if(ml)new MutationObserver(()=>requestAnimationFrame(renderDetails)).observe(ml,{childList:true});
new MutationObserver(()=>{refresh();renderDetails()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.addEventListener('popstate',()=>requestAnimationFrame(renderDetails));
document.addEventListener('click',e=>{if(e.target.closest('[data-game],[data-genre],[data-games]'))requestAnimationFrame(renderDetails)});
const total=(document.querySelectorAll('#frHomeCovers .fr-cover').length||3);
document.querySelectorAll('#home .fr-home-featured').forEach(el=>el.setAttribute('data-fr33-count',String(total)));
refresh();renderDetails();
})();
