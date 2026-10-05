const express = require("express");

const Claim = require("../models/Claim");
const isValidId = require("../utils/isValidId");

const router = express.Router();


// GET all claims (newest first)
router.get("/", async (req, res) => {

    try {

        const claims = await Claim.find().sort({ createdAt: -1, _id: -1 });

        res.json(claims);

    } catch (error) {

        console.error("Claims fetch error:", error);

        res.status(500).json({
            error: "Failed to fetch claims"
        });

    }

});


// ADD claim
router.post("/", async (req, res) => {

    try {

        const { asset, claimant } = req.body;

        if (!asset || !claimant) {

            return res.status(400).json({
                error: "Asset and claimant are required"
            });

        }

        const claim = await Claim.create({
            asset,
            claimant,
            status: "Pending"
        });

        res.status(201).json(claim);

    } catch (error) {

        console.error("Claim creation error:", error);

        res.status(500).json({
            error: "Failed to add claim"
        });

    }

});


// UPDATE claim status
router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;

        if (!status) {

            return res.status(400).json({
                error: "Status is required"
            });

        }

        if (!isValidId(id)) {

            return res.status(404).json({
                error: "Claim not found"
            });

        }

        const claim = await Claim.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!claim) {

            return res.status(404).json({
                error: "Claim not found"
            });

        }

        res.json(claim);

    } catch (error) {

        if (error.name === "ValidationError") {

            return res.status(400).json({
                error: "Invalid claim status"
            });

        }

        console.error("Claim update error:", error);

        res.status(500).json({
            error: "Failed to update claim"
        });

    }

});


// DELETE claim
router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        if (!isValidId(id)) {

            return res.status(404).json({
                error: "Claim not found"
            });

        }

        const claim = await Claim.findByIdAndDelete(id);

        if (!claim) {

            return res.status(404).json({
                error: "Claim not found"
            });

        }

        res.json({
            message: "Claim deleted successfully"
        });

    } catch (error) {

        console.error("Claim delete error:", error);

        res.status(500).json({
            error: "Failed to delete claim"
        });

    }

});


module.exports = router;
