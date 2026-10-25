/**
 * StockWise — Landing Page JavaScript
 * All event listeners are attached here via addEventListener.
 * No inline onclick/onmouseover or <script> blocks in HTML.
 */

/* ================================================================
   FAQ DATA
   ================================================================ */
const FAQ_DATA = [
  {
    ref:      'REF: FAQ-001 // DATA PRIVACY',
    question: 'Is my sales data private?',
    answer:   'Absolutely. Your data is encrypted and never shared with third parties. We use it solely to generate your forecasts.',
  },
  {
    ref:      'REF: FAQ-002 // ACCOUNTING',
    question: 'Do I need accounting experience?',
    answer:   'Not at all. StockWise is built for warehouse managers and small business owners, not accountants. If you know your product SKUs and can enter a sales number, you\'re ready to go.',
  },
  {
    ref:      'REF: FAQ-003 // DATA IMPORT',
    question: 'Can I import existing sales history?',
    answer:   'Yes. You can import up to 24 months of historical sales data via a simple CSV upload. Our system will immediately use that history to calculate your first set of reorder points.',
  },
  {
    ref:      'REF: FAQ-004 // ALERTS',
    question: 'How are alerts sent?',
    answer:   'StockWise sends alerts via email on all plans. Pro users also receive SMS alerts and can configure webhook integrations for custom pipelines and third-party tools.',
  },
];

/* ================================================================
   1. STICKY NAVBAR SCROLL BEHAVIOUR
   ================================================================ */
function initStickyNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 10) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Highlight active nav link based on scroll position
  const sections = ['features', 'how-it-works', 'pricing', 'faq'];
  const navLinks  = {
    'features':     document.getElementById('nav-features'),
    'how-it-works': document.getElementById('nav-how'),
    'pricing':      document.getElementById('nav-pricing'),
    'faq':          document.getElementById('nav-faq'),
  };

  const updateActiveLink = () => {
    let current = '';
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 100) {
        current = id;
      }
    });

    Object.entries(navLinks).forEach(([id, link]) => {
      if (!link) return;
      if (id === current) {
        link.classList.add('nav-link--active');
      } else {
        link.classList.remove('nav-link--active');
      }
    });
  };

  window.addEventListener('scroll', updateActiveLink, { passive: true });
}

/* ================================================================
   2. SMOOTH SCROLL FOR NAV ANCHOR LINKS
   ================================================================ */
function initSmoothScroll() {
  const anchors = document.querySelectorAll('a[href^="#"], button[data-scroll]');

  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href') || anchor.dataset.scroll;
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const navHeight = document.getElementById('main-nav')?.offsetHeight ?? 64;
      const targetY   = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top: targetY, behavior: 'smooth' });

      // Close mobile menu if open
      closeMobileMenu();
    });
  });

  // "SEE HOW IT WORKS" secondary hero CTA
  const heroCTASecondary = document.getElementById('hero-cta-secondary');
  if (heroCTASecondary) {
    heroCTASecondary.addEventListener('click', () => {
      const target = document.getElementById('how-it-works');
      if (!target) return;
      const navHeight = document.getElementById('main-nav')?.offsetHeight ?? 64;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navHeight,
        behavior: 'smooth',
      });
    });
  }

  // Final CTA button → hero / sign-up flow
  const finalCTABtn = document.getElementById('final-cta-btn');
  if (finalCTABtn) {
    finalCTABtn.addEventListener('click', () => {
      window.location.href = 'signup/';
    });
  }

  // Hero primary CTA → sign-up flow
  const heroCTAPrimary = document.getElementById('hero-cta-primary');
  if (heroCTAPrimary) {
    heroCTAPrimary.addEventListener('click', () => {
      window.location.href = 'signup/';
    });
  }

  // Pricing buttons
  const btnFreePlan = document.getElementById('btn-free-plan');
  if (btnFreePlan) {
    btnFreePlan.addEventListener('click', () => {
      window.location.href = 'signup/';
    });
  }
  const btnProPlan = document.getElementById('btn-pro-plan');
  if (btnProPlan) {
    btnProPlan.addEventListener('click', () => {
      window.location.href = 'signup/';
    });
  }

  // Login / signup buttons
  const btnLogin  = document.getElementById('btn-login');
  const btnSignup = document.getElementById('btn-signup');
  if (btnLogin)  btnLogin.addEventListener('click',  () => window.location.href = 'login/');
  if (btnSignup) btnSignup.addEventListener('click', () => window.location.href = 'signup/');
}

/* ================================================================
   3. MOBILE HAMBURGER MENU
   ================================================================ */
function closeMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const navLinks  = document.getElementById('nav-links');
  if (!hamburger || !navLinks) return;
  hamburger.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('is-open');
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const navLinks  = document.getElementById('nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMobileMenu();
    } else {
      hamburger.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('is-open');
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    const nav = document.getElementById('main-nav');
    if (nav && !nav.contains(e.target)) {
      closeMobileMenu();
    }
  });
}

/* ================================================================
   4. FAQ TAB INTERACTION
   ================================================================ */
function initFAQ() {
  const tabs          = document.querySelectorAll('.faq-tab');
  const panelRef      = document.getElementById('faq-panel-ref');
  const panelQuestion = document.getElementById('faq-panel-question');
  const panelAnswer   = document.getElementById('faq-panel-answer');

  if (!tabs.length || !panelRef || !panelQuestion || !panelAnswer) return;

  const activateTab = (index) => {
    // Update tabs
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle('faq-tab--active', isActive);
      tab.setAttribute('aria-selected', String(isActive));

      // Show/hide the arrow indicator (only on active & desktop)
      const arrow = tab.querySelector('.faq-tab__arrow');
      if (arrow) {
        arrow.style.display = isActive ? '' : 'none';
      }
    });

    // Update panel content with a quick fade
    const data = FAQ_DATA[index];
    if (!data) return;

    panelRef.style.opacity      = '0';
    panelQuestion.style.opacity = '0';
    panelAnswer.style.opacity   = '0';

    setTimeout(() => {
      panelRef.textContent      = data.ref;
      panelQuestion.textContent = data.question;
      panelAnswer.textContent   = data.answer;

      panelRef.style.transition      = 'opacity 200ms ease';
      panelQuestion.style.transition = 'opacity 200ms ease';
      panelAnswer.style.transition   = 'opacity 200ms ease';

      panelRef.style.opacity      = '1';
      panelQuestion.style.opacity = '1';
      panelAnswer.style.opacity   = '1';
    }, 150);
  };

  // Attach listeners
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(index));
  });

  // Initialise non-active tabs' arrow visibility
  tabs.forEach((tab, i) => {
    const arrow = tab.querySelector('.faq-tab__arrow');
    if (arrow && i !== 0) arrow.style.display = 'none';
  });
}

/* ================================================================
   5. INVENTORY STOCK BAR ANIMATION
   ================================================================ */
function initStockBarAnimation() {
  const bars = document.querySelectorAll('.stock-bar__fill[data-width]');
  if (!bars.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bar   = entry.target;
          const width = bar.getAttribute('data-width');
          bar.style.width = width + '%';
          observer.unobserve(bar);
        }
      });
    },
    { threshold: 0.3 }
  );

  bars.forEach((bar) => observer.observe(bar));
}

/* ================================================================
   6. HERO WIDGET ENTRANCE ANIMATION
   ================================================================ */
function initHeroWidgetAnimation() {
  const widget = document.querySelector('.inventory-widget');
  if (!widget) return;

  // Add animation class after a slight delay for staggered entrance feel
  setTimeout(() => {
    widget.classList.add('widget-loaded');
  }, 300);
}

/* ================================================================
   7. INITIALISE ALL MODULES
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initStickyNav();
  initSmoothScroll();
  initMobileMenu();
  initFAQ();
  initStockBarAnimation();
  initHeroWidgetAnimation();
});
