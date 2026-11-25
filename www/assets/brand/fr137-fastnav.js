/* FR137: warm only public assets; never cache or pre-open a live room. */
(()=>{'use strict';
const routes=['/account/','/auction/','/auction/five/','/auction/ultimate/','/auction/first-pick/','/hidden-xi/','/ya-dobak/','/who-star/'];
const app=new Set(routes),seenPages=new Set(),seenAssets=new Set();
const hero={'/who-star/':'/assets/brand/covers-ar/star.webp','/ya-dobak/':'/assets/brand/covers-ar/dobak.webp','/hidden-xi/':'/assets/brand/covers-ar/hiddenxi.webp','/auction/five/':'/assets/fr137/fiveentry.webp','/auction/ultimate/':'/assets/auction/ultimate/entry-fr83.webp?v=fr84','/auction/first-pick/':'/assets/auction/firstpick/entry-fr96.webp?v=fr98'};
const slow=()=>!!(navigator.connection?.saveData||/^(slow-2g|2g|3g)$/.test(navigator.connection?.effectiveType||''));
let chosen='',rule=null,stopped=false;
function sessionFor(path){
 try{
  const keys={'/hidden-xi/':'fr_hidden_xi_v1','/ya-dobak/':'fr13-dobak','/who-star/':'fr:starverse:v2:active','/auction/first-pick/':'fr95:firstpick:session'};
  return !!(keys[path]&&localStorage.getItem(keys[path]));
 }catch{return true}
}
function routeOf(raw){
 try{
  const u=new URL(raw,location.href);if(u.origin!==location.origin||u.hash)return null;
  if(u.pathname==='/'&&u.search==='?view=games')return '/?view=games';
  if(!app.has(u.pathname)||u.search)return null;
  return u.pathname;
 }catch{return null}
}
function prefetchDoc(path){
 if(seenPages.has(path)||slow()||document.prerendering)return;seenPages.add(path);
 const link=document.createElement('link');link.rel='prefetch';link.as='document';link.href=path;document.head.appendChild(link);
}
function prerender(path){
 if(!path||slow()||document.prerendering||sessionFor(path)||path===chosen||!HTMLScriptElement.supports?.('speculationrules'))return;
 if(path==='/'||path===location.pathname+location.search)return;
 chosen=path;if(rule)rule.remove();
 rule=document.createElement('script');rule.type='speculationrules';rule.textContent=JSON.stringify({prerender:[{source:'list',urls:[path],eagerness:'eager'}]});document.head.appendChild(rule);
}
function guess(e){
 const a=e.target.closest?.('a[href]');let path=a?routeOf(a.href):null;
 if(!path){const item=e.target.closest?.('[data-game]'),id=item?.dataset.game;path={star:'/who-star/',dobak:'/ya-dobak/',hiddenxi:'/hidden-xi/',auction:'/auction/'}[id]||null}
 if(path){prefetchDoc(path);prerender(path)}
}
for(const event of ['pointerover','pointerdown','touchstart','focusin'])document.addEventListener(event,guess,{capture:true,passive:true});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function loadPublicAsset(url){
 if(stopped||seenAssets.has(url))return;seenAssets.add(url);
 try{await fetch(url,{credentials:'same-origin',cache:'force-cache',priority:'low'})}catch{}
}
async function warm(path){
 if(stopped||slow())return;
 try{
  const res=await fetch(path,{credentials:'same-origin',cache:'no-cache',priority:'low'});if(!res.ok)return;
  const html=await res.text(),tags=html.match(/<(?:script|link)\b[^>]*>/gi)||[],urls=[];
  for(const tag of tags){
   const m=tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i);if(!m)continue;
   const u=new URL(m[1],new URL(path,location.origin));
   if(u.origin===location.origin&&/\.(js|css)$/i.test(u.pathname)&&u.searchParams.has('frb')&&!seenAssets.has(u.href))urls.push(u.href);
  }
  if(hero[path]){const x=new URL(hero[path],location.origin);x.searchParams.set('frb',window.FR137_BUILD||'fr137');urls.unshift(x.href)}
  for(let i=0;i<urls.length&&!stopped;i+=3){await Promise.all(urls.slice(i,i+3).map(loadPublicAsset));await delay(100)}
 }catch{}
}
async function background(){
 if(slow()||document.prerendering)return;
 const qs=new URLSearchParams(location.search);
 if(location.pathname!=='/'&&(qs.has('room')||qs.has('join')||sessionFor(location.pathname)))return;
 if('serviceWorker'in navigator)try{await Promise.race([navigator.serviceWorker.ready,delay(2500)])}catch{}
 const path=location.pathname;
 const list=path==='/'?['/account/','/who-star/','/auction/','/ya-dobak/','/hidden-xi/']:
  path==='/auction/'?['/auction/five/','/auction/ultimate/','/auction/first-pick/','/account/']:
  ['/account/','/auction/','/who-star/'];
 for(const next of list){if(stopped||document.hidden||slow())break;await warm(next);await delay(200)}
}
window.addEventListener('pagehide',()=>{stopped=true});
window.addEventListener('pageshow',e=>{stopped=false;if(e.persisted)idle(background)});
const idle=window.requestIdleCallback?(fn=>window.requestIdleCallback(fn,{timeout:2000})):(fn=>setTimeout(fn,1200));
if(document.prerendering)document.addEventListener('prerenderingchange',()=>idle(background),{once:true});else idle(background);
})();
