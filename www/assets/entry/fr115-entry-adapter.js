/* FR115 compatibility adapter for the actual FR113 Five and Ultimate entry DOM.
 * Existing button elements and their delegated data-action / data-ux-entry handlers are retained.
 * Does not run during gameplay or change business logic. */
(()=>{'use strict';
  const pathname=location.pathname;
  const five=/^\/auction\/five(?:\/|$)/.test(pathname);
  const ultimate=/^\/auction\/ultimate(?:\/|$)/.test(pathname);
  if(!five&&!ultimate)return;
  const app=document.getElementById(five?'app':'ux-app');
  if(!app)return;
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n};
  const fact=(val,label)=>{const n=make('span');n.append(make('b',null,val),make('small',null,label));return n};
  function forFive(){
    const old=app.querySelector('section.entry-screen[aria-label*="مزاد الخماسي"]');
    if(!old||app.querySelector('.fr108-entry'))return;
    const more=app.querySelector('.entry-more');
    const img=old.querySelector('img');
    const start=old.querySelector('button[data-action="select"]');
    const rulesBtn=old.querySelector('button[data-action="rules"]');
    if(!img||!start||!rulesBtn||!more)return;
    const rules=app.querySelector('details.help');
    const wrapper=make('section','fr108-entry');wrapper.setAttribute('aria-label','مزاد الخماسي');
    const hero=make('div','fr108-hero');const poster=make('figure','fr108-poster');poster.append(img);
    const story=make('div','fr108-story');
    const kicker=make('span','fr108-kicker','FIVE-A-SIDE AUCTION · 100M');
    const heading=make('h1',null,'مزاد الخماسي');
    const lede=make('p','fr108-lede','خمسة نجوم، ميزانية 100 مليون، ومزايدة حقيقية تحسم فريقك قبل المواجهة.');
    const facts=make('div','fr108-facts');facts.append(fact('100M','الميزانية'),fact('05','جولات المزاد'),fact('15s','لكل دور'));
    const actions=make('div','fr108-main-actions');
    start.className='btn gold';start.textContent='ابدأ المزاد الآن';
    rulesBtn.className='btn ghost';rulesBtn.textContent='قواعد اللعبة';
    actions.append(start,rulesBtn);story.append(kicker,heading,lede,facts,actions);hero.append(poster,story);
    const section=make('div','fr108-section-label');section.append(make('span',null,'CHOOSE YOUR MODE'),make('h2',null,'اختر طريقة المنافسة'));
    const modes=make('div','fr108-modes');
    Array.from(more.querySelectorAll('.mode-card')).forEach((card,i)=>{
      card.classList.add('fr108-mode');if(i===1)card.classList.add('fr108-mode-rival');
      const tag=card.querySelector('.tag');if(tag)tag.classList.add('fr108-chip');
      modes.append(card);
    });
    wrapper.append(hero,section,modes);if(rules)wrapper.append(rules);
    old.before(wrapper);old.remove();more.remove();
    console.info('FR115_ADAPTER_FIVE_READY');
  }
  function forUltimate(){
    const old=app.querySelector('section.entry-screen.fr84-entry');
    if(!old||app.querySelector('.fr105-root.fr105-ultimate'))return;
    const more=app.querySelector('.entry-more.fr84-modes');
    const h1=old.querySelector('h1.fr84-title');const img=old.querySelector('.fr84-cover');
    const stats=old.querySelector('.fr84-stats');
    const start=old.querySelector('button[data-ux-entry="start"]');
    const rulesBtn=old.querySelector('button[data-ux-entry="rules"]');
    if(!h1||!img||!stats||!start||!rulesBtn||!more)return;
    const wrapper=make('section','fr105-root fr105-ultimate');wrapper.setAttribute('aria-label','مزاد التشكيلة الكاملة');
    const hero=make('div','fr105-hero fr105-native');
    const heading=make('div','fr105-heading');h1.classList.remove('fr84-title');
    heading.append(make('p',null,'ULTIMATE XI AUCTION'),h1,make('p','fr115-lede','كوّن تشكيلتك الأسطورية ونافس على نجوم الكرة، ثم احسم المواجهة على أرض الملعب.'));
    img.className='fr105-poster';
    stats.className='fr105-metrics';Array.from(stats.children).forEach((tile,i)=>{
      tile.classList.add('fr105-metric');
      if(i===1){const strong=tile.querySelector('strong');const label=tile.querySelector('[data-ux-lang="ar"]');if(strong)strong.textContent='11+7';if(label)label.textContent='أساسي وبدلاء';}
    });
    const actions=make('div','fr105-actions');
    start.classList.remove('entry-cta','fr84-start');start.classList.add('fr115-primary');
    rulesBtn.classList.remove('entry-rules','fr84-rules');rulesBtn.classList.add('fr115-secondary');
    actions.append(start,rulesBtn);hero.append(heading,img,stats,actions);
    const title=make('div','fr115-mode-heading');title.append(make('span',null,'CHOOSE YOUR MODE'),make('h2',null,'اختر طريقة المنافسة'));
    const modes=make('div','fr105-modes');Array.from(more.querySelectorAll('.mode-card')).forEach((card,i)=>{
      card.classList.add('fr105-mode-card');if(i===1)card.classList.add('fr105-mode-pvp');
      const button=card.querySelector('button[data-ux-entry]');if(button)button.classList.add('fr105-mode-button');
      modes.append(card);
    });
    wrapper.append(hero,title,modes);
    const rulebook=app.querySelector('#ux-fr84-rulebook');if(rulebook)wrapper.append(rulebook);
    old.before(wrapper);old.remove();more.remove();
    console.info('FR115_ADAPTER_ULTIMATE_READY');
  }
  let queued=false;
  function enhance(){if(five)forFive();else forUltimate();}
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});});
  observer.observe(app,{childList:true,subtree:true});enhance();
})();
