const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to sign JWT
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d' // Token expires in 30 days
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerCustomer = async (req, res) => {
    try {
        const { name, email, password, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create new user
        const newUser = await User.create({
            name,
            email,
            password,
            address
        });

        // Generate token
        const token = signToken(newUser._id);

        res.status(201).json({
            success: true,
            token,
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.authenticateCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user (include password)
        const databaseUser = await User.findOne({ email }).select('+password');
        if (!databaseUser) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await databaseUser.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate token
        const token = signToken(databaseUser._id);

        res.status(200).json({
            success: true,
            token,
            data: {
                id: databaseUser._id,
                name: databaseUser.name,
                email: databaseUser.email,
                role: databaseUser.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
