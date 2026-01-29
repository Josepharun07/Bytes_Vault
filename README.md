This is the **Master README.md**.

It is written specifically to **lock down the architecture**. It defines the "Single Source of Truth" for your project. If your teammates follow this, they cannot break the existing logic because the rules (Naming conventions, Folder structure, API contracts) are explicitly defined.

**Action:** Push this to your GitHub repository immediately.

***

# 🔐 Bytes Vault - Architecture & Developer Guide

> **⚠️ CORE ARCHITECTURE WARNING:**
> This project follows a strict **MVC (Model-View-Controller)** pattern with a **Vanilla JS Frontend**.
> *   **DO NOT** write inline JavaScript in HTML files (`<script>...</script>`). Use `public/js/*.js`.
> *   **DO NOT** modify existing Controller logic without consulting the lead.
> *   **DO NOT** change Database Schema field names (e.g., do not change `itemName` to `name`).

---

## 🏗️ System Architecture

### The Tech Stack
*   **Backend:** Node.js + Express.js
*   **Database:** MongoDB Atlas (Mongoose ODM)
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (No React/Vue/Angular)
*   **Auth:** JWT (JSON Web Tokens) + Bcrypt Encryption
*   **Security:** Role-Based Access Control (RBAC)

### Directory Structure (The "Map")
All new code must fit into this structure. **Do not create random files in the root.**

```text
/Bytes_Vault
├── config/
│   └── db.js                # Database connection logic
├── controllers/             # BUSINESS LOGIC (Only .js files here)
│   ├── authController.js    # Register, Login, Token Gen
│   ├── orderController.js   # Checkout, Stock Deduction, Admin Order Views
│   ├── productController.js # Product CRUD, Search, Filter, Reviews
│   └── userController.js    # User Management (Promote/Demote)
├── middleware/              # SECURITY GATES
│   ├── authMiddleware.js    # protect() and admin() functions
│   └── uploadMiddleware.js  # Multer config for images
├── models/                  # DATABASE SCHEMAS (Mongoose)
│   ├── User.js              # One unified model for Admin/Customer
│   ├── Product.js           # Inventory items + Reviews array
│   └── Order.js             # Transaction records
├── public/                  # FRONTEND (The View)
│   ├── css/                 # Global styles
│   ├── js/                  # Client-side Logic (Fetch API calls)
│   ├── uploads/             # Product images storage
│   └── *.html               # All UI Pages
├── routes/                  # API ENDPOINTS
│   ├── authRoutes.js        # Maps URL -> Controller
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   └── userRoutes.js
└── server.js                # Entry Point (Do not touch unless adding global middleware)
```

---

## 📜 Development Rules (Read Before Coding)

### 1. Authentication Standard
*   **Token Key:** We store the JWT in LocalStorage under the key **`'vault_token'`**. Do not use `'token'` or `'jwt'`.
*   **Role Key:** We store the role in LocalStorage under **`'vault_role'`**.
*   **Headers:** All protected API calls must include:
    ```javascript
    headers: { 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` }
    ```

### 2. Database Naming Conventions
When writing queries or frontend displays, strictly use these field names:

*   **User Model:** `fullName`, `emailAddress`, `privilegeLevel` ('admin'/'customer').
*   **Product Model:** `itemName`, `sku`, `price`, `stockCount`, `category`, `imageUrl`, `specs` (Map).
*   **Order Model:** `totalAmount`, `shippingAddress`, `status` ('Pending'/'Shipped').

### 3. Adding New Features
*   **Step 1:** Create a Route in `/routes`.
*   **Step 2:** Create a Controller function in `/controllers`.
*   **Step 3:** Add the UI in `/public`.
*   **Step 4:** Write the Fetch logic in `/public/js`.
*   **NEVER** write database logic inside `server.js` or inside HTML files.

---

## 🛣️ API Documentation (The Contract)

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Body Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | `fullName`, `email`, `password`, `role` | Creates user. Hashed password. |
| `POST` | `/login` | Public | `email`, `password` | Returns `{ token, role }`. |

### 📦 Products (`/api/products`)
| Method | Endpoint | Access | Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | `?search=xyz&category=GPU` | Returns filtered list. |
| `POST` | `/` | **Admin** | `FormData` (File + Fields) | Creates product with image. |
| `PUT` | `/:id` | **Admin** | `FormData` | Updates product. |
| `DELETE` | `/:id` | **Admin** | - | Removes product. |
| `POST` | `/:id/reviews` | Login | `rating` (1-5), `comment` | Adds user review. |

### 🛒 Orders (`/api/orders`)
| Method | Endpoint | Access | Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Login | `cartItems` [], `shippingAddress` | Atomic Transaction. Deducts Stock. |
| `GET` | `/myorders` | Login | - | Returns logged-in user's history. |
| `GET` | `/admin/all` | **Admin** | - | Returns every order in system. |
| `GET` | `/admin/stats` | **Admin** | - | Returns Revenue, User Count, Low Stock. |
| `PUT` | `/admin/:id` | **Admin** | `status` | Updates order status (e.g., 'Shipped'). |

### 👥 Users (`/api/users`)
| Method | Endpoint | Access | Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | **Admin** | - | List all users. |
| `POST` | `/` | **Admin** | `fullName`, `email`, `password`, `role` | Manual user creation. |
| `PUT` | `/:id/role` | **Admin** | `role` ('admin'/'customer') | Promote or Demote user. |
| `PUT` | `/:id/password`| **Admin** | `newPassword` | Force reset user password. |
| `DELETE` | `/:id` | **Admin** | - | Delete user account. |

---

## 📘 File Functionality Guide

### Controllers
*   **`authController.js`**: Handles encryption (`bcrypt`) and Token signing (`jwt`). Contains logic to check for duplicate emails.
*   **`orderController.js`**: Contains the **Critical Business Logic**.
    *   *Atomic Transactions:* Ensures stock is deducted only if the order saves successfully.
    *   *Aggregations:* Calculates Total Revenue for the dashboard.
*   **`productController.js`**: Handles file system operations (deleting old images when a product is deleted) and dynamic specification parsing.

### Middleware
*   **`authMiddleware.js`**:
    *   `protect`: Decodes JWT, finds user, attaches to `req.user`.
    *   `admin`: Checks if `req.user.privilegeLevel === 'admin'`.
*   **`uploadMiddleware.js`**: Configures `Multer` to save files to `public/uploads/products` with unique timestamps.

### Frontend Scripts
*   **`admin.js`**: The SPA (Single Page Application) engine for the Dashboard. Handles Tab switching and Data loading.
*   **`shop.js`**: Handles Product rendering, Search debounce, and Category filtering.
*   **`cart.js`**: Manages `localStorage` array, calculates totals, and updates Navbar badge.
*   **`checkout.js`**: Orchestrates the payment flow and API submission.

---

## ⚙️ Setup & Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Variables:**
    Ensure `.env` exists with `MONGO_URI` and `JWT_SECRET`.
3.  **Run Server:**
    ```bash
    npm run dev
    ```
4.  **Run Tests:**
    ```bash
    npm test
    ```

---
*Maintained by the Bytes Vault Engineering Team.*