const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({

    itemName: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    category: {
        type: String
    },

    type: {
        type: String,
        enum: ["lost", "found"],
        required: true
    },

    location: {
        type: String
    },

    date: {
        type: Date
    },

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    status: {
        type: String,
        default: "active"
    }

});

module.exports = mongoose.model("Item", itemSchema);