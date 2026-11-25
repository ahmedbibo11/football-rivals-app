/* FOOTBALL RIVALS 28.0 -- same visual application header throughout, not gameplay replacement. */
(()=>{'use strict';if(window.FRUniverse28)return;window.FRUniverse28={version:'28.0'};
const route=location.pathname.replace(/\/index\.html$/,'/');
const ids={home:'/',games:'/?view=games',league:'/rivals-league/',account:'/account/'};
const sections=[{id:'home',ar:'الرئيسية',en:'Home',icon:'⌂'},{id:'games',ar:'الألعاب',en:'Games',icon:'🎮'},{id:'league',ar:'الدوري',en:'League',icon:'🏆'},{id:'account',ar:'حسابي',en:'Profile',icon:'♙'}];
const isHome=route==='/'||route==='',isLeague=/^\/rivals-(league|seasons)\/?$/.test(route),isAccount=route.startsWith('/account/');
const game=route.includes('who-star')?'star':route.includes('hidden-xi')?'hiddenxi':route.includes('ya-dobak')?'dobak':'other';
const escapeAttr=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function mount(){
 if(document.querySelector('.fr28-header'))return;
 document.body.classList.add('fr28-universe','fr28-route-'+(isHome?'home':isLeague?'league':isAccount?'account':game));
 const bar=document.createElement('header');bar.className='fr28-header';bar.setAttribute('role','banner');
 bar.innerHTML='<div class="fr28-header-inner"><a class="fr28-wordmark" href="/" aria-label="FOOTBALL RIVALS"><img src="/assets/brand/logo-fr.svg" width="43" height="43" alt="" decoding="async"><span><strong>FOOTBALL <em>RIVALS</em></strong><small>THE GAME ARENA</small></span></a><div class="fr28-controls" role="group" aria-label="Language"><div class="fr28-pair fr28-langs"><button type="button" data-fr28-lang="ar">عربي</button><button type="button" data-fr28-lang="en">EN</button></div></div></div>';
 document.body.insertBefore(bar,document.body.firstChild);
 // Preserve functional game buttons: style old game header as a compact controls row, instead of deleting game actions.
 if(!isHome&&!isLeague&&!isAccount){const old=document.querySelector('header.topbar,header.bar,body.fr70-penalty header');if(old){
 old.classList.add('fr28-context');if(['star','secret30','penalty'].includes(game))old.classList.add('fr28-context-empty');
 }}
 const oldDock=document.querySelector('.fr-brand-dock');if(oldDock)oldDock.setAttribute('aria-hidden','true');
 function sync(){
  const language=document.documentElement.lang==='en'?'en':'ar';
  
  bar.querySelectorAll('button').forEach(b=>{const active=b.dataset.fr28Lang===language;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
  if(document.body.classList.contains('fr28-universe'))document.body.dir=document.documentElement.dir;
 }
 bar.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;
 const brand=window.FRBrand;
 if(b.dataset.fr28Lang)brand?.setLang?.(b.dataset.fr28Lang);
 
 sync();});
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
 sync();
 function attachStyles(){let l=document.getElementById('fr28-universe-css');if(!l){l=document.createElement('link');l.rel='stylesheet';l.id='fr28-universe-css';l.href='/assets/brand/fr30-theme.css?v=fr38-darkonly';document.head.append(l);}/* Keep stylesheet in the original head order. */}
 attachStyles();/* Already preloaded: never move CSS after load. */
 if(!document.querySelector('script[data-fr31-nav-loader]')){const nav=document.createElement('script');nav.src='/assets/brand/fr31-nav.js?v=fr41-three-nav';nav.defer=true;nav.dataset.fr31NavLoader='true';document.head.append(nav);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();