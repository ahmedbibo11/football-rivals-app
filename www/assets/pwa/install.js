/* FOOTBALL RIVALS — professional PWA install flow */
(()=>{'use strict';if(window.FRPwaInstall)return;window.FRPwaInstall=true;
let deferredPrompt=null,dialog=null,lastFocus=null;
const copy={
 ar:{title:'ثبّت FOOTBALL RIVALS',subtitle:'افتح كل الألعاب من أيقونة على موبايلك، بدون شريط المتصفح',install:'⬇ ثبّت التطبيق',modalTitle:'خلّي الملعب على موبايلك',ios:'اضغط زر <b>المشاركة</b> في المتصفح، ثم اختر <b>إضافة إلى الشاشة الرئيسية</b>، وبعدها <b>إضافة</b>.',android:'افتح قائمة المتصفح <b>⋮</b> ثم اختر <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b>. يُفضّل Chrome.',desktop:'من قائمة Chrome أو Edge اختر <b>Install app / تثبيت التطبيق</b> أو اضغط علامة التثبيت بجوار عنوان الموقع.',intro:'يتثبت بشعار FOOTBALL RIVALS ويفتح في نافذة مستقلة. اللعب أونلاين يحتاج اتصالًا بالإنترنت.',done:'تمام',success:'تم إرسال طلب التثبيت',generic:'لو خيار التثبيت مش ظاهر، افتح الموقع في Chrome أو Safari وجرب من قائمة المتصفح.'},
 en:{title:'Install FOOTBALL RIVALS',subtitle:'Launch every game from your home screen, with no browser address bar',install:'⬇ Install app',modalTitle:'Your football arena, one tap away',ios:'Tap <b>Share</b> in your browser, then <b>Add to Home Screen</b>, and finally <b>Add</b>.',android:'Open your browser menu <b>⋮</b> and choose <b>Install app</b> or <b>Add to Home screen</b>. Chrome is recommended.',desktop:'In Chrome or Edge, choose <b>Install app</b> from the menu, or click the install icon in the address bar.',intro:'Install FOOTBALL RIVALS with its official logo. It opens in its own app window. Online games still need internet.',done:'Got it',success:'Install request sent',generic:'If Install is unavailable, open this site in Chrome or Safari and use its menu.'}
};
const language=()=>document.documentElement.lang==='en'?'en':'ar';
const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
const ua=()=>navigator.userAgent||'';
const platform=()=>/iphone|ipad|ipod/i.test(ua())||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1?'ios':/android/i.test(ua())?'android':'desktop';
function close(){if(!dialog)return;dialog.hidden=true;document.body.style.overflow='';lastFocus?.focus?.()}
function show(){if(!dialog){dialog=document.createElement('div');dialog.id='frPwaDialog';dialog.hidden=true;dialog.innerHTML='<section class="fr-pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="frPwaSheetTitle"><button type="button" class="fr-pwa-close" aria-label="Close">×</button><img src="/assets/pwa/icon-192.png" alt="FOOTBALL RIVALS"><h2 id="frPwaSheetTitle"></h2><p id="frPwaSheetIntro"></p><div class="fr-pwa-steps" id="frPwaSteps"></div><button type="button" class="fr-pwa-done"></button></section>';document.body.append(dialog);dialog.querySelector('.fr-pwa-close').addEventListener('click',close);dialog.querySelector('.fr-pwa-done').addEventListener('click',close);dialog.addEventListener('click',e=>{if(e.target===dialog)close()})}
 const v=copy[language()];dialog.querySelector('#frPwaSheetTitle').textContent=v.modalTitle;dialog.querySelector('#frPwaSheetIntro').textContent=v.intro;
 dialog.querySelector('#frPwaSteps').innerHTML=v[platform()]||v.generic;dialog.querySelector('.fr-pwa-done').textContent=v.done;
 lastFocus=document.activeElement;dialog.hidden=false;document.body.style.overflow='hidden';dialog.querySelector('.fr-pwa-close').focus()
}
function hideBanner(){const banner=document.getElementById('frPwaPromo');if(banner)banner.hidden=true;close()}
function render(){const banner=document.getElementById('frPwaPromo');if(!banner)return;if(standalone()){hideBanner();return}
const v=copy[language()];banner.hidden=false;
banner.querySelector('.fr-pwa-info strong').textContent=v.title;
banner.querySelector('.fr-pwa-info small').textContent=v.subtitle;
banner.querySelector('.fr-pwa-cta').textContent=v.install;
}
async function requestInstall(){if(standalone()){hideBanner();return}const e=deferredPrompt;if(e){deferredPrompt=null;try{await e.prompt();const choice=await e.userChoice;if(choice?.outcome==='accepted'){hideBanner()}else render()}catch(err){show()}return}show()}
function init(){const location=document.querySelector('.first-actions');if(!location)return;
const el=document.createElement('section');el.id='frPwaPromo';el.setAttribute('aria-label','FOOTBALL RIVALS installation');
el.innerHTML='<img class="fr-pwa-logo" src="/assets/pwa/icon-192.png" alt="" width="58" height="58"><div class="fr-pwa-info"><strong></strong><small></small></div><button type="button" class="fr-pwa-cta" id="frPwaInstallBtn"></button>';
location.insertAdjacentElement('afterend',el);el.querySelector('#frPwaInstallBtn').addEventListener('click',requestInstall);
render();new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.addEventListener('appinstalled',hideBanner);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog&&!dialog.hidden)close()});
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;render()});
if('serviceWorker' in navigator&&location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(err=>console.warn('FR PWA SW:',err)),{once:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();