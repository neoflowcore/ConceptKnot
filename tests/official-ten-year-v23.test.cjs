const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),html=read('index.html');
function load(){const window={RECALL_OFFICIAL:Object.fromEntries(JSON.parse(read('data/official-2021-2025.json')).map(r=>[r.id,r])),RECALL_KEYS:JSON.parse(html.match(/window.RECALL_KEYS=(\{.*?\});/)[1]),RECALL_EXAMS:JSON.parse(html.match(/window.RECALL_EXAMS=(\[.*?\]);/)[1])};vm.runInNewContext(read('assets/ck-official-legacy-v23.js'),{window});return window;}
test('all 800 records have complete five-option text, final A-type keys and 80 items per year',()=>{
 const w=load(),records=Object.values(w.RECALL_OFFICIAL);assert.equal(records.length,800);
 for(let y=2016;y<=2025;y++){
  const rows=records.filter(r=>r.year===y);assert.equal(rows.length,80);assert.equal(new Set(rows.map(r=>r.number)).size,80);assert.ok(w.RECALL_EXAMS.find(r=>r.year===y).autoGrade);
  for(const r of rows){assert.ok(r.verified);assert.ok(r.question.length>10);assert.equal(r.options.length,5);assert.ok(r.options.every(t=>t.trim()));assert.equal(JSON.stringify(r.correct),JSON.stringify(w.RECALL_KEYS[y][r.number-1]));assert.ok(!/[\ue000-\uf8ff�]/.test(r.question+r.options.join('')));assert.ok(!r.options.some(t=>/제2과목\s*:/.test(t)));}
 }
 assert.equal(records.filter(r=>r.correct.length<5).length,792);assert.equal(w.RECALL_OFFICIAL_REPORT.registered,800);
});
test('400 added answers match independent reading; cancelled and multiple answers preserved',()=>{
 const w=load(),evidence=JSON.parse(read('data/legacy-answer-comparison-v23.json'));let count=0;
 for(const [y,result] of Object.entries(evidence))for(let n=1;n<=80;n++){assert.equal(JSON.stringify(result.keys[n-1]),JSON.stringify(w.RECALL_OFFICIAL[y+'-'+n].correct));count++;}
 assert.equal(count,400);
 for(const id of ['2016-19','2016-23','2019-80'])assert.equal(w.RECALL_OFFICIAL[id].correct.length,5);
 assert.deepEqual(Array.from(w.RECALL_OFFICIAL['2020-79'].correct),[2,4]);
 for(const id of ['2017-23','2018-7','2019-10'])assert.ok(w.RECALL_OFFICIAL[id].question.includes('Qd'));
 assert.ok(w.RECALL_OFFICIAL['2020-30'].options[1].includes('^(5×12)'));
});
test('data loads before app and service-worker cache updates with checked bank',()=>{
 assert.ok(html.indexOf('ck-official-legacy-v23.js')<html.indexOf('RECALLGRAPH First-Exam Sprint.'));assert.ok(!html.includes('src="./assets/ck-exam-drafts-v22.js"'));assert.match(read('sw.js'),/conceptknot-study-v23/);assert.match(read('sw.js'),/ck-official-legacy-v23/);new vm.Script(read('assets/ck-official-legacy-v23.js'));assert.equal(JSON.parse(read('vercel.json')).git.deploymentEnabled,false);
});
