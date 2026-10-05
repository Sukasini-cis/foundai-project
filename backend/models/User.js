const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },

    username: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String
    },

    password: {
        type: String,
        required: true
    },

    organization: {
        type: String
    },

    department: {
        type: String
    },

    studentId: {
        type: String
    },

    // Presence: who's currently logged in, for the public "online now" list
    online: {
        type: Boolean,
        default: false
    },

    lastSeen: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("User", userSchema);