/* ConceptKnot learning engine v0.2 — deterministic, dependency-free, browser/Node. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const roundDay = (n) => Math.round(n * 100) / 100;
  const validRating = (r) => ['again','hard','good','easy'].includes(r);
  const isDue = (row, now = Date.now()) => !!row && Number(row.dueAt) <= now;
  const nextReview = (old, rating, now = Date.now()) => {
    if (!validRating(rating)) throw Error('유효하지 않은 복습 등급');
    const prev = old && typeof old === 'object' ? old : {};
    const ease = clamp(Number(prev.ease) || 2.5, 1.3, 3.2);
    const interval = Math.max(0, Number(prev.interval) || 0);
    const reps = Math.max(0, Number(prev.reps) || 0);
    const lapses = Math.max(0, Number(prev.lapses) || 0);
    let nextInterval, nextEase, nextReps, nextLapses = lapses;
    switch (rating) {
      case 'again':
        nextInterval = 15 / 1440;  // 15 minutes, not tomorrow
        nextEase = clamp(ease - .2, 1.3, 3.2);
        nextReps = 0;
        nextLapses++;
        break;
      case 'hard':
        nextInterval = Math.max(1, Math.ceil(interval * 1.2));
        nextEase = clamp(ease - .12, 1.3, 3.2);
        nextReps = reps + 1;
        break;
      case 'good':
        nextInterval = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(3, Math.ceil(interval * ease));
        nextEase = ease;
        nextReps = reps + 1;
        break;
      default:
        nextInterval = reps === 0 ? 4 : Math.max(4, Math.ceil(interval * ease * 1.3));
        nextEase = clamp(ease + .15, 1.3, 3.2);
        nextReps = reps + 1;
    }
    return {
      ease: roundDay(nextEase), interval: roundDay(nextInterval), reps: nextReps,
      lapses: nextLapses, rating, reviewedAt: now, dueAt: now + Math.round(nextInterval * DAY),
      history: (Array.isArray(prev.history) ? prev.history : []).slice(-39).concat([{at: now, rating}])
    };
  };
  const validKeys = (raw) => Array.isArray(raw) && raw.length === 80 && raw.every(row =>
    Array.isArray(row) && row.length >= 1 && row.length <= 5 &&
    row.every(x => Number.isInteger(Number(x)) && Number(x) >= 1 && Number(x) <= 5)
  );
  const score = (answers, keys, year, start, end) => {
    if (!validKeys(keys)) return null;
    let correct = 0, attempted = 0, wrong = 0;
    const items = [];
    for (let i = start; i <= end; i++) {
      const ans = Number(answers[`${year}-${i}`]);
      const marked = answers[`${year}-${i}`] != null && ans >= 1 && ans <= 5;
      if (marked) attempted++;
      const ok = marked && keys[i-1].map(Number).includes(ans);
      if (ok) correct++;
      else if (marked) wrong++;
      items.push({number:i, answer: marked?ans:null, correct:keys[i-1].map(Number), status:!marked?'blank':ok?'correct':'wrong'});
    }
    return {year, start, end, correct, wrong, blank: end-start+1-attempted, attempted,
      total:end-start+1, points:correct * 2.5, items};
  };
  const passReport = (estate, civil) => {
    if (!estate || !civil) return null;
    const average = roundDay((estate.points + civil.points) / 2);
    return {estate:estate.points,civil:civil.points,average,
      passes:estate.points >= 40 && civil.points >=40 && average>=60,
      reason:estate.points<40?'학개론 과락':civil.points<40?'민법 과락':average<60?'평균 60점 미만':'합격 기준 충족'};
  };
  const weekly = (daily, days, now = new Date()) => {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Array.from({length:days},(_,i)=>{
      const d = new Date(base); d.setDate(d.getDate()-(days-1-i));
      const iso = [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
      return {date:iso, minutes:Math.max(0,Number(daily?.[iso])||0)};
    });
  };
  const safeText = (value, limit = 10000) => String(value ?? '').slice(0,limit);
  const cleanUrl = (value) => {
    const str = safeText(value, 500).trim();
    try { const u = new URL(str); return /^https?:$/.test(u.protocol) ? u.href : ''; }
    catch { return ''; }
  };
  const parseKeyText = (text) => {
    const raw=safeText(text,5000).trim();
    let arr = raw.split(/[\s;,|]+/).filter(Boolean);
    if (arr.length===1 && /^[1-5]{80}$/.test(arr[0])) arr=arr[0].split('');
    if (arr.length!==80) throw Error('A형 정답 80개를 입력하세요. 현재 '+arr.length+'개입니다.');
    const result=arr.map(row=>{
      if (!/^[1-5](?:[\/][1-5])*$/.test(row)) throw Error('정답 형식: 1~5, 복수정답 2/4. 오류: '+row);
      return [...new Set(row.split('/').map(Number))];
    });
    if (!validKeys(result)) throw Error('정답 배열에 오류가 있습니다.');
    return result;
  };
  const conceptStrength = (card, srs, answers, quizzes, content) => {
    let n=0,total=0;
    const r=srs?.[card.id];
    if (r) { total+=2;n+=r.rating==='good'?1.6:r.rating==='easy'?2:r.rating==='hard'?1:0; }
    for(const q of quizzes){if(q.s!==card.s || q.topic!==card.topic || answers[q.id]==null)continue;
      total++;if(Number(answers[q.id])===q.ok)n++;}
    return total?Math.round(100*n/total):0;
  };
  root.CK_ENGINE = Object.freeze({DAY,nextReview,isDue,score,passReport,validKeys,parseKeyText,weekly,safeText,cleanUrl,conceptStrength});
})(typeof window !== 'undefined' ? window : globalThis);