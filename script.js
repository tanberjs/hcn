// Main script for HCN page
// Put your real Firebase config below to enable auth/firestore functionality.

document.addEventListener("DOMContentLoaded", () => {
  // Hide loader after content is ready with fallback
  const loader = document.getElementById("loader");
  const hideLoader = () => { loader.classList.add("loader--hidden"); loader.setAttribute('aria-hidden','true'); };
  // hide quickly once DOM loaded
  setTimeout(hideLoader, 600);
  // fallback to ensure hidden if something delays
  setTimeout(hideLoader, 3500);

  // copy IP
  document.getElementById("copy-ip")?.addEventListener("click", async () => {
    const ip = document.getElementById("ip-box").textContent.trim();
    try {
      await navigator.clipboard.writeText(ip);
      alert("IP Copied: " + ip);
    } catch (e) {
      console.warn("Clipboard failed, fallback", e);
      prompt("Copy IP:", ip);
    }
  });

  // Modal open/close
  const modal = document.getElementById("auth-modal");
  const openAuth = document.getElementById("open-auth");
  const closeBtn = modal.querySelector(".close");
  openAuth?.addEventListener("click", (e) => {
    e.preventDefault();
    modal.setAttribute("aria-hidden","false");
  });
  closeBtn?.addEventListener("click", ()=> modal.setAttribute("aria-hidden","true"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.setAttribute("aria-hidden","true"); });

  // Firebase init (PLACEHOLDER) - paste your config here for auth to work
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  // Only initialize if not already (avoids errors when reloading)
  if (!window.firebase.apps || window.firebase.apps.length === 0) {
    try { firebase.initializeApp(firebaseConfig); } catch (err) { console.warn("Firebase init failed (placeholder).", err); }
  }
  const auth = firebase.auth ? firebase.auth() : null;

  // Register / Login (very basic client-side)
  document.getElementById("register-btn")?.addEventListener("click", async () => {
    if (!auth) { alert("Firebase not configured. Paste firebaseConfig in script.js to enable auth."); return; }
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const ign = document.getElementById("ign").value.trim();
    if (!email || !password || !ign) { alert("Fill all fields!"); return; }
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      alert("Registered! Welcome " + ign);
      modal.setAttribute("aria-hidden","true");
      renderProfile(auth.currentUser);
    } catch (err) { alert(err.message); }
  });

  document.getElementById("login-btn")?.addEventListener("click", async () => {
    if (!auth) { alert("Firebase not configured."); return; }
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) { alert("Fill email & password!"); return; }
    try {
      await auth.signInWithEmailAndPassword(email, password);
      alert("Login Successful!");
      modal.setAttribute("aria-hidden","true");
      renderProfile(auth.currentUser);
    } catch (err) { alert(err.message); }
  });

  document.getElementById("google-btn")?.addEventListener("click", async () => {
    if (!auth) { alert("Firebase not configured."); return; }
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      alert("Login with Google Successful");
      modal.setAttribute("aria-hidden","true");
      renderProfile(auth.currentUser);
    } catch (err) { alert(err.message); }
  });

  // Logout
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    if (!auth) { alert("Firebase not configured."); return; }
    try { await auth.signOut(); alert("Logged out"); hideProfile(); } catch(e){ console.warn(e) }
  });

  // If firebase has onAuthStateChanged, wire profile
  if (auth && auth.onAuthStateChanged) {
    auth.onAuthStateChanged(user => { if (user) renderProfile(user); else hideProfile(); });
  }

  // Simple profile render
  function renderProfile(user) {
    if (!user) return;
    const panel = document.getElementById("profile-panel");
    document.getElementById("profile-name").textContent = user.displayName || user.email || "Player";
    // avatar: use provided placeholder asset (you can change)
    const avatar = document.getElementById("profile-avatar");
    avatar.src = "assets/myskin.png";
    panel.classList.add("active");
  }
  function hideProfile() {
    const panel = document.getElementById("profile-panel");
    document.getElementById("profile-name").textContent = "Guest";
    panel.classList.remove("active");
  }

  // Theme buttons kept minimal (we use dark blue theme by default)
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.body.classList.remove("theme-dark","theme-yellow","theme-blue");
      document.body.classList.add(btn.dataset.theme);
      document.querySelectorAll(".theme-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // RANKS data (unchanged) - keep these exact as requested
  const RANKS = [
    {name:"ELITE", ability:"Extra Kit Slot, /nick, /hat", price3:"৫৯৳", priceP:"১৪৯৳"},
    {name:"HERO", ability:"Double Coins, /fly (lobby), /rename", price3:"১৪৯৳", priceP:"৩৪৯৳"},
    {name:"TITAN", ability:"Special Commands, /enderchest, kits+", price3:"২৪৯৳", priceP:"৫৯৯৳"},
    {name:"LEGEND", ability:"VIP Lobby, /anvil, /workbench, trails", price3:"৩৯৯৳", priceP:"৮৯৯৳"},
    {name:"PHANTOM", ability:"All Perks, priority queue, /disguise", price3:"৫৯৯৳", priceP:"১৯৯৯৳"}
  ];

  const rankGrid = document.getElementById("rank-grid");
  function makeRankCard(item, priceText){
    const wrap = document.createElement("div");
    wrap.className = "rank-card";
    wrap.innerHTML = `
      <div class="rank-inner">
        <div class="rank-face rank-front">
          <div class="rank-title">${item.name}</div>
          <div class="rank-price">${priceText}</div>
          <div class="rank-ability">Hover to view perks</div>
        </div>
        <div class="rank-face rank-back">
          <div class="rank-title">${item.name}</div>
          <div class="rank-ability">${item.ability}</div>
          <div class="rank-actions">
            <button class="btn primary">Buy Now</button>
            <button class="btn">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
    return wrap;
  }
  function renderRanks(duration="3month"){
    rankGrid.innerHTML = "";
    RANKS.forEach(r => {
      const price = (duration === "permanent") ? r.priceP : r.price3;
      rankGrid.appendChild(makeRankCard(r, price));
    });
  }
  // rank toggle buttons
  document.querySelectorAll(".rank-toggle .btn").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      document.querySelectorAll(".rank-toggle .btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      renderRanks(btn.dataset.duration);
    });
  });
  renderRanks("3month");

  // Leaderboard data & render
  const LB_DATA = {
    overall:[
      {pos:1,name:"PlayerOne",points:15230},
      {pos:2,name:"PlayerTwo",points:14110},
      {pos:3,name:"PlayerThree",points:13380},
      {pos:4,name:"PlayerFour",points:12050},
      {pos:5,name:"PlayerFive",points:11040}
    ],
    weekly:[
      {pos:1,name:"PlayerThree",points:1980},
      {pos:2,name:"PlayerTwo",points:1760},
      {pos:3,name:"PlayerOne",points:1650},
      {pos:4,name:"PlayerSix",points:1205},
      {pos:5,name:"PlayerSeven",points:1110}
    ],
    monthly:[
      {pos:1,name:"PlayerFour",points:5230},
      {pos:2,name:"PlayerFive",points:4980},
      {pos:3,name:"PlayerOne",points:4740},
      {pos:4,name:"PlayerThree",points:4400},
      {pos:5,name:"PlayerTwo",points:4200}
    ]
  };
  const leaderboard = document.getElementById("leaderboard");
  function renderLeaderboard(mode="overall"){
    const data = LB_DATA[mode] || [];
    leaderboard.innerHTML = `
      <table class="table">
        <thead><tr><th>#</th><th>Player</th><th>Points</th></tr></thead>
        <tbody>
          ${data.map(r=>`<tr><td class="pos">#${r.pos}</td><td>${r.name}</td><td>${r.points}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  }
  renderLeaderboard("overall");
  document.querySelectorAll(".ranking-header .btn-chip").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      document.querySelectorAll(".ranking-header .btn-chip").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      renderLeaderboard(btn.dataset.mode);
    });
  });

  // STAFF data & render (exact entries preserved)
  const STAFF = [
    {name:"Tanber",role:"FOUNDER",ign:"notcooldamn2",discord:"tanber_369",photo:"skins/tanber.png"},
    {name:"Sohrab",role:"CO FOUNDER",ign:"notcooldamn3",discord:"sohrab_369",photo:"skins/sohrab.png"},
    {name:"Ahsan",role:"Partner",ign:"ryuzen",discord:"monkey._.d._.luffy2",photo:"skins/ahsan.png"},
    {name:"Arfat",role:"Manager",ign:"onxy",discord:"onyx.plays",photo:"skins/arfat.png"},
    {name:"Asraful",role:"Moderator",ign:"asraful_vai",discord:"asraful_vai",photo:"skins/asraful.png"},
    {name:"Risat",role:"Senior Staff",ign:"risat",discord:"resath",photo:"skins/risat.png"},
    {name:"Rasel",role:"Social Manager",ign:"CANDYB0T",discord:"candyb0t",photo:"skins/rasel.png"},
    {name:"Siam",role:"Social Manager",ign:"siam",discord:"siam45795",photo:"skins/siam.png"},
    {name:"Tanver",role:"Developer",ign:"tenzenx",discord:"tenzenx",photo:"skins/tanver.png"}
  ];

  const adminGrid = document.getElementById("admin-grid");
  function renderStaff(){
    adminGrid.innerHTML = "";
    STAFF.forEach(s => {
      const card = document.createElement("div");
      card.className = "admin-card";
      const img = document.createElement("img");
      img.className = "admin-photo";
      img.alt = s.name;
      img.src = s.photo;
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = () => img.src = "skins/placeholder.png";
      card.appendChild(img);
      card.insertAdjacentHTML("beforeend", `
        <div class="admin-name">${s.name}</div>
        <div class="admin-role">${s.role}</div>
        <div class="admin-meta">IGN: ${s.ign}</div>
        <div class="admin-meta">Discord: ${s.discord}</div>
      `);
      adminGrid.appendChild(card);
    });
  }
  renderStaff();

  // Event countdown (next 1st of month)
  const eventTimer = document.getElementById("event-timer");
  function tick(){
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth()+1, 1, 0, 0, 0);
    const diff = target - now;
    if (diff <= 0) { eventTimer.textContent = "Event is live!"; return; }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    eventTimer.textContent = `Next Event in ${d}d ${h}h ${m}m ${s}s`;
  }
  tick();
  setInterval(tick, 1000);

  // small: clicking IP box copies too
  document.getElementById("ip-box")?.addEventListener("click", () => document.getElementById("copy-ip").click());

});
