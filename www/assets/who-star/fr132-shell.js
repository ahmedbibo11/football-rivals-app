(()=>{'use strict';
function localize(){const en=document.documentElement.lang==='en';document.querySelectorAll('[data-fr132-ar][data-fr132-en]').forEach(el=>{el.textContent=en?el.dataset.fr132En:el.dataset.fr132Ar});const button=document.querySelector('[data-fr132-language]');if(button){button.textContent=en?'عربي':'EN';button.setAttribute('aria-label',en?'التبديل إلى العربية':'Switch to English')}}
document.addEventListener('click',event=>{const language=event.target.closest('[data-fr132-language]');if(language){window.FRBrand?.setLang(document.documentElement.lang==='en'?'ar':'en');localize();return}const rules=event.target.closest('[data-fr132-rules]');if(rules){const box=document.getElementById('fr132-rules');if(box){box.open=true;box.scrollIntoView({behavior:'smooth',block:'start'})}}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',localize,{once:true});else localize();
new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
