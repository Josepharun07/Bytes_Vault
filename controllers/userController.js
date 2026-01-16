// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users (Admin Dashboard)
// @route   GET /api/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-accessKey'); // Don't send passwords
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update user role (Promote/Demote)
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body; // Expecting 'admin' or 'customer'

        // 1. Validate Input against Schema Enums
        if (!['customer', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role provided' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Prevent Self-Lockout (Cannot demote yourself)
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
        }

        // 3. Update the Field (Schema uses 'privilegeLevel')
        user.privilegeLevel = role;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: `User updated to ${role}`,
            data: user 
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Admin Create User
// @route   POST /api/users
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            fullName,
            emailAddress: email,
            accessKey: hashedPassword,
            privilegeLevel: role
        });

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email exists' });
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete User
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Admin Reset Password
// @route   PUT /api/users/:id/password
exports.resetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.accessKey = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};