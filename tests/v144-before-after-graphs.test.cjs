/* ConceptKnot v144 P6-B3: developer-run tests, no GitHub Actions or artifact generation.
 * Run manually: node --test tests/v144-before-after-graphs.test.cjs
 */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const math=require('../assets/ck-concept-math-v141.js');
const theoryModels=require('../assets/ck-theory-models-v142.js');
const changes=require('../assets/ck-concept-transition-v144.js');
const view=require('../assets/ck-concept-transition-view-v144.js');
const b={...math.BASE};
function metric(s,key){const m=s.metrics.find(m=>m.label===key);A.ok(m,'missing metric '+key);return m;}
test('demand curve parallel movement preserves slope and shifts equilibrium correctly',()=>{
 for(const [u,tag,p,q] of [[20,'수요 증가',30,80],[-20,'수요 감소',20,60]]){
  const next={...b,u},r=changes.market(b,next,math);
  A.equal(r.operation,'곡선 평행이동');A.equal(r.tag,tag);
  A.equal(metric(r,'균형가격 P*').before,'25');
  A.equal(metric(r,'균형가격 P*').after,String(p));
  A.equal(metric(r,'균형거래량 Q*').after,String(q));
  A.equal(next.b,b.b);A.match(r.rule,/곡선 전체/);
  A.match(r.trap,/곡선 이동/);
 }
 for(const [v,tag,p,q] of [[20,'공급 증가',20,80],[-20,'공급 감소',30,60]]){
  const next={...b,v},r=changes.market(b,next,math);
  A.equal(r.tag,tag);A.equal(r.operation,'곡선 평행이동');
  A.equal(metric(r,���q�^