const express = require("express");

const ModerationCase = require("../models/ModerationCase");
const isValidId = require("../utils/isValidId");

const router = express.Router();


/* =====================================================
   GET ALL MODERATION CASES (newest first)
====================================================== */

router.get("/", async (req, res) => {

    try {

        const cases = await ModerationCase
            .find()
            .sort({ createdAt: -1, _id: -1 });

        res.json(cases);

    } catch (error) {

        console.error("Moderation fetch error:", error);

        res.status(500).json({
            error: "Failed to fetch moderation cases"
        });

    }

});


/* =====================================================
   CREATE NEW MODERATION CASE
====================================================== */

router.post("/", async (req, res) => {

    try {

        const { asset, reporter } = req.body;

        if (!asset || !reporter) {

            return res.status(400).json({
                error: "Asset and reporter are required"
            });

        }

        const moderationCase = await ModerationCase.create({
            asset,
            reporter,
            status: "PENDING"
        });

        res.status(201).json({
            message: "Moderation flag created successfully",
            id: moderationCase.id
        });

    } catch (error) {

        console.error("Moderation creation error:", error);

        res.status(500).json({
            error: "Failed to create moderation flag"
        });

    }

});


/* =====================================================
   UPDATE MODERATION STATUS
====================================================== */

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;

        if (!status) {

            return res.status(400).json({
                error: "Status is required"
            });

        }

        const moderationCase = isValidId(id)
            ? await ModerationCase.findByIdAndUpdate(
                id,
                { status },
                { new: true, runValidators: true }
            )
            : null;

        if (!moderationCase) {

            return res.status(404).json({
                error: "Moderation case not found"
            });

        }

        res.json({
            message: "Moderation status updated successfully"
        });

    } catch (error) {

        if (error.name === "ValidationError") {

            return res.status(400).json({
                error: "Invalid moderation status"
            });

        }

        console.error("Moderation update error:", error);

        res.status(500).json({
            error: "Failed to update moderation status"
        });

    }

});


/* =====================================================
   DELETE MODERATION CASE
====================================================== */

router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const moderationCase = isValidId(id)
            ? await ModerationCase.findByIdAndDelete(id)
            : null;

        if (!moderationCase) {

            return res.status(404).json({
                error: "Moderation case not found"
            });

        }

        res.json({
            message: "Moderation case deleted successfully"
        });

    } catch (error) {

        console.error("Moderation delete error:", error);

        res.status(500).json({
            error: "Failed to delete moderation case"
        });

    }

});


module.exports = router;
