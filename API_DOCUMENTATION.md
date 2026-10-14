# ShopSphere REST API Documentation

All API endpoints are prefixed with `/api/v1`. All requests and responses use JSON format with standard HTTP status codes.

---

## 1. System Health
### `GET /api/v1/health`
Checks database connectivity and server uptime.
- **Response `200 OK`**:
  ```json
  {
    "status": "UP",
    "uptime": 124.5,
    "timestamp": "2026-10-14T06:30:00.000Z",
    "database": "connected",
    "environment": "development"
  }
  ```

---

## 2. Authentication & Accounts
### `POST /api/v1/auth/register`
Creates a new customer account, issues a session token, and sets the HTTP-only `shopsphere_session` cookie. If a `guestToken` is passed, existing guest cart items are merged automatically.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123",
    "phone": "+91 98765 43210",
    "guestToken": "guest_abc123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "CUSTOMER"
    },
    "token": "session_hex_token",
    "message": "Account created successfully"
  }
  ```

### `POST /api/v1/auth/login`
Authenticates with email and password, creates a new session in the database, and sets the HTTP-only cookie.
- **Request Body**:
  ```json
  {
    "email": "customer@shopsphere.store",
    "password": "Customer@12345"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": { "id": "...", "name": "Aarav Sharma", "email": "...", "role": "CUSTOMER" },
    "token": "...",
    "message": "Logged in successfully"
  }
  ```

### `POST /api/v1/auth/logout`
Deletes the active session record in the database and clears the session cookie.
- **Response `200 OK`**: `{ "success": true, "message": "Logged out successfully" }`

### `GET /api/v1/auth/me` *(Protected)*
Returns the authenticated user's profile, saved addresses, and active order counts.

### `PUT /api/v1/auth/profile` *(Protected)*
Updates user's name and contact number.

### `POST /api/v1/auth/change-password` *(Protected)*
Verifies existing password with bcrypt and updates to new password.

### `POST /api/v1/auth/forgot-password`
Generates a cryptographically random, expiring single-use reset token and stores the SHA-256 hash in the database.

### `POST /api/v1/auth/reset-password`
Validates the reset token, updates the password, marks token as used, and invalidates all existing sessions.

---

## 3. Product Catalog
### `GET /api/v1/products`
Lists products with pagination, full-text search, and multi-criteria filters.
- **Query Parameters**:
  - `q`: Search term (searches title, description, brand)
  - `category`: Category slug (e.g. `electronics`, `audio`)
  - `minPrice`, `maxPrice`: Numeric price range
  - `rating`: Minimum average customer rating (e.g. `4`)
  - `inStock`: `true` to filter items with stock > 0
  - `brand`: Filter by specific brand
  - `sort`: `featured` | `price_asc` | `price_desc` | `rating` | `newest`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 16)

### `GET /api/v1/products/categories`
Returns all product categories with active product count.

### `GET /api/v1/products/suggestions?q=:term`
Autocomplete product suggestions for search bar dropdown.

### `GET /api/v1/products/featured`
Returns featured deals, top-rated products, and new arrivals for homepage carousels.

### `GET /api/v1/products/:slugOrId`
Returns product details including image gallery, technical specs JSON, and category.

### `GET /api/v1/products/related/:productId`
Returns related products from the same category.

---

## 4. Shopping Cart
### `GET /api/v1/cart`
Calculates and returns cart items, subtotal, discount, shipping fee, tax (GST), and total.
- **Query Parameters**: `coupon` (optional code to test discount calculation)

### `POST /api/v1/cart/items`
Adds an item to the user's cart (or guest cart) with stock verification.
- **Request Body**: `{ "productId": "...", "quantity": 1 }`

### `PUT /api/v1/cart/items/:itemId`
Updates item quantity with stock limit check.

### `DELETE /api/v1/cart/items/:itemId`
Removes an item from the cart.

### `DELETE /api/v1/cart`
Clears all items in the active cart.

### `POST /api/v1/cart/apply-coupon`
Validates coupon code against expiration date, usage limits, and minimum cart value.

---

## 5. Saved Addresses
### `GET /api/v1/addresses` *(Protected)*
Returns all saved addresses for the authenticated user.

### `POST /api/v1/addresses` *(Protected)*
Adds a new delivery address.

### `PUT /api/v1/addresses/:id` *(Protected)*
Updates an existing address.

### `DELETE /api/v1/addresses/:id` *(Protected)*
Deletes an address.

### `PUT /api/v1/addresses/:id/default` *(Protected)*
Sets the specified address as the default shipping location.

---

## 6. Checkout & Payments
### `POST /api/v1/checkout/create-payment-order` *(Protected)*
Verifies inventory, calculates amounts server-side, and creates a Razorpay payment order.
- **Request Body**:
  ```json
  {
    "addressId": "uuid",
    "shippingMethod": "Standard Delivery",
    "couponCode": "WELCOME10"
  }
  ```

### `POST /api/v1/checkout/verify-and-place-order` *(Protected)*
Verifies Razorpay HMAC signature, prevents duplicate orders, decrements inventory, creates order items with historical price snapshots, creates shipment tracking records, and clears cart inside a database transaction.
- **Request Body**:
  ```json
  {
    "addressId": "uuid",
    "shippingMethod": "Standard Delivery",
    "couponCode": "WELCOME10",
    "paymentOrderId": "order_xxxx",
    "razorpayPaymentId": "pay_xxxx",
    "razorpaySignature": "hmac_sha256_hex_signature"
  }
  ```

### `POST /api/v1/payments/razorpay/webhook`
Webhook handler with cryptographic signature verification for automated payment status synchronization.

---

## 7. Orders
### `GET /api/v1/orders` *(Protected)*
Returns customer order history with pagination and status filters (`ALL`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).

### `GET /api/v1/orders/:orderNumber` *(Protected)*
Returns detailed order breakdown, milestone progression, and shipment updates.

### `POST /api/v1/orders/:orderNumber/cancel` *(Protected)*
Cancels an order if in `PENDING`, `PAID`, or `PROCESSING` state. Restores inventory in the database, updates shipment status to `CANCELLED`, and initiates refund.

---

## 8. Admin Operations *(Admin Protected)*
### `GET /api/v1/admin/dashboard`
Returns gross revenue, order volume, customer counts, low stock alerts, and recent orders.

### `GET /api/v1/admin/products`
Lists products with admin controls.

### `POST /api/v1/admin/products`
Creates a new product with stock and initial inventory log.

### `PUT /api/v1/admin/products/:id`
Updates product pricing, specifications, or stock levels.

### `DELETE /api/v1/admin/products/:id`
Archives a product.

### `GET /api/v1/admin/orders`
Lists all customer orders for fulfillment management.

### `PUT /api/v1/admin/orders/:orderId/status`
Updates order status (`SHIPPED`, `DELIVERED`), appends carrier tracking notes, and updates shipment records.

### `GET /api/v1/admin/coupons`
Lists all promotional vouchers.

### `POST /api/v1/admin/coupons`
Creates a new coupon code with discount rules and limits.
