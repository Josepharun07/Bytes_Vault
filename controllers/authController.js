const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

exports.registerNewMember = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Input validation
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Role validation
    if (role && !["customer", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const existing = await User.findOne({ emailAddress: email });

    if (existing)
      return res.status(400).json({ success: false, message: "Email taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      emailAddress: email,
      accessKey: hashedPassword,
      privilegeLevel: role || "customer",
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      role: user.privilegeLevel,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.authenticateMember = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    const user = await User.findOne({ emailAddress: email }).select(
      "+accessKey",
    );

    if (user && (await bcrypt.compare(password, user.accessKey))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        role: user.privilegeLevel,
        name: user.fullName,
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
