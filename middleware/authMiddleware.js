const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
exports.verifyAuthenticationToken = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Try finding user in User collection
            let user = await User.findById(decoded.id).select('-password');

            // If not found, try Admin collection
            if (!user) {
                const Admin = require('../models/Admin');
                user = await Admin.findById(decoded.id).select('-password');
            }

            req.user = user;

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Grant access to specific roles
exports.authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: `User role ${req.user.role} is not authorized`
        });
    }
    next();
};

exports.authorizeSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: `User role ${req.user.role} is not authorized`
        });
    }
    next();
};
