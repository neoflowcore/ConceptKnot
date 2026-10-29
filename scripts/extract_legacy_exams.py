"""Requires Poppler pdftotext and downloaded original exam PDFs named YEAR.pdf.
Reading order is left column then right column, preserving page continuation.
Output is a draft and must be reviewed before promotion to the verified bank.
"""
from pathlib import Path
import subprocess,re,json,hashlib
root=Path(__file__).resolve().parents[1]
import argparse
parser=argparse.ArgumentParser(description='Extract legacy two-column exam PDFs into unverified drafts; never infer final answers.')
parser.add_argument('--pdf-directory',type=Path,required=True)
cache=parser.parse_args().pdf_directory
s=(root/'index.html').read_text();keys=json.loads(re.search(r'window.RECALL_KEYS=(\{.*?\});',s).group(1));manifest=json.loads(re.search(r'window.RECALL_EXAMS=(\[.*?\]);',s).group(1))
allrows=[];issues=[]
for year in range(2016,2021):
 text=''
 for page in range(1,13):
  for x in [0,297]:
   text+=subprocess.check_output(['pdftotext','-f',str(page),'-l',str(page),'-r','72','-x',str(x),'-y','0','-W','298','-H','818','-layout',str(cache/f'{year}.pdf'),'-']).decode()+'\n'
 if year==2018:
  text=re.sub(r'취소할 수 있는 법률행위에 관한 설명으로 틀린 것은\?\s*\n\s*44\.\s*', '44. 취소할 수 있는 법률행위에 관한 설명으로 틀린 것은?\n', text)
 text=re.sub(r'^.*제[12]과목\s*:.*$','',text,flags=re.M).replace('\x0c','')
 candidates=list(re.finditer(r'^\s*(\d{1,2})\.\s+',text,re.M)); starts=[]
 for m in candidates:
  if int(m[1])==len(starts)+1:starts.append(m)
 # Every numbered problem must occur once in ascending order.
 nums=[int(m[1]) for m in starts];print(year,len(nums),nums==list(range(1,81)))
 if nums!=list(range(1,81)):issues.append([year,'number sequence',nums]);continue
 for idx,m in enumerate(starts):
  n=int(m[1]);raw=text[m.end():starts[idx+1].start() if idx+1<len(starts) else len(text)].strip()
  opts=list(re.finditer('[①②③④⑤]',raw))
  if len(opts)!=5 or ''.join(o[0] for o in opts)!='①②③④⑤':issues.append([year,n,'options',len(opts)]);continue
  q=raw[:opts[0].start()].strip();options=[raw[o.end():opts[i+1].start() if i<4 else len(raw)].strip() for i,o in enumerate(opts)]
  if re.search('[\ue000-\uf8ff�]',q+''.join(options)):issues.append([year,n,'glyphs'])
  allrows.append(dict(id=f'{year}-{n}',year=year,number=n,subject='estate' if n<=40 else 'civil',question=q,options=options,correct=[],verified=False,source='한국산업인력공단 Q-Net 공개 문제지',paperUrl=next(e['pdf'] for e in manifest if e['year']==year),checks={'options':5,'pdfTextExtracted':True,'answerKeySource':'pending final-answer PDF verification'},paperSha256=hashlib.sha256((cache/f'{year}.pdf').read_bytes()).hexdigest()))
(root/'data/official-2016-2020-extracted.json').write_text(json.dumps({'entries':allrows,'issues':issues},ensure_ascii=False,indent=2))
print('EXTRACTED',len(allrows),'ISSUES',issues)
