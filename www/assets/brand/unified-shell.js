/* FR40: avoid retired legacy script; shared navigation runs via fr28-universe.js. */
(()=>{'use strict';
  if(document.querySelector('script[src*="fr28-universe.js"]'))return;
  const script=document.createElement('script');
  script.src='/assets/brand/fr28-universe.js?v=fr38-darkonly';
  document.head.append(script);
})();
