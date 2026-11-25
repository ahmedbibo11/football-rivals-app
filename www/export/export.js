'use strict';
const button=document.getElementById('go'),status=document.getElementById('status'),input=document.getElementById('key');
button.addEventListener('click',async()=>{
 button.disabled=true;status.textContent='جاري التحقق وتجهيز الملفات…';
 try{
  const auth=await fetch('/api/fr-export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value}),cache:'no-store'});
  const j=await auth.json();if(!auth.ok||!j.ok)throw Error('رمز التصدير غير صحيح أو الخدمة غير جاهزة.');
  const r=await fetch('/export/archive/manifest.json',{cache:'no-store'});if(!r.ok)throw Error('ملفات النسخة غير جاهزة.');const m=await r.json();
  if(m.format!=='fr-source-v1'||!Number.isInteger(m.parts)||m.parts<1||m.parts>1000||!Array.isArray(m.chunks)||m.chunks.length!==m.parts||!/^[0-9a-f]{64}$/.test(j.key))throw Error('بيانات النسخة غير صالحة.');
  const bytes=new Uint8Array(j.key.match(/../g).map(x=>parseInt(x,16)));
  const key=await crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['decrypt']);const result=[];
  for(let i=0;i<m.parts;i++){
   status.textContent=`جاري تجهيز النسخة ${i+1} من ${m.parts}…`;
   const p=await fetch('/export/archive/'+String(i).padStart(5,'0')+'.bin',{cache:'no-store'});if(!p.ok)throw Error('تعذر تحميل جزء من النسخة.');
   const b=new Uint8Array(await p.arrayBuffer());if(b.length<29)throw Error('جزء من النسخة غير صالح.');
   const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12)},key,b.slice(12));
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',clear)),x=>x.toString(16).padStart(2,'0')).join('');
   if(clear.byteLength!==m.chunks[i].size||hash!==m.chunks[i].sha256)throw Error('فشل التحقق من أحد أجزاء النسخة.');result.push(clear);
  }
  const blob=new Blob(result,{type:'application/gzip'});if(blob.size!==m.bytes)throw Error('حجم النسخة غير مطابق.');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='FOOTBALL_RIVALS_SOURCE_ONLY.tar.gz';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);input.value='';status.textContent='تم تجهيز التنزيل. النسخة لا تحتوي على حسابات أو نتائج اللاعبين.';
 }catch(e){status.textContent=e.message||'تعذر تجهيز النسخة.'}finally{button.disabled=false}
});
