const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const router = express.Router();


// =========================
// SIGNUP
// =========================

router.post("/signup", async (req, res) => {

    try {

        const {
            fullName,
            username,
            email,
            phone,
            password,
            organization,
            department,
            studentId
        } = req.body;


        // Check whether email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.status(400).json({
                message: "Email already registered"
            });

        }


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create user
        const user = await User.create({

            fullName,
            username,
            email,
            phone,
            password: hashedPassword,
            organization,
            department,
            studentId

        });


        res.status(201).json({

            message: "Signup successful",
            userId: user._id

        });


    } catch (error) {

        console.error("Signup error:", error);

        res.status(500).json({

            message: "Signup failed"

        });

    }

});


// =========================
// LOGIN
// =========================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {

            return res.status(401).json({

                message: "Invalid email or password"

            });

        }


        // Compare entered password with hashed password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!isMatch) {

            return res.status(401).json({

                message: "Invalid email or password"

            });

        }


        // Mark the user online now that login succeeded
        user.online = true;
        user.lastSeen = new Date();
        await user.save();


        // Login successful
        res.json({

            message: "Login successful",

            user: {

                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                organization: user.organization,
                department: user.department,
                studentId: user.studentId

            }

        });


    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({

            message: "Login failed"

        });

    }

});


// =========================
// LOGOUT (marks the user offline for the public "online now" list)
// =========================

router.post("/logout", async (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        await User.findByIdAndUpdate(userId, {
            online: false
        });

        res.json({ message: "Logged out" });

    } catch (error) {

        console.error("Logout error:", error);

        res.status(500).json({ message: "Failed to log out" });

    }

});


// =========================
// HEARTBEAT — call periodically while a page is open so this user
// keeps showing as "online" on the public Messages / Community list.
// =========================

router.post("/heartbeat", async (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                online: true,
                lastSeen: new Date()
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "ok" });

    } catch (error) {

        console.error("Heartbeat error:", error);

        res.status(500).json({ message: "Failed to record heartbeat" });

    }

});


// =========================
// ONLINE USERS — everyone currently logged in, for the public chat list.
// A user counts as online if their flag is set AND they've pinged in the
// last 2 minutes (so a closed tab doesn't stay "online" forever).
// =========================

router.get("/online", async (req, res) => {

    try {

        const { exclude } = req.query;

        const cutoff = new Date(Date.now() - 2 * 60 * 1000);

        const query = {
            online: true,
            lastSeen: { $gte: cutoff }
        };

        if (exclude) {
            query._id = { $ne: exclude };
        }

        const users = await User.find(query)
            .select("fullName username email organization department lastSeen")
            .sort({ lastSeen: -1 });

        res.json(users);

    } catch (error) {

        console.error("Get online users error:", error);

        res.status(500).json({ message: "Failed to get online users" });

    }

});


module.exports = router;