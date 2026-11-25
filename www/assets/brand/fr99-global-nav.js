/* FR99 — one persistent native FOOTBALL RIVALS navigation for the entire application.
   Created outside game roots, so changing an auction stage never duplicates the dock. */
(()=>{'use strict';
 const ID='fr99-global-nav';
 const labels={home:'الرئيسية',games:'الألعاب',cards:'الكروت',account:'حسابي'};
 const links={home:'/',games:'/?view=games',cards:'/players/',account:'/account/'};
 let observer=null,syncing=false;
 function currentTab(){
  const path=location.pathname;
  if(/^\/players(?:\/|$)/.test(path))return 'cards';
  if(/^\/account(?:\/|$)/.test(path))return 'account';
  if(path==='/'&&!['games','auction','collection'].includes(new URLSearchParams(location.search).get('view')||''))return 'home';
  return 'games';
 }
 function markup(){
  const nav=document.createElement('nav');
  nav.id=ID;nav.className='fr-bottom-nav fr42-dock';nav.setAttribute('aria-label','التنقل الرئيسي في FOOTBALL RIVALS');
  nav.setAttribute('data-fr99-unified','1');nav.setAttribute('dir','rtl');
  nav.innerHTML=['home','games','cards','account'].map(k=>'<a data-fr-nav="'+k+'" href="'+links[k]+'"><span class="fr-nav-icon" aria-hidden="true"></span><span>'+labels[k]+'</span></a>').join('');
  return nav;
 }
 function install(){
  if(!document.body)return;
  document.body.classList.add('fr99-site');
  let nav=document.getElementById(ID);
  if(!nav){nav=markup();document.body.appendChild(nav)}
  else if(nav.parentElement!==document.body)document.body.appendChild(nav);
  nav.style.setProperty('grid-template-columns','repeat(4,minmax(0,1fr))','important');
  const active=currentTab();
  nav.querySelectorAll('a[data-fr-nav]').forEach(a=>{
   const on=a.dataset.frNav===active;
   if(a.classList.contains('active')!==on)a.classList.toggle('active',on);
   if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  // Legacy docks remain in DOM for compatibility with their old page scripts,
  // but only the one shared dock can ever be visible (enforced in CSS).
  document.querySelectorAll('nav:not(#'+ID+')').forEach(el=>{
    if(el.matches('.fr-bottom-nav,.fr31-site-nav,.fr98-dock,.fr95-bottom,.fr42-dock')||
       (el.hasAttribute('data-fr99-legacy')===false && el.querySelector('[data-fr-nav]') && el.closest('body'))){
      if(!el.hasAttribute('data-fr99-legacy'))el.setAttribute('data-fr99-legacy','1');
    }
  });
 }
 function schedule(){
  if(syncing)return;
  syncing=true;
  requestAnimationFrame(()=>{syncing=false;install()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 document.addEventListener('click',ev=>{if(ev.target.closest('#'+ID+' a'))schedule()},{passive:true});
 window.addEventListener('popstate',schedule);
 window.addEventListener('hashchange',schedule);
 window.addEventListener('pageshow',schedule);
 if(document.documentElement){
  observer=new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))schedule()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
 }
})();
