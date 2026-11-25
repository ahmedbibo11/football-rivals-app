/* FR44: safe, optional same-origin route warming. Does not hijack game controllers. */
(()=>{'use strict';if(window.FR44FastNavigation)return;window.FR44FastNavigation={version:'44'};
const warmed=new Set(),origin=location.origin;
const slow=!!(navigator.connection?.saveData||/^(slow-2g|2g)$/.test(navigator.connection?.effectiveType||''));
function target(u){
 try{
   const a=new URL(u,origin);
   if(a.origin!==origin||!/^https?:$/.test(a.protocol)||a.pathname.startsWith('/api/')||/\.(png|webp|avif|jpg|jpeg|gif|svg|mp4|css|js|woff2?)$/i.test(a.pathname))return null;
   return a.pathname+(a.search||'');
 }catch{return null}
}
function prefetch(href){
 if(slow)return;
 const path=target(href);if(!path||warmed.has(path)||path===location.pathname+location.search)return;
 warmed.add(path);
 const link=document.createElement('link');link.rel='prefetch';link.href=path;link.as='document';link.dataset.fr44Warm=path;document.head.append(link);
}
const idle=window.requestIdleCallback?cb=>requestIdleCallback(cb,{timeout:1300}):cb=>setTimeout(cb,900);
idle(()=>{
 const paths=location.pathname.startsWith('/account/')?['/','/?view=games']:location.pathname==='/'?['/account/','/?view=games']:['/','/account/'];
 for(const path of paths)prefetch(path);
});
function warmFromEvent(e){
 const anchor=e.target?.closest?.('a[href]');
 if(anchor&&anchor.target!=='_blank'&&!anchor.hasAttribute('download'))prefetch(anchor.href);
}
document.addEventListener('pointerover',warmFromEvent,{passive:true,capture:true});
document.addEventListener('touchstart',warmFromEvent,{passive:true,capture:true});
document.addEventListener('focusin',warmFromEvent,{passive:true,capture:true});
})();
