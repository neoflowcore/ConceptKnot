/* ConceptKnot v21 · SVG study charts. No WebGL, workers or perpetual rAF.
 * Curves move only after an explicit learner click; reduced motion is respected via CSS.
 * Scenarios illustrate directions, never pretend to be observed market data.
 */
(function(){
'use strict';
const charts=[
{id:'price-along',title:'가격 변화와 수요량',group:'수요·공급',source:'2025-10',axis:['수량 Q','가격 P'],
 question:'해당 재화의 가격만 하락하면 수요곡선 자체가 이동할까?',answer:'아니요. 가격 변화는 주어진 곡선 위의 이동으로 수요량이 변합니다.',type:'along',label:'D₀',effect:'가격 하락 → 곡선 위 이동'},
{id:'demand-income',title:'정상재·소득 증가',group:'수요·공급',source:'2024-10',axis:['수량 Q','가격 P'],
 question:'정상재의 소득이 증가하고 공급이 그대로라면?',answer:'수요곡선이 우측으로 이동합니다. 공급이 불변이고 다른 조건이 동일하면 균형가격과 거래량은 증가합니다.',type:'demand',shift:65,effect:'수요 D₀ → D₁ 우측 이동'},
{id:'demand-down',title:'인구 감소·수요 축소',group:'수요·공급',source:'2025-9',axis:['수량 Q','가격 P'],
 question:'수요 감소, 공급 불변이면?',answer:'수요곡선이 좌측 이동합니다. 보통 균형가격과 균형거래량이 내려갑니다.',type:'demand',shift:-65,effect:'수요 D₀ → D₁ 좌측 이동'},
{id:'demand-substitute',title:'대체재 가격과 수요',group:'수요·공급',source:'2022-5',axis:['수량 Q','가격 P'],
 question:'대체재 가격이 상승하면 해당 재화의 수요는?',answer:'대체관계가 성립하면 해당 재화의 수요가 증가하여 수요곡선이 우측으로 이동합니다. 교차탄력성은 보통 양(+)입니다.',type:'demand',shift:65,effect:'대체재 가격 상승 → 수요 증가'},
{id:'supply-cost',title:'건축비 상승과 공급 감소',group:'수요·공급',source:'2022-6',axis:['수량 Q','가격 P'],
 question:'생산비용이 높아지고 수요가 그대로라면?',answer:'공급곡선은 좌측으로 이동합니다. 수요 일정 시 균형가격 상승, 거래량 감소가 일반적입니다.',type:'supply',shift:-65,effect:'공급 S₀ → S₁ 좌측 이동'},
{id:'supply-tech',title:'기술 발전과 공급 증가',group:'수요·공급',source:'2021-5',axis:['수량 Q','가격 P'],
 question:'생산기술 개선으로 공급비용이 감소하면?',answer:'공급곡선이 우측 이동합니다. 수요 일정 시 균형가격 하락, 거래량 증가가 일반적입니다.',type:'supply',shift:65,effect:'공급 S₀ → S₁ 우측 이동'},
{id:'equilibrium-demand',title:'수요 증가 후 균형점',group:'균형·정책',source:'2025-9',axis:['수량 Q','가격 P'],
 question:'공급이 고정일 때 수요가 오른쪽으로 이동하면?',answer:'새 수요·공급의 교차점은 대체로 기존보다 오른쪽 위에 생깁니다. 가격과 거래량 모두 상승합니다.',type:'demand',shift:65,effect:'수요 증가 → 가격↑ 수량↑'},
{id:'equilibrium-supply',title:'공급 증가 후 균형점',group:'균형·정책',source:'2022-6',axis:['수량 Q','가격 P'],
 question:'수요 고정, 공급 오른쪽 이동의 결과는?',answer:'균형가격은 하락하고 균형거래량은 증가합니다. 공급이 늘었으므로 균형점이 오른쪽 아래로 이동합니다.',type:'supply',shift:65,effect:'공급 증가 → 가격↓ 수량↑'},
{id:'both-shift',title:'수요·공급 동시 이동',group:'균형·정책',source:'2021-5',axis:['수량 Q','가격 P'],
 question:'수요도 공급도 증가하면 가격 방향까지 확정할 수 있을까?',answer:'균형거래량은 증가하지만 균형가격은 상대적 이동 폭에 따라 상승·하락·불변 모두 가능합니다.',type:'both',shift:55,effect:'두 곡선 동시에 이동 → 가격은 불확정'},
{id:'elasticity',title:'탄력적·비탄력적 수요',group:'균형·정책',source:'2025-12',axis:['수량 Q','가격 P'],
 question:'가격의 같은 변동에 수요량 변화가 더 큰 곡선은?',answer:'상대적으로 완만한 수요곡선은 수요량이 크게 반응하며, 수직에 가까운 곡선은 덜 반응합니다. 실제 탄력성은 변화율 기준입니다.',type:'elasticity',effect:'탄력성에 따른 곡선 기울기 비교'},
{id:'ceiling',title:'최고가격제와 초과수요',group:'균형·정책',source:'2025-22',axis:['수량 Q','가격 P'],
 question:'실효성 있는 최고가격을 균형 아래로 설정하면?',answer:'가격 상한이 균형보다 낮을 때 공급량보다 수요량이 커져 초과수요(부족)가 발생할 수 있습니다.',type:'ceiling',effect:'균형 아래 최고가격 → 수요량>공급량'},
{id:'cobweb',title:'거미집모형과 시차',group:'시장·입지',source:'2023-5',axis:['수량 Q','가격 P'],
 question:'거미집모형 생산자가 주로 참고하는 것은?',answer:'공급 의사결정이 전기 가격을 기준으로 이뤄지는 시차를 가정합니다. 실제 수렴·발산은 기울기 관계에 따라 달라집니다.',type:'cobweb',effect:'전기 가격에 반응한 시차 경로'},
{id:'rent-distance',title:'도심 거리와 입찰지대',group:'시장·입지',source:'2025-14',axis:['도심에서 거리','지대'],
 question:'다른 조건이 같을 때 도심에서 멀어질수록 입찰지대는?',answer:'일반적 입찰지대 개념에서는 중심지 접근 이점이 작아져 지불할 수 있는 지대가 낮아지는 경향을 도식화합니다.',type:'distance',effect:'거리 증가에 따라 지대 감소'},
{id:'present-value',title:'할인율과 현재가치',group:'투자·금융',source:'2024-17',axis:['할인율 r','현재가치 PV'],
 question:'미래의 수령액과 기간이 같을 때 할인율이 올라가면?',answer:'현재가치는 하락합니다. 정확한 관계는 PV=FV/(1+r)^n으로 계산합니다.',type:'distance',effect:'할인율 상승 → PV 감소'},
{id:'stock-flow',title:'저량과 유량의 차이',group:'투자·금융',source:'2025-7',axis:['시간','주택 재고·신규 공급'],
 question:'재고주택과 연간 신축량 중 어느 쪽이 저량일까?',answer:'특정 시점의 재고량은 저량, 일정 기간의 신축량·거래량은 유량입니다. 두 단위는 서로 다릅니다.',type:'stock',effect:'저량(잔고)과 유량(기간당 증가)'},
{id:'cap-rate',title:'환원율과 수익가격',group:'투자·금융',source:'2024-27',axis:['환원율','수익가격'],
 question:'NOI가 같을 때 환원율이 오르면 수익가격은?',answer:'수익가격=NOI/환원율. 따라서 수익가격은 낮아집니다. 할인율·환원율 구분이 필요합니다.',type:'distance',effect:'환원율 상승 → 수익가격 하락'},
{id:'huff',title:'허프모형의 점포 거리',group:'시장·입지',source:'2022-10',axis:['점포까지 거리','점포 선택 유인'],
 question:'점포 매력도와 경쟁 조건이 같고 방문 거리가 증가하면?',answer:'허프모형에서 거리 저항으로 인해 선택 유인이 감소합니다. 실제 확률은 경쟁점포 유인력 총합도 고려합니다.',type:'distance',effect:'거리 증가 → 해당 점포 유인 감소'}
];
let selected=0,phase=false;
const escape=v=>String(v||'').replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[a]));
function svg(c){
 const type=c.type;
 const demand='<path class="ck21-curve demand" d="M100 86 L485 286"/>';
 const supply='<path class="ck21-curve supply" d="M110 300 L480 80"/>';
 const dx=Math.abs(c.shift||0),dir=Math.sign(c.shift||1),offset=(dir*dx)+'px';
 const moving=type==='demand'||type==='both'?'demand':type==='supply'?'supply':'';
 const shiftClass='ck21-transform-target '+(phase?'ck21-shifted':'');
 const d='<g class="'+(moving==='demand'?shiftClass:'')+'" style="--ck21-dx:'+(moving==='demand'?offset:'0px')+'">'+demand+'</g>';
 const s='<g class="'+(moving==='supply'||type==='both'?shiftClass:'')+'" style="--ck21-dx:'+(moving==='supply'?offset:type==='both'?'55px':'0px')+'">'+supply+'</g>';
 let line='',extra='',renderSupply=s,renderDemand=d;
 if(type==='distance'){renderSupply='';renderDemand='<path class="ck21-curve demand" d="M120 85 Q 255 225 485 295"/>'}
 if(type==='elasticity'){renderDemand='<path class="ck21-curve demand" d="M135 142 L460 220"/><path class="ck21-curve supply" d="M285 65 L320 310"/>';renderSupply='';extra='<text x="390" y="178">탄력적</text><text x="324" y="88">비탄력적</text>'}
 if(type==='stock'){renderDemand='<path class="ck21-curve demand" d="M112 260 L210 234 L300 203 L387 176 L472 147"/>';renderSupply='<path class="ck21-curve supply" d="M112 270 L210 270 L210 245 L300 245 L300 224 L387 224 L387 210 L472 210"/>';extra='<text x="412" y="137">저량</text><text x="430" y="202">유량</text>'}
 if(type==='along'){renderSupply='';extra='<circle class="ck21-point ck21-along '+(phase?'ck21-moved':'')+'" cx="300" cy="190" r="8"/><text x="305" y="170">D₀</text>'}
 if(type==='ceiling'){line='<line class="ck21-policy '+(phase?'ck21-policy-show':'')+'" x1="90" y1="247" x2="490" y2="247"/><text x="120" y="235">최고가격</text>';}
 if(type==='cobweb'){extra='<path class="ck21-step '+(phase?'ck21-step-show':'')+'" d="M145 270 L145 155 L288 155 L288 197 L321 197 L321 177 L300 177 L300 184 L304 184"/>';}
 const ruler='<path class="ck21-axis" d="M86 50 V315 H510"/><path class="ck21-axis-arrow" d="M80 60 L86 49 L92 60 M499 309 L510 315 L499 321"/>';
 return '<svg class="ck21-chart-svg" viewBox="0 0 560 348" role="img" aria-label="'+escape(c.title)+' · '+escape(c.effect)+'">'
  +'<g class="ck21-grid"><path d="M85 120 H505 M85 205 H505 M85 285 H505 M185 50 V315 M295 50 V315 M405 50 V315"/></g>'
  +ruler+'<text x="18" y="42">'+escape(c.axis[1])+'</text><text x="430" y="340">'+escape(c.axis[0])+'</text>'
  +renderDemand+renderSupply+line+extra+'</svg>';
}
function render(){
 const c=charts[selected];
 return '<div class="ck21-chart-section"><header class="ck21-chart-head"><h2>기출에서 이해하는 그래프 · '+charts.length+'가지</h2><p>반드시 재생 버튼을 눌러야 움직입니다. 실제 시장 데이터가 아닌 경제원리 도식입니다.</p></header>'
  +'<div class="ck21-chart-tabs" role="group" aria-label="차트 종류">'+charts.map((v,i)=>'<button type="button" data-ck21-chart="'+i+'" aria-pressed="'+(i===selected)+'">'+escape(v.title)+'</button>').join('')+'</div>'
  +'<div class="ck21-chart-card"><div class="ck21-chart-stage">'+svg(c)+'</div>'
  +'<div class="ck21-chart-copy"><span>'+escape(c.group)+' · 관련 기출 '+escape(c.source.slice(0,4))+'년 '+escape(c.source.split('-')[1])+'번</span><h3>'+escape(c.title)+'</h3><p><strong>질문</strong> '+escape(c.question)+'</p>'
  +'<div class="ck21-chart-actions"><button type="button" data-ck21-play>'+(phase?'↩ 시작 상태로':'▶ 차트 움직임 보기')+'</button><button type="button" data-ck21-exam="'+escape(c.source)+'">연결 기출 보기</button></div>'
  +'<p class="ck21-chart-explanation">'+(phase?escape(c.answer):'움직임을 실행하면 개념·정답 근거가 나타납니다.')+'</p><small>그림과 계산은 개념 학습용으로 단순화했습니다. 특정 연도 문제의 그래프 원본 재현이 아닙니다.</small></div></div></div>';
}
const problems=[
 {id:'chart-demand-shift',t:'수요곡선 이동',q:'정상재에서 소득이 증가하고 다른 조건이 일정할 때 수요곡선은?',a:['우측 이동','좌측 이동','곡선 위 아래로만 이동','변하지 않음','수직선이 됨'],ok:1,fast:'소득 증가 → 정상재 수요 증가 → 곡선 우측 이동',guard:'자기 가격 변화는 곡선 위 이동이다.',f:'수요 변화 ≠ 수요량 변화',chart:'demand-income'},
 {id:'chart-price-movement',t:'수요량 변화',q:'부동산 자체의 가격만 하락할 때 (다른 조건 일정) 발생하는 것은?',a:['곡선 위 수요량 증가','수요곡선 좌측 이동','수요곡선 우측 이동','공급곡선 좌측 이동','수요량 감소'],ok:1,f:'자기가격 변화 → 수요곡선 위 점 이동',fast:'가격 하락 → 수요량 증가',guard:'소득·선호 등 비가격 요인만 곡선 자체를 이동시킨다.',chart:'price-along'},
 {id:'chart-supply-shift',t:'공급곡선 이동',q:'건축 자재비가 상승하고 수요가 일정할 때 균형가격은 일반적으로?',a:['상승','하락','항상 일정','0이 됨','무조건 반으로 하락'],ok:1,f:'비용 상승 → 공급 감소',fast:'공급곡선 좌측 → 균형가격 상승·수량 감소',guard:'수요가 동시에 움직이면 단정할 수 없다.',chart:'supply-cost'},
 {id:'chart-both',t:'동시 이동',q:'수요와 공급이 동시에 증가할 때 확정 가능한 일반적인 결과는?',a:['균형거래량 증가','균형가격 상승','균형가격 하락','균형거래량 감소','가격은 반드시 고정'],ok:1,f:'수요·공급 모두 우측 이동',fast:'균형거래량 ↑, 가격은 이동 폭에 좌우',guard:'상대적 이동 폭이 달라 가격 방향은 불확정이다.',chart:'both-shift'},
 {id:'chart-elasticity',t:'수요의 가격탄력성',q:'가격 변화율이 같을 때 수요량 변화율이 더 큰 수요를 무엇이라 하는가?',a:['더 탄력적인 수요','완전 비탄력적 수요','수직 수요','저량','공급 증가'],ok:1,f:'수요 가격탄력성 = |수요량 변화율 / 가격 변화율|',fast:'수요량이 더 크게 변하면 탄력성이 더 크다.',guard:'단순 기울기와 탄력성은 단위·기준점 차이가 있다.',chart:'elasticity'},
 {id:'chart-ceiling',t:'최고가격제',q:'균형가격보다 낮게 최고가격을 설정한 경우(다른 조건 불변) 일반적인 현상은?',a:['초과수요 발생','초과공급 발생','균형수량 자동 증가','수요곡선 수직화','수요가 반드시 소멸'],ok:1,f:'Pmax < Pe',fast:'Qs보다 Qd가 많아 부족이 발생',guard:'최고가격이 균형보다 높으면 비구속적이다.',chart:'ceiling'},
 {id:'chart-stock',t:'저량·유량 그래프',q:'다음 중 특정 시점에 측정되는 저량(stock)에 해당하는 것은?',a:['주택 재고량','연간 신축량','연간 거래량','월 임대료','연간 이자비용'],ok:1,f:'저량=시점, 유량=기간',fast:'주택 재고량은 특정 시점의 수량',guard:'서로 단위가 다른 저량·유량을 더하지 않는다.',chart:'stock-flow'},
 {id:'chart-pv',t:'현재가치 곡선',q:'미래금액과 기간이 일정할 때 할인율이 상승하면 현재가치는?',a:['감소','증가','항상 불변','반드시 음수','할인율과 동일해짐'],ok:1,f:'PV = FV/(1+r)^n',fast:'분모 증가 → PV 감소',guard:'단위와 기간 n을 확인한다.',chart:'present-value'},
 {id:'chart-cap',t:'환원율·수익가격',q:'순영업소득이 일정한 경우 환원율이 높아지면 수익가격은?',a:['하락','상승','변함없음','항상 0','수익률과 같아짐'],ok:1,f:'V = NOI/R',fast:'환원율 증가 → 가치 하락',guard:'NOI는 순영업소득이며 총임대료가 아니다.',chart:'cap-rate'},
 {id:'chart-cobweb',t:'거미집모형',q:'거미집모형의 대표 가정에서 생산자가 공급량 결정에 사용하는 것은?',a:['전기(과거) 가격','다음 기간의 확정 가격','직전 거래량 무조건','정책금리만','현재 수요 곡선 없음'],ok:1,f:'시차가 있는 공급 결정',fast:'전기 가격을 보고 다음 공급을 결정',guard:'수렴·발산은 기울기/탄력성 관계에 따라 달라진다.',chart:'cobweb'}
];
function choose(i){if(!Number.isInteger(i)||i<0||i>=charts.length)return false;selected=i;phase=false;return true}
function play(){phase=!phase;return phase}
function pickFromProblem(id){const index=charts.findIndex(x=>x.id===id);if(index>=0){choose(index);return true}return false}
window.CK21Charts=Object.freeze({render,charts:Object.freeze(charts),problems:Object.freeze(problems),choose,play,getState:()=>({selected,phase,id:charts[selected].id}),selectProblem:pickFromProblem});
})();