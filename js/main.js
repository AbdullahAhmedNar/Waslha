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
  '.hero-copy, .section-head, .audience-item, .step, .feature, .contact-panel, .form-container, .legal-card, .reveal'
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

const CONTACT_EMAIL = 'waslha.app@gmail.com';
const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

const form = document.querySelector('[data-contact-form]');
if (form) {
  const successEl = form.querySelector('[data-form-success]');
  const errorEl = form.querySelector('[data-form-error]');
  const sendBtn = form.querySelector('[data-send-btn]');

  const t = (ar, en) =>
    (document.documentElement.getAttribute('data-lang') || 'ar') === 'en' ? en : ar;

  const setSending = (sending) => {
    if (!sendBtn) return;
    sendBtn.disabled = sending;
    sendBtn.classList.toggle('is-sending', sending);
    const ar = sendBtn.querySelector('[lang="ar"]');
    const en = sendBtn.querySelector('[lang="en"]');
    if (ar) ar.textContent = sending ? 'جاري الإرسال…' : 'إرسال';
    if (en) en.textContent = sending ? 'Sending…' : 'Send';
  };

  const showStatus = (kind, message) => {
    successEl?.classList.toggle('is-shown', kind === 'success');
    if (errorEl) {
      const show = kind === 'error';
      errorEl.hidden = !show;
      errorEl.classList.toggle('is-shown', show);
      if (show && message) errorEl.textContent = message;
    }
  };

  const openMailtoFallback = ({ name, email, roleLabel, message }) => {
    const subject = encodeURIComponent(`Waslha contact — ${roleLabel || 'General'}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nRole: ${roleLabel}\n\n${message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showStatus(null);

    const name = form.querySelector('#name')?.value?.trim() || '';
    const email = form.querySelector('#mail, #email')?.value?.trim() || '';
    const roleSelect = form.querySelector('#role');
    const roleLabel =
      roleSelect?.selectedOptions?.[0]?.textContent?.trim() ||
      roleSelect?.value ||
      '';
    const roleValue = roleSelect?.value || '';
    const message = form.querySelector('#message')?.value?.trim() || '';
    const honey = form.querySelector('[name="_gotcha"]')?.value || '';

    if (!name || !email || !roleValue || !message) {
      form.reportValidity?.();
      showStatus(
        'error',
        t('املأ كل الحقول المطلوبة.', 'Please fill in all required fields.')
      );
      return;
    }

    if (honey) return;

    setSending(true);

    try {
      const payload = new FormData();
      payload.append('name', name);
      payload.append('email', email);
      payload.append('role', roleLabel);
      payload.append('message', message);
      payload.append('_replyto', email);
      payload.append('_subject', `Waslha contact — ${roleLabel || 'General'}`);
      payload.append('_template', 'table');
      payload.append('_captcha', 'false');

      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload
      });

      const data = await res.json().catch(() => ({}));
      const serverMsg = String(data.message || '');
      const failed =
        !res.ok || data.success === 'false' || data.success === false;

      if (failed) {
        throw new Error(serverMsg || `HTTP ${res.status}`);
      }

      form.reset();
      document.querySelectorAll('[data-role-select] option').forEach((opt) => {
        const lang = document.documentElement.getAttribute('data-lang') || 'ar';
        const label = opt.getAttribute(lang === 'ar' ? 'data-ar' : 'data-en');
        if (label) opt.textContent = label;
      });
      showStatus('success');
    } catch {
      showStatus(
        'error',
        t(
          'تعذّر الإرسال عبر الموقع. جاري فتح تطبيق البريد لإرسال الرسالة يدويًا…',
          'Couldn’t send from the site. Opening your email app as a fallback…'
        )
      );
      openMailtoFallback({ name, email, roleLabel, message });
    } finally {
      setSending(false);
    }
  });
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
