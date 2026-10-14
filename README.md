# ShopSphere — Full-Stack E-Commerce Platform

A production-grade, full-stack e-commerce web application inspired by Amazon's shopping experience, built with React, TypeScript, Express.js, Prisma ORM, and Razorpay payment integration.

---

## 🌟 Key Features

### 🛒 Customer Shopping Experience
- **Amazon-Inspired Header & Sub-Nav**: Charcoal/navy theme (`#131921` / `#232f3e`), original ShopSphere branding, delivery location modal by Indian PIN code, live autocomplete suggestions, and account menu.
- **Dynamic Homepage**: Multi-slide promotional banner carousel, category quad-cards, "Today's Featured Deals" with countdown timers, customer-favorite carousels, and Sphere+ membership perks.
- **Product Discovery & Search**: Full-text backend search across title, description, and brand; multi-parameter filtering (categories, price ranges, minimum 4+ star reviews, and in-stock only toggle); sorting (Price low/high, rating, newest, featured); and database pagination.
- **Product Detail Pages**: Multi-image thumbnail gallery with high-resolution view, breadcrumb trails, verified star ratings, deal discount tags (e.g. `24% OFF`), technical specifications table, estimated delivery timeline based on PIN code, and "Add to Cart" or instant "Buy Now".
- **Shopping Cart & Wishlist**: Real-time stock verification, quantity adjustment (1-10 units), server-calculated subtotals, promotional coupon codes (`WELCOME10`, `SPHERE500`), free shipping progress bar, and wishlist toggle with instant "Move to Cart".
- **Multi-Step Checkout**:
  1. Select or add a delivery address (with default address toggle).
  2. Choose shipping speed (Standard Free vs. Sphere+ Express Next-Day ₹99).
  3. Server-side payment order creation and signature verification.
  4. Final calculated order summary and order confirmation receipt.

### 💳 Payment & Orders Management
- **Razorpay Integration**: Server-side order creation (`POST /api/v1/checkout/create-payment-order`), cryptographic HMAC-SHA256 signature verification (`POST /api/v1/checkout/verify-and-place-order`), and idempotent webhook handler. Includes a development test-mode fallback for sandbox environments.
- **Order Lifecycle & Tracking**: Visual step-by-step progress tracker (`Ordered` → `Preparing` → `Dispatched` → `Delivered`), item purchase-time price snapshot, real-time logistics activity logs, and invoice print view.
- **Safe Inventory Restoration**: Customers can cancel eligible orders (`PENDING`, `PAID`, `PROCESSING`), which automatically restores stock in PostgreSQL/SQLite inside an atomic transaction and records an inventory audit log.

### 🛡️ User Accounts & Security
- **Server-Side Session Authentication**: Cryptographically random session tokens stored in the database, delivered via HTTP-only, SameSite cookies.
- **Password Security**: Passwords hashed with `bcryptjs` (salt rounds 10).
- **Forgot Password Workflow**: Expiring, single-use security reset tokens (`PasswordResetToken` table) with automatic invalidation upon use.
- **Rate Limiting**: In-memory token-bucket rate limiting on authentication and sensitive endpoints.
- **Security Headers & Input Sanitization**: Configured with strict headers, parameterized database access via Prisma, and Zod schema validation.

### ⚡ Administrator Operations Dashboard
- **Access Control**: Role-based authorization (`requireAdmin` middleware checks `role === 'ADMIN'`).
- **Dashboard Metrics**: Gross revenue counter, total order count, customer volume, and low-stock alerts (products with ≤ 10 units).
- **Product Catalog Management**: Add new products with specifications, edit prices and stock, or archive products.
- **Order Fulfillment**: Filter orders by status, change delivery milestones (`PROCESSING` → `SHIPPED` → `DELIVERED`), and update carrier tracking numbers.
- **Inventory Control**: Real-time stock overview and instant restock controls with audit logging.
- **Coupon Management**: Create promotional promo codes (Percentage or Fixed amount) with minimum cart thresholds.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Tailwind CSS v4, Lucide Icons, responsive layouts |
| **Backend** | Node.js, Express.js, TypeScript | RESTful API under `/api/v1`, Vite middleware in dev |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Prisma ORM with relational integrity, indexes & transactions |
| **Authentication** | Server-side sessions | HTTP-only cookies (`shopsphere_session`), bcryptjs hashing |
| **Validation** | Zod | Strict schema validation for requests and checkout |
| **Payments** | Razorpay SDK / Test Mode | HMAC-SHA256 signature verification and webhooks |
| **Testing** | Vitest & Supertest | 23 automated integration tests across all workflows |

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- Node.js 20+ and npm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/shopsphere.git
cd shopsphere

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV="development"
APP_URL="http://localhost:3000"
FRONTEND_ORIGIN="http://localhost:3000"
SESSION_SECRET="shopsphere-super-secure-production-ready-session-secret-key-2026-xyz"
RAZORPAY_KEY_ID="rzp_test_shopsphere_demo_key"
RAZORPAY_KEY_SECRET="shopsphere_test_secret_key_mock_safe"
RAZORPAY_WEBHOOK_SECRET="shopsphere_webhook_secret_verification_key"
```

### 4. Database Setup & Seeding
```bash
# Push database schema to local SQLite database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed sample categories, products, coupons, and test users
npm run db:seed
```

### 5. Running the Application
```bash
# Start full-stack server (runs Express and Vite on port 3000)
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔑 Pre-Seeded Test Accounts

| Account | Email | Password | Role | Description |
|---|---|---|---|---|
| **Customer** | `customer@shopsphere.store` | `Customer@12345` | `CUSTOMER` | Buyer account with pre-saved address and orders |
| **Administrator** | `admin@shopsphere.store` | `Admin@12345` | `ADMIN` | Access to the `/admin` Operations Portal |

*Tip: The Sign In page features one-click buttons to instantly populate either test account.*

---

## 🧪 Running Automated Tests

Run the complete Vitest and Supertest suite:
```bash
npm run test
```

Test coverage includes:
- Health and readiness status
- Registration, duplicate email rejection, and invalid credential handling
- Session cookie issuance, validation, and logout invalidation
- Product search, filtering, and categories
- Cart item additions, inventory limits, and coupon calculations
- Razorpay payment order generation and HMAC signature verification
- Duplicate order prevention and atomic transactions
- Customer order access and inventory restoration on cancellation
- Rejection of unauthorized users from administrator routes
- Order fulfillment status progression

---

## 📦 Production Deployment Guide

### Option 1: Managed PostgreSQL + Render / Railway / Fly.io

1. **Provision Managed PostgreSQL** (e.g. Neon, Supabase, Render PostgreSQL, or AWS RDS).
2. **Configure Production Schema**:
   Copy `prisma/schema.postgresql.prisma` to `prisma/schema.prisma` or set `DATABASE_URL` to your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/shopsphere?sslmode=require"
   ```
3. **Run Migrations & Seed**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
4. **Build & Start**:
   ```bash
   npm run build
   npm run start
   ```

### Option 2: Frontend on Vercel & Backend on Render
- **Backend (Render Web Service)**: Build command `npm run build`, Start command `node dist/server.js` or `npm run start`.
- **Frontend (Vercel)**: Build command `npm run build`, Output directory `dist`. Set `VITE_API_BASE_URL` to the Render backend service URL.

---

## 🔒 Security Best Practices
- Passwords are never stored in plaintext and never returned in API responses.
- Server-side sessions avoid storing authentication tokens in client `localStorage`.
- All prices, taxes, discounts, and order totals are calculated authoritatively on the backend.
- Payment webhooks and client callbacks are verified using cryptographic timing-safe HMAC checks.
- Rate limiting prevents brute-force password guessing.
