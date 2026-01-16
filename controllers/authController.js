// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper to sign JWT
const generateSessionToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h", // Session lasts 1 day
  });
};

// @desc    Register a new member
// @route   POST /api/auth/register
exports.registerNewMember = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // 1. Encryption
    const saltRounds = await bcrypt.genSalt(10);
    const encryptedKey = await bcrypt.hash(password, saltRounds);

    // 2. Persistence
    const newMember = await User.create({
      fullName,
      emailAddress: email,
      accessKey: encryptedKey,
      privilegeLevel: role || "customer", // Default to customer
    });

    // 3. Token Generation
    const sessionToken = generateSessionToken(newMember._id);

    res.status(201).json({
      success: true,
      token: sessionToken,
      member: {
        id: newMember._id,
        name: newMember.fullName,
        role: newMember.privilegeLevel,
      },
    });
  } catch (err) {
    // Handle Duplicate Email Error (MongoDB code 11000)
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email is already registered in the vault.",
        });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login member
// @route   POST /api/auth/login
exports.authenticateMember = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email/password exists
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide credentials." });
    }

    // 2. Find Member (explicitly select password since it was hidden in model)
    const targetMember = await User.findOne({ emailAddress: email }).select(
      "+accessKey"
    );

    if (!targetMember) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // 3. Verify Key
    const isMatch = await bcrypt.compare(password, targetMember.accessKey);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // 4. Issue Token
    const sessionToken = generateSessionToken(targetMember._id);

    res.status(200).json({
      success: true,
      token: sessionToken,
      role: targetMember.privilegeLevel,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
