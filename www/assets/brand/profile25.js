(()=>{'use strict';
if(window.FRProfile25||!/^\/account\/?(?:index\.html)?$/.test(location.pathname))return;
const dash=document.querySelector('#dashboard');if(!dash)return;
window.FRProfile25={version:'25.0'};
const keys=['overview','matches','friends','identity','settings'];
const names=['نظرة عامة','مبارياتي','الأصدقاء','هويتي','الإعدادات'];
const namesEn=['Overview','Matches','Friends','Identity','Settings'];
const icons=['◈','⚔','♧','♕','⚙'];
const stats=dash.querySelector(':scope>.stats-strip'),cols=dash.querySelector(':scope>.columns'),identity=dash.querySelector(':scope>.identity');
if(!stats||!cols||!identity)return;
const main=document.createElement('div');main.className='fr25-command-center';
const tabs=document.createElement('nav');tabs.className='fr25-profile-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','أقسام البروفايل');
for(let i=0;i<keys.length;i++){const b=document.createElement('button');b.type='button';b.id='fr25-tab-'+keys[i];b.dataset.fr25Tab=keys[i];b.setAttribute('role','tab');b.setAttribute('aria-controls','fr25-pane-'+keys[i]);b.innerHTML='<span aria-hidden="true">'+icons[i]+'</span><span class="fr25-tab-label">'+names[i]+'</span>';tabs.appendChild(b)}
main.appendChild(tabs);
for(const key of keys){let panel=document.createElement('div');panel.className='fr25-pane';panel.id='fr25-pane-'+key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','fr25-tab-'+key);main.appendChild(panel)}
const overview=main.querySelector('#fr25-pane-overview');
overview.innerHTML='<div class="fr25-intro"><span class="fr25-eyebrow">RIVALS COMMAND CENTER · 25.0</span><h2>ملعبك. تاريخك. منافسيك.</h2><p>حسابك الكروي بالكامل في مكان واحد — اختار القسم اللي محتاجه.</p></div><div class="fr25-quick-grid"><button data-fr25-go="matches"><span>⚔️</span><strong>مبارياتي</strong><small>التاريخ والمنافسات</small></button><button data-fr25-go="friends"><span>🤝</span><strong>الأصدقاء</strong><small>الدعوات والدوريات</small></button><button data-fr25-go="identity"><span>🎨</span><strong>هويتي</strong><small>الصورة والشعار والنادي</small></button><button data-fr25-go="settings"><span>⚙️</span><strong>إعداداتي</strong><small>الأمان وكلمة السر</small></button></div><div class="fr25-overview-line"><span>⚡ جاهز للتحدي؟</span><a href="/?view=games">استكشف الألعاب ←</a></div>';
const socialHost=document.createElement('div');socialHost.id='fr25-social-host';socialHost.className='fr25-social-host';socialHost.hidden=true;main.appendChild(socialHost);
stats.insertAdjacentElement('afterend',main);
const match=cols.querySelector('.col-main>.main-panel'),side=cols.querySelectorAll('.col-side>.side-panel');
if(match)main.querySelector('#fr25-pane-matches').append(match);
if(side[0])main.querySelector('#fr25-pane-identity').append(side[0]);
if(side[1])main.querySelector('#fr25-pane-settings').append(side[1]);
if(side[2])main.querySelector('#fr25-pane-settings').append(side[2]);
const logout=identity.querySelector('#logout');
if(logout){const wrap=document.createElement('div');wrap.className='fr25-logout';wrap.append(logout);main.querySelector('#fr25-pane-settings').append(wrap)}
cols.classList.add('fr25-original-columns');cols.hidden=true;
let current='overview',social=null,scheduled=false;
const urlTab=new URL(location.href).searchParams.get('profileTab');if(keys.includes(urlTab))current=urlTab;
function render(){
 document.body.classList.toggle('fr25-signed-in',!dash.classList.contains('hidden'));
 dash.dataset.fr25Tab=current;
 for(const key of keys){const active=key===current,b=main.querySelector('#fr25-tab-'+key),pane=main.querySelector('#fr25-pane-'+key);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;pane.hidden=!active}
 socialHost.hidden=!social||!['identity','friends'].includes(current);
 if(social){social.classList.toggle('fr25-social-friends',current==='friends');social.classList.toggle('fr25-social-identity',current==='identity')}
}
function switchTo(key,scroll=true){if(!keys.includes(key))return;current=key;render();if(scroll&&scrollY>250)tabs.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'})}
function moveSocial(){let elem=dash.querySelector('#social24');if(!elem||elem===social)return;social=elem;socialHost.append(elem);render()}
main.addEventListener('click',e=>{let x=e.target.closest('[data-fr25-tab],[data-fr25-go]');if(x)switchTo(x.dataset.fr25Tab||x.dataset.fr25Go)});
tabs.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;let i=keys.indexOf(current);const j=e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowLeft'?-1:1)+keys.length)%keys.length;e.preventDefault();switchTo(keys[j],false);main.querySelector('#fr25-tab-'+keys[j]).focus()});
function syncLang(){const en=document.documentElement.lang==='en';keys.forEach((k,i)=>{main.querySelector('#fr25-tab-'+k+' .fr25-tab-label').textContent=en?namesEn[i]:names[i]})}
new MutationObserver(()=>{moveSocial();render()}).observe(dash,{attributes:true,attributeFilter:['class'],childList:true});
new MutationObserver(syncLang).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
moveSocial();render();syncLang();
})();