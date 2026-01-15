// models/User.js
const mongoose = require('mongoose');

const memberIdentitySchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide a full name'],
        trim: true
    },
    emailAddress: {
        type: String,
        required: [true, 'Email address is mandatory'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email structure'
        ]
    },
    accessKey: { // This is the password
        type: String,
        required: [true, 'Security key (password) is required'],
        minlength: 6,
        select: false // Do not return password by default in queries
    },
    privilegeLevel: { // This is the role
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    shippingCoordinates: { // Address object
        street: String,
        city: String,
        zipCode: String,
        country: String
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', memberIdentitySchema);