const express = require("express");

const Notification = require("../models/Notification");

const router = express.Router();


// =========================
// GET USER NOTIFICATIONS
// =========================

router.get("/:userId", async (req, res) => {

    try {

        const notifications = await Notification.find({

            userId: req.params.userId

        })
        .sort({ createdAt: -1 });


        res.json(notifications);

    } catch (error) {

        console.error("Get notifications error:", error);

        res.status(500).json({

            message: "Failed to get notifications"

        });

    }

});


// =========================
// CREATE NOTIFICATION
// =========================

router.post("/", async (req, res) => {

    try {

        const notification = await Notification.create({

            userId: req.body.userId,
            message: req.body.message,
            type: req.body.type

        });


        res.status(201).json({

            message: "Notification created",
            notification: notification

        });

    } catch (error) {

        console.error("Create notification error:", error);

        res.status(500).json({

            message: "Failed to create notification"

        });

    }

});


// =========================
// MARK AS READ
// =========================

router.put("/:id/read", async (req, res) => {

    try {

        const notification = await Notification.findByIdAndUpdate(

            req.params.id,

            {
                isRead: true
            },

            {
                new: true
            }

        );


        if (!notification) {

            return res.status(404).json({

                message: "Notification not found"

            });

        }


        res.json({

            message: "Notification marked as read",
            notification: notification

        });

    } catch (error) {

        console.error("Mark notification error:", error);

        res.status(500).json({

            message: "Failed to update notification"

        });

    }

});


// =========================
// DELETE NOTIFICATION
// =========================

router.delete("/:id", async (req, res) => {

    try {

        const notification =
            await Notification.findByIdAndDelete(
                req.params.id
            );


        if (!notification) {

            return res.status(404).json({

                message: "Notification not found"

            });

        }


        res.json({

            message: "Notification deleted"

        });

    } catch (error) {

        console.error("Delete notification error:", error);

        res.status(500).json({

            message: "Failed to delete notification"

        });

    }

});


module.exports = router;