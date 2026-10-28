/* ConceptKnot v9: compact Korean standard-time analog clock and swap accessibility. */
(function(){
  'use strict';
  const root=document.getElementById('main');
  if(!root)return;
  const mobile=window.matchMedia('(max-width:850px)');
  const formatter=new Intl.DateTimeFormat('en-US',{
    timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  });
  let clockEl=null;
  function currentTime(){
    const parts=formatter.formatToParts(new Date());
    const digits={};
    for(const x of parts)if(x.type==='hour'||x.type==='minute'||x.type==='second')digits[x.type]=Number(x.value);
    return {hours:digits.hour||0,minutes:digits.minute||0,seconds:digits.second||0};
  }
  function updateClock(){
    if(!clockEl||!clockEl.isConnected)return;
    const {hours,minutes,seconds}=currentTime();
    const smoothSeconds=seconds+new Date().getMilliseconds()/1000;
    const minuteAngle=(minutes+smoothSeconds/60)*6;
    const hourAngle=((hours%12)+minutes/60)*30;
    const hand=(name,degrees)=>{
      const target=clockEl.querySelector('.ck9-'+name);
      if(target)target.style.transform='translateX(-50%) rotate('+degrees.toFixed(2)+'deg)';
    };
    hand('hour',hourAngle);
    hand('minute',minuteAngle);
    hand('second',smoothSeconds*6);
    const readable=String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');
    clockEl.setAttribute('aria-label','한국 시간 '+readable);
    clockEl.title='한국 시간 '+readable;
    clockEl.querySelector('.ck9-clock-reader').textContent=readable;
  }
  function sync(){
    if(!root.querySelector('.ck9-spen-fullscreen'))document.body.classList.remove('ck9-spen-overlay');
    const pill=root.querySelector('.ck-v7-nav-pill .ck-v7-date-pill')||root.querySelector('.ck-v7-date-pill');
    if(pill){
      if(!pill.querySelector('.ck9-clock')){
        const node=document.createElement('time');
        node.className='ck9-clock';
        node.setAttribute('role','img');
        node.innerHTML='<span class="ck9-hour" aria-hidden="true"></span><span class="ck9-minute" aria-hidden="true"></span><span class="ck9-second" aria-hidden="true"></span><span class="ck9-center" aria-hidden="true"></span><span class="ck9-clock-reader"></span>';
        const settings=pill.querySelector('[data-go="settings"]');
        pill.insertBefore(node,settings||null);
      }
      clockEl=pill.querySelector('.ck9-clock');
      pill.classList.add('ck9-clock-host');
      updateClock();
    }
    const swap=root.querySelector('[data-ck6-swap]');
    if(swap){
      const label=mobile.matches?'칠판과 학습 본문 위아래 위치 교환':'칠판과 학습 본문 좌우 위치 교환';
      swap.setAttribute('aria-label',label);swap.title=label;
    }
  }
  const observer=new MutationObserver(records=>{
    if(records.some(r=>r.target===root))sync();
  });
  observer.observe(root,{childList:true});
  mobile.addEventListener?.('change',sync);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClock()});
  sync();
  const ticker=setInterval(()=>{if(!document.hidden)updateClock()},1000);
  window.addEventListener('pagehide',()=>{clearInterval(ticker);observer.disconnect();},{once:true});
})();
