const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.id).select('-accessKey');
            if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
            
            next();
        } catch (error) {
            res.status(401).json({ success: false, message: 'Token Invalid' });
        }
    } else {
        res.status(401).json({ success: false, message: 'No Token Provided' });
    }
};

exports.admin = (req, res, next) => {
    if (req.user && req.user.privilegeLevel === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Admin Access Required' });
    }
};