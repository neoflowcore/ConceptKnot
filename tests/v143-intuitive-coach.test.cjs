/* ConceptKnot P6-B-2 v143: deterministic learning explanations + virtual DOM integration.
 * Run once manually: node --test tests/v143-intuitive-coach.test.cjs
 */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const M=require('../assets/ck-concept-math-v141.js');
const C=require('../assets/ck-concept-coach-v143.js');
const T=require('../assets/ck-theory-models-v142.js');
const base={...M.BASE}, m=(u=0,v=0,p=25)=>({...base,u,v,price:p});
const bmi=T.initial('budget');
function change(id,key,value){return T.set(id,T.initial(id),key,value);}
test('M01-M12 equilibrium cases remain correct for the illustrative model',()=>{
 const cases=[[0,0,25,70],[20,0,30,80],[-20,0,20,60],[0,20,20,80],[0,-20,30,60],[20,20,25,90],[40,20,30,100],[20,40,20,100]];
 for(const [u,v,p,q] of cases){const z=M.solve(m(u,v));A.equal(z.price,p);A.equal(z.quantity,q);}
 A.equal(M.point(base,30).qd,60);A.equal(M.point(base,30).qs,80);
 const h=M.createHistory();A.equal(h.apply('set-demand',20),true);
 A.equal(h.undo(),true);A.equal(h.redo(),true);A.equal(h.state.u,20);
 A.equal(M.createHistory(h.export()).state.u,20);
});
test('market structural shifts do not turn into price-point changes',()=>{
 const cases=[
  [m(20),'수요 증가'],[m(-20),'수요 감소'],
  [m(0,20),'공급 증가'],[m(0,-20),'공급 감소'],
  [m(20,20),'수요·공급 동시 이동']
 ];
 for(const [next,tag] of cases){
  const c=C.market('market',base,next,'set-demand',M);
  A.equal(c.tag,tag);A.equal(c.kind,'structure');
  A.ok(c.example.length>20);A.ok(c.caution.length>10);
 }
 const p=C.market('market',base,m(0,0,20),'change-price-point',M);
 A.equal(p.tag,'수요량 증가');A.equal(p.kind,'movement');
 A.match(p.caution,/균형가격/);
 A.match(C.market('market',base,m(20,20),'set-demand',M).summary,/균형가격 불변/);
});
test('price elasticity classification is computed at the observed point',()=>{
 for(const [price,tag] of [[25,'비탄력적'],[30,'단위탄력적'],[35,'탄력적']]){
  const c=C.market('elasticity',base,m(0,0,price),'change-price-point',M);
  A.equal(c.tag,tag);
  A.match(c.caution,/기울기/);
 }
 const slope=M.transition(base,'adjust-demand-slope',3);
 A.equal(C.market('market',base,slope,'adjust-demand-slope',M).tag,'기울기 변화');
});
test('direct / inverse proportion change k is not mislabeled as x-only movement',()=>{
 const a={x:1,k:2};
 const x=C.market('relation',null,null,null,null,a,{x:2,k:2});
 A.match(x.summary,/정비례 y는 증가하고 반비례 y는 감소/);
 const k=C.market('relation',null,null,null,null,a,{x:1,k:3});
 A.equal(k.tag,'비례계수 변경');A.equal(k.kind,'structure');
});
test('budget shifts, X/Y price rotations, preferences and multi-factor cases are distinct',()=>{
 const cases=[['I',160,'소득 증가 → 평행이동'],['px',15,'X 가격 상승 → 회전'],
  ['py',15,'Y 가격 상승 → 회전'],['alpha',.6,'선호 변화 → 최적점 이동']];
 for(const [key,v,tag] of cases)A.equal(C.theory('budget',bmi,change('budget',key,v),T).tag,tag);
 const combined={...bmi,I:160,px:15};
 A.equal(C.theory('budget',bmi,combined,T).tag,'예산·가격 복합 변화');
});
test('PPF inside/on/outside status, MR=MC, rent, cobweb, arc rules are model-derived',()=>{
 const pp=T.initial('ppf');
 A.equal(C.theory('ppf',pp,change('ppf','x',75),T).tag,'효율적 생산');
 A.equal(C.theory('ppf',pp,change('ppf','u',.5),T).tag,'비효율적 생산');
 A.equal(C.theory('ppf',pp,change('ppf','u',1.2),T).tag,'생산가능영역 밖');
 const cost=T.initial('cost'),qstar=T.calc('cost',cost).optimal;
 A.equal(C.theory('cost',cost,change('cost','q',40),T).tag,'생산량 과다');
 A.equal(C.theory('cost',cost,change('cost','q',qstar),T).tag,'이윤극대 생산량');
 const rent=T.initial('rent');
 A.match(C.theory('rent',rent,change('rent','d',10),T).summary,/거리만/);
 const cob=T.initial('cobweb');
 A.match(C.theory('cobweb',cob,change('cobweb','d',4),T).tag,/발산/);
 const arc=T.initial('arc');
 A.equal(C.theory('arc',arc,change('arc','p2',20),T).tag,'호탄력성 계산 불가');
});
test('UI code mounts both laboratories and contains no literal template leak',()=>{
 const listeners={};
 const window={addEventListener(){},requestAnimationFrame(cb){cb();return 1}};
 const document={addEventListener(k,cb){(listeners[k]??=[]).push(cb);},
  createElement(){return {dataset:{},isConnected:false,innerHTML:'',setAttribute(){},querySelector(){return null}};}};
 const localStorage={getItem(){return null},setItem(){},removeItem(){}};
 const ctx={window,document,localStorage};
 for(const name of ['assets/ck-concept-math-v141.js','assets/ck-theory-models-v142.js',
  'assets/ck-concept-coach-v143.js','assets/ck-concept-lab-v141.js','assets/ck-theory-v142.js'])
  vm.runInNewContext(read(name),ctx,{filename:name});
 const chart=()=>({isConnected:true,children:[],querySelector(){return null;},
  appendChild(node){node.isConnected=true;this.children.push(node);},
  append(node){this.appendChild(node);}});
 const a=chart(),b=chart();
 A.equal(window.CK141ConceptLab.mount(a),true);A.equal(window.CK142Theory.mount(b),true);
 for(const k of ['ck143-insight','ck143-numeric','ck141-line-hit','data-ck141-level="beginner"'])
  A.ok(a.children[0].innerHTML.includes(k),k);
 for(const k of ['ck143-insight','ck143-numeric','ck142-legend','data-ck142-handle="px"',
  'data-ck142-handle="py"','data-ck142-handle="I"'])
  A.ok(b.children[0].innerHTML.includes(k),k);
 A.doesNotMatch(b.children[0].innerHTML,/\+models\.drawing|\\n\s*'<span class/);
 // The two UI controllers share only isolated opt-in storage keys.
 for(const file of ['assets/ck-concept-lab-v141.js','assets/ck-theory-v142.js']){
  const source=read(file);
  A.match(source,/data-ck14[12]-level/);
  A.doesNotMatch(source,/localStorage\.(clear|setItem)\(['"]ck82/);
 }
});
test('loader, offline cache and version metadata have the same v143 generation',()=>{
 const glue=read('assets/ck-study-charts-v79.js');
 const index=read('index.html'),sw=read('sw.js');
 A.match(index,/ck-release" content="v143-p6b-intuition-first"/);
 A.match(index,/ck-study-charts-v79.js\?v=143/);
 for(const asset of ['ck-concept-coach-v143.js?v=143','ck-concept-lab-v141.js?v=143',
  'ck-theory-v142.js?v=143','ck-concept-intuition-v143.css?v=143']){
  A.ok(glue.includes(asset)||asset.includes('css'),asset);
  A.ok(sw.includes(asset),asset+' offline list');
 }
 A.match(sw,/conceptknot-study-v143-intuition-first-p6b/);
 const core=sw.match(/const CRITICAL=\[([\s\S]*?)\];/);A.ok(core);
 A.equal([...core[1].matchAll(/'\.\/[^']+'/g)].length,11);
 A.doesNotMatch(core[1],/ck-concept-coach|ck-theory|models\/tts\/supertonic/);
 const vercel=JSON.parse(read('vercel.json'));
 A.equal(vercel.git.deploymentEnabled,false);
 A.equal(fs.existsSync('.github/workflows'),false);
 for(const path of ['assets/ck-concept-coach-v143.js','assets/ck-concept-lab-v141.js',
  'assets/ck-theory-v142.js','assets/ck-study-charts-v79.js'])
  new vm.Script(read(path),{filename:path});
});
