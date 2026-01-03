const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Super Admin / Admin)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update user role (Promote/Demote)
// @route   PUT /api/users/:id/role
// @access  Private (Super Admin Only)
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        // Only allow 'user' or 'admin' roles to be set by Super Admin. 
        // SuperAdmin role itself should be protected or manually seeded, but we'll allow it if needed.
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent modifying self via this route to avoid locking out, though not strictly required
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot change your own role via this endpoint' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
