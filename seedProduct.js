require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product"); // adjust path if needed

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydb";

const products = [
  {
    itemName: "Computer",
    sku: "COMP-001",
    price: 1299,
    stockCount: 6,
    category: "Laptop",
    description: "General purpose computer for office and daily tasks",
    imageUrl: "/uploads/products/product-1768450614270-33941819.jpg",
    specs: {
      processor: "Intel Core i7",
      ram: "16GB",
      storage: "512GB SSD",
      os: "Windows 11",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-002",
    price: 999,
    stockCount: 8,
    category: "Laptop",
    description: "Affordable computer for students and home users",
    imageUrl: "/uploads/products/product-1768451395995-409723861.jpg",
    specs: {
      processor: "Intel Core i5",
      ram: "8GB",
      storage: "256GB SSD",
      os: "Windows 11",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-003",
    price: 1599,
    stockCount: 4,
    category: "Laptop",
    description: "High performance computer for professional workloads",
    imageUrl: "/uploads/products/product-1768451433655-362187455.jpg",
    specs: {
      processor: "Intel Core i9",
      ram: "32GB",
      storage: "1TB SSD",
      os: "Windows 11 Pro",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-004",
    price: 1099,
    stockCount: 7,
    category: "Laptop",
    description: "Reliable computer for business and productivity",
    imageUrl: "/uploads/products/product-1768455442948-719796759.jpg",
    specs: {
      processor: "AMD Ryzen 5",
      ram: "16GB",
      storage: "512GB SSD",
      os: "Windows 11",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-005",
    price: 899,
    stockCount: 10,
    category: "Laptop",
    description: "Compact computer for everyday use",
    imageUrl: "/uploads/products/product-1768455442955-554398414.jpg",
    specs: {
      processor: "Intel Core i3",
      ram: "8GB",
      storage: "256GB SSD",
      os: "Windows 11",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-006",
    price: 1399,
    stockCount: 5,
    category: "Laptop",
    description: "Fast and efficient computer for multitasking",
    imageUrl: "/uploads/products/product-1768455740442-542587582.jpg",
    specs: {
      processor: "AMD Ryzen 7",
      ram: "16GB",
      storage: "1TB SSD",
      os: "Windows 11",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-007",
    price: 1199,
    stockCount: 6,
    category: "Laptop",
    description: "Balanced computer for work and study",
    imageUrl: "/uploads/products/product-1768455740447-252383484.jpg",
    specs: {
      processor: "Intel Core i5",
      ram: "16GB",
      storage: "512GB SSD",
      os: "Windows 11",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-008",
    price: 1699,
    stockCount: 3,
    category: "Laptop",
    description: "Premium computer with high-end specifications",
    imageUrl: "/uploads/products/product-1768456245238-474272.jpg",
    specs: {
      processor: "Intel Core i9",
      ram: "32GB",
      storage: "2TB SSD",
      os: "Windows 11 Pro",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-009",
    price: 949,
    stockCount: 9,
    category: "Laptop",
    description: "Lightweight computer for mobility and productivity",
    imageUrl: "/uploads/products/product-1768480757317-472447025.jpg",
    specs: {
      processor: "AMD Ryzen 5",
      ram: "8GB",
      storage: "512GB SSD",
      os: "Windows 11",
    },
  },
  {
    itemName: "Computer",
    sku: "COMP-010",
    price: 1799,
    stockCount: 2,
    category: "Laptop",
    description: "High-end computer for advanced users",
    imageUrl: "/uploads/products/product-1768482515591-751487234.jpg",
    specs: {
      processor: "Intel Core i9",
      ram: "32GB",
      storage: "2TB SSD",
      os: "Windows 11 Pro",
    },
  },
];

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log("✅ All products seeded successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedData();
