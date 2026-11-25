(()=>{'use strict';
function boot(){
 if(!document.body.classList.contains('fr-shell-secondary'))return;
 const head=document.querySelector('header.nav,header.navbar');
 if(!head||head.querySelector('.fr26-switch'))return;
 const bar=document.createElement('div');bar.className='fr26-switch';bar.setAttribute('role','group');bar.setAttribute('aria-label','Language');
 bar.innerHTML='<div class="fr26-group fr26-lang"><button type="button" data-fr26-lang="ar" aria-label="العربية">عربي</button><button type="button" data-fr26-lang="en" aria-label="English">EN</button></div>';
 head.append(bar);head.classList.add('fr26-ready');
 const legacy=head.querySelector('.fr-shell-controls');if(legacy)legacy.hidden=true;
 function sync(){
 const lang=document.documentElement.lang==='en'?'en':'ar';
 bar.querySelectorAll('button').forEach(btn=>{
  const active=btn.dataset.fr26Lang===lang;
  btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active))
 });
 }
 bar.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const api=window.FRBrand;
  if(b.dataset.fr26Lang)api?.setLang?.(b.dataset.fr26Lang);
  
  sync();
 });
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();