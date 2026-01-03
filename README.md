# Bytes_Vault
# Bytes Vault - E-Commerce & Inventory Management System

Bytes Vault is a robust E-Commerce and Inventory Management System designed for efficient product management, user authentication, and admin oversight. This project implements a modern MVC (Model-View-Controller) architecture using Node.js, Express, and MongoDB.

## 🚀 Features

### Authentication & Authorization
- **User Auth**: Secure registration and login for customers.
- **Admin Auth**: Multi-level admin access (Admin and Super Admin).
- **JWT Protection**: Secure API endpoints using JSON Web Tokens.

### Inventory Management
- **Product CRUD**: Full Create, Read, Update, and Delete capabilities for products.
- **Departmental Logic**: Admins assigned to specific departments for localized management.

### User Management
- **Profile Management**: Users can update their personal information.
- **Admin Dashboard**: Centralized hub for managing system resources.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: Bcrypt.js (hashing), Helmet (security headers), JWT
- **Frontend**: HTML5, Vanilla CSS, JavaScript
- **Testing**: Mocha, Chai, Supertest
- **Logging**: Morgan

## 📁 Project Structure

```text
├── config/             # Database connection configuration
├── controllers/        # Request handling logic (MVC)
├── middleware/         # Custom Express middleware (Auth, Error handling)
├── models/             # Mongoose schemas (User, Admin, Product)
├── public/             # Frontend assets (HTML, CSS, JS)
├── routes/             # API route definitions
├── test/               # Automated test suites
├── seeder.js           # Database seeding script
└── server.js           # Application entry point
```

## ⚙️ Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Bytes_Vault
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

### Database Seeding
To initialize the system with a Super Admin:
```bash
node seeder.js
```
*Check `seeder.js` for default credentials.*

### Running the App
- **Development**: `npm run dev`
- **Production**: `npm start`

## 🧪 Testing
Run the automated test suite:
```bash
npm test
```

## 🛣️ API Endpoints (Summary)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | User login |
| `/api/admins/login` | POST | Admin login |
| `/api/products` | GET | List all products |
| `/api/users/profile` | GET | Get current user profile |

---
*Developed by the Bytes Vault Team.*
