// ---- icons ---------------------------------------------------------------

const ICON_PATHS = {
  arrowLeft: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  wallet: '<path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15v4"/><path d="M3 6v13a2 2 0 0 0 2 2h15v-5"/><path d="M18 12a2 2 0 0 0 0 4h3v-4Z"/>',
  trophy: '<circle cx="12" cy="8" r="6"/><path d="M8.5 13.5 6 22l6-3 6 3-2.5-8.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  eyeOff: '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
};

function icon(name, size = 18) {
  return `<span class="icon" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ""}</svg>
  </span>`;
}

// ---- avatars ---------------------------------------------------------------

const AVATAR_PALETTE = ["#5b8cff", "#7c6cff", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#f472b6", "#a78bfa"];
const OPTION_PALETTE = ["#5b8cff", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee", "#f472b6", "#fb923c"];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function avatarHtml(name, size = "") {
  const color = AVATAR_PALETTE[hashSeed(name || "?") % AVATAR_PALETTE.length];
  return `<span class="avatar ${size}" style="background:${color}">${escapeHtml(initials(name))}</span>`;
}

function optionColor(i) { return OPTION_PALETTE[i % OPTION_PALETTE.length]; }

// ---- votes ---------------------------------------------------------------

function voteCardHtml(vote) {
  const title = vote.type === "change_leader"
    ? `Make ${escapeHtml(vote.target_user_name)} the leader?`
    : `Overturn the resolution of "${escapeHtml(vote.target_bet_question)}"?`;
  const total = vote.total_members || 1;
  const yesPct = Math.round((vote.yes_count / total) * 100);
  const noPct = Math.round((vote.no_count / total) * 100);
  const countdown = formatCountdown(vote.closes_at);
  return `
    <div class="card">
      <h3 class="card-title">${icon(vote.type === "change_leader" ? "users" : "flag", 16)} ${title}</h3>
      <p class="muted" style="margin-top:-6px;">${vote.reason ? `"${escapeHtml(vote.reason)}" — ` : ""}started by ${escapeHtml(vote.initiator_name)}</p>
      <div class="vote-bar"><div class="yes" style="width:${yesPct}%"></div><div class="no" style="width:${noPct}%"></div></div>
      <p class="muted" style="font-size:0.85rem;">${vote.yes_count} yes · ${vote.no_count} no · out of ${vote.total_members} members (needs 60% yes) ${countdown ? `· ${countdown.text}` : ""}</p>
      <div class="row">
        <button class="chip vote-yes${vote.my_choice === "yes" ? " active" : ""}" data-vote-ballot="${vote.id}" data-choice="yes">${icon("check", 13)} Yes</button>
        <button class="chip vote-no${vote.my_choice === "no" ? " active" : ""}" data-vote-ballot="${vote.id}" data-choice="no">${icon("x", 13)} No</button>
      </div>
    </div>
  `;
}

function wireVoteBallots(onDone) {
  document.querySelectorAll("[data-vote-ballot]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api(`/api/votes/${btn.dataset.voteBallot}/ballot`, { method: "POST", body: { choice: btn.dataset.choice } });
        toast("Vote recorded", "success");
        await onDone();
      } catch (err) {
        toast(err.message, "error");
      }
    };
  });
}

// ---- toasts ---------------------------------------------------------------

function toast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const iconName = type === "error" ? "x" : type === "info" ? "bell" : "check";
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(iconName, 17)}<span>${escapeHtml(message)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 200);
  }, 3200);
}

// ---- skeleton loaders ---------------------------------------------------

function skeletonCard(lines = 3) {
  const rows = Array.from({ length: lines }, (_, i) =>
    `<div class="skeleton skeleton-line" style="width:${100 - i * 15}%"></div>`
  ).join("");
  return `<div class="card">${rows}</div>`;
}

function skeletonView(cards = 3) {
  return Array.from({ length: cards }, () => skeletonCard()).join("");
}

// ---- live updates (polling) ---------------------------------------------
// Keeps whatever group/bet page is open in sync with actions other members
// take, without the user needing to hit refresh: poll a lightweight events
// feed every few seconds, toast anything new from someone else, then
// silently re-fetch the page's data.

const POLL_INTERVAL_MS = 4000;
let pollState = { timer: null, groupId: null, lastEventId: 0, refresh: null };

function stopPolling() {
  if (pollState.timer) clearInterval(pollState.timer);
  pollState = { timer: null, groupId: null, lastEventId: 0, refresh: null };
}

// Chat has its own dedicated poll loop (faster cadence, different endpoint
// shape) rather than reusing the group-events one above, so a chat message
// never gets mixed into the notification toast feed.
const CHAT_POLL_INTERVAL_MS = 3000;
let chatPollTimer = null;

function stopChatPolling() {
  if (chatPollTimer) clearInterval(chatPollTimer);
  chatPollTimer = null;
}

function startPolling(groupId, latestEventId, refresh) {
  stopPolling();
  pollState.groupId = groupId;
  pollState.lastEventId = latestEventId;
  pollState.refresh = refresh;
  pollState.timer = setInterval(pollTick, POLL_INTERVAL_MS);
}

async function pollTick() {
  const { groupId, lastEventId, refresh } = pollState;
  if (!groupId) return;
  let events;
  try {
    events = await api(`/api/groups/${groupId}/events?after_id=${lastEventId}`);
  } catch {
    return; // transient network hiccup — just try again next tick
  }
  if (!pollState.groupId || !events.length) return;
  pollState.lastEventId = Math.max(...events.map((e) => e.id));

  const user = getUser();
  events.filter((e) => e.actor_id !== user.id).forEach((e) => toast(e.message, "info"));
  if (refresh) refresh();
}

// Re-rendering a view wipes any in-progress form input, which is jarring if
// a background poll refresh lands while someone's mid-typing. Snapshot
// named field values first and reapply them after the DOM is rebuilt.
function captureInputs() {
  return Array.from(document.querySelectorAll("#app input, #app select, #app textarea"))
    .filter((el) => el.name)
    .map((el) => ({ name: el.name, value: el.value }));
}

function restoreInputs(saved) {
  const counters = {};
  document.querySelectorAll("#app input, #app select, #app textarea").forEach((el) => {
    if (!el.name) return;
    const idx = counters[el.name] || 0;
    counters[el.name] = idx + 1;
    const matches = saved.filter((s) => s.name === el.name);
    if (matches[idx] && matches[idx].value) el.value = matches[idx].value;
  });
}

async function softRefresh(renderFn) {
  const saved = captureInputs();
  await renderFn();
  restoreInputs(saved);
}

// ---- closing-time countdowns --------------------------------------------
// The API stores/serializes naive UTC timestamps (no "Z"), so a bare
// `new Date(iso)` would be misread as local time. Always treat server
// timestamps without an explicit offset as UTC.
function parseServerDate(iso) {
  if (!iso) return null;
  return new Date(/[Zz]|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + "Z");
}

function formatCountdown(closesAtIso) {
  const closesAt = parseServerDate(closesAtIso);
  if (!closesAt) return null;
  const diffMs = closesAt.getTime() - Date.now();
  if (diffMs <= 0) return { text: "Closed", closed: true };
  const mins = Math.floor(diffMs / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const remMins = mins % 60;
  let text;
  if (days > 0) text = `${days}d ${hours}h left`;
  else if (hours > 0) text = `${hours}h ${remMins}m left`;
  else if (mins > 0) text = `${mins}m left`;
  else text = "Closing soon";
  return { text, closed: false };
}

// Refreshes any on-screen countdown text, and locks the stake form the
// moment a deadline passes even if no server poll has landed yet (the
// server enforces the real cutoff regardless; this just keeps the UI honest
// in between polls).
function tickCountdowns() {
  document.querySelectorAll(".countdown[data-closes-at]").forEach((el) => {
    const r = formatCountdown(el.dataset.closesAt);
    if (!r) return;
    el.textContent = r.text;
    el.classList.toggle("closed", r.closed);
    if (r.closed) {
      const form = document.getElementById("stake-form");
      if (form && !form.dataset.lockedClosed) {
        form.dataset.lockedClosed = "1";
        form.querySelectorAll("input, select, button").forEach((f) => (f.disabled = true));
        const hint = document.getElementById("stake-hint");
        if (hint) {
          hint.classList.remove("positive");
          hint.textContent = "Staking has closed for this question.";
        }
      }
    }
  });
}
setInterval(tickCountdowns, 15000);

// ---- win / loss reactions -----------------------------------------------

function fireConfetti() {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const colors = OPTION_PALETTE;
  const particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    r: 4 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: -1.5 + Math.random() * 3,
    vy: 2 + Math.random() * 2.5,
    rot: Math.random() * 360,
    vr: -6 + Math.random() * 12,
    shape: Math.random() < 0.5 ? "rect" : "circle",
  }));
  const duration = 2600;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (elapsed < duration && canvas.isConnected) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

function showReaction({ emoji, caption, kind }) {
  const el = document.createElement("div");
  el.className = `reaction-pop ${kind}`;
  el.innerHTML = `<div class="emoji">${emoji}</div><div class="caption">${escapeHtml(caption)}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function celebrateWin(amount) {
  fireConfetti();
  showReaction({ emoji: "🎉", caption: `You won ${fmtCoins(amount)} coins!`, kind: "win" });
}

function commiserateLoss() {
  showReaction({ emoji: "😢", caption: "Not this time", kind: "lose" });
}

// Only fire the reaction once per bet resolution per page session, even
// though soft-refreshing (polling, revisiting the page) re-renders it.
const celebratedBets = new Set();

function maybeReactToResolution(bet, user) {
  if (bet.status !== "resolved" || celebratedBets.has(bet.id)) return;
  celebratedBets.add(bet.id);
  const myPayout = bet.payouts.find((p) => p.user_id === user.id && p.type === "payout");
  const myRefund = bet.payouts.find((p) => p.user_id === user.id && p.type === "refund");
  if (myPayout) {
    celebrateWin(myPayout.amount);
  } else if (bet.my_stakes.length > 0 && !myRefund) {
    commiserateLoss();
  }
}

// ---- state -------------------------------------------------------------

function getToken() { return localStorage.getItem("pp_token"); }
function getUser() {
  const raw = localStorage.getItem("pp_user");
  return raw ? JSON.parse(raw) : null;
}
function setAuth(token, user) {
  localStorage.setItem("pp_token", token);
  localStorage.setItem("pp_user", JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem("pp_token");
  localStorage.removeItem("pp_user");
}

// ---- api -----------------------------------------------------------------

async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearAuth();
    location.hash = "#/login";
    throw new Error("Session expired, please log in again");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong");
  }
  return data;
}

// ---- helpers ---------------------------------------------------------

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function fmtCoins(n) { return n.toLocaleString(); }

// Question images are stored inline in the DB as a data URL, so they're
// downscaled/recompressed client-side first -- keeps the payload well under
// the backend's 2MB cap without needing any external file storage.
function fileToCompressedDataUrl(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function setTitle(suffix) {
  document.title = suffix ? `${suffix} · Playwise` : "Playwise";
}

// Ad placeholder slots -------------------------------------------------
//
// No ad network is wired in -- this just reserves clearly-labeled,
// correctly-sized containers in the layout so a real network's script
// (e.g. Google AdSense's <ins class="adsbygoogle"> tag, dropped in via
// index.html and pushed into these containers, or any other network's
// SDK targeting these element ids) can be plugged in later without any
// further layout changes. `data-ad-slot` names the placement for whatever
// config maps slots to ad units.
function adSlot(slotId, label) {
  return `
    <div class="ad-slot" id="ad-slot-${slotId}" data-ad-slot="${slotId}">
      <span class="ad-slot-label">Advertisement</span>
      <span class="ad-slot-hint">${escapeHtml(label)}</span>
    </div>
  `;
}

function renderUserBox() {
  const box = document.getElementById("user-box");
  const user = getUser();
  if (!user) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <a class="ghost icon-btn" href="#/chat" title="Global chat">${icon("chat", 17)}</a>
    <span class="name">${escapeHtml(user.display_name)}</span>
    ${avatarHtml(user.display_name, "sm")}
    <button class="ghost icon-btn" id="logout-btn" title="Log out">${icon("logout", 17)}</button>
  `;
  document.getElementById("logout-btn").onclick = () => {
    clearAuth();
    location.hash = "#/login";
    toast("Logged out", "success");
  };
}

function setApp(html) {
  const app = document.getElementById("app");
  app.innerHTML = html;
  app.style.animation = "none";
  void app.offsetWidth;
  app.style.animation = "";
}

// ---- router ------------------------------------------------------------

async function render() {
  stopPolling();
  stopChatPolling();
  renderUserBox();
  const hash = location.hash || "#/groups";
  const user = getUser();

  if (!user && hash !== "#/login" && hash !== "#/register") {
    location.hash = "#/login";
    return;
  }
  if (user && (hash === "#/login" || hash === "#/register")) {
    location.hash = "#/groups";
    return;
  }

  const groupMatch = hash.match(/^#\/groups\/(\d+)$/);
  const groupChatMatch = hash.match(/^#\/groups\/(\d+)\/chat$/);
  const betMatch = hash.match(/^#\/bets\/(\d+)$/);

  try {
    if (hash === "#/login") return viewLogin();
    if (hash === "#/register") return viewRegister();
    if (hash === "#/chat") return await viewGlobalChat();
    if (groupChatMatch) return await viewGroupChat(Number(groupChatMatch[1]));
    if (groupMatch) return await viewGroupDetail(Number(groupMatch[1]));
    if (betMatch) return await viewBetDetail(Number(betMatch[1]));
    return await viewGroups();
  } catch (err) {
    setApp(`<div class="card error">${escapeHtml(err.message)}</div>`);
  }
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);

// ---- views: auth -------------------------------------------------------

function viewLogin() {
  setTitle();
  setApp(`
    <div class="auth-shell">
      <div class="card">
        <div class="brand-mark">${icon("bolt", 20)}</div>
        <h1 class="center">Welcome back</h1>
        <p class="tagline center">Fake money, real bragging rights.</p>
        <form id="login-form" class="stack">
          <input name="username" placeholder="Username" autocomplete="username" required />
          <input name="password" type="password" placeholder="Password" autocomplete="current-password" required />
          <div class="error" id="login-error"></div>
          <button type="submit">Log in</button>
        </form>
        <p class="center muted section-gap">No account? <a href="#/register">Register</a></p>
      </div>
    </div>
  `);
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: { username: f.get("username"), password: f.get("password") },
      });
      setAuth(data.access_token, { id: data.user_id, username: data.username, display_name: data.display_name });
      toast(`Welcome back, ${data.display_name}`, "success");
      location.hash = "#/groups";
    } catch (err) {
      document.getElementById("login-error").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  };
}

function viewRegister() {
  setTitle();
  setApp(`
    <div class="auth-shell">
      <div class="card">
        <div class="brand-mark">${icon("bolt", 20)}</div>
        <h1 class="center">Create your account</h1>
        <p class="tagline center">Join a group and start predicting. Play money only — never real cash.</p>
        <form id="register-form" class="stack">
          <input name="display_name" placeholder="Display name" required />
          <input name="username" placeholder="Username" autocomplete="username" required minlength="3" />
          <input name="password" type="password" placeholder="Password (6+ characters)" autocomplete="new-password" required minlength="6" />
          <label class="terms-check">
            <input type="checkbox" name="accepted_terms" required />
            <span>I'm 18 or older and understand Playwise coins are play money only — they have no cash value and can never be bought, sold, or redeemed for real currency.</span>
          </label>
          <div class="error" id="register-error"></div>
          <button type="submit">Create account</button>
        </form>
        <p class="center muted section-gap">Already have an account? <a href="#/login">Log in</a></p>
      </div>
    </div>
  `);
  document.getElementById("register-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const data = await api("/api/register", {
        method: "POST",
        body: {
          username: f.get("username"),
          password: f.get("password"),
          display_name: f.get("display_name"),
          accepted_terms: f.get("accepted_terms") === "on",
        },
      });
      setAuth(data.access_token, { id: data.user_id, username: data.username, display_name: data.display_name });
      toast(`Account created — welcome, ${data.display_name}`, "success");
      location.hash = "#/groups";
    } catch (err) {
      document.getElementById("register-error").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  };
}

// ---- views: groups -------------------------------------------------------

async function viewGroups() {
  setTitle();
  setApp(skeletonView(2));
  const groups = await api("/api/groups");

  const groupsHtml = groups.length
    ? groups.map((g) => `
        <a class="list-item clickable" href="#/groups/${g.id}">
          <div class="identity">
            ${avatarHtml(g.name)}
            <div class="meta">
              <div class="primary">${escapeHtml(g.name)}</div>
              ${g.parent_group_name ? `<div class="secondary">↳ inside ${escapeHtml(g.parent_group_name)}</div>` : ""}
            </div>
          </div>
          <span class="amount">${fmtCoins(g.my_balance)}</span>
        </a>
      `).join("")
    : `<div class="empty-state">${icon("users", 28)}<p>You're not in any groups yet — create one or join with an invite code.</p></div>`;

  setApp(`
    <div class="card">
      <h1 class="row" style="gap:8px;">${icon("bolt", 20)} Your groups</h1>
      ${groupsHtml}
    </div>
    ${adSlot("groups-top", "728x90 leaderboard")}
    <div class="card">
      <h3 class="card-title">${icon("plus", 16)} Create a group</h3>
      <form id="create-group-form" class="form-inline">
        <input name="name" placeholder="Group name" required />
        <button type="submit">Create</button>
      </form>
      <div class="error" id="create-group-error"></div>
    </div>
    <div class="card">
      <h3 class="card-title">${icon("key", 16)} Join a group</h3>
      <form id="join-group-form" class="form-inline">
        <input name="invite_code" placeholder="Invite code" required />
        <button type="submit">Join</button>
      </form>
      <div class="error" id="join-group-error"></div>
    </div>
  `);

  document.getElementById("create-group-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const g = await api("/api/groups", { method: "POST", body: { name: f.get("name") } });
      toast(`Created "${g.name}"`, "success");
      location.hash = `#/groups/${g.id}`;
    } catch (err) {
      document.getElementById("create-group-error").textContent = err.message;
    }
  };

  document.getElementById("join-group-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const g = await api("/api/groups/join", { method: "POST", body: { invite_code: f.get("invite_code") } });
      toast(`Joined "${g.name}"`, "success");
      location.hash = `#/groups/${g.id}`;
    } catch (err) {
      document.getElementById("join-group-error").textContent = err.message;
    }
  };
}

async function viewGroupDetail(groupId) {
  setTitle();
  setApp(skeletonView(3));
  const [group, votes] = await Promise.all([api(`/api/groups/${groupId}`), api(`/api/groups/${groupId}/votes`)]);
  setTitle(group.name);
  const user = getUser();
  const isLeader = group.leader_id === user.id;

  const openLeaderVote = votes.find((v) => v.type === "change_leader" && v.status === "open");
  const otherMembers = group.members.filter((m) => m.user_id !== group.leader_id);
  const leaderVoteChoices = otherMembers
    .map((m) => `<option value="${m.user_id}">${escapeHtml(m.display_name)}</option>`)
    .join("");
  const membersExceptMe = group.members.filter((m) => m.user_id !== user.id);

  const membersHtml = group.members
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .map((m) => `
      <div class="list-item">
        <div class="identity">
          ${avatarHtml(m.display_name)}
          <div class="meta">
            <div class="primary">${escapeHtml(m.display_name)}${m.user_id === group.leader_id ? ' <span class="badge leader">leader</span>' : ""}</div>
          </div>
        </div>
        <span class="row" style="gap:8px;">
          <span class="amount">${fmtCoins(m.balance)}</span>
          ${isLeader && m.user_id !== group.leader_id ? `<button class="ghost icon-btn" data-kick-member="${m.user_id}" title="Remove from group">${icon("x", 14)}</button>` : ""}
        </span>
      </div>
    `).join("");

  const pendingHtml = isLeader && group.pending_topups.length
    ? group.pending_topups.map((r) => `
        <div class="list-item">
          <div class="identity">
            ${avatarHtml(r.display_name)}
            <div class="meta">
              <div class="primary">${escapeHtml(r.display_name)}</div>
              <div class="secondary">requests ${fmtCoins(r.amount)} coins</div>
            </div>
          </div>
          <span class="row" style="gap:6px;">
            <button class="secondary small icon-btn" data-approve="${r.id}" title="Approve">${icon("check", 15)}</button>
            <button class="danger small icon-btn" data-reject="${r.id}" title="Reject">${icon("x", 15)}</button>
          </span>
        </div>
      `).join("")
    : `<div class="empty-state" style="padding:14px 10px;">${icon("inbox", 22)}<p>Nothing pending.</p></div>`;

  const subgroupsHtml = group.subgroups.length
    ? group.subgroups.map((sg) => `
        <div class="list-item">
          <div class="identity">
            ${avatarHtml(sg.name)}
            <div class="meta"><div class="primary">${escapeHtml(sg.name)}</div></div>
          </div>
          ${sg.is_member
            ? `<a href="#/groups/${sg.id}" class="amount" style="text-decoration:none;">${fmtCoins(sg.my_balance)}</a>`
            : `<span class="muted" style="font-size:0.82rem;">Ask the sub-group's leader to add you</span>`}
        </div>
      `).join("")
    : `<div class="empty-state" style="padding:14px 10px;">${icon("inbox", 22)}<p>No sub-groups yet.</p></div>`;

  const openBets = group.bets.filter((b) => b.status === "open");
  const resolvedBets = group.bets.filter((b) => b.status === "resolved");

  function betRow(b) {
    const total = b.option_totals.reduce((a, c) => a + c, 0);
    const leaderPct = total ? Math.round((Math.max(...b.option_totals) / total) * 100) : 0;
    const leaderIdx = b.option_totals.indexOf(Math.max(...b.option_totals));
    const countdown = b.status === "open" && b.closes_at ? formatCountdown(b.closes_at) : null;
    return `
      <a class="list-item clickable" href="#/bets/${b.id}">
        <div class="identity" style="flex:1;min-width:0;">
          ${b.image_data ? `<img src="${b.image_data}" class="bet-thumb" alt="" />` : ""}
          <div class="meta" style="flex:1;min-width:0;">
            <div class="primary" style="white-space:normal;">${escapeHtml(b.question)}</div>
            <div class="secondary row" style="gap:8px;margin-top:4px;">
              <span>${fmtCoins(total)} staked</span>
              ${total ? `<span style="color:${optionColor(leaderIdx)}">${escapeHtml(b.options[leaderIdx])} ${leaderPct}%</span>` : ""}
            </div>
          </div>
        </div>
        <span class="row" style="gap:6px;">
          ${b.hidden_from_names.length ? `<span class="badge incognito" title="Hidden from ${escapeHtml(b.hidden_from_names.join(", "))}">${icon("eyeOff", 12)} incognito</span>` : ""}
          ${countdown ? `<span class="badge countdown${countdown.closed ? " closed" : ""}" data-closes-at="${b.closes_at}">${icon("clock", 12)} ${countdown.text}</span>` : ""}
          <span class="badge ${b.status}">${b.status === "open" ? icon("clock", 12) : icon("trophy", 12)} ${b.status}</span>
        </span>
      </a>
    `;
  }

  setApp(`
    <a href="#/groups" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} All groups</a>
    ${group.parent_group_name ? `
      <a href="#/groups/${group.parent_group_id}" class="row" style="gap:6px;color:var(--accent);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} ${escapeHtml(group.parent_group_name)}</a>
    ` : ""}

    <div class="card balance-hero">
      <div class="row between">
        <div>
          <div class="balance-label">${escapeHtml(group.name)}</div>
          <div class="balance">${fmtCoins(group.my_balance)}<span class="unit">coins</span></div>
        </div>
        ${icon("wallet", 26)}
      </div>
      <div class="row section-gap" style="gap:8px;">
        <div class="invite-pill">
          ${icon("key", 14)} <code>${escapeHtml(group.invite_code)}</code>
          <button class="ghost small" id="copy-invite-btn">${icon("copy", 13)} Copy</button>
        </div>
        <a href="#/groups/${groupId}/chat" class="secondary small" style="display:inline-flex;align-items:center;gap:6px;">${icon("chat", 14)} Group chat</a>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">${icon("plus", 16)} Request a top-up</h3>
      <form id="topup-form" class="form-inline">
        <input name="amount" type="number" min="1" placeholder="Amount" required />
        <button type="submit">Request</button>
      </form>
      <div class="error" id="topup-error"></div>
    </div>

    ${isLeader ? `
      <div class="card">
        <h3 class="card-title">${icon("inbox", 16)} Pending top-up requests</h3>
        ${pendingHtml}
      </div>
    ` : ""}

    <div class="card">
      <h3 class="card-title">${icon("users", 16)} Members</h3>
      ${membersHtml}
      ${!openLeaderVote && otherMembers.length ? `
        <form id="start-leader-vote-form" class="stack section-gap">
          <label class="field-label">Start a vote to change leader</label>
          <select name="target_user_id">${leaderVoteChoices}</select>
          <input name="reason" placeholder="Reason (optional)" maxlength="280" />
          <button type="submit" class="secondary small" style="align-self:flex-start;">${icon("flag", 14)} Start vote</button>
        </form>
        <div class="error" id="leader-vote-error"></div>
      ` : ""}
      ${!isLeader ? `<button class="ghost small" id="leave-group-btn" style="margin-top:10px;color:var(--negative);">${icon("logout", 14)} Leave group</button>` : ""}
    </div>

    ${openLeaderVote ? voteCardHtml(openLeaderVote) : ""}

    <div class="card">
      <h3 class="card-title">${icon("users", 16)} Sub-groups</h3>
      ${subgroupsHtml}
      <form id="create-subgroup-form" class="form-inline section-gap">
        <input name="name" placeholder="Sub-group name (e.g. Action)" required />
        <button type="submit">Create</button>
      </form>
      <div class="error" id="create-subgroup-error"></div>
    </div>

    ${group.invitable_members.length ? `
      <div class="card">
        <h3 class="card-title">${icon("users", 16)} Invite from ${escapeHtml(group.parent_group_name)}</h3>
        ${group.invitable_members.map((m) => `
          <div class="list-item">
            <div class="identity">${avatarHtml(m.display_name)}<span class="primary">${escapeHtml(m.display_name)}</span></div>
            <button class="secondary small" data-invite-member="${m.user_id}">Invite</button>
          </div>
        `).join("")}
      </div>
    ` : ""}

    <div class="card">
      <h3 class="card-title">${icon("bolt", 16)} New question</h3>
      <form id="bet-form" class="stack">
        <input name="question" placeholder="What's the question?" required />
        <div id="options-container" class="stack">
          <div class="option-input-row"><input name="option" placeholder="Option 1" required /></div>
          <div class="option-input-row"><input name="option" placeholder="Option 2" required /></div>
        </div>
        <button type="button" class="secondary small" id="add-option-btn" style="align-self:flex-start;">${icon("plus", 14)} Add option</button>

        <div class="image-upload-section stack">
          <label class="field-label">${icon("image", 14)} Attach an image (optional)</label>
          <input type="file" accept="image/*" id="bet-image-input" />
          <div id="bet-image-preview-wrap" style="display:none;">
            <img id="bet-image-preview" class="bet-image-preview" alt="" />
            <button type="button" class="ghost small" id="remove-bet-image-btn">${icon("x", 12)} Remove image</button>
          </div>
          <div class="error" id="bet-image-error"></div>
        </div>

        <div class="timer-section stack">
          <label class="field-label" style="color:var(--warning);">${icon("clock", 14)} Staking deadline (optional)</label>
          <input type="datetime-local" name="closes_at" id="bet-closes-at" />
          <div class="row">
            <button type="button" class="chip" data-closes-in="1">+1h</button>
            <button type="button" class="chip" data-closes-in="6">+6h</button>
            <button type="button" class="chip" data-closes-in="24">+1d</button>
            <button type="button" class="chip" data-closes-in="72">+3d</button>
            <button type="button" class="chip" data-closes-in="168">+1w</button>
            <button type="button" class="chip" data-closes-in="clear">No deadline</button>
          </div>
          <p class="hint" style="margin:0;">If set, no one can stake after this time — you can still resolve whenever the outcome's known.</p>
        </div>

        <div class="incognito-section stack">
          <label class="field-label" style="color:var(--accent-2);display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="incognito-toggle" style="width:auto;" ${membersExceptMe.length ? "" : "disabled"} />
            ${icon("eyeOff", 14)} Incognito question (optional)
          </label>
          ${membersExceptMe.length ? `
            <div id="incognito-members" class="incognito-checklist" style="display:none;">
              ${membersExceptMe.map((m) => `<label><input type="checkbox" name="hidden_from" value="${m.user_id}" /> ${escapeHtml(m.display_name)}</label>`).join("")}
            </div>
            <p class="hint" style="margin:0;">Selected members won't be able to see this question exists at all — not in the list, not in notifications.</p>
          ` : `
            <p class="hint" style="margin:0;">Invite other members to this group before you can hide a question from anyone.</p>
          `}
        </div>

        <div class="error" id="bet-error"></div>
        <button type="submit">Create question</button>
      </form>
    </div>

    <div class="card">
      <h3 class="card-title">${icon("clock", 16)} Open bets</h3>
      ${openBets.length ? openBets.map(betRow).join("") : `<div class="empty-state">${icon("inbox", 24)}<p>No open bets yet.</p></div>`}
    </div>

    ${resolvedBets.length ? `
      <div class="card">
        <h3 class="card-title">${icon("trophy", 16)} Resolved</h3>
        ${resolvedBets.map(betRow).join("")}
      </div>
    ` : ""}

    ${adSlot("group-detail-bottom", "300x250 medium rectangle")}
  `);

  document.getElementById("copy-invite-btn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      toast("Invite code copied", "success");
    } catch {
      toast("Couldn't copy — copy it manually", "error");
    }
  };

  const leaderVoteForm = document.getElementById("start-leader-vote-form");
  if (leaderVoteForm) {
    leaderVoteForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await api(`/api/groups/${groupId}/votes`, {
          method: "POST",
          body: { type: "change_leader", target_user_id: Number(f.get("target_user_id")), reason: f.get("reason") || null },
        });
        toast("Vote started", "success");
        await viewGroupDetail(groupId);
      } catch (err) {
        document.getElementById("leader-vote-error").textContent = err.message;
      }
    };
  }
  wireVoteBallots(() => viewGroupDetail(groupId));

  document.getElementById("create-subgroup-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const sg = await api("/api/groups", { method: "POST", body: { name: f.get("name"), parent_group_id: groupId } });
      toast(`Created sub-group "${sg.name}"`, "success");
      location.hash = `#/groups/${sg.id}`;
    } catch (err) {
      document.getElementById("create-subgroup-error").textContent = err.message;
    }
  };

  document.querySelectorAll("[data-invite-member]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api(`/api/groups/${groupId}/invite/${btn.dataset.inviteMember}`, { method: "POST" });
        toast("Invited", "success");
        await viewGroupDetail(groupId);
      } catch (err) {
        toast(err.message, "error");
      }
    };
  });

  const leaveBtn = document.getElementById("leave-group-btn");
  if (leaveBtn) {
    leaveBtn.onclick = async () => {
      if (!confirm(`Leave "${group.name}"? Any open stakes will be refunded first.`)) return;
      try {
        await api(`/api/groups/${groupId}/leave`, { method: "POST" });
        toast("Left the group", "success");
        location.hash = "#/groups";
      } catch (err) {
        toast(err.message, "error");
      }
    };
  }

  document.querySelectorAll("[data-kick-member]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Remove this person from the group? Any open stakes of theirs will be refunded.")) return;
      try {
        await api(`/api/groups/${groupId}/kick/${btn.dataset.kickMember}`, { method: "POST" });
        toast("Member removed", "success");
        await viewGroupDetail(groupId);
      } catch (err) {
        toast(err.message, "error");
      }
    };
  });

  document.getElementById("topup-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await api(`/api/groups/${groupId}/topup-requests`, {
        method: "POST",
        body: { amount: Number(f.get("amount")) },
      });
      toast("Top-up requested — waiting on the leader", "success");
      await viewGroupDetail(groupId);
    } catch (err) {
      document.getElementById("topup-error").textContent = err.message;
    }
  };

  document.getElementById("add-option-btn").onclick = () => {
    const container = document.getElementById("options-container");
    const row = document.createElement("div");
    row.className = "option-input-row";
    const n = container.children.length + 1;
    row.innerHTML = `<input name="option" placeholder="Option ${n}" required />
      <button type="button" class="ghost icon-btn remove-option-btn" title="Remove">${icon("x", 15)}</button>`;
    container.appendChild(row);
    row.querySelector(".remove-option-btn").onclick = () => row.remove();
  };

  const closesAtInput = document.getElementById("bet-closes-at");
  function toLocalInputValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  closesAtInput.min = toLocalInputValue(new Date(Date.now() + 60000));
  document.querySelectorAll("[data-closes-in]").forEach((chip) => {
    chip.onclick = () => {
      if (chip.dataset.closesIn === "clear") {
        closesAtInput.value = "";
      } else {
        closesAtInput.value = toLocalInputValue(new Date(Date.now() + Number(chip.dataset.closesIn) * 3600000));
      }
    };
  });

  const incognitoToggle = document.getElementById("incognito-toggle");
  const incognitoMembers = document.getElementById("incognito-members");
  if (incognitoToggle && incognitoMembers) {
    incognitoToggle.onchange = () => {
      incognitoMembers.style.display = incognitoToggle.checked ? "" : "none";
    };
  }

  let newBetImageDataUrl = null;
  const betImageInput = document.getElementById("bet-image-input");
  const betImagePreviewWrap = document.getElementById("bet-image-preview-wrap");
  const betImagePreview = document.getElementById("bet-image-preview");
  betImageInput.onchange = async () => {
    const file = betImageInput.files[0];
    if (!file) return;
    document.getElementById("bet-image-error").textContent = "";
    try {
      newBetImageDataUrl = await fileToCompressedDataUrl(file);
      betImagePreview.src = newBetImageDataUrl;
      betImagePreviewWrap.style.display = "";
    } catch (err) {
      document.getElementById("bet-image-error").textContent = err.message;
      betImageInput.value = "";
    }
  };
  document.getElementById("remove-bet-image-btn").onclick = () => {
    newBetImageDataUrl = null;
    betImageInput.value = "";
    betImagePreviewWrap.style.display = "none";
  };

  document.getElementById("bet-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const question = f.get("question");
    const options = f.getAll("option").map((o) => o.trim()).filter(Boolean);
    const closesAtLocal = f.get("closes_at");
    const closes_at = closesAtLocal ? new Date(closesAtLocal).toISOString() : null;
    const hidden_from_user_ids = incognitoToggle && incognitoToggle.checked
      ? f.getAll("hidden_from").map(Number)
      : null;
    try {
      const bet = await api(`/api/groups/${groupId}/bets`, {
        method: "POST",
        body: { question, options, closes_at, hidden_from_user_ids, image_data: newBetImageDataUrl },
      });
      toast("Question posted", "success");
      location.hash = `#/bets/${bet.id}`;
    } catch (err) {
      document.getElementById("bet-error").textContent = err.message;
    }
  };

  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api(`/api/groups/${groupId}/topup-requests/${btn.dataset.approve}/approve`, { method: "POST" });
        toast("Top-up approved", "success");
        await viewGroupDetail(groupId);
      } catch (err) {
        toast(err.message, "error");
      }
    };
  });
  document.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api(`/api/groups/${groupId}/topup-requests/${btn.dataset.reject}/reject`, { method: "POST" });
        toast("Top-up rejected", "success");
        await viewGroupDetail(groupId);
      } catch (err) {
        toast(err.message, "error");
      }
    };
  });

  startPolling(groupId, group.latest_event_id, () => softRefresh(() => viewGroupDetail(groupId)));
}

// ---- views: bet detail -------------------------------------------------

async function viewBetDetail(betId) {
  setTitle();
  setApp(skeletonView(2));
  const bet = await api(`/api/bets/${betId}`);
  const group = await api(`/api/groups/${bet.group_id}`);
  const votes = bet.status === "deleted" ? [] : await api(`/api/groups/${bet.group_id}/votes`);
  const disputeVote = votes.find((v) => v.type === "dispute_resolution" && v.target_bet_id === betId);
  setTitle(bet.question);
  const user = getUser();
  const isLeader = group.leader_id === user.id;
  const isCreator = bet.creator_id === user.id;
  const canResolve = isLeader || isCreator;
  const canDelete = (isLeader || isCreator) && bet.status === "open";
  const total = bet.option_totals.reduce((a, c) => a + c, 0);
  const countdown = bet.status === "open" && bet.closes_at ? formatCountdown(bet.closes_at) : null;
  const stakingClosed = bet.status !== "open" || (countdown && countdown.closed);
  const canEdit = isCreator && bet.status === "open" && total === 0;

  if (bet.status === "deleted") {
    setApp(`
      <a href="#/groups/${group.id}" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} ${escapeHtml(group.name)}</a>
      <div class="card empty-state">
        ${icon("inbox", 28)}
        <p>This question was deleted${bet.my_stakes.length ? " and your stake was refunded." : "."}</p>
      </div>
    `);
    startPolling(group.id, group.latest_event_id, () => softRefresh(() => viewBetDetail(betId)));
    return;
  }

  maybeReactToResolution(bet, user);

  const optionsHtml = bet.options.map((opt, i) => {
    const amt = bet.option_totals[i];
    const pct = total ? Math.round((amt / total) * 100) : 0;
    const isWinner = bet.status === "resolved" && bet.winning_option === i;
    return `
      <div class="option-row${isWinner ? " winner" : ""}">
        <div class="option-head">
          <span class="option-label"><span class="swatch" style="background:${optionColor(i)}"></span>${escapeHtml(opt)}${isWinner ? ` ${icon("trophy", 14)}` : ""}</span>
          <span class="option-stats">${fmtCoins(amt)} · ${pct}%</span>
        </div>
        <div class="option-bar"><div style="width:${pct}%;background:${optionColor(i)}"></div></div>
      </div>
    `;
  }).join("");

  const optionChoices = bet.options.map((opt, i) => `<option value="${i}">${escapeHtml(opt)}</option>`).join("");

  const myStakesHtml = bet.my_stakes.length
    ? bet.my_stakes.map((s) => `
        <div class="list-item">
          <div class="identity"><span class="swatch" style="background:${optionColor(s.option_index)};width:9px;height:9px;border-radius:3px;"></span><span class="primary">${escapeHtml(bet.options[s.option_index])}</span></div>
          <span class="row" style="gap:8px;">
            <span class="amount">${fmtCoins(s.amount)}</span>
            ${bet.status === "open" ? `<button class="ghost icon-btn" data-retract-stake="${s.id}" title="Retract this stake">${icon("x", 14)}</button>` : ""}
          </span>
        </div>
      `).join("")
    : `<div class="empty-state" style="padding:14px 10px;">${icon("inbox", 22)}<p>You haven't staked on this yet.</p></div>`;

  let winnerBanner = "";
  let payoutsHtml = "";
  if (bet.status === "resolved") {
    const winningOption = escapeHtml(bet.options[bet.winning_option]);
    let bannerText;
    if (bet.payouts.length === 0) {
      bannerText = `${winningOption} won — no one staked on this bet.`;
    } else if (bet.payouts[0].type === "payout") {
      bannerText = `${winningOption} won — the pool has been paid out to winners.`;
    } else {
      bannerText = `${winningOption} won, but nobody staked on it — all stakes were refunded.`;
    }
    winnerBanner = `<div class="winner-banner">${icon("trophy", 20)} <span>${bannerText}</span></div>`;

    if (bet.payouts.length) {
      const rows = bet.payouts.map((p) => `
        <div class="list-item">
          <div class="identity">
            ${avatarHtml(p.display_name)}
            <span class="primary">${escapeHtml(p.display_name)}${p.type === "refund" ? ' <span class="badge">refunded</span>' : ""}</span>
          </div>
          <span class="amount positive">+${fmtCoins(p.amount)}</span>
        </div>
      `).join("");
      payoutsHtml = `
        <div class="card">
          <h3 class="card-title">${icon("trophy", 16)} ${bet.payouts[0].type === "payout" ? "Who won how much" : "Refunds"}</h3>
          ${rows}
        </div>
      `;
    }
  }

  setApp(`
    <a href="#/groups/${group.id}" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} ${escapeHtml(group.name)}</a>

    <div class="card">
      <div id="bet-view-mode">
        <div class="row between" style="align-items:flex-start;">
          <h1>${escapeHtml(bet.question)}</h1>
          <span class="row" style="gap:6px;">
            ${canEdit ? `<button class="ghost icon-btn" id="edit-bet-btn" title="Edit question">${icon("edit", 15)}</button>` : ""}
            ${canDelete ? `<button class="ghost icon-btn" id="delete-bet-btn" title="Delete question">${icon("trash", 15)}</button>` : ""}
            ${bet.hidden_from_names.length ? `<span class="badge incognito">${icon("eyeOff", 12)} hidden from ${escapeHtml(bet.hidden_from_names.join(", "))}</span>` : ""}
            <span class="badge ${bet.status}">${bet.status === "open" ? icon("clock", 12) : icon("trophy", 12)} ${bet.status}</span>
          </span>
        </div>
        ${countdown ? `
          <div class="countdown-strip${countdown.closed ? " closed" : ""}">
            ${icon("clock", 16)} <span class="countdown" data-closes-at="${bet.closes_at}">${countdown.text}</span> to place stakes
          </div>
        ` : ""}
        ${bet.image_data ? `<img src="${bet.image_data}" class="bet-detail-image" alt="" />` : ""}
        <p class="muted" style="margin:2px 0 14px;">${fmtCoins(total)} coins staked total</p>
        ${winnerBanner}
        ${optionsHtml}
      </div>

      <div id="bet-edit-mode" class="stack" style="display:none;">
        <input id="edit-question" value="${escapeHtml(bet.question)}" placeholder="What's the question?" />
        <div id="edit-options-container" class="stack">
          ${bet.options.map((o, i) => `<div class="option-input-row"><input name="edit-option" value="${escapeHtml(o)}" placeholder="Option ${i + 1}" required /></div>`).join("")}
        </div>
        <button type="button" class="secondary small" id="add-edit-option-btn" style="align-self:flex-start;">${icon("plus", 14)} Add option</button>

        <div class="image-upload-section stack">
          <label class="field-label">${icon("image", 14)} Image (optional)</label>
          <input type="file" accept="image/*" id="edit-bet-image-input" />
          <div id="edit-bet-image-preview-wrap" style="display:${bet.image_data ? "" : "none"};">
            <img id="edit-bet-image-preview" class="bet-image-preview" alt="" src="${bet.image_data || ""}" />
            <button type="button" class="ghost small" id="remove-edit-bet-image-btn">${icon("x", 12)} Remove image</button>
          </div>
          <div class="error" id="edit-bet-image-error"></div>
        </div>

        <div class="error" id="edit-bet-error"></div>
        <div class="row">
          <button type="button" id="save-edit-bet-btn">Save changes</button>
          <button type="button" class="secondary" id="cancel-edit-bet-btn">Cancel</button>
        </div>
      </div>
    </div>

    ${payoutsHtml}

    ${disputeVote ? voteCardHtml(disputeVote) : ""}
    ${bet.status === "resolved" && !disputeVote ? `
      <div class="card">
        <h3 class="card-title">${icon("flag", 16)} Think this was resolved wrong?</h3>
        <form id="dispute-form" class="stack">
          <input name="reason" placeholder="Why? (optional)" maxlength="280" />
          <button type="submit" class="secondary small" style="align-self:flex-start;">${icon("flag", 14)} Dispute this resolution</button>
        </form>
        <div class="error" id="dispute-error"></div>
      </div>
    ` : ""}

    ${bet.status === "open" && !stakingClosed ? `
      <div class="card">
        <h3 class="card-title">${icon("bolt", 16)} Place a stake</h3>
        <p class="muted" style="margin-top:-4px;">Your balance: <strong>${fmtCoins(group.my_balance)}</strong> coins</p>
        <form id="stake-form" class="stack">
          <select name="option_index" id="stake-option">${optionChoices}</select>
          <input name="amount" id="stake-amount" type="number" min="1" max="${group.my_balance}" placeholder="Amount" required ${group.my_balance < 1 ? "disabled" : ""} />
          <div class="row" id="chip-row">
            ${[25, 50, 100].map((v) => `<button type="button" class="chip" data-chip="${v}">+${v}</button>`).join("")}
            <button type="button" class="chip" data-chip="max">Max</button>
          </div>
          <div class="hint positive" id="stake-hint"></div>
          <div class="error" id="stake-error"></div>
          <button type="submit" ${group.my_balance < 1 ? "disabled" : ""}>Stake</button>
        </form>
        ${group.my_balance < 1 ? `<p class="hint">You have no balance in this group — request a top-up first.</p>` : ""}
      </div>
    ` : ""}
    ${bet.status === "open" && stakingClosed ? `
      <div class="card">
        <h3 class="card-title">${icon("clock", 16)} Staking closed</h3>
        <p class="muted" style="margin:0;">The deadline for staking on this question has passed. ${canResolve ? "Resolve it below once the outcome's known." : "Waiting on the creator or leader to resolve it."}</p>
      </div>
    ` : ""}

    <div class="card">
      <h3 class="card-title">${icon("wallet", 16)} Your stakes</h3>
      ${myStakesHtml}
    </div>

    ${canResolve && bet.status === "open" ? `
      <div class="card">
        <h3 class="card-title">${icon("trophy", 16)} Resolve this bet</h3>
        <p class="muted" style="margin-top:-4px;">Pick the winning option. The entire pool splits among winners in proportion to their stake.</p>
        <form id="resolve-form" class="form-inline">
          <select name="winning_option">${optionChoices}</select>
          <button type="submit" class="danger">Resolve</button>
        </form>
        <div class="error" id="resolve-error"></div>
      </div>
    ` : ""}
  `);

  const amountInput = document.getElementById("stake-amount");
  const optionSelect = document.getElementById("stake-option");
  const hintEl = document.getElementById("stake-hint");

  function updateHint() {
    const amount = Number(amountInput?.value || 0);
    const idx = Number(optionSelect?.value || 0);
    if (!amount || amount <= 0) { hintEl.textContent = ""; return; }
    const totals = bet.option_totals.slice();
    totals[idx] += amount;
    const newTotal = totals.reduce((a, c) => a + c, 0);
    const payout = Math.floor((amount * newTotal) / totals[idx]);
    hintEl.textContent = `If "${bet.options[idx]}" wins right now, you'd receive ~${fmtCoins(payout)} coins (estimate — more stakes may still come in).`;
  }

  if (amountInput) {
    amountInput.addEventListener("input", updateHint);
    optionSelect.addEventListener("change", updateHint);
    document.querySelectorAll("[data-chip]").forEach((chip) => {
      chip.onclick = () => {
        amountInput.value = chip.dataset.chip === "max" ? group.my_balance : Math.min(chip.dataset.chip, group.my_balance);
        updateHint();
      };
    });
  }

  const stakeForm = document.getElementById("stake-form");
  if (stakeForm) {
    stakeForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        await api(`/api/bets/${betId}/stake`, {
          method: "POST",
          body: { option_index: Number(f.get("option_index")), amount: Number(f.get("amount")) },
        });
        toast("Stake placed", "success");
        await viewBetDetail(betId);
      } catch (err) {
        document.getElementById("stake-error").textContent = err.message;
        btn.disabled = false;
      }
    };
  }

  const resolveForm = document.getElementById("resolve-form");
  if (resolveForm) {
    resolveForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const chosen = bet.options[Number(f.get("winning_option"))];
      if (!confirm(`Resolve "${bet.question}" with "${chosen}" as the winner? This cannot be undone.`)) return;
      try {
        await api(`/api/bets/${betId}/resolve`, {
          method: "POST",
          body: { winning_option: Number(f.get("winning_option")) },
        });
        toast(`Resolved — "${chosen}" won`, "success");
        await viewBetDetail(betId);
      } catch (err) {
        document.getElementById("resolve-error").textContent = err.message;
      }
    };
  }

  const deleteBtn = document.getElementById("delete-bet-btn");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!confirm(`Delete "${bet.question}"? Any stakes will be refunded. This cannot be undone.`)) return;
      try {
        await api(`/api/bets/${betId}`, { method: "DELETE" });
        toast("Question deleted", "success");
        location.hash = `#/groups/${group.id}`;
      } catch (err) {
        toast(err.message, "error");
      }
    };
  }

  const editBtn = document.getElementById("edit-bet-btn");
  if (editBtn) {
    editBtn.onclick = () => {
      document.getElementById("bet-view-mode").style.display = "none";
      document.getElementById("bet-edit-mode").style.display = "";
    };
    document.getElementById("cancel-edit-bet-btn").onclick = () => {
      document.getElementById("bet-edit-mode").style.display = "none";
      document.getElementById("bet-view-mode").style.display = "";
    };
    document.getElementById("add-edit-option-btn").onclick = () => {
      const container = document.getElementById("edit-options-container");
      const row = document.createElement("div");
      row.className = "option-input-row";
      const n = container.children.length + 1;
      row.innerHTML = `<input name="edit-option" placeholder="Option ${n}" required />
        <button type="button" class="ghost icon-btn remove-option-btn" title="Remove">${icon("x", 15)}</button>`;
      container.appendChild(row);
      row.querySelector(".remove-option-btn").onclick = () => row.remove();
    };

    let editBetImageDataUrl = bet.image_data || null;
    let editBetImageRemoved = false;
    const editImageInput = document.getElementById("edit-bet-image-input");
    const editImagePreviewWrap = document.getElementById("edit-bet-image-preview-wrap");
    const editImagePreview = document.getElementById("edit-bet-image-preview");
    editImageInput.onchange = async () => {
      const file = editImageInput.files[0];
      if (!file) return;
      document.getElementById("edit-bet-image-error").textContent = "";
      try {
        editBetImageDataUrl = await fileToCompressedDataUrl(file);
        editBetImageRemoved = false;
        editImagePreview.src = editBetImageDataUrl;
        editImagePreviewWrap.style.display = "";
      } catch (err) {
        document.getElementById("edit-bet-image-error").textContent = err.message;
        editImageInput.value = "";
      }
    };
    document.getElementById("remove-edit-bet-image-btn").onclick = () => {
      editBetImageDataUrl = null;
      editBetImageRemoved = true;
      editImageInput.value = "";
      editImagePreviewWrap.style.display = "none";
    };

    document.getElementById("save-edit-bet-btn").onclick = async () => {
      const question = document.getElementById("edit-question").value.trim();
      const options = Array.from(document.querySelectorAll('#edit-options-container input[name="edit-option"]'))
        .map((el) => el.value.trim())
        .filter(Boolean);
      try {
        await api(`/api/bets/${betId}`, {
          method: "PATCH",
          body: {
            question, options,
            image_data: editBetImageRemoved ? null : editBetImageDataUrl,
            remove_image: editBetImageRemoved,
          },
        });
        toast("Question updated", "success");
        await viewBetDetail(betId);
      } catch (err) {
        document.getElementById("edit-bet-error").textContent = err.message;
      }
    };
  }

  const disputeForm = document.getElementById("dispute-form");
  if (disputeForm) {
    disputeForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await api(`/api/groups/${group.id}/votes`, {
          method: "POST",
          body: { type: "dispute_resolution", target_bet_id: betId, reason: f.get("reason") || null },
        });
        toast("Dispute started", "success");
        await viewBetDetail(betId);
      } catch (err) {
        document.getElementById("dispute-error").textContent = err.message;
      }
    };
  }
  wireVoteBallots(() => viewBetDetail(betId));

  document.querySelectorAll("[data-retract-stake]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Retract this stake? Your coins will be refunded.")) return;
      try {
        await api(`/api/bets/${betId}/stakes/${btn.dataset.retractStake}`, { method: "DELETE" });
        toast("Stake retracted", "success");
        await viewBetDetail(betId);
      } catch (err) {
        toast(err.message, "error");
      }
    };
  });

  startPolling(group.id, group.latest_event_id, () => softRefresh(() => viewBetDetail(betId)));
}

// ---- views: chat ---------------------------------------------------------

function fmtClockTime(iso) {
  const d = parseServerDate(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

async function renderChatView({ apiBase, title, backHref, backLabel, isModerator }) {
  setTitle(title);
  setApp(skeletonView(1));
  const messages = await api(`${apiBase}?after_id=0`);
  let lastId = messages.length ? messages[messages.length - 1].id : 0;
  const user = getUser();

  function messageRow(m) {
    const mine = m.user_id === user.id;
    const canDelete = mine || isModerator;
    return `
      <div class="chat-message${mine ? " mine" : ""}" data-msg-id="${m.id}">
        ${avatarHtml(m.display_name, "sm")}
        <div class="chat-bubble">
          <div class="chat-meta">
            <span class="chat-author">${escapeHtml(m.display_name)}</span>
            <span class="chat-time">${fmtClockTime(m.created_at)}</span>
            ${canDelete ? `<button class="ghost icon-btn chat-delete" data-delete-msg="${m.id}" title="Delete">${icon("x", 11)}</button>` : ""}
          </div>
          <div class="chat-text">${escapeHtml(m.message)}</div>
        </div>
      </div>
    `;
  }

  setApp(`
    <a href="${backHref}" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} ${escapeHtml(backLabel)}</a>
    <div class="card chat-card">
      <h1 class="row" style="gap:8px;">${icon("chat", 20)} ${escapeHtml(title)}</h1>
      <div id="chat-messages" class="chat-messages">
        ${messages.length ? messages.map(messageRow).join("") : `<div class="empty-state">${icon("inbox", 24)}<p>No messages yet — say hi.</p></div>`}
      </div>
      <form id="chat-form" class="form-inline" style="margin-top:12px;">
        <input name="message" placeholder="Type a message…" maxlength="1000" autocomplete="off" required />
        <button type="submit">Send</button>
      </form>
      <div class="error" id="chat-error"></div>
    </div>
  `);

  const messagesEl = document.getElementById("chat-messages");
  messagesEl.scrollTop = messagesEl.scrollHeight;

  function isNearBottom() {
    return messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;
  }

  function wireDeleteButtons() {
    messagesEl.querySelectorAll("[data-delete-msg]").forEach((btn) => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.onclick = async () => {
        if (!confirm("Delete this message?")) return;
        try {
          await api(`${apiBase}/${btn.dataset.deleteMsg}`, { method: "DELETE" });
          btn.closest(".chat-message").remove();
        } catch (err) {
          toast(err.message, "error");
        }
      };
    });
  }
  wireDeleteButtons();

  async function poll() {
    let fresh;
    try {
      fresh = await api(`${apiBase}?after_id=${lastId}`);
    } catch {
      return;
    }
    if (!fresh.length) return;
    const stick = isNearBottom();
    const empty = messagesEl.querySelector(".empty-state");
    if (empty) empty.remove();
    fresh.forEach((m) => {
      messagesEl.insertAdjacentHTML("beforeend", messageRow(m));
      lastId = m.id;
    });
    wireDeleteButtons();
    if (stick) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  document.getElementById("chat-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const message = (f.get("message") || "").trim();
    if (!message) return;
    const input = e.target.querySelector('input[name="message"]');
    input.value = "";
    try {
      await api(apiBase, { method: "POST", body: { message } });
      document.getElementById("chat-error").textContent = "";
      await poll();
    } catch (err) {
      input.value = message;
      document.getElementById("chat-error").textContent = err.message;
    }
  };

  chatPollTimer = setInterval(poll, CHAT_POLL_INTERVAL_MS);
}

async function viewGlobalChat() {
  await renderChatView({
    apiBase: "/api/chat/global",
    title: "Global chat",
    backHref: "#/groups",
    backLabel: "All groups",
    isModerator: false,
  });
}

async function viewGroupChat(groupId) {
  setApp(skeletonView(1));
  const group = await api(`/api/groups/${groupId}`);
  const user = getUser();
  await renderChatView({
    apiBase: `/api/groups/${groupId}/chat`,
    title: `${group.name} chat`,
    backHref: `#/groups/${groupId}`,
    backLabel: group.name,
    isModerator: group.leader_id === user.id,
  });
}
