# Rivavio — Complete Feature Testing Guide

> **Environment**: Start backend on `localhost:8000` and frontend on `localhost:3000` before running any test.
>
> **Admin creds**: Use an account with `isAdmin: true` in DB, or set it manually via MongoDB Compass.
>
> **Status column**: Fill ✅ PASS / ❌ FAIL / ⚠️ PARTIAL after each test.

---

## MODULE 1 — Authentication & User Accounts

### TC-AUTH-01: Normal Signup + OTP Verify
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to `/signup`, fill name/email/password, submit | User created, redirected to `/verify-otp` | |
| 2 | Check email inbox for OTP email | Email received with 6-digit OTP | |
| 3 | Enter OTP on `/verify-otp` page | Redirected to homepage, logged in | |
| 4 | Check Navbar shows user name/avatar | User is logged in | |

### TC-AUTH-02: Login + Logout
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to `/login`, enter valid credentials | Redirected to homepage, logged in | |
| 2 | Go to `/logout` | Redirected to login, session cleared | |
| 3 | Try accessing `/cart` directly | Redirected to `/login` (Protected route) | |

### TC-AUTH-03: Forgot Password Flow
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to `/forgot-password`, enter registered email | "Reset link sent" message shown | |
| 2 | Check email inbox for reset link | Email received with reset link (URL format: `/reset-password/:userId/:token`) | |
| 3 | Click link, enter new password | Password changed success message | |
| 4 | Login with new password | Login successful | |

### TC-AUTH-04: Guest Checkout Modal
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Logout completely, go to `/products` | No session cookie | |
| 2 | Click "Add to Cart" on any product card | GuestCheckoutModal dialog opens (not normal add-to-cart) | |
| 3 | In modal, fill Name + Email, click "Continue as Guest" | Session created, item added to cart, modal closes | |
| 4 | Go to `/cart` — item is there | Cart shows the product | |
| 5 | Check MongoDB `users` collection | New user with `isGuest: true` exists | |

### TC-AUTH-05: Google OAuth (only if keys configured)
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to `/login`, click "Continue with Google" | Redirected to Google consent screen | |
| 2 | Complete Google login | Redirected back to homepage, logged in | |
| 3 | If keys NOT configured | GET `/api/auth/google` returns 503 with message "not configured yet" | |

---

## MODULE 2 — Coupon System

### TC-COUPON-01: Admin Creates Coupon
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Login as admin, go to `/admin/coupons` | Coupons management page loads | |
| 2 | Create a **percentage** coupon: Code=`SAVE10`, Type=percentage, Value=10, MinOrder=500, MaxDiscount=200, Expiry=future date | Coupon appears in list with all fields | |
| 3 | Create a **flat** coupon: Code=`FLAT50`, Type=flat, Value=50, MinOrder=0, Expiry=future date | Coupon appears in list | |
| 4 | Try creating duplicate code `SAVE10` | Error: "A coupon with this code already exists" (400) | |

### TC-COUPON-02: Coupon Validation at Checkout
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Add products to cart, go to `/checkout` | Checkout page loads with coupon input field | |
| 2 | Enter `SAVE10`, click Apply | Coupon applied: "10% off" discount line shown in cart summary | |
| 3 | Verify discount math: cart ₹1000 → discount ₹100 (10%, max ₹200) | Cart total drops by correct amount | |
| 4 | Click "Remove" on coupon | Coupon removed, original total restored | |

### TC-COUPON-03: Coupon Edge Cases
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Enter invalid code `FAKECODE` | Error: "Invalid coupon code" | |
| 2 | Create expired coupon (expiry = yesterday), try to apply | Error: "This coupon has expired" | |
| 3 | Create coupon with usageLimit=1, use it once, try again | Error: "This coupon has reached its usage limit" | |
| 4 | Apply `SAVE10` with cart total = ₹300 (below ₹500 minimum) | Error: "Minimum order value of ₹500 required" | |

### TC-COUPON-04: Coupon Security (Server-side Validation)
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Apply coupon, note discountAmount on frontend | Frontend shows correct discount | |
| 2 | Place order — check order in MongoDB | Order's `discountAmount` was computed by backend (not trusted from client) | |
| 3 | Check `coupon.usedCount` in DB after order | `usedCount` incremented by 1 | |
| 4 | Admin deletes coupon from `/admin/coupons` | Coupon removed from list (204 response) | |

---

## MODULE 3 — Wallet & Loyalty Points

### TC-WALLET-01: Loyalty Points Earned on Purchase
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Place an order for ₹1000 (final total after discounts) | Order created successfully | |
| 2 | Go to `/profile` → check Wallet/Loyalty section | `loyaltyPoints` increased by ~10 (1% of ₹1000) | |
| 3 | Check MongoDB `users` doc | `loyaltyPoints: 10` (or `Math.round(1000 * 0.01)`) | |

### TC-WALLET-02: Wallet Balance at Checkout
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Manually set `walletBalance: 500` for test user in MongoDB | - | |
| 2 | Go to `/checkout` | "Use Wallet Balance (₹500)" checkbox appears | |
| 3 | Check the wallet checkbox | Wallet deduction line shown in cart summary, grand total reduces | |
| 4 | Place order | Order saved with `walletAmountUsed: 500` (or up to cart total) | |
| 5 | Check user's `walletBalance` in MongoDB | Balance reduced by the amount used | |

### TC-WALLET-03: Cancellation Reversal
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Note user's wallet balance + loyalty points before cancellation | Record initial values | |
| 2 | Admin goes to `/admin/orders`, changes order status to "Cancelled" | Status updated | |
| 3 | Check user's MongoDB doc | `walletBalance` restored, `loyaltyPoints` deducted by `loyaltyPointsEarned` | |

---

## MODULE 4 — Order Tracking Timeline

### TC-ORDER-01: Order Status Stepper
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Place an order, go to `/orders` | My Orders page shows new order with status "Pending" | |
| 2 | Check Order Tracking Timeline section | MUI Stepper shows: Pending (active) → Dispatched → Out for delivery → Delivered | |
| 3 | Admin updates order to "Dispatched" | Stepper moves to step 2 | |
| 4 | Admin updates to "Out for delivery" | Stepper moves to step 3 | |
| 5 | Admin updates to "Delivered" | Stepper shows all 4 steps completed | |
| 6 | Admin cancels an order (set to "Cancelled") | "Cancelled" Chip appears in red instead of stepper | |

### TC-ORDER-02: Status Change Emails
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Place order → check email | "Order Received" email received | |
| 2 | Admin changes to "Dispatched" | "Order Dispatched" email received | |
| 3 | Admin changes to "Delivered" | "Order Delivered" email received | |
| 4 | Admin cancels order | "Order Cancelled" email received | |

---

## MODULE 5 — Invoice PDF Download

### TC-INVOICE-01: Download Invoice
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to `/orders`, find a placed order | "Download Invoice" button visible | |
| 2 | Click "Download Invoice" | Browser downloads a PDF file | |
| 3 | Open the PDF | Contains: Order ID, date, items table, amounts, addresses | |
| 4 | Try accessing `/api/orders/:otherId/invoice` with different user's JWT | 403 Forbidden (auth check: own orders only) | |
| 5 | Admin can download any order's invoice | Admin JWT → 200 OK for any order ID | |

---

## MODULE 6 — Admin Analytics Dashboard

### TC-ANALYTICS-01: Dashboard Charts Load
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Login as admin, go to `/admin/analytics` | Page loads without errors | |
| 2 | Revenue card | Shows total revenue (excluding Cancelled orders) | |
| 3 | Total Orders card | Shows correct total count | |
| 4 | Sales by Day chart (LineChart) | Line chart of last 30 days (recharts LineChart renders) | |
| 5 | Order Status chart (PieChart) | Pie chart showing Pending/Dispatched/Delivered/Cancelled breakdown | |
| 6 | Top 5 Products table | Shows products sorted by quantity sold | |
| 7 | Non-admin user tries to access `/admin/analytics` | Redirected (admin route not visible to regular users) | |
| 8 | Direct API: GET `/api/orders/analytics` without admin JWT | 403 Forbidden | |

---

## MODULE 7 — Bulk CSV Product Upload

### TC-BULK-01: Valid CSV Upload
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to `/admin/bulk-upload` (admin only) | Page loads with file input and "Download Sample CSV" link | |
| 2 | Click "Download Sample CSV" | CSV downloaded with correct headers: `title,description,price,discountPercentage,category,brand,stockQuantity,thumbnail,images` | |
| 3 | Prepare valid CSV (use real category + brand names from DB) | - | |
| 4 | Upload the CSV | Response: `{inserted: N, failed: 0, errors: []}` | |
| 5 | Go to `/products` or admin products list | New products appear | |

### TC-BULK-02: CSV with Errors
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Upload CSV with one valid row + one row with unknown category | Response: `{inserted: 1, failed: 1, errors: ["Row 3: unknown category \"FakeCategory\""]}` | |
| 2 | Upload CSV with missing required field (no title) | Response: `{inserted: 0, failed: 1, errors: ["Row 2: missing required field(s)"]}` | |
| 3 | Upload empty CSV | 400: "CSV file is empty" | |
| 4 | Upload non-CSV file (e.g., .txt) | Error or empty parse result | |

---

## MODULE 8 — Product Recommendations

### TC-REC-01: Recommendations on Product Page
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to any `/product-details/:id` | Page loads | |
| 2 | Scroll down past reviews | "You May Also Like" ProductRow section appears | |
| 3 | Products shown in that row | All products are from the **same category** as current product | |
| 4 | Current product itself | NOT included in recommendations | |
| 5 | Click a recommended product | Navigates to that product's detail page | |

---

## MODULE 9 — Recently Viewed Products

### TC-RECENT-01: Recently Viewed Tracking
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Visit Product A details page | Product A ID stored in `localStorage.recentlyViewedProductIds` | |
| 2 | Visit Product B details page | Product B prepended to list (max 10) | |
| 3 | Go back to Product A | "Recently Viewed" row appears on Product A's page showing Product B (and others) | |
| 4 | Open browser DevTools → Application → Local Storage | `recentlyViewedProductIds` key exists with array of IDs | |
| 5 | Visit 11 different products | Only last 10 stored (oldest dropped) | |

---

## MODULE 10 — Product Compare

### TC-COMPARE-01: Add to Compare & View
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | On `/products` page, find a ProductCard | Compare icon button visible on card | |
| 2 | Click compare icon on Product A | Icon changes color (product added to compare) | |
| 3 | Click compare icon on Product B and C | Both added | |
| 4 | Open `localStorage` | `compareProductIds` key has array of 3 IDs | |
| 5 | Navigate to `/compare` | Comparison table shows all 3 products side by side | |
| 6 | Compare table shows | Image, title, price, brand, category, discount for each | |
| 7 | Try adding a 5th product | Toast/alert: "Maximum 4 products can be compared" | |
| 8 | Click compare icon again on added product | Product removed from compare list | |

---

## MODULE 11 — Wishlist Sharing

### TC-WISH-01: Share Wishlist
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Login, add products to wishlist, go to `/wishlist` | Wishlist page shows products | |
| 2 | Click "Share Wishlist" button | Clipboard notification: "Link copied!" | |
| 3 | Paste clipboard content | URL format: `http://localhost:3000/wishlist/shared/:userId` | |
| 4 | Open that URL in **incognito/different browser** (no login) | SharedWishlist page loads showing user's wishlist items (read-only) | |
| 5 | Shared wishlist page | Shows product cards but no "Remove from wishlist" button (read-only) | |

---

## MODULE 12 — Reviews: Images & Verified Purchase

### TC-REVIEW-01: Review with Images
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Go to a product detail page, scroll to reviews | Review form visible | |
| 2 | Fill review text + rating + image URLs (pipe-separated or comma-separated) | - | |
| 3 | Submit review | Review posted | |
| 4 | Review appears with image thumbnails below the text | Images clickable/shown inline | |

### TC-REVIEW-02: Verified Purchase Badge
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Place an order containing Product X | Order created | |
| 2 | Write a review for Product X with same user | Review submitted | |
| 3 | Review appears with "Verified Purchase" chip/badge | Green verified icon shown | |
| 4 | Write review for a product NOT purchased | No "Verified Purchase" badge on that review | |

---

## MODULE 13 — Abandoned Cart Email (Cron Job)

### TC-CRON-01: Abandoned Cart Detection
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Add items to cart, don't checkout | Cart item exists in MongoDB `carts` collection | |
| 2 | Manually set `updatedAt` to 4 hours ago in MongoDB for that cart doc | `updatedAt: <4hr ago>`, `reminderSent: false` | |
| 3 | Trigger cron manually: in Node REPL run `require('./utils/AbandonedCartCron').startAbandonedCartCron()` | Cron fires hourly | |
| 4 | Wait for cron tick (or manually call the function) | Reminder email sent to user's email | |
| 5 | Check cart doc in MongoDB | `reminderSent: true` set, so no duplicate emails | |
| 6 | Verify guest users skipped | Guest user (isGuest: true) with stale cart gets no email | |

---

## MODULE 14 — PWA (Progressive Web App)

### TC-PWA-01: Manifest & Install
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open `http://localhost:3000` in Chrome | Check DevTools → Application → Manifest | |
| 2 | Manifest loads | Name: "Rivavio", short_name: "Rivavio", theme_color: "#0F1111", icons present | |
| 3 | Service Worker registered | DevTools → Application → Service Workers → "Active and running" | |
| 4 | Check for install prompt | Chrome shows install button in address bar (after visiting twice) | |

### TC-PWA-02: Offline Cache
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Visit homepage, wait for service worker to cache | - | |
| 2 | DevTools → Network → set to "Offline" | - | |
| 3 | Refresh page | Static assets load from cache (shell visible) | |
| 4 | API calls (products list) | Fail gracefully (network error, not crash) | |

---

## MODULE 15 — SEO & Meta Tags

### TC-SEO-01: HTML Meta Tags
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | View source of `http://localhost:3000` | `<title>Rivavio — Online Shopping</title>` | |
| 2 | Check meta description | `<meta name="description" content="Shop the latest...">` present | |
| 3 | Check OG tags | `og:title`, `og:description`, `og:type` tags present | |
| 4 | Check manifest link | `<link rel="manifest" href="/manifest.json">` | |
| 5 | Check theme-color | `<meta name="theme-color" content="#0F1111">` | |
| 6 | Visit `http://localhost:3000/robots.txt` | Returns robots.txt content | |
| 7 | Visit `http://localhost:3000/sitemap.xml` | Returns sitemap XML content | |

---

## MODULE 16 — Indian Currency Formatting (₹)

### TC-CURRENCY-01: ₹ Format Throughout Site
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Homepage — product prices | Shows `₹1,299` format (Indian number system, no decimals) | |
| 2 | Products listing page — price range filter labels | Shows `₹0 – ₹5,000` etc. | |
| 3 | Product detail page — price | `₹X,XXX` format | |
| 4 | Cart page — item prices + totals | All in ₹ Indian format | |
| 5 | Checkout page — order summary | ₹ format for subtotal, shipping, taxes, discount, total | |
| 6 | My Orders page | Order total in ₹ format | |
| 7 | Admin Orders page | Order totals in ₹ format | |
| 8 | User Profile — wallet balance | `₹500` format shown | |

---

## MODULE 17 — Tawk.to Live Chat Widget

### TC-CHAT-01: Widget Injection
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Check `frontend/.env` — is `REACT_APP_TAWKTO_ID` set? | If not set: widget should NOT appear (conditional injection) | |
| 2 | Set `REACT_APP_TAWKTO_ID=<your-property-id>` in `frontend/.env` | - | |
| 3 | Restart frontend dev server | - | |
| 4 | Open any page | Tawk.to chat bubble appears in bottom-right corner | |
| 5 | Click chat bubble | Chat window opens | |

---

## MODULE 18 — Admin Dashboard Flow

### TC-ADMIN-01: Admin-only Route Guard
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Login as regular user | Navbar shows: Products, Cart, Profile, Compare, etc. | |
| 2 | Try typing `/admin/dashboard` in URL | Redirected (no admin routes in router for non-admin) | |
| 3 | Login as admin | Navbar shows: Dashboard, Orders, Analytics, Bulk Upload, Coupons | |
| 4 | User routes (/cart, /profile, /orders) | NOT accessible to admin (admin wildcard redirects to dashboard) | |

### TC-ADMIN-02: Product Management
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Admin → Dashboard → Add Product | Product form loads | |
| 2 | Add product with all fields | Product created, appears in listing | |
| 3 | Edit product price | Updated successfully | |
| 4 | Soft-delete product | Product hidden from `/products` page (isDeleted:true), still visible in admin | |
| 5 | Restore (undelete) product | Product reappears on `/products` | |

---

## MODULE 19 — Payment Flow

### TC-PAYMENT-01: COD Order
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Add item to cart, go to `/checkout` | Checkout page loads | |
| 2 | Select "Cash on Delivery" | COD option selected | |
| 3 | Place order | Order created with `paymentMode: COD`, `paymentStatus: unpaid` | |
| 4 | Redirected to `/order-success/:id` | Success page shows order ID | |

### TC-PAYMENT-02: Razorpay Order
| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Add item, go to checkout, select Razorpay | Razorpay button visible | |
| 2 | Click Pay | Razorpay modal opens with correct amount | |
| 3 | Complete test payment (use Razorpay test cards) | Order created, `paymentStatus: paid` | |

---

## REGRESSION TESTS (Pre-existing Features)

### TC-REG-01: Core Flows Unchanged
| Test | Expected Result | Status |
|------|----------------|--------|
| Signup → OTP → Login → Add to cart → Checkout → Order success | Full happy path works end-to-end | |
| Product search by keyword | Results filter correctly | |
| Product filter by brand/category | Results filter correctly | |
| Price range filter (including min=0) | Products ≤ max price shown | |
| Product pagination | Page 2 loads different products | |
| Address CRUD (add/edit/delete) at checkout | All address operations work | |
| Wishlist add/remove (logged in user) | Wishlist updates correctly | |
| Review submit without images | Basic review still works | |
| Admin order status update (existing flow) | Status changes saved | |

---

## QUICK API SMOKE TESTS (cURL / Thunder Client / Postman)

```bash
# 1. Guest Checkout
curl -c cookies.txt -X POST http://localhost:8000/api/auth/guest-checkout \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Guest","email":"guest@test.com"}'
# Expected: 200, JWT cookie set

# 2. Validate Coupon (need auth cookie from above)
curl -b cookies.txt -X POST http://localhost:8000/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"SAVE10","cartTotal":1000}'
# Expected: 200 {discountAmount: 100}

# 3. Google Auth (no keys)
curl http://localhost:8000/api/auth/google
# Expected: 503 {"message":"Google sign-in is not configured yet..."}

# 4. Analytics without admin (403 test)
curl -b cookies.txt http://localhost:8000/api/orders/analytics
# Expected: 403 (guest is not admin)

# 5. Recommendations
curl http://localhost:8000/api/products/<valid-product-id>/recommendations
# Expected: 200, array of up to 8 products in same category
```

---

## PENDING / MANUAL SETUP REQUIRED

| Item | What to Do | Owner |
|------|-----------|-------|
| Google OAuth | Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` to `backend/.env` from Google Cloud Console → APIs & Services → Credentials | You |
| Tawk.to Chat | Sign up at tawk.to (free), get Property ID, add `REACT_APP_TAWKTO_ID=<id>` to `frontend/.env` | You |
| Production Sitemap | Replace `https://your-domain.com` in `frontend/public/sitemap.xml` with actual domain | Post-deploy |
| Email (OTP/Order) | Verify `EMAIL_USER` + `EMAIL_PASS` are set in `backend/.env` (Gmail App Password) | You |
| Razorpay | Verify `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in `backend/.env` | You |

---

## AUTOMATED TEST RESULTS (Backend API — 2026-07-01)

> Run via `node run_tests.js` against live backend. **46/46 PASSED.**

| Module | Tests | Result |
|--------|-------|--------|
| AUTH (guest, google, bad-login) | 5 | ✅ ALL PASS |
| COUPONS (create, duplicate, list) | 4 | ✅ ALL PASS |
| COUPON VALIDATION (%, flat, min-order, invalid) | 5 | ✅ ALL PASS |
| ANALYTICS (admin access, 403 guard, 401 no-auth) | 4 | ✅ ALL PASS |
| RECOMMENDATIONS (200, array, self-excluded, same-cat) | 4 | ✅ ALL PASS |
| BULK UPLOAD (valid row, error row, empty CSV) | 5 | ✅ ALL PASS |
| INVOICE PDF (200, content-type, content, 401) | 4 | ✅ ALL PASS |
| WALLET/LOYALTY (create, balance, cancellation reversal) | 4 | ✅ ALL PASS |
| ORDER ROUTES (admin GET, 403 guard, Delivered enum) | 4 | ✅ ALL PASS |
| PRODUCTS (list, array, X-Total-Count, search) | 4 | ✅ ALL PASS |
| PUBLIC ROUTES (health, brands, categories) | 3 | ✅ ALL PASS |
| **TOTAL** | **46** | **✅ 46/46 PASS** |

---

## MANUAL TEST CHECKLIST (Frontend — Fill in Browser)

| Module | Total TCs | Pass | Fail | Partial |
|--------|-----------|------|------|---------|
| AUTH | 5 | | | |
| COUPON | 4 | | | |
| WALLET/LOYALTY | 3 | | | |
| ORDER TRACKING | 2 | | | |
| INVOICE PDF | 1 | | | |
| ANALYTICS | 1 | | | |
| BULK UPLOAD | 2 | | | |
| RECOMMENDATIONS | 1 | | | |
| RECENTLY VIEWED | 1 | | | |
| COMPARE | 1 | | | |
| WISHLIST SHARE | 1 | | | |
| REVIEWS | 2 | | | |
| ABANDONED CART | 1 | | | |
| PWA | 2 | | | |
| SEO | 1 | | | |
| CURRENCY | 1 | | | |
| TAWKTO | 1 | | | |
| ADMIN | 2 | | | |
| PAYMENT | 2 | | | |
| REGRESSION | 1 | | | |
| **TOTAL** | **36** | | | |
