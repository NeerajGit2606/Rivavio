# Rivavio SaaS Module — Test Case Inventory

Master list of every test case written for the SaaS module, automated and manual. Updated
alongside [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) after every feature.

Run all automated suites: `cd backend && npm test` (Mongo-backed) and
`cd postgres-rls-demo && npm test` (Postgres-backed, needs `docker compose up -d` first).

Legend — **Type**: `Unit` (pure function, no DB) · `Integration` (mongodb-memory-server /
Docker Postgres) · `Manual` (curl/psql, human-run).

---

## Phase 1 — Financial Engine (Unit · `backend/utils/__tests__/`)

| File | Test Case | Verifies | Status |
|---|---|---|---|
| money.test.js | round-trips a simple rupee amount | toPaise/fromPaise basic conversion | Pass |
| money.test.js | round-trips a fractional rupee amount | Decimal fraction handling | Pass |
| money.test.js | avoids floating point drift (0.1+0.2 style) | Decimal.js prevents binary float error | Pass |
| money.test.js | rounds half-up at the boundary deterministically | ROUND_HALF_UP explicit & consistent | Pass |
| money.test.js | rejects non-finite input to toPaise | Input validation (NaN/Infinity) | Pass |
| money.test.js | rejects non-integer input to fromPaise | Input validation (paise must be int) | Pass |
| jewelryPricing.test.js | basic whole-gram round-rate zero-wastage case | Core pricing formula correctness | Pass |
| jewelryPricing.test.js | retains fractional-gram precision (10.375g) | No precision loss on fractional weights | Pass |
| jewelryPricing.test.js | wastage % applied before rate multiplication | Correct order of operations | Pass |
| jewelryPricing.test.js | zero wastage leaves weight unchanged | Edge case: 0% wastage | Pass |
| jewelryPricing.test.js | making charge — % of metal value | Making charge mode 1/3 | Pass |
| jewelryPricing.test.js | making charge — flat rate per gram | Making charge mode 2/3 | Pass |
| jewelryPricing.test.js | making charge — flat total | Making charge mode 3/3 | Pass |
| jewelryPricing.test.js | GST computed on (metal+making) not metal alone | Correct GST base | Pass |
| jewelryPricing.test.js | zero making charge → 0 not NaN | Edge case: no making charge | Pass |
| jewelryPricing.test.js | very small weight (0.001g) doesn't underflow | Edge case: tiny weight | Pass |
| jewelryPricing.test.js | large rate (platinum-style), no overflow | Edge case: high-value rate | Pass |
| jewelryPricing.test.js | rounds half-paise boundary deterministically | Rounding boundary determinism | Pass |
| jewelryPricing.test.js | rejects invalid input (negative/bad enum) | Input validation | Pass |
| jewelryPricing.test.js | invariant: metal+making+gst === total | No rounding drift in line-item sum | Pass |
| ledgerEngine.test.js | single bill payment exactly covers it | FIFO allocation basic case | Pass |
| ledgerEngine.test.js | single bill partial payment | FIFO allocation partial case | Pass |
| ledgerEngine.test.js | multiple bills — oldest paid fully, next partial | FIFO ordering by dueDate | Pass |
| ledgerEngine.test.js | payment exceeds outstanding → unallocatedPaise | Overpayment handling | Pass |
| ledgerEngine.test.js | zero payment amount is a no-op | Edge case: zero payment | Pass |
| ledgerEngine.test.js | empty bills array → all unallocated | Edge case: no open bills | Pass |
| ledgerEngine.test.js | tied due dates resolve deterministically by billId | Deterministic tie-breaking | Pass |
| ledgerEngine.test.js | zero-outstanding bill in list is skipped cleanly | Edge case: already-paid bill | Pass |
| ledgerEngine.test.js | invariant: sum(allocated)+unallocated === payment | Conservation-of-money invariant | Pass |
| ledgerEngine.test.js | rejects non-integer payment amount | Input validation | Pass |
| ledgerEngine.test.js | rejects bill with negative outstandingPaise | Input validation | Pass |
| ledgerEngine.test.js | handles 50 bills, still sums correctly | Scale/stress case | Pass |

## Phase 1 — Tenant Skeleton (Manual · curl against live dev server)

| Test Case | Verifies | Status |
|---|---|---|
| GET /api/products and GET / still return 200 | Existing e-commerce routes unaffected | Pass |
| POST /api/auth/signup returns businessId:null | New user has no business by default | Pass |
| POST /api/saas/businesses creates business + reissues JWT | Business creation + JWT refresh flow | Pass |
| GET /api/saas/businesses/me returns correct business | tenantMiddleware + business fetch | Pass |
| Second POST /api/saas/businesses for same user → 400 | Duplicate business creation blocked | Pass |
| Request with no cookie → 401 | verifyToken authentication check | Pass |
| Valid cookie but no business → 403 | tenantMiddleware authorization check | Pass |

## Phase 2 — Bill/Ledger Persistence (Integration · `mongodb-memory-server`, `billing.test.js`)

| Test Case | Verifies | Status |
|---|---|---|
| Counter race safety — concurrent createBill calls | Atomic invoice numbering under concurrency | Pass |
| Rejects invalid pricing (400) without touching counter | No wasted bill numbers on validation failure | Pass |
| Persists paidPaise/status + one credit LedgerEntry/allocation | End-to-end payment allocation wiring | Pass |
| Rollback — mid-transaction failure leaves DB fully unchanged | Multi-document transaction atomicity | Pass |

## Phase 2 — Tenant Isolation (Integration · `tenantIsolation.test.js`)

| Test Case | Verifies | Status |
|---|---|---|
| Business A cannot read Business B's bill or its ledger | Cross-tenant read isolation (404 not leak) | Pass |
| Business A's payment never applies to B's bill (same phone) | Cross-tenant write isolation | Pass |
| Business A only ever sees its own bills in getAll | Cross-tenant list isolation | Pass |

## Role-Based Access (Integration · `staffAccess.test.js`)

| Test Case | Verifies | Status |
|---|---|---|
| Owner successfully invites an existing user | Happy path staff invite | Pass |
| Rejects inviting a nonexistent email | Invite validation — unknown user | Pass |
| Rejects inviting yourself | Invite validation — self-invite blocked | Pass |
| Rejects inviting someone in another business | Invite validation — single-membership rule | Pass |
| Rejects inviting the same person twice | Invite validation — duplicate blocked | Pass |
| Returns owner+staff for the business, never password | listStaff correctness + no password leak | Pass |
| Owner can remove staff; their businessId/role → null | removeStaff happy path | Pass |
| Cannot remove the business owner | removeStaff guard rule | Pass |
| Blocks a staff-role JWT with 403, never calls next() | ownerMiddleware denies non-owner | Pass |
| Allows an owner-role JWT through to next() | ownerMiddleware allows owner | Pass |

## Role-Based Access (Manual · curl)

| Test Case | Verifies | Status |
|---|---|---|
| Owner invites existing user by email | inviteStaff happy path via HTTP | — |
| GET /businesses/staff shows both members, no password field | listStaff via HTTP | — |
| Staff member's own token tries to invite → 403 | ownerMiddleware enforced via HTTP | — |
| Owner removes staff → listStaff shows only owner | removeStaff via HTTP | — |
| Owner tries to remove own id → 400 | removeStaff guard via HTTP | — |

## Postgres RLS Demo (Integration · Docker Postgres + `pg`, `rls.test.js`)

| Test Case | Verifies | Status |
|---|---|---|
| Business A's session sees only A's bill, no WHERE clause | RLS enforces isolation w/o app filtering | Pass |
| Business B's session sees only B's bill, no WHERE clause | RLS enforces isolation w/o app filtering | Pass |
| No tenant context set → zero rows | Fail-closed default when context missing | Pass |
| Business A cannot INSERT under Business B's business_id | RLS WITH CHECK blocks cross-tenant writes | Pass |
| Business A's UPDATE on B's row affects zero rows, no error | RLS USING silently filters cross-tenant updates | Pass |

---

<!--
Add new rows under the relevant feature's table (or a new table for a new feature) after every
code change. Mark manual-only rows "—" until the user has actually run and confirmed them, then
update to Pass/Fail.
-->
