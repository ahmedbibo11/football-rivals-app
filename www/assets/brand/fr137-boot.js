/* FR137: safe activation and an updated, versioned static cache. */
(()=>{'use strict';
const meta=document.querySelector('meta[name="fr-build"]');
window.FR137_BUILD=meta?.content||'fr137';
// Speculatively rendered pages must never modify a game before the user opens them.
if(document.prerendering){
 const realFetch=window.fetch.bind(window),blocked=new Map();
 window.fetch=function(input,init){
  let u;try{u=new URL(typeof input==='string'?input:input.url,location.href)}catch{return realFetch(input,init)}
  if(u.origin!==location.origin||!u.pathname.startsWith('/api/'))return realFetch(input,init);
  let op='';try{op=JSON.parse(init?.body||'{}').op||''}catch{}
  const safe=(u.pathname==='/api/rivals-account'&&['session','history'].includes(op))||
   (u.pathname==='/api/fr93-results'&&op==='history')||(u.pathname==='/api/fr95-voice'&&op==='history');
  if(safe)return realFetch(input,init);
  const key=op==='state'||op==='svState'?u.pathname+':'+op:'';
  if(key&&blocked.has(key))return blocked.get(key).then(r=>r.clone());
  const pending=new Promise((resolve,reject)=>{
   const run=()=>{if(init?.signal?.aborted){reject(new DOMException('Aborted','AbortError'));return}realFetch(input,init).then(resolve,reject)};
   if(!document.prerendering)run();else document.addEventListener('prerenderingchange',run,{once:true});
  });
  if(!key)return pending;
  blocked.set(key,pending);pending.finally(()=>blocked.delete(key)).catch(()=>{});return pending.then(r=>r.clone());
 };
}
if('serviceWorker'in navigator&&location.protocol==='https:'){
 let done=false;const register=()=>{if(done||document.prerendering)return;done=true;navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{})};
 if(document.prerendering)document.addEventListener('prerenderingchange',register,{once:true});
 else if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
}
})();

;(()=>{'use strict';
 const css=document.createElement('style');css.textContent='html body.fr99-site nav#fr99-global-nav.fr42-dock,html body.fr42-home nav.fr-bottom-nav[aria-label]{grid-template-columns:repeat(4,minmax(0,1fr))!important} html body.fr99-site #fr99-global-nav [data-fr-nav=cards] .fr-nav-icon::before,html body.fr42-home nav.fr-bottom-nav [data-fr-nav=cards] .fr-nav-icon::before{content:"🃏"!important;font-size:23px!important}';document.head.append(css);
 function homeNav(){if(location.pathname!=="/")return;const nav=document.querySelector('nav.fr-bottom-nav');if(!nav)return;nav.style.setProperty('grid-template-columns','repeat(4,minmax(0,1fr))','important');if(nav.querySelector('[data-fr-nav=cards]'))return;const a=document.createElement('a');a.href='/players/';a.dataset.frNav='cards';a.setAttribute('aria-label','مكتبة الكروت');a.innerHTML='<span class="fr-nav-icon" aria-hidden="true"></span><span data-fr-arena-ar="الكروت" data-fr-arena-en="Cards">الكروت</span>';const account=nav.querySelector('[data-fr-nav=account]');account?nav.insertBefore(a,account):nav.append(a)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',homeNav,{once:true});else homeNav();
})();
