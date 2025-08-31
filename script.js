/**
 * script.js
 * Full site interactive behavior:
 * - loader
 * - theme selector (including optional sun/moon switch)
 * - modal auth (email/password + Google) using Firebase (compat)
 * - profile handling (basic: display UID / email; extend with Firestore if desired)
 * - ranks rendering (flip cards)
 * - leaderboard rendering (tabs)
 * - staff rendering (image fallback)
 * - event countdown (next-month 1st)
 * - copy IP, social open
 * - button hover icon reveal & unified glowing style
 * - sparkle pointer effect variables
 * - section fade-in on scroll
 *
 * Make sure to:
 * - Paste real firebaseConfig values in the firebaseConfig object below.
 * - Provide HTML elements with IDs/classes used here (most checks are tolerant; missing items will not throw).
 */

/* ========= Config / Utilities ========= */
const debug = false;
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const exist = el => !!el;

/* ==== Loader ==== */
function initLoader() {
  const loader = $('#loader') || $('#preloader');
  if (!loader) return;
  // show loader until DOM + assets loaded (window load)
  window.addEventListener('load', () => {
    // tiny delay so user sees it
    setTimeout(() => {
      loader.classList.add('loader--hidden');
      // remove from DOM after animation if desired
      setTimeout(() => loader.remove?.(), 700);
    }, 500);
  });
}

/* ==== Theme selector + optional sun/moon switch ==== */
function initThemeSelector() {
  // Buttons with .theme-btn (data-theme attribute e.g. theme-dark)
  $$('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      if (!theme) return;
      document.body.classList.remove('theme-dark','theme-yellow','theme-blue','theme-day','theme-night');
      document.body.classList.add(theme);
      $$('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // If the fancy input switch exists (the one you provided), wire it up
  const sunMoonInput = $('#input'); // your switch input id in markup
  if (sunMoonInput) {
    // reflect initial state
    applySunMoonTheme(sunMoonInput.checked);
    sunMoonInput.addEventListener('change', (e) => {
      applySunMoonTheme(e.target.checked);
    });
  }

  function applySunMoonTheme(isChecked) {
    // isChecked true => "night" (moon) or depending on your mark-up; adapt easily
    if (isChecked) {
      document.body.classList.remove('theme-day');
      document.body.classList.add('theme-night');
    } else {
      document.body.classList.remove('theme-night');
      document.body.classList.add('theme-day');
    }
  }
}

/* ==== Firebase Auth (compat) + profile UI stub ==== */
// Make sure to include firebase scripts in HTML before this file.
function initFirebaseAuth() {
  if (!window.firebase || !firebase.auth) {
    if (debug) console.warn('Firebase not loaded - auth disabled');
    return;
  }

  // TODO: replace with real config
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (err) {
    console.error('Firebase init error', err);
  }

  const auth = firebase.auth();

  // modal open/close wiring
  const modal = $('#auth-modal');
  const openAuth = $('#open-auth');
  const closeAuth = modal?.querySelector('.close');

  openAuth?.addEventListener('click', (ev) => {
    ev.preventDefault();
    modal && (modal.style.display = 'flex');
  });

  closeAuth?.addEventListener('click', () => {
    modal && (modal.style.display = 'none');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // elements
  const registerBtn = $('#register-btn');
  const loginBtn = $('#login-btn');
  const googleBtn = $('#google-btn');

  // register
  registerBtn?.addEventListener('click', async () => {
    const email = ($('#email')?.value || '').trim();
    const password = ($('#password')?.value || '').trim();
    const ign = ($('#ign')?.value || '').trim();
    if (!email || !password || !ign) {
      return alert('Please fill all fields (IGN, email, password).');
    }
    try {
      const userCred = await auth.createUserWithEmailAndPassword(email, password);
      // Optionally: store IGN and other profile details to Firestore here
      alert('Registration successful! Welcome ' + ign);
      modal.style.display = 'none';
      // optionally show profile UI
      showProfile(userCred.user);
    } catch (err) {
      alert(err.message || 'Registration error');
    }
  });

  // login
  loginBtn?.addEventListener('click', async () => {
    const email = ($('#email')?.value || '').trim();
    const password = ($('#password')?.value || '').trim();
    if (!email || !password) return alert('Fill email & password.');
    try {
      const userCred = await auth.signInWithEmailAndPassword(email, password);
      alert('Login successful!');
      modal.style.display = 'none';
      showProfile(userCred.user);
    } catch (err) {
      alert(err.message || 'Login error');
    }
  });

  // google
  googleBtn?.addEventListener('click', async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      alert('Login with Google successful');
      modal.style.display = 'none';
      showProfile(result.user);
    } catch (err) {
      alert(err.message || 'Google sign-in failed');
    }
  });

  // profile display
  function showProfile(user) {
    if (!user) return;
    // Example: if you have a .profile-area element, populate it
    const profileArea = $('#profile-area');
    if (profileArea) {
      profileArea.innerHTML = `
        <div class="profile-card">
          <img class="profile-avatar" src="${user.photoURL || 'assets/myskin.png'}" alt="avatar" />
          <div class="profile-info">
            <div class="profile-name">${user.displayName || user.email || user.uid}</div>
            <div class="profile-meta">UID: ${user.uid}</div>
            <button id="logout-btn" class="btn btn-primary">Logout</button>
          </div>
        </div>
      `;
      $('#logout-btn')?.addEventListener('click', async () => {
        await auth.signOut();
        profileArea.innerHTML = '';
        alert('Logged out');
      });
    }
  }

  // handle auth state changes (keep profile shown)
  auth.onAuthStateChanged(user => {
    if (user) {
      showProfile(user);
    } else {
      const profileArea = $('#profile-area');
      if (profileArea) profileArea.innerHTML = '';
    }
  });
}

/* ==== Unified button behaviour (hover icons reveal, glow) ==== */
function initButtons() {
  // Apply hover reveal for elements with .btn-icon (icon hidden until hover)
  $$('.btn').forEach(btn => {
    // ensure consistent class
    btn.classList.add('site-btn');
    // if the button should reveal an icon on hover, require structure:
    // <button class="btn"><span class="btn-text">Text</span><span class="btn-icon">ICON SVG</span></button>
    const text = btn.querySelector('.btn-text');
    const icon = btn.querySelector('.btn-icon');
    if (text && icon) {
      // hide icon initially
      icon.style.opacity = 0;
      icon.style.transform = 'translateY(6px)';
      btn.addEventListener('mouseenter', () => {
        icon.style.transition = 'all .25s ease';
        text.style.transition = 'all .25s ease';
        icon.style.opacity = 1;
        icon.style.transform = 'translateY(0)';
        text.style.opacity = 0.95;
      });
      btn.addEventListener('mouseleave', () => {
        icon.style.opacity = 0;
        icon.style.transform = 'translateY(6px)';
        text.style.opacity = 1;
      });
    }
    // unify click visual
    btn.addEventListener('mousedown', ()=> btn.classList.add('btn--active'));
    window.addEventListener('mouseup', ()=> $$('.btn--active').forEach(b=>b.classList.remove('btn--active')));
  });

  // Set up animated glowing border for all buttons (CSS class .glow-btn)
  $$('.glow-btn').forEach(b=>{ /* kept for compatibility, style via CSS */ });
}

/* ==== Copy IP and Social Button ==== */
function initHeaderActions() {
  const copyBtn = $('#copy-ip');
  const ipBox = $('#ip-box');
  copyBtn?.addEventListener('click', async () => {
    const ip = ipBox?.textContent?.trim() || ipBox?.value || '';
    if (!ip) return alert('No IP found to copy.');
    try {
      await navigator.clipboard.writeText(ip);
      // small toast alternative
      showToast('IP copied: ' + ip);
    } catch (err) {
      alert('Copy failed: ' + err?.message);
    }
  });

  // Social button - if you want the fancy card: expects .social-card container in DOM
  // But we also handle a simple button with id 'social-btn' to open socials
  const socialBtn = $('#social-btn') || $('.card');
  if (socialBtn) {
    socialBtn.addEventListener('click', (e) => {
      // if a dedicated social card, do nothing (hover reveals) - otherwise open a popup
      // For simplicity: open a small social menu or new tab (example)
      // Replace with your actual social links
      if (socialBtn.dataset.link) {
        window.open(socialBtn.dataset.link, '_blank');
      } else {
        // open discord/yt/fb menu - for now open discord link as example
        const menu = buildSocialPopup();
        document.body.appendChild(menu);
      }
    });
  }

  function buildSocialPopup(){
    const wrap = document.createElement('div');
    wrap.className = 'social-popup';
    wrap.innerHTML = `
      <div class="social-popup-inner">
        <button class="social-close" aria-label="Close">✕</button>
        <h3>Social</h3>
        <div class="social-list">
          <a href="https://discord.gg/j73cN2MAmU" target="_blank">Discord</a>
          <a href="https://www.youtube.com" target="_blank">YouTube</a>
          <a href="https://facebook.com" target="_blank">Facebook</a>
        </div>
      </div>
    `;
    wrap.querySelector('.social-close').addEventListener('click', ()=> wrap.remove());
    wrap.addEventListener('click', (e)=>{ if (e.target === wrap) wrap.remove(); });
    return wrap;
  }
}

/* ==== Render Ranks (flip cards) ==== */
function initRanks() {
  const RANKS = [
    {name:"ELITE",  ability:"Extra Kit Slot, /nick, /hat", price3:"৫৯৳", priceP:"১৪৯৳"},
    {name:"HERO",   ability:"Double Coins, /fly (lobby), /rename", price3:"১৪৯৳", priceP:"৩৪৯৳"},
    {name:"TITAN",  ability:"Special Commands, /enderchest, kits+", price3:"২৪৯৳", priceP:"৫৯৯৳"},
    {name:"LEGEND", ability:"VIP Lobby, /anvil, /workbench, trails", price3:"৩৯৯৳", priceP:"৮৯৯৳"},
    {name:"PHANTOM",ability:"All Perks, priority queue, /disguise", price3:"৫৯৯৳", priceP:"১৯৯৯৳"}
  ];

  const rankGrid = $('#rank-grid');
  if (!rankGrid) return;

  function makeCard(item, price) {
    const el = document.createElement('div');
    el.className = 'rank-card';
    el.innerHTML = `
      <div class="rank-inner" tabindex="0" aria-label="Rank ${item.name}">
        <div class="rank-face rank-front">
          <div class="rank-title">${item.name}</div>
          <div class="rank-price">${price}</div>
          <div class="rank-ability">Hover to view perks</div>
        </div>
        <div class="rank-face rank-back">
          <div class="rank-title">${item.name}</div>
          <div class="rank-ability">${item.ability}</div>
          <div class="rank-actions">
            <button class="btn btn-primary buy-btn"><span class="btn-text">Buy</span></button>
            <button class="btn btn-secondary cart-btn"><span class="btn-text">Add</span></button>
          </div>
        </div>
      </div>
    `;
    // basic accessibility: allow flip on keyboard Enter/Space
    const inner = el.querySelector('.rank-inner');
    inner.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inner.classList.toggle('flipped');
      }
    });
    return el;
  }

  function render(duration = '3month') {
    rankGrid.innerHTML = '';
    RANKS.forEach(r => {
      const price = (duration === 'permanent') ? r.priceP : r.price3;
      rankGrid.appendChild(makeCard(r, price));
    });
    // attach simple flip-on-hover for cards (CSS handles visual), but ensure no layout shift
    $$('.rank-card .rank-inner').forEach(inner => {
      inner.addEventListener('mouseenter', ()=> inner.classList.add('hover'));
      inner.addEventListener('mouseleave', ()=> inner.classList.remove('hover'));
    });
  }

  // toggle handlers for duration buttons
  $$('.rank-toggle .btn, .rank-toggle .btn-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.rank-toggle .btn, .rank-toggle .btn-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.duration || btn.dataset.value || (btn.textContent.includes('Permanent') ? 'permanent' : '3month'));
    });
  });

  // initial render
  render('3month');
}

/* ==== Leaderboard ==== */
function initLeaderboard() {
  const LB_DATA = {
    overall: [
      {pos:1,name:"PlayerOne",points:15230},
      {pos:2,name:"PlayerTwo",points:14110},
      {pos:3,name:"PlayerThree",points:13380},
      {pos:4,name:"PlayerFour",points:12050},
      {pos:5,name:"PlayerFive",points:11040}
    ],
    weekly: [
      {pos:1,name:"PlayerThree",points:1980},
      {pos:2,name:"PlayerTwo",points:1760},
      {pos:3,name:"PlayerOne",points:1650},
      {pos:4,name:"PlayerSix",points:1205},
      {pos:5,name:"PlayerSeven",points:1110}
    ],
    monthly: [
      {pos:1,name:"PlayerFour",points:5230},
      {pos:2,name:"PlayerFive",points:4980},
      {pos:3,name:"PlayerOne",points:4740},
      {pos:4,name:"PlayerThree",points:4400},
      {pos:5,name:"PlayerTwo",points:4200}
    ]
  };

  const leaderboard = $('#leaderboard');
  if (!leaderboard) return;

  function render(mode='overall') {
    const data = LB_DATA[mode] || [];
    leaderboard.innerHTML = `
      <table class="table" role="table" aria-label="Leaderboard">
        <thead>
          <tr><th>#</th><th>Player</th><th>Points</th></tr>
        </thead>
        <tbody>
          ${data.map(r => `<tr><td class="pos">#${r.pos}</td><td>${r.name}</td><td>${r.points}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  // wire buttons
  $$('.ranking-header .btn-chip, .ranking-header .btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.ranking-header .btn-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.mode || (btn.textContent||'').toLowerCase().trim());
    });
  });

  render('overall');
}

/* ==== Staff rendering (image fallback + layout fixes) ==== */
function initStaff() {
  const STAFF = [
    {name:"Tanber", role:"FOUNDER", ign:"notcooldamn2", discord:"tanber_369", photo:"assets/myskin.png"},
    {name:"Sohrab", role:"CO FOUNDER", ign:"notcooldamn3", discord:"sohrab_369", photo:"skins/sohrab.png"},
    {name:"Ahsan",  role:"Partner", ign:"ryuzen", discord:"monkey._.d._.luffy2", photo:"skins/ahsan.png"},
    {name:"Arfat",  role:"Manager", ign:"onxy", discord:"onyx.plays", photo:"skins/arfat.png"},
    {name:"Asraful",role:"Moderator", ign:"asraful_vai", discord:"asraful_vai", photo:"skins/asraful.png"},
    {name:"Risat",  role:"Senior Staff", ign:"risat", discord:"resath", photo:"skins/risat.png"},
    {name:"Rasel",  role:"Social Manager", ign:"CANDYB0T", discord:"candyb0t", photo:"skins/rasel.png"},
    {name:"Siam",   role:"Social Manager", ign:"siam", discord:"siam45795", photo:"skins/siam.png"},
    {name:"Tanver", role:"Developer", ign:"tenzenx", discord:"tenzenx", photo:"skins/tanver.png"}
  ];

  const adminGrid = $('#admin-grid');
  if (!adminGrid) return;

  adminGrid.innerHTML = '';
  STAFF.forEach(s => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    // robust image element
    const img = document.createElement('img');
    img.className = 'admin-photo';
    img.alt = s.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = s.photo;
    img.onerror = () => { img.src = 'skins/placeholder.png'; };

    card.appendChild(img);

    const nameEl = document.createElement('div');
    nameEl.className = 'admin-name';
    nameEl.textContent = s.name;
    card.appendChild(nameEl);

    const roleEl = document.createElement('div');
    roleEl.className = 'admin-role';
    roleEl.textContent = s.role;
    card.appendChild(roleEl);

    const ignEl = document.createElement('div');
    ignEl.className = 'admin-meta';
    ignEl.textContent = 'IGN: ' + s.ign;
    card.appendChild(ignEl);

    const discEl = document.createElement('div');
    discEl.className = 'admin-meta';
    discEl.textContent = 'Discord: ' + s.discord;
    card.appendChild(discEl);

    adminGrid.appendChild(card);
  });
}

/* ==== Event Countdown ==== */
function initCountdown() {
  const eventTimer = $('#event-timer');
  if (!eventTimer) return;

  function tick(){
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth()+1, 1, 0, 0, 0); // next month 1st
    const diff = target - now;
    if (diff <= 0) {
      eventTimer.textContent = 'Event is live!';
      return;
    }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    eventTimer.textContent = `Next Event in ${d}d ${h}h ${m}m ${s}s`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ==== Sparkle pointer (for css variable origin) ==== */
function initSparklePointer() {
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.body.style.setProperty('--mx', x + '%');
    document.body.style.setProperty('--my', y + '%');
  });
}

/* ==== Section reveal on scroll (IntersectionObserver) ==== */
function initSectionReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold: 0.12 });

  $$('.section, .card, .rank-card, .admin-card, .home-card').forEach(el => observer.observe(el));
}

/* ==== Toast helper ==== */
function showToast(msg, ms = 2200) {
  let t = $('#site-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'site-toast';
    t.style.position = 'fixed';
    t.style.right = '18px';
    t.style.bottom = '18px';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '10px';
    t.style.background = 'rgba(0,0,0,0.85)';
    t.style.color = '#fff';
    t.style.zIndex = '9999';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(()=> t.style.opacity = '0', ms);
}

/* ==== Smooth anchor scroll for navbar links ==== */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      ev.preventDefault();
      const rectTop = target.getBoundingClientRect().top + window.scrollY - 78; // header offset
      window.scrollTo({ top: rectTop, behavior: 'smooth' });
    });
  });
}

/* ==== Initialize everything gracefully ==== */
function initAll() {
  try {
    initLoader();
    initThemeSelector();
    initFirebaseAuth();
    initButtons();
    initHeaderActions();
    initRanks();
    initLeaderboard();
    initStaff();
    initCountdown();
    initSparklePointer();
    initSectionReveal();
    initSmoothScroll();
  } catch (err) {
    console.error('Initialization error', err);
  }
}

/* ==== Run on DOM ready ==== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
