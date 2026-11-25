/* FR COMPARISON V5 — First-class cards inside the two native galleries. One instance each. */
(()=>{'use strict';
const PORTRAIT='/comparison/thumbnail-portrait.webp',LANDSCAPE='/comparison/thumbnail-landscape.webp';
function insert(){
 const featured=document.getElementById('frHomeFeatured');
 if(featured&&!featured.querySelector('a.fr-comparison-featured')){
  const card=document.createElement('a');card.className='fr-cover fr-featured-card fr-comparison-featured';
  card.href='/comparison/';card.setAttribute('aria-label','تحدي المقارنة');
  card.innerHTML='<img src="'+PORTRAIT+'" alt="تحدي المقارنة — صورة طولية" width="960" height="1200" loading="lazy" decoding="async"><b class="fr-native-title">تحدي المقارنة</b>';
  featured.appendChild(card);
 }
 const gallery=document.querySelector('#games .fr81-gallery');
 if(gallery&&!gallery.querySelector('a[data-fr81-card="comparison"]')){
  const card=document.createElement('a');card.className='fr81-card';card.setAttribute('data-fr81-card','comparison');
  card.href='/comparison/';card.setAttribute('aria-label','تحدي المقارنة / Comparison Challenge');
  card.innerHTML='<picture><img src="'+LANDSCAPE+'" alt="تحدي المقارنة / Comparison Challenge" width="1692" height="930" loading="lazy" decoding="async"></picture><span>تحدي المقارنة</span>';
  gallery.appendChild(card);
 }
 for(const legacy of document.querySelectorAll('.fr81-comparison-entry,.comparison-game-promo'))legacy.remove();
}
function start(){
 insert();
 for(const sel of ['#frHomeFeatured','#games .fr81-gallery']){
  const el=document.querySelector(sel);
  if(el)new MutationObserver(()=>{if(!el.querySelector(sel.includes('frHome')?'.fr-comparison-featured':'[data-fr81-card="comparison"]'))insert()}).observe(el,{childList:true});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();