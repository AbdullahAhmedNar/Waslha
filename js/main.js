import { mountStrokeText, responsiveFontSize } from './stroke-text.js';

const html = document.documentElement;
const stored = localStorage.getItem('waslha-lang');
const initial = stored === 'en' || stored === 'ar' ? stored : 'ar';
setLang(initial);

document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    setLang(html.getAttribute('data-lang') === 'ar' ? 'en' : 'ar');
  });
});

function setLang(lang) {
  html.setAttribute('data-lang', lang);
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  localStorage.setItem('waslha-lang', lang);
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
  });
  document.querySelectorAll('[data-role-select] option').forEach((opt) => {
    const label = opt.getAttribute(lang === 'ar' ? 'data-ar' : 'data-en');
    if (label) opt.textContent = label;
  });
  document.querySelectorAll('[data-ph-ar]').forEach((el) => {
    const ph = el.getAttribute(lang === 'ar' ? 'data-ph-ar' : 'data-ph-en');
    if (ph) el.setAttribute('placeholder', ph);
  });
}

const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

const menuBtn = document.querySelector('[data-menu]');
const mobileNav = document.querySelector('[data-mobile-nav]');

function setMenuOpen(open) {
  if (!menuBtn || !mobileNav) return;
  menuBtn.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  mobileNav.classList.toggle('is-open', open);
  mobileNav.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('menu-open', open);
}

if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => {
    setMenuOpen(!mobileNav.classList.contains('is-open'));
  });

  mobileNav.querySelectorAll('[data-menu-close]').forEach((el) => {
    el.addEventListener('click', () => setMenuOpen(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenuOpen(false);
  });
}

const revealEls = document.querySelectorAll(
  '.hero-copy, .section-head, .audience-item, .step, .feature, .contact-panel, .contact-direct, .legal-card, .reveal'
);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.01, rootMargin: '0px 0px -8px 0px' }
  );
  revealEls.forEach((el) => io.observe(el));
  // Ensure above-the-fold content shows even when DevTools shrinks the viewport
  requestAnimationFrame(() => {
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
        io.unobserve(el);
      }
    });
  });
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* —— Hero StrokeText: Waslha writes on load —— */
const strokeHost = document.querySelector('[data-stroke-text]');
let destroyStroke = null;

function mountHeroStroke() {
  if (!strokeHost) return;
  destroyStroke?.();
  destroyStroke = mountStrokeText(strokeHost, {
    text: 'Waslha',
    strokeColor: '#FB3C04',
    fillColor: '#FB3C04',
    strokeWidth: 2,
    drawDuration: 1.8,
    fillDelay: 0.12,
    stagger: 0.07,
    ease: 'power2.out',
    trigger: 'mount',
    fillMode: 'wipe',
    fontSize: responsiveFontSize(),
    fontWeight: 800,
    letterSpacing: -1
  });
}

mountHeroStroke();

let resizeTimer;
let lastStrokeWidth = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const w = window.innerWidth;
    // Ignore height-only changes (e.g. opening DevTools docked to the bottom)
    if (Math.abs(w - lastStrokeWidth) < 40) return;
    lastStrokeWidth = w;
    mountHeroStroke();
  }, 220);
});
