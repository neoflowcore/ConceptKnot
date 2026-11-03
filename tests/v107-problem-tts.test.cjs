'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
function analysisFacade(bank,personal){
 const win={RECALL_OFFICIAL:bank,CK83Links:{getLink:()=>personal,reviewSummary:()=>({questions:1,sourceLinked:1})}};
 const doc={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null}};
 vm.runInNewContext(read('assets/ck-study-p4-v78.js'),{window:win,document:doc,fetch(){},requestAnimationFrame(){}});
 return win.CK78Analysis;
}
test('v107 problem types and personal review are candidate-only',()=>{
 const q={id:'2025-3',year:2025,number:3,subject:'estate',verified:true,question:'옳지 않은 것은? 탄력성을 계산',options:['a','b','c','d','e'],correct:[2]};
 const app=analysisFacade({'2025-3':q},{conceptIds:['estate.a'],optionNotes:{'1':{assessment:'true',reason:'검토',source:'PDF 10'}}});
 assert.ok(app.classify(q).includes('select_incorrect'));
 assert.ok(app.classify(q).includes('calculation_or_numeric'));
 assert.equal(app.personalProgress(q).sourced,1);
 assert.match(app.yearCoverage(),/검증 완료를 의미하지 않습니다/);
 assert.ok(app.reviewSteps(q).length>=4);
});
test('v107 all-accepted answers are not voiced as true and original question keys are preferred',()=>{
 const html=read('index.html');
 assert.match(html,/Official A-form bank keys outrank personal imported answer sheets/);
 assert.match(html,/q\.special==='allAccepted'/);
 assert.match(html,/playOfficial:ck107ReadOfficial/);
 assert.match(html,/function ck107ReadOfficial/);
 assert.match(html,/전원정답 제외/);
 assert.match(html,/음성 출력이 중단되었습니다/);
});
test('v107 analysis dialog links 800-question lookup, evidence editor and voice modes',()=>{
 const src=read('assets/ck-study-p4-v78.js');
 assert.match(src,/data-ck107-voice="qa"/);
 assert.match(src,/data-ck107-voice="answer"/);
 assert.match(src,/data-ck107-voice="all"/);
 assert.match(src,/data-ck107-voice-scope="subject"/);
 assert.match(src,/CK83Links\?\.openQuestion/);
 assert.match(src,/CK89OfficialBank\?\.loadYear/);
 assert.match(src,/Q-Net 공식 출처 확인/);
 new vm.Script(src);
});
test('v107 no automatic deployment or install artifacts are requested',()=>{
 assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
 assert.match(read('sw.js'),/conceptknot-study-v107-problem-analysis-tts/);
 assert.match(read('index.html'),/ck-study-p4-v78\.js\?v=107/);
 assert.match(read('index.html'),/ck-study-p4-v78\.css\?v=107/);
});
