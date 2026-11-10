/* ConceptKnot P2 v155 — runtime fallback for a late Hangul IME final syllable.
 * Complements the inlined typing editor; no data storage or network writes.
 * Dispatch a final input only when no native final input was delivered.
 */
(function(root,factory){
 const api=factory(root);
 if(root)root.CK155TypingImeGuard=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const pending=new WeakMap(),tracked=new WeakMap();
 const eligible=field=>field?.tagName==='TEXTAREA'&&
  Boolean(field.closest?.('.ck-v7-input .chalk-editor'));
 let recovered=0,lateInputs=0;
 const frame=fn=>typeof root?.requestAnimationFrame==='function'?
  root.requestAnimationFrame(fn):Promise.resolve().then(fn);
 function began(field){
  if(!eligible(field))return;
  tracked.set(field,(tracked.get(field)||0)+1);pending.delete(field);
 }
 function finished(field){
  if(!eligible(field))return;
  const token=tracked.get(field)||0,last=String(field.value||'');
  const current={token,last,inputSeen:false,lastNativeValue:null};
  pending.set(field,current);
  frame(()=>{
   if(pending.get(field)!==current)return;
   pending.delete(field);
   if(!field.isConnected||field.__ck31Composing||tracked.get(field)!==token)return;
   // A native input may have arrived for the *old* value and the IME may
   // then silently commit the final syllable. Compare the value that the
   // application's input handler actually saw, not merely an input flag.
   const committed=String(field.value??'');
   if(committed!==last&&(!current.inputSeen||committed!==current.lastNativeValue)){
    if(typeof root?.Event!=='function')return;
    recovered++;field.dispatchEvent(new root.Event('input',{bubbles:true}));
   }
  });
 }
 function heardInput(field){
  const current=pending.get(field);
  if(current){
   current.inputSeen=true;
   current.lastNativeValue=String(field?.value??'');
   lateInputs++;
  }
 }
 if(root?.document?.addEventListener){
  const doc=root.document;
  doc.addEventListener('compositionstart',e=>began(e.target),true);
  doc.addEventListener('compositionend',e=>finished(e.target),true);
  doc.addEventListener('input',e=>heardInput(e.target),true);
 }
 return Object.freeze({began,finished,heardInput,getStats:()=>({recovered,lateInputs})});
});

