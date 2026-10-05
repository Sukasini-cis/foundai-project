const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// =========================
// LOAD ENVIRONMENT VARIABLES (backend/.env -> main MongoDB cluster)
// Use an absolute path so this works whether you run
// `node server.js` from inside backend/, or `node server.js` /
// `npm start` from the project root.
// =========================
dotenv.config({ path: path.join(__dirname, ".env") });

// Database connection - everything lives on ONE cluster now
const connectDB = require("./config/db");

// Models used for seeding
const Profile = require("./models/Profile");

// Routes - main app
const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const notificationRoutes = require("./routes/notifications");
const dashboardRoutes = require("./routes/dashboard");

// Routes - merged modules (now on the SAME main cluster)
const profileRoutes = require("./routes/profile");
const reportRoutes = require("./routes/reports");
const foundReportRoutes = require("./routes/foundReports");
const messageRoutes = require("./routes/messages");

// Routes - admin module + heatmap (moved from MySQL to the SAME main cluster)
const claimsRoutes = require("./routes/claims");
const escrowRoutes = require("./routes/escrow");
const moderationRoutes = require("./routes/moderation");
const heatmapRoutes = require("./routes/heatmap");


// =========================
// CREATE EXPRESS APP
// =========================

const app = express();


// =========================
// MIDDLEWARE
// =========================

app.use(cors());

// 15mb: report pages upload item photos as base64
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Serve the frontend from the same server (http://localhost:5000/login/index.html ...)
app.use(express.static(path.join(__dirname, "..", "frontend")));


// =========================
// CONNECT TO MONGODB (single main cluster - backend/.env)
// =========================

connectDB().then(async () => {
    // Ensure at least one profile exists (from the old profile module)
    try {
        const count = await Profile.countDocuments();
        if (count === 0) {
            await new Profile().save();
            console.log("Initialized default user profile in the main cluster");
        }
    } catch (e) {
        console.error("Error checking initial profile:", e.message);
    }
});


// =========================
// API ROUTES
// =========================

// ---- Main app ----
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ---- Merged modules (all on the main cluster now) ----
app.use("/api/profile", profileRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/found-reports", foundReportRoutes);
app.use("/api/conversations", messageRoutes);

// ---- Admin module + heatmap (all on the main cluster now) ----
app.use("/api/claims", claimsRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/heatmap", heatmapRoutes);


// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {
    res.json({
        message: "FoundAI backend is running!"
    });
});


// =========================
// START SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
