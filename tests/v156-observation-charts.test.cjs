/* ConceptKnot v156 nine observation diagrams: no false equilibrium claims. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const M=require('../assets/ck-graph-motion-v149.js');
const chart=id=>({id,type:id==='elasticity'?'elasticity':id==='stock-flow'?'stock':
 id==='ceiling'?'ceiling':id==='cobweb'?'cobweb':id==='price-along'?'along':'distance',
 title:id,question:'관련 기본이론?',answer:'조건을 비교'});
const sample=(id,value)=>M.explain(chart(id),{...M.defaultSnapshot(chart(id)),value});
const cases=[
 ['price-along','곡선 위','가격','수요량'],
 ['elasticity','가격탄력성','기울기','변화율'],
 ['ceiling','최고가격제','부족','P상한'],
 ['cobweb','시차','기울기','수렴'],
 ['rent-distance','입찰지대','접근성','거리'],
 ['present-value','PV=FV/','현재가치','할인율'],
 ['stock-flow','저량','새로 공급된','기간'],
 ['cap-rate','NOI/R','환원율','반비례'],
 ['huff','허프모형','거리','경쟁']
];
for(const [id,hard,easy,term] of cases){
 test(id+' explains after-state without claiming measured data',()=>{
  const before=sample(id,0),after=sample(id,70);
  A.equal(before.tilted,false);A.equal(after.tilted,false);
  A.equal(before.schematic,true);A.equal(after.schematic,true);
  A.equal(before.action,'관찰 시작 전');
  A.equal(after.action,'곡선 위 관찰점 이동');
  A.ok((after.advanced+after.easy+after.exam).includes(hard),hard);
  A.ok((after.advanced+after.easy).includes(easy),easy);
  A.ok((after.advanced+after.easy+after.exam).includes(term),term);
  A.match(after.exam,/원본|기출|기존|조건/);
  A.ok(after.easy.includes('처음 지점'));
  A.match(after.slope,/실제 가격·수익률·거래량 변화율이 아닙니다/);
 });
}
test('PV, stock and rent diagrams do not claim market equilibrium',()=>{
 for(const [id] of cases)A.equal(sample(id,50).equilibrium,
  '교점 변화를 계산하는 도식이 아닙니다.');
});
test('all 17 diagrams mount easy, advanced and exam theory',()=>{
 const src=fs.readFileSync('assets/ck-graph-direct-v149.js','utf8');
 A.ok(src.includes("if(!controls.querySelector?.('[data-ck156-theory]'))"));
 for(const token of ['data-ck156-easy','data-ck156-advanced','data-ck156-exam'])A.ok(src.includes(token));
 const all=fs.readFileSync('assets/ck-charts-v21.js','utf8');
 const section=all.slice(0,all.indexOf('];\nlet selected'));
 A.equal((section.match(/\{id:'/g)||[]).length,17);
});

