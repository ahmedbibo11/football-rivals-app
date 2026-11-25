/* FOOTBALL RIVALS — FR115 V3 landing-only enhancement for ULTIMATE XI.
   Does not bind/replace game action handlers or touch active match screens.
   Five landing is CSS-only because FR108 already has all required content.
*/
(()=>{'use strict';
  if (!location.pathname.startsWith('/auction/ultimate')) return;
  const root=document.getElementById('ux-app'); if(!root)return;
  let pending=false;
  function enhance(){
    const hero=root.querySelector('.fr105-root.fr105-ultimate .fr105-hero');
    if(!hero || hero.dataset.fr115Ready==='1')return;
    const heading=hero.querySelector('.fr105-heading');
    if(heading && !heading.querySelector('.fr115-lede')){
      const p=document.createElement('p'); p.className='fr115-lede';
      p.textContent='كوّن تشكيلتك الأسطورية ونافس على نجوم الكرة، ثم احسم المواجهة على أرض الملعب.';
      heading.append(p);
    }
    const metrics=hero.querySelectorAll('.fr105-metric');
    if(metrics.length===3){
      const number=metrics[1].querySelector('strong');
      const label=metrics[1].querySelector('span');
      if(number)number.textContent='11+7';
      if(label)label.textContent='أساسي وبدلاء';
    }
    hero.dataset.fr115Ready='1';
  }
  const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;enhance();});});
  observer.observe(root,{childList:true,subtree:true});
  enhance();
})();
