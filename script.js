const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Split section titles into per-character spans for staggered reveals.
// Must run before AOS.init so their data-aos attributes are dropped first.
const prepareSectionTitles = () => {
  if (prefersReducedMotion) return;
  document.querySelectorAll('.section-title').forEach(title => {
    title.removeAttribute('data-aos');
    const words = title.textContent.trim().split(/\s+/);
    title.textContent = '';
    let charIndex = 0;
    words.forEach((word, w) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'title-word';
      [...word].forEach(ch => {
        const chSpan = document.createElement('span');
        chSpan.className = 'title-char';
        chSpan.textContent = ch;
        chSpan.style.transitionDelay = `${charIndex * 26}ms`;
        wordSpan.appendChild(chSpan);
        charIndex++;
      });
      title.appendChild(wordSpan);
      if (w < words.length - 1) title.appendChild(document.createTextNode(' '));
    });
  });
};
prepareSectionTitles();

// Initialize Animate-On-Scroll (AOS) with subtle parameters
AOS.init({ 
  duration: 800,
  once: true,
  offset: 100
});

// Elements
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const mobileProgressBar = document.getElementById('mobile-progress-bar');
const activeSectionIndicator = document.getElementById('active-section-indicator');
const progressSteps = document.querySelectorAll('.progress-step');
const sections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.nav-link');
const timelines = document.querySelectorAll('.timeline');
const ghostNums = document.querySelectorAll('.ghost-num');
const backToTop = document.getElementById('back-to-top');

// Toggle sidebar and animate hamburger lines (mobile menu)
hamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  hamburger.classList.toggle('active');
  sidebar.classList.toggle('active');
});

// Close sidebar on click outside
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
    sidebar.classList.remove('active');
    hamburger.classList.remove('active');
  }
});

// Helper: scroll to element with offset/behavior
const scrollToSection = (targetSelector) => {
  const targetSection = document.querySelector(targetSelector);
  if (targetSection) {
    targetSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

// Clicking sliding drawer links (mobile menu)
navLinks.forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    sidebar.classList.remove('active');
    hamburger.classList.remove('active');
    scrollToSection(this.getAttribute('href'));
  });
});

// Clicking segmented progress sidebar elements (desktop menu)
progressSteps.forEach(step => {
  step.addEventListener('click', function () {
    scrollToSection(this.getAttribute('data-target'));
  });
});

// High-fidelity Scroll Tracker (handles segmented fills, active class triggers, and mobile top bar fill)
const onScrollHandler = () => {
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const maxScroll = docHeight - windowHeight;
  
  // 1. Mobile progress bar filling (page-wide percentage)
  if (mobileProgressBar) {
    const totalPercent = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
    mobileProgressBar.style.width = `${totalPercent}%`;
  }
  
  // 2. Desktop Segmented Progress Filling
  let activeIndex = 0;
  const triggerLine = windowHeight * 0.35; // Trigger scroll spy at 35% of viewport height
  const isAtBottom = (scrollY + windowHeight >= docHeight - 15);

  sections.forEach((section, index) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const step = progressSteps[index];
    
    if (step) {
      const fill = step.querySelector('.step-bar-fill');
      let percent = 0;
      
      if (isAtBottom) {
        percent = 100; // Complete everything if at page bottom
      } else if (scrollY >= sectionTop + sectionHeight) {
        percent = 100; // Past this section
      } else if (scrollY < sectionTop) {
        percent = 0; // Not yet reached
      } else {
        // Scrolled inside this section
        percent = ((scrollY - sectionTop) / sectionHeight) * 100;
      }
      
      if (fill) {
        fill.style.height = `${percent}%`;
      }
    }
    
    // Check which section is currently "active" using the trigger line
    const rect = section.getBoundingClientRect();
    if (rect.top <= triggerLine && rect.bottom > triggerLine) {
      activeIndex = index;
    }
  });

  // Handle scroll boundaries for active state
  if (scrollY < 50) {
    activeIndex = 0;
  } else if (isAtBottom) {
    activeIndex = sections.length - 1;
  }

  // Update active state on progress bar segments & labels
  progressSteps.forEach((step, index) => {
    if (index === activeIndex) {
      step.classList.add('active');
      if (activeSectionIndicator) {
        const labelText = step.querySelector('.step-label').textContent;
        if (activeSectionIndicator.textContent !== labelText) {
          activeSectionIndicator.textContent = labelText;
          activeSectionIndicator.classList.remove('swapping');
          void activeSectionIndicator.offsetWidth; // Restart animation
          activeSectionIndicator.classList.add('swapping');
        }
      }
    } else {
      step.classList.remove('active');
    }
  });

  // Keep mobile menu drawer links synced with active section
  const activeSectionId = sections[activeIndex] ? sections[activeIndex].getAttribute('id') : '';
  navLinks.forEach(link => {
    if (link.getAttribute('href') === `#${activeSectionId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Scroll-drawn accent line beside each timeline (desktop track)
  timelines.forEach(tl => {
    const rect = tl.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (windowHeight * 0.7 - rect.top) / rect.height));
    tl.style.setProperty('--timeline-progress', progress.toFixed(4));
  });

  // Ghost numeral parallax drift
  if (!prefersReducedMotion) {
    ghostNums.forEach(ghost => {
      const section = ghost.closest('.content-section');
      if (section) {
        ghost.style.transform = `translateY(${section.getBoundingClientRect().top * -0.08}px)`;
      }
    });
  }

  // Back-to-top visibility
  if (backToTop) {
    backToTop.classList.toggle('visible', scrollY > 600);
  }
};

// Throttle scroll events slightly for higher rendering performance
let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      onScrollHandler();
      scrollTicking = false;
    });
    scrollTicking = true;
  }
});

// Run handler on load to initialize correct fills and active states
window.addEventListener('DOMContentLoaded', onScrollHandler);

// Typewriter reveal for the hero name (matches the TypeMachine font)
const typewriterHeroName = () => {
  const heroName = document.querySelector('.hero-name');
  if (!heroName || prefersReducedMotion) return;

  const fullText = heroName.textContent.trim();
  heroName.setAttribute('aria-label', fullText);
  heroName.textContent = '';

  const caret = document.createElement('span');
  caret.className = 'typing-caret';
  caret.setAttribute('aria-hidden', 'true');
  heroName.appendChild(caret);

  let charIndex = 0;
  const typeNext = () => {
    if (charIndex < fullText.length) {
      caret.before(document.createTextNode(fullText[charIndex]));
      charIndex++;
      setTimeout(typeNext, 55 + Math.random() * 50);
    } else {
      setTimeout(() => caret.remove(), 2500);
    }
  };
  setTimeout(typeNext, 1250); // Wait for the preloader curtain to lift
};

// IntersectionObserver: trigger underline draws and staggered list reveals
const setupRevealObserver = () => {
  const revealTargets = document.querySelectorAll('.section-title, .timeline-item, .skills-block');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  revealTargets.forEach(el => observer.observe(el));
};

// Subtle 3D tilt on the hero Polaroid photo following the cursor
const setupPhotoTilt = () => {
  const wrapper = document.querySelector('.hero-photo-wrapper');
  const photo = document.querySelector('.hero-profile-img');
  if (!wrapper || !photo || prefersReducedMotion) return;

  wrapper.addEventListener('mousemove', (e) => {
    const rect = photo.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    photo.style.transform = `rotateY(${relX * 8}deg) rotateX(${relY * -8}deg) scale(1.03)`;
  });

  wrapper.addEventListener('mouseleave', () => {
    photo.style.transform = '';
  });
};

// Cycle the hero tagline through key roles
const setupRotatingTagline = () => {
  const tagline = document.getElementById('rotating-tagline');
  if (!tagline || prefersReducedMotion) return;

  const phrases = [
    'AI Safety & Security Researcher',
    'Responsible AI Lead @ Banco Santander',
    'LLM Red-Teaming & Alignment',
    'NeurIPS 2025 Author'
  ];
  let phraseIndex = 0;

  setInterval(() => {
    tagline.classList.add('is-hidden');
    setTimeout(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      tagline.textContent = phrases[phraseIndex];
      tagline.classList.remove('is-hidden');
    }, 420);
  }, 3600);
};

// Count-up animation for the stats row
const setupStatCounters = () => {
  const values = document.querySelectorAll('.stat-value');
  if (!values.length) return;

  const animateValue = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    if (prefersReducedMotion || !Number.isFinite(target)) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    const duration = 1300;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(eased * target)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    values.forEach(animateValue);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateValue(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  values.forEach(v => observer.observe(v));
};

// Radial spotlight following the cursor inside cards
const setupCardSpotlights = () => {
  if (prefersReducedMotion) return;
  document.querySelectorAll('.pub-card, .grant-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });
};

// Trailing cursor ring (desktop fine pointers only)
const setupCursorRing = () => {
  const ring = document.getElementById('cursor-ring');
  if (!ring || prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let started = false;

  const render = () => {
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  };

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!started) {
      started = true;
      ringX = mouseX;
      ringY = mouseY;
      ring.classList.add('is-active');
      requestAnimationFrame(render);
    }
  });

  const hoverSelector = 'a, button, .progress-step, .pub-card, .grant-card, .talk-item, .timeline-item';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelector)) ring.classList.add('is-hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelector)) ring.classList.remove('is-hovering');
  });

  document.documentElement.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  document.documentElement.addEventListener('mouseenter', () => {
    if (started) ring.classList.add('is-active');
  });
};

window.addEventListener('DOMContentLoaded', () => {
  typewriterHeroName();
  setupRevealObserver();
  setupPhotoTilt();
  setupRotatingTagline();
  setupStatCounters();
  setupCardSpotlights();
  setupCursorRing();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // Preloader is hidden by its own CSS animation; remove it from the DOM afterwards
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.remove();
  }, 1800);
});

