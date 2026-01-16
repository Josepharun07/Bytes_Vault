// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerNewMember,
  authenticateMember,
} = require("../controllers/authController");
const loginRateLimiter = require("../middleware/loginRateLimiter");

router.post("/register", registerNewMember);
router.post("/login", loginRateLimiter, authenticateMember);

module.exports = router;
