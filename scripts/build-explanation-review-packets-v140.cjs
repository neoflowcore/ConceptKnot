/* ConceptKnot v140 — read-only, official answer-locked explanation review packets.
 * This is NOT a generated legal opinion, reviewed answer, or publication feed.
 * CLI: node scripts/build-explanation-review-packets-v140.cjs --year=2025 --status=unstarted --limit=5
 */
'use strict';
const YEARS=[2021,2022,2023,2024,2025],MAX=20;
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 a.every(x=>Number.isInteger(Number(x)))&&
 a.map(Number).sort((x,y)=>x-y).every((x,i)=>x===b.map(Number).sort((y,z)=>y-z)[i]);
function buildPackets({questions=[],bundles={},year=null,status='all',limit=5,offset=0}={}){
 if(year!==null&&!YEARS.includes(Number(year)))throw Error('허용 범위는 2021~2025년입니다.');
 if(!['all','draft','unstarted','missing-evidence','special'].includes(status))throw Error('지원하지 않는 검토 필터입니다.');
 if(!Number.isInteger(limit)||limit<1||limit>MAX||!Number.isInteger(offset)||offset<0)
  throw Error('limit은 1~20, offset은 0 이상이어야 합니다.');
 const bank=new Map(),issues=[],entries=[];
 for(const q of questions){
  if(!q||typeof q.id!=='string'||bank.has(q.id)){issues.push('공식 문항 중복 또는 ID 오류: '+String(q?.id));continue;}
  bank.set(q.id,q);
 }
 const years=year===null?YEARS:[Number(year)];
 for(const y of years){
  const file=bundles[y];
  if(!file||file.year!==y||file.originalAnswersProtected!==true||!Array.isArray(file.records)||file.records.length!==80){
   issues.push('해설 원본 80건 또는 정답 보호 상태 확인 불가: '+y);continue;
  }
  const seen=new Set();
  for(const record of file.records){
   const id=record?.questionId,q=bank.get(id);
   if(!id||seen.has(id)){issues.push('해설 문항 ID 중복: '+String(id));continue;}
   seen.add(id);
   if(!q||record.examYear!==y||record.number!==q.number||record.subject!==q.subject||
     record.questionId!==q.id||!same(record.officialAnswer,q.correct)||
     !Array.isArray(q.options)||q.options.length!==5||
     !Array.isArray(record.options)||record.options.length!==5){
    issues.push('원문/최종정답/선지 구조 불일치: '+String(id));continue;
   }
   const quality=record.quality||{},draft=quality.status==='draft',
    unstarted=quality.status==='unstarted';
   // Source references may be official answer notices: NOT independent legal reasoning.
   const refs=(Array.isArray(record.sourceRefs)?record.sourceRefs:[])
    .filter(r=>/^https:\/\//.test(String(r?.url||'')))
    .map(r=>({type:String(r.type||'other'),url:r.url,checked:r.verified===true}));
   const reviewedOptions=record.options.filter(o=>o?.sourceChecked===true&&
     ['true','false','conditional'].includes(o?.verdict)&&String(o.why||'').trim()).length;
   const needsEvidence=quality.reasonReviewed!==true||quality.sourceChecked!==true||
    reviewedOptions!==5||!String(record.answerReason||'').trim();
   const accepted=q.correct.map(Number).sort((a,b)=>a-b),special=accepted.length>1;
   if(status==='draft'&&!draft||status==='unstarted'&&!unstarted||
      status==='missing-evidence'&&!needsEvidence||status==='special'&&!special)continue;
   entries.push({
    id,year:y,number:q.number,subject:q.subject,status:String(quality.status||'unstarted'),
    question:String(q.question||''),officialAccepted:accepted,allAccepted:accepted.length===5,
    specialAnswer:special?'special':'normal',options:q.options.map((text,i)=>({
     no:i+1,text:String(text),existingDraft: String(record.options[i]?.draftReason||''),
     legalVerdictReviewed:record.options[i]?.sourceChecked===true&&
      ['true','false','conditional'].includes(record.options[i]?.verdict),
     verifiedLegalReason: record.options[i]?.sourceChecked===true?String(record.options[i]?.why||''):''
    })),
    summaryDraft:typeof record.summaryEasy==='string'?record.summaryEasy:'',
    answerReasonDraft:typeof record.answerReason==='string'?record.answerReason:'',
    sourceRefs:refs,reviewedOptions,reviewReady:!needsEvidence,
    humanReviewRequired:true,asOfLawDate:quality.currentLawCheckedAt||null
   });
  }
  for(let n=1;n<=80;n++)if(!seen.has(y+'-'+n))issues.push('누락된 해설 ID: '+y+'-'+n);
 }
 entries.sort((a,b)=>a.year-b.year||a.number-b.number);
 const selected=entries.slice(offset,offset+limit);
 return {schemaVersion:1,purpose:'Human legal and source verification only',
  year:year===null?'2021-2025':Number(year),status,matched:entries.length,
  offset,limit,returned:selected.length,total:years.length*80,
  issues,packets:selected};
}
function toTxt(report){
 const lines=['ConceptKnot 공식 기출 해설 감수 패킷 · **미검수 초안, 공개 정답 해설 아님**',
  '연도: '+report.year+' · 필터: '+report.status+' · 검색 '+report.matched+
   '건 / 표시 '+report.returned+'건 · offset '+report.offset,
  '선지의 채점 인정 번호는 시험 채점 규칙이며 법적 참/거짓 판정으로 승격하지 않습니다.',''];
 for(const row of report.packets){
  lines.push('['+row.id+'] '+(row.subject==='estate'?'부동산학개론':'민법/민사특별법')+
   ' · '+row.status+' · 공식 인정 번호 '+row.officialAccepted.join(', ')+
   (row.allAccepted?' (전원정답 인정)':''),'문제: '+row.question);
  for(const opt of row.options)lines.push('  '+opt.no+'. '+opt.text,
   '    선지별 진위 판단: [전문가 감수 필요] · 조문/판례/판시일/시험 기준일: [미입력]'+
   (opt.existingDraft?' · 기존 개인/자료 초안: '+opt.existingDraft:''));
  lines.push('기존 요지 초안: '+(row.summaryDraft||'[없음]'),
   '기존 해설 초안: '+(row.answerReasonDraft||'[없음]'),
   '원문 출처: '+(row.sourceRefs.map(x=>x.type+' '+x.url).join(' / ')||'[등록 안 됨]'),
   '시험 시행 당시 법령·판례 근거 및 기준일: [전문가 확인 필요]',
   '선지 근거 확인: '+row.reviewedOptions+'/5 · 공식 게시 승인: [없음]','');
 }
 if(report.issues.length)lines.push('자료 구조 오류 ('+report.issues.length+'): '+report.issues.join('; '));
 return lines.join('\n')+'\n';
}
module.exports={buildPackets,toTxt};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path'),base=path.resolve(__dirname,'..');
 const opts=Object.fromEntries(process.argv.slice(2).filter(x=>/^--[a-z-]+(?:=|$)/.test(x))
  .map(x=>{const [k,...v]=x.slice(2).split('=');return [k,v.length?v.join('='):true]}));
 if(opts.help){process.stdout.write('사용법: --year=2025 --status=all|draft|unstarted|special|missing-evidence --limit=5 --offset=0 [--json]\n');process.exit(0);}
 const bank=JSON.parse(fs.readFileSync(path.join(base,'data/official-2021-2025.json'),'utf8'));
 const bundles=Object.fromEntries(YEARS.map(y=>[y,JSON.parse(fs.readFileSync(
  path.join(base,'data/explanations/official-'+y+'.json'),'utf8'))]));
 const report=buildPackets({questions:bank,bundles,
  year:opts.year===undefined?null:Number(opts.year),status:String(opts.status||'all'),
  limit:opts.limit===undefined?5:Number(opts.limit),offset:opts.offset===undefined?0:Number(opts.offset)});
 process.stdout.write(opts.json?JSON.stringify(report,null,2)+'\n':toTxt(report));
 if(report.issues.length)process.exitCode=1;
}
