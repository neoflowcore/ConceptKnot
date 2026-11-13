'use strict';
/* v166: independent source-evidence ledger; NEVER infers expert verification from candidates. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const digest = text => crypto.createHash('sha256').update(text,'utf8').digest('hex');
const nonempty = v => typeof v==='string' && v.trim().length>0;
const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v||'') && !Number.isNaN(Date.parse(v+'T00:00:00Z'));
const isHttps = v => { try { return new URL(v).protocol === 'https:'; } catch { return false; } };
function inventory(bank) {
  if (!Array.isArray(bank) || bank.length!==400) throw Error('Expected exactly 400 questions');
  const seen = new Set(), out=[];
  for (const q of bank) {
    if (!/^202[1-5]-(?:[1-9]|[1-7]\d|80)$/.test(q.id) ||
        q.id!==q.year+'-'+q.number || !['estate','civil'].includes(q.subject) ||
        (q.number<=40 ? q.subject!=='estate' : q.subject!=='civil') ||
        !Array.isArray(q.options) || q.options.length!==5 ||
        !q.options.every(nonempty) || !Array.isArray(q.correct) ||
        q.correct.length<1 || !q.correct.every(n=>Number.isInteger(n)&&n>=1&&n<=5) ||
        new Set(q.correct).size!==q.correct.length || seen.has(q.id)) throw Error('Invalid question source: '+q.id);
    seen.add(q.id);
    q.options.forEach((text,i)=>out.push({id:q.id+'-'+(i+1),questionId:q.id,option:i+1,
      optionSha256:digest(text),status:'UNREVIEWED',verdict:null,
      paper:{url:null,page:null,matched:false},answer:{url:null,page:null,matched:false},
      authority:{type:null,url:null,pinpoint:null,effectiveOn:null,verified:false},
      rationale:null,reviewer:null,reviewedOn:null,independentSignoff:false}));
  }
  for(let y=2021;y<=2025;y++) for(let n=1;n<=80;n++)
    if(!seen.has(y+'-'+n))throw Error('Missing '+y+'-'+n);
  return out;
}
function review(row, source) {
  const errors=[];
  if (!row || !source || row.id!==source.id || row.questionId!==source.questionId ||
      row.option!==source.option || row.optionSha256!==source.optionSha256) return ['Source fingerprint mismatch'];
  if(row.status!=='SIGNED_OFF')return ['Unreviewed (publication locked)'];
  if(!['TRUE','FALSE','CONTEXT_DEPENDENT'].includes(row.verdict))errors.push('Missing individual verdict');
  for(const k of ['paper','answer']){
    const item=row[k]||{};
    if(!item.matched || !isHttps(item.url) || !Number.isInteger(item.page)||item.page<1)
      errors.push('No independently checked '+k+' PDF page');
    if(/q-net\.or\.kr\/cst003\.do/.test(item.url||'')) errors.push(k+' announcement is not attachment PDF');
  }
  const a=row.authority||{};
  if(!['statute','case','theory','calculation','official_correction'].includes(a.type) ||
    !isHttps(a.url) || !nonempty(a.pinpoint) || !validDate(a.effectiveOn) || !a.verified)
    errors.push('No dated primary authority and pinpoint');
  if(!nonempty(row.rationale)||row.rationale.trim().length<30)errors.push('No independent explanation');
  if(!nonempty(row.reviewer)||!validDate(row.reviewedOn)||row.independentSignoff!==true)
    errors.push('Missing independent reviewer signoff');
  return errors;
}
function audit(bank,rows) {
  const src=inventory(bank), m=new Map(src.map(r=>[r.id,r]));
  const seen=new Set(), errors=[];let signedOff=0;
  for(const row of rows) {
    if(!row||!m.has(row.id)||seen.has(row.id)){errors.push('Unknown/duplicate evidence id: '+(row&&row.id));continue;}
    seen.add(row.id);
    const e=review(row,m.get(row.id));
    if(row.status==='SIGNED_OFF' && e.length)errors.push(row.id+': '+e.join('; '));
    if(row.status==='SIGNED_OFF' && !e.length)signedOff++;
  }
  return {total:src.length,received:seen.size,signedOff,unreviewed:src.length-signedOff,
    publishable:signedOff===2000&&errors.length===0,errors};
}
function run() {
  const bank=JSON.parse(fs.readFileSync(path.join(root,'data/official-2021-2025.json'),'utf8'));
  const args=process.argv.slice(2), file=args.find(s=>s.startsWith('--evidence='));
  const evidence=file?JSON.parse(fs.readFileSync(path.resolve(file.slice(11)),'utf8')):[];
  const results=audit(bank,evidence);
  if(args.includes('--template')) {
    if(file)throw Error('Template export cannot overwrite or combine reviewed evidence');
    process.stdout.write(JSON.stringify({schemaVersion:1,releaseLocked:true,records:inventory(bank)},null,2)+'\n');
    return;
  }
  process.stdout.write(JSON.stringify(results,null,2)+'\n');
  if(args.includes('--gate=publish')&&!results.publishable)process.exitCode=2;
  if(results.errors.length)process.exitCode=2;
}
if(require.main===module)run();
module.exports={inventory,review,audit,digest};
