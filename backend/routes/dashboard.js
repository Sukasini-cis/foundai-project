const express = require("express");

const User = require("../models/User");
const Item = require("../models/Item");
const Notification = require("../models/Notification");

const router = express.Router();


// =========================
// DASHBOARD STATISTICS
// =========================

router.get("/", async (req, res) => {

    try {

        // Count users
        const totalUsers = await User.countDocuments();


        // Count lost items
        const lostItems = await Item.countDocuments({
            type: "lost"
        });


        // Count found items
        const foundItems = await Item.countDocuments({
            type: "found"
        });


        // Count active items
        const activeItems = await Item.countDocuments({
            status: "active"
        });


        // Count notifications
        const totalNotifications =
            await Notification.countDocuments();


        res.json({

            totalUsers: totalUsers,

            lostItems: lostItems,

            foundItems: foundItems,

            activeItems: activeItems,

            totalNotifications: totalNotifications

        });


    } catch (error) {

        console.error("Dashboard error:", error);

        res.status(500).json({

            message: "Failed to load dashboard"

        });

    }

});


module.exports = router;