# Rivavio SaaS Module — Development Summary

Running log of every feature added to the multi-tenant jewelry-SaaS learning module.
Each entry: **what** was built, **why**, **files touched**, and **how to manually test it**.

New entries are appended at the bottom, in the order they were built. For the full
automated/manual test case inventory (pass/fail tracking), see [TEST_CASES.md](TEST_CASES.md).
For interview-style Q&A on the underlying concepts, see [INTERVIEW_NOTES.md](INTERVIEW_NOTES.md).

---

## 1. Financial Engine (pure functions)

**What:** Three standalone, side-effect-free modules — `money.js` (rupee↔paise conversion via
decimal.js), `jewelryPricing.js` (metal value + wastage + making charge + GST → total),
`ledgerEngine.js` (FIFO payment allocation across outstanding bills).

**Why:** Currency math must be exact (no floating-point drift) and independently testable before
wiring it into any database/HTTP layer. Pure functions = fast, deterministic unit tests without a
DB.

**Files:** `backend/utils/money.js`, `backend/utils/jewelryPricing.js`,
`backend/utils/ledgerEngine.js`, `backend/utils/__tests__/*.test.js`

**Manual test:** N/A — pure functions, covered entirely by unit tests (`cd backend && npm test`).

---

## 2. Tenant Skeleton (Business model + middleware)

**What:** `Business` model (name/slug/owner/plan), `businessId` field added to `User`,
`tenantMiddleware` (requires `req.user.businessId`, sets `req.businessId`), business
create/get-mine endpoints under `/api/saas`.

**Why:** Foundation of multi-tenancy — the "pool model" (shared collections + a `businessId`
column) rather than a separate DB/schema per tenant. Every SaaS feature after this scopes its
queries by `req.businessId`.

**Files:** `backend/models/Business.js`, `backend/middleware/tenant.js`,
`backend/controllers/Business.js` (`create`, `getMine`), `backend/models/User.js`,
`backend/utils/SanitizeUser.js`, `backend/routes/Saas.js`, `backend/index.js`

**Manual test:**
```
curl -X POST http://localhost:8000/api/saas/businesses -H "Content-Type: application/json" -b "token=<TOKEN>" -d "{\"name\":\"Test Jewelers\"}"
curl http://localhost:8000/api/saas/businesses/me -b "token=<TOKEN>"
```
Expect: business created, JWT cookie refreshed with `businessId`; `me` returns that business.
Second create attempt for the same user → 400. No cookie → 401. Cookie without a business → 403.

---

## 3. Bill + Ledger Persistence

**What:** `Bill` and `LedgerEntry` models wired to the financial engine. `createBill` runs the
pricing calculation, grabs an atomic invoice number (`Counter` + `findOneAndUpdate $inc`), and
writes the `Bill` + a `debit` `LedgerEntry` inside a single MongoDB multi-document transaction.
`recordPayment` allocates a payment across open bills via `allocatePaymentFIFO`, then updates
each bill's `paidPaise`/`status` (aggregation-pipeline update) + writes `credit` `LedgerEntry`
rows, all in one transaction.

**Why:** Demonstrates transactional integrity (all-or-nothing writes across two collections) and
race-safe sequence generation — both common real-world SaaS billing requirements.

**Files:** `backend/models/Bill.js`, `backend/models/LedgerEntry.js`, `backend/models/Counter.js`,
`backend/utils/counter.js`, `backend/controllers/Bill.js`, `backend/controllers/Ledger.js`,
`backend/routes/Saas.js`, `backend/__tests__/integration/billing.test.js`

**Manual test:**
```
curl -X POST http://localhost:8000/api/saas/bills -H "Content-Type: application/json" -b "token=<TOKEN>" -d "{\"customerName\":\"Ramesh\",\"customerPhone\":\"9999999999\",\"pricingInputs\":{\"grossWeightGrams\":10,\"ratePerGram\":6000,\"wastagePercent\":5,\"makingChargeType\":\"percent_of_metal\",\"makingChargeValue\":10,\"gstPercent\":3}}"
curl -X POST http://localhost:8000/api/saas/payments -H "Content-Type: application/json" -b "token=<TOKEN>" -d "{\"customerPhone\":\"9999999999\",\"amountPaise\":100000}"
curl http://localhost:8000/api/saas/ledger -b "token=<TOKEN>"
```
Expect: bill created with a sequential `billNumber`; payment reduces `outstandingPaise` /
updates `status`; ledger shows one `debit` (bill) + one `credit` (payment) entry.

---

## 4. Cross-Tenant Isolation Hardening

**What:** No new endpoints — this entry documents the isolation guarantee verified across
Bill/Ledger reads and writes: every query is scoped by `businessId: req.businessId`, so Business
A can never read, list, or apply a payment against Business B's data, even with matching
customer phone numbers.

**Why:** The single most important property of a pool-model multi-tenant system. A missed
`businessId` filter anywhere is a data leak.

**Files:** `backend/__tests__/integration/tenantIsolation.test.js` (no production code changed —
existing scoping in `Bill.js`/`Ledger.js` controllers verified under test)

**Manual test:** Create two businesses (A, B) with two different owner accounts. Create a bill
under A. Using B's token, `GET /api/saas/bills/:id` for A's bill id → expect 404 (not data, not
403 — a 404 avoids confirming the ID even exists). `GET /api/saas/bills` as B → only B's bills
appear.

---

## 5. Role-Based Access (Owner vs Staff)

**What:** `role` field (`"owner" | "staff" | null`) on `User`. `ownerMiddleware` (wraps
`tenantMiddleware`, additionally requires `role === "owner"`). Staff management endpoints:
`inviteStaff` (owner-only, adds an *existing* user by email to the business as staff),
`listStaff` (owner + staff can view the team), `removeStaff` (owner-only, can't remove the
owner).

**Why:** Real shops have staff who do day-to-day billing but shouldn't control the business
account (invite/remove people). Matches a named requirement ("role-based access") from the
freelance job posting that motivated this whole learning project.

**Files:** `backend/models/User.js`, `backend/utils/SanitizeUser.js`, `backend/middleware/tenant.js`
(`ownerMiddleware`), `backend/controllers/Business.js` (`inviteStaff`, `listStaff`, `removeStaff`),
`backend/routes/Saas.js`, `backend/__tests__/integration/staffAccess.test.js`

**Known limitation:** the invited/removed staff member's own JWT cookie stays stale (old
role/businessId) until they next log in — no refresh-token mechanism exists yet.

**Manual test:** See detailed 8-step script in `Rivavio_SaaS_UAT_Script.pdf` Section E, or the
condensed version already given in-session:
```
curl -X POST http://localhost:8000/api/saas/businesses/staff -H "Content-Type: application/json" -b "token=<OWNER_TOKEN>" -d "{\"email\":\"<staffEmail>\"}"
curl http://localhost:8000/api/saas/businesses/staff -b "token=<OWNER_TOKEN>"
curl -X DELETE http://localhost:8000/api/saas/businesses/staff/<staffUserId> -b "token=<OWNER_TOKEN>"
```
Expect: invite → 200 + `role:"staff"`; list → 2 members, no `password` field; same invite tried
with the staff member's own token → 403; remove → 200, then list shows only the owner; trying to
remove the owner's own id → 400.

---

## 6. Frontend UI for the SaaS Module

**What:** React screens for everything that was previously curl/Jest-only. New API layer
`frontend/src/features/business/BusinessApi.jsx` (one function per `/api/saas/*` route). Pages:
`CreateBusinessPage` (shown when a logged-in user has no `businessId` yet), `BusinessDashboardPage`
(business info + nav cards), `BusinessBillsPage` (bills table + `RecordPaymentForm`),
`CreateBillPage` (full jewelry pricing form), `BillDetailsPage` (pricing breakdown + that bill's
ledger trail), `BusinessLedgerPage` (whole-business ledger), `BusinessStaffPage` (team table;
invite form + remove button only rendered for `role==="owner"`). Routing added to `App.js` as a
new conditional block, independent of the existing `isAdmin` ternary. Navbar gets a "Start a
Business" / "My Business" link depending on `loggedInUser.businessId`.

**Why:** Makes the SaaS module an actual demonstrable, click-through product instead of an API
only reachable via curl — the point of this whole exercise being a portfolio piece, not just a
passed test suite.

**Files:** `frontend/src/features/business/BusinessApi.jsx`, `frontend/src/features/business/
components/*.jsx` (CreateBusinessForm, BusinessDashboard, BusinessBills, BillsTable,
RecordPaymentForm, CreateBillForm, BillDetails, BusinessLedger, BusinessStaff, StaffTable,
InviteStaffForm), `frontend/src/pages/{CreateBusinessPage,BusinessDashboardPage,
BusinessBillsPage,CreateBillPage,BillDetailsPage,BusinessLedgerPage,BusinessStaffPage}.jsx`,
`frontend/src/App.js`, `frontend/src/features/navigation/components/Navbar.jsx`.

**Key design notes:**
- Amounts are stored/returned in paise everywhere (`Bill`/`LedgerEntry`); display via
  `formatPrice(amountPaise / 100)`. The one reverse conversion is the payment-amount field
  (rupees entered → `× 100` before calling `POST /payments`, since that endpoint requires integer
  `amountPaise`).
- `POST /payments` is phone+amount, not per-bill (FIFO auto-allocates across that phone number's
  open bills) — so "record payment" lives on the Bills list page, not inside a single bill.
- No Redux slice for this module — plain component state + direct async calls, matching the
  existing `AdminCoupons`/`CouponApi` pattern for CRUD-style admin screens elsewhere in the app.
- The staff-only invite/remove UI is a display nicety (`role==="owner"` check in
  `BusinessStaff.jsx`), not a security boundary — the backend's `ownerMiddleware` is the real
  enforcement, same as everywhere else in this project.

**Manual test:** `cd frontend && npm start`, then: sign up a fresh user → "Start a Business" →
create business → land on dashboard → New Bill → fill pricing form → confirm the breakdown on the
bill's detail page matches a hand calculation → on the Bills page, record a payment by phone
number → confirm the bill's status flips and a credit entry appears in its ledger trail → Staff
page as owner → invite a second test user → confirm they only see a read-only team table.

**Verified via automated browser testing (Playwright + headless Chromium, not just a compile
check):** ran the full flow above end-to-end against the real local backend. Two real bugs
surfaced and got fixed as a result — see the "Bugs found and fixed" note under the Frontend UI
section of `TEST_CASES.md` (a post-business-creation routing race producing a bogus 404, and an
invalid-HTML `<Table component={Paper}>` pattern repeated across four table components). Pricing
math was cross-checked by hand: 10g @ ₹6000/g with 5% wastage, 10% making charge, 3% GST produced
exactly ₹71,379 total, matching `jewelryPricing.js`'s formula.

**Local dev note:** port 3000 is occupied by a separate, unrelated project (StyleRoute) also
being developed in this environment. Run Rivavio's frontend on a different port locally —
`PORT=3001 npm start` — and keep `backend/.env`'s `ORIGIN` matching whichever port is actually
in use, or CORS will silently reject requests.

---

## 7. Postgres RLS Demo (isolated side-project)

**What:** A standalone `postgres-rls-demo/` directory (Docker Postgres + `pg` + Jest) that
re-implements tenant isolation using Postgres Row-Level Security instead of application-level
`businessId` query scoping — `CREATE POLICY ... USING (business_id = current_setting(...))`,
`FORCE ROW LEVEL SECURITY`, a non-superuser `app_user` role, `set_config()` per-request tenant
context.

**Why:** Contrasts the two dominant tenant-isolation strategies (app-level filtering vs DB-native
RLS) for interview purposes. Deliberately NOT merged into the Mongo backend — separate demo, no
prod/dev database mixing.

**Files:** `postgres-rls-demo/schema.sql`, `postgres-rls-demo/docker-compose.yml`,
`postgres-rls-demo/rls.test.js`, `postgres-rls-demo/package.json`

**Manual test:**
```
cd postgres-rls-demo && docker compose up -d && npm test
```
Or interactively via `psql` — see `Rivavio_SaaS_UAT_Script.pdf` Section F (4 scenarios): querying
`bills` with no `WHERE` clause as tenant A only returns A's rows; no tenant context set → zero
rows (fail-closed); cross-tenant `INSERT`/`UPDATE` blocked/no-op.

---

## 8. Deployment — Vercel (frontend) + Render (backend)

**What:** Deployed the SPA to Vercel and the Express API to Render, as an additive path alongside
the existing (unrelated, pre-dating this project's SaaS work) Docker/AWS EC2 setup. One backend
code change was required: `backend/index.js` now binds `server.listen(process.env.PORT || 8000,
...)` instead of a hardcoded `8000`, since Render assigns its own port at runtime.

**Why:** The target job posting names Vercel/Render explicitly as a required deployment skill —
this proves the whole stack (React SPA + Express API + MongoDB Atlas + cross-origin cookie auth)
actually works across two different real domains, not just `localhost`.

**Live URLs:**
- Frontend: `https://frontend-psi-livid-23.vercel.app`
- Backend: `https://rivavio.onrender.com` (`GET /` → `{"message":"running"}`)

**Key design notes:**
- Backend CORS already read `process.env.ORIGIN` — just had to be pointed at the real Vercel URL.
- Cross-origin cookie auth (`sameSite:'None', secure:true` when `PRODUCTION==='true'`, in
  `Auth.js`'s `res.cookie(...)` calls) had never been exercised across two genuinely different
  domains before — confirmed working for real in this deploy.
- Same MongoDB Atlas cluster is used by both local dev and the deployed backend — no DB migration
  needed.
- Render's free tier spins the service down after ~15 min idle; the first request after idle
  takes 30-50s to cold-start. Worth mentioning proactively in an interview, not a bug.

**Verified via automated browser testing (Playwright, headless Chromium) against the live
deployed stack** — full signup → OTP-bypass → login → create business → dashboard → create bill
→ record payment → ledger → staff flow, all against `https://frontend-psi-livid-23.vercel.app`
talking to `https://rivavio.onrender.com`. Business creation correctly landed on the dashboard
(no 404 — confirms the routing-race fix from section 6 holds in production too), and the bill's
pricing math matched exactly: 10g @ ₹6000/g, 5% wastage → 10.5g effective weight, ₹63,000 metal
value, ₹6,300 making charge, ₹2,079 GST, ₹71,379 total.

**Role of this deployment:** Vercel+Render is a staging/proof environment for this specific
skill (verify here first), not a replacement for the real site — `rivavio.com` stays on AWS EC2.
An existing `.github/workflows/deploy.yml` GitHub Action already auto-deploys every push to
`main` to AWS (SCP the frontend build + nginx config, SSH `git pull` + rebuild the backend Docker
image) — so once a change is verified on Vercel/Render, pushing it to `main` also syncs it to the
real `rivavio.com` automatically, no separate manual AWS deploy step needed.

**Verified on rivavio.com directly (2026-08-26):** confirmed the auto-deploy actually landed by
checking the two most recent pushes' GitHub Actions runs (`deploy.yml`) — both `completed`/
`success`. Then re-ran the full Playwright signup → business → bill → payment → ledger → staff
flow a second time against `https://rivavio.com` itself (same shared MongoDB Atlas cluster as
local/Render — the OTP-bypass-by-DB-write trick worked unchanged). Every step passed identically,
same ₹71,379 pricing result, confirming the AWS production site has the same verified behavior.

---

## 9. Staff-invite email notification + a real CI/CD deploy bug

**What:** `inviteStaff` (`backend/controllers/Business.js`) previously only updated the DB —
the invited user had no way to know they'd been added to a business. Added a `sendMail(...)`
call after the invite succeeds. Along the way, discovered email delivery itself needed fixing,
and then discovered the AWS deploy pipeline had been silently broken.

**Why:** A silent feature (no notification) is a worse staff-management UX than an obviously
incomplete one — the invited person would only find out by being told outside the app.

**Bug #1 — Gmail SMTP silently drops mail sent from cloud server IPs.** The original
`Emails.js` used `nodemailer` + a personal Gmail account's App Password. Sending worked from a
local dev machine but **silently failed with no error and no bounce** when sent from Render's or
AWS's server IPs — Google's spam heuristics accept-then-discard mail from unrecognized
cloud/datacenter IPs without an SPF/DKIM-aligned sending domain. **Fix:** switched to
[Resend](https://resend.com) (a dedicated transactional email API) with `rivavio.com` verified
as a sending domain (DKIM/SPF/DMARC records added via Cloudflare, which turned out to be the
domain's actual DNS host — Namecheap is only the registrar). `Emails.js`'s exported `sendMail(to,
subject, body)` signature was kept identical, so no caller (OTP, password reset, staff invite)
needed to change.

**Bug #2 — the AWS backend deploy pipeline had been silently no-op'ing for the rest of this
session.** Earlier in this session, an unrelated git-history rewrite (`git filter-branch` +
force-push, to strip a `Co-Authored-By: Claude` trailer from old commits) made the EC2 server's
existing local clone diverge from `origin/main`. `.github/workflows/deploy.yml`'s backend job ran
`git pull origin main` over SSH **without `set -e`** — so when the pull failed (unrelated
histories), the script didn't stop; it went on to `docker-compose down && docker build && up -d`
using the *same stale, un-pulled code* every time, and still exited 0. GitHub Actions reported
`success` on every push after the rewrite, even though nothing backend-side was actually
deploying — confirmed by finding the EC2 server's `git log` still pointed at a commit from
several features ago, while the frontend deploy job (a separate GitHub-runner build + `scp`,
never dependent on the server's git state) kept working normally the whole time. This is why the
earlier "verified on rivavio.com" browser test looked clean: it only exercised behavior that
hadn't changed backend-side since that stale commit.

**Fix:** `deploy.yml`'s backend job now does `set -e` + `git fetch && git reset --hard
origin/main` instead of `git pull` — a divergent/stale server clone self-heals by force-matching
the remote instead of silently failing to update.

**Manual test:** invited a real, checkable email (`mail.nrj@gmail.com`, the same account used as
the old Gmail sender) as staff from a live AWS test business, and confirmed the notification
email actually arrived in that inbox after both fixes landed.

---

## 10. Google OAuth ("Sign in with Google") — configured for real

**What:** `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CALLBACK_URL` had existed as empty
placeholders in `.env` since before this session — the code path (`backend/config/passport.js`,
gated by `isGoogleAuthConfigured`) was already written and correctly returned a 503 rather than
crashing, but the feature had simply never been set up with real credentials.

**Why:** "Sign in with Google" was a visible, advertised feature that silently 503'd — worth
actually finishing rather than leaving half-built.

**Setup:** created a Google Cloud Console project + OAuth consent screen + OAuth 2.0 Web
credentials, with all three environments' callback URLs registered as authorized redirect URIs:
`http://localhost:8000/...`, `https://rivavio.com/...`, `https://rivavio.onrender.com/...`.

**Manual test:** confirmed via `GET /api/auth/google` on all three environments (local, AWS,
Render) that the response is a `302` redirecting to `accounts.google.com` with the correct
`client_id` and `redirect_uri` (previously a `503 Google sign-in is not configured yet`). The
final interactive login click-through (choosing a real Google account) is left for the user to
do themselves, since it runs through their personal Google session in-browser.

---

## 11. Shopify embedded app — deployed permanently, webhook confirmed

**What:** `shopify-app-demo/` (a separate, isolated Shopify CLI-scaffolded embedded app — see
earlier notes on Admin GraphQL product listing, OAuth, and the `products/update` webhook) had
only ever run in Shopify CLI's local dev-tunnel mode (`npm run dev`), which requires a terminal
to stay open and dies the moment it's closed. Deployed it permanently to its own Render Web
Service (`https://jewelry-shop-connect.onrender.com`, Root Directory `shopify-app-demo`, using
its own scaffolded `Dockerfile`) so the app is demoable without any local process running.

**Why:** A dev-tunnel-only demo isn't presentable to an interviewer or client without keeping a
terminal open and screen-sharing awkwardly — a permanent URL is table stakes for a "finished"
demo.

**Setup:** updated `shopify.app.toml`'s `application_url` and `[auth] redirect_urls` to the new
Render URL, ran `npm run deploy` (Shopify CLI, interactive login) to push the new config to
Shopify's servers as a new app version, then reinstalled the app on the dev store (its session
storage is Prisma+SQLite on Render's ephemeral disk — free tier restarts wipe it, so a
re-install/re-auth is expected occasionally, same caveat as Render's cold-start behavior
elsewhere in this project).

**Manual test:** opened the app on the dev store (loaded correctly from the Render URL, not the
old dev tunnel), confirmed the embedded Products page still works via Admin GraphQL, then edited
a real product's title/price on the dev store and confirmed via Render's Logs tab that the
`products/update` webhook fired and was received by the deployed app.

---

<!-- Add new entries above this line, following the same format: What / Why / Files / Manual test -->
