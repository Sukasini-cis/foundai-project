const express = require("express");

const Escrow = require("../models/Escrow");
const isValidId = require("../utils/isValidId");

const router = express.Router();


// GET all active (LOCKED) escrow contracts, newest first
router.get("/", async (req, res) => {
    try {
        const contracts = await Escrow
            .find({ status: "LOCKED" })
            .sort({ createdAt: -1, _id: -1 });

        res.json(contracts);
    } catch (error) {
        console.error("Escrow fetch error:", error);

        res.status(500).json({
            error: "Failed to fetch escrow contracts"
        });
    }
});


// GET - Total released payout
// (declared before "/:id" routes so "stats" is never treated as an id)
router.get("/stats", async (req, res) => {
    try {
        const result = await Escrow.aggregate([
            { $match: { status: "RELEASED" } },
            { $group: { _id: null, released: { $sum: "$amount" } } }
        ]);

        res.json({
            released: result.length ? result[0].released : 0
        });
    } catch (error) {
        console.error("Escrow stats error:", error);

        res.status(500).json({
            error: "Failed to fetch escrow statistics"
        });
    }
});


// POST - Create new escrow deposit
router.post("/", async (req, res) => {
    try {
        const { asset } = req.body;
        const amount = Number(req.body.amount);

        if (!asset || !Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                error: "Asset and valid amount are required"
            });
        }

        const escrow = await Escrow.create({
            asset,
            amount,
            status: "LOCKED"
        });

        res.status(201).json({
            message: "Reward locked successfully",
            id: escrow.id
        });

    } catch (error) {
        console.error("Escrow creation error:", error);

        res.status(500).json({
            error: "Failed to create escrow"
        });
    }
});


// PUT - Verify and release payout (only a LOCKED contract can be released)
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const escrow = isValidId(id)
            ? await Escrow.findOneAndUpdate(
                { _id: id, status: "LOCKED" },
                { status: "RELEASED", releasedAt: new Date() },
                { new: true }
            )
            : null;

        if (!escrow) {
            return res.status(404).json({
                error: "Escrow contract not found or already released"
            });
        }

        res.json({
            message: "Payout released successfully"
        });

    } catch (error) {
        console.error("Escrow release error:", error);

        res.status(500).json({
            error: "Failed to release payout"
        });
    }
});


// DELETE - Cancel escrow (only a LOCKED contract can be cancelled)
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const escrow = isValidId(id)
            ? await Escrow.findOneAndDelete({ _id: id, status: "LOCKED" })
            : null;

        if (!escrow) {
            return res.status(404).json({
                error: "Escrow contract not found"
            });
        }

        res.json({
            message: "Escrow cancelled successfully"
        });

    } catch (error) {
        console.error("Escrow cancellation error:", error);

        res.status(500).json({
            error: "Failed to cancel escrow"
        });
    }
});


module.exports = router;
