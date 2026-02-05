
# 🛡️ Bytes Vault
### Enterprise-Grade E-Commerce & Inventory Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)

**Bytes Vault** is a high-performance, full-stack application designed to bridge the gap between online retail and physical inventory. Built using a strict **Vanilla Tech Stack** (No Frontend Frameworks), it demonstrates mastery of core software engineering principles including MVC Architecture, Atomic Transactions, Real-time WebSockets, and Containerization.

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-%EF%B8%8F-technology-stack)
4. [System Architecture](#-system-architecture)
5. [Getting Started (Local & Docker)](#-getting-started)
6. [Testing Strategy](#-testing-strategy)
7. [API Reference](#-api-reference)
8. [Contributors](#-contributors)

---

## 🔭 Project Overview

In the electronics retail sector, "phantom inventory"—selling items online that are out of stock physically—is a major pain point. Bytes Vault solves this by unifying the **Customer Storefront**, **Admin Dashboard**, and **In-Store POS (Point of Sale)** into a single, synchronized ecosystem.

**Core Philosophy:**
*   **Zero Frameworks:** Frontend logic is built with pure ES6 JavaScript to demonstrate deep DOM understanding.
*   **Data Integrity:** Inventory is deducted atomically during checkout to prevent overselling.
*   **Real-Time:** Admin dashboards update instantly via Socket.io when sales occur.

---

## 🚀 Key Features

### 🛍️ Customer Experience
*   **Dynamic Catalog:** Real-time search and filtering by category (GPU, CPU, etc.).
*   **Smart Cart:** Persistent shopping cart using `localStorage` logic.
*   **User Profiles:** Order history tracking with status updates (Pending -> Shipped).
*   **Review System:** Verified buyers can rate and review products.

### 🛡️ Admin Command Center (SPA)
*   **Single Page Application:** A seamless, tab-based interface for managing the entire business.
*   **Analytics Engine:** Interactive charts (Chart.js) showing Revenue trends, Category breakdown, and Active Users.
*   **Dynamic Inventory:** Add products with **Flexible Specifications** (key-value pairs) without altering the database schema.
*   **User Management:** Promote/Demote staff and reset user passwords.
*   **Order Fulfillment:** Workflow to update order statuses.

### 🏪 Point of Sale (POS)
*   **Staff Interface:** Streamlined UI for in-store employees.
*   **Walk-in Processing:** Bypasses shipping logic for instant "over-the-counter" transactions.
*   **Unified Stock:** Shares the exact same database as the online store.

---

## 🛠️ Technology Stack

| Domain | Technology | Usage |
| :--- | :--- | :--- |
| **Backend** | **Node.js + Express** | RESTful API & Business Logic |
| **Database** | **MongoDB Atlas** | NoSQL Persistence & Aggregations |
| **Frontend** | **HTML5 / CSS3** | Responsive UI with CSS Variables & Grid |
| **Scripting** | **Vanilla JS (ES6)** | Client-side DOM manipulation & Fetch API |
| **Real-Time** | **Socket.io** | Live dashboard updates |
| **Security** | **JWT & Bcrypt** | Stateless Auth & Encryption |
| **DevOps** | **Docker** | Containerization of App & DB |
| **Testing** | **Mocha / Chai** | Integration & Unit Testing |

---

## 🏛 System Architecture

The project adheres to a strict **Model-View-Controller (MVC)** pattern.

```text
/Bytes_Vault
├── config/              # DB Connections
├── controllers/         # Business Logic (Auth, Products, Orders)
├── middleware/          # Security (RBAC, JWT) & File Uploads
├── models/              # Mongoose Schemas
├── public/              # THE VIEW (HTML/CSS/JS)
│   ├── js/              # Client-side Logic (SPA engine, Cart logic)
│   ├── css/             # Global Styling
│   └── uploads/         # Product Images
├── routes/              # API Endpoint Definitions
├── test/                # Automated Test Suite
├── docker-compose.yml   # Container Orchestration
└── server.js            # Application Entry Point
```

---

## ⚙️ Getting Started

You can run Bytes Vault locally or via Docker.

### Prerequisites
*   Node.js v16+
*   MongoDB (Local or Atlas Connection String)

### Option A: Standard Local Setup
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Josepharun07/Bytes_Vault.git
    cd Bytes_Vault
    ```
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **Configure Environment**
    Create a `.env` file in the root:
    ```env
    PORT=3000
    NODE_ENV=development
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    ```
4.  **Seed the Database** (Loads default Admin/Users)
    ```bash
    npm run seed
    ```
5.  **Run the Server**
    ```bash
    npm run dev
    ```
    *Access the app at `http://localhost:3000`*

### Option B: Docker Setup (Recommended)
1.  **Build and Run**
    ```bash
    docker-compose up --build
    ```
2.  **Seed Database (Inside Container)**
    Open a new terminal and run:
    ```bash
    docker exec -it bytes-vault-app npm run seed
    ```
    *Access the app at `http://localhost:3000`*

---

## 🧪 Testing Strategy

The project includes a robust test suite covering Unit, Integration, and End-to-End scenarios.

**Run All Tests:**
```bash
npm test
```

**Key Test Suites:**
*   `full_system.test.js`: Simulates a full customer journey (Register -> Login -> Buy -> Admin Check).
*   `auth.test.js`: Verifies security boundaries and token generation.
*   `product.test.js`: Verifies CRUD operations and file upload logic.

---

## 🛣 API Reference (Snapshot)

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate & Retrieve Token |
| `GET` | `/api/products` | Public | Fetch Catalog with Search/Filter |
| `POST` | `/api/orders` | Customer | Place Online Order (Atomic Transaction) |
| `GET` | `/api/orders/admin/stats` | Admin | Fetch Revenue & Real-time Metrics |
| `POST` | `/api/users` | Admin | Create Staff/Admin Accounts |




###  How to Run It

#### 1. Start Docker Desktop
Make sure the **Docker Desktop** application is open and the icon is Green/Running.

#### 2. Build and Launch
Open your VS Code terminal and run:
```bash
docker-compose up --build
```
*   It will download MongoDB and Node.js (this takes time the first time).
*   Wait until you see: `Connected to MongoDB` in the logs.

#### 3. Seed the Database
Since this is a brand new Docker database, it is **empty**. You need to run your seeder script *inside* the container.

Open a **second terminal** and run:
```bash
docker exec -it bytes-vault-app npm run seed
```
*   You should see: `✅ SYSTEM RESET SUCCESSFUL`.

#### 4. Access the App
Go to your browser:
`http://localhost:3000`

### Troubleshooting
*   **Error:** `The system cannot find the file specified` -> Docker Desktop is not running. Start it.
*   **Error:** `port is already allocated` -> You have `npm run dev` running in another terminal. Stop it (`Ctrl+C`) before running Docker.


---

## 👥 Contributors

*   **Arun Joseph** 
*   **Farhan Al Rashid** 
*   **Navya Aila** 
*   **Abhishek Ghimire** 
*   **Jayadhwaj Reddy Mothey** 

---

---
Bytes Vault Team. Built for SIT725 Applied Software Engineering.
---