"""Optional local Chromium smoke test; never starts CI, builds, or deploys.

Run: python tests/smoke.py
Requires playwright Python package and Chromium installed locally.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
# Test-only introspection of the closed app scope, without altering release source.
HTML=HTML.replace('render();setInterval(timerTick,500);',
'''window.__ckProbe={quiz:CONTENT.quiz,transfer:REVERSE_TRANSFER};render();setInterval(timerTick,500);''')
report=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':850})
 page.evaluate('''() => {window.__studyStore={}; Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return window.__studyStore[k]??null},setItem(k,v){window.__studyStore[k]=String(v)},removeItem(k){delete window.__studyStore[k]}}});}''')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded')
 def C(selector): page.locator(selector+':visible').first.click(timeout=5000)
 def T(text): assert text in page.locator('#main').inner_text(timeout=5000),repr(text)
 def state(): return page.evaluate('JSON.parse(localStorage.getItem("recallgraph-first-exam-v1"))')
 def check(name,fn):
  try:
   fn();report.append([name,'PASS']);print('PASS',name)
  except Exception as exc:
   report.append([name,'FAIL',str(exc)[:300]]);print('FAIL',name,str(exc)[:300])
 def bank():
  result=page.evaluate('''() => {const {quiz,transfer}=window.__ckProbe;return {count:quiz.length,complete:quiz.every(q=>!!transfer[q.id]&&transfer[q.id].a.length===5&&transfer[q.id].ok>=1&&transfer[q.id].ok<=5&&transfer[q.id].q!==q.q),extra:Object.keys(transfer).filter(k=>!quiz.some(q=>q.id===k))};}''')
  assert result=={'count':30,'complete':True,'extra':[]},result
 check('30 independently authored 5-choice transfer questions',bank)
 check('question-first navigation',lambda:(C('[data-go="reverse"]'),T('문제를 보고 먼저 판단하기')))
 check('first answer and 5-choice explanations',lambda:(C('[data-r-choice="first"][data-r-val="1"]'),T('5개 선지의 판별 근거')))
 check('recall',lambda:(C('[data-action="r-start-recall"]'),T('책을 가리고'),C('[data-action="r-reveal"]'),T('정답 확인과 기억 수준 평가')))
 check('spaced-review rating',lambda:(C('[data-action="r-rate"][data-r-rating="0"]'),T('같은 개념을 다른 상황')))
 check('transfer answer',lambda:(C('[data-r-choice="transfer"][data-r-val="3"]'),T('정답')))
 check('original reattempt',lambda:(C('[data-action="r-to-retry"]'),C('[data-r-choice="retry"][data-r-val="3"]'),C('[data-action="r-finish"]'),T('원문제 재도전 성공')))
 def first_attempt_persists():
  s=state();assert s['quizAnswers']['eq1']==1,s['quizAnswers']['eq1'];assert s['reverseProgress']['eq1']['lastCorrect'] is True
 check('initial wrong answer preserved after successful retry',first_attempt_persists)
 check('next weak question',lambda:(C('[data-action="r-next"]'),T('문제를 보고 먼저 판단하기')))
 check('official source differentiation',lambda:(C('[data-r-mode="official"]'),T('공식 기출에서 필요한 이론 연결'),T('공식 해설을 자동 생성하지 않습니다')))
 def official_inline_mark():
  page.locator('#r-official-text').fill('토지의 부동성이 수요에 미치는 영향 <img src=x onerror=alert(1)>')
  C('[data-r-official-mark="4"]')
  s=state();assert s['answers']['2025-1']==4;assert '<img' in s['officialLinks']['2025-1']['text']
  assert page.locator('#main img[src="x"]').count()==0
  T('내 답 4번 저장됨')
 check('official inline OMR mark with local text safety',official_inline_mark)
 check('10-year coverage dashboard',lambda:(T('텍스트 1/400'),T('개념 연결 0/400'),T('답안 1/400')))
 check('reveal answer button',lambda:(C('[data-action="r-official-showkey"]'),T('답안표')))
 check('official concept suggestion',lambda:(C('[data-action="r-official-suggest"]'),T('부동성')))
 def manual_link():
  page.locator('#r-official-concept').select_option('e1')
  C('[data-action="r-official-manual"]')
  T('개념 연결 1/400')
 check('user-verified concept link',manual_link)
 def ocr_import():
  page.locator('details:has(#r-ocr-file) summary').click()
  page.locator('#r-ocr-file').set_input_files({'name':'ocr.txt','mimeType':'text/plain','buffer':('2. 수요의 가격탄력성에 관한 문항입니다.\n① 선택 1\n3. 정상재의 수요곡선이 어떻게 변화하는가?\n① 선택 1\n41. 타 과목 번호').encode()})
  C('[data-action="r-ocr-preview"]')
  page.get_by_text('문항 인식 후보 2개',exact=False).wait_for(timeout=5000)
  T('문항 인식 후보 2개')
  C('[data-action="r-ocr-save"]')
  assert state()['officialLinks']['2025-2']['text']
 check('OCR TXT preview and import',ocr_import)
 check('next unlinked official question',lambda:(C('[data-action="r-official-next-unlinked"]'),T('2025년 2번')))
 def linked_omr():
  C('[data-action="r-open-omr"]');T('실전 OMR');assert state()['examQuestion']==2
  C('[data-action="r-exam-analyze"]');T('공식 기출에서 필요한 이론 연결')
 check('official page and OMR roundtrip',linked_omr)
 check('subject switch',lambda:(C('[data-subject="civil"]'),T('민법 및 민사특별법')))
 check('civil law reverse practice',lambda:(C('[data-r-mode="practice"]'),T('문제를 보고 먼저 판단하기')))
 def mobile():
  page.set_viewport_size({'width':390,'height':844})
  result=page.evaluate('({width:window.innerWidth,scroll:document.documentElement.scrollWidth})')
  assert result['scroll']<=result['width']+4,result
 check('mobile no horizontal overflow',mobile)
 assert not errors,errors
 browser.close()
print('RESULT',json.dumps(report,ensure_ascii=False))
assert all(x[1]=='PASS' for x in report)
