# Bytes Vault - E-Commerce & Inventory Management System

**Bytes Vault** is a state-of-the-art, full-stack E-Commerce and Inventory Management platform. Built using a strict **"Vanilla" Tech Stack** (No Frontend Frameworks like React or Vue), it demonstrates advanced software engineering principles, robust REST API design, and a scalable MVC architecture.

---

## 🏛️ Architecture & Project Structure

The project follows a rigorous **Model-View-Controller (MVC)** design pattern to ensure separation of concerns and maintainability.

### Project Directory Map
```text
/Bytes_Vault
├── config/              # Configuration files
│   └── db.js            # MongoDB Atlas connection logic via Mongoose
├── controllers/         # BUSINESS LOGIC (The "C" in MVC)
│   ├── authController.js    # Member registration, login, and JWT generation
│   ├── orderController.js   # Order processing, revenue tracking, and stock management
│   ├── productController.js # Catalog CRUD, filtering, searching, and reviews
│   └── userController.js    # User management, role promotion/demotion, and profile logic
├── middleware/          # INTERCEPTORS & SECURITY
│   ├── authMiddleware.js    # JWT verification and Role-Based Access Control (RBAC)
│   ├── loginRateLimiter.js  # Brute-force protection for authentication endpoints
│   └── uploadMiddleware.js  # Multer configuration for secure file uploads
├── models/              # DATA SCHEMAS (The "M" in MVC)
│   ├── Order.js             # Purchase records, transaction history, and statuses
│   ├── Product.js           # Inventory items with dynamic specification support
│   └── User.js              # User profiles, credentials, and privilege levels
├── public/              # FRONTEND / THE VIEW (The "V" in MVC)
│   ├── css/                 # Global styling and UI responsiveness
│   ├── js/                  # Client-side logic, Fetch API integrations, and DOM manipulation
│   ├── uploads/             # Physical storage for product image assets
│   ├── admin-orders.html    # Admin: Detailed order management interface
│   ├── dashboard.html       # Admin: Central inventory and system stats hub
│   ├── shop.html            # Customer: Product catalog with filtering
│   ├── product.html         # Customer: Detailed product view and review system
│   ├── cart.html / checkout.html # Customer: Transactional workflow
│   └── profile.html         # Customer: Personal order history and settings
├── routes/              # API ROUTING DEFINITIONS
│   ├── authRoutes.js        # /api/auth endpoints
│   ├── orderRoutes.js       # /api/orders endpoints
│   ├── productRoutes.js     # /api/products endpoints
│   └── userRoutes.js        # /api/users endpoints
├── test/                # QUALITY ASSURANCE
│   ├── auth.test.js         # Integration tests for User sessions
│   ├── product.test.js      # Integration tests for Catalog management
│   └── admin.test.js        # Unit tests for Admin-specific logic
├── seeder.js            # Environment initialization and Super Admin creation
└── server.js            # Main application entry point and middleware configuration
```

---

## 🛤️ Complete API Reference

Below is an exhaustive list of all accessible API endpoints within the system.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Handler Function | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/register` | Public | `registerNewMember` | Creates a new user account with hashed password. |
| **POST** | `/login` | Public | `authenticateMember` | Verifies credentials and issues a JWT Session Token. |

### 📦 Products & Catalog (`/api/products`)
| Method | Endpoint | Access | Handler Function | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Public | `fetchCatalog` | Returns filtered products based on search/category query. |
| **POST** | `/` | Admin | `createCatalogItem` | Adds a new product (Supports Image Upload via Multer). |
| **POST** | `/:id/reviews` | Private | `createProductReview` | Adds a rating and comment to a specific product. |
| **PUT** | `/:id` | Admin | `updateCatalogItem` | Updates product details or replaces product image. |
| **DELETE** | `/:id` | Admin | `removeItem` | Deletes a product and its associated image file. |

### 🛒 Orders & Transactions (`/api/orders`)
| Method | Endpoint | Access | Handler Function | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/` | Private | `createOrder` | Finalizes a purchase, updates stock, and records order. |
| **GET** | `/myorders` | Private | `getMyOrders` | Fetches the purchase history for the logged-in user. |
| **GET** | `/admin/all` | Admin | `getAllOrders` | Fetches all system-wide orders with user details. |
| **GET** | `/admin/stats` | Admin | `getDashboardStats` | Aggregates revenue, low stock, and user metrics. |
| **PUT** | `/:id/status` | Admin | `updateOrderStatus` | Updates the shipping/processing status of an order. |

### 👥 User Management (`/api/users`)
| Method | Endpoint | Access | Handler Function | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Admin | `getAllUsers` | Compiles a list of all registered members. |
| **POST** | `/` | Admin | `createUser` | Manually creates a new user from the dashboard. |
| **PUT** | `/:id/role` | Admin | `updateUserRole` | Promotes/Demotes users (RBAC implementation). |
| **PUT** | `/:id/password` | Admin | `resetUserPassword` | Overwrites a user's password (for recovery). |
| **DELETE** | `/:id` | Admin | `deleteUser` | Permanent removal of a user profile. |

---

## 🛠️ Key Controller Functions Dictionary

### `authController`
- `generateSessionToken(id)`: Utility function for signing JWTs with configurable expiration.
- `registerNewMember(req, res)`: Handles user ingestion, password encryption, and duplicate email prevention.
- `authenticateMember(req, res)`: Validates logins and generates active session tokens.

### `productController`
- `createCatalogItem(req, res)`: Orchestrates multi-part form handling (fields + files) to create products.
- `fetchCatalog(req, res)`: Core search logic using MongoDB `$regex` for partial matching and category filters.
- `createProductReview(req, res)`: Logic for calculating average star ratings and preventing duplicate reviews.

### `orderController`
- `createOrder(req, res)`: Mission-critical logic for stock deduction, tax calculation, and order persistence.
- `getDashboardStats(req, res)`: Complex aggregation for administrative oversight (Revenue, Recent Orders, Low Stock).

---

## 🔐 Security Framework

1.  **JWT Authentication**: All sensitive routes are wrapped in a `protect` middleware that decodes headers.
2.  **RBAC (Role-Based Access Control)**: The `admin` middleware ensures only users with `privilegeLevel: 'admin'` can access management routes.
3.  **Password Security**: Hashed using `bcryptjs` with a cost factor of 10.
4.  **Rate Limiting**: `express-rate-limit` prevents brute-force login attempts (configured in `loginRateLimiter.js`).
5.  **Secure Headers**: `Helmet.js` is implemented to set security-focused HTTP response headers.

---

## ⚙️ Hardware / System Setup

### Prerequisites
- **Node.js**: v16 or higher.
- **MongoDB**: Active instance (Local or Atlas).

### Installation & Launch
1.  Install dependencies: `npm install`
2.  Configure Environment: Create a `.env` file (see `README.md.old` for template).
3.  Initialize System: `node seeder.js` (Creates default Super Admin).
4.  Start Development: `npm run dev`
5.  Start Production: `npm start`

---

## 🧪 Testing Strategy
The project maintains a healthy test suite using **Mocha**, **Chai**, and **Supertest**.
- **Run Tests**: `npm test`
- **Scope**: Covers Authentication flows, CRUD operations, Order processing logic, and Security boundary validation.

---
*Developed by the Bytes Vault Engineering Team for SIT725.*
