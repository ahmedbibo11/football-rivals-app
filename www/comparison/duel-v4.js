
(()=>{'use strict';
const $=id=>document.getElementById(id),ROOT=$('screen'),NOTE=$('notice'),API='/api/comparison-v3',SESSION='fr:comparison:v3:session';
const AB=['السرعة','التسديد','التمرير','المراوغة','الدفاع','القوة البدنية'],CODES=['PAC','SHO','PAS','DRI','DEF','PHY'],SYM=['⚡','◎','✦','◇','▣','◆'];
const THEMES=[['general','🌍','كل الكروت'],['england','🏴','الإنجليزي'],['spain','🇪🇸','الإسباني'],['clasico','⚔','الكلاسيكو'],['legends','★','الأساطير'],['special','♛','Special Edition']];
const CLUBS=[['alahly','الأهلي','/assets/clubs/al-ahly.png'],['real','ريال مدريد','https://crests.football-data.org/86.png'],['barca','برشلونة','https://crests.football-data.org/81.png'],['liverpool','ليفربول','https://crests.football-data.org/64.png'],['city','مانشستر سيتي','https://crests.football-data.org/65.png'],['arsenal','آرسنال','https://crests.football-data.org/57.png'],['bayern','بايرن ميونخ','https://crests.football-data.org/5.png'],['atleti','أتلتيكو مدريد','https://crests.football-data.org/78.png'],['milan','ميلان','https://crests.football-data.org/98.png']];
const configKey='fr:comparison:v3:setup',parse=x=>{try{return JSON.parse(x)}catch{return null}};
const old=parse(localStorage.getItem(configKey))||{};
let cfg={mode:'ai',name:(()=>{try{return localStorage.getItem('fr:pentagon:name')||(typeof old.name==='string'?old.name:'')}catch(e){return typeof old.name==='string'?old.name:''}})(),club:(()=>{try{const v=localStorage.getItem('fr:club:preferred:v1');return CLUBS.some(c=>c[0]===v)?v:(old.club||'alahly')}catch(e){return old.club||'alahly'}})(),difficulty:(()=>{try{const v=localStorage.getItem('fr:ai:difficulty:v1');return ({easy:'easy',medium:'normal',pro:'hard'})[v]||old.difficulty||'normal'}catch(e){return old.difficulty||'normal'}})(),theme:old.theme||'general'};
let sess=null,state=null,chosenPack='',chosenCard='',lastSeen=0,cinematic=false,revealCount=0,revealTimer=null,profile='idle',profileMessage='',screenMode='entry',busy=false,polling=false,authPromise=null,packCinema=false,packCinemaTimer=null,duelCinemaTimer=null,duelCinemaComplete=false;
let uiLang=localStorage.getItem('fr:language')==='en'?'en':'ar';
function applySetupLanguage(){
 document.querySelectorAll('[data-lang]').forEach(b=>{b.classList.toggle('on',b.dataset.lang===uiLang);b.setAttribute('aria-pressed',String(b.dataset.lang===uiLang))});
 if(uiLang!=='en'||screenMode!=='setup')return;
 const labels=[['.fr4-setup-head h1','Prepare Your Challenge'],['.fr4-setup-head p','Choose your club and identity before the first round.'],['.fr4-label','Your in-game name'],['.fr4-block h2','Choose Your Club'],['.fr4-world-panel h2','Choose Your Card World'],['.fr4-world-panel>p','Filters select the card pool, not separate game modes.'],['.fr4-mode-panel h2','Game Mode'],['.fr4-difficulty h3','AI Difficulty'],['.fr4-difficulty p','All levels follow the same seven-round rules.'],['.fr4-mode-foot','Mobile and desktop · identical rules'],['.fr4-rules summary','◂ Full Game Rules']];
 for(const [sel,val] of labels){const el=document.querySelector(sel);if(el)el.textContent=val}
 const modes=document.querySelectorAll('.fr4-mode');if(modes[0])modes[0].textContent='🤖 Vs AI';if(modes[1])modes[1].textContent='⚔️ 1 vs 1';
 const start=document.querySelector('[data-act="start"]');if(start)start.textContent=cfg.mode==='ai'?'Start AI Challenge':'Create 1 vs 1 Challenge';
 const join=document.querySelector('[data-act="join"]');if(join)join.textContent='Join Room';
 const levels=document.querySelectorAll('.fr4-level');['Easy','Normal','Pro'].forEach((v,i)=>{if(levels[i])levels[i].textContent=v});
 const names={general:'General',england:'English League',spain:'Spanish League',clasico:'El Clasico',legends:'Legends',special:'Special Edition'};
 document.querySelectorAll('.fr4-world').forEach(b=>{const t=b.querySelector('b');if(t)t.textContent=names[b.dataset.theme]||t.textContent});
}
document.querySelector('.fr4-lang')?.addEventListener('click',e=>{const b=e.target.closest('button[data-lang]');if(!b)return;uiLang=b.dataset.lang;localStorage.setItem('fr:language',uiLang);render();});
const reducedCinemaMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(label,act,style='button',extra='')=>'<button type="button" class="'+style+'" data-act="'+act+'" '+extra+'>'+label+'</button>';
function flash(msg,isError=false){NOTE.textContent=msg;NOTE.classList.toggle('error',isError);NOTE.hidden=false;clearTimeout(flash.t);flash.t=setTimeout(()=>NOTE.hidden=true,4800)}
function statusError(code){return ({ROOM_EXPIRED:'الغرفة انتهت صلاحيتها، ابدأ مواجهة جديدة',ACCESS_DENIED:'جلسة الغرفة غير صحيحة',ROOM_FULL:'الغرفة ممتلئة أو بدأت المباراة',PACK_LOCKED:'الباك تم اختياره بالفعل',INVALID_PACK:'اختار باكًا صحيحًا',CARD_UNAVAILABLE:'الكارت مستخدم أو غير متاح',ALREADY_PICKED:'تم تثبيت اختيارك بالفعل',ROOM_BUSY:'المواجهة مشغولة لحظة، جرّب مرة ثانية',FILTER_TOO_SMALL:'الكروت المتاحة لهذا الفلتر غير كافية',INSUFFICIENT_CARDS:'الكروت المتاحة غير كافية',CATALOG_UNAVAILABLE:'تعذر تحميل مكتبة الكروت',SIGN_IN_REQUIRED:'سجل دخولك أولًا',MATCH_ENDED:'المباراة انتهت'})[code]||'تعذر تنفيذ الطلب: '+code}
function persist(){try{localStorage.setItem(configKey,JSON.stringify(cfg))}catch(e){}}
function stage(title,desc,action='quit'){return '<div class="stage-head"><div><h1>'+title+'</h1><p>'+desc+'</p></div>'+btn('عودة إلى الساحة',action,'button ghost')+'</div>'}
function club(code){return CLUBS.find(x=>x[0]===code)||CLUBS[0]}
function crest(code){let c=club(code);return '<figure><img src="'+esc(c[2])+'" alt="'+esc(c[1])+'" loading="lazy" onerror="this.style.display=&quot;none&quot;"></figure>'}
function art(c){let s=c?.sprite||{},file=String(s.file||'');if(!/^assets\/[a-z0-9_./-]+\.(webp|avif|png)$/i.test(file)||file.includes('..'))return '<div class="art noart"></div>';
 let cols=Number(s.cols)||1,rows=Number(s.rows)||1,x=cols<=1?50:100*(Number(s.col)||0)/(cols-1),y=rows<=1?50:100*(Number(s.row)||0)/(rows-1);
 let size=cols===1&&rows===1?'contain':cols*100+'% '+rows*100+'%';
 return '<div class="art" role="img" aria-label="كارت '+esc(c.name)+'" style="background-image:url(&quot;/cloud-v5/'+esc(file)+'&quot;);background-size:'+size+';background-position:'+x+'% '+y+'%"></div>'}
function card(c,options={}){if(!c)return'<div class="lockedart">?</div>';let ix=options.focus,used=options.used,choose=options.choose,selected=options.selected;
 return '<button type="button" class="card'+(choose?' choose':'')+(selected?' on':'')+(used?' used':'')+(options.reveal?' revealitem':'')+'" '+((!choose||used||options.disabled)?'disabled':'')+' data-card="'+esc(c.id)+'" aria-label="'+esc(c.name)+' '+esc(c.pos)+' تقييم '+c.ovr+'">'+art(c)+'<strong class="name">'+esc(c.name)+'</strong><div class="meta">'+esc(c.pos||'')+' · '+esc(c.ovr||'')+' OVR · '+esc(c.edition||'FR CARD')+'</div><div class="stats">'+((c.stats||[]).length===6?c.stats.map((v,i)=>'<span class="'+(i===ix?'focus':'')+'">'+AB[i]+' <b>'+v+'</b></span>').join(''):'')+'</div>'+(used?'<span class="picked-mark">مستخدم ✓</span>':'')+'</button>'}
function score(r){
 const mine=Number(r.score[r.role]||0),opposite=Number(r.score[r.role==='host'?'guest':'host']||0);
 return '<div class="fr-v33-score" dir="rtl" role="group" aria-label="النتيجة من اليمين أنت '+mine+' ومن اليسار المنافس '+opposite+'">'+
 '<div class="fr-v33-team mine"><div class="fr-v33-team-id">'+crest(r.own.club)+'<div><small>أنت</small><b>'+esc(r.own.name)+'</b></div></div><strong class="fr-v33-num">'+mine+'</strong></div>'+
 '<span class="fr-v33-colon" aria-hidden="true">:</span>'+
 '<div class="fr-v33-team opponent"><strong class="fr-v33-num">'+opposite+'</strong><div class="fr-v33-team-id"><div><small>المنافس</small><b>'+esc(r.opponent.name)+'</b></div>'+crest(r.opponent.club)+'</div></div></div>'
}
function track(r){return '<div class="roundtrack">'+Array.from({length:7},(_,i)=>{let e=r.log?.[i],cls=e?(e.winner==='tie'?'tie':e.winner===r.role?'win':'lose'):i===r.round&&r.phase==='playing'?'current':'';return '<span class="dot '+cls+'" title="الجولة '+(i+1)+'">'+(e?(e.winner==='tie'?'−':e.winner===r.role?'✓':'✕'):i+1)+'</span>'}).join('')+'</div>'}

function originalEntry(){return '<section class="fr108-entry"><div class="fr108-hero"><figure class="fr108-poster"><img src="/comparison/thumbnail-portrait.webp" width="960" height="1200" fetchpriority="high" alt="بوستر تحدي المقارنة الأصلي"></figure><div class="fr108-story"><span class="fr108-kicker">COMPARISON CHALLENGE · FOOTBALL RIVALS</span><h1>تحدي المقارنة</h1><p class="fr108-lede">3 باكات غامضة، 7 كروت، 7 جولات. اختر أفضل لاعب للقدرة المطلوبة وتفوّق على منافسك!</p><div class="fr108-facts"><span><b>03</b><small>باكات للاختيار</small></span><span><b>07</b><small>جولات مقارنة</small></span><span><b>AI · 1V1</b><small>طريقتان للعب</small></span></div><div class="fr108-main-actions">'+btn('ابدأ اللعب الآن','entryPlay','btn gold')+btn('قواعد اللعبة','entryRules','btn secondary')+'</div></div></div><div class="fr108-section-label"><span>CHOOSE YOUR MODE</span><h2>اختر طريقة المنافسة</h2></div><div class="fr108-modes"><article class="fr108-mode"><span class="fr108-chip">AI · THREE LEVELS</span><h3>🤖 ضد الذكاء الاصطناعي</h3><p>سهل أو متوسط أو احترافي، بنفس قواعد اللعبة.</p>'+btn('واجه الذكاء الاصطناعي','entryAI','btn gold full')+'</article><article class="fr108-mode fr108-mode-rival"><span class="fr108-chip">1 VS 1 · REAL TIME</span><h3>⚔️ مواجهة صديق</h3><p>أنشئ غرفة أو ادخل بكود الصديق، وتنافس في نفس الساحة.</p>'+btn('أنشئ مواجهة 1 ضد 1','entryPVP','btn gold full')+'</article></div></section>'}
const PACK_IMAGES=['lightning','sniper','maestro','magician','fortress','titan'];
let roomDraft=new URLSearchParams(location.search).get('room')||'';
function intro(){
 if(screenMode==='entry')return originalEntry();
 const labels={general:['🌍','الوضع العام','كل الكروت الأصلية'],england:['🏴','الدوري الإنجليزي','لاعبون لعبوا بالدوري عبر التاريخ'],spain:['🇪🇸','الدوري الإسباني','لاعبون لعبوا بالليجا عبر التاريخ'],clasico:['⚔️','الكلاسيكو','ريال مدريد وبرشلونة'],legends:['👑','الأساطير','الأيقونات التاريخية'],special:['⭐','SPECIAL','كروت SPECIAL EDITION فقط']};
 const ordered=['general','england','spain','clasico','legends','special'];
 const names=CLUBS.map(c=>'<button type="button" class="fr4-club'+(cfg.club===c[0]?' on':'')+'" data-club="'+esc(c[0])+'" aria-pressed="'+(cfg.club===c[0])+'"><img src="'+esc(c[2])+'" alt="" loading="lazy"><span>'+esc(c[1])+'</span></button>').join('');
 const worlds=ordered.map(key=>{const o=labels[key];return '<button type="button" class="fr4-world'+(cfg.theme===key?' on':'')+'" data-theme="'+key+'" aria-pressed="'+(cfg.theme===key)+'"><span class="fr4-world-title"><i>'+o[0]+'</i><b>'+o[1]+'</b></span><small>'+o[2]+'</small></button>'}).join('');
 return '<section class="fr4-setup" aria-label="تجهيز منافسة تحدي المقارنة">'+
 '<div class="fr4-setup-head"><span>STEP 01 · READY TO PLAY</span><h1>جهّز منافستك</h1><p>اختر ناديك وشعارك الحقيقي قبل بداية الجولات.</p></div>'+
 '<div class="fr4-profile-panel">'+
 '<div class="fr4-block"><label class="fr4-label" for="playerName">اسمك داخل المباراة</label><input class="fr4-name" id="playerName" type="text" maxlength="22" autocomplete="nickname" value="'+esc(cfg.name)+'" placeholder="اكتب اسمك في المباراة"></div>'+
 '<div class="fr4-block"><h2>اختار ناديك</h2><div class="fr4-clubs" role="group" aria-label="اختيار النادي">'+names+'</div></div>'+
 '<div class="fr4-world-panel"><h2>🏆 اختار عالم الكروت <small>ALL-TIME LEAGUES</small></h2><div class="fr4-worlds" role="group" aria-label="اختيار عالم الكروت">'+worlds+'</div><p>كروت حقيقية من نفس تصنيفات المزاد المرجعي.</p></div>'+
 '</div>'+
 '<div class="fr4-mode-panel"><span class="fr4-panel-kicker">GAME MODE</span><h2>طريقة اللعب</h2><div class="fr4-modes" role="group" aria-label="طريقة اللعب">'+
 '<button type="button" data-mode="ai" aria-pressed="'+(cfg.mode==='ai')+'" class="fr4-mode'+(cfg.mode==='ai'?' on':'')+'">🤖 ضد AI</button>'+
 '<button type="button" data-mode="pvp" aria-pressed="'+(cfg.mode==='pvp')+'" class="fr4-mode'+(cfg.mode==='pvp'?' on':'')+'">⚔️ 1 ضد 1</button></div>'+
 '<div class="fr4-difficulty" id="aiOnly"'+(cfg.mode==='ai'?'':' hidden')+'><h3>مستوى الذكاء الاصطناعي</h3><div class="fr4-levels" role="group" aria-label="مستوى الذكاء الاصطناعي">'+
 [['easy','سهل'],['normal','متوسط'],['hard','احترافي']].map(c=>'<button type="button" data-level="'+c[0]+'" class="fr4-level'+(cfg.difficulty===c[0]?' on':'')+'" aria-pressed="'+(cfg.difficulty===c[0])+'">'+c[1]+'</button>').join('')+
 '</div><p>كل المستويات بنفس قواعد الاختيار والفوز.</p></div>'+
 '<div class="fr4-pvp" id="pvpOnly"'+(cfg.mode==='pvp'?'':' hidden')+'><label for="room">كود غرفة صديقك (اختياري)</label><input id="room" dir="ltr" type="text" maxlength="6" spellcheck="false" autocomplete="off" placeholder="XXXXXX" value="'+esc(roomDraft)+'"><small>اترك الكود فارغًا لإنشاء غرفة جديدة، أو أدخل كود صديقك للانضمام.</small></div>'+
 '<div class="fr4-mode-actions">'+btn(cfg.mode==='pvp'?'⚔️ ابدأ التحدي 1 ضد 1':'ابدأ التحدي ضد AI','start','button gold large')+(cfg.mode==='pvp'?btn('انضم إلى غرفة','join','button sub'):'')+'</div>'+
 '<p class="fr4-mode-foot">متاحة على الموبايل والكمبيوتر · قواعد موحدة للطرفين.</p></div>'+
 '<details class="fr4-rules"><summary>◂ قواعد تحدي المقارنة بالتفصيل</summary><ol><li>اختار منافسك وناديك وعالم الكروت.</li><li>شاهد تلميحات 3 باكات غامضة واختار باكًا واحدًا.</li><li>تحصل على 7 كروت حقيقية وتلعب 7 جولات.</li><li>القدرة المطلوبة تظهر قبل اختيار الكارت، والاختيار يظل مخفيًا حتى تأكيد الطرفين.</li><li>القدرة الأعلى تكسب نقطة، والتعادل بدون نقاط، وكل كارت يستخدم مرة واحدة.</li><li>النتيجة النهائية حسب مجموع نقاط الجولات السبع.</li></ol></details></section>';
}
function roomBanner(r){if(r.mode!=='pvp')return'';return '<div class="room-banner"><div>رمز غرفتك <b class="roomcode">'+esc(r.id)+'</b><div class="micro">'+(r.opponent.joined?'✓ المنافس داخل الغرفة':'شارك الكود واستنّى صاحبك')+'</div></div>'+btn('نسخ رابط الدعوة','copyRoom','button sub')+'</div>'}
function packs(r){return stage('اختر الباك الغامض','عالم الكروت: '+(THEMES.find(t=>t[0]===r.theme)?.[2]||'كل الكروت')+' · 3 باكات غامضة')+roomBanner(r)+'<div class="packs">'+(r.own.offers||[]).map((p,i)=>'<button class="pack pack-photo '+(p.id===chosenPack?'on':'')+'" data-pack="'+esc(p.id)+'" aria-pressed="'+(p.id===chosenPack)+'" style="--tone:'+esc(p.color)+'" '+(r.own.pack?'disabled':'')+'><img class="pack-photo-art" src="/comparison/packs/'+PACK_IMAGES[p.focus||0]+'.webp" width="1086" height="1448" loading="eager" decoding="async" alt="'+esc(p.name)+'"><span class="pack-caption"><strong>'+esc(p.name)+'</strong><small>'+esc(p.hint)+'</small></span><span class="pack-check">✓</span></button>').join('')+'</div><div class="central">'+btn(r.own.pack?'تم حجز الباك، في انتظار المنافس':'افتح الباك المختار','choosePack','button gold large',(!chosenPack||r.own.pack?'disabled':''))+'<p class="micro">لعبتك تبدأ بعد اختيار الباك. لن يعرف خصمك اللاعبين اللي داخله.</p></div>'}

// Render a true alpha cutout of the original package, preserving every printed pixel.
const fr43PackAlphaCache=new Map();
function fr43PackEdges(y){
 const anchors=[[0,169,917],[60,164,922],[110,149,939],[230,149,937],
 [440,154,922],[780,153,924],[1060,150,928],[1220,142,942],
 [1320,137,947],[1390,153,933],[1448,170,918]];
 for(let i=1;i<anchors.length;i++){
  if(y<=anchors[i][0]){
   const a=anchors[i-1],b=anchors[i],t=(y-a[0])/(b[0]-a[0]);
   return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  }
 }
 return [170,918];
}
function fr43TransparentPack(img){
 if(!img||img.dataset.processing==='1')return;
 const src=img.getAttribute('data-fr43-src');
 if(!src)return;
 if(fr43PackAlphaCache.has(src)){img.src=fr43PackAlphaCache.get(src);img.classList.add('fr43-cutout-ready');return;}
 img.dataset.processing='1';
 const original=new Image();
 original.onload=()=>{
  try{
   const w=original.naturalWidth,h=original.naturalHeight;
   if(w<400||h<400)throw Error('unexpected pack image size');
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw Error('canvas unavailable');
   ctx.drawImage(original,0,0);
   const frame=ctx.getImageData(0,0,w,h),d=frame.data;
   const sy=h/1448,sx=w/1086;
   for(let y=0;y<h;y++){
    const uy=y/sy,[left,right]=fr43PackEdges(uy);
    const edgeL=left*sx,edgeR=right*sx;
    const top=Math.max(0,Math.min(1,(uy-48)/11));
    const bottom=Math.max(0,Math.min(1,(1420-uy)/21));
    for(let x=0;x<w;x++){
     const i=(y*w+x)*4;
     const edge=Math.min((x-edgeL)/(7*sx),(edgeR-x)/(7*sx),top,bottom);
     if(edge<=0){d[i+3]=0;continue}
     let alpha=Math.min(1,edge);
     // Only near the silhouette: suppress residual very dark matte pixels.
     const distance=Math.min(x-edgeL,edgeR-x)/sx;
     if(distance<25){
      const light=Math.max(d[i],d[i+1],d[i+2]);
      const cleanup=Math.min(1,Math.max(0,(light-12)/44));
      alpha*=Math.max(.12,cleanup);
     }
     d[i+3]=Math.round(255*alpha);
    }
   }
   ctx.putImageData(frame,0,0);
   const transparent=canvas.toDataURL('image/webp',.93);
   fr43PackAlphaCache.set(src,transparent);
   if(img.isConnected){img.src=transparent;img.classList.add('fr43-cutout-ready')}
  }catch(e){if(img.isConnected){img.src=src;img.classList.add('fr43-cutout-ready')}}
  finally{delete img.dataset.processing}
 };
 original.onerror=()=>{if(img.isConnected){img.src=src;img.classList.add('fr43-cutout-ready')}delete img.dataset.processing};
 original.src=src;
}
function fr43HydratePackScene(){
 const el=ROOT.querySelector('.fr4-pack-envelope img[data-fr43-src]');
 if(el)fr43TransparentPack(el);
}

function packCinematicView(r){
 const choice=r.own.offers?.find(x=>x.id===r.own.pack);
 const focus=choice?.focus??0,cs=r.own.cards||[];
 const best=cs.reduce((a,c)=>Number(c.ovr||0)>Number(a?.ovr||0)?c:a,cs[0]||null);
 return '<section class="fr4-pack-scene" aria-label="فتح الباك السينمائي">'+
 '<div class="fr4-scene-header"><span>FOOTBALL RIVALS · PACK REVEAL</span><h1>لحظة كشف النجوم</h1><p>'+esc(choice?.name||'باك النجوم')+' · عالم: '+esc(THEMES.find(t=>t[0]===r.theme)?.[2]||'كل الكروت')+' · 7 كروت</p></div>'+
 '<div class="fr4-pack-theatre"><div class="fr4-pack-beams" aria-hidden="true"></div><div class="fr4-pack-burst" aria-hidden="true"></div>'+
 '<figure class="fr4-pack-envelope"><img data-fr43-src="/comparison/packs/'+PACK_IMAGES[focus]+'.webp" src="/comparison/packs/'+PACK_IMAGES[focus]+'.webp" alt="'+esc(choice?.name||'الباك المختار')+'" width="1086" height="1515"></figure>'+
 '<div class="fr4-pack-cards" aria-label="الكروت السبعة داخل الباك">'+cs.map((c,i)=>
 '<article class="fr4-pack-mini" style="--i:'+i+'" title="'+esc(c.name)+'"><div class="fr4-pack-mini-art">'+art(c)+'</div><strong>'+esc(c.name)+'</strong><small>'+esc(c.ovr)+' OVR</small></article>').join('')+'</div></div>'+
 '<div class="fr4-pack-summary"><strong>✦ سبعة نجوم جاهزين للتحدي</strong>'+(best?'<span>أعلى بطاقة: '+esc(best.name)+' · '+esc(best.ovr)+' OVR</span>':'')+'</div>'+
 '<div class="fr4-pack-cta">'+btn('اعرض كروتي وابدأ التحدي','skipPackCinema','button sub')+'</div></section>';
}
function finishPackCinema(){
 clearTimeout(packCinemaTimer);packCinemaTimer=null;packCinema=false;revealCount=7;
 if(state?.phase==='reveal')render();
}
function beginPackCinema(){
 clearInterval(revealTimer);revealTimer=null;clearTimeout(packCinemaTimer);packCinemaTimer=null;
 revealCount=0;packCinema=!reducedCinemaMotion;
 if(packCinema)requestAnimationFrame(()=>scrollTo({top:0,left:0,behavior:'instant'}));
 // Stay on the seven-card reveal until the player deliberately continues.
 else revealCount=7;
}
function beginDuelCinema(){
 clearTimeout(duelCinemaTimer);duelCinemaTimer=null;duelCinemaComplete=reducedCinemaMotion;
 if(!duelCinemaComplete){
   const round=state?.last?.round,delay=round===7?3150:2650;
   duelCinemaTimer=setTimeout(()=>{duelCinemaComplete=true;duelCinemaTimer=null;if(cinematic&&state?.last?.round===round)render()},delay);
 }
}
function reveal(r){let cs=r.own.cards||[];return stage('لحظة كشف الكروت','كشف تدريجي للكروت السبعة، بصورها الأصلية')+'<div class="panel"><div class="revealheader"><div class="eyebrow">YOUR SEVEN STARS</div><h2>مجموعة '+esc(r.own.offers?.find(x=>x.id===r.own.pack)?.name||'النجوم')+'</h2><p class="micro">كل كارت يُستخدم مرة واحدة طوال السبع جولات</p></div><div class="progressrow">'+Array.from({length:7},(_,i)=>'<i class="'+(i<revealCount?'done':'')+'"></i>').join('')+'</div><div class="deck">'+cs.map((c,i)=>i<revealCount?card(c,{reveal:i===revealCount-1}):'<div class="lockedart">?</div>').join('')+'</div><div class="central"><div class="actions" style="justify-content:center">'+btn('كشف كل الكروت','skipReveal','button sub',revealCount>=7?'disabled':'')+btn(r.own.ready?'جاهز — في انتظار المنافس':'جاهز لخوض المعركة','ready','button gold large',(revealCount<7||r.own.ready?'disabled':''))+'</div></div></div>'}
function battle(r){
 let a=r.ability?.index??0,used=new Set(r.own.used||[]),cs=r.own.cards||[],available=cs.filter(c=>!used.has(c.id)).length;
 const question=`مين عنده أعلى <strong>${AB[a]}</strong>؟`;
 return `<section class="fr-v3-question" aria-label="سؤال الجولة الحالي" aria-live="polite">
  <div class="fr-v3-question-meta"><span>ROUND ${r.round+1} / 7</span><div><b class="clock" id="clock">00:30</b><small> ثانية متبقية</small></div></div>
  <div class="fr-v3-question-eyebrow">⚔️ التحدي الحالي · القدرة المطلوبة</div>
  <h1>${question}</h1>
  <div class="fr-v3-question-code">${SYM[a]} <b>${CODES[a]}</b><span>اختار اللاعب بأعلى قيمة ${CODES[a]} عندك</span></div>
  <div class="timeline"><i id="timebar" style="width:100%"></i></div>
  </section>
  ${score(r)}${track(r)}
  <div class="arena fr-v3-compact-arena">
  <div class="fr-v3-deck-head"><h2>اختار كارتك</h2><span>${available} من 7 كروت متاحة</span></div>
  <p class="fr-v3-deck-tip">${r.own.picked?'✓ تم تثبيت اختيارك. اختيار المنافس ما زال سريًا.':`القدرة الحالية: <strong>${AB[a]} ${CODES[a]}</strong> — اختار كارت واضغط «ثبّت الكارت»`}</p>
  <div class="deck">${cs.map(c=>card(c,{choose:true,used:used.has(c.id),selected:chosenCard===c.id,disabled:r.own.picked,focus:a})).join('')}</div>
  <p class="fr-v3-deck-status">${r.own.picked?'جاري انتظار كشف الكارتين...':chosenCard?`الكارت المختار: <b>${esc(cs.find(c=>c.id===chosenCard)?.name||'')}</b>`:'اختار كارت من المجموعة، وبعدها ثبّت الاختيار من الزر تحت الكروت.'}</p>
  <div class="fr-v34-commit-area">
   ${btn(r.own.picked?'تم تثبيت الكارت ✓':chosenCard?'ثبّت كارت '+esc(cs.find(c=>c.id===chosenCard)?.name||''):'اختار كارتًا أولًا','pick','button gold large',(!chosenCard||r.own.picked?'disabled':''))}
   <small>${r.own.picked?'في انتظار اختيار المنافس وكشف الجولة':'القدرة المطلوبة بالأعلى — الاختيار لا يُحتسب إلا بعد التثبيت'}</small>
  </div>
  </div>`;
}

function duel(r){
 const e=r.last;if(!e)return'';
 const me=r.role==='host'?e.a:e.b,enemy=r.role==='host'?e.b:e.a;
 const tie=e.winner==='tie',won=e.winner===r.role,delta=Math.abs(Number(me.value)-Number(enemy.value));
 const finalClash=e.round===7&&Math.abs(Number(r.score.host)-Number(r.score.guest))<=2;
 const title=tie?'تعادل الجولة':won?'الجولة ليك!':'النقطة للمنافس';
 const star=c=>'<div class="fr4-duel-image">'+art(c)+'</div><strong class="fr4-duel-player">'+esc(c.name)+'</strong><small>'+esc(c.pos||'')+' · '+esc(c.ovr||'')+' OVR</small>';
 return '<section class="fr4-showdown '+(duelCinemaComplete?'complete':'playing')+(tie?' tied':won?' winner-me':' winner-opponent')+(finalClash?' final-clash':'')+'" aria-label="مواجهة الكارتين">'+
 '<header class="fr4-showdown-head"><span>ROUND '+e.round+' / 7'+(finalClash?' · FINAL SHOWDOWN':'')+'</span><h1>'+(finalClash?'مواجهة الحسم':'وجهاً لوجه')+'</h1></header>'+
 score(r)+
 '<div class="fr4-ability"><small>القدرة المطلوبة</small><h2>'+SYM[e.stat]+' '+AB[e.stat]+' <b>'+CODES[e.stat]+'</b></h2></div>'+
 '<div class="fr4-showdown-stage"><div class="fr4-showdown-beam" aria-hidden="true"></div>'+
 '<div class="fr4-fighter mine'+(won?' winner':'')+(tie?' tie':'')+'"><div class="fr4-fighter-label">أنت · '+esc(r.own.name)+'</div>'+star(me)+'<div class="fr4-stat-value"><b>'+me.value+'</b><small>'+esc(AB[e.stat])+'</small></div></div>'+
 '<div class="fr4-versus" aria-hidden="true">VS</div>'+
 '<div class="fr4-fighter opponent'+(!won&&!tie?' winner':'')+(tie?' tie':'')+'"><div class="fr4-fighter-label">المنافس · '+esc(r.opponent.name)+'</div>'+star(enemy)+'<div class="fr4-stat-value"><b>'+enemy.value+'</b><small>'+esc(AB[e.stat])+'</small></div></div></div>'+
 '<div class="fr4-outcome '+(tie?'tie':won?'win':'lose')+'" aria-live="polite"><strong>'+title+'</strong><span>'+(tie?'لا نقاط لهذه الجولة':'فارق القدرة '+delta+' · نقطة واحدة للفائز')+'</span></div>'+
 '<div class="fr4-showdown-next">'+(duelCinemaComplete?btn(e.round===7?'عرض شاشة النهاية':'الجولة التالية','continue','button gold large'):btn('تخطي الحركة وكشف النتيجة','skipDuelCinema','button sub'))+'</div></section>';
}
function getAnalysis(r){let log=r.log||[],me=r.role,mine=me==='host'?'a':'b',other=me==='host'?'b':'a',wins=log.filter(e=>e.winner===me),ties=log.filter(e=>e.winner==='tie').length;
 let decis=log.filter(e=>e.winner!=='tie').sort((x,y)=>Math.abs(y.a.value-y.b.value)-Math.abs(x.a.value-x.b.value))[0]||null;
 let smart=0,used=new Set();for(const e of log){let stat=e.stat,val=e[mine]?.value,available=r.own.cards.filter(c=>!used.has(c.id));let max=Math.max(...available.map(c=>c.stats[stat]));if(val===max)smart++;used.add(e[mine].id)}
 return{log,wins,ties,decis,smart,mine,other}}
function finished(r){
 const m=r.role,opposite=m==='host'?'guest':'host',a=getAnalysis(r),log=a.log,
 myWins=log.filter(e=>e.winner===m).length,hisWins=log.filter(e=>e.winner===opposite).length,ties=log.filter(e=>e.winner==='tie').length;
 const win=myWins>hisWins,tie=myWins===hisWins,dec=a.decis;
 const clutch=dec?(dec.winner==='host'?dec.a:dec.b):null,deficit=dec?Math.abs(dec.a.value-dec.b.value):0;
 const memo=profile==='saved'?'<div class="fr-v33-account saved">✓ اتسجلت النتيجة في بروفايلك</div>':
 profile==='saving'?'<div class="fr-v33-account pending">جاري حفظ المباراة في حسابك...</div>':
 profile==='signin'?'<div class="fr-v33-account warning">ادخل على <a href="/account/">RIVALS ID</a> علشان تسجل النتيجة، وبعدها ارجع للمباراة</div>':
 profile==='fail'?'<div class="fr-v33-account warning">لم يكتمل حفظ النتيجة: '+esc(profileMessage)+' '+btn('حاول تاني','retryProfile','button sub')+'</div>':
 '<div class="fr-v33-account pending">'+(r.profileReady?'تم توثيق المباراة وجاري مزامنتها':'جاري تجهيز سجل المباراة')+'</div>';
 const rows=log.map(e=>{
 const mine=e[a.mine],other=e[a.other],outcome=e.winner===m?'فوز':e.winner===opposite?'خسارة':'تعادل',kind=e.winner===m?'win':e.winner===opposite?'loss':'tie';
 return '<div class="fr-v33-round-row '+kind+'" role="row"><span class="fr-v33-round-label" role="cell">الجولة '+e.round+'<small>'+AB[e.stat]+' · '+CODES[e.stat]+'</small></span>'+
 '<div class="fr-v33-round-players" role="cell"><b>'+esc(mine.name)+'</b><span>ضد</span><b>'+esc(other.name)+'</b></div>'+
 '<strong class="fr-v33-round-values" role="cell" dir="rtl"><span>'+mine.value+'</span><em>:</em><span>'+other.value+'</span></strong>'+
 '<span class="fr-v33-round-outcome '+kind+'" role="cell">'+outcome+'</span></div>'
 }).join('');
 return '<section class="fr-v33-finale" aria-label="نتيجة المباراة النهائية">'+
 '<div class="fr-v33-final-hero '+(tie?'draw':win?'victory':'defeat')+'">'+
 '<div class="fr-v33-final-eyebrow">FOOTBALL RIVALS · DUEL ARENA</div><div class="fr-v33-final-symbol">'+(tie?'🤝':win?'🏆':'⚔️')+'</div>'+
 '<h1>'+(tie?'تعادل قوي!':win?'أنت بطل المقارنة!':'انتهت المواجهة')+'</h1>'+
 '<p>'+(tie?'التعادل حسم نتيجة السبع جولات':win?'قراراتك جابتلك الفوز عن استحقاق':'المنافس كسب الجولة الأخيرة أو تفوّق في إجمالي النقاط')+'</p>'+
 score(r)+track(r)+'</div>'+
 '<div class="fr-v33-result-metrics">'+
 '<div><strong>'+myWins+'</strong><span>جولات فوز</span></div>'+
 '<div><strong>'+hisWins+'</strong><span>جولات خسارة</span></div>'+
 '<div><strong>'+ties+'</strong><span>تعادلات</span></div>'+
 '<div><strong>'+a.smart+'/7</strong><span>اختياراتك الأعلى وقتها</span></div></div>'+
 '<div class="fr-v33-spotlight"><div class="fr-v33-spotlight-copy"><span class="eyebrow">PLAYER OF THE DUEL</span><h2>كارت المواجهة الحاسمة</h2>'+
 '<p>'+(clutch?'أكبر فارق قدرة في الجولة '+dec.round+' · '+AB[dec.stat]:'المباراة انتهت بدون أي جولات محسومة')+'</p>'+
 '<div class="fr-v33-spotlight-number"><b>'+(clutch?deficit:'—')+'</b><span>فرق القدرة</span></div>'+
 (clutch?'<p class="fr-v33-spotlight-name">'+esc(clutch.name)+'</p>':'')+
 '</div><div class="fr-v33-spotlight-art">'+(clutch?card(clutch,{focus:dec.stat}):'<div class="empty">لا يوجد كارت حسم</div>')+'</div></div>'+
 '<section class="fr-v33-match-log" aria-label="تحليل المباراة"><div class="fr-v33-log-head"><h2>تحليل السبع جولات</h2><span>قدرتك على اليمين · قدرة خصمك على اليسار</span></div><div class="fr-v33-round-list" role="table">'+rows+'</div></section>'+
 memo+'<div class="fr-v33-final-actions">'+btn('العب مباراة جديدة','replay','button gold large')+btn('شارك النتيجة','share','button sub')+btn('العودة للألعاب','quit','button ghost')+'</div></section>'
}
function captureInputs(){const n=$('playerName');if(n)cfg.name=n.value;const room=$('room');if(room)roomDraft=room.value;persist()}
function syncControls(){
 const active=!!sess&&!!state&&!['cancelled','finished'].includes(state.phase);
 document.body.classList.toggle('fr-v34-room-live',active);
 for(const id of ['mic','cancel']){const item=$(id);if(item)item.hidden=!active}
}
function render(){document.body.classList.toggle('fr4-in-game',Boolean(state));if(!state){ROOT.innerHTML=intro();let w=$('aiOnly'),p=$('pvpOnly');if(w)w.hidden=cfg.mode!=='ai';if(p)p.hidden=cfg.mode!=='pvp';syncControls();applySetupLanguage();return}
 if(state.phase==='cancelled'){clear(false);flash('تم إلغاء الغرفة');return}
 if(state.last&&state.last.round>lastSeen){lastSeen=state.last.round;cinematic=true;chosenCard='';beginDuelCinema();requestAnimationFrame(()=>{document.documentElement.scrollLeft=0;document.body.scrollLeft=0;scrollTo({top:0,left:0,behavior:'instant'})})}
 if(state.phase==='reveal'&&!packCinema&&!revealTimer&&revealCount===0)startReveal();
 // Preserve an in-progress cinematic DOM during network polling. Replacing it
 // would reset CSS animations and steal the player's time to read the cards.
 if(packCinema&&state.phase==='reveal'&&ROOT.querySelector('.fr4-pack-scene')){syncControls();return}
 if(cinematic&&state?.last?.round===lastSeen&&!duelCinemaComplete&&ROOT.querySelector('.fr4-showdown.playing')){syncControls();return}

 const oldDeck=ROOT.querySelector('.fr-v3-compact-arena .deck');const oldDeckScroll=oldDeck?.scrollLeft||0;
 ROOT.innerHTML=cinematic&&state.last?duel(state):state.phase==='pack'?packs(state):state.phase==='reveal'?(packCinema?packCinematicView(state):reveal(state)):state.phase==='playing'?battle(state):state.phase==='finished'?finished(state):intro();
 if(packCinema&&state?.phase==='reveal')fr43HydratePackScene();
 const newDeck=ROOT.querySelector('.fr-v3-compact-arena .deck');if(newDeck)newDeck.scrollLeft=oldDeckScroll;
 tick();syncControls();if(state.phase==='finished'&&state.profileReady&&profile==='idle'&&!cinematic)setTimeout(recordProfile,30)}
function startReveal(){clearInterval(revealTimer);revealCount=0;revealTimer=setInterval(()=>{if(!state||state.phase!=='reveal'){clearInterval(revealTimer);revealTimer=null;return}if(revealCount<7){revealCount++;render()}else{clearInterval(revealTimer);revealTimer=null}},450)}
function tick(){if(!state||state.phase!=='playing')return;let t=Math.max(0,Math.ceil((state.deadline-Date.now())/1000));let c=$('clock'),bar=$('timebar');if(c){c.textContent='00:'+String(t).padStart(2,'0');c.classList.toggle('warning',t<=6)}if(bar)bar.style.width=Math.min(100,100*t/30)+'%'}
async function api(op,params={}){let response=await fetch(API,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({op,id:sess?.id,token:sess?.token,...params})});let j=await response.json().catch(()=>({error:'INVALID_RESPONSE'}));if(!response.ok||!j.ok)throw Error(j.error||'NETWORK_ERROR');return j}
function saveState(j,initial=false){if(j.id&&j.token){sess={id:j.id,token:j.token};sessionStorage.setItem(SESSION,JSON.stringify(sess));state=j.state;chosenPack='';chosenCard='';lastSeen=0;cinematic=false;duelCinemaComplete=false;clearTimeout(duelCinemaTimer);duelCinemaTimer=null;clearTimeout(packCinemaTimer);packCinemaTimer=null;packCinema=false;revealCount=0;profile='idle';profileMessage='';clearInterval(revealTimer);revealTimer=null;history.replaceState(null,'','/comparison/')}
 else if(j.state){let prev=state;state=j.state;if(prev?.phase!=='reveal'&&state.phase==='reveal')beginPackCinema();if(prev?.round!==state.round)chosenCard=''}
 if(state){cfg.mode=state.mode;cfg.theme=state.theme;persist()}render()}
function clear(renderIt=true){sess=null;state=null;chosenPack='';chosenCard='';lastSeen=0;cinematic=false;duelCinemaComplete=false;clearTimeout(duelCinemaTimer);duelCinemaTimer=null;packCinema=false;clearTimeout(packCinemaTimer);packCinemaTimer=null;profile='idle';profileMessage='';revealCount=0;clearInterval(revealTimer);revealTimer=null;sessionStorage.removeItem(SESSION);history.replaceState(null,'','/comparison/');screenMode='entry';if(renderIt)render()}
async function act(op,params={}){if(busy)return;busy=true;try{let j=await api(op,params);if(op==='cancel'){clear();return}saveState(j,op==='create'||op==='join')}catch(e){flash(statusError(e.message),true)}finally{busy=false}}
function getSetup(){captureInputs();cfg.name=(cfg.name||'المدرب').trim().slice(0,22)||'المدرب';persist()}
async function copyRoom(){if(!sess)return;let link=location.origin+'/comparison/?room='+encodeURIComponent(sess.id);try{await navigator.clipboard.writeText(link);flash('تم نسخ رابط الغرفة')}catch(e){prompt('انسخ رابط الدعوة',link)}}
async function recordProfile(){if(!state||state.phase!=='finished'||!state.profileReady||profile==='saving'||profile==='saved')return;profile='saving';render();
 try{let r=await fetch('/api/comparison-record',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({op:'record',id:sess.id,token:sess.token})});let j=await r.json();if(!r.ok||!j.ok){if(j.error==='SIGN_IN_REQUIRED'||j.code==='SIGN_IN_REQUIRED'){profile='signin';return}throw Error(j.error||j.code||'SAVE_FAILED')}profile='saved'}catch(e){profile='fail';profileMessage=e.message||'تعذر الحفظ'}finally{render()}}
async function share(){if(!state||state.phase!=='finished')return;const r=state,cv=document.createElement('canvas');cv.width=1080;cv.height=1350;let c=cv.getContext('2d');if(!c)return flash('المشاركة غير مدعومة',true);
 let g=c.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#081c33');g.addColorStop(.55,'#113962');g.addColorStop(1,'#09142a');c.fillStyle=g;c.fillRect(0,0,1080,1350);
 c.strokeStyle='#e9c47a';c.lineWidth=9;c.strokeRect(30,30,1020,1290);c.strokeStyle='#3d6890';c.lineWidth=2;c.strokeRect(51,51,978,1248);
 c.textAlign='center';c.fillStyle='#f9d48e';c.font='900 72px Barlow Condensed, sans-serif';c.fillText('FOOTBALL RIVALS',540,145);
 c.fillStyle='#9fe0ff';c.font='900 38px Barlow Condensed, sans-serif';c.fillText('DUEL ARENA V4',540,208);
 c.fillStyle='#f8faff';c.font='900 42px Cairo, sans-serif';c.fillText(r.winner==='tie'?'تعادل':r.winner===r.role?'بطل المقارنة':'نهاية المواجهة',540,317);
 c.font='900 145px Barlow Condensed, sans-serif';c.fillStyle='#f6cf83';c.fillText(String(r.score[r.role]),760,515);c.fillText(':',540,515);c.fillText(String(r.score[r.role==='host'?'guest':'host']),320,515);
 c.font='900 32px Cairo, sans-serif';c.fillStyle='white';c.fillText(r.own.name.slice(0,16),770,630);c.fillText(r.opponent.name.slice(0,16),310,630);
 let dec=getAnalysis(r).decis,best=dec?(dec.winner==='host'?dec.a:dec.b):null;
 if(best?.sprite?.file){let s=best.sprite,im=new Image(),done=await new Promise(resolve=>{let t=setTimeout(()=>resolve(false),4000);im.onload=()=>{clearTimeout(t);resolve(true)};im.onerror=()=>{clearTimeout(t);resolve(false)};im.src='/cloud-v5/'+s.file});
 if(done){let w=im.naturalWidth/(s.cols||1),h=im.naturalHeight/(s.rows||1);try{c.drawImage(im,(s.col||0)*w,(s.row||0)*h,w,h,382,724,316,444)}catch(e){}}}
 c.fillStyle='#f6d694';c.font='900 33px Cairo, sans-serif';c.fillText(best?'كارت الحسم: '+best.name.slice(0,19):'مواجهة متعادلة',540,1227);
 c.fillStyle='#bdd1e7';c.font='900 23px Cairo, sans-serif';c.fillText('7 جولات  •  FOOTBALL RIVALS  •  DUEL ARENA V4',540,1277);
 let blob=await new Promise(resolve=>cv.toBlob(resolve,'image/png'));if(!blob){flash('تعذر إنشاء صورة المباراة',true);return}
 let file=new File([blob],'FR-DUEL-ARENA-V3.png',{type:'image/png'});
 if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'FOOTBALL RIVALS — DUEL ARENA V4'});return}catch(e){if(e.name==='AbortError')return}}
 let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);flash('تم تجهيز صورة النتيجة')}
async function voice(){let Rec=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Rec)return flash('الميكروفون الصوتي غير مدعوم في المتصفح',true);try{let rec=new Rec();rec.lang='ar-EG';rec.onresult=e=>{let t=e.results[0][0].transcript||'';let n=t.match(/[١٢٣٤٥٦٧1-7]/)?.[0],ar='١٢٣٤٥٦٧',number=n?(ar.includes(n)?ar.indexOf(n):Number(n)-1):null;if(number!==null){let items=[...ROOT.querySelectorAll('[data-card]:not(:disabled)')];items[number]?.click()}else if(/ثبت|تثبيت/.test(t))ROOT.querySelector('[data-act="pick"]')?.click();else flash('سمعت: '+t)};rec.start();flash('المايك جاهز: قول رقم الكارت أو تثبيت')}catch(e){flash('تعذر تشغيل المايك',true)}}
ROOT.addEventListener('click',async e=>{let b=e.target.closest('button[data-mode],button[data-theme],button[data-club],button[data-level],button[data-pack],button[data-card],button[data-act]');if(!b)return;
 if(b.dataset.mode){captureInputs();cfg.mode=b.dataset.mode;persist();render();return}
 if(b.dataset.club){captureInputs();cfg.club=b.dataset.club;try{localStorage.setItem('fr:club:preferred:v1',cfg.club)}catch(e){}persist();render();return}
 if(b.dataset.level){captureInputs();cfg.difficulty=b.dataset.level;try{localStorage.setItem('fr:ai:difficulty:v1',({easy:'easy',normal:'medium',hard:'pro'})[cfg.difficulty])}catch(e){}persist();render();return}
 if(b.dataset.theme){captureInputs();cfg.theme=b.dataset.theme;persist();render();return}
 if(b.dataset.pack){if(!state?.own.pack){chosenPack=b.dataset.pack;render()}return}
 if(b.dataset.card){if(state?.phase==='playing'&&!state.own.picked&&!b.disabled){chosenCard=b.dataset.card;render()}return}
 const a=b.dataset.act;
 if(a==='entryRules'){$('rules').showModal();return}
 if(a==='entryPlay'||a==='entryAI'||a==='entryPVP'){if(a==='entryAI')cfg.mode='ai';if(a==='entryPVP')cfg.mode='pvp';screenMode='setup';persist();render();scrollTo({top:0,behavior:'smooth'});return}
 if(a==='backEntry'){screenMode='entry';render();scrollTo({top:0,behavior:'smooth'});return}
 if(a==='start'||a==='join'){getSetup();if(a==='start'){await act('create',{mode:cfg.mode,theme:cfg.theme,difficulty:cfg.difficulty,name:cfg.name,club:cfg.club})}
 else{let id=($('room')?.value||'').trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(id))return flash('اكتب كود غرفة صحيح من 6 أحرف',true);await act('join',{id,name:cfg.name,club:cfg.club})}return}
 if(a==='choosePack')return act('pack',{packId:chosenPack});
 if(a==='ready')return act('ready');
 if(a==='pick')return act('pick',{cardId:chosenCard});
 if(a==='continue'){clearTimeout(duelCinemaTimer);duelCinemaTimer=null;cinematic=false;duelCinemaComplete=false;render();return}
 if(a==='skipDuelCinema'){clearTimeout(duelCinemaTimer);duelCinemaTimer=null;duelCinemaComplete=true;render();return}
 if(a==='skipPackCinema'){finishPackCinema();return}
 if(a==='skipReveal'){clearTimeout(packCinemaTimer);packCinemaTimer=null;packCinema=false;revealCount=7;clearInterval(revealTimer);revealTimer=null;render();return}
 if(a==='copyRoom')return copyRoom();
 if(a==='retryProfile'){profile='idle';return recordProfile()}
 if(a==='share')return share();
 if(a==='replay'){let c={...cfg};clear(false);return act('create',{mode:c.mode,theme:c.theme,difficulty:c.difficulty,name:c.name||'المدرب',club:c.club})}
 if(a==='quit'){if(sess&&state?.phase!=='finished'&&!confirm('إلغاء المباراة والعودة للمنصة؟'))return;if(sess&&state?.phase!=='finished')await act('cancel');clear();location.href='/?view=games';return}
});
ROOT.addEventListener('change',e=>{if(e.target.id==='club')cfg.club=e.target.value;if(e.target.id==='difficulty')cfg.difficulty=e.target.value;if(e.target.id==='playerName')cfg.name=e.target.value;persist()});
ROOT.addEventListener('input',e=>{if(e.target.id==='playerName')cfg.name=e.target.value;if(e.target.id==='room')roomDraft=e.target.value;persist()});
$('help').onclick=()=>{$('rules').showModal()};$('rulesclose').onclick=()=>{$('rules').close()};
const navGame=$('navgame');if(navGame)navGame.onclick=()=>{if(!sess){screenMode='entry';render()}};

$('mic').onclick=voice;
$('cancel').onclick=async()=>{if(sess&&state?.phase!=='finished'){if(!confirm('هل تريد إلغاء المباراة؟'))return;await act('cancel')}clear()};
async function poll(){if(!sess||!state||polling||busy||state.phase==='cancelled'||(state.phase==='finished'&&state.profileReady))return;polling=true;try{let j=await api('poll'),before=state,next=j.state;
 let changed=before.phase!==next.phase||before.round!==next.round||before.last?.round!==next.last?.round||before.own.picked!==next.own.picked||before.opponent.picked!==next.opponent.picked||before.opponent.joined!==next.opponent.joined||before.own.ready!==next.own.ready||before.opponent.ready!==next.opponent.ready||before.own.pack!==next.own.pack||before.profileReady!==next.profileReady;
 state=next;if(before.phase!=='reveal'&&next.phase==='reveal')beginPackCinema();if(changed&&(!cinematic||next.last?.round!==before.last?.round))render()
 }catch(e){if(['ROOM_EXPIRED','ACCESS_DENIED','ROOM_VERSION'].includes(e.message)){clear();flash(statusError(e.message),true)}}finally{polling=false}}
async function resume(){let stored=parse(sessionStorage.getItem(SESSION));if(stored?.id&&stored.token){sess=stored;try{let j=await api('poll');state=j.state;cfg.mode=state.mode;cfg.theme=state.theme;lastSeen=state.last?.round||0;render();return}catch(e){clear(false)}}
 let invitation=new URLSearchParams(location.search).get('room');if(invitation){cfg.mode='pvp';screenMode='setup'}render()}
resume();setInterval(()=>{poll();tick()},1400);
})();

;document.addEventListener('input',function(e){if(e.target&&e.target.id==='playerName'){try{const n=e.target.value.trim().slice(0,28);if(n)localStorage.setItem('fr:pentagon:name',n)}catch(_){}}});
