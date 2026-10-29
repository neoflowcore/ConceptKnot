
/* ConceptKnot: route-aware section scrolling without touching the study data engine. */
(function(){
  'use strict';
  const pages=[
    ['home','오늘의 학습'],['theory','핵심 이론'],['visual','그림 연상'],
    ['typing','분필 타이핑'],['listen','문제·정답'],['reverse','기출 → 이론'],
    ['quiz','모의고사'],['calc','계산 집중'],['exam','10개년 기출'],
    ['venn','비교 도형'],['wrong','오답 복습'],['plan','학습 계획']
  ];
  const main=document.getElementById('main');
  if(!main)return;
  const reduced=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const coarse=()=>Boolean(window.matchMedia?.('(pointer: coarse)').matches);
  let prevView='',homeToStudy=false,lockedUntil=0,wheelSum=0,wheelAt=0,revealObserver=null,animTimer=0;
  const pager=document.createElement('nav');
  pager.className='ck4-pager';
  pager.setAttribute('aria-label','학습 페이지 이동');
  pager.innerHTML='<span class="ck4-pager-label"></span><button type="button" data-ck4-prev aria-label="이전 페이지">↑</button><span class="ck4-pager-count">01 / 12</span><button type="button" data-ck4-next aria-label="다음 페이지">↓</button>';
  const live=document.createElement('span');
  live.className='ck4-sr';live.setAttribute('aria-live','polite');
  document.body.append(pager,live);
  const view=()=>document.body.dataset.ckV8Tab==='settings'?'settings':main.querySelector('.ck-v7-nav-pill .board-tab.active')?.dataset.go||document.body.dataset.ckV8Tab||'home';
  const pageIndex=()=>Math.max(0,pages.findIndex(x=>x[0]===view()));
  const title=id=>pages.find(x=>x[0]===id)?.[1]||'오늘의 학습';
  function go(id,study=false){
    const b=Array.from(main.querySelectorAll('.ck-v7-nav-pill .board-tab')).find(x=>x.dataset.go===id);
    if(!b)return;
    homeToStudy=study;
    lockedUntil=performance.now()+850;wheelSum=0;
    b.click();
  }
  function step(delta){const item=pages[pageIndex()+delta];if(item)go(item[0]);}
  function scrollStudy(){document.getElementById('ck4-study')?.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});}
  function createCover(){
    const section=document.createElement('section');
    section.id='ck4-cover';section.className='ck4-cover';section.setAttribute('aria-label','ConceptKnot 첫 화면');
    section.innerHTML=[
      '<div class="ck4-copy">',
      '<span class="ck4-eyebrow">CONCEPTKNOT · YOUR STUDY GARDEN</span>',
      '<h1>공부가<br><em>연결되는</em><br>순간.</h1>',
      '<p>기출문제로 시작해 핵심 개념을 엮고, 손으로 적고, 다시 떠올리는 나만의 공부 공간.</p>',
      '<div class="ck4-actions">',
      '<button class="ck4-action" type="button" data-ck4-target="study">오늘의 학습 시작 ↘</button>',
      '<button class="ck4-action secondary" type="button" data-ck4-target="reverse">기출에서 시작 ↗</button>',
      '</div></div>',
      '<aside class="ck4-note"><span>A LITTLE EVERY DAY</span><h2>한 문제씩, 매일.</h2>',
      '<p>맞힌 문제보다 다시 떠올릴 수 있는 개념을 늘려 보세요.</p></aside>',
      '<div class="ck4-cue" aria-hidden="true">SCROLL TO EXPLORE<i>↓</i></div>'
    ].join('');
    return section;
  }
  function updatePager(){
    pager.hidden=view()==='settings';
    if(pager.hidden)return;
    const i=pageIndex();
    pager.querySelector('.ck4-pager-count').textContent=String(i+1).padStart(2,'0')+' / '+pages.length;
    pager.querySelector('.ck4-pager-label').textContent=pages[i][1];
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
    if(id==='home'){
      const stage=frame.querySelector('.ck-v7-stage');
      if(stage){
        stage.id='ck4-study';
        if(!frame.querySelector('#ck4-cover'))frame.insertBefore(createCover(),stage);
      }
    }
    updatePager();
    if(id!==prevView){
      prevView=id;live.textContent='학습 화면: '+title(id);
      main.classList.remove('ck4-changing');
      if(!reduced()){
        void main.offsetHeight;
        main.classList.add('ck4-changing');
        clearTimeout(animTimer);animTimer=setTimeout(()=>main.classList.remove('ck4-changing'),650);
      }
      reveal();
    }
    const current=pill.querySelector('.board-tab.active');
    if(current){
      const strip=current.parentElement;
      if(strip.scrollWidth>strip.clientWidth){
        const pos=current.offsetLeft-strip.offsetLeft-(strip.clientWidth-current.offsetWidth)/2;
        strip.scrollTo({left:Math.max(0,pos),behavior:reduced()?'instant':'smooth'});
      }
    }
    if(id==='home'&&homeToStudy){
      homeToStudy=false;
      requestAnimationFrame(()=>requestAnimationFrame(scrollStudy));
    }
    if(id!=='home')homeToStudy=false;
  }
  new MutationObserver(records=>{
    if(records.some(x=>x.target===main))sync();
  }).observe(main,{childList:true});
  sync();
  document.addEventListener('click',e=>{
    const action=e.target?.closest?.('[data-ck4-target]');
    if(action){
      e.preventDefault();
      if(action.dataset.ck4Target==='study')scrollStudy();
      else go(action.dataset.ck4Target);
      return;
    }
    if(e.target?.closest?.('.ck-v7-logo')){
      e.preventDefault();e.stopPropagation();homeToStudy=false;
      if(view()==='home')window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});
      else go('home');
      return;
    }
    if(e.isTrusted&&e.target?.closest?.('.ck-v7-nav-pill .board-tab[data-go="home"]'))homeToStudy=true;
    if(e.target?.closest?.('[data-ck4-prev]')){e.preventDefault();step(-1);}
    if(e.target?.closest?.('[data-ck4-next]')){e.preventDefault();step(1);}
  },true);
  function inEditor(node){
    return Boolean(node?.closest?.('textarea,input,select,iframe,[contenteditable="true"],[role="textbox"],.ck-v7-writing-surface,.ck-v7-divider,.ck-v7-nav-pill,.ink-pad,.ck-v7-pen-layer'));
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
  window.addEventListener('wheel',e=>{
    if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||coarse()||view()==='settings'||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
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
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||inEditor(e.target)||!e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
    if(e.key==='ArrowDown'){e.preventDefault();step(1);}
    if(e.key==='ArrowUp'){e.preventDefault();step(-1);}
  });
})();
