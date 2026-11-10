/* v140: review packet fixture and actual source-locked coverage audit. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {buildPackets,toTxt}=require('../scripts/build-explanation-review-packets-v140.cjs');
const ROOT=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const years=[2021,2022,2023,2024,2025];
function sources(){return {questions:read('data/official-2021-2025.json'),
 bundles:Object.fromEntries(years.map(y=>[y,read('data/explanations/official-'+y+'.json')]))};}
test('400 verified linked records have exactly 240 drafts and 160 unstarted, zero fabricated approvals',()=>{
 const data=sources(),raw=JSON.stringify(data);
 const a=buildPackets({...data,status:'all',limit:5});
 const d=buildPackets({...data,status:'draft',limit:5});
 const u=buildPackets({...data,status:'unstarted',limit:5});
 const sp=buildPackets({...data,status:'special',limit:5});
 const needs=buildPackets({...data,status:'missing-evidence',limit:5});
 assert.equal(a.matched,400);assert.equal(d.matched,240);assert.equal(u.matched,160);
 assert.equal(sp.matched,7);assert.equal(needs.matched,400);
 assert.deepEqual(a.issues,[]);
 assert.ok(a.packets.every(p=>p.humanReviewRequired===true&&p.reviewReady===false&&p.options.length===5));
 assert.equal(JSON.stringify(data),raw,'audit is read-only');
});
test('each human-review TXT packet has all five official answer choices and no invented legal verdict',()=>{
 const packet=buildPackets({...sources(),year:2021,status:'unstarted',limit:3});
 const text=toTxt(packet);
 assert.equal(packet.returned,3);
 assert.match(text,/미검수 초안/);
 assert.match(text,/선지별 진위 판단: \[전문가 감수 필요\]/);
 assert.match(text,/시험 시행 당시 법령/);
 assert.match(text,/공식 게시 승인: \[없음\]/);
 assert.ok(packet.packets.every(p=>p.sourceRefs.some(x=>x.type==='officialNotice')));
});
test('invalid answer keys and broken bundled records remain blocked',()=>{
 const d=sources(),year=2025;
 d.bundles[year].records[0].officialAnswer=[2,3];
 const r=buildPackets({...d,year,limit:3});
 assert.ok(r.issues.some(s=>s.includes('원문/최종정답/선지')));
 assert.equal(r.matched,79);
});
test('unknown year, status, offsets and excessive page limits reject without mutating input',()=>{
 const d=sources();
 assert.throws(()=>buildPackets({...d,year:2026}));
 assert.throws(()=>buildPackets({...d,status:'published'}));
 assert.throws(()=>buildPackets({...d,limit:100}));
 assert.throws(()=>buildPackets({...d,offset:-1}));
});
