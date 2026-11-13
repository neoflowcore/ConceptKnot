/* ConceptKnot v171: bounded, sentence-aware read-only Korean TTS segments.
 * Output is for OS synthesis only; official source text and answer data never mutate.
 * No automatic cloud requests, downloadable audio, or fabricated local neural voices.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&typeof root==='object')root.CK171TTSChunks=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 function normalize(value){
  return String(value??'').normalize('NFC')
   .replace(/(\d)\s*%/g,'$1 퍼센트')
   .replace(/(\d)\s*㎡/g,'$1 제곱미터')
   .replace(/(\d)\s*㎥/g,'$1 세제곱미터')
   .replace(/\bLTV\b/gi,'엘 티 브이')
   .replace(/\bDTI\b/gi,'디 티 아이')
   .replace(/\bDSR\b/gi,'디 에스 알')
   .replace(/\bNPV\b/gi,'엔 피 브이')
   .replace(/\bIRR\b/gi,'아이 알 알')
   .replace(/\bQd\b/g,'수요량')
   .replace(/\bQs\b/g,'공급량')
   .replace(/\s+/g,' ').trim();
 }
 function split(input,maximum=112){
  const str=String(input??'').replace(/\s+/g,' ').trim();
  if(!str)return [];
  const max=Math.max(64,Math.min(180,Math.floor(Number(maximum)||112)));
  const out=[];let remain=Array.from(str),attempts=0;
  // Prefer Korean sentence ends, then a natural word boundary, then a grapheme-safe cut.
  while(remain.length>max&&attempts++<10000){
   const head=remain.slice(0,max+1);
   let cut=-1;
   const min=Math.max(28,Math.floor(max*.47));
   for(let i=min;i<Math.min(head.length,max);i++){
    const here=head[i],next=head[i+1]||'';
    if(/[.!?。！？]/.test(here)&&(/\s/.test(next)||!next))cut=i+1;
   }
   if(cut<min){
    for(let i=max;i>=min;i--)if(/\s/.test(head[i]||'')){cut=i;break;}
   }
   if(cut<min)cut=max;
   // Do not drop characters: only extra spaces at the boundary can be normalized.
   const seg=remain.slice(0,cut).join('').trim();
   if(seg)out.push(seg);
   remain=remain.slice(cut);
   while(remain[0]===' ')remain.shift();
  }
  if(remain.length)out.push(remain.join('').trim());
  return out.filter(Boolean);
 }
 function prepare(value,maximum=112){
  return split(normalize(value),maximum);
 }
 return Object.freeze({normalize,split,prepare,defaultMax:112});
});
