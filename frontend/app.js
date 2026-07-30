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

function renderUserBox() {
  const box = document.getElementById("user-box");
  const user = getUser();
  if (!user) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <span>${escapeHtml(user.display_name)}</span>
    <button class="secondary small" id="logout-btn">Log out</button>
  `;
  document.getElementById("logout-btn").onclick = () => {
    clearAuth();
    location.hash = "#/login";
  };
}

function setApp(html) {
  document.getElementById("app").innerHTML = html;
}

// ---- router ------------------------------------------------------------

async function render() {
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
  setApp(`
    <div class="card stack" style="max-width:380px;margin:40px auto;">
      <h1>Log in</h1>
      <form id="login-form" class="stack">
        <input name="username" placeholder="Username" autocomplete="username" required />
        <input name="password" type="password" placeholder="Password" autocomplete="current-password" required />
        <div class="error" id="login-error"></div>
        <button type="submit">Log in</button>
      </form>
      <p class="center muted">No account? <a href="#/register">Register</a></p>
    </div>
  `);
  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const data = await api("/api/login", {
        method: "POST",
        body: { username: f.get("username"), password: f.get("password") },
      });
      setAuth(data.access_token, { id: data.user_id, username: data.username, display_name: data.display_name });
      location.hash = "#/groups";
    } catch (err) {
      document.getElementById("login-error").textContent = err.message;
    }
  };
}

function viewRegister() {
  setApp(`
    <div class="card stack" style="max-width:380px;margin:40px auto;">
      <h1>Create account</h1>
      <form id="register-form" class="stack">
        <input name="display_name" placeholder="Display name" required />
        <input name="username" placeholder="Username" autocomplete="username" required minlength="3" />
        <input name="password" type="password" placeholder="Password (6+ characters)" autocomplete="new-password" required minlength="6" />
        <div class="error" id="register-error"></div>
        <button type="submit">Create account</button>
      </form>
      <p class="center muted">Already have an account? <a href="#/login">Log in</a></p>
    </div>
  `);
  document.getElementById("register-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
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
      location.hash = "#/groups";
    } catch (err) {
      document.getElementById("register-error").textContent = err.message;
    }
  };
}

// ---- views: groups -------------------------------------------------------

async function viewGroups() {
  setApp(`<div class="card center muted">Loading groups…</div>`);
  const groups = await api("/api/groups");

  const groupsHtml = groups.length
    ? groups.map((g) => `
        <a class="list-item" href="#/groups/${g.id}" style="text-decoration:none;color:inherit;">
          <span>${escapeHtml(g.name)}</span>
          <span class="balance" style="font-size:1.1rem;">${fmtCoins(g.my_balance)}</span>
        </a>
      `).join("")
    : `<p class="muted">You're not in any groups yet.</p>`;

  setApp(`
    <div class="card">
      <h1>Your groups</h1>
      ${groupsHtml}
    </div>
    <div class="card">
      <h3>Create a group</h3>
      <form id="create-group-form" class="form-inline">
        <input name="name" placeholder="Group name" required />
        <button type="submit">Create</button>
      </form>
      <div class="error" id="create-group-error"></div>
    </div>
    <div class="card">
      <h3>Join a group</h3>
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
      location.hash = `#/groups/${g.id}`;
    } catch (err) {
      document.getElementById("join-group-error").textContent = err.message;
    }
  };
}

async function viewGroupDetail(groupId) {
  setApp(`<div class="card center muted">Loading group…</div>`);
  const group = await api(`/api/groups/${groupId}`);
  const user = getUser();
  const isLeader = group.leader_id === user.id;

  const membersHtml = group.members
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .map((m) => `
      <div class="list-item">
        <span>${escapeHtml(m.display_name)}${m.user_id === group.leader_id ? ' <span class="badge">leader</span>' : ""}</span>
        <span>${fmtCoins(m.balance)}</span>
      </div>
    `).join("");

  const pendingHtml = isLeader && group.pending_topups.length
    ? group.pending_topups.map((r) => `
        <div class="list-item">
          <span>${escapeHtml(r.display_name)} requests ${fmtCoins(r.amount)}</span>
          <span class="row">
            <button class="small" data-approve="${r.id}">Approve</button>
            <button class="small danger" data-reject="${r.id}">Reject</button>
          </span>
        </div>
      `).join("")
    : "";

  const openBets = group.bets.filter((b) => b.status === "open");
  const resolvedBets = group.bets.filter((b) => b.status !== "open");

  function betRow(b) {
    const total = b.option_totals.reduce((a, c) => a + c, 0);
    return `
      <a class="list-item" href="#/bets/${b.id}" style="text-decoration:none;color:inherit;">
        <span>${escapeHtml(b.question)}</span>
        <span class="row">
          <span class="muted">${fmtCoins(total)} staked</span>
          <span class="badge ${b.status}">${b.status}</span>
        </span>
      </a>
    `;
  }

  setApp(`
    <div class="card">
      <div class="row between">
        <h1>${escapeHtml(group.name)}</h1>
        <a href="#/groups" class="muted">&larr; all groups</a>
      </div>
      <p class="muted">Invite code: <strong>${escapeHtml(group.invite_code)}</strong> (share this so others can join)</p>
      <div class="balance">${fmtCoins(group.my_balance)} coins</div>
    </div>

    <div class="card">
      <h3>Request a top-up</h3>
      <form id="topup-form" class="form-inline">
        <input name="amount" type="number" min="1" placeholder="Amount" required />
        <button type="submit">Request</button>
      </form>
      <div class="error" id="topup-error"></div>
    </div>

    ${isLeader ? `
      <div class="card">
        <h3>Pending top-up requests</h3>
        ${pendingHtml || '<p class="muted">Nothing pending.</p>'}
      </div>
    ` : ""}

    <div class="card">
      <h3>Members</h3>
      ${membersHtml}
    </div>

    <div class="card">
      <h3>New question</h3>
      <form id="bet-form" class="stack">
        <input name="question" placeholder="What's the question?" required />
        <div id="options-container" class="stack">
          <input name="option" placeholder="Option 1" required />
          <input name="option" placeholder="Option 2" required />
        </div>
        <button type="button" class="secondary small" id="add-option-btn" style="align-self:flex-start;">+ Add option</button>
        <div class="error" id="bet-error"></div>
        <button type="submit">Create question</button>
      </form>
    </div>

    <div class="card">
      <h3>Open bets</h3>
      ${openBets.length ? openBets.map(betRow).join("") : '<p class="muted">No open bets.</p>'}
    </div>

    ${resolvedBets.length ? `
      <div class="card">
        <h3>Resolved</h3>
        ${resolvedBets.map(betRow).join("")}
      </div>
    ` : ""}
  `);

  document.getElementById("topup-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await api(`/api/groups/${groupId}/topup-requests`, {
        method: "POST",
        body: { amount: Number(f.get("amount")) },
      });
      await viewGroupDetail(groupId);
    } catch (err) {
      document.getElementById("topup-error").textContent = err.message;
    }
  };

  document.getElementById("add-option-btn").onclick = () => {
    const container = document.getElementById("options-container");
    const input = document.createElement("input");
    input.name = "option";
    input.placeholder = `Option ${container.children.length + 1}`;
    container.appendChild(input);
  };

  document.getElementById("bet-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const question = f.get("question");
    const options = f.getAll("option").map((o) => o.trim()).filter(Boolean);
    try {
      const bet = await api(`/api/groups/${groupId}/bets`, {
        method: "POST",
        body: { question, options },
      });
      location.hash = `#/bets/${bet.id}`;
    } catch (err) {
      document.getElementById("bet-error").textContent = err.message;
    }
  };

  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.onclick = async () => {
      await api(`/api/groups/${groupId}/topup-requests/${btn.dataset.approve}/approve`, { method: "POST" });
      await viewGroupDetail(groupId);
    };
  });
  document.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.onclick = async () => {
      await api(`/api/groups/${groupId}/topup-requests/${btn.dataset.reject}/reject`, { method: "POST" });
      await viewGroupDetail(groupId);
    };
  });
}

// ---- views: bet detail -------------------------------------------------

async function viewBetDetail(betId) {
  setApp(`<div class="card center muted">Loading…</div>`);
  const bet = await api(`/api/bets/${betId}`);
  const group = await api(`/api/groups/${bet.group_id}`);
  const user = getUser();
  const isLeader = group.leader_id === user.id;
  const total = bet.option_totals.reduce((a, c) => a + c, 0);

  const optionsHtml = bet.options.map((opt, i) => {
    const amt = bet.option_totals[i];
    const pct = total ? Math.round((amt / total) * 100) : 0;
    const isWinner = bet.status === "resolved" && bet.winning_option === i;
    return `
      <div class="option-row${isWinner ? " winner" : ""}">
        <div class="row between">
          <span>${escapeHtml(opt)}${isWinner ? ' <span class="badge resolved">winner</span>' : ""}</span>
          <span class="muted">${fmtCoins(amt)} (${pct}%)</span>
        </div>
        <div class="option-bar"><div style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");

  const optionChoices = bet.options.map((opt, i) => `<option value="${i}">${escapeHtml(opt)}</option>`).join("");

  const myStakesHtml = bet.my_stakes.length
    ? bet.my_stakes.map((s) => `<div class="list-item"><span>${escapeHtml(bet.options[s.option_index])}</span><span>${fmtCoins(s.amount)}</span></div>`).join("")
    : '<p class="muted">You haven\'t staked on this yet.</p>';

  setApp(`
    <div class="card">
      <a href="#/groups/${group.id}" class="muted">&larr; ${escapeHtml(group.name)}</a>
      <div class="row between">
        <h1>${escapeHtml(bet.question)}</h1>
        <span class="badge ${bet.status}">${bet.status}</span>
      </div>
      ${optionsHtml}
    </div>

    ${bet.status === "open" ? `
      <div class="card">
        <h3>Place a stake</h3>
        <p class="muted">Your balance: ${fmtCoins(group.my_balance)}</p>
        <form id="stake-form" class="stack">
          <select name="option_index">${optionChoices}</select>
          <input name="amount" type="number" min="1" max="${group.my_balance}" placeholder="Amount" required />
          <div class="error" id="stake-error"></div>
          <button type="submit">Stake</button>
        </form>
      </div>
    ` : ""}

    <div class="card">
      <h3>Your stakes</h3>
      ${myStakesHtml}
    </div>

    ${isLeader && bet.status === "open" ? `
      <div class="card">
        <h3>Resolve this bet</h3>
        <p class="muted">Pick the winning option. All money staked on it splits the whole pool.</p>
        <form id="resolve-form" class="form-inline">
          <select name="winning_option">${optionChoices}</select>
          <button type="submit" class="danger">Resolve</button>
        </form>
        <div class="error" id="resolve-error"></div>
      </div>
    ` : ""}
  `);

  const stakeForm = document.getElementById("stake-form");
  if (stakeForm) {
    stakeForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        await api(`/api/bets/${betId}/stake`, {
          method: "POST",
          body: { option_index: Number(f.get("option_index")), amount: Number(f.get("amount")) },
        });
        await viewBetDetail(betId);
      } catch (err) {
        document.getElementById("stake-error").textContent = err.message;
      }
    };
  }

  const resolveForm = document.getElementById("resolve-form");
  if (resolveForm) {
    resolveForm.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      if (!confirm("Resolve this bet? This cannot be undone.")) return;
      try {
        await api(`/api/bets/${betId}/resolve`, {
          method: "POST",
          body: { winning_option: Number(f.get("winning_option")) },
        });
        await viewBetDetail(betId);
      } catch (err) {
        document.getElementById("resolve-error").textContent = err.message;
      }
    };
  }
}
