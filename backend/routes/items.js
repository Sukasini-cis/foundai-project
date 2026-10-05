const express = require("express");

const Item = require("../models/Item");

const router = express.Router();


// =========================
// CREATE LOST / FOUND ITEM
// =========================

router.post("/", async (req, res) => {

    try {

        const item = await Item.create(req.body);

        res.status(201).json({

            message: "Item reported successfully",
            item: item

        });

    } catch (error) {

        console.error("Create item error:", error);

        res.status(500).json({

            message: "Failed to report item"

        });

    }

});


// =========================
// GET ALL ITEMS
// =========================

router.get("/", async (req, res) => {

    try {

        const items = await Item.find()
            .populate("reportedBy", "fullName username email")
            .sort({ createdAt: -1 });


        res.json(items);

    } catch (error) {

        console.error("Get items error:", error);

        res.status(500).json({

            message: "Failed to get items"

        });

    }

});


// =========================
// GET ONE ITEM
// =========================

router.get("/:id", async (req, res) => {

    try {

        const item = await Item.findById(req.params.id)
            .populate("reportedBy", "fullName username email");


        if (!item) {

            return res.status(404).json({

                message: "Item not found"

            });

        }


        res.json(item);

    } catch (error) {

        console.error("Get item error:", error);

        res.status(500).json({

            message: "Failed to get item"

        });

    }

});


// =========================
// UPDATE ITEM
// =========================

router.put("/:id", async (req, res) => {

    try {

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );


        if (!item) {

            return res.status(404).json({

                message: "Item not found"

            });

        }


        res.json({

            message: "Item updated successfully",
            item: item

        });

    } catch (error) {

        console.error("Update item error:", error);

        res.status(500).json({

            message: "Failed to update item"

        });

    }

});


// =========================
// DELETE ITEM
// =========================

router.delete("/:id", async (req, res) => {

    try {

        const item = await Item.findByIdAndDelete(
            req.params.id
        );


        if (!item) {

            return res.status(404).json({

                message: "Item not found"

            });

        }


        res.json({

            message: "Item deleted successfully"

        });

    } catch (error) {

        console.error("Delete item error:", error);

        res.status(500).json({

            message: "Failed to delete item"

        });

    }

});


module.exports = router;