/* script.js - robust front-end JS
   - localStorage fallback auth (so login/register works immediately for testing)
   - optional Firebase if you paste config below
   - renders ranks, staff, leaderboard
   - loader hide logic with safe fallback
*/

/* ============ CONFIG ============ */
/* If you want Firebase auth & Firestore, paste config here (replace placeholders). Otherwise leave as-is to use local fallback. */
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

/* helper to detect if user replaced the placeholders */
const useFirebase = Boolean(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY");

if (useFirebase) {
  try { firebase.initializeApp(FIREBASE_CONFIG); console.log('Firebase initialized'); }
  catch (e) { console.warn('Firebase init failed, using local fallback', e); }
}

/* ============ DOM Helpers ============ */
function $ (s) { return document.querySelector(s); }
function $$ (s) { return Array.from(document.querySelectorAll(s)); }

/* Loader safe hide */
const loaderEl = document.getElementById('page-loader');
function hideLoader() {
  if (!loaderEl) return;
  loaderEl.style.transition = 'opacity .45s ease';
  loaderEl.style.opacity = '0';
  loaderEl.style.pointerEvents = 'none';
  setTimeout(()=> { try { loaderEl.remove(); } catch(e){ loaderEl.style.display='none'; } }, 500);
}
window.addEventListener('load', ()=> setTimeout(hideLoader, 300));
setTimeout(()=> hideLoader(), 6000); // fallback

/* Mouse position for button glow origin (used by CSS via --mx/--my) */
document.addEventListener('mousemove', (e)=>{
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  document.documentElement.style.setProperty('--mx', x + '%');
  document.documentElement.style.setProperty('--my', y + '%');
});

/* ============ Data (unchanged content) ============ */
const RANKS = [
  {name:"ELITE",  ability:"Extra Kit Slot, /nick, /hat",                 price3:"৫৯৳",  priceP:"১৪৯৳"},
  {name:"HERO",   ability:"Double Coins, /fly (lobby), /rename",         price3:"১৪৯৳", priceP:"৩৪৯৳"},
  {name:"TITAN",  ability:"Special Commands, /enderchest, kits+",        price3:"২৪৯৳", priceP:"৫৯৯৳"},
  {name:"LEGEND", ability:"VIP Lobby, /anvil, /workbench, trails",       price3:"৩৯৯৳", priceP:"৮৯৯৳"},
  {name:"PHANTOM",ability:"All Perks, priority queue, /disguise",        price3:"৫৯৯৳", priceP:"১৯৯৯৳"}
];

const STAFF = [
  {name:"Tanber",  role:"FOUNDER",        ign:"notcooldamn2", discord:"tanber_369",  photo:"assets/myskin.png"},
  {name:"Sohrab",  role:"CO FOUNDER",     ign:"notcooldamn3", discord:"sohrab_369",  photo:"assets/sohrab.png"},
  {name:"Ahsan",   role:"Partner",        ign:"ryuzen",       discord:"monkey._.d._.luffy2", photo:"assets/ahsan.png"},
  {name:"Arfat",   role:"Manager",        ign:"onxy",         discord:"onyx.plays",  photo:"assets/arfat.png"},
  {name:"Asraful", role:"Moderator",      ign:"asraful_vai",  discord:"asraful_vai", photo:"assets/asraful.png"},
  {name:"Risat",   role:"Senior Staff",   ign:"risat",        discord:"resath",      photo:"assets/risat.png"},
  {name:"Rasel",   role:"Social Manager", ign:"CANDYB0T",     discord:"candyb0t",    photo:"assets/rasel.png"},
  {name:"Siam",    role:"Social Manager", ign:"siam",         discord:"siam45795",   photo:"assets/siam.png"},
  {name:"Tanver",  role:"Developer",      ign:"tenzenx",      discord:"tenzenx",     photo:"assets/tanver.png"},
];

const LB_DATA = {
  overall:[{pos:1,name:"PlayerOne",points:15230},{pos:2,name:"PlayerTwo",points:14110},{pos:3,name:"PlayerThree",points:13380},{pos:4,name:"PlayerFour",points:12050},{pos:5,name:"PlayerFive",points:11040}],
  weekly:[{pos:1,name:"PlayerThree",points:1980},{pos:2,name:"PlayerTwo",points:1760},{pos:3,name:"PlayerOne",points:1650},{pos:4,name:"PlayerSix",points:1205},{pos:5,name:"PlayerSeven",points:1110}],
  monthly:[{pos:1,name:"PlayerFour",points:5230},{pos:2,name:"PlayerFive",points:4980},{pos:3,name:"PlayerOne",points:4740},{pos:4,name:"PlayerThree",points:4400},{pos:5,name:"PlayerTwo",points:4200}]
};

/* ============ Render helpers ============ */
function escapeHtml(s){ if (s==null) return ''; return String(s).replace(/[&<>"'`=\/]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;",'/':'&#x2F;','`':'&#x60;','=':'&#x3D;'})[c]); }

function renderRanks(duration='3month'){
  const grid = document.getElementById('rank-grid');
  if (!grid) return;
  grid.innerHTML = '';
  RANKS.forEach(r=>{
    const price = (duration==='permanent')? r.priceP : r.price3;
    const card = document.createElement('div'); card.className='rank-card';
    card.innerHTML = `<div class="rank-inner">
      <div class="rank-face rank-front">
        <div class="rank-title">${escapeHtml(r.name)}</div>
        <div class="rank-price">${escapeHtml(price)}</div>
        <div class="rank-ability">Hover to flip for perks</div>
      </div>
      <div class="rank-face rank-back">
        <div class="rank-title">${escapeHtml(r.name)}</div>
        <div class="rank-ability">${escapeHtml(r.ability)}</div>
        <div class="rank-actions">
          <button class="btn btn-primary btn-glow buy-now">Buy Now</button>
          <button class="btn secondary add-cart">Add to Cart</button>
        </div>
      </div>
    </div>`;
    grid.appendChild(card);
  });
  // wire buy buttons (they may appear later)
  setTimeout(()=> {
    document.querySelectorAll('.buy-now').forEach(b=>{
      b.removeEventListener('click', onBuyClick);
      b.addEventListener('click', onBuyClick);
    });
    document.querySelectorAll('.add-cart').forEach(b=>{
      b.removeEventListener('click', onAddCart);
      b.addEventListener('click', onAddCart);
    });
  },50);
}

/* ---- staff render ---- */
function renderStaff(){
  const grid = document.getElementById('admin-grid');
  if (!grid) return;
  grid.innerHTML='';
  STAFF.forEach(s=>{
    const div = document.createElement('div'); div.className='admin-card';
    div.innerHTML = `<img class="admin-photo" src="${escapeHtml(s.photo)}" alt="${escapeHtml(s.name)}" onerror="this.src='assets/placeholder.png'">
      <div class="admin-name">${escapeHtml(s.name)}</div>
      <div class="admin-role">${escapeHtml(s.role)}</div>
      <div class="admin-meta">IGN: ${escapeHtml(s.ign)}</div>
      <div class="admin-meta">Discord: ${escapeHtml(s.discord)}</div>`;
    grid.appendChild(div);
  });
}

/* ---- leaderboard render ---- */
function renderLeaderboard(mode='overall'){
  const wrap = document.getElementById('leaderboard-wrap');
  if (!wrap) return;
  const data = LB_DATA[mode] || [];
  wrap.innerHTML = `<table class="table"><thead><tr><th>#</th><th>Player</th><th>Points</th></tr></thead><tbody>${
    data.map(r=>`<tr><td>#${r.pos}</td><td>${escapeHtml(r.name)}</td><td>${r.points}</td></tr>`).join('')
  }</tbody></table>`;
}

/* ============ Auth (local fallback) ============ */
const AUTH_KEY_USERS = 'hcn_users_v1';
const AUTH_KEY_CURRENT = 'hcn_current_v1';

function getLocalUsers(){ try{ return JSON.parse(localStorage.getItem(AUTH_KEY_USERS)||'[]'); }catch(e){ return []; } }
function saveLocalUsers(u){ localStorage.setItem(AUTH_KEY_USERS, JSON.stringify(u)); }
function setCurrent(u){ localStorage.setItem(AUTH_KEY_CURRENT, JSON.stringify(u)); }
function getCurrent(){ try { return JSON.parse(localStorage.getItem(AUTH_KEY_CURRENT)); } catch(e){ return null; } }
function clearCurrent(){ localStorage.removeItem(AUTH_KEY_CURRENT); }

function registerLocal(ign, pwd){
  const users = getLocalUsers();
  if (users.find(x=>x.ign===ign)) return {ok:false, msg:'Username exists'};
  const user = {uid:'local_'+Date.now(), ign, password:pwd, credits:50, photo:'assets/myskin.png'};
  users.push(user); saveLocalUsers(users); setCurrent(user);
  return {ok:true,user};
}
function loginLocal(ign, pwd){
  const users = getLocalUsers();
  const found = users.find(u=> (u.ign===ign || u.email===ign) && u.password===pwd );
  if (!found) return {ok:false, msg:'Invalid credentials'};
  setCurrent(found); return {ok:true,user:found};
}

/* ============ UI Wiring ============ */
function wireUI(){
  // open auth
  const openAuth = document.getElementById('open-auth');
  const authModal = document.getElementById('auth-modal');
  const authClose = document.getElementById('auth-close');
  const authForm = document.getElementById('auth-form');
  const inputUser = document.getElementById('auth-username');
  const inputPass = document.getElementById('auth-password');
  const btnLogin = document.getElementById('btn-login');
  const btnRegister = document.getElementById('btn-register');
  const btnGoogle = document.getElementById('btn-google');
  const btnForgot = document.getElementById('btn-forgot');

  openAuth && openAuth.addEventListener('click', (e)=>{
    e.preventDefault(); authModal.style.display='flex'; authModal.setAttribute('aria-hidden','false'); inputUser && inputUser.focus();
  });
  authClose && authClose.addEventListener('click', ()=>{ authModal.style.display='none'; authModal.setAttribute('aria-hidden','true'); });
  window.addEventListener('click', (e)=>{ if (e.target===authModal) { authModal.style.display='none'; authModal.setAttribute('aria-hidden','true'); } });

  btnLogin && btnLogin.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const ign = inputUser.value.trim(), pwd = inputPass.value.trim();
    if (!ign || !pwd) return alert('Fill username & password');
    if (useFirebase){
      try {
        const res = await firebase.auth().signInWithEmailAndPassword(ign, pwd);
        const user = {uid:res.user.uid, ign: ign, email: res.user.email, credits:0, photo:'assets/myskin.png'};
        onLogin(user);
      } catch (err) { alert(err.message || 'Firebase login failed'); }
    } else {
      const res = loginLocal(ign,pwd);
      if (!res.ok) return alert(res.msg);
      onLogin(res.user);
    }
  });

  btnRegister && btnRegister.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const ign = inputUser.value.trim(), pwd = inputPass.value.trim();
    if (!ign || !pwd) return alert('Fill username & password');
    if (useFirebase){
      try {
        const email = ign.includes('@')?ign: `${ign}@example.com`;
        const res = await firebase.auth().createUserWithEmailAndPassword(email, pwd);
        const user = {uid:res.user.uid, ign:ign, email, credits:0, photo:'assets/myskin.png'};
        onLogin(user);
      } catch (err) { alert(err.message || 'Firebase register failed'); }
    } else {
      const res = registerLocal(ign,pwd);
      if (!res.ok) return alert(res.msg);
      onLogin(res.user);
    }
  });

  btnGoogle && btnGoogle.addEventListener('click', async ()=>{
    if (!useFirebase) return alert('Firebase not configured. Paste config in script.js to enable Google login.');
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const res = await firebase.auth().signInWithPopup(provider);
      onLogin({uid:res.user.uid, ign:res.user.displayName||res.user.email, email:res.user.email, photo: res.user.photoURL});
    } catch (err) { alert(err.message || 'Google login failed'); }
  });

  btnForgot && btnForgot.addEventListener('click',(e)=>{e.preventDefault();alert('Forgot password flow is not configured. Use Firebase to enable reset.')});

  // copy ip
  const copyBtn = document.getElementById('copy-ip');
  copyBtn && copyBtn.addEventListener('click', ()=>{
    const ip = document.getElementById('ip-box').textContent.trim();
    navigator.clipboard.writeText(ip).then(()=> alert('IP Copied: ' + ip)).catch(()=> alert('Copy failed'));
  });

  // rank toggle
  document.querySelectorAll('.rank-toggle .btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.rank-toggle .btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
      renderRanks(b.dataset.duration || '3month');
    });
  });

  // leaderboard header
  document.querySelectorAll('.ranking-header .btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.ranking-header .btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
      renderLeaderboard(b.dataset.mode || 'overall');
    });
  });

  // profile logout
  const profileLogout = document.getElementById('profile-logout');
  profileLogout && profileLogout.addEventListener('click', ()=>{
    clearCurrent(); updateProfileUI(null);
    alert('Logged out');
  });

  // buy/add actions delegated
  document.body.addEventListener('click', (ev)=>{
    if (ev.target.matches('.buy-now')) onBuyClick(ev);
    if (ev.target.matches('.add-cart')) onAddCart(ev);
  });
}

/* ============ buy / cart handlers ============ */
function onBuyClick(ev){
  ev.preventDefault();
  const user = getCurrent();
  if (!user) { alert('You must login to buy.'); return; }
  alert('Buy flow not implemented. Demo: you have ' + (user.credits || 0) + ' credits.');
}
function onAddCart(ev){
  ev.preventDefault(); alert('Added to cart (demo)');
}

/* ============ onLogin actions ============ */
function getCurrent(){ try{ return JSON.parse(localStorage.getItem(AUTH_KEY_CURRENT)); }catch(e){return null} }
function onLogin(user){
  localStorage.setItem(AUTH_KEY_CURRENT, JSON.stringify(user));
  // close modal
  const authModal = document.getElementById('auth-modal');
  if (authModal) { authModal.style.display='none'; authModal.setAttribute('aria-hidden','true'); }
  updateProfileUI(user);
  alert('Welcome, ' + (user.ign || user.email || 'Player') );
}
function updateProfileUI(user){
  const panel = document.getElementById('profile-panel');
  if (!panel) return;
  if (!user){
    panel.classList.add('hidden');
    return;
  }
  document.getElementById('profile-name').textContent = user.ign || user.email || 'Player';
  document.getElementById('profile-credits').textContent = 'Credits: ' + (user.credits || 0);
  const av = document.getElementById('profile-avatar'); if (av) av.src = user.photo || 'assets/myskin.png';
  panel.classList.remove('hidden');
}

/* ============ Event countdown ============ */
function tick(){
  const el = document.getElementById('event-timer');
  if (!el) return;
  const now = new Date(); const target = new Date(now.getFullYear(), now.getMonth()+1, 1);
  const diff = target - now;
  if (diff <= 0){ el.textContent = 'Event is live!'; return; }
  const d = Math.floor(diff / (1000*60*60*24));
  const h = Math.floor((diff / (1000*60*60)) % 24);
  const m = Math.floor((diff / (1000*60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  el.textContent = `Next Event in ${d}d ${h}h ${m}m ${s}s`;
}

/* ============ boot ============ */
document.addEventListener('DOMContentLoaded', ()=>{
  try {
    // initial renders
    renderRanks('3month');
    renderStaff();
    renderLeaderboard('overall');
    wireUI();
    // rehydrate session
    const cur = getCurrent();
    if (cur) updateProfileUI(cur);
    tick(); setInterval(tick,1000);
  } catch (e){
    console.error('Init error', e);
  } finally {
    // ensure loader hidden after DOM init (if not already)
    setTimeout(()=> {
      const loader = document.getElementById('page-loader');
      if (loader) { loader.style.opacity='0'; setTimeout(()=> loader.remove(), 300); }
    }, 800);
  }
});
