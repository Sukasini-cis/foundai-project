const mongoose = require("mongoose");
const toClientJSON = require("../utils/toClientJSON");

// Claims History page (admin module)
// Replaces the old MySQL `claims` table.
const claimSchema = new mongoose.Schema({

    asset: {
        type: String,
        required: true,
        trim: true
    },

    claimant: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ["Pending", "Verified", "Archived"],
        default: "Pending"
    },

    // Shown in the table as "item.date"
    date: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true,
    collection: "claims",
    toJSON: toClientJSON()
});

module.exports = mongoose.model("Claim", claimSchema);
