/* =========================================================
   PersiCore — Aurora Glass / Light Mode
   ========================================================= */

(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasHover = window.matchMedia('(hover: hover)').matches;

    /* ---------- Page loader ---------- */
    const hideLoader = () => {
        const body = document.body;
        if (!body.classList.contains('is-loading')) return;
        body.classList.remove('is-loading');
        body.classList.add('is-loaded');
        const loader = document.getElementById('loader');
        if (loader) {
            // Remove from DOM after the fade-out so it doesn't intercept events
            setTimeout(() => loader.remove(), 800);
        }
    };
    const minLoaderTime = prefersReducedMotion ? 0 : 600;
    const loaderStart = performance.now();
    const tryHideLoader = () => {
        const elapsed = performance.now() - loaderStart;
        const wait = Math.max(0, minLoaderTime - elapsed);
        setTimeout(hideLoader, wait);
    };
    if (document.readyState === 'complete') {
        tryHideLoader();
    } else {
        window.addEventListener('load', tryHideLoader, { once: true });
        // Safety net: if `load` never fires (e.g. blocked resource), hide after 4s
        setTimeout(hideLoader, 4000);
    }

    /* ---------- Theme controller (with smooth transition) ---------- */
    const THEME_KEY = 'persicore-theme';
    const root = document.documentElement;

    const getInitialTheme = () => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (theme, animate = false) => {
        if (animate && !prefersReducedMotion) {
            root.style.setProperty('--theme-fade', '450ms');
            document.body.classList.add('theme-switching');
            // Use View Transitions API where available for a buttery cross-fade
            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    root.setAttribute('data-theme', theme);
                });
            } else {
                root.setAttribute('data-theme', theme);
            }
            setTimeout(() => {
                document.body.classList.remove('theme-switching');
                root.style.setProperty('--theme-fade', '0ms');
            }, 500);
        } else {
            root.setAttribute('data-theme', theme);
        }
    };

    applyTheme(getInitialTheme());

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = root.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_KEY, next);
            applyTheme(next, true);
        });
    }

    /* ---------- Cursor tracking on glass cards (spotlight) ---------- */
    if (hasHover && !prefersReducedMotion) {
        const trackedCards = document.querySelectorAll('.glass');
        trackedCards.forEach(card => {
            card.addEventListener('pointermove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mx', `${x}%`);
                card.style.setProperty('--my', `${y}%`);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--mx', '50%');
                card.style.setProperty('--my', '50%');
            });
        });
    }

    /* ---------- Magnetic hover on primary buttons ---------- */
    if (hasHover && !prefersReducedMotion) {
        const magnets = document.querySelectorAll('.btn-primary, .contact-btn-primary');
        magnets.forEach(el => {
            const strength = 0.25;
            el.addEventListener('pointermove', (e) => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) * strength;
                const dy = (e.clientY - cy) * strength;
                el.style.transform = `translate(${dx}px, ${dy - 2}px)`;
            });
            el.addEventListener('pointerleave', () => {
                el.style.transform = '';
            });
        });
    }

    /* ---------- Smooth scroll for in-page links ---------- */
    const scrollTo = (selector) => {
        const target = document.querySelector(selector);
        if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    };

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id && id.length > 1 && document.querySelector(id)) {
                e.preventDefault();
                scrollTo(id);
            }
        });
    });

    document.querySelectorAll('[data-scroll-to]').forEach(btn => {
        btn.addEventListener('click', () => scrollTo(btn.dataset.scrollTo));
    });

    /* ---------- Sticky navbar tone shift ---------- */
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const onScroll = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 24);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------- Aurora parallax on scroll ----------
       Light parallax — moves blobs slightly with scroll for depth.
       Skipped under prefers-reduced-motion. */
    if (!prefersReducedMotion) {
        const blobs = document.querySelectorAll('.aurora-blob');
        let lastY = 0;
        let ticking = false;

        const updateAurora = () => {
            const y = lastY;
            blobs.forEach((blob, i) => {
                const factor = (i + 1) * 0.04;
                blob.style.translate = `0 ${y * factor * -1}px`;
            });
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            lastY = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(updateAurora);
                ticking = true;
            }
        }, { passive: true });
    }

    /* ---------- Hero visual mouse parallax (tilt) ---------- */
    const heroVisual = document.getElementById('heroVisual');
    if (heroVisual && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
        const maxTilt = 5; // degrees
        let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
        let rafId = null;

        const onMove = (e) => {
            const rect = heroVisual.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            targetX = Math.max(-1, Math.min(1, dx)) * maxTilt;
            targetY = Math.max(-1, Math.min(1, dy)) * maxTilt;
            if (!rafId) rafId = requestAnimationFrame(tick);
        };

        const tick = () => {
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;
            heroVisual.style.transform = `perspective(1200px) rotateY(${currentX}deg) rotateX(${-currentY}deg)`;
            if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
                rafId = requestAnimationFrame(tick);
            } else {
                rafId = null;
            }
        };

        const onLeave = () => {
            targetX = 0;
            targetY = 0;
            if (!rafId) rafId = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) onLeave(); });
    }

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry, idx) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        revealEls.forEach((el, i) => {
            // Slight stagger when many siblings reveal at once
            const parent = el.parentElement;
            if (parent) {
                const idx = Array.from(parent.children).indexOf(el);
                el.style.transitionDelay = `${Math.min(idx, 6) * 60}ms`;
            }
            io.observe(el);
        });
    } else {
        revealEls.forEach(el => el.classList.add('in'));
    }

    /* ---------- Content AI section ---------- */
    const caiTypedEl  = document.getElementById('caiTyped');
    const caiSeoNumEl = document.getElementById('caiSeoNum');
    const caiSection  = document.getElementById('bot');

    const CAI_TEXTS = [
        '✨ راهنمای کامل بازاریابی اینستاگرام\n\nآیا می‌دانستید بیش از ۳۵ میلیون ایرانی در اینستاگرام فعال هستند؟ برای رشد صفحه کسب‌وکارتان این نکات را از دست ندهید:\n\n📌 ۳ استراتژی اثبات‌شده:\n• محتوای ارزشمند و آموزشی منتشر کنید\n• زمان‌بندی پست‌ها را بهینه کنید\n• با مخاطبان خود تعامل داشته باشید\n\n#بازاریابی_دیجیتال #اینستاگرام #کسب_و_کار',
        '📊 سئو در ۲۰۲۵: راهنمای کامل\n\nموتورهای جستجو هر روز هوشمندتر می‌شوند. جدیدترین تکنیک‌های سئو را بررسی می‌کنیم.\n\n🎯 مهم‌ترین فاکتورهای رتبه‌بندی:\n\n۱. تجربه کاربری (Core Web Vitals)\n۲. محتوای E-E-A-T با تخصص و اعتبار\n۳. بهینه‌سازی برای جستجوی صوتی\n\nبا رعایت این نکات، رتبه سایت شما به طرز چشمگیری بهبود می‌یابد.',
        '📧 ایمیل مارکتینگ حرفه‌ای\n\nموضوع: فرصت ویژه‌ای که نمی‌توانید از دست بدهید!\n\nسلام،\n\nمی‌دانستید نرخ بازگشت سرمایه ایمیل مارکتینگ تا ۴۲۰٪ است؟\n\nبا پلتفرم محتواساز پرسیکور:\n✅ محتوای شخصی‌سازی‌شده تولید کنید\n✅ نرخ تبدیل را افزایش دهید\n✅ با AI در ثانیه‌ها محتوا بسازید\n\nهمین الان شروع کنید ›',
    ];

    const CAI_SEO_TARGETS = [87, 82, 91];
    let caiIdx     = 0;
    let caiChar    = 0;
    let caiActive  = false;
    let caiTimer   = null;
    let caiSeoAnim = null;
    let caiSeoVal  = 0;

    const toPersian = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

    function caiAnimateSeo(target) {
        clearInterval(caiSeoAnim);
        caiSeoVal = 0;
        caiSeoAnim = setInterval(() => {
            if (caiSeoVal < target) {
                caiSeoVal++;
                if (caiSeoNumEl) caiSeoNumEl.textContent = toPersian(caiSeoVal);
            } else {
                clearInterval(caiSeoAnim);
            }
        }, 18);
    }

    function caiType() {
        const text = CAI_TEXTS[caiIdx];
        if (caiChar <= text.length) {
            if (caiTypedEl) caiTypedEl.textContent = text.slice(0, caiChar);
            caiChar++;
            const delay = caiChar < 25 ? 45 : 20;
            caiTimer = setTimeout(caiType, delay);
        } else {
            caiTimer = setTimeout(() => {
                if (!caiActive) return;
                caiChar = 0;
                caiIdx  = (caiIdx + 1) % CAI_TEXTS.length;
                if (caiTypedEl) caiTypedEl.textContent = '';
                if (caiSeoNumEl) caiSeoNumEl.textContent = '۰';
                caiAnimateSeo(CAI_SEO_TARGETS[caiIdx]);
                caiType();
            }, 4500);
        }
    }

    function caiStart() {
        if (caiActive || prefersReducedMotion) return;
        caiActive = true;
        if (caiSection) caiSection.classList.add('cai-visible');
        caiType();
        caiAnimateSeo(CAI_SEO_TARGETS[caiIdx]);
    }

    function caiStop() {
        caiActive = false;
        clearTimeout(caiTimer);
        clearInterval(caiSeoAnim);
    }

    if (caiSection && 'IntersectionObserver' in window) {
        const caiIO = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) caiStart();
                else caiStop();
            });
        }, { threshold: 0.18 });
        caiIO.observe(caiSection);
    } else {
        caiStart();
    }
    /* ---------- CRM Tab switching ---------- */
    const crmTabs = document.querySelectorAll('.crm-tab');
    const crmPanels = document.querySelectorAll('.crm-panel');
    crmTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            crmTabs.forEach(t => { t.classList.remove('crm-tab-active'); t.setAttribute('aria-selected', 'false'); });
            crmPanels.forEach(p => { p.hidden = true; });
            tab.classList.add('crm-tab-active');
            tab.setAttribute('aria-selected', 'true');
            const panel = document.querySelector(`.crm-panel[data-panel="${tab.dataset.tab}"]`);
            if (panel) panel.hidden = false;
        });
    });

    /* ---------- Keyboard navigation ---------- */
    const navMap = {
        '1': '#hero',
        '2': '#about',
        '3': '#bot',
        '4': '#pricing',
        '5': '#technologies',
        '6': '#marketing',
        '7': '#contact'
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            return;
        }
        if (e.ctrlKey && navMap[e.key]) {
            e.preventDefault();
            scrollTo(navMap[e.key]);
        }
    });

    /* ---------- Footer newsletter (placeholder) ---------- */
    document.querySelectorAll('.footer-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            if (!input || !input.value) return;
            const btn = form.querySelector('button');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = '✓ ثبت شد';
                btn.disabled = true;
                input.value = '';
                setTimeout(() => {
                    btn.textContent = orig;
                    btn.disabled = false;
                }, 2400);
            }
        });
    });

    /* ---------- Lazy image observer (kept for forward-compat) ---------- */
    if ('IntersectionObserver' in window) {
        const imgIO = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    obs.unobserve(img);
                }
            });
        });
        document.querySelectorAll('img[data-src]').forEach(img => imgIO.observe(img));
    }

})();
