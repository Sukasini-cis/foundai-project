const mongoose = require("mongoose");
const toClientJSON = require("../utils/toClientJSON");

// Reward Escrow page (admin module)
// Replaces the old MySQL `escrow` table.
const escrowSchema = new mongoose.Schema({

    asset: {
        type: String,
        required: true,
        trim: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0.01
    },

    status: {
        type: String,
        enum: ["LOCKED", "RELEASED"],
        default: "LOCKED"
    },

    releasedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true,
    collection: "escrow",
    // keep the snake_case field names the MySQL API used to return
    toJSON: toClientJSON((doc, ret) => {
        ret.created_at = ret.createdAt;
        ret.released_at = ret.releasedAt;
    })
});

module.exports = mongoose.model("Escrow", escrowSchema);
