/* ConceptKnot v163 — readable 400-question first-party study explanations, NOT Q-Net-approved commentary.
 * Read-only, canonical A-form integrity-gated. No personal writes or expert-status promotion.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(root&&typeof root==='object')root.CK163PublicStudy=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:null,function(root){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=value=>{
  if(typeof value!=='string'||!/^https:\/\/[a-z0-9.-]+(?:[:/;?#]|$)/i.test(value))return '';
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}
 };
 const notices=Object.freeze({
  2021:'https://www.q-net.or.kr/cst003.do?artlSeq=5209538&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2022:'https://www.q-net.or.kr/cst003.do?artlSeq=5211208&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2023:'https://www.q-net.or.kr/cst003.do?artlSeq=5212816&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2024:'https://www.q-net.or.kr/cst003.do?artlSeq=5218527&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310',
  2025:'https://www.q-net.or.kr/cst003.do?artlSeq=5249925&boardId=Q004&gId=08&gSite=L&id=cst00302&menuType=cst00310'
 });
 /* Non-cryptographic, source-locked drift detection generated from v162 official A-form bank. */
 const BASELINE_FINGERPRINTS=Object.freeze({"2025-1":"7703d21b1f151a31","2025-2":"ada7c6c81fa64b9f","2025-3":"f386170c8f215957","2025-4":"e3aab93ec4f5470e","2025-5":"9979f6700cc83ad4","2025-6":"4a32e8f3f6faff4e","2025-7":"1caaac652237c463","2025-8":"922aff22f3718ba9","2025-9":"c8b0186350c92681","2025-10":"5820983b966c902b","2025-11":"02fa193b91760195","2025-12":"abf9ec23b8a67ce3","2025-13":"701d6f1f99dd3fe1","2025-14":"2da8f2216f83c572","2025-15":"c73f3ce1a42e904d","2025-16":"e2dbf665cfee667b","2025-17":"879a70374466a1c6","2025-18":"32e1bcb444f98013","2025-19":"76b07cd6efcb9c79","2025-20":"52f8fd54dd3e6104","2025-21":"65c546fc870eb816","2025-22":"d11b4e2d8c553f4c","2025-23":"e699bcf698179519","2025-24":"e40ef2c1915544e2","2025-25":"0083214606aa4bba","2025-26":"b5d63b1d562b1442","2025-27":"da08a18d64e3406f","2025-28":"36edf90207e17e41","2025-29":"76982e34cfb6d85a","2025-30":"15231795466dfb84","2025-31":"68b1ff60aa978dba","2025-32":"4152e8b0f2d9b5e2","2025-33":"854e1810c0b933df","2025-34":"0ddec9a22fb10867","2025-35":"ef16f7b33fd2141e","2025-36":"fec200f90c483780","2025-37":"152dd63b7c645d8e","2025-38":"9ffd805914665d3a","2025-39":"3ed992479353b4f6","2025-40":"e6f2e617d804efa7","2025-41":"db1af13b92a8c314","2025-42":"ded4e40c8842f0fd","2025-43":"7888e11427612a30","2025-44":"828a04b8c236d89b","2025-45":"d6da001956f0c8eb","2025-46":"ef555fedbc172ccb","2025-47":"4a3d44edb7eb8c46","2025-48":"84f2c4a3ebdeb497","2025-49":"ffb3d0286f50b171","2025-50":"d2a276fb19ffda33","2025-51":"c16f8bd953a426be","2025-52":"e1fec897126fb907","2025-53":"641856c3698ebd7d","2025-54":"c2b97c4c99548ece","2025-55":"5d1cfda8d7a0b9aa","2025-56":"03f774c65db1ced6","2025-57":"058d73db9fccd4ad","2025-58":"49151953632a5099","2025-59":"61d4539dabac4c90","2025-60":"4c7f30b88a44e0db","2025-61":"abf4d8722fd76360","2025-62":"465327f0e5d485b4","2025-63":"6200badc0ab19517","2025-64":"af2537decc240f4a","2025-65":"56b10d18d7559c67","2025-66":"4115e4de42842dbd","2025-67":"bc40f41dd71366d0","2025-68":"2f800bb359217520","2025-69":"7607a900ddbc69d0","2025-70":"bce982989a21d4da","2025-71":"28128095793025c6","2025-72":"7089809ee022323c","2025-73":"d2a5b86746b90d1e","2025-74":"be1f557e27dcda31","2025-75":"4d18b261ce438fba","2025-76":"9709064b84868525","2025-77":"2b689c4f8cba8b8c","2025-78":"312feb92bac222db","2025-79":"aa0015fddccb3f06","2025-80":"06be8a3f368a8ce1","2024-1":"39be368a78219580","2024-2":"cfee8dea06037d63","2024-3":"e57ff7f8ae3da2c1","2024-4":"00367b26dc109d21","2024-5":"72c2806eace6788f","2024-6":"fd40f677c0eb8383","2024-7":"4f4c031812c5fbc8","2024-8":"936dde629d451fb3","2024-9":"16912bcb5c3dbf34","2024-10":"000bee8332d793d1","2024-11":"bdb297da155ed660","2024-12":"e987a67234e1c042","2024-13":"88773ed9f4c67b9a","2024-14":"a85b8d3f0096a580","2024-15":"3905499c30867535","2024-16":"f6530c5064e705cd","2024-17":"9eaba10a1ed809e9","2024-18":"1b9857b312759030","2024-19":"f8deae9a5e8c2816","2024-20":"c53511e30d3d4440","2024-21":"2e9c7fce5626384e","2024-22":"323097d197246e2e","2024-23":"5cca2373f2452a6a","2024-24":"65b48ead9be5162e","2024-25":"45f89888e9a5fa64","2024-26":"742b40e12b41a3c3","2024-27":"bf4464ff0b07c874","2024-28":"3659f846509a8b21","2024-29":"015d53dd8743fdc1","2024-30":"ee0f8078a31d0045","2024-31":"385b0922ed4b1902","2024-32":"ede4152d1a93e98c","2024-33":"83e6fafb7f5fc938","2024-34":"a5651d2aa2054c11","2024-35":"8048534e90dce9ff","2024-36":"b86fbd47ac8ae632","2024-37":"fe229a8d2169262e","2024-38":"00df1966b3a9bb2f","2024-39":"cb8dc6ea9484c94b","2024-40":"959c7c04979e5c85","2024-41":"23a37c0c1c15a4fa","2024-42":"347f072cdb5268e4","2024-43":"8c9b0e50927b045c","2024-44":"ef683e0d071819b9","2024-45":"0ae647f4885bbe3b","2024-46":"8db7909149901683","2024-47":"7ff6ab72db1bb857","2024-48":"49ba842779a22965","2024-49":"8d469cebd8a8c558","2024-50":"375ff173fd571318","2024-51":"870c4fcede4e46b1","2024-52":"93ea62a0a84cbb88","2024-53":"54d6ec7b3c095992","2024-54":"354933dfb9cad06f","2024-55":"b3c06efbfb66fafa","2024-56":"1033e96c2b3cdb99","2024-57":"775eb5edc9827ec2","2024-58":"aa7a6b22a7507658","2024-59":"b563b2f804a89032","2024-60":"4119042055d61787","2024-61":"9f1c39e2f560cf24","2024-62":"b078d41437d4ab16","2024-63":"15aa448f228722ac","2024-64":"75ede4d34d1689f9","2024-65":"0e9d876d46e04840","2024-66":"f6bbec526696678c","2024-67":"5ca259fc8d36b44d","2024-68":"e688065662ddac10","2024-69":"729a07bfd6f55b97","2024-70":"034181ce2363096a","2024-71":"bee0f203421ef700","2024-72":"36bfa493f775487c","2024-73":"bee5f600056b8dd5","2024-74":"367524fd7d9123d8","2024-75":"e314f978799aeaaa","2024-76":"f8af682f4b722afb","2024-77":"5cc0f207eedd8d49","2024-78":"4168f7e88fd9430a","2024-79":"05ef84394a061240","2024-80":"345fac945abe0244","2023-1":"a7cf780e13144f7a","2023-2":"c5febeeb499a8df1","2023-3":"5bed19048f9e8ce9","2023-4":"9257118febc2fa59","2023-5":"d5e1f72b086ef2cf","2023-6":"48927d0b39006f49","2023-7":"7bfb9490325324ce","2023-8":"b748af1f18cf9397","2023-9":"fec2b5ab2bdb63d5","2023-10":"55f5fed5056260f4","2023-11":"ecf5474762f3306c","2023-12":"1237e139834ba8cd","2023-13":"e3b416e705f220d5","2023-14":"438f3b37cc1d2539","2023-15":"32ffc585a65c6151","2023-16":"2954147c517ee63a","2023-17":"6b82a88283c1a509","2023-18":"28492dcd70cca07b","2023-19":"105a6a8184471271","2023-20":"ef8b84f8f3872f33","2023-21":"957abeb182766ee0","2023-22":"94a38c292878dd13","2023-23":"cb49d9cb3871a91b","2023-24":"a45e6bb8aa382b0b","2023-25":"59e1d84fae019fc4","2023-26":"220ebf1d40b1bb70","2023-27":"2260ea41cb843444","2023-28":"58e2f73c627a6d6c","2023-29":"246f8fa2ad0e42b0","2023-30":"68f716a0648429ec","2023-31":"f4ae25f61ef45517","2023-32":"022d80f0f29d4678","2023-33":"948b4f7b4bec636e","2023-34":"6e88beec6acafc20","2023-35":"88a79b37701672de","2023-36":"57f4443170dcb39a","2023-37":"764b3b4dd7bbc168","2023-38":"4dba2916613de4ef","2023-39":"856e58cd860bb694","2023-40":"40cd8c6230f08c12","2023-41":"1a4f320f1e2e315c","2023-42":"6428df0d4ddd46a5","2023-43":"7831701207d7824f","2023-44":"b88b523a1e303046","2023-45":"403b5c755af2d6d4","2023-46":"10656bc18d88dcd4","2023-47":"13b0ec45f63e611e","2023-48":"b08d69ca035b446f","2023-49":"d40be74fc26af7d4","2023-50":"3cd012fec94ba396","2023-51":"31cd739b4689f7d5","2023-52":"5b7ac3b7cc7a8f6f","2023-53":"8786711b610307c5","2023-54":"ddc53f0b6ec67a6d","2023-55":"8d82c62dfad6a413","2023-56":"880518992a9be127","2023-57":"2d94af1455792400","2023-58":"e4b2c7366b167e62","2023-59":"fff9d4ac5ed1580e","2023-60":"4f25eb6dd8ebdb15","2023-61":"33636899fdae32a2","2023-62":"64dd2f1938c49dc6","2023-63":"c4b830e562e74d53","2023-64":"a229ad12f47e0563","2023-65":"17c407a3ad85ca2f","2023-66":"0b875c39300aa5e4","2023-67":"014c17436d1caa7d","2023-68":"72bc594a01d99ae3","2023-69":"0ad637a1c565413f","2023-70":"453f6c67cb83a2ff","2023-71":"bad74405bcb567b6","2023-72":"377af78dffe281f5","2023-73":"0f585434c35ba5b1","2023-74":"99f9404d0747a534","2023-75":"a98a950e95b96b96","2023-76":"9d8b7ab8f42c07a5","2023-77":"d1e592665fb12492","2023-78":"fadeb616d150ea1c","2023-79":"3acb47c03c7d6511","2023-80":"e297c63a66677f26","2022-1":"f2e51b7f865b978b","2022-2":"53f68b1964009039","2022-3":"612df73f12192c48","2022-4":"42a981949a00cfb4","2022-5":"61a6d2e7f1547eef","2022-6":"e1d19e1a7505ef6a","2022-7":"b3709c4d8b2d6ffd","2022-8":"db1a7f0dd9f15c2e","2022-9":"a2eb395bafd3ba87","2022-10":"b2af8057d287dae3","2022-11":"552f042fa95ff7ce","2022-12":"2d7ccaca41dbf5c0","2022-13":"10503efbbeb3891b","2022-14":"c70b5ad4f6a9c71f","2022-15":"e284b006edc70ec9","2022-16":"3af4cdd8af32f16d","2022-17":"ea2af5c8d1c19c09","2022-18":"8fa01f0bf33c678f","2022-19":"302279b030a6537f","2022-20":"6c26867fe9fe3868","2022-21":"3dfa64a5334935e4","2022-22":"c74dc64ce17e0f4d","2022-23":"c75b7fd0a4962897","2022-24":"dae8100b7383951b","2022-25":"95620743ce67cab9","2022-26":"b1de2bbcbb630ea1","2022-27":"c47642f5dbe05be9","2022-28":"5c09ec7f7cb56478","2022-29":"5c7548a3f6aa8695","2022-30":"969a7339dbdb093b","2022-31":"f23d2ddf4a107a1c","2022-32":"0ecaa1b83132f350","2022-33":"bb0488f924f9c6cd","2022-34":"1e88b7d3a5ae2550","2022-35":"fb14a6f827d53af3","2022-36":"85208f241e38427e","2022-37":"c28e99431b9bac5a","2022-38":"49079006b458e162","2022-39":"dd0ea67d6702dded","2022-40":"1995e0fc331b0018","2022-41":"0274a224d9611bc2","2022-42":"ca488aea22b9746c","2022-43":"9a5d958bc16610e9","2022-44":"1770dc7b0cfd4fe9","2022-45":"5aa0b1130314e888","2022-46":"b1bcc5e601f4bbca","2022-47":"3d5a36b1a45bf850","2022-48":"b3e606447b4b7377","2022-49":"709a44e936205eff","2022-50":"70fafc3a09f01992","2022-51":"16df5e6a95903152","2022-52":"06d1ad1b53aeabcc","2022-53":"491a4e8ca0a0caf4","2022-54":"30164392d676f0be","2022-55":"1411486f5fc289ef","2022-56":"178145a8fe90d72d","2022-57":"1b601440b51113d0","2022-58":"f7e62a21b4cc2da8","2022-59":"77211f70b3fbd605","2022-60":"f6f43f5391fed066","2022-61":"b6cc4db9b100b39b","2022-62":"aadc35a397e797a4","2022-63":"5c7c6ce714c94cc1","2022-64":"f2d6de5ef73654e2","2022-65":"769ec85e05c2c887","2022-66":"5f0a39bbb2b42c45","2022-67":"58cb48de4c0b247f","2022-68":"840820c60122a93c","2022-69":"2e6835678c62aa29","2022-70":"96012dbe6a7f2039","2022-71":"bc26c825d1903e3e","2022-72":"ae2624633118c027","2022-73":"e361d44c357abd84","2022-74":"2741e680c622314c","2022-75":"1b43bcb76b67eab3","2022-76":"fdaa314c8642ff93","2022-77":"03c5324ac23df6a1","2022-78":"17c8273a3d96ef33","2022-79":"76523b8fadd63999","2022-80":"bedd15ff4a03d374","2021-1":"d421f86e540dc1ca","2021-2":"a7d416ff063764e6","2021-3":"20c81450e234a1da","2021-4":"dfec7c6f6700a2ff","2021-5":"fb8a476d94c49e93","2021-6":"9c10673bb9df874a","2021-7":"62a335f9a1f0a85a","2021-8":"3d00bfe628786b81","2021-9":"a577e69dc46bffef","2021-10":"5ed7f21554485caf","2021-11":"58556d93302fc3a2","2021-12":"43f20f7fe70add6b","2021-13":"2a9e8f44e617174f","2021-14":"65a9981e5a27637f","2021-15":"faac28d8f5579cd8","2021-16":"cd0a4e88752f02fa","2021-17":"d1688452f6c8a3af","2021-18":"dd043f2179e0d830","2021-19":"75ea29d262e9e14c","2021-20":"5fc38d95300a905e","2021-21":"31f938fe5b33247a","2021-22":"33fee4c3b60af3a8","2021-23":"2b97359b7a001862","2021-24":"67b655249d6424d2","2021-25":"004cb9e6d8972cf3","2021-26":"50d6746e2955feb2","2021-27":"a71efec2ed5c1d5a","2021-28":"3974ce9a80140324","2021-29":"fbfbc5b45aab6e3a","2021-30":"d59d69c5f858e538","2021-31":"b121dc294d5832e0","2021-32":"e05355a5ec11ddf7","2021-33":"a0233d8797557a50","2021-34":"9349ab0ce1a5a13a","2021-35":"16433b732053561f","2021-36":"5af8264cdb8d721f","2021-37":"da25d804898df96b","2021-38":"0fd29e33f174a511","2021-39":"84d006681ce67da6","2021-40":"40d1571a10aba9b5","2021-41":"9cd14861b2002910","2021-42":"9d1857b2a3c11e20","2021-43":"5ecbf3858ff253bd","2021-44":"da9a53d756c7c91b","2021-45":"19c8c61e945a2f95","2021-46":"63824d675b351ec6","2021-47":"4bf40895849f0063","2021-48":"faaaf71a18473805","2021-49":"a14422f2c05ab239","2021-50":"a6119bd43407a8da","2021-51":"2b76bc63045cd4e8","2021-52":"973bce0fe0df0f1e","2021-53":"e4ff063882f01412","2021-54":"27e2dbeac9df431f","2021-55":"616567982f2fe82b","2021-56":"be99b9788096392e","2021-57":"13e1622c316f08ed","2021-58":"ba06ef1720dc6d0d","2021-59":"ff4b13a0354217ab","2021-60":"f9da6c687b628f34","2021-61":"55fc4d5563ae0289","2021-62":"647d0c245f983654","2021-63":"69589af279aa4129","2021-64":"e6e9755d9e28fa76","2021-65":"b9d8221721d36a86","2021-66":"23a583a48b77cd63","2021-67":"167c1cdbeff8f6fa","2021-68":"886e2bd4d5628d63","2021-69":"c00925e14a10f4ee","2021-70":"385b52feb1bdf766","2021-71":"ad4f08705a623a6e","2021-72":"e32952fb64eedc9a","2021-73":"e2cc7d4c97ea5d0b","2021-74":"70510acc938324a0","2021-75":"667050bbee74c5d1","2021-76":"e5b1cb981f5285dc","2021-77":"1622cd32d2d26656","2021-78":"7c2faa659a0a0dfe","2021-79":"70c9b72255a64b57","2021-80":"d8c19527e9c5b746"});
 function sourceFingerprint(q){
  const value=JSON.stringify([q.id,q.year,q.number,q.subject,q.question,q.options,q.correct]);
  let h=0xcbf29ce484222325n;
  for(let i=0;i<value.length;i++){h^=BigInt(value.charCodeAt(i));h=(h*0x100000001b3n)&0xffffffffffffffffn;}
  return h.toString(16).padStart(16,'0');
 }
 const state={open:false,year:0,subject:'all',focus:'all',page:0,pageSize:10};
 let cachedInput=null,cachedResult=null,cachedAudit=null,cachedV161=null,cachedV162=null;
 function fail(errors){return {ready:false,errors,stats:null,questions:[],options:[],sourcePreflightPassed:0}}
 function build(input,deps){
  const audit=(deps?.optionAudit||root?.CK160OptionAudit);
  if(!Array.isArray(input)||typeof audit?.build!=='function')return fail(['공식 원문 또는 2,000선지 감사 엔진 없음']);
  const optionReview=audit.build(input);
  if(!optionReview?.ready||optionReview.rows?.length!==2000)return fail(optionReview?.errors?.length?optionReview.errors:['2,000선지 원문 대조 실패']);
  const v161=deps?.v161||root?.CK161SubstantiveReview, v162=deps?.v162||root?.CK162SubstantiveReview;
  const matches=input.filter(x=>x?.q?.year>=2021&&x?.q?.year<=2025),errors=[];
  const qMap=new Map();
  for(const pair of matches){
   const q=pair.q,e=pair.entry;
   if(!q||!e||typeof q.id!=='string'||qMap.has(q.id)||!audit.integrity(pair)) {errors.push('문항 연결 오류: '+(q?.id||'?'));continue}
   if(BASELINE_FINGERPRINTS[q.id]!==sourceFingerprint(q))errors.push('고정 원본 지문/선지/답안 불일치: '+q.id);
   if(typeof e.answerReason!=='string'||!e.answerReason.trim()||typeof e.summaryEasy!=='string'||!e.summaryEasy.trim())
    errors.push('문제별 자체 해설 미작성: '+q.id);
   if(!/^https:\/\/www\.q-net\.or\.kr\//.test(q.originalUrl||'')||!q.originalUrl.includes('menuType=cst00309')||
     !notices[q.year])errors.push('Q-Net 원문/정답 공고 연결 오류: '+q.id);
   qMap.set(q.id,{q,e,items:[]});
  }
  if(matches.length!==400||qMap.size!==400)errors.push('400문항 수량 오류: '+matches.length+'/'+qMap.size);
  const options=[];
  for(const r of optionReview.rows){
   const parent=qMap.get(r.questionId);
   if(!parent){errors.push('선지 문항 미존재: '+r.id);continue}
   const q=parent.q,e=parent.e;
   const inputNote={questionId:q.id,year:q.year,questionText:q.question,
    officialAnswers:q.correct.join('/'),index:r.index,optionText:r.optionText};
   // Candidate is only used if all original fields and an unreviewed status match.
   let note=null;
   for(const v of [v162,v161]){
    const n=v?.get?.(inputNote);
    if(n&&n.id===q.id&&n.option===r.index&&n.expertVerdict==='unreviewed'&&n.signedOff===false&&
      typeof n.text==='string'&&n.text.trim().length>=30){note=n;break}
   }
   const old=String(e.options?.[r.index-1]?.draftReason||'').trim();
   const selectedContext=r.officialAccepted&&!old?String(e.answerReason||'').trim():'';
   const tier=note?'ai_option_candidate':old?'existing_option_candidate':
    selectedContext?'answer_context_only':'no_independent_reason';
   const obj=Object.freeze({
    id:r.id,questionId:q.id,year:q.year,index:r.index,
    optionText:r.optionText,officialAccepted:r.officialAccepted,
    tier,detail:note?.text||old||selectedContext||'',
    mathExpression:note?.calculation?.equation||'',
    refs:Object.freeze((note?.sources||[]).filter(x=>safeUrl(x.url)&&x.type==='POTENTIAL_PRIMARY_LEGAL_OR_REFERENCE_LINK')
     .map(x=>({url:safeUrl(x.url),type:x.type}))),
    sourceChecked:false,expertReviewed:false,officialPublished:false
   });
   options.push(obj);parent.items.push(obj);
  }
  for(const [id,pair] of qMap){
   if(pair.items.length!==5||pair.items.some((x,i)=>x.index!==i+1||x.optionText!==pair.q.options[i]||
    x.officialAccepted!==pair.q.correct.includes(i+1)))errors.push('5선지 1:1 연결 오류: '+id);
  }
  const years=Array.from({length:5},(_,i)=>2025-i);
  for(const y of years){
   for(const sub of ['estate','civil']){
    if([...qMap.values()].filter(p=>p.q.year===y&&p.q.subject===sub).length!==40)
     errors.push('연도별 40문항 누락: '+y+'/'+sub);
   }
  }
  if(errors.length)return fail(errors);
  const list=Array.from(qMap.values()).sort((a,b)=>b.q.year-a.q.year||a.q.number-b.q.number)
   .map(({q,e,items})=>Object.freeze({
    id:q.id,year:q.year,number:q.number,subject:q.subject,question:q.question,
    correct:Object.freeze(q.correct.slice()),options:Object.freeze(items),
    easy:e.summaryEasy,answerReason:e.answerReason,
    trap:String(e.traps?.[0]?.text||''),paperNotice:safeUrl(q.originalUrl),
    finalAnswerNotice:notices[q.year],draftStatus:'INDEPENDENT_EXPERT_REVIEW_PENDING'
   }));
  const aiCount=options.filter(x=>x.tier==='ai_option_candidate').length;
  const legacyCount=options.filter(x=>x.tier==='existing_option_candidate').length;
  const fallback=options.filter(x=>x.tier==='answer_context_only').length;
  const noReason=options.filter(x=>x.tier==='no_independent_reason').length;
  const stats=Object.freeze({
   structuralQuestionsChecked:list.length,structuralOptionsChecked:options.length,
   baselineQuestionFingerprintsChecked:list.length,
   questionLevelStudyDrafts:list.filter(q=>q.easy.trim()&&q.answerReason.trim()).length,
   publiclyReadableStudyDrafts:list.length,aiOptionCandidates:aiCount,
   existingOptionCandidates:legacyCount,answerContextOnly:fallback,
   optionsWithoutIndependentCandidate:noReason,
   independentCandidateCoverage:aiCount+legacyCount,
   allCandidateCoverage:aiCount+legacyCount+fallback,
   expertVerifiedQuestions:0,expertVerifiedOptions:0,officialExplanationsPublished:0,
   officialProblemAndKeyNotices:5,officialPdfAttachmentsRead:0
  });
  return Object.freeze({ready:true,errors:[],stats,questions:Object.freeze(list),
   options:Object.freeze(options),sourcePreflightPassed:options.length});
 }
 function snapshot(rows){
  if(cachedInput!==rows||cachedAudit!==root?.CK160OptionAudit||cachedV161!==root?.CK161SubstantiveReview||
   cachedV162!==root?.CK162SubstantiveReview){
   cachedInput=rows;cachedAudit=root?.CK160OptionAudit;cachedV161=root?.CK161SubstantiveReview;
   cachedV162=root?.CK162SubstantiveReview;cachedResult=build(rows);
  }
  return cachedResult;
 }
 function choice(a){return '<option value="'+esc(a[0])+'">'+esc(a[1])+'</option>'}
 function optionList(items,current){return items.map(([v,label])=>
  '<option value="'+esc(v)+'"'+(String(current)===String(v)?' selected':'')+'>'+esc(label)+'</option>').join('')}
 function filter(list){
  return list.filter(q=>(!state.year||q.year===state.year)&&
   (state.subject==='all'||q.subject===state.subject)&&
   (state.focus==='all'||state.focus==='ai'&&q.options.some(o=>o.tier==='ai_option_candidate')||
    state.focus==='needs'&&q.options.some(o=>o.tier==='no_independent_reason')||
    state.focus==='special'&&q.correct.length>1));
 }
 function renderCard(q){
  const correct=q.correct.length===5?'전원정답 (진위와 별개)':q.correct.map(n=>'①②③④⑤'[n-1]).join('·');
  return '<article class="ck163-question" data-ck163-id="'+esc(q.id)+'">'+
   '<header><strong>'+q.year+'년 '+q.number+'번 · '+(q.subject==='estate'?'학개론':'민법')+'</strong>'+
   '<small>공식 채점 인정: '+esc(correct)+' · 해설은 자체 초안</small></header>'+
   '<p class="ck163-question-text">'+esc(q.question)+'</p>'+
   '<ol class="ck163-options">'+q.options.map((o,i)=>
     '<li><strong>'+'①②③④⑤'[i]+(o.officialAccepted?' · 채점 인정':' · 채점 비인정')+'</strong>'+
     '<span>'+esc(o.optionText)+'</span>'+
     '<p>'+(o.tier==='ai_option_candidate'?'선지별 AI 근거 후보':o.tier==='existing_option_candidate'?
      '이전 선지별 근거 초안':o.tier==='answer_context_only'?
      '정답 문항 근거만 연결됨':'이 선지의 개별 근거 미작성')+
     ' · <b>원전·전문가 미검수</b></p>'+
     (o.detail?'<p class="ck163-reason">'+esc(o.detail)+'</p>':'')+
     (o.mathExpression?'<p>독립 수식 검산: '+esc(o.mathExpression)+'</p>':'')+
     (o.refs.length?'<p>'+o.refs.map((ref,i)=>'<a href="'+esc(ref.url)+
      '" target="_blank" rel="noopener noreferrer">법령·판례 참고 후보 '+(i+1)+'</a>').join(' · ')+'</p>':'')+
     '</li>').join('')+'</ol>'+
   '<div class="ck163-rationale"><h4>쉬운 설명 · 자체 작성</h4><p>'+esc(q.easy)+'</p>'+
    '<h4>정답 근거 · 자체 작성</h4><p>'+esc(q.answerReason)+'</p>'+
    (q.trap?'<p><strong>혼동 포인트:</strong> '+esc(q.trap)+'</p>':'')+'</div>'+
   '<p class="ck163-disclaimer">개별 진위·원문 PDF·시험 당시 법령/판례 전문·전문가 서명 미확인. 채점 인정번호만 공식 정답으로 표시합니다.</p>'+
   '<div class="ck163-links"><a href="'+esc(q.paperNotice)+'" target="_blank" rel="noopener noreferrer">Q-Net 문제지 공고</a>'+
   '<a href="'+esc(q.finalAnswerNotice)+'" target="_blank" rel="noopener noreferrer">Q-Net 최종정답 공고</a>'+
   '<button type="button" data-ck163-open="'+esc(q.id)+'">기존 문항 분석 열기</button></div>'+
   '</article>';
 }
 function details(s){
  if(!state.open||!s.ready)return '';
  const matched=filter(s.questions),pages=Math.max(1,Math.ceil(matched.length/state.pageSize));
  state.page=Math.max(0,Math.min(pages-1,state.page));
  return '<div class="ck163-detail"><div class="ck163-controls">'+
   '<label>연도<select data-ck163-filter="year">'+optionList([[0,'전체'],...[2025,2024,2023,2022,2021].map(y=>[y,y+'년'])],state.year)+'</select></label>'+
   '<label>과목<select data-ck163-filter="subject">'+optionList([['all','전체'],['estate','학개론'],['civil','민법']],state.subject)+'</select></label>'+
   '<label>검토 단계<select data-ck163-filter="focus">'+optionList([['all','전체'],['ai','독립 AI 후보 있음'],['needs','선지별 근거 미작성'],['special','복수·전원정답']],state.focus)+'</select></label>'+
   '</div><div class="ck163-pager"><strong>'+matched.length+'문항 · '+(state.page+1)+'/'+pages+'쪽</strong>'+
   '<button type="button" data-ck163-page="prev"'+(state.page===0?' disabled':'')+'>이전</button>'+
   '<button type="button" data-ck163-page="next"'+(state.page===pages-1?' disabled':'')+'>다음</button></div>'+
   (matched.length?'<div class="ck163-list">'+matched.slice(state.page*state.pageSize,(state.page+1)*state.pageSize).map(renderCard).join('')+'</div>':
    '<p>선택한 조건에 해당하는 문항이 없습니다.</p>')+'</div>';
 }
 function panel(rows){
  const s=snapshot(rows);if(!s?.ready)return '<section class="ck163-publish ck163-error" role="status"><h3>학습용 해설 발행 차단</h3><p>원문·정답·해설 정합성이 맞지 않아 공개하지 않습니다.</p><p>'+esc(s?.errors?.slice(0,3).join(' · ')||'감사 모듈 준비 전')+'</p></section>';
  const st=s.stats;
  return '<section class="ck163-publish" aria-label="최근 5개년 자체 학습용 해설 전수 공개">'+
   '<header><strong>공식 기출 400문항 · 자체 해설 초안 전체 열람</strong>'+
   '<small>공식 정답과 자체 풀이를 구분하며 Q-Net 공식 해설로 표시하지 않습니다.</small></header>'+
   '<dl class="ck163-metrics">'+[
    ['문항별 설명·정답근거',st.questionLevelStudyDrafts+'/400'],
    ['원문·정답·선지 자동 구조 대조',st.structuralOptionsChecked+'/2000'],
    ['독립 AI 개별 선지 후보',st.aiOptionCandidates+'/2000'],
    ['기존 선지 근거 후보',st.existingOptionCandidates+'/2000'],
    ['선지 근거 후보 부족',st.optionsWithoutIndependentCandidate+'/2000'],
    ['전문가 감수',st.expertVerifiedOptions+'/2000']
   ].map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>'+
   '<p class="ck163-disclaimer">400문항 전체 학습용 설명을 읽을 수 있지만 ①~⑤ 각각의 독립 근거 완성과 전문가 검증은 별도입니다. 등록·자동 구조 감사가 원문 PDF 실검독이나 법리 감수가 되지는 않습니다.</p>'+
   '<div class="ck163-actions"><button type="button" data-ck163-toggle aria-expanded="'+state.open+'">'+(state.open?'400문항 해설 접기':'400문항 해설 모두 보기')+'</button>'+
   '<button type="button" data-ck163-export>400문항·2,000선지 자체 해설 TXT</button></div>'+
   details(s)+'</section>';
 }
 function exportText(s){
  if(!s?.ready||s.questions.length!==400||s.options.length!==2000)return '';
  const lines=['ConceptKnot · 공식 기출 A형 2021–2025 / 자체 작성 학습용 해설 400문항',
   '출처: Q-Net 공식 문제지·최종정답 공고. 풀이·선지별 메모는 ConceptKnot 자체 작성.',
   '주의: Q-Net 인증 공식 해설이 아닙니다. 시험지 원본 PDF 전체·2025년 당시 등 법령·판례 전문 전문가 감수 미완료.',
   '자동 검증: 문항/정답/선지 구조 400/400 · 2000/2000. 내용의 법리·진위 검증과 구별.',
   ''];
  for(const q of s.questions){
   lines.push('=== '+q.year+'년 '+q.number+'번 '+(q.subject==='estate'?'학개론':'민법')+' ===',
    '문제: '+q.question,'채점 인정: '+(q.correct.length===5?'전원정답':q.correct.join('/')),
    '쉬운 설명: '+q.easy,'정답 근거: '+q.answerReason,
    '주의: 본문은 자체 작성 미검수 초안 / 공식 채점 정보 외 개별 진위 미확정');
   for(const o of q.options)lines.push('선지 '+o.index+' ['+(o.officialAccepted?'채점 인정':'채점 비인정')+'] '+o.optionText,
    '초안 등급: '+o.tier,'참고·풀이 후보: '+(o.detail||'개별 독립 근거 미작성 · 원전 검독 필요'),
    ...(o.mathExpression?['계산 검토: '+o.mathExpression]:[]));
   lines.push('문제지 공고: '+q.paperNotice,'최종정답 공고: '+q.finalAnswerNotice,'');
  }
  return lines.join('\n');
 }
 function clicked(t,rows,download,message,openQuestion){
  if(t.hasAttribute('data-ck163-toggle')){state.open=!state.open;state.page=0;return {handled:true,render:true}}
  if(t.hasAttribute('data-ck163-page')){state.page+=t.dataset.ck163Page==='next'?1:-1;return {handled:true,render:true}}
  if(t.hasAttribute('data-ck163-export')){
   const s=snapshot(rows);const content=exportText(s);
   if(!content){message('400문항 원문·해설 1:1 대조 실패 · 내보내기 차단');return {handled:true}}
   download('ConceptKnot_P4_400문항_자체학습용해설_미검수_'+new Date().toISOString().slice(0,10)+'.txt',
    content,'text/plain;charset=utf-8');
   message('자체 해설 400문항·선지 2,000개 TXT 생성 요청 · Q-Net 인증 해설이 아닙니다.');
   return {handled:true};
  }
  if(t.hasAttribute('data-ck163-open')){
   const id=String(t.dataset.ck163Open||''),s=snapshot(rows),item=s?.questions?.find(q=>q.id===id);
   if(item)openQuestion?.(item.year,item.number,t);
   else message('원본 연결에 문제가 있어 문항을 열지 않았습니다.');
   return {handled:true};
  }
  return {handled:false};
 }
 function changed(t){
  if(!t?.matches?.('[data-ck163-filter]'))return false;
  const key=t.dataset.ck163Filter;
  if(key==='year'){const y=Number(t.value);if(y!==0&&!(y>=2021&&y<=2025))return false;state.year=y}
  else if(key==='subject'&&['all','estate','civil'].includes(t.value))state.subject=t.value;
  else if(key==='focus'&&['all','ai','needs','special'].includes(t.value))state.focus=t.value;
  else return false;
  state.page=0;return true;
 }
 return Object.freeze({build,snapshot,panel,clicked,changed,exportText,getState:()=>({...state})});
});
