const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes (Verify Token)
exports.protect = async (req, res, next) => {
  let token;

  // 1. Check for Bearer Token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);

      // 2. Find User (Unified Model)
      // Note: We exclude 'accessKey' (our password field), not 'password'
      req.user = await User.findById(decodedData.id).select("-accessKey");
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found with this token" });
      }

      next();
    } catch (error) {
      console.error("❌ Token Verification Error:", error);
      res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};

// Middleware to restrict access to Admins only
exports.admin = (req, res, next) => {
  // Check 'privilegeLevel' (defined in User.js schema)
  if (req.user && req.user.privilegeLevel === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized as an admin",
    });
  }
};
