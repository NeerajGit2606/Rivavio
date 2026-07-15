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

## 6. Postgres RLS Demo (isolated side-project)

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

<!-- Add new entries above this line, following the same format: What / Why / Files / Manual test -->
