const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    emailAddress: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true
    },
    accessKey: { type: String, required: true, select: false },
    privilegeLevel: { 
        type: String, 
        enum: ['customer', 'admin', 'staff'], 
        default: 'customer' 
    },
    registrationDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);