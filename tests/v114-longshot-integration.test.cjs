/* ConceptKnot v114: source-level regression for manual local Node execution.
 * No GitHub Actions, downloads, build artifacts or external services required.
 */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

test('official 10-year data keeps all 800 unique validated A-form questions',()=>{
 const bank=[...json('data/official-2016-2020.json'),...json('data/official-2021-2025.json')];
 assert.equal(bank.length,800);
 assert.equal(new Set(bank.map(q=>q.id)).size,800);
 for(let year=2016;year<=2025;year++){
  const items=bank.filter(q=>q.year===year);
  assert.equal(items.length,80);
  assert.equal(items.filter(q=>q.subject==='estate').length,40);
  assert.equal(items.filter(q=>q.subject==='civil').length,40);
 }
 let all=0,multiple=0;
 for(const q of bank){
  assert.equal(q.id,q.year+'-'+q.number);
  assert.equal(q.verified,true);
  assert.equal(q.options.length,5);
  assert.ok(q.options.every(x=>typeof x==='string'&&x.trim()));
  assert.ok(q.correct.length>=1&&q.correct.length<=5);
  assert.ok(q.correct.every(x=>Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=5));
  if(q.correct.length===5)all++;else if(q.correct.length>1)multiple++;
 }
 assert.equal(all,8);
 assert.equal(multiple,3);
 const explanations=Array.from({length:5},(_,i)=>json('data/explanations/official-'+(2021+i)+'.json'));
 assert.equal(explanations.reduce((n,item)=>n+item.records.length,0),400);
 for(const bundle of explanations){
  assert.ok(bundle.records.every(x=>['unstarted','draft','published'].includes(x.quality?.status)));
 }
});

test('graph E0/E1 points follow demand/supply intersections and preserve unknown general price direction',()=>{
 const window={};
 vm.runInNewContext(read('assets/ck-charts-v21.js'),{window});
 const api=window.CK21Charts;
 const entries=api.charts.filter(x=>['demand','supply','both'].includes(x.type));
 assert.ok(entries.length>=8);
 for(const c of entries){
  const d=api.equilibriumDelta(c);
  assert.ok([d.origin.x,d.origin.y,d.next.x,d.next.y,d.dx,d.dy].every(Number.isFinite));
  assert.ok(d.origin.x>86&&d.origin.x<510&&d.next.x>86&&d.next.x<510);
  if(c.type==='demand'){
   assert.equal(Math.sign(d.dx),Math.sign(c.shift));
   assert.equal(Math.sign(d.dy),-Math.sign(c.shift));
  }
  if(c.type==='supply'){
   assert.equal(Math.sign(d.dx),Math.sign(c.shift));
   assert.equal(Math.sign(d.dy),Math.sign(c.shift));
  }
  if(c.type==='both'){
   assert.ok(Math.abs(d.dx-55)<1e-8);
   assert.ok(Math.abs(d.dy)<1e-8);
   assert.match(api.equilibriumOutcome(c),/가격 방향이 달라집니다/);
  }
 }
 api.choose(api.charts.findIndex(x=>x.type==='both'));
 assert.match(api.render(),/ck21-equilibrium-moving/);
 api.play();
 assert.match(api.render(),/ck21-revealed/);
});

test('selected 1-5 option-review packet preserves keyed CK83 notes and separate CK80 drafts',()=>{
 const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
 const window={addEventListener(){}};
 vm.runInNewContext(read('assets/ck-evidence-queue-v111.js'),
  {document,window,requestAnimationFrame:()=>1});
 const item={id:'2025-1',year:2025,number:1,subject:'estate',verified:true,question:'수요가 변한다.',
  options:['①','②','③','④','⑤'],correct:[2],originalUrl:'https://example.org/exam'};
 const optionNotes=Object.fromEntries(Array.from({length:5},(_,i)=>[String(i+1),
  {assessment:'true',reason:'reason-'+(i+1),source:'source-'+(i+1)}]));
 const draft={options:Array.from({length:5},(_,i)=>({no:i+1,verdict:'false',
  why:'draft-why-'+(i+1),source:'draft-src-'+(i+1)}))};
 const rows=window.CK111Evidence.rows({'2025-1':item},
  {'2025-1':{optionNotes}},{'2025-1':draft});
 assert.equal(rows.length,1);
 assert.equal(rows[0].sourced,5);
 assert.equal(rows[0].draftSourced,5);
 const packet=window.CK111Evidence.reviewPacket(rows);
 for(const marker of ['source-1','source-5','draft-src-1','draft-src-5','CK83 개인 판단',
  'CK80 개인 초안','공식 검토 체크'])assert.ok(packet.includes(marker),marker);
 assert.ok(packet.indexOf('source-1')<packet.indexOf('source-5'));
 assert.equal(window.CK111Evidence.reviewPacket([]),'');
 const optionsCsv=window.CK111Evidence.csvDocument(rows,'options').trim().split('\r\n');
 assert.equal(optionsCsv.length,6);
 for(let i=1;i<=5;i++){
  const columns=optionsCsv[i].match(/"(?:[^"]|"")*"/g)
   .map(x=>x.slice(1,-1).replace(/""/g,'"'));
  assert.equal(columns.length,13);
  assert.equal(columns[8],'source-'+i);
  assert.equal(columns[11],'draft-src-'+i);
 }
 assert.match(read('assets/ck-evidence-queue-v111.js'),/compositionend/);
 assert.match(read('assets/ck-evidence-queue-v111.js'),/PICK_LIMIT=5/);
});

test('failed personal note storage and failed exam navigation roll back in-memory state',()=>{
 const html=read('index.html');
 const n1=html.indexOf('window.CK78Study=Object.freeze({');
 const n2=html.indexOf('window.CK76Study=Object.freeze({',n1);
 const n3=html.indexOf('\nfunction render(){',n2);
 assert.ok(n1>0&&n2>n1&&n3>n2);
 const note=html.slice(n1,n2),exam=html.slice(n2,n3);
 const state={notes:{'exam-2025-1':'original'}};
 const window={RECALL_OFFICIAL:{'2025-1':{verified:true}}};
 new Function('window','state','save',note)(window,state,()=>false);
 assert.equal(window.CK78Study.saveNote('2025-1','unsaved'),false);
 assert.equal(window.CK78Study.getNote('2025-1'),'original');
 assert.equal(window.CK78Study.saveNote('2025-1','original'),true);
 const fresh={notes:{}};
 const freshWindow={RECALL_OFFICIAL:{'2025-1':{verified:true}}};
 new Function('window','state','save',note)(freshWindow,fresh,()=>false);
 assert.equal(freshWindow.CK78Study.saveNote('2025-1','new'),false);
 assert.equal(Object.hasOwn(fresh.notes,'exam-2025-1'),false);
 const selected={year:2025,subject:'estate',examQuestion:1};
 const examWindow={RECALL_OFFICIAL:{'2024-12':{verified:true,subject:'civil'}}};
 let changed=0;
 new Function('window','state','save','render','ck115CanLeave','changeView',exam)(
  examWindow,selected,()=>false,()=>changed++,()=>true,()=>changed++);
 assert.equal(examWindow.CK76Study.openQuestion(2024,12),false);
 assert.deepEqual(selected,{year:2025,subject:'estate',examQuestion:1});
 assert.equal(changed,0);
});

test('due TTS refuses partial official bank and reports empty queue clearly',()=>{
 const html=read('index.html');
 const start=html.indexOf('function ck109ReadDue(');
 const end=html.indexOf('function ck112ReadSelected(',start);
 assert.ok(start>0&&end>start);
 const fragment=html.slice(start,end);
 let speech=0,stop=0,error='',missing=true;
 const window={CK86ExamBridge:{getDue:()=>({rows:[{id:'2025-1'},{id:'2019-23'}]})},
  RECALL_OFFICIAL:{}};
 const readOfficial=(y,n)=>{
  if(missing&&y===2019)throw Error('offline record unavailable');
  return {id:y+'-'+n,special:'normal'};
 };
 const play=new Function('window','officialAudioEntry','ttsStop','ck76VoiceState','ttsPlay','ck76Voice',
  fragment+';return ck109ReadDue;')(window,readOfficial,()=>stop++,
  (state,message)=>{if(state==='error')error=message;},()=>speech++,{status:'ready'});
 const result=play('qa',40);
 assert.equal(result.ok,false);
 assert.equal(result.reason,'incomplete-due');
 assert.equal(speech,0);
 assert.equal(stop,1);
 assert.match(error,/미로딩/);
 missing=false;
 assert.equal(play('qa',40).ok,true);
 assert.equal(speech,1);
});

test('v114 static delivery stays manual-only with updated assets and valid inline scripts',()=>{
 const config=json('vercel.json'),html=read('index.html'),sw=read('sw.js');
 assert.equal(config.git?.deploymentEnabled,false);
 for(const path of ['ck-evidence-queue-v111.js?v=114','ck-study-editor-v80.js?v=127',
  'ck-study-links-v83.js?v=115','ck-study-p4-v78.js?v=114',
  'ck-charts-v21.js?v=114','experience-v21.css?v=114']){
  assert.ok(html.includes(path),'HTML missing '+path);
  assert.ok(sw.includes(path),'Service worker missing '+path);
 }
 assert.match(sw,/conceptknot-study-v11[45]/);
 if(fs.existsSync('.github/workflows'))
  assert.equal(fs.readdirSync('.github/workflows').length,0);
 const re=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
 let match,checked=0;
 while((match=re.exec(html))){
  const attrs=match[1],script=match[2].trim();
  if(!script||/\btype\s*=\s*["'](?:module|application\/json|application\/ld\+json|importmap)/i.test(attrs))continue;
  assert.doesNotThrow(()=>new Function(script));
  checked++;
 }
 assert.ok(checked>=4);
});
