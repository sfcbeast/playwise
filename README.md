# Playwise

A small group app that's part Splitwise, part Kalshi: each group has a shared
pseudo-currency wallet per member (top up by request, approved by the group
leader), and any member can post a yes/no or multi-option question for the
group to bet on. When the leader resolves a question, the entire pool of
staked coins is split among the winners in proportion to how much they staked
(pari-mutuel, like a real prediction market) — everyone else's stake goes
into that pot.

## Stack

- **Backend:** FastAPI + SQLAlchemy, JWT auth (bcrypt password hashing)
- **Frontend:** plain HTML/CSS/JS, no build step, served by FastAPI as static files
- **DB:** SQLite locally, Postgres in production (via `DATABASE_URL`)

## Run locally

```bash
py -3 -m venv .venv
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m uvicorn backend.app:app --reload
```

Open http://127.0.0.1:8000. Data is stored in `local.db` (SQLite) — delete
that file to reset everything.

## How it works

1. Register an account, create a group (you become its leader) or join one
   with an invite code.
2. Request a top-up; the group leader approves or rejects it from the group
   page. Approval credits your balance.
3. Any member can post a question with 2+ options. Members stake coins from
   their balance on whichever option they think will win — that amount is
   deducted immediately.
4. Once the outcome is known, the leader resolves the bet by picking the
   winning option. Every coin staked (winners' and losers') is redistributed
   to winners in proportion to their stake. If nobody staked the winning
   option, everyone is refunded instead.
5. Every top-up, stake, payout, and refund is recorded as a transaction
   (`GET /api/groups/{id}/transactions`), so balances are always auditable.

## Deploying

This is set up for [Render](https://render.com) (free tier) + a free
Postgres database from [Neon](https://neon.tech), but any host that runs a
Python web service works.

1. Create a free Postgres database at neon.tech and copy its connection
   string.
2. Push this repo to GitHub.
3. In Render, "New +" → "Blueprint", point it at the repo — it will pick up
   `render.yaml` automatically. When prompted, paste the Neon connection
   string into the `DATABASE_URL` environment variable. `JWT_SECRET` is
   generated for you automatically.
4. Deploy. Render gives you a public URL — that's the whole app, frontend
   and API on the same origin.

No other config is needed; the app creates its tables automatically on
startup.
