import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../css/StrokeText.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULTS = {
  text: 'Waslha',
  strokeColor: '#FB3C04',
  fillColor: '#FB3C04',
  strokeWidth: 1.6,
  drawDuration: 1.6,
  fillDelay: 0.2,
  stagger: 0.05,
  ease: 'power2.out',
  trigger: 'mount',
  fillMode: 'wipe',
  fontSize: 128,
  fontWeight: 800,
  letterSpacing: -4,
  reverse: false,
  className: '',
  style: {}
};

function uid() {
  return `wipe-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Vanilla StrokeText — mounts animated SVG text into a host element.
 * Mirrors the React StrokeText API the brand uses.
 */
export function mountStrokeText(host, options = {}) {
  if (!host) return () => {};

  const opts = { ...DEFAULTS, ...options };
  const characters = Array.from(String(opts.text ?? ''));
  const wipeId = uid();
  const dash = Math.max(opts.fontSize * 7, 200);

  host.innerHTML = '';
  host.classList.add('stroke-text');
  host.classList.toggle('stroke-text--hover', opts.trigger === 'hover');
  if (opts.className) {
    String(opts.className)
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => host.classList.add(c));
  }
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', String(opts.text ?? ''));
  Object.assign(host.style, opts.style || {});
  host.style.setProperty('--stroke-text-height', `${Math.round(opts.fontSize * 1.3)}px`);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('stroke-text__svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `0 ${-opts.fontSize} 600 ${opts.fontSize * 1.3}`);

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPath.setAttribute('id', wipeId);
  clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const wipeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  wipeRect.setAttribute('x', '0');
  wipeRect.setAttribute('y', '0');
  wipeRect.setAttribute('width', '0');
  wipeRect.setAttribute('height', '0');
  clipPath.appendChild(wipeRect);
  defs.appendChild(clipPath);
  svg.appendChild(defs);

  const strokeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  strokeText.classList.add('stroke-text__stroke');
  strokeText.setAttribute('x', '0');
  strokeText.setAttribute('y', '0');
  strokeText.setAttribute('fill', 'none');
  strokeText.setAttribute('stroke', opts.strokeColor);
  strokeText.setAttribute('stroke-width', String(opts.strokeWidth));
  strokeText.setAttribute('stroke-linejoin', 'round');
  strokeText.setAttribute('stroke-linecap', 'round');
  strokeText.style.fontSize = `${opts.fontSize}px`;
  strokeText.style.fontWeight = String(opts.fontWeight);
  strokeText.style.letterSpacing = `${opts.letterSpacing}px`;

  characters.forEach((char) => {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttribute('data-stroke-char', '');
    tspan.textContent = char;
    strokeText.appendChild(tspan);
  });

  const fillText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  fillText.classList.add('stroke-text__fill');
  fillText.setAttribute('x', '0');
  fillText.setAttribute('y', '0');
  fillText.setAttribute('fill', opts.fillColor);
  fillText.setAttribute('stroke', 'none');
  fillText.style.fontSize = `${opts.fontSize}px`;
  fillText.style.fontWeight = String(opts.fontWeight);
  fillText.style.letterSpacing = `${opts.letterSpacing}px`;

  characters.forEach((char) => {
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttribute('data-fill-char', '');
    tspan.textContent = char;
    fillText.appendChild(tspan);
  });

  svg.appendChild(strokeText);
  svg.appendChild(fillText);
  host.appendChild(svg);

  let box = null;
  let timeline = null;
  let scrollTrigger = null;
  let removeHover = null;
  let cancelled = false;

  const measure = () => {
    if (cancelled || !strokeText) return;
    let bbox;
    try {
      bbox = strokeText.getBBox();
    } catch {
      return;
    }
    if (!bbox || !bbox.width) return;

    const pad = Math.max(Number(opts.strokeWidth) || 1, opts.fontSize * 0.1);
    const next = {
      x: bbox.x - pad,
      y: bbox.y - pad,
      width: bbox.width + pad * 2,
      height: bbox.height + pad * 2
    };

    if (
      box &&
      Math.abs(box.x - next.x) < 0.5 &&
      Math.abs(box.width - next.width) < 0.5 &&
      Math.abs(box.y - next.y) < 0.5
    ) {
      return;
    }

    box = next;
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
    const heightPx = Math.round(opts.fontSize * 1.3);
    const widthPx = Math.ceil((box.width / box.height) * heightPx);
    host.style.setProperty('--stroke-text-height', `${heightPx}px`);
    host.style.width = `${Math.min(widthPx, host.parentElement?.clientWidth || widthPx)}px`;
    host.style.maxWidth = '100%';
    wipeRect.setAttribute('x', String(box.x));
    wipeRect.setAttribute('y', String(box.y));
    wipeRect.setAttribute('height', String(box.height));

    if (opts.fillMode === 'wipe') {
      fillText.setAttribute('clip-path', `url(#${wipeId})`);
    } else {
      fillText.removeAttribute('clip-path');
    }

    runAnimation();
  };

  const runAnimation = () => {
    if (!box) return;

    const strokes = gsap.utils.toArray(host.querySelectorAll('[data-stroke-char]'));
    const fills = gsap.utils.toArray(host.querySelectorAll('[data-fill-char]'));
    const wipe = wipeRect;
    if (!strokes.length) return;

    const fillEnabled = opts.fillMode !== 'none';
    const useWipe = fillEnabled && opts.fillMode === 'wipe';
    const fillDuration = Math.max(0.4, opts.drawDuration * 0.5);
    const staggerConfig = opts.reverse ? { each: opts.stagger, from: 'end' } : opts.stagger;
    const targets = [...strokes, ...fills, wipe].filter(Boolean);

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: fillEnabled ? box.width : 0 } });
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setEnd();
      return;
    }

    const build = () => {
      setStart();
      const tl = gsap.timeline({
        paused: true,
        repeat: opts.trigger === 'loop' ? -1 : 0,
        repeatDelay: opts.trigger === 'loop' ? 0.9 : 0,
        defaults: { overwrite: 'auto' }
      });

      tl.to(
        strokes,
        { strokeDashoffset: 0, duration: opts.drawDuration, ease: opts.ease, stagger: staggerConfig },
        0
      );

      if (useWipe && wipe) {
        tl.to(
          wipe,
          { attr: { width: box.width }, duration: fillDuration, ease: 'power2.inOut' },
          opts.drawDuration + opts.fillDelay
        );
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
          opts.drawDuration + opts.fillDelay
        );
      }

      return tl;
    };

    removeHover?.();
    scrollTrigger?.kill();
    timeline?.kill();
    removeHover = null;
    scrollTrigger = null;
    timeline = null;

    if (opts.trigger === 'hover') {
      setEnd();
      const play = () => {
        timeline?.kill();
        timeline = build();
        timeline.play(0);
      };
      host.addEventListener('pointerenter', play);
      removeHover = () => host.removeEventListener('pointerenter', play);
    } else {
      timeline = build();
      if (opts.trigger === 'scroll') {
        scrollTrigger = ScrollTrigger.create({
          trigger: host,
          start: 'top 82%',
          once: true,
          onEnter: () => timeline?.play(0)
        });
      } else {
        timeline.play(0);
      }
    }
  };

  measure();
  if (document.fonts?.ready) {
    document.fonts.ready.then(measure).catch(() => {});
  }

  // Remeasure after layout settles (responsive)
  requestAnimationFrame(() => requestAnimationFrame(measure));

  return () => {
    cancelled = true;
    removeHover?.();
    scrollTrigger?.kill();
    timeline?.kill();
  };
}

export function responsiveFontSize() {
  const w = window.innerWidth;
  if (w < 420) return 108;
  if (w < 640) return 128;
  if (w < 900) return 160;
  if (w < 1200) return 196;
  return 228;
}
