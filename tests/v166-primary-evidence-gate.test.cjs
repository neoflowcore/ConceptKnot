'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const E=require('../scripts/p4-primary-evidence-v166.cjs');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/official-2021-2025.json'),'utf8'));
test('source-locked 400x5 inventory with unique stable fingerprints',()=>{
 const rows=E.inventory(bank);assert.equal(rows.length,2000);
 assert.equal(new Set(rows.map(r=>r.id)).size,2000);
 assert.equal(rows.filter(r=>r.status==='SIGNED_OFF').length,0);
});
test('unverified candidate or Q-Net announcement cannot be signed off',()=>{
 const original=E.inventory(bank)[0];
 const tampered={...original,status:'SIGNED_OFF',verdict:'TRUE',rationale:'Some explanation that is deliberately longer than 30 characters',reviewer:'Reviewer',reviewedOn:'2026-11-13',independentSignoff:true,
 paper:{url:'https://www.q-net.or.kr/cst003.do?x=1',page:1,matched:true},
 answer:{url:'https://www.q-net.or.kr/cst003.do?x=2',page:2,matched:true},
 authority:{type:'statute',url:'https://www.law.go.kr/',pinpoint:'section 5',effectiveOn:'2021-10-30',verified:true}};
 assert.ok(E.review(tampered,original).some(s=>s.includes('announcement')));
 assert.deepEqual(E.review({...tampered,optionSha256:'faked'},original),['Source fingerprint mismatch']);
});
test('no unaudited evidence is publishable; duplicates blocked',()=>{
 const rows=E.inventory(bank), r=E.audit(bank,[]);
 assert.deepEqual([r.total,r.signedOff,r.publishable],[2000,0,false]);
 const bad=E.audit(bank,[rows[0],rows[0]]);
 assert.ok(bad.errors.some(s=>s.includes('duplicate')));
});
