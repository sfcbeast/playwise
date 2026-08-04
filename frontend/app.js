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

function setTitle(suffix) {
  document.title = suffix ? `${suffix} · Playwise` : "Playwise";
}

function renderUserBox() {
  const box = document.getElementById("user-box");
  const user = getUser();
  if (!user) { box.innerHTML = ""; return; }
  box.innerHTML = `
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
  const betMatch = hash.match(/^#\/bets\/(\d+)$/);

  try {
    if (hash === "#/login") return viewLogin();
    if (hash === "#/register") return viewRegister();
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
        <p class="tagline center">Join a group and start predicting.</p>
        <form id="register-form" class="stack">
          <input name="display_name" placeholder="Display name" required />
          <input name="username" placeholder="Username" autocomplete="username" required minlength="3" />
          <input name="password" type="password" placeholder="Password (6+ characters)" autocomplete="new-password" required minlength="6" />
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
            <div class="meta"><div class="primary">${escapeHtml(g.name)}</div></div>
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
  const group = await api(`/api/groups/${groupId}`);
  setTitle(group.name);
  const user = getUser();
  const isLeader = group.leader_id === user.id;

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
        <span class="amount">${fmtCoins(m.balance)}</span>
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

  const openBets = group.bets.filter((b) => b.status === "open");
  const resolvedBets = group.bets.filter((b) => b.status !== "open");

  function betRow(b) {
    const total = b.option_totals.reduce((a, c) => a + c, 0);
    const leaderPct = total ? Math.round((Math.max(...b.option_totals) / total) * 100) : 0;
    const leaderIdx = b.option_totals.indexOf(Math.max(...b.option_totals));
    const countdown = b.status === "open" && b.closes_at ? formatCountdown(b.closes_at) : null;
    return `
      <a class="list-item clickable" href="#/bets/${b.id}">
        <div class="identity" style="flex:1;min-width:0;">
          <div class="meta" style="flex:1;min-width:0;">
            <div class="primary" style="white-space:normal;">${escapeHtml(b.question)}</div>
            <div class="secondary row" style="gap:8px;margin-top:4px;">
              <span>${fmtCoins(total)} staked</span>
              ${total ? `<span style="color:${optionColor(leaderIdx)}">${escapeHtml(b.options[leaderIdx])} ${leaderPct}%</span>` : ""}
            </div>
          </div>
        </div>
        <span class="row" style="gap:6px;">
          ${countdown ? `<span class="badge countdown${countdown.closed ? " closed" : ""}" data-closes-at="${b.closes_at}">${icon("clock", 12)} ${countdown.text}</span>` : ""}
          <span class="badge ${b.status}">${b.status === "open" ? icon("clock", 12) : icon("trophy", 12)} ${b.status}</span>
        </span>
      </a>
    `;
  }

  setApp(`
    <a href="#/groups" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} All groups</a>

    <div class="card balance-hero">
      <div class="row between">
        <div>
          <div class="balance-label">${escapeHtml(group.name)}</div>
          <div class="balance">${fmtCoins(group.my_balance)}<span class="unit">coins</span></div>
        </div>
        ${icon("wallet", 26)}
      </div>
      <div class="invite-pill section-gap">
        ${icon("key", 14)} <code>${escapeHtml(group.invite_code)}</code>
        <button class="ghost small" id="copy-invite-btn">${icon("copy", 13)} Copy</button>
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
    </div>

    <div class="card">
      <h3 class="card-title">${icon("bolt", 16)} New question</h3>
      <form id="bet-form" class="stack">
        <input name="question" placeholder="What's the question?" required />
        <div id="options-container" class="stack">
          <div class="option-input-row"><input name="option" placeholder="Option 1" required /></div>
          <div class="option-input-row"><input name="option" placeholder="Option 2" required /></div>
        </div>
        <button type="button" class="secondary small" id="add-option-btn" style="align-self:flex-start;">${icon("plus", 14)} Add option</button>

        <label class="field-label">${icon("clock", 12)} Closes at (optional)</label>
        <input type="datetime-local" name="closes_at" id="bet-closes-at" />
        <div class="row">
          <button type="button" class="chip" data-closes-in="1">+1h</button>
          <button type="button" class="chip" data-closes-in="6">+6h</button>
          <button type="button" class="chip" data-closes-in="24">+1d</button>
          <button type="button" class="chip" data-closes-in="72">+3d</button>
          <button type="button" class="chip" data-closes-in="168">+1w</button>
          <button type="button" class="chip" data-closes-in="clear">No deadline</button>
        </div>
        <p class="hint" style="margin-top:-4px;">If set, no one can stake after this time — you can still resolve whenever the outcome's known.</p>

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
  `);

  document.getElementById("copy-invite-btn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      toast("Invite code copied", "success");
    } catch {
      toast("Couldn't copy — copy it manually", "error");
    }
  };

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

  document.getElementById("bet-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const question = f.get("question");
    const options = f.getAll("option").map((o) => o.trim()).filter(Boolean);
    const closesAtLocal = f.get("closes_at");
    const closes_at = closesAtLocal ? new Date(closesAtLocal).toISOString() : null;
    try {
      const bet = await api(`/api/groups/${groupId}/bets`, {
        method: "POST",
        body: { question, options, closes_at },
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
  setTitle(bet.question);
  const user = getUser();
  const isLeader = group.leader_id === user.id;
  const total = bet.option_totals.reduce((a, c) => a + c, 0);
  const countdown = bet.status === "open" && bet.closes_at ? formatCountdown(bet.closes_at) : null;
  const stakingClosed = bet.status !== "open" || (countdown && countdown.closed);

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
          <span class="amount">${fmtCoins(s.amount)}</span>
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
      <div class="row between" style="align-items:flex-start;">
        <h1>${escapeHtml(bet.question)}</h1>
        <span class="row" style="gap:6px;">
          ${countdown ? `<span class="badge countdown${countdown.closed ? " closed" : ""}" data-closes-at="${bet.closes_at}">${icon("clock", 12)} ${countdown.text}</span>` : ""}
          <span class="badge ${bet.status}">${bet.status === "open" ? icon("clock", 12) : icon("trophy", 12)} ${bet.status}</span>
        </span>
      </div>
      <p class="muted" style="margin:2px 0 14px;">${fmtCoins(total)} coins staked total</p>
      ${winnerBanner}
      ${optionsHtml}
    </div>

    ${payoutsHtml}

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
        <p class="muted" style="margin:0;">The deadline for staking on this question has passed. ${isLeader ? "Resolve it below once the outcome's known." : "Waiting on the leader to resolve it."}</p>
      </div>
    ` : ""}

    <div class="card">
      <h3 class="card-title">${icon("wallet", 16)} Your stakes</h3>
      ${myStakesHtml}
    </div>

    ${isLeader && bet.status === "open" ? `
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

  startPolling(group.id, group.latest_event_id, () => softRefresh(() => viewBetDetail(betId)));
}
