/* FR53 original card tiles: genuine artwork, uncropped, unmodified. */
(()=>{'use strict';
const career=window.FR47Career;if(!career||career.fr53OriginalCards)return;
career.fr53OriginalCards=true;
const previous=career.reveal;
const T=(ar,en)=>document.documentElement.lang==='en'?en:ar;
let generation=0;
career.reveal=function(d){
 previous.call(career,d);
 if(d?.question?.type!=='clubs'||d.stage!=='reveal')return;
 const r=d.question.reveal,frame=document.querySelector('#fr49-result .fr49-portrait-frame');
 const wrap=frame?.querySelector('.fr49-photo-wrap');
 if(!r||!frame||!wrap)return;
 const img=document.getElementById('fr49-player-photo');
 const loading=document.getElementById('fr49-photo-loading');
 const key=++generation;
 frame.classList.remove('fr53-full-card');frame.style.removeProperty('--fr53-card-ratio');
 let tile=document.getElementById('fr50-photo-atlas');
 if(!tile){tile=document.createElement('div');tile.id='fr50-photo-atlas';tile.setAttribute('role','img');wrap.appendChild(tile)}
 tile.setAttribute('aria-label',T('البطاقة الأصلية: '+(r.name||''),'Original card: '+(r.latinName||r.name||'')));
 tile.classList.remove('loaded');tile.style.display='none';tile.style.backgroundImage='none';
 const s=r.portraitAtlas;
 if(!s?.file||!/^\/cloud-v5\/assets\/cards_\d+\.webp$/.test(s.file))return;
 const col=Number(s.col),row=Number(s.row),cols=Number(s.cols),rows=Number(s.rows);
 if(![col,row,cols,rows].every(Number.isInteger)||cols<1||rows<1||col<0||row<0||col>=cols||row>=rows)return;
 const pre=new Image();
 pre.onload=()=>{
  if(key!==generation)return;
  const w=pre.naturalWidth/cols,h=pre.naturalHeight/rows;
  if(!(w>0&&h>0))return;
  frame.style.setProperty('--fr53-card-ratio',String(w/h));
  tile.style.backgroundSize=(cols*100)+'% '+(rows*100)+'%';
  tile.style.backgroundPosition=(cols>1?col/(cols-1)*100:0)+'% '+(rows>1?row/(rows-1)*100:0)+'%';
  tile.style.backgroundImage='url("'+s.file+'")';
  tile.style.display='block';
  frame.classList.add('fr53-full-card');
  tile.classList.add('loaded');
  if(img)img.style.opacity='0';
  if(loading)loading.hidden=true;
 };
 pre.onerror=()=>{if(key===generation){tile.style.display='none';frame.classList.remove('fr53-full-card')}};
 pre.src=s.file;
 if(pre.complete&&pre.naturalWidth>0)pre.onload();
};
})();