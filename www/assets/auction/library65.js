/* FOOTBALL RIVALS FR65 — AUCTION GAME FOUNDATION.
 * Exactly one portrait cover in the home featured games and one landscape cover
 * in the existing FR61/62 in-games library. Does not implement any auction mode.
 * Scoped observers only; no extra card outside its designated grids. */
(() => {
  'use strict';
  if (location.pathname !== '/') return;
  const ROOT = '/auction/';
  const OUTER = '/assets/auction/outer.png';
  const INNER = '/assets/auction/inner.png';
  const tr = () => document.documentElement.lang === 'en';
  let scheduled = false;
  function makeCard(kind) {
    const outer = kind === 'outer';
    const a = document.createElement('a');
    a.href = ROOT;
    a.className = outer ? 'fr65-auction-outer' : 'fr65-auction-inner';
    a.dataset.fr65Auction = kind;
    a.setAttribute('aria-label', tr() ? 'Auction — Explore modes' : 'المزاد — استكشف المودات');
    const img = document.createElement('img');
    img.src = outer ? OUTER : INNER;
    img.alt = tr() ? 'Auction — Football Rivals' : 'المزاد — فوتبول ريفالز';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = outer ? 1086 : 1692;
    img.height = outer ? 1448 : 930;
    a.appendChild(img);
    // Other game cards use SPA handlers. Auction always opens its dedicated page.
    a.addEventListener('click', event => event.stopPropagation());
    return a;
  }
  function mount() {
    scheduled = false;
    const featured = document.getElementById('frHomeFeatured');
    if (featured) {
      if (!featured.querySelector(':scope > [data-fr65-auction="outer"]'))
        featured.appendChild(makeCard('outer'));
      featured.classList.add('fr65-auction-featured-grid');
    }
    const grid = document.querySelector('#fr61-arena .fr61-grid');
    if (grid && !grid.querySelector(':scope > [data-fr65-auction="inner"]'))
      grid.appendChild(makeCard('inner'));
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(mount);
  }
  function start() {
    mount();
    // The built-in FR61 library may replace its own grid on navigation.
    // Observe only the existing games area, never the document or body.
    const games = document.getElementById('games');
    if (games) new MutationObserver(schedule).observe(games, { childList: true, subtree: true });
    const home = document.getElementById('frHomeFeatured');
    if (home && !(games && games.contains(home)))
      new MutationObserver(schedule).observe(home, { childList: true });
    window.addEventListener('popstate', schedule);
    window.addEventListener('hashchange', schedule);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();