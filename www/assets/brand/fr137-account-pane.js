/* Home, games and account share the existing document and one bottom bar. */
(()=>{'use strict';
if(location.pathname!=='/')return;
const body=document.body,home=document.querySelector('body > .app'),backdrop=document.querySelector('body > .backdrop'),nav=document.querySelector('body > nav.fr-bottom-nav');
if(!home||!nav||document.getElementById('root'))return;
const profileStyles=['/account/fr92-profile.css?v=fr941','/account/fr93-unified.css?v=fr93','/assets/brand/fr135.css?v=fr135'];
const bodyFlags=['fr-home-brand','fr42-home','fr28-universe','fr93-profile'];
const originalFlags=Object.fromEntries(bodyFlags.map(c=>[c,body.classList.contains(c)]));
const originalTitle=document.title,build=window.FR137_BUILD||'fr137';
let root=null,styles=null,loaded=false,loading=false,active=false,epoch=0;
function version(path){return path+(path.includes('?')?'&':'?')+'frb='+encodeURIComponent(build)}
function warmStyles(){
 if(styles)return styles.promise;
 const links=[],pending=profileStyles.map(src=>new Promise(resolve=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href=version(src);link.media='not all';links.push(link);
  link.onload=()=>resolve(true);link.onerror=()=>resolve(false);document.head.appendChild(link);
 }));
 styles={links,promise:Promise.race([Promise.all(pending).then(x=>x.every(Boolean)),new Promise(resolve=>setTimeout(()=>resolve(false),6000))])};
 return styles.promise;
}
function setStyle(activeNow){if(styles)styles.links.forEach(link=>{link.media=activeNow?'all':'not all'})}
function bar(tab){nav.querySelectorAll('[data-fr-nav]').forEach(el=>{const on=el.dataset.frNav===tab;el.classList.toggle('active',on);if(on)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')})}
function accountBody(on){
 if(on){body.classList.remove('fr-home-brand','fr42-home');body.classList.add('fr28-universe','fr93-profile')}
 else for(const name of bodyFlags)body.classList.toggle(name,!!originalFlags[name]);
}
function makeRoot(){
 if(root)return root;
 root=document.createElement('div');root.id='root';root.className='fr137-account-root fr137-boot';root.hidden=true;
 root.innerHTML='<div class="fr137-skeleton" aria-label="جاري فتح الحساب"><i></i><i></i><i></i></div>';
 body.insertBefore(root,nav);return root;
}
function hideAccount(){
 if(!active)return;
 active=false;epoch++;if(root){root.hidden=true;root.style.display='none'}
 setStyle(false);home.style.display='';if(backdrop)backdrop.style.display='';accountBody(false);document.title=originalTitle;
 window.dispatchEvent(new CustomEvent('fr137:home-visible'));
}
function loadProfile(){
 if(loaded||loading)return;loading=true;
 const script=document.createElement('script');script.src=version('/account/fr92-profile.js?v=fr135');
 script.onload=()=>{loading=false;loaded=true;root?.classList.remove('fr137-boot')};
 script.onerror=()=>{loading=false;if(active)location.assign('/account/')};
 document.body.appendChild(script);
}
async function showAccount(url,push){
 const ticket=++epoch;makeRoot();active=true;
 home.style.display='none';if(backdrop)backdrop.style.display='none';accountBody(true);setStyle(true);
 root.hidden=false;root.style.display='';bar('account');
 if(push)history.pushState({fr137:true},'',url.pathname+url.search+url.hash);
 document.title='RIVALS ID 2.0 | FOOTBALL RIVALS';window.scrollTo({top:0,behavior:'instant'});
 const ok=await warmStyles();if(!active||ticket!==epoch)return;
 if(!ok){location.assign(url.href);return}setStyle(true);
 if(loaded)window.dispatchEvent(new CustomEvent('fr137:profile-shown'));else loadProfile();
}
function isPlainClick(e){return e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey}
document.addEventListener('click',e=>{
 if(!isPlainClick(e))return;
 const homeButton=e.target.closest?.('[data-home],[data-play],[data-games]');
 if(active&&homeButton&&nav.contains(homeButton)){hideAccount();return}
 const link=e.target.closest?.('a[href]');if(!link||link.hasAttribute('download')||link.target&&link.target!=='_self')return;
 let url;try{url=new URL(link.href,location.href)}catch{return}
 if(url.origin!==location.origin)return;
 if(/^\/account\/?$/.test(url.pathname)){
  e.preventDefault();if(active){if(location.search!==url.search){history.pushState({fr137:true},'',url.pathname+url.search);window.dispatchEvent(new CustomEvent('fr137:profile-shown'))}return}
  showAccount(url,true);return;
 }
 if(active&&url.pathname==='/'&&!url.hash){
  e.preventDefault();hideAccount();history.pushState({},'',url.pathname+url.search);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo({top:0,behavior:'instant'});
 }
},true);
window.addEventListener('popstate',()=>{
 const url=new URL(location.href);
 if(/^\/account\/?$/.test(url.pathname)){if(!active)showAccount(url,false);else{bar('account');if(loaded)window.dispatchEvent(new CustomEvent('fr137:profile-shown'))}}
 else if(active)hideAccount();
});
window.addEventListener('pageshow',()=>{const url=new URL(location.href);if(/^\/account\/?$/.test(url.pathname)&&!active)showAccount(url,false)});
const idle=window.requestIdleCallback?(fn=>window.requestIdleCallback(fn,{timeout:2000})):(fn=>setTimeout(fn,1000));idle(()=>warmStyles());
})();
