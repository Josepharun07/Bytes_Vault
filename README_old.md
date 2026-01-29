
# Bytes Vault - E-Commerce & Inventory Management System

**Bytes Vault** is a full-stack E-Commerce platform built to demonstrate advanced software engineering principles using a strict **"Vanilla" Tech Stack** (No Frontend Frameworks). It features a secure REST API, Role-Based Access Control (RBAC), and a dual-interface system for both Customers (Storefront) and Administrators (Inventory Dashboard).

## 🚀 Implemented Features

### 🔐 1. Authentication & Security
*   **Unified Auth System:** Single entry point for both Customers and Admins.
*   **JWT Implementation:** Stateless authentication using JSON Web Tokens stored in LocalStorage.
*   **Security:** Passwords hashed via `bcryptjs`. Protected routes verify tokens before granting access.
*   **Role-Based Access Control (RBAC):** Middleware restricts sensitive endpoints (like Inventory Management) to `admin` role users only.

### 📦 2. Inventory Management (Admin Side)
*   **Dynamic Inventory:** Admins can Create, Read, and Delete products.
*   **Image Uploads:** Integrated `Multer` middleware for handling product image file uploads.
*   **Dynamic Specifications:** Custom logic allowing Admins to add variable technical specs (e.g., RAM, VRAM) as key-value pairs without altering the database schema.
*   **Stock Monitoring:** Visual indicators in the dashboard for Low Stock items (< 5 units).

### 🛍️ 3. Storefront (Customer Side)
*   **Product Discovery:** Dynamic grid layout rendering products from the database.
*   **Advanced Filtering:** Filter by Categories (GPU, CPU, etc.) and Real-time Search.
*   **Product Details:** dedicated page parsing URL parameters to fetch and display specific item details, images, and specs.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js | Server-side JavaScript environment. |
| **Framework** | Express.js | REST API routing and middleware management. |
| **Database** | MongoDB Atlas | Cloud NoSQL database. |
| **ODM** | Mongoose | Schema validation and data modeling. |
| **Frontend** | HTML5, CSS3, Vanilla JS | DOM manipulation via `fetch()` API. No React/Vue. |
| **Auth** | JWT & Bcrypt | Token signing and Password encryption. |
| **File I/O** | Multer | Handling multipart/form-data (Image uploads). |
| **Testing** | Mocha, Chai, Supertest | Automated Unit and Integration testing. |

---

## 📁 Project Architecture & Structure

The project follows a strict **MVC (Model-View-Controller)** pattern.

```text
/Bytes_Vault
├── config/
│   └── db.js            # MongoDB Atlas connection logic
├── controllers/         # BUSINESS LOGIC
│   ├── authController.js    # Handles Register/Login & Token generation
│   └── productController.js # Handles CRUD, Image processing, Search logic
├── middleware/          # INTERCEPTORS
│   ├── authMiddleware.js    # Verifies JWT and checks Admin Role
│   └── uploadMiddleware.js  # Multer config for /public/uploads
├── models/              # DATABASE SCHEMAS
│   ├── User.js              # Stores credentials & roles
│   └── Product.js           # Stores item details & dynamic specs
├── public/              # FRONTEND (The View)
│   ├── css/                 # Global styles
│   ├── js/                  # Client-side Logic (Fetch API calls)
│   ├── uploads/             # Stores uploaded product images
│   ├── dashboard.html       # Admin Interface
│   ├── index.html           # Landing Page
│   ├── login.html           # Auth Interface
│   ├── shop.html            # Catalog Interface
│   └── product.html         # Item Detail Interface
├── routes/              # API DEFINITIONS
│   ├── authRoutes.js        # /api/auth endpoints
│   └── productRoutes.js     # /api/products endpoints
├── test/                # QA
│   ├── auth.test.js         # Unit tests for Auth
│   ├── product.test.js      # Unit tests for Inventory
│   └── full_system.test.js  # End-to-End Integration tests
└── server.js            # Entry Point & Server Config

```

## 🛣️ API Documentation

### Authentication Module
| Method | Endpoint | Access | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | `{fullName, email, password}` | Creates a new user. |
| **POST** | `/api/auth/login` | Public | `{email, password}` | Returns JWT Token & Role. |

### Product Module
| Method | Endpoint | Access | Query Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/products` | Public | `?search=name&category=type` | Fetches filtered catalog. |
| **POST** | `/api/products` | Admin | FormData (File + Fields) | Creates item with Image. |
| **DELETE** | `/api/products/:id` | Admin | None | Removes an item. |

---

## 🖥️ UI Page Map

*   **index.html:** Landing page featuring a Hero banner and "New Arrivals".
*   **shop.html:** The main catalog. Contains the Sidebar (Categories) and Search Bar. Uses `shop.js` to dynamically fetch and render product cards.
*   **product.html:** Detailed view. Reads `?id=XYZ` from the URL, fetches that specific ID from the API, and renders specs/reviews.
*   **dashboard.html:** (Admin Only). Protected by JS Logic. Allows uploading new items via a Modal and viewing the inventory table.
*   **login.html / register.html:** Forms for user access.

---

## ⚙️ Setup Instructions

### 1. Installation
Clone the repo and install dependencies:
```bash
git clone https://github.com/Josepharun07/Bytes_Vault.git
cd Bytes_Vault
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root:
```properties
PORT=3000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```
### 3. Running the Server

```bash
# Run in development mode (with Nodemon)
npm run dev
```
Server will start at http://localhost:3000

### 4. Running Tests
To verify the system integrity (Auth flow, Database connections, API responses):

```bash
# Runs the full Mocha test suite
npm test
```

## 🧪 Testing Strategy

We utilize Automated Integration Testing to simulate real user journeys without manual input.

*   **Tools:** Mocha (Runner), Chai (Assertions), Supertest (HTTP Requests).
*   **Coverage:**
    *   Admin Registration & Product Upload.
    *   Customer Registration & Login.
    *   Catalog Browsing & Filtering.
    *   Error handling (Duplicate emails, Missing fields).

---

**Developed by the Bytes Vault Team for SIT725.**



this is a test commit - farhan m

