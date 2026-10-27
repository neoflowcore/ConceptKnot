"""Fetch government exam text reproduced under KOGL 1, without importing third-party explanations.
Inputs: cached official-paper mirrors and Q-Net-final-key data in index.html.
Use cache in /tmp/ck-exams to avoid repeat requests. Explicitly keeps original-source attribution.
"""
from pathlib import Path
from lxml import html
import concurrent.futures,urllib.request,json,re,time,hashlib
ROOT=Path(__file__).resolve().parents[1]
CACHE=Path('/tmp/ck-exams');CACHE.mkdir(exist_ok=True)
S=(ROOT/'index.html').read_text()
KEYS=json.loads(re.search(r'window.RECALL_KEYS=(\{.*?\});',S).group(1))
MANIFEST=json.loads(re.search(r'window.RECALL_EXAMS=(\[.*?\]);',S).group(1))

def fetch(url,path):
 if path.exists():return path.read_bytes()
 req=urllib.request.Request(url,headers={'User-Agent':'ConceptKnot-Exam-Study/1.0 (public study text retrieval)'})
 data=urllib.request.urlopen(req,timeout=30).read();path.write_bytes(data);return data

def register(job):
 year,subject,localno=job;number=localno if subject=='budongsan' else localno+40
 url=f'https://gonginpass.kr/exam/{year}/{subject}/{number}'
 raw=fetch(url,CACHE/f'{year}-{subject}-{localno}.html');doc=html.fromstring(raw)
 stem=doc.xpath('//p[contains(@class,"text-stem")]')
 choices=doc.xpath('//span[contains(@class,"flex-1 whitespace-pre-wrap")]')
 if len(stem)!=1 or len(choices)!=5:raise ValueError(f'{year}-{number}: stem {len(stem)}, options {len(choices)}')
 question=stem[0].text_content().replace('\\n','\n').strip()
 options=[x.text_content().replace('\\n','\n').strip() for x in choices]
 diagrams=[{'src':x.get('src'),'alt':x.get('alt','')} for x in doc.xpath('//article//img')]
 accepted=[]
 for node in doc.xpath('//script[@type="application/ld+json"]/text()'):
  try:
   data=json.loads(node);part=data.get('hasPart',{});ans=part.get('acceptedAnswer',{});accepted=ans if isinstance(ans,list) else [ans]
  except Exception:pass
 correct=KEYS[str(year)][number-1]
 expected=[options[n-1] for n in correct]
 def norm(t):return re.sub(r'\s+','',t)
 accepted_text=[x.get('text','') for x in accepted]
 key_match=all(norm(x) in [norm(y) for y in expected] for x in accepted_text) if accepted_text else False
 if len(correct)==5:key_match=True
 entry={'id':f'{year}-{number}','year':year,'number':number,'subject':'estate' if number<=40 else 'civil','question':question,'options':options,'correct':correct,'verified':False,'source':'한국산업인력공단 Q-Net · 공공누리 제1유형','transcriptionUrl':url,'paperUrl':next(e['pdf'] for e in MANIFEST if e['year']==year),'diagrams':diagrams,'checks':{'options':5,'mirrorKeyMatch':key_match},'acceptedText':accepted_text}
 return entry

if __name__=='__main__':
 jobs=[(y,s,n) for y in range(2025,2020,-1) for s in ['budongsan','minbeop'] for n in range(1,41)]
 entries=[];errors=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
  fs={pool.submit(register,j):j for j in jobs}
  for f in concurrent.futures.as_completed(fs):
   try:entries.append(f.result())
   except Exception as e:errors.append({'job':fs[f],'error':str(e)})
   if (len(entries)+len(errors))%40==0:print('Fetched',len(entries),'errors',len(errors),flush=True)
 entries.sort(key=lambda e:(-e['year'],e['number']))
 (ROOT/'data/recent-5-draft.json').write_text(json.dumps({'entries':entries,'errors':errors},ensure_ascii=False,indent=2))
 print('DONE',len(entries),'errors',len(errors),flush=True)
