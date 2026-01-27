// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const notifyClients = (req, type, message) => {
    const io = req.app.get('io');
    if(io) io.emit('data:updated', { type, message, timestamp: new Date() });
};

// @desc    Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-accessKey");
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["customer", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot change own role" });

    user.privilegeLevel = role;
    await user.save();

    // 🟢 TRIGGER SYNC
    notifyClients(req, 'USER_UPDATE', `User ${user.fullName} changed to ${role}`);

    res.status(200).json({ success: true, message: `User updated to ${role}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Admin Create User
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      emailAddress: email,
      accessKey: hashedPassword,
      privilegeLevel: role,
    });

    // 🟢 TRIGGER SYNC
    notifyClients(req, 'USER_NEW', `New User Created: ${fullName}`);

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Email exists" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete User
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    
    // 🟢 TRIGGER SYNC
    notifyClients(req, 'USER_DEL', 'User Account Deleted');

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reset Password
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.accessKey = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};