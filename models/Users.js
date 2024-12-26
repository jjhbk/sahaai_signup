const mongoose = require('mongoose');
const Subscription = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
        default: "0"
    },
    expiry: {
        type: String,
        required: true,
        defualt: "0"
    },
    active: {
        type: Boolean,
        requireda: true,
        default: false
    }
})
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure email is unique
    },
    walletAddress: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false, // Mark email verification status
    },
    subscription: {
        type: Subscription,
        default: { planId: 0, expiry: BigInt(0), active: false }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});




module.exports = mongoose.model('User', userSchema);
