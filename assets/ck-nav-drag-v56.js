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
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

  function bind(pill) {
    if (pill === currentPill || !pill || !pill.querySelector('.board-tabs')) return;
    currentPill = pill;
    activeObserver?.disconnect();
    let down = null;
    let momentumFrame = 0;
    let suppressClickUntil = 0;
    let autoScrollFrame = 0;
    const cancelMomentum = () => {
      if (momentumFrame) cancelAnimationFrame(momentumFrame);
      momentumFrame = 0;
    };

    pill.addEventListener('dragstart', event => event.preventDefault());
    pill.addEventListener('pointerdown', event => {
      if ((event.pointerType !== 'mouse' && event.pointerType !== 'pen') ||
          event.button !== 0 || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
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

    // Preserve Ctrl+tab and keyboard navigation: bring activated offscreen tab into view.
    const ensureActiveVisible = () => {
      autoScrollFrame = 0;
      if (!pill.isConnected || down?.moved) return;
      const selected = pill.querySelector('.board-tabs > .board-tab.active');
      if (!selected) return;
      const rail = pill.getBoundingClientRect();
      const tab = selected.getBoundingClientRect();
      const inset = 12;
      const overflow = tab.left < rail.left + inset ? tab.left - rail.left - inset :
        tab.right > rail.right - inset ? tab.right - rail.right + inset : 0;
      if (Math.abs(overflow) > 1) {
        cancelMomentum();
        pill.scrollBy({left: overflow, behavior: reduced.matches ? 'instant' : 'smooth'});
      }
    };
    activeObserver = new MutationObserver(records => {
      if (!records.some(r => r.target.matches?.('.board-tab'))) return;
      if (!autoScrollFrame) autoScrollFrame = requestAnimationFrame(ensureActiveVisible);
    });
    activeObserver.observe(pill.querySelector('.board-tabs'), {attributes:true, attributeFilter:['class'], subtree:true});
  }

  const main = document.getElementById('main');
  if (!main) return;
  const refresh = () => bind(main.querySelector('.ck-v7-nav-pill.ck4-unified'));
  refresh();
  // If the app replaces the ribbon during navigation, bind only the new element.
  new MutationObserver(refresh).observe(main, {childList:true, subtree:true});
})();
