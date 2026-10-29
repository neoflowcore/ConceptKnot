
/* ConceptKnot: route-aware section scrolling without touching the study data engine. */
(function(){
  'use strict';
  const pages=[
    ['landing','CONCEPTKNOT'],['home','오늘의 학습'],['theory','핵심 이론'],['visual','그림 연상'],
    ['typing','타이핑'],['listen','문제·정답'],['reverse','기출 → 이론'],
    ['quiz','모의고사'],['calc','계산 집중'],['exam','10개년 기출'],
    ['venn','비교 도형'],['wrong','오답 복습'],['plan','학습 계획'],['final','정리본']
  ];
  const main=document.getElementById('main');
  if(!main)return;
  const reduced=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const isMobile=()=>Boolean(window.matchMedia('(max-width:850px)').matches);
  let prevView='',homeToStudy=false,lockedUntil=0,wheelSum=0,wheelAt=0,revealObserver=null,animTimer=0;
  const pager=document.createElement('nav');
  pager.className='ck4-pager';
  pager.setAttribute('aria-label','학습 페이지 이동');
  pager.innerHTML='<span class="ck4-pager-label"></span><button type="button" data-ck4-prev aria-label="이전 페이지">↑</button><span class="ck4-pager-count">01 / 13</span><button type="button" data-ck4-next aria-label="다음 페이지">↓</button>';
  const live=document.createElement('span');
  live.className='ck4-sr';live.setAttribute('aria-live','polite');
  document.body.append(pager,live);
  const view=()=>document.body.dataset.ckV8Tab==='settings'?'settings':main.querySelector('.ck-v7-nav-pill .board-tab.active')?.dataset.go||document.body.dataset.ckV8Tab||'home';
  const pageIndex=()=>Math.max(0,pages.findIndex(x=>x[0]===view()));
  const title=id=>pages.find(x=>x[0]===id)?.[1]||'오늘의 학습';
  function go(id,study=false){
    const b=id==='landing'?main.querySelector('.ck-v7-logo'):
      Array.from(main.querySelectorAll('.ck-v7-nav-pill .board-tab')).find(x=>x.dataset.go===id);
    if(!b)return;
    homeToStudy=study;
    lockedUntil=performance.now()+850;wheelSum=0;
    b.click();
  }
  function step(delta){const item=pages[pageIndex()+delta];if(item)go(item[0]);}
  function scrollStudy(){document.getElementById('ck4-study')?.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});}
  function createCover(){
    const section=document.createElement('section');
    section.id='ck4-cover';
    section.className='ck4-cover';
    section.setAttribute('aria-label','ConceptKnot 정원 첫 화면');
    // The first screen is the living landscape, without a message card.
    section.replaceChildren();
    return section;
  }
  function updatePager(){
    const study=document.getElementById('ck4-study');
    const coverVisible=view()==='landing';
    pager.hidden=view()==='settings'||coverVisible;
    if(pager.hidden)return;
    const i=pageIndex();
    pager.querySelector('.ck4-pager-count').textContent=String(i+1).padStart(2,'0')+' / '+pages.length;
    pager.querySelector('.ck4-pager-label').textContent=pages[i][1];
    pager.querySelector('.ck4-pager-label').title=pages[i][1];
    const before=pager.querySelector('[data-ck4-prev]'),after=pager.querySelector('[data-ck4-next]');
    before.disabled=i===0;after.disabled=i===pages.length-1;
    before.title=i>0?pages[i-1][1]:'첫 번째 페이지';
    after.title=i<pages.length-1?pages[i+1][1]:'마지막 페이지';
  }
  function reveal(){
    revealObserver?.disconnect();revealObserver=null;
    if(reduced()||!('IntersectionObserver' in window))return;
    revealObserver=new IntersectionObserver(entries=>{
      for(const item of entries)if(item.isIntersecting){
        item.target.classList.add('ck4-shown');
        revealObserver?.unobserve(item.target);
      }
    },{threshold:.05,rootMargin:'0px 0px -12px 0px'});
    for(const element of Array.from(main.querySelectorAll('.ck-v7-content > *')).slice(0,30)){
      element.classList.add('ck4-reveal');
      revealObserver.observe(element);
    }
  }
  function sync(){
    const frame=main.querySelector('.ck-v7-mainframe');
    const bar=frame?.querySelector('.ck-v7-global-nav');
    const pill=bar?.querySelector('.ck-v7-nav-pill');
    const date=bar?.querySelector('.ck-v7-date-pill');
    if(!frame||!pill)return;
    if(date&&date.parentElement!==pill)pill.append(date);
    pill.classList.add('ck4-unified');
    const id=view();
    if(id==='landing'){
      const stage=frame.querySelector('.ck-v7-stage');
      if(stage){
        stage.id='ck4-study';
        if(!frame.querySelector('#ck4-cover'))frame.insertBefore(createCover(),stage);
      }
    }
    updatePager();
    if(id!==prevView){
      prevView=id;live.textContent='학습 화면: '+title(id);
      // v15: the live garden never disappears; the workspace stage alone gets
      // a short native View Transition. Old 650ms "reveal" caused double motion.
      main.classList.remove('ck4-changing');
      clearTimeout(animTimer);
      revealObserver?.disconnect();revealObserver=null;
      // No intersection reveal on tab switch: the whole glass sheet rises once.
    }
    const current=pill.querySelector('.board-tab.active');
    if(current){
      const strip=current.parentElement;
      if(strip.scrollWidth>strip.clientWidth){
        const pos=current.offsetLeft-strip.offsetLeft-(strip.clientWidth-current.offsetWidth)/2;
        strip.scrollTo({left:Math.max(0,pos),behavior:reduced()?'instant':'smooth'});
      }
    }
    homeToStudy=false;
  }
  new MutationObserver(records=>{
    if(records.some(x=>x.target===main))sync();
  }).observe(main,{childList:true});
  sync();
  let pagerFrame=0;
  window.addEventListener('scroll',()=>{
    if(pagerFrame)return;
    pagerFrame=requestAnimationFrame(()=>{pagerFrame=0;if(view()==='home')updatePager();});
  },{passive:true});
  document.addEventListener('click',e=>{
    const action=e.target?.closest?.('[data-ck4-target]');
    if(action){
      e.preventDefault();
      if(action.dataset.ck4Target==='study')scrollStudy();
      else go(action.dataset.ck4Target);
      return;
    }
    if(e.target?.closest?.('.ck-v7-logo')){
      // Native click still bubbles to the study router's data-go="landing".
      // Never force a click on the "오늘의 학습" tab.
      e.preventDefault();homeToStudy=false;return;
    }
    if(e.target?.closest?.('[data-ck4-prev]')){e.preventDefault();step(-1);}
    if(e.target?.closest?.('[data-ck4-next]')){e.preventDefault();step(1);}
  },true);
  function inEditor(node){
    return Boolean(node?.closest?.('textarea,input,select,iframe,[contenteditable="true"],[role="textbox"],.ck-v7-writing-surface,.ck-v7-divider,.ck-v7-nav-pill,.ink-pad,.ck-v7-pen-layer,.ck15-pdf-host'));
  }
  function scrollableChild(node,delta){
    for(let el=node?.nodeType===1?node:node?.parentElement;el&&el!==document.documentElement;el=el.parentElement){
      if(el===document.body)break;
      const style=getComputedStyle(el);
      if(!/(auto|scroll)/.test(style.overflowY)||el.scrollHeight<=el.clientHeight+4)continue;
      if(delta>0&&el.scrollTop<el.scrollHeight-el.clientHeight-4)return true;
      if(delta<0&&el.scrollTop>4)return true;
    }
    return false;
  }
  // Intro has no study cards. A deliberate downward gesture follows the
  // pencil-press cue into "오늘의 학습". Every study page keeps natural scrolling.
  window.addEventListener('wheel',e=>{
    if(isMobile()||view()!=='landing'||e.ctrlKey||e.metaKey||e.deltaY<62||
       performance.now()<lockedUntil)return;
    go('home');
  },{passive:true});
  // Desktop study pages: never hijack wheel, except for the garden intro.
  // Narrow screens retain the deliberate page-by-page navigation behaviour.
  window.addEventListener('wheel',e=>{
    if(!isMobile())return;
    if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||view()==='settings'||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    if(inEditor(e.target)||document.activeElement?.matches?.('textarea,input,select,[contenteditable="true"],[role="textbox"]'))return;
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
    if(!delta||scrollableChild(e.target,delta))return;
    const limit=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    if(!(delta>0?scrollY>=limit-9:scrollY<=9))return;
    const i=pageIndex();
    if(delta>0&&i===pages.length-1||delta<0&&i===0)return;
    const now=performance.now();
    if(now<lockedUntil){e.preventDefault();return;}
    if(now-wheelAt>400||Math.sign(wheelSum)!==Math.sign(delta))wheelSum=0;
    wheelSum+=delta;wheelAt=now;
    if(Math.abs(wheelSum)>=72){
      e.preventDefault();step(delta>0?1:-1);wheelSum=0;
    }
  },{passive:false});

  // Native touch scrolling is never prevented. On mobile, an additional,
  // deliberate swipe beyond the document edge moves one tab at a time.
  // The writing canvas and editable fields are excluded, so S Pen remains safe.
  let touchStart=null;
  document.addEventListener('touchstart',e=>{
    if(!isMobile()||e.touches.length!==1||view()==='settings'
       ||inEditor(e.target)||inEditor(document.activeElement))return;
    const touch=e.touches[0],limit=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const atTop=scrollY<=9,atBottom=scrollY>=limit-9;
    if(!atTop&&!atBottom)return;
    touchStart={x:touch.clientX,y:touch.clientY,target:e.target,
       atTop,atBottom,time:performance.now()};
  },{passive:true});
  document.addEventListener('touchend',e=>{
    const first=touchStart;touchStart=null;
    if(!first||!isMobile()||e.changedTouches.length!==1||
       performance.now()<lockedUntil)return;
    const end=e.changedTouches[0],dy=first.y-end.clientY,dx=first.x-end.clientX;
    if(Math.abs(dy)<105||Math.abs(dx)>65||performance.now()-first.time>1100)return;
    if(dy>0&&!first.atBottom||dy<0&&!first.atTop)return;
    if(scrollableChild(first.target,dy))return;
    step(dy>0?1:-1);
  },{passive:true});
  document.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});

  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||inEditor(e.target)||!e.ctrlKey||e.altKey||e.metaKey||e.shiftKey)return;
    if(e.key==='ArrowDown'){e.preventDefault();step(1);}
    if(e.key==='ArrowUp'){e.preventDefault();step(-1);}
  });
})();
