/* ConceptKnot v56: one-row ribbon with native touch fling and mouse drag momentum.
   No idle RAF, no router or tab handlers changed. */
(function () {
  'use strict';
  const cssFile = './assets/ck-nav-single-row-v56.css';
  if (!document.querySelector('link[data-ck56-nav-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssFile;
    link.dataset.ck56NavStyle = '1';
    // This is added after the Dot CSS to override the old two-row media query.
    document.head.appendChild(link);
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentPill = null;
  let activeObserver = null;
  let rememberedLeft = 0;
  let selectedAnchor = null;
  let cleanupCurrent = null;
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const maxScroll = pill => Math.max(0, pill.scrollWidth - pill.clientWidth);
  // Navigation re-renders the ribbon: keep its last horizontal position in module state.
  function remember(pill) {
    if (pill === currentPill && pill.isConnected) rememberedLeft = pill.scrollLeft;
  }
  function restore(pill, anchor = selectedAnchor) {
    if (!pill || pill !== currentPill || !pill.isConnected) return;
    const limit = maxScroll(pill);
    if (!limit) return; // temporarily unmeasured width must not erase saved position
    pill.scrollLeft = clamp(rememberedLeft, 0, limit);
    if (anchor && performance.now() - anchor.at < 750) {
      const target = Array.from(pill.querySelectorAll('.board-tab[data-go]'))
        .find(tab => tab.dataset.go === anchor.id);
      const active = pill.querySelector('.board-tab.active');
      if (target && (!active || active.dataset.go === anchor.id)) {
        const drift = target.getBoundingClientRect().left - anchor.left;
        if (Number.isFinite(drift)) pill.scrollLeft = clamp(pill.scrollLeft + drift, 0, limit);
      }
    }
    rememberedLeft = pill.scrollLeft;
  }

  function bind(pill) {
    if (pill === currentPill || !pill || !pill.querySelector('.board-tabs')) return;
    if (currentPill?.isConnected) remember(currentPill);
    cleanupCurrent?.();
    currentPill = pill;
    activeObserver?.disconnect();
    let down = null;
    let momentumFrame = 0;
    let suppressClickUntil = 0;
    let autoScrollFrame = 0;
    let touchGesture = null;
    let expectedTouchTab = null;
    const cancelMomentum = () => {
      if (momentumFrame) cancelAnimationFrame(momentumFrame);
      momentumFrame = 0;
    };

    // Record the tapped tab before the app's bubbling router destroys the old node.
    pill.addEventListener('click', event => {
      if (performance.now() < suppressClickUntil) return;
      const actual = event.target?.closest?.('[data-go]');
      // A mobile click can be retargeted after a horizontal flick/layout shift.
      // Never turn a finger-down on one tab into another tab or the brand link.
      if (event.detail !== 0 && expectedTouchTab && performance.now() < expectedTouchTab.until &&
          actual && actual.dataset?.go !== expectedTouchTab.id) {
        expectedTouchTab = null;
        selectedAnchor = null;
        event.preventDefault();event.stopImmediatePropagation();return;
      }
      expectedTouchTab = null;
      const tab = event.target.closest?.('.board-tab[data-go]');
      if (!tab || !pill.contains(tab)) return;
      remember(pill);
      const rect = tab.getBoundingClientRect(), rail = pill.getBoundingClientRect();
      if (event.detail === 0 || rect.right <= rail.left || rect.left >= rail.right) {
        selectedAnchor = null; // programmatic or keyboard navigation: preserve scrollLeft
        return;
      }
      const anchor = {id:tab.dataset.go, left:rect.left, at:performance.now()};
      selectedAnchor = anchor;
      requestAnimationFrame(() => { if (selectedAnchor === anchor) restore(currentPill, anchor); });
      setTimeout(() => { if (selectedAnchor === anchor) restore(currentPill, anchor); }, 490);
    }, true);
    pill.addEventListener('scroll', () => remember(pill), {passive:true});
    const brand = pill.querySelector('.ck-v7-logo');
    const brandObserver = brand && typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => restore(pill, selectedAnchor)) : null;
    brandObserver?.observe(brand);
    const layoutObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          if (pill === currentPill && pill.isConnected && maxScroll(pill) > 0)
            restore(pill, selectedAnchor);
        }) : null;
    layoutObserver?.observe(pill.querySelector('.board-tabs'));
    cleanupCurrent = () => {
      cancelMomentum();brandObserver?.disconnect();layoutObserver?.disconnect();
      touchGesture = null;expectedTouchTab = null;
    };
    restore(pill);
    requestAnimationFrame(() => restore(pill));
    pill.addEventListener('dragstart', event => event.preventDefault());
    pill.addEventListener('pointerdown', event => {
      // Any new touch/pen/mouse scroll stops a pending logo animation correction.
      selectedAnchor = null;
      // A distinct new pointerdown is a fresh intentional tap, not the old fling.
      suppressClickUntil = 0;
      if (event.pointerType === 'touch') {
        cancelMomentum();
        const tab = event.target?.closest?.('.board-tab[data-go]');
        touchGesture = {
          id:event.pointerId,x:Number(event.clientX)||0,y:Number(event.clientY)||0,
          startScroll:pill.scrollLeft,moved:false,tabId:tab?.dataset?.go||null
        };
        expectedTouchTab=null;
        return;
      }
      touchGesture=null;expectedTouchTab=null;
      if ((event.pointerType !== 'mouse' && event.pointerType !== 'pen') ||
          event.button !== 0 || event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      cancelMomentum();
      down = {
        id: event.pointerId,
        x: event.clientX,
        start: pill.scrollLeft,
        moved: false,
        samples: [{s: pill.scrollLeft, t: performance.now()}]
      };
    });
    pill.addEventListener('pointermove', event => {
      if (touchGesture && touchGesture.id === event.pointerId) {
        if (Math.abs((Number(event.clientX)||0)-touchGesture.x)>9 ||
            Math.abs((Number(event.clientY)||0)-touchGesture.y)>11 ||
            Math.abs(pill.scrollLeft-touchGesture.startScroll)>6)touchGesture.moved=true;
        return; // The browser owns native horizontal touch scrolling.
      }
      if (!down || down.id !== event.pointerId) return;
      const dx = event.clientX - down.x;
      if (!down.moved && Math.abs(dx) < 7) return;
      if (!down.moved) {
        down.moved = true;
        pill.classList.add('ck56-dragging');
        try { pill.setPointerCapture(event.pointerId); } catch (_) {}
      }
      event.preventDefault();
      pill.scrollLeft = down.start - dx;
      const now = performance.now();
      down.samples.push({s: pill.scrollLeft, t: now});
      while (down.samples.length > 2 && now - down.samples[0].t > 110) down.samples.shift();
    });
    const endDrag = event => {
      if (touchGesture && touchGesture.id === event.pointerId) {
        const move=touchGesture.moved||
          Math.abs(pill.scrollLeft-touchGesture.startScroll)>6||
          Math.abs((Number(event.clientX)||0)-touchGesture.x)>9||
          Math.abs((Number(event.clientY)||0)-touchGesture.y)>11;
        if (move || event.type==='pointercancel') {
          suppressClickUntil=performance.now()+380;
          expectedTouchTab=null;selectedAnchor=null;
        } else if(touchGesture.tabId){
          expectedTouchTab={id:touchGesture.tabId,until:performance.now()+650};
        }
        touchGesture=null;return;
      }
      if (!down || down.id !== event.pointerId) return;
      const drag = down;
      down = null;
      pill.classList.remove('ck56-dragging');
      if (pill.hasPointerCapture(event.pointerId)) {
        try { pill.releasePointerCapture(event.pointerId); } catch (_) {}
      }
      if (!drag.moved) return;
      suppressClickUntil = performance.now() + 260;
      if (event.type === 'pointercancel' || reduced.matches || drag.samples.length < 2) return;
      const first = drag.samples[0], last = drag.samples[drag.samples.length - 1];
      let velocity = clamp((last.s - first.s) / Math.max(16, last.t - first.t), -2.5, 2.5);
      if (Math.abs(velocity) < .12) return;
      let previous = performance.now();
      const drift = time => {
        momentumFrame = 0;
        if (!pill.isConnected) return;
        const dt = Math.min(32, Math.max(0, time - previous));
        previous = time;
        const maxScroll = Math.max(0, pill.scrollWidth - pill.clientWidth);
        const next = clamp(pill.scrollLeft + velocity * dt, 0, maxScroll);
        const stuck = Math.abs(next - pill.scrollLeft) < .01;
        pill.scrollLeft = next;
        velocity *= Math.exp(-dt / 180);
        if (Math.abs(velocity) >= .035 && !stuck) momentumFrame = requestAnimationFrame(drift);
      };
      momentumFrame = requestAnimationFrame(drift);
    };
    pill.addEventListener('pointerup', endDrag);
    pill.addEventListener('pointercancel', endDrag);
    pill.addEventListener('lostpointercapture', event => {
      if (down && down.id === event.pointerId) endDrag(event);
    });
    // Prevent a drag from activating the button that received the pointerdown.
    pill.addEventListener('click', event => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClickUntil = 0;
    }, true);

    // Navigation preserves the user's exact rail position. No active-tab auto-pan.

  }

  const main = document.getElementById('main');
  if (!main) return;
  const refresh = () => bind(main.querySelector('.ck-v7-nav-pill.ck4-unified'));
  refresh();
  // If the app replaces the ribbon during navigation, bind only the new element.
  new MutationObserver(refresh).observe(main, {childList:true, subtree:true});
  window.CK115Nav = Object.freeze({
    getState:()=>({left:rememberedLeft,active:currentPill?.querySelector?.('.board-tab.active')?.dataset?.go||null,
      connected:Boolean(currentPill?.isConnected),anchor:selectedAnchor?.id||null}),
    refresh
  });
})();
