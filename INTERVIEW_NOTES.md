# SaaS Module — Interview Prep Notes (Q&A)

This file is being written alongside the multi-tenant SaaS extension being built into Revivio.
After each feature, the concepts related to that feature are added here in Q&A format — the way
interviews actually probe a project: "why did you do this, what's it for."

Format: **phase-wise sections**, each with `Q: ... / A: ...`.

---

## Phase 1 — Tenant Skeleton: User model + sanitizeUser

### Q: How many ways are there to implement multi-tenancy, and which one did we pick?
**A:** Three standard patterns:
- **Silo model** — a completely separate database per tenant. Most secure, most expensive (N databases to manage).
- **Bridge/Schema model** — shared DB, a separate schema or collection prefix per tenant.
- **Pool model** — one shared collection, with a `tenantId`/`businessId` field on each document identifying its owner.

We chose the **pool model** (`User.businessId`, later referencing `Business._id`): cheap and easy
to scale, but isolation now depends on **application code** (query filters) — the database itself
won't stop anyone. That's exactly why a separate tenant-scoping middleware is necessary (the next
step in Phase 1).

### Q: `businessId: { ref: "Business" }` — what does "ref" do, and how do joins even work in MongoDB?
**A:** MongoDB isn't relational — there's no native JOIN. Two options exist:
- **Embedding** — nest the related data directly inside the document. Fast reads, but data can
  get duplicated/bloated, and it's hard to query independently.
- **Referencing** — store only the ObjectId (like `ref: "Business"`), then use Mongoose's
  `.populate()` to get a join-like result.

Business is an independent entity that grows on its own (multiple users will attach to it in the
future), so referencing is the right choice — embedding would have duplicated Business data
inside every single User document.

### Q: Existing User documents don't even have the `businessId` field — do we need to run a migration?
**A:** No. MongoDB is **schema-on-read** — when Mongoose reads an old document that's missing the
field, it automatically applies the schema's `default: null` in memory. SQL databases don't give
you this for free — there you'd have to run `ALTER TABLE ... ADD COLUMN` and backfill existing
rows. This is a practical advantage of NoSQL for additive schema changes.

### Q: What does the `sanitizeUser` function do, and why is it necessary?
**A:** It's a **whitelist function** — out of the full User document coming from Mongoose (which
includes the `password` hash, `__v`, `googleId`, and other internal/sensitive fields), it returns
only the explicitly-listed safe fields (`_id, email, isVerified, isAdmin, businessId`). It's used
in two places: (1) the API response body, (2) the JWT payload.

### Q: Why is a whitelist approach better than a blacklist (`delete user.password`)?
**A:** Blacklist = "send everything except X" — if a new sensitive field is ever added to the
User model and someone forgets to exclude it, it leaks automatically (**fail-open**). Whitelist =
"only these fields are allowed" — a new field stays hidden by default until it's explicitly added
to the whitelist (**fail-safe**). Security-critical code should always prefer fail-safe design.

### Q: Why not just put the whole user object in the JWT — why only four or five fields?
**A:** JWT is a **stateless auth** mechanism — the server doesn't hit the DB on every request to
verify the user; the token itself carries signed, tamper-proof claims. The payload is kept small
for two reasons:
1. The token travels with every request (in a cookie/header) — a bigger payload means wasted
   bandwidth on every single call.
2. Sensitive data (password hash) should never be in the token, no matter how "signed" it is —
   JWT is signed, not encrypted — anyone can base64-decode the payload and read it.

**A trade-off interviews love to probe:** the downside of stateless JWT is that if a user's data
(like `businessId`) changes after login, the previously-issued token still reflects the old data
until a fresh login/token-reissue happens — because the server doesn't re-check the DB on every
request. That's exactly why creating a Business requires **re-issuing** the JWT (covered later).

### Q: Why is `??` (nullish coalescing) better than `||` here?
**A:** `user.businessId || null` would incorrectly convert any falsy-but-valid value (like `0` or
`""`) to `null` too. `??` only replaces `null`/`undefined`, leaving every other value (including
`0`, `false`, `""`) untouched. A small detail, but it signals "edge cases were actually
considered."

### Q: Only `User.js` and `SanitizeUser.js` were touched — why not `Auth.js` (the login/signup logic)?
**A:** `sanitizeUser()` is a **single choke-point** through which both the JWT payload and every
API response get shaped. Every JWT-issuing call in Auth.js (signup, login, checkAuth,
googleCallback) already calls this one shared function — so editing a single function made
`businessId` flow through the entire pipeline automatically, without touching Auth.js's actual
business logic (password hashing, cookie options, etc.). This is a practical example of the
**Single Responsibility Principle**: one function, one job (producing a safe shape), and every
consumer depends on it.

---

## Phase 1 — Business model

### Q: Why a separate `ownerUserId` — doesn't `User.businessId` already tell us who belongs to which business?
**A:** `User.businessId → Business` tells you one direction ("this user is part of this
business"), but "which user is the **owner/creator** of this business" is different information
(especially once multiple staff/employees join the same business in the future — they'll all
share the same `businessId`, but there's only one owner). A bidirectional reference is necessary
because billing, permissions, and decisions like "who can delete/deactivate this business" depend
on owner identity.

### Q: What does `plan: { enum: ["trial","basic","pro"] }` actually guarantee?
**A:** A Mongoose-level validation constraint — only the listed values can be saved; trying to
save any other string throws a `ValidationError`. An interview-relevant point:
**MongoDB has no native enum type of its own** (unlike several SQL databases that support a
native ENUM type) — Mongoose enforces this at the **application/ODM layer**. The database itself
won't stop you if you insert directly via the raw MongoDB driver, bypassing Mongoose.

### Q: What's the `isActive: Boolean` field for — why not just delete a business?
**A:** **Soft-delete pattern.** In a system dealing with financial/ledger data, you never
hard-delete (`document.remove()`) — business history, past invoices, and ledger entries need to
be preserved legally and practically (audit trail). So "deactivating" is just flipping a flag
(`isActive: false`) — the data stays in the database, only new operations get blocked. This
pattern will be used in the tenant-scoping middleware (rejecting any request from a deactivated
business, even if its JWT is still technically valid).

---

## Phase 1 — Tenant middleware

### Q: `tenantMiddleware` calls `verifyToken` itself — how does that actually work?
**A:** An Express middleware is just a plain function with the signature `(req, res, next)` —
there's no framework magic to it. `tenantMiddleware` internally calls `verifyToken(req, res,
callback)`, where `callback` is itself a custom function that does the tenant-specific check
(does `businessId` exist), then calls the real `next()`. This is the exact same pattern already
used by `adminMiddleware` (`middleware/auth.js`). It makes **composing/layering middleware** easy
— "first check login, then do an extra business check" — without duplicating `verifyToken`'s
code.

### Q: `verifyToken` returns 401, `tenantMiddleware` returns 403 — what's the difference?
**A:** Classic HTTP semantics:
- **401 Unauthorized** = you haven't even been identified (token missing/invalid/expired) —
  "authenticate first."
- **403 Forbidden** = you've been identified (valid token), but you don't have permission for
  this specific action (no business account) — "we know who you are, but you can't do this."

This distinction is a very common interview question — using the wrong status code everywhere
(e.g. sending 401 for everything) is a common mistake that gets flagged in API design reviews.

### Q: Why the extra `req.businessId = req.user.businessId` line — why not just use `req.user.businessId` directly in controllers?
**A:** This is an **indirection layer**. Right now `req.businessId` is just copied from the JWT
payload (trusting the token). In Phase 2, when we also verify `Business.isActive` against the
DB, only this one line needs to change (`req.businessId = verifiedBusiness._id`) — no controller
that already uses `req.businessId` needs to change at all. This is a small example of the
**Open/Closed Principle**: adding new behavior didn't require modifying existing consumers.

---

## Phase 1 — Business controller + routes + index.js mount

### Q: `authMiddleware` on the `create` route, `tenantMiddleware` on `getMine` — why not the same middleware everywhere?
**A:** Every route has a different authorization requirement. Creating a business only requires
being logged in — `tenantMiddleware` would fail here anyway, since no business exists yet at that
point (a chicken-and-egg problem). Fetching a business (`getMine`) requires an already-existing
business — that's the correct use-case for `tenantMiddleware`. "Just slap the same middleware on
everything" is a common mistake that creates access-control bugs.

### Q: Why fetch `User.findById()` again from `req.user._id` — why not use `req.user` directly?
**A:** `req.user` is the JWT payload, a **plain object snapshot** (can be stale, only has
whitelisted fields) — it's not a Mongoose document, so you can't call `.save()` on it. Creating a
business needs the actual DB record so `businessId` can be set on it and `.save()`d. This is the
**"JWT claims vs. DB source-of-truth"** distinction — conflating the two (treating the JWT
payload as if it were the DB record) is a common real-world bug.

### Q: What problem does the slug-collision handling (`while` loop, `-1`, `-2` suffix) solve?
**A:** Two businesses can be created with the same name ("Sharma Jewellers" could have multiple
owners) — both would derive the slug `sharma-jewellers`, which collides, and the `unique: true`
index would reject it at the DB level. The loop checks "does this slug already exist?" — if so,
it appends a numeric suffix and retries until it finds a unique one. This is an **optimistic
uniqueness resolution** (a production-grade version would also catch the DB's unique-index
violation error to handle race conditions, but this is appropriate for Phase 1).

### Q: Why re-generate the JWT after creating a business (`generateToken` called again)?
**A:** When the request came in, its JWT (`req.user`) didn't have `businessId` (the business
didn't exist yet). Now that the User document has been updated (`businessId` set), the old token
is still stale — the next request will need `tenantMiddleware` to find `businessId` in the JWT.
So inside `create` itself, a new token is generated and the cookie is replaced — the same pattern
already used by `Auth.js`'s `googleCallback`. This is the practical fix for the stateless-JWT
trade-off discussed earlier.

### Q: Only 2 lines were added to `index.js`, nothing reordered — why is that safe?
**A:** Express matches middleware/routes in **registration order**, but every new router is
mounted on its own path prefix (`/api/saas`), which doesn't overlap with any existing prefix
(`/api/orders`, `/api/cart`, etc.). So this new router can be added anywhere (above or below),
and existing routes' behavior doesn't change at all. This is exactly why "additive-only" changes
are low-risk — as long as the new code doesn't collide with an existing path/name.

---

## Phase 1 — Manual end-to-end verification (curl + cookie jar)

### Q: Unit tests already passed — why also manually hit the running server with curl?
**A:** Unit tests (Phase 1's 32 Jest tests) verify **pure functions in isolation** — no HTTP, no
cookies, no DB. They can't catch integration-level mistakes: is the route actually mounted, does
the cookie actually get set with the right options, does middleware ordering actually behave the
way it's designed to across two real, separate HTTP requests. Manual end-to-end testing with a
running server is what catches "the pieces are individually correct but wired together wrong."
Both matter; neither replaces the other.

### Q: Why `curl -c cookies.txt` / `-b cookies.txt` instead of just hitting the URL?
**A:** Login here is **cookie-based** (`httpOnly` cookie named `token`, not a header). `-c` tells
curl to save any `Set-Cookie` response header into a file (a "cookie jar"); `-b` tells curl to
send whatever's in that file back as the `Cookie` request header on the next call. This
simulates exactly what a browser does automatically — necessary because without it, every curl
call would be a fresh, anonymous request with no session at all.

### Q: What did the negative-path checks (401 with no cookie, 403 with a cookie but no business) actually prove?
**A:** They proved the two middleware layers **fail in the right order and for the right reason**
— not just that the happy path works. This matters because it's very easy to write middleware
that accidentally lets an unauthenticated request slip through, or that returns the wrong status
code (e.g. 500 instead of 401/403) when a precondition isn't met. Testing failure paths
explicitly, not just success paths, is a core habit in interviews' favorite question: "how do you
test negative cases?"

### Q: Why do the response headers show `Access-Control-Allow-Credentials: true` and a specific `Access-Control-Allow-Origin` (not `*`)?
**A:** Frontend runs on `:3000`, backend on `:8000` — different port means a different **origin**
under the CORS spec, so this is a cross-origin request even though both are "localhost." Browsers
block cookies on cross-origin requests by default unless the server opts in. Two things are
required together: `Access-Control-Allow-Credentials: true` tells the browser cookies are
allowed on this request, and when credentials are involved, `Access-Control-Allow-Origin` **can
never be `*`** — it must name a specific origin (otherwise any website could silently ride on a
logged-in user's cookies). This is exactly what `cors({ origin: process.env.ORIGIN, credentials:
true })` in `index.js` configures — observed directly from a real response header, not just read
in the code.

### Verification (manual, ran against the live dev server)
Signed up a fresh user (`businessId: null` in the response, as expected) → created a business
(response shows a fresh JWT with `businessId` populated) → `GET .../businesses/me` succeeded →
a second `create` attempt for the same user was rejected (400) → a request with no cookie at all
got 401 → a request with a valid cookie but no business got 403. Existing store routes
(`/api/products`, `/`) still returned 200 untouched.

---

## Standalone module — Postgres Row-Level Security demo (`postgres-rls-demo/`)

A separate, isolated side-project (not part of the Mongo/Rivavio backend at all) that
re-implements the same tenant-isolation problem — but using Postgres's native mechanism instead
of hand-written application code — so there's a direct, concrete comparison to point to.

### Q: What's the actual difference from the Mongo `tenantMiddleware` approach?
**A:** In Mongo, isolation is an **application-layer convention**: `tenantMiddleware` sets
`req.businessId`, and every controller must remember to add `businessId: req.businessId` to its
query. In Postgres, **Row-Level Security (RLS)** attaches the filter to the table itself — a
policy's `USING` clause runs on every `SELECT`/`UPDATE`/`DELETE` automatically, from any code
path, with no per-query opt-in to forget. The test file proves this literally: every RLS test
query is `SELECT * FROM bills` with **no `WHERE business_id = ...` written anywhere** — isolation
still holds.

### Q: Two real bugs came up while building this — what were they, and why do they matter?
**A:** Both are genuine, well-known Postgres RLS gotchas, not made up for the demo — they're
worth remembering exactly because they're the kind of thing that looks fine in code review and
only shows up when you actually run it:

1. **Superusers bypass RLS unconditionally.** The first test run showed *zero* isolation at
   all — every session saw every row. Cause: Docker's `POSTGRES_USER` env var creates a
   **superuser**, and Postgres superusers skip RLS entirely, no matter what. `FORCE ROW LEVEL
   SECURITY` does NOT override this — `FORCE` only cancels the *table owner* bypass; the
   superuser bypass can't be turned off at all. Fix: the app must connect as a separate,
   deliberately unprivileged role (`app_user`) — which is also just correct production practice
   (never connect your app with admin/superuser credentials).
2. **A rolled-back custom GUC can read back as `''`, not `NULL`.** After fixing #1, one test
   still failed — `''::uuid` threw a cast error instead of the query returning zero rows. Cause:
   `app.current_business_id` is a *custom* (unregistered) session variable; on a pooled
   connection, once it's been `SET LOCAL`-ed and rolled back, Postgres can leave it readable as
   an empty string rather than a true NULL. Fix: `NULLIF(current_setting(...), '')::uuid` folds
   `''` back to NULL *before* the cast, so "no tenant context" fails closed (zero rows) instead
   of throwing.

### Q: Why did `beforeAll` seed data with a separate `demo` (superuser) connection, but the actual test queries use `app_user`?
**A:** Mirrors real deployments: a migration/seed script legitimately needs unrestricted access
(it's setting up data for *every* tenant at once, before any tenant context exists), but the
running application should only ever hold a restricted role's credentials, subject to RLS like
any other client. Using the superuser for both would have hidden bug #1 above completely — the
seeding step happening to work isn't evidence the policy works.

### Verification
`docker compose up -d` (Postgres 16, `schema.sql` auto-applied via
`docker-entrypoint-initdb.d`) → `npm install && npm test` → all 5 tests pass: per-tenant
isolation on unfiltered reads, fail-closed with no tenant context, a cross-tenant `INSERT`
rejected by `WITH CHECK`, and a cross-tenant `UPDATE` silently affecting zero rows via `USING`.
