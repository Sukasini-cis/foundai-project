const mongoose = require("mongoose");


const heatmapSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    x: {
        type: Number,
        required: true
    },

    y: {
        type: Number,
        required: true
    },

    size: {
        type: Number,
        required: true
    },

    risk: {
        type: Number,
        required: true
    },

    recoveryProbability: {
        type: Number,
        default: 0
    },

    safestArea: {
        type: String,
        default: ""
    },

    modelVersion: {
        type: String,
        default: "v2.4 Spatial Engine"
    },

    // Optional manually-curated fallback breakdown (used only when no real
    // lost-item reports match this zone yet). Real reports always win.
    items: {
        type: [
            {
                name: String,
                pct: Number
            }
        ],
        default: []
    }

}, {
    timestamps: true
});


module.exports = mongoose.model(
    "Heatmap",
    heatmapSchema
);