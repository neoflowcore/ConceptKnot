/* ConceptKnot v138: one non-destructive queue for native Korean TTS and opt-in AI audio.
 * No storage, network or model preload. The caller retains canonical text ownership.
 */
(function (root) {
 'use strict';
 function create(options = {}) {
  const clock = options.clock || {set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id)};
  let generation = 0, items = [], index = 0, completed = 0, engine = 'native';
  let utterance = null, beginWatch = null, endWatch = null, isPaused = false;
  let deferredNext = false, finished = false, splitAttempts = 0, activeRate = 1.5;
  let status = 'idle', reason = '', chosenLabel = '';
  function snapshot() {
   return {status, reason, engine, label: chosenLabel, generation, position: index,
    completed, total: items.length, paused: isPaused, failedIndex: status === 'error' ? index : null};
  }
  function report(nextStatus, message = '') {
   status = nextStatus; reason = message;
   try { options.onState?.(snapshot()); } catch (ignored) {}
  }
  function clearTimers() {
   if (beginWatch !== null) {clock.clear(beginWatch); beginWatch = null;}
   if (endWatch !== null) {clock.clear(endWatch); endWatch = null;}
  }
  function stop(announce = false) {
   generation += 1;
   clearTimers();
   utterance = null;
   try {options.synthesis?.()?.cancel?.();} catch (ignored) {}
   try {options.stopAI?.();} catch (ignored) {}
   items = []; index = 0; completed = 0; finished = false; splitAttempts = 0;
   deferredNext = false; isPaused = false; chosenLabel = '';
   report('idle', announce ? '재생을 정지했습니다.' : '');
  }
  function fail(code, message) {
   if (finished) return;
   finished = true; clearTimers();
   try {options.synthesis?.()?.cancel?.();} catch (ignored) {}
   try {options.stopAI?.();} catch (ignored) {}
   report('error', message);
   try {options.onError?.(code, snapshot());} catch (ignored) {}
  }
  function done() {
   if (finished) return;
   finished = true; clearTimers();
   report('ended', '재생 완료 · ' + chosenLabel);
   try {options.onDone?.(snapshot());} catch (ignored) {}
  }
  function splitCurrent(phrase) {
   if (splitAttempts >= 16 || phrase.length < 48) return false;
   const half = Math.floor(phrase.length / 2);
   const space = phrase.lastIndexOf(' ', half);
   const cut = space > 24 && space < phrase.length - 24 ? space : half;
   const parts = [phrase.slice(0, cut).trim(), phrase.slice(cut).trim()];
   if (!parts.every(Boolean)) return false;
   splitAttempts++;
   items.splice(index, 1, ...parts);
   try {options.onSplit?.(index, parts, snapshot());} catch (ignored) {}
   report('ready', '긴 문장을 나누어 같은 위치에서 재시도합니다.');
   return true;
  }
  function nativeNext(own) {
   if (own !== generation || finished) return;
   if (isPaused) {deferredNext = true; return;}
   if (index >= items.length) {done(); return;}
   let synth;
   try {synth = options.synthesis?.();} catch (ignored) {}
   if (!synth || !options.newUtterance) {
    fail('speech-api-unavailable', '브라우저에서 음성 합성을 지원하지 않습니다.'); return;
   }
   let available = [];
   try {available = options.getVoices?.() || [];} catch (ignored) {}
   let voice = null;
   try {voice = options.selectVoice?.() || null;} catch (ignored) {}
   if (!voice && available.length) {
    fail('ko-voice-missing', '기기에 한국어 음성이 등록되지 않았습니다. OS 한국어 음성을 설치해 주세요.');return;
   }
   // Empty voice lists are often an Android/Brave initialization race. Attempt ko-KR
   // synchronously in the originating user-activation call instead of waiting.
   let line;
   const phrase = items[index];
   try {line = options.newUtterance(phrase);} catch (err) {
    fail('utterance-construction', '음성 문장을 만들지 못했습니다: '+(err?.message || '오류'));return;
   }
   utterance = line;
   line.lang = 'ko-KR'; line.voice = voice; line.rate = activeRate; line.pitch = 1;
   let started = false, settled = false;
   line.onstart = () => {
    if (own !== generation || settled || started || finished) return;
    started = true;
    if (beginWatch !== null) {clock.clear(beginWatch);beginWatch = null;}
    report(isPaused ? 'paused' : 'speaking', '기기 음성 시작 이벤트 · '+(index+1)+'/'+items.length);
    try {options.onStart?.(index, phrase, snapshot());} catch (ignored) {}
    // onstart indicates OS acceptance, not audible sound. Real speaker test is separate.
    const ms = Math.min(90000, Math.max(25000, Math.ceil(phrase.length * 230 / activeRate)));
    endWatch = clock.set(() => {
     if (own !== generation || settled || finished) return;
     settled = true;
     fail('end-timeout', '음성 종료 신호가 없어 멈췄습니다. 이 문장은 완료 처리하지 않았습니다.');
    }, ms);
   };
   line.onend = () => {
    if (own !== generation || settled || finished) return;
    settled = true; clearTimers();
    if (!started) {fail('end-without-start', '음성이 시작되지 않은 채 종료되었습니다. 해당 문장은 완료되지 않았습니다.');return;}
    index += 1; completed += 1;
    try {options.onComplete?.(index-1, phrase, snapshot());} catch (ignored) {}
    nativeNext(own);
   };
   line.onerror = event => {
    if (own !== generation || settled || finished) return;
    settled = true; clearTimers();
    const code = String(event?.error || 'unknown');
    if (code === 'text-too-long' && splitCurrent(phrase)) {nativeNext(own);return;}
    fail(code, '기기 음성 오류 ('+code+'). 실패한 문장은 건너뛰지 않았습니다.');
   };
   report('ready', voice ? '한국어 음성 선택됨' : '음성 목록 미준비 · ko-KR 재생 시도');
   try {
    synth.speak(line);
    if (own !== generation || started || settled || finished) return;
    beginWatch = clock.set(() => {
     if (own !== generation || started || settled || finished) return;
     settled = true;
     fail('start-timeout', '7초간 음성 시작 신호가 없습니다. 기기 볼륨·한국어 음성·재생 허용을 확인하세요.');
    }, 7000);
   } catch (err) {
    settled = true;
    fail('speak-exception', '음성 출력 시작 오류: '+(err?.message || '알 수 없음'));
   }
  }
  async function aiNext(own) {
   if (!options.speakAI) {fail('ai-unavailable', 'AI 음성 엔진을 사용할 수 없습니다.');return;}
   while (own === generation && !finished && index < items.length) {
    if (isPaused) {deferredNext = true;return;}
    const phrase = items[index], segmentIndex = index;
    let started = false;
    report('preparing', 'AI 음성 생성 중 · '+(index+1)+'/'+items.length);
    try {
     await options.speakAI(phrase, activeRate, () => {
      if (own !== generation || finished || started) return;
      started = true;
      report(isPaused ? 'paused':'speaking', 'AI 음성 출력 시작 · '+(segmentIndex+1)+'/'+items.length);
      try {options.onStart?.(segmentIndex, phrase, snapshot());} catch (ignored) {}
     });
    } catch (err) {
     if (own === generation) fail('ai-audio-error', 'AI 음성 오류: '+(err?.message || '원인 미확인'));
     return;
    }
    if (own !== generation || finished) return;
    if (!started) {fail('ai-no-start','AI 음성 출력 시작 신호가 없어 문장을 완료 처리하지 않았습니다.');return;}
    index++; completed++;
    try {options.onComplete?.(segmentIndex, phrase, snapshot());} catch (ignored) {}
   }
   if (own === generation && !finished && index >= items.length) done();
  }
  function play(config = {}) {
   stop(false);
   chosenLabel = String(config.label || '선택한 문항');
   engine = config.engine === 'neural' ? 'neural' : 'native';
   activeRate = Math.max(.75, Math.min(2, Number(config.rate) || 1.5));
   items = Array.isArray(config.segments) ? config.segments.filter(s=>typeof s === 'string'&&s.trim()).slice() : [];
   if (!items.length) {fail('empty-queue','읽을 문장이 없습니다.');return {ok:false,reason:'empty-queue'};}
   const own = generation;
   report('preparing', engine === 'native' ? '기기 한국어 음성 확인 중' : 'AI 음성 준비 중');
   if (engine === 'native') nativeNext(own);
   else {
    if (!options.aiReady?.()) {fail('ai-not-ready','AI 모델을 사용할 수 없습니다. 먼저 기기 음성을 사용해 주세요.');return {ok:false,reason:'ai-not-ready'};}
    void aiNext(own);
   }
   return {ok:status !== 'error',items:items.length,engine};
  }
  function togglePause() {
   if (status !== 'speaking' && status !== 'paused') return false;
   try {
    if (engine === 'neural') options.pauseAI?.();
    else if (status === 'paused') options.synthesis?.()?.resume?.();
    else options.synthesis?.()?.pause?.();
   } catch (err) {fail('pause-error','음성 일시정지 오류: '+(err?.message||'원인 미확인'));return false;}
   isPaused = !isPaused;
   report(isPaused?'paused':'speaking', isPaused?'음성 일시정지':'음성 재생 중');
   if (!isPaused && deferredNext) {
    deferredNext = false;
    if (engine === 'native') nativeNext(generation);
    else void aiNext(generation);
   }
   return true;
  }
  return Object.freeze({play, stop, togglePause, getState: snapshot});
 }
 root.CKVoiceControllerFactory = Object.freeze({version: '138', create});
})(typeof window === 'object' ? window : globalThis);
