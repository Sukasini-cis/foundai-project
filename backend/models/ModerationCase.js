const mongoose = require("mongoose");
const toClientJSON = require("../utils/toClientJSON");

// Admin Moderation Console page
// Replaces the old MySQL `moderation_cases` table.
const moderationCaseSchema = new mongoose.Schema({

    asset: {
        type: String,
        required: true,
        trim: true
    },

    reporter: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ["PENDING", "RESOLVED"],
        default: "PENDING"
    }

}, {
    timestamps: true,
    collection: "moderation_cases",
    toJSON: toClientJSON()
});

module.exports = mongoose.model("ModerationCase", moderationCaseSchema);
