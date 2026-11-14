/* ConceptKnot v172 - shared local TTS reading queue.
 * No network, no global voice ownership, no persistent user text.
 * Inject a renderer for browser Supertonic or native sherpa-onnx.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root&&typeof root==='object')root.CK172ReadingQueue=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 function create({synthesize,play,split,onState=()=>{},maxRetries=2}={}){
  if(typeof synthesize!=='function'||typeof play!=='function'||typeof split!=='function')throw Error('TTS renderer, player and segmenter required');
  let segments=[],cursor=0,state='idle',generation=0,working=null,lastError=null;
  const retryLimit=Math.max(0,Math.min(4,Number(maxRetries)||0));
  const snapshot=()=>Object.freeze({state,cursor,total:segments.length,lastError});
  const notify=()=>onState(snapshot());
  function cancel(){generation++;working=null;state='stopped';lastError=null;notify();return snapshot();}
  async function run(version){
   while(version===generation&&cursor<segments.length){
    const text=segments[cursor];let done=false;
    for(let attempt=0;attempt<=retryLimit&&!done&&version===generation;attempt++){
     try{
      state='synthesizing';notify();
      const audio=await synthesize(text,{index:cursor,total:segments.length,attempt});
      if(version!==generation)return snapshot();
      state='playing';notify();
      await play(audio,{index:cursor,total:segments.length,attempt});
      if(version!==generation)return snapshot();
      done=true;lastError=null;cursor++;notify();
     }catch(error){
      if(version!==generation)return snapshot();
      lastError=String(error?.message||error||'unknown');
      if(attempt===retryLimit){state='error';notify();return snapshot();}
     }
    }
   }
   if(version===generation){state='ended';notify();}
   return snapshot();
  }
  function start(text){
   cancel();segments=split(String(text??'')).filter(x=>typeof x==='string'&&x.trim());
   cursor=0;lastError=null;
   if(!segments.length){state='ended';notify();return Promise.resolve(snapshot());}
   state='queued';notify();working=run(generation);return working;
  }
  function resume(){
   if(state!=='error'&&state!=='stopped')return Promise.resolve(snapshot());
   if(cursor>=segments.length)return Promise.resolve(snapshot());
   generation++;lastError=null;state='queued';notify();working=run(generation);return working;
  }
  function getSegments(){return segments.slice();}
  return Object.freeze({start,cancel,resume,getState:snapshot,getSegments});
 }
 return Object.freeze({create});
});
