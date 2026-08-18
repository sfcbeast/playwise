// Moved here from an inline <script> in index.html so the CSP's script-src
// can stay 'self' only (no 'unsafe-inline') -- an inline script tag would
// otherwise force weakening that policy just for this one registration call.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

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
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  powerOff: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
};

function icon(name, size = 18) {
  return `<span class="icon" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ""}</svg>
  </span>`;
}

// ---- avatars ---------------------------------------------------------------

const AVATAR_PALETTE = ["#5b8cff", "#7c6cff", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#f472b6", "#a78bfa"];
const OPTION_PALETTE = ["#5b8cff", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#22d3ee", "#f472b6", "#fb923c"];

// A fun little critter/face set for avatars -- picked once per person (hashed
// from their name, so it's stable across visits/devices, not re-rolled on
// every render) rather than fetched from a third-party avatar service.
// Deliberately only single-codepoint, emoji-presentation-default glyphs
// here (no variation selectors, no ZWJ sequences) -- those render
// inconsistently across platforms/fonts and one (the old chipmunk pick)
// showed up as a blank circle in testing.
const AVATAR_EMOJI = [
  "🦊", "🐼", "🐨", "🦁", "🐸", "🐙", "🦄", "🐢", "🐬", "🐧", "🐝", "🐰",
  "🐳", "🐱", "🐶", "🦒", "🦓", "🐹", "🐯", "🐵", "🐴", "🐮", "🐷", "🦆",
];

// Mirrors backend GROUP_CATEGORIES exactly -- keep in sync with
// schemas.py's GROUP_CATEGORIES if this list ever changes.
const GROUP_CATEGORIES = [
  { value: "general", label: "General", emoji: "💬" },
  { value: "sports", label: "Sports", emoji: "🏀" },
  { value: "politics", label: "Politics", emoji: "🏛️" },
  { value: "current_affairs", label: "Current Affairs", emoji: "📰" },
  { value: "stocks", label: "Stocks", emoji: "📈" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
];

function categoryLabel(value) {
  const cat = GROUP_CATEGORIES.find((c) => c.value === value);
  return cat ? `${cat.emoji} ${cat.label}` : null;
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function avatarHtml(name, size = "") {
  // hashSeed forces unsigned via `>>> 0`, so derived shifts must use the
  // unsigned operator too (`>>>`, not `>>`) -- for a seed above 2^31, a
  // signed shift flips it negative and produces a negative array index
  // (silently `undefined`, rendering a blank avatar).
  const seed = hashSeed(name || "?");
  const color = AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
  const color2 = AVATAR_PALETTE[(seed >>> 3) % AVATAR_PALETTE.length];
  const emoji = AVATAR_EMOJI[(seed >>> 5) % AVATAR_EMOJI.length];
  const tilt = (((seed >>> 8) % 7) - 3) * 1.4; // fixed per-person, ~-4.2deg..+4.2deg
  return `<span class="avatar ${size}" title="${escapeHtml(name || "?")}" style="background:linear-gradient(135deg, ${color}, ${color2});--tilt:${tilt}deg">${emoji}</span>`;
}

function optionColor(i) { return OPTION_PALETTE[i % OPTION_PALETTE.length]; }

// ---- votes ---------------------------------------------------------------

function voteCardHtml(vote, canVote = true) {
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
      ${canVote ? `
        <div class="row">
          <button class="chip vote-yes${vote.my_choice === "yes" ? " active" : ""}" data-vote-ballot="${vote.id}" data-choice="yes">${icon("check", 13)} Yes</button>
          <button class="chip vote-no${vote.my_choice === "no" ? " active" : ""}" data-vote-ballot="${vote.id}" data-choice="no">${icon("x", 13)} No</button>
        </div>
      ` : ""}
    </div>
  `;
}

function wireVoteBallots(onDone) {
  document.querySelectorAll("[data-vote-ballot]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api(`/api/votes/${btn.dataset.voteBallot}/ballot`, { method: "POST", body: { choice: btn.dataset.choice } });
        toast("Vote's in", "success");
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

// Native OS share sheet where available (basically all of mobile, plus
// desktop Chrome/Edge/Safari) -- falls back to a clipboard copy anywhere
// it isn't, so this never just silently does nothing.
async function shareOrCopy({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      if (err && err.name === "AbortError") return false; // user cancelled the share sheet
      // fall through to clipboard on any other failure
    }
  }
  try {
    await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
    toast("Copied to clipboard", "success");
    return true;
  } catch {
    toast("Couldn't share — copy it manually", "error");
    return false;
  }
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

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ---- personality: greetings & varied copy ---------------------------
// Small touches so the app reads like someone wrote it, not like it
// generated its own strings -- a time-aware greeting and a few pools of
// friendly phrasing picked at random each time, instead of one static
// label repeated forever.

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Burning the midnight oil";
}

const GROUPS_SUBTITLES = [
  "Ready to call some outcomes?",
  "Who's feeling lucky today?",
  "Let's see who actually knows what they're talking about.",
  "Put your coins where your mouth is.",
  "Fresh predictions, fresh coins.",
];

const NO_GROUPS_MESSAGES = [
  "No groups yet — create one below, or ask a friend for an invite code.",
  "Empty in here. Start a group and drag your friends into it.",
  "Nothing yet — every good prediction market starts with one group.",
];

const NO_BETS_MESSAGES = [
  "Nothing brewing yet — be the first to ask something.",
  "Quiet in here. Got a hot take? Turn it into a question.",
  "No open questions — the floor is yours.",
];

// Animates a balance number counting up/down to its new value instead of
// just snapping -- but only when it's an actual change the user should
// notice (a stake landing, a top-up, a payout). First time a group's
// balance is shown this session it's just displayed outright; animating a
// "count up from 0" on every visit would get old fast for something opened
// this often.
const balanceCache = new Map();

function animateCountUp(el, from, to, duration = 700) {
  const start = performance.now();
  const diff = to - from;
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmtCoins(Math.round(from + diff * eased));
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = fmtCoins(to);
  }
  requestAnimationFrame(frame);
}

function renderBalanceNumber(el, cacheKey, value) {
  const prev = balanceCache.get(cacheKey);
  balanceCache.set(cacheKey, value);
  if (prev === undefined || prev === value) {
    el.textContent = fmtCoins(value);
    return;
  }
  animateCountUp(el, prev, value);
}

// Tactile click feedback on every button -- a small ripple from the click
// point, same idea as Material's, done with a plain absolutely-positioned
// span rather than a library. Delegated on document so it covers buttons
// added by any view without each render site having to wire it up.
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || btn.disabled) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.4;
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
});

// A smaller, quicker burst than the win confetti -- for a satisfying "your
// stake landed" moment without going as big as an actual win celebration.
function sparkleBurst(originEl) {
  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const particles = Array.from({ length: 26 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3.5;
    return {
      x: originX, y: originY,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: 2 + Math.random() * 2.5,
      color: OPTION_PALETTE[Math.floor(Math.random() * OPTION_PALETTE.length)],
    };
  });
  const duration = 650;
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    const fade = Math.max(0, 1 - elapsed / duration);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (elapsed < duration && canvas.isConnected) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

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

// ---- push notifications ---------------------------------------------

const PUSH_SUPPORTED = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// A VAPID public key arrives as URL-safe base64 text; PushManager.subscribe
// wants it as a raw byte array. Standard conversion, same as it appears in
// every Web Push writeup.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function refreshPushButtonState(btn) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    btn.classList.toggle("active", !!sub);
    btn.title = sub ? "Notifications on — click to turn off" : "Turn on notifications";
  } catch {
    // Service worker not ready yet or some other transient issue -- leave
    // the button in its default state rather than blocking the topbar render.
  }
}

async function togglePushSubscription(btn) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
      await api("/api/push/unsubscribe", { method: "POST", body: { endpoint: existing.endpoint } });
      toast("Notifications turned off", "success");
      refreshPushButtonState(btn);
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast("Notifications need permission — check your browser settings", "error");
      return;
    }
    const { public_key, enabled } = await api("/api/push/vapid-public-key");
    if (!enabled) {
      toast("Notifications aren't set up on this server yet", "error");
      return;
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key),
    });
    await api("/api/push/subscribe", {
      method: "POST",
      body: {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64Url(sub.getKey("p256dh")),
          auth: arrayBufferToBase64Url(sub.getKey("auth")),
        },
      },
    });
    toast("Notifications enabled", "success");
    refreshPushButtonState(btn);
  } catch (err) {
    toast(`Couldn't enable notifications: ${err.message}`, "error");
  }
}

function renderUserBox() {
  const box = document.getElementById("user-box");
  const user = getUser();
  if (!user) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <a class="ghost nav-link" href="#/discover" title="Discover public groups">${icon("globe", 17)}<span class="nav-link-text">Discover</span></a>
    <a class="ghost nav-link" href="#/chat" title="Global chat">${icon("chat", 17)}<span class="nav-link-text">Chat</span></a>
    ${user.is_admin ? `<a class="ghost nav-link" href="#/admin" title="Admin dashboard">${icon("layout", 17)}<span class="nav-link-text">Admin</span></a>` : ""}
    <span class="name">${escapeHtml(user.display_name)}${user.is_superadmin ? ` <span class="badge god-badge" title="Full access to every group, joined or not">GOD</span>` : ""}</span>
    ${avatarHtml(user.display_name, "sm")}
    ${PUSH_SUPPORTED ? `<button class="ghost icon-btn" id="push-toggle-btn" title="Notifications">${icon("bell", 17)}</button>` : ""}
    <button class="ghost icon-btn" id="recovery-code-btn" title="Get account recovery code">${icon("shield", 17)}</button>
    <button class="ghost icon-btn" id="logout-everywhere-btn" title="Log out of all devices">${icon("powerOff", 17)}</button>
    <button class="ghost icon-btn" id="logout-btn" title="Log out">${icon("logout", 17)}</button>
  `;
  if (PUSH_SUPPORTED) {
    const pushBtn = document.getElementById("push-toggle-btn");
    refreshPushButtonState(pushBtn);
    pushBtn.onclick = () => togglePushSubscription(pushBtn);
  }
  document.getElementById("recovery-code-btn").onclick = async () => {
    if (!confirm("Generate a new account recovery code? Any code you saved before this will stop working.")) return;
    try {
      const { recovery_code } = await api("/api/account/recovery-code", { method: "POST" });
      const returnHash = location.hash || "#/groups";
      renderRecoveryCodeScreen(recovery_code, () => { location.hash = returnHash; render(); });
    } catch (err) {
      toast(err.message, "error");
    }
  };
  document.getElementById("logout-everywhere-btn").onclick = async () => {
    if (!confirm("Log out of every device signed into this account, including this one? You'll need to log back in here too.")) return;
    try {
      await api("/api/account/logout-everywhere", { method: "POST" });
      clearAuth();
      location.hash = "#/login";
      toast("Logged out everywhere", "success");
    } catch (err) {
      toast(err.message, "error");
    }
  };
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

  // A shared join link needs to survive the trip through registration --
  // stash the code before the logged-out gate below would otherwise bounce
  // a new visitor straight to a generic login screen with no memory of why
  // they clicked the link in the first place.
  const joinLinkMatch = hash.match(/^#\/join\/([a-zA-Z0-9]+)$/);
  if (joinLinkMatch && !user) {
    localStorage.setItem("pp_pending_invite", joinLinkMatch[1]);
    location.hash = "#/register";
    return;
  }

  const loggedOutRoutes = ["#/login", "#/register", "#/forgot-password"];
  // Accessible whether signed in or not, with no redirect either way -- a
  // legal document has to be reachable by someone who hasn't made an
  // account yet (an ad reviewer, a link from an app store listing), not
  // just existing users.
  const publicRoutes = ["#/privacy"];
  if (!user && !loggedOutRoutes.includes(hash) && !publicRoutes.includes(hash)) {
    location.hash = "#/login";
    return;
  }
  if (user && loggedOutRoutes.includes(hash)) {
    location.hash = "#/groups";
    return;
  }

  const groupMatch = hash.match(/^#\/groups\/(\d+)$/);
  const groupChatMatch = hash.match(/^#\/groups\/(\d+)\/chat$/);
  const betMatch = hash.match(/^#\/bets\/(\d+)$/);

  try {
    if (hash === "#/login") return viewLogin();
    if (hash === "#/register") return viewRegister();
    if (hash === "#/forgot-password") return viewForgotPassword();
    if (hash === "#/privacy") return viewPrivacyPolicy();
    if (joinLinkMatch) return await viewJoinByCode(joinLinkMatch[1]);
    if (hash === "#/chat") return await viewGlobalChat();
    if (hash === "#/discover") return await viewDiscover();
    if (hash === "#/admin") return await viewAdminDashboard();
    if (hash === "#/admin/reports") return await viewAdminReports();
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
        <p class="center muted" style="margin-top:4px;"><a href="#/forgot-password">Forgot your password?</a></p>
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
      setAuth(data.access_token, { id: data.user_id, username: data.username, display_name: data.display_name, is_admin: data.is_admin, is_superadmin: data.is_superadmin });
      toast(`Welcome back, ${data.display_name}`, "success");
      await consumePendingInviteThenNavigate();
    } catch (err) {
      document.getElementById("login-error").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  };
}

// Shown once right after a recovery code is (re)generated -- at
// registration, after a successful reset, or from the account menu.
// Forces an explicit "I've saved it" click rather than auto-navigating,
// since this is the only copy of the code the user will ever see.
function renderRecoveryCodeScreen(code, onContinue) {
  setTitle("Save your recovery code");
  setApp(`
    <div class="auth-shell">
      <div class="card">
        <div class="brand-mark">${icon("shield", 20)}</div>
        <h1 class="center">Save your recovery code</h1>
        <p class="tagline center">This is the only way back into your account if you forget your password — we can't show it again.</p>
        <div class="recovery-code-box">${escapeHtml(code)}</div>
        <button type="button" class="secondary" id="copy-recovery-btn">${icon("copy", 15)} Copy code</button>
        <label class="terms-check section-gap">
          <input type="checkbox" id="recovery-saved-check" style="width:auto;" required />
          <span>I've saved this code somewhere safe</span>
        </label>
        <button type="button" id="recovery-continue-btn" disabled>Continue</button>
      </div>
    </div>
  `);
  document.getElementById("copy-recovery-btn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Recovery code copied", "success");
    } catch {
      toast("Couldn't copy — copy it manually", "error");
    }
  };
  const savedCheck = document.getElementById("recovery-saved-check");
  const continueBtn = document.getElementById("recovery-continue-btn");
  savedCheck.onchange = () => { continueBtn.disabled = !savedCheck.checked; };
  continueBtn.onclick = onContinue;
}

function viewForgotPassword() {
  setTitle("Forgot password");
  setApp(`
    <div class="auth-shell">
      <div class="card">
        <div class="brand-mark">${icon("shield", 20)}</div>
        <h1 class="center">Reset your password</h1>
        <p class="tagline center">Enter your username and the recovery code you saved when you signed up.</p>
        <form id="forgot-form" class="stack">
          <input name="username" placeholder="Username" autocomplete="username" required />
          <input name="recovery_code" placeholder="Recovery code (XXXX-XXXX-XXXX)" autocomplete="off" required />
          <input name="new_password" type="password" placeholder="New password (6+ characters)" autocomplete="new-password" required minlength="6" />
          <div class="error" id="forgot-error"></div>
          <button type="submit">Reset password</button>
        </form>
        <p class="center muted section-gap">Remembered it? <a href="#/login">Log in</a></p>
        <p class="center muted" style="font-size:0.8rem;margin-top:10px;">No recovery code saved? There's no email on file to reset through — you'll need to create a new account.</p>
      </div>
    </div>
  `);
  document.getElementById("forgot-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      const data = await api("/api/reset-password", {
        method: "POST",
        body: {
          username: f.get("username"),
          recovery_code: f.get("recovery_code").trim(),
          new_password: f.get("new_password"),
        },
      });
      setAuth(data.access_token, { id: data.user_id, username: data.username, display_name: data.display_name, is_admin: data.is_admin, is_superadmin: data.is_superadmin });
      toast("Password reset", "success");
      renderRecoveryCodeScreen(data.recovery_code, () => { location.hash = "#/groups"; });
    } catch (err) {
      document.getElementById("forgot-error").textContent = err.message;
      btn.disabled = false;
    }
  };
}

function viewPrivacyPolicy() {
  setTitle("Privacy Policy");
  const user = getUser();
  const backHref = user ? "#/groups" : "#/login";
  const backLabel = user ? "Back to Playwise" : "Back to login";
  setApp(`
    <a href="${backHref}" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} ${backLabel}</a>
    <div class="card">
      <h1 class="row" style="gap:8px;">${icon("shield", 20)} Privacy Policy</h1>
      <div class="squiggle"></div>
      <p class="muted" style="font-size:0.85rem;">Last updated August 2026</p>

      <h3 class="card-title" style="margin-top:22px;">What Playwise is</h3>
      <p>Playwise is a social prediction game — friends form groups, stake play-money coins on the outcome of questions they post, and split the pool when a question resolves. Coins have no real-world value and can never be bought, sold, or redeemed for cash. This policy explains what information we collect to run the app and how it's used.</p>

      <h3 class="card-title" style="margin-top:22px;">Information we collect</h3>
      <p><strong>Account information:</strong> your username, display name, and password. Your password is stored as an irreversible bcrypt hash — we never store or have access to the plain text. If you save an account-recovery code, it's stored the same way (hashed), and shown to you in full only once, at the moment it's generated.</p>
      <p><strong>Activity you generate:</strong> the groups you create or join, questions you post, predictions and stakes you make, chat messages, and your coin balance/transaction history. This is the core data the app needs to function — there's no way to use Playwise without it.</p>
      <p><strong>Push notifications (optional):</strong> if you turn these on, your browser gives us a subscription endpoint and encryption keys, which we use only to deliver notifications from this app. Nothing is sent if you don't enable this.</p>
      <p><strong>Technical data:</strong> we use IP addresses briefly, in server memory only, to rate-limit abusive behavior (like repeated login attempts). This is never written to our database and doesn't persist across a server restart.</p>

      <h3 class="card-title" style="margin-top:22px;">Cookies &amp; advertising</h3>
      <p>Playwise itself doesn't use tracking cookies — you stay signed in via a token stored in your browser, not a cookie. Playwise shows ads served by Google AdSense, which may use cookies and similar technology to personalize ads and measure their performance. That data is handled under Google's own privacy policy, and you can review or adjust your ad personalization settings at <span style="word-break:break-all;">adssettings.google.com</span>.</p>

      <h3 class="card-title" style="margin-top:22px;">How we use this information</h3>
      <p>To operate and maintain the app, prevent abuse and spam, review content that's been reported to moderators, send notifications you've opted into, and — once approved — serve ads through Google AdSense. We don't use your data for anything beyond running Playwise.</p>

      <h3 class="card-title" style="margin-top:22px;">What we don't do</h3>
      <p>We don't sell your personal information, and we don't share it with third parties beyond the service providers necessary to run Playwise (our hosting provider, database provider, and Google AdSense once ads are live).</p>

      <h3 class="card-title" style="margin-top:22px;">Data retention &amp; deletion</h3>
      <p>We keep your information for as long as your account exists. You can request deletion of your account and associated data at any time by emailing us at the address below — note that some records shared with other people (like messages you sent in a group, or transactions tied to a group's shared history) may not be fully removable without affecting other members' records, similar to most group-based apps.</p>

      <h3 class="card-title" style="margin-top:22px;">Age requirement</h3>
      <p>Playwise is intended for users 18 and older, and account creation requires confirming this. We don't knowingly collect information from anyone under 18.</p>

      <h3 class="card-title" style="margin-top:22px;">Changes to this policy</h3>
      <p>If this policy changes, we'll update the date at the top of this page. Continuing to use Playwise after a change means you accept the updated policy.</p>

      <h3 class="card-title" style="margin-top:22px;">Contact</h3>
      <p>Questions, or want your data deleted? Email <a href="mailto:suryavamsid15@gmail.com">suryavamsid15@gmail.com</a>.</p>
    </div>
  `);
}

// After a successful login/register, joins whatever group a shared invite
// link (#/join/CODE) queued up before bouncing the visitor through auth --
// this is what makes "come see, I just won" a real one-click flow instead
// of "here's a code, go type it in yourself."
async function consumePendingInviteThenNavigate() {
  const code = localStorage.getItem("pp_pending_invite");
  if (!code) {
    location.hash = "#/groups";
    return;
  }
  localStorage.removeItem("pp_pending_invite");
  try {
    const g = await api("/api/groups/join", { method: "POST", body: { invite_code: code } });
    toast(`You're in — welcome to "${g.name}"`, "success");
    location.hash = `#/groups/${g.id}`;
  } catch (err) {
    toast(`That invite link didn't work: ${err.message}`, "error");
    location.hash = "#/groups";
  }
}

async function viewJoinByCode(code) {
  setTitle("Joining…");
  setApp(skeletonView(1));
  try {
    const g = await api("/api/groups/join", { method: "POST", body: { invite_code: code } });
    toast(`You're in — welcome to "${g.name}"`, "success");
    location.hash = `#/groups/${g.id}`;
  } catch (err) {
    toast(`That invite link didn't work: ${err.message}`, "error");
    location.hash = "#/groups";
  }
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
            <span>I'm 18 or older and understand Playwise coins are play money only — they have no cash value and can never be bought, sold, or redeemed for real currency. I've read the <a href="#/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span>
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
      setAuth(data.access_token, { id: data.user_id, username: data.username, display_name: data.display_name, is_admin: data.is_admin, is_superadmin: data.is_superadmin });
      toast(`Account created — welcome, ${data.display_name}`, "success");
      renderRecoveryCodeScreen(data.recovery_code, consumePendingInviteThenNavigate);
    } catch (err) {
      document.getElementById("register-error").textContent = err.message;
      btn.disabled = false;
    }
  };
}

// ---- views: groups -------------------------------------------------------

async function viewGroups() {
  setTitle();
  setApp(skeletonView(2));
  const user = getUser();
  // The god account has no real memberships by design (see the superadmin
  // bypass in get_membership_or_403) -- "Your groups" would always be empty
  // for it otherwise, even though it can open any of them. Show every group
  // instead, private included, sourced from the same endpoint the admin
  // dashboard uses.
  const groups = await api(user.is_superadmin ? "/api/admin/groups?limit=200" : "/api/groups");

  // Group creation now blocks a user from naming a new group the same as
  // one they're already in, but a name collision can still happen via
  // invite-code joins (or groups created before that check existed) -- when
  // it does, tag each colliding entry with its invite code so they're not
  // visually identical in this list.
  const nameCounts = {};
  groups.forEach((g) => {
    const key = g.name.trim().toLowerCase();
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  });

  const groupsHtml = groups.length
    ? groups.map((g) => user.is_superadmin ? `
        <a class="list-item clickable" href="#/groups/${g.id}">
          <div class="identity">
            ${avatarHtml(g.name)}
            <div class="meta">
              <div class="primary">${escapeHtml(g.name)}</div>
              <div class="secondary">led by ${escapeHtml(g.leader_display_name)} · ${g.member_count} member${g.member_count === 1 ? "" : "s"}</div>
            </div>
          </div>
          <span class="row" style="gap:8px;">
            ${g.is_public ? `<span class="badge">${escapeHtml(categoryLabel(g.category) || "🌐 Public")}</span>` : `<span class="secondary" style="font-size:0.78rem;">private</span>`}
          </span>
        </a>
      ` : `
        <a class="list-item clickable" href="#/groups/${g.id}">
          <div class="identity">
            ${avatarHtml(g.name)}
            <div class="meta">
              <div class="primary">${escapeHtml(g.name)}${nameCounts[g.name.trim().toLowerCase()] > 1 ? ` <span class="muted" style="font-weight:400;font-size:0.8em;">#${escapeHtml(g.invite_code)}</span>` : ""}</div>
              ${g.parent_group_name ? `<div class="secondary">↳ inside ${escapeHtml(g.parent_group_name)}</div>` : ""}
            </div>
          </div>
          <span class="row" style="gap:8px;">
            ${g.is_public ? `<span class="badge">${escapeHtml(categoryLabel(g.category) || "🌐 Public")}</span>` : ""}
            <span class="amount">${fmtCoins(g.my_balance)}</span>
          </span>
        </a>
      `).join("")
    : `<div class="empty-state">${icon("users", 28)}<p>${escapeHtml(pick(NO_GROUPS_MESSAGES))}</p></div>`;

  setApp(`
    <div class="card">
      <div class="greeting-eyebrow">${timeGreeting()}, ${escapeHtml(user.display_name)} 👋</div>
      <h1 class="row" style="gap:8px;">${icon("bolt", 20)} ${user.is_superadmin ? "All groups" : "Your groups"}</h1>
      <div class="squiggle"></div>
      <p class="muted greeting-subtitle">${user.is_superadmin ? "Every group on Playwise, private included — you have full access without joining." : pick(GROUPS_SUBTITLES)}</p>
      <div class="section-gap"></div>
      ${groupsHtml}
    </div>

    ${!groups.length && !user.is_superadmin ? `
      <div class="card onboarding-card">
        <h3 class="card-title">${icon("bolt", 16)} How Playwise works</h3>
        <div class="onboarding-step">
          <span class="onboarding-num">1</span>
          <div><strong>Create or join a group</strong><p class="muted">Start one with friends, or find a public one in Discover.</p></div>
        </div>
        <div class="onboarding-step">
          <span class="onboarding-num">2</span>
          <div><strong>Ask a question, stake your coins</strong><p class="muted">"Will it rain Saturday?" — pick a side, put some coins on it.</p></div>
        </div>
        <div class="onboarding-step">
          <span class="onboarding-num">3</span>
          <div><strong>When it resolves, winners split the pool</strong><p class="muted">Everyone who called it right splits the whole pot, in proportion to what they staked. Play money only — nothing real ever changes hands.</p></div>
        </div>
      </div>
    ` : ""}

    <a href="#/discover" class="card discover-banner clickable-card">
      <div class="row between">
        <div class="row" style="gap:12px;">
          ${icon("globe", 24)}
          <div>
            <div class="primary" style="font-weight:750;">Discover public groups</div>
            <div class="secondary" style="font-size:0.85rem;">Sports, politics, stocks, and more — search and jump in</div>
          </div>
        </div>
        ${icon("search", 18)}
      </div>
    </a>

    <a href="#/chat" class="card chat-banner clickable-card">
      <div class="row between">
        <div class="row" style="gap:12px;">
          ${icon("chat", 24)}
          <div>
            <div class="primary" style="font-weight:750;">Global chat</div>
            <div class="secondary" style="font-size:0.85rem;">Everyone on Playwise, one room — say something</div>
          </div>
        </div>
        ${icon("arrowLeft", 16)}
      </div>
    </a>

    ${adSlot("groups-top", "728x90 leaderboard")}
    <div class="card">
      <h3 class="card-title">${icon("plus", 16)} Create a group</h3>
      <form id="create-group-form" class="stack">
        <input name="name" placeholder="Group name" required />
        <label class="terms-check">
          <input type="checkbox" id="public-toggle" style="width:auto;" />
          <span>${icon("globe", 14)} Make this a public group — anyone can find and join it from Discover</span>
        </label>
        <div id="public-options" class="stack" style="display:none;">
          <select name="category" id="category-select">
            ${GROUP_CATEGORIES.map((c) => `<option value="${c.value}">${c.emoji} ${c.label}</option>`).join("")}
          </select>
          <textarea name="rules" placeholder="Rules for new joiners (optional) — e.g. be respectful, no spam, stakes are final" rows="3"></textarea>
          <label class="field-label">${icon("wallet", 12)} Starting balance for new members (optional)</label>
          <input type="number" name="starting_balance" min="0" step="1" placeholder="e.g. 10000 — leave blank to start everyone at 0" />
          <p class="hint" style="margin:0;">If set, everyone (including you) starts even — no manual top-ups needed before the first question.</p>
        </div>
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

  const publicToggle = document.getElementById("public-toggle");
  const publicOptions = document.getElementById("public-options");
  publicToggle.onchange = () => {
    publicOptions.style.display = publicToggle.checked ? "" : "none";
  };

  document.getElementById("create-group-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const is_public = publicToggle.checked;
    const startingBalanceRaw = f.get("starting_balance");
    try {
      const g = await api("/api/groups", {
        method: "POST",
        body: {
          name: f.get("name"),
          is_public,
          category: is_public ? f.get("category") : null,
          rules: is_public ? (f.get("rules") || null) : null,
          starting_balance: is_public && startingBalanceRaw ? Number(startingBalanceRaw) : null,
        },
      });
      toast(`"${g.name}" is up and running`, "success");
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
      toast(`You're in — welcome to "${g.name}"`, "success");
      location.hash = `#/groups/${g.id}`;
    } catch (err) {
      document.getElementById("join-group-error").textContent = err.message;
    }
  };
}

// ---- views: discover -------------------------------------------------

function discoverResultRow(g) {
  const joinBtnOrLink = g.is_member
    ? `<a href="#/groups/${g.id}" class="secondary small">Open</a>`
    : g.has_rules
      ? `<button class="secondary small" data-show-rules="${g.id}">Review & join</button>`
      : `<button class="secondary small" data-join-public="${g.id}">Join</button>`;

  return `
    <div class="card discover-card" data-discover-card="${g.id}">
      <div class="row between">
        <div class="identity">
          ${avatarHtml(g.name)}
          <div class="meta">
            <div class="primary">${escapeHtml(g.name)}</div>
            <div class="secondary">${categoryLabel(g.category) || "💬 General"} · ${g.member_count} member${g.member_count === 1 ? "" : "s"} · led by ${escapeHtml(g.leader_display_name)}</div>
          </div>
        </div>
        ${joinBtnOrLink}
      </div>
      <div class="row between" style="margin-top:8px;">
        ${g.starting_balance ? `<span class="badge">${icon("wallet", 11)} Starts with ${fmtCoins(g.starting_balance)} coins</span>` : "<span></span>"}
        <button class="ghost icon-btn" data-report-group="${g.id}" title="Report this group">${icon("flag", 12)}</button>
      </div>
      ${g.has_rules ? `
        <div class="rules-panel" id="rules-panel-${g.id}" style="display:none;">
          <div class="rules-text">${escapeHtml(g.rules)}</div>
          <label class="terms-check">
            <input type="checkbox" data-accept-rules="${g.id}" />
            <span>I've read the rules and agree to follow them</span>
          </label>
          <button class="small" data-confirm-join="${g.id}" disabled>Join group</button>
        </div>
      ` : ""}
    </div>
  `;
}

async function viewDiscover() {
  setTitle("Discover");
  setApp(skeletonView(3));

  let currentQuery = "";
  let currentCategory = "";

  async function loadResults() {
    const params = new URLSearchParams();
    if (currentQuery) params.set("q", currentQuery);
    if (currentCategory) params.set("category", currentCategory);
    const results = await api(`/api/groups/discover?${params.toString()}`);
    const resultsEl = document.getElementById("discover-results");
    resultsEl.innerHTML = results.length
      ? results.map(discoverResultRow).join("")
      : `<div class="empty-state">${icon("search", 24)}<p>Nothing matches yet — try a different search or category.</p></div>`;
    wireResultActions();
  }

  function wireResultActions() {
    document.querySelectorAll("[data-show-rules]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.showRules;
        document.getElementById(`rules-panel-${id}`).style.display = "";
        btn.style.display = "none";
      };
    });
    document.querySelectorAll("[data-accept-rules]").forEach((cb) => {
      cb.onchange = () => {
        const id = cb.dataset.acceptRules;
        document.querySelector(`[data-confirm-join="${id}"]`).disabled = !cb.checked;
      };
    });
    document.querySelectorAll("[data-join-public]").forEach((btn) => {
      btn.onclick = () => doJoin(btn.dataset.joinPublic, false, btn);
    });
    document.querySelectorAll("[data-confirm-join]").forEach((btn) => {
      btn.onclick = () => doJoin(btn.dataset.confirmJoin, true, btn);
    });
    document.querySelectorAll("[data-report-group]").forEach((btn) => {
      btn.onclick = () => reportContent("group", Number(btn.dataset.reportGroup));
    });
  }

  async function doJoin(groupId, acceptedRules, btn) {
    btn.disabled = true;
    try {
      const g = await api(`/api/groups/${groupId}/join-public`, {
        method: "POST",
        body: { accepted_rules: acceptedRules },
      });
      toast(`You're in — welcome to "${g.name}"`, "success");
      location.hash = `#/groups/${g.id}`;
    } catch (err) {
      toast(err.message, "error");
      btn.disabled = false;
    }
  }

  setApp(`
    <a href="#/groups" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} All groups</a>
    <div class="card">
      <h1 class="row" style="gap:8px;">${icon("globe", 20)} Discover</h1>
      <div class="squiggle"></div>
      <p class="muted greeting-subtitle section-gap">Public groups anyone can search and join.</p>
      <form id="discover-search-form" class="form-inline section-gap">
        <input name="q" placeholder="Search public groups…" autocomplete="off" />
        <button type="submit">${icon("search", 15)} Search</button>
      </form>
      <div class="row section-gap" id="category-chips">
        <button type="button" class="chip active" data-category="">All</button>
        ${GROUP_CATEGORIES.map((c) => `<button type="button" class="chip" data-category="${c.value}">${c.emoji} ${c.label}</button>`).join("")}
      </div>
    </div>
    <div id="discover-results">${skeletonView(2)}</div>
  `);

  document.getElementById("discover-search-form").onsubmit = async (e) => {
    e.preventDefault();
    currentQuery = new FormData(e.target).get("q") || "";
    await loadResults();
  };

  document.querySelectorAll("[data-category]").forEach((chip) => {
    chip.onclick = async () => {
      document.querySelectorAll("[data-category]").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentCategory = chip.dataset.category;
      await loadResults();
    };
  });

  await loadResults();
}

async function viewGroupDetail(groupId) {
  setTitle();
  setApp(skeletonView(3));
  const [group, votes] = await Promise.all([api(`/api/groups/${groupId}`), api(`/api/groups/${groupId}/votes`)]);
  setTitle(group.name);
  const user = getUser();
  const isLeader = group.leader_id === user.id || user.is_superadmin;
  const canParticipate = group.is_member;

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
            : user.is_superadmin
              ? `<a href="#/groups/${sg.id}" class="secondary small">View</a>`
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
          <div class="balance"><span id="balance-number"></span><span class="unit">coins</span></div>
        </div>
        ${icon("wallet", 26)}
      </div>
      <div class="row section-gap" style="gap:8px;">
        <div class="invite-pill">
          ${icon("key", 14)} <code>${escapeHtml(group.invite_code)}</code>
          <button class="ghost small" id="copy-invite-btn">${icon("copy", 13)} Copy</button>
        </div>
        <button class="secondary small" id="share-invite-btn">${icon("chat", 14)} Invite a friend</button>
        <a href="#/groups/${groupId}/chat" class="secondary small" style="display:inline-flex;align-items:center;gap:6px;">${icon("chat", 14)} Group chat</a>
        ${group.is_public ? `<span class="badge">${escapeHtml(categoryLabel(group.category) || "🌐 Public")}</span>` : ""}
      </div>
    </div>

    ${!isLeader && group.is_public && group.rules ? `
      <div class="card">
        <h3 class="card-title">${icon("shield", 16)} Group rules</h3>
        <p class="muted" style="white-space:pre-wrap;">${escapeHtml(group.rules)}</p>
      </div>
    ` : ""}

    ${isLeader ? `
      <div class="card">
        <h3 class="card-title">${icon("shield", 16)} Visibility & rules</h3>
        <form id="group-settings-form" class="stack">
          <label class="terms-check">
            <input type="checkbox" id="settings-public-toggle" style="width:auto;" ${group.is_public ? "checked" : ""} />
            <span>${icon("globe", 14)} Public — listed in Discover for anyone to search and join</span>
          </label>
          <div id="settings-public-options" class="stack" style="display:${group.is_public ? "" : "none"};">
            <select name="category" id="settings-category-select">
              ${GROUP_CATEGORIES.map((c) => `<option value="${c.value}" ${group.category === c.value ? "selected" : ""}>${c.emoji} ${c.label}</option>`).join("")}
            </select>
            <textarea name="rules" placeholder="Rules for new joiners (optional)" rows="3">${escapeHtml(group.rules || "")}</textarea>
            <label class="field-label">${icon("wallet", 12)} Starting balance for new members (optional)</label>
            <input type="number" name="starting_balance" min="0" step="1" placeholder="e.g. 10000 — leave blank to start at 0" value="${group.starting_balance ?? ""}" />
            <p class="hint" style="margin:0;">Only affects people who join from now on — nobody's current balance changes.</p>
          </div>
          <button type="submit" class="secondary small" style="align-self:flex-start;">Save</button>
        </form>
        <div class="error" id="group-settings-error"></div>
      </div>
    ` : ""}

    ${canParticipate ? `
      <div class="card">
        <h3 class="card-title">${icon("plus", 16)} Request a top-up</h3>
        <form id="topup-form" class="form-inline">
          <input name="amount" type="number" min="1" placeholder="Amount" required />
          <button type="submit">Request</button>
        </form>
        <div class="error" id="topup-error"></div>
      </div>
    ` : ""}

    ${isLeader ? `
      <div class="card">
        <h3 class="card-title">${icon("inbox", 16)} Pending top-up requests</h3>
        ${pendingHtml}
      </div>
    ` : ""}

    <div class="card">
      <h3 class="card-title">${icon("users", 16)} Members</h3>
      ${membersHtml}
      ${canParticipate && !openLeaderVote && otherMembers.length ? `
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

    ${openLeaderVote ? voteCardHtml(openLeaderVote, canParticipate) : ""}

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
      ${openBets.length ? openBets.map(betRow).join("") : `<div class="empty-state">${icon("inbox", 24)}<p>${escapeHtml(pick(NO_BETS_MESSAGES))}</p></div>`}
    </div>

    ${resolvedBets.length ? `
      <div class="card">
        <h3 class="card-title">${icon("trophy", 16)} Resolved</h3>
        ${resolvedBets.map(betRow).join("")}
      </div>
    ` : ""}

    ${adSlot("group-detail-bottom", "300x250 medium rectangle")}
  `);

  renderBalanceNumber(document.getElementById("balance-number"), `group:${groupId}`, group.my_balance);

  document.getElementById("copy-invite-btn").onclick = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      toast("Copied — go round up some friends", "success");
    } catch {
      toast("Couldn't copy — copy it manually", "error");
    }
  };

  document.getElementById("share-invite-btn").onclick = () => {
    shareOrCopy({
      title: "Playwise",
      text: `Join "${group.name}" on Playwise — predict outcomes, stake play coins, bragging rights on the line.`,
      url: `${location.origin}/#/join/${group.invite_code}`,
    });
  };

  const settingsForm = document.getElementById("group-settings-form");
  if (settingsForm) {
    const settingsPublicToggle = document.getElementById("settings-public-toggle");
    const settingsPublicOptions = document.getElementById("settings-public-options");
    settingsPublicToggle.onchange = () => {
      settingsPublicOptions.style.display = settingsPublicToggle.checked ? "" : "none";
    };
    settingsForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const is_public = settingsPublicToggle.checked;
      const startingBalanceRaw = f.get("starting_balance");
      try {
        await api(`/api/groups/${groupId}/settings`, {
          method: "PATCH",
          body: {
            is_public,
            category: is_public ? f.get("category") : null,
            rules: is_public ? (f.get("rules") || null) : null,
            starting_balance: is_public && startingBalanceRaw ? Number(startingBalanceRaw) : null,
          },
        });
        toast("Group settings saved", "success");
        await viewGroupDetail(groupId);
      } catch (err) {
        document.getElementById("group-settings-error").textContent = err.message;
      }
    };
  }

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

  if (canParticipate) {
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
  }

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
      toast("It's live — let's see who's right", "success");
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
  const isLeader = group.leader_id === user.id || user.is_superadmin;
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
    const myPayout = bet.payouts.find((p) => p.user_id === user.id && p.type === "payout");
    winnerBanner = `
      <div class="winner-banner">
        ${icon("trophy", 20)} <span>${bannerText}</span>
        ${myPayout ? `<button class="secondary small" id="share-win-btn" style="margin-left:auto;">${icon("chat", 13)} Share your win</button>` : ""}
      </div>
    `;

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

    ${disputeVote ? voteCardHtml(disputeVote, group.is_member) : ""}
    ${bet.status === "resolved" && !disputeVote && group.is_member ? `
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
        sparkleBurst(btn);
        toast("Stake locked in — good luck", "success");
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

  const shareWinBtn = document.getElementById("share-win-btn");
  if (shareWinBtn) {
    shareWinBtn.onclick = () => {
      const myPayout = bet.payouts.find((p) => p.user_id === user.id && p.type === "payout");
      const joinUrl = `${location.origin}/#/join/${group.invite_code}`;
      shareOrCopy({
        title: "Playwise",
        text: `I just won ${fmtCoins(myPayout.amount)} coins predicting "${bet.question}" in ${group.name} on Playwise 🎉 Come play:`,
        url: joinUrl,
      });
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
            ${!mine ? `<button class="ghost icon-btn chat-delete" data-report-msg="${m.id}" title="Report">${icon("flag", 11)}</button>` : ""}
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
    messagesEl.querySelectorAll("[data-report-msg]").forEach((btn) => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.onclick = () => reportContent("chat_message", Number(btn.dataset.reportMsg));
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
  const user = getUser();
  await renderChatView({
    apiBase: "/api/chat/global",
    title: "Global chat",
    backHref: "#/groups",
    backLabel: "All groups",
    isModerator: !!user.is_superadmin,
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
    isModerator: group.leader_id === user.id || user.is_superadmin,
  });
}

// ---- moderation: reporting + admin queue ---------------------------------
// Group leaders already have moderation tools for their own group (delete
// messages, kick members). This is the layer above that -- for things no
// leader has authority over, like global chat abuse or a public group's
// listing itself being the problem. Anyone can flag; only an admin
// (granted manually, no self-service path) can see or act on the queue.

async function reportContent(targetType, targetId) {
  const reason = prompt("Why are you reporting this? (visible only to admins)");
  if (reason === null) return; // cancelled
  if (!reason.trim()) { toast("A reason is required", "error"); return; }
  try {
    await api("/api/reports", { method: "POST", body: { target_type: targetType, target_id: targetId, reason: reason.trim() } });
    toast("Reported — thanks, an admin will take a look", "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function viewAdminDashboard() {
  setTitle("Admin dashboard");
  setApp(skeletonView(3));
  const [stats, users, groups] = await Promise.all([
    api("/api/admin/stats"),
    api("/api/admin/users?limit=20"),
    api("/api/admin/groups?limit=20"),
  ]);

  const statCard = (label, value, href) => `
    <a class="stat-card${href ? " clickable" : ""}" ${href ? `href="${href}"` : ""}>
      <div class="stat-value">${fmtCoins(value)}</div>
      <div class="stat-label">${escapeHtml(label)}</div>
    </a>
  `;

  const userRow = (u) => `
    <div class="list-item">
      <div class="identity">
        ${avatarHtml(u.display_name)}
        <div class="meta">
          <div class="primary">${escapeHtml(u.display_name)} ${u.is_admin ? `<span class="badge">Admin</span>` : ""}</div>
          <div class="secondary">@${escapeHtml(u.username)} · ${u.group_count} group${u.group_count === 1 ? "" : "s"} · joined ${fmtDate(u.created_at)}</div>
        </div>
      </div>
    </div>
  `;

  const groupRow = (g) => `
    <a class="list-item clickable" href="#/groups/${g.id}">
      <div class="identity">
        ${avatarHtml(g.name)}
        <div class="meta">
          <div class="primary">${escapeHtml(g.name)}</div>
          <div class="secondary">led by ${escapeHtml(g.leader_display_name)} · ${g.member_count} member${g.member_count === 1 ? "" : "s"} · ${fmtDate(g.created_at)}</div>
        </div>
      </div>
      ${g.is_public ? `<span class="badge">${escapeHtml(categoryLabel(g.category) || "🌐 Public")}</span>` : `<span class="secondary" style="font-size:0.78rem;">private</span>`}
    </a>
  `;

  setApp(`
    <a href="#/groups" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} All groups</a>
    <div class="card">
      <h1 class="row" style="gap:8px;">${icon("layout", 20)} Admin dashboard</h1>
      <div class="squiggle"></div>
      <p class="muted">A read on how the app is actually being used.</p>
    </div>

    <div class="stat-grid">
      ${statCard("Total users", stats.total_users)}
      ${statCard("New this week", stats.new_users_7d)}
      ${statCard("Total groups", stats.total_groups)}
      ${statCard("Public groups", stats.public_groups)}
      ${statCard("Chat messages", stats.total_chat_messages)}
      ${statCard("Open reports", stats.open_reports, "#/admin/reports")}
    </div>

    <div class="card">
      <div class="row between">
        <h3 class="card-title">${icon("flag", 16)} Moderation queue</h3>
        <a href="#/admin/reports" class="secondary small">Review reports${stats.open_reports ? ` (${stats.open_reports})` : ""}</a>
      </div>
      <p class="muted" style="margin:0;">${stats.open_reports ? `${stats.open_reports} report${stats.open_reports === 1 ? "" : "s"} waiting on you.` : "Nothing waiting on you right now."}</p>
    </div>

    <div class="card">
      <h3 class="card-title">${icon("users", 16)} Newest users</h3>
      ${users.length ? users.map(userRow).join("") : `<p class="muted">No users yet.</p>`}
    </div>

    <div class="card">
      <h3 class="card-title">${icon("bolt", 16)} Newest groups</h3>
      ${groups.length ? groups.map(groupRow).join("") : `<p class="muted">No groups yet.</p>`}
    </div>
  `);
}

async function viewAdminReports() {
  setTitle("Moderation queue");
  setApp(skeletonView(2));
  const reports = await api("/api/admin/reports");

  function reportRow(r) {
    const actions = r.target_type === "chat_message"
      ? `<button class="danger small" data-resolve="${r.id}" data-action="delete_content">Delete message</button>`
      : `<button class="danger small" data-resolve="${r.id}" data-action="unpublish_group">Unpublish group</button>`;
    return `
      <div class="card" data-report-row="${r.id}">
        <div class="row between">
          <span class="badge">${r.target_type === "chat_message" ? "💬 Message" : "🌐 Group"}</span>
          <span class="secondary" style="font-size:0.78rem;">reported by ${escapeHtml(r.reporter_display_name)}</span>
        </div>
        <p class="muted" style="white-space:pre-wrap;">${escapeHtml(r.target_preview)}</p>
        <p style="font-size:0.88rem;"><strong>Reason:</strong> ${escapeHtml(r.reason)}</p>
        <div class="row" style="gap:8px;margin-top:6px;">
          ${actions}
          <button class="secondary small" data-resolve="${r.id}" data-action="dismiss">Dismiss</button>
        </div>
      </div>
    `;
  }

  setApp(`
    <a href="#/admin" class="row" style="gap:6px;color:var(--text-secondary);font-size:0.85rem;margin-bottom:10px;">${icon("arrowLeft", 15)} Admin dashboard</a>
    <div class="card">
      <h1 class="row" style="gap:8px;">${icon("flag", 20)} Moderation queue</h1>
      <div class="squiggle"></div>
      <p class="muted">${reports.length} open report${reports.length === 1 ? "" : "s"}.</p>
    </div>
    ${reports.length
      ? reports.map(reportRow).join("")
      : `<div class="card empty-state">${icon("inbox", 28)}<p>Nothing to review — the queue is empty.</p></div>`}
  `);

  document.querySelectorAll("[data-resolve]").forEach((btn) => {
    btn.onclick = async () => {
      const action = btn.dataset.action;
      if (action !== "dismiss" && !confirm("This can't be undone. Continue?")) return;
      try {
        await api(`/api/admin/reports/${btn.dataset.resolve}/resolve`, { method: "POST", body: { action } });
        toast("Report resolved", "success");
        document.querySelector(`[data-report-row="${btn.dataset.resolve}"]`).remove();
      } catch (err) {
        toast(err.message, "error");
      }
    };
  });
}
