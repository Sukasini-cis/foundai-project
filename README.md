# FoundAI - merged project (single MongoDB cluster)

One backend + one frontend (lostfoundnew + profile + report lost + report found + messages + admin module + heatmap).

## MongoDB - everything on the MAIN cluster now

All data now lives in **one** MongoDB cluster: the one configured in `backend/.env` (`MONGO_URI`).

| Models | Connection |
|---|---|
| User, Item, Notification, Profile, Report (lost), FoundReport, Conversation | `backend/.env` -> `MONGO_URI` |
| Claim, Escrow, ModerationCase, Heatmap (admin module + heatmap) | `backend/.env` -> `MONGO_URI` |

The admin module (Claims History, Reward Escrow, Admin Moderation Console) no longer uses MySQL -
there is no `mysql2` dependency and no MySQL config any more.

| Model | Collection | Replaces (MySQL) |
|---|---|---|
| `Claim` | `claims` | `claims` |
| `Escrow` | `escrow` | `escrow` |
| `ModerationCase` | `moderation_cases` | `moderation_cases` |
| `Heatmap` | `heatmaps` | (was already MongoDB, old cluster) |

These three models return an `id` field (the ObjectId as a string) so the existing AngularJS pages work unchanged.

The old Priyanka-cluster `.env` files are kept, untouched, at
`backend/modules/profile/.env`, `backend/modules/report-lost/.env`,
`backend/modules/report-found/.env` and `backend/modules/messages/.env` for reference,
but nothing in the code reads them anymore - every model uses the single
default Mongoose connection (`config/db.js`).

## API
- /api/auth, /api/items, /api/notifications, /api/dashboard (unchanged)
- /api/profile
- /api/reports (lost reports)
- /api/found-reports
- /api/conversations (messages)
- /api/claims (claims history)
- /api/escrow (reward escrow: list, create, release, cancel, `/stats`)
- /api/moderation (admin moderation console)
- /api/heatmap

## Run
```
cd backend
npm install
npm start
```
Open http://localhost:5000/login/index.html (backend also serves the frontend).

Pages: login, signup, dashboard, profile, reportlost, reportfound, messages, notifi, arnavigation, heatmap, about.

Admin pages live in `frontend/admin/` (open http://localhost:5000/admin/admin-login.html, demo login `admin` / `admin123`):
`admin-login.html`, `admin-mod.html` (moderation console), `claims-history.html`, `reward-escrow.html`.
The dashboard sidebar links (Admin Mod, Claims History, Reward Escrow) point to them.

## Optional: copy old data
Old heatmap hotspots (old MongoDB cluster) and old MySQL rows (claims / escrow / moderation_cases) can be copied into the main cluster once:
see the header of `backend/scripts/migrate-legacy-data.js` (fill `backend/scripts/legacy.env` from `legacy.env.example`).
