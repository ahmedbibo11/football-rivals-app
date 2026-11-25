/* FOOTBALL RIVALS 31: Global site navigation, independent of game tabs and controls. */
(()=>{'use strict';if(window.FRNav31)return;window.FRNav31={version:'31.0'};
const path=location.pathname.replace(/\/index\.html$/,'/');
const hub=path==='/'||/^\/(account|rivals-league|rivals-seasons)\/?$/.test(path);
const key=path.startsWith('/account/')?'account':path.startsWith('/rivals-')?'games':path==='/'?(new URLSearchParams(location.search).get('view')==='games'?'games':'home'):'games';
const txt={home:['الرئيسية','Home'],games:['الألعاب','Games'],account:['حسابي','Profile']};
const items=[['home','/','⌂'],['games','/?view=games','✦'],['account','/account/','♙']];
let bar,back;
function sync(){
 const en=document.documentElement.lang==='en';
 if(back){back.setAttribute('aria-label',en?'Back to games':'الرجوع إلى الألعاب');const label=back.querySelector('.fr31-back-label');if(label)label.textContent=en?'Games':'الألعاب';}
 if(bar){bar.setAttribute('aria-label',en?'Main navigation':'التنقل الرئيسي');bar.querySelectorAll('[data-fr31-nav]').forEach(a=>{let k=a.dataset.fr31Nav;a.querySelector('.fr31-nav-label').textContent=txt[k][+en];a.setAttribute('aria-label',txt[k][+en]);a.classList.toggle('active',k===key);if(k===key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});}
 document.querySelectorAll('nav.fr-bottom-nav [data-fr-nav]').forEach(a=>{const k=a.dataset.frNav;if(!txt[k])return;a.setAttribute('aria-label',txt[k][+en]);a.classList.toggle('active',k===key);if(k===key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
}
function mount(){
 const header=document.querySelector('body.fr28-universe>.fr28-header');if(!header)return;
 const oldDock=document.querySelector('.fr-brand-dock');if(oldDock)oldDock.style.setProperty('display','none','important');
 document.body.classList.add('fr31-navigation',hub?'fr31-hub':'fr31-game');
 const inner=header.querySelector('.fr28-header-inner');
 if(!hub&&inner&&!inner.querySelector('.fr31-back')){
  back=document.createElement('a');back.className='fr31-back';back.href='/?view=games';back.innerHTML='<span class="fr31-back-icon" aria-hidden="true">‹</span><span class="fr31-back-label"></span>';
  inner.insertBefore(back,inner.querySelector('.fr28-controls'));
 }
 if(hub&&!document.querySelector('nav.fr-bottom-nav,nav.fr31-site-nav')){
  bar=document.createElement('nav');bar.className='fr31-site-nav';
  for(const [k,href,icon] of items){const a=document.createElement('a');a.href=href;a.dataset.fr31Nav=k;a.innerHTML='<span class="fr31-nav-symbol" aria-hidden="true">'+icon+'</span><span class="fr31-nav-label"></span>';bar.append(a);}
  document.body.append(bar);
  // The legacy shell may add its own navigation after our mount: never allow two.
  const oneNav=new MutationObserver(()=>{if(document.querySelector('nav.fr-bottom-nav')){bar?.remove();bar=null;oneNav.disconnect();}});
  oneNav.observe(document.body,{childList:true,subtree:true});

 }else document.querySelector('nav.fr-bottom-nav')?.classList.add('fr31-existing-site-nav');
 sync();
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
