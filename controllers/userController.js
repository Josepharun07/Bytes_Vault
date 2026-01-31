// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * Notifies connected clients via Socket.IO about data changes
 * @param {Object} req - Express request object
 * @param {string} type - Event type identifier
 * @param {string} message - Notification message
 */
const notifyClients = (req, type, message) => {
  const io = req.app.get("io");
  if (io) io.emit("data:updated", { type, message, timestamp: new Date() });
};

/**
 * Sends standardized error response
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 */
const sendError = (res, status, message) => {
  res.status(status).json({ success: false, message });
};

/**
 * Hashes password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-accessKey");
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/users/:id/role
 * @access  Admin
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!["customer", "admin"].includes(role)) {
      return sendError(res, 400, "Invalid role");
    }

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found");

    // Prevent self-role modification
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, "Cannot change own role");
    }

    // Update and save
    user.privilegeLevel = role;
    await user.save();

    notifyClients(
      req,
      "USER_UPDATE",
      `User ${user.fullName} changed to ${role}`,
    );
    res
      .status(200)
      .json({ success: true, message: `User updated to ${role}`, data: user });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * @desc    Create new user (Admin only)
 * @route   POST /api/users
 * @access  Admin
 */
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    
    // Input validation
    if (!fullName || !email || !password || !role) {
      return sendError(res, 400, "All fields are required");
    }
    
    if (fullName.trim().length < 2) {
      return sendError(res, 400, "Full name must be at least 2 characters");
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, "Invalid email format");
    }
    
    // Password validation
    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters");
    }
    
    // Role validation
    if (!['customer', 'admin'].includes(role)) {
      return sendError(res, 400, "Invalid role");
    }
    
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      fullName,
      emailAddress: email,
      accessKey: hashedPassword,
      privilegeLevel: role,
    });

    notifyClients(req, "USER_NEW", `New User Created: ${fullName}`);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 400, "Email already exists");
    sendError(res, 500, err.message);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 404, "User not found");

    notifyClients(req, "USER_DEL", "User Account Deleted");
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

/**
 * @desc    Reset user password
 * @route   PUT /api/users/:id/password
 * @access  Admin
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // Input validation
    if (!newPassword) {
      return sendError(res, 400, "New password is required");
    }
    
    if (newPassword.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters");
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found");

    user.accessKey = await hashPassword(newPassword);
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
