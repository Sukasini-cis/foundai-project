/**
 * One-time, OPTIONAL data copy into the main MongoDB cluster (MONGO_URI in backend/.env).
 *
 *   1. heatmap hotspots      : old MongoDB cluster  -> "heatmaps"        collection
 *   2. claims                : old MySQL table      -> "claims"          collection
 *   3. escrow                : old MySQL table      -> "escrow"          collection
 *   4. moderation_cases      : old MySQL table      -> "moderation_cases" collection
 *
 * Usage (from the backend folder):
 *   1. copy scripts/legacy.env.example to scripts/legacy.env and fill it in
 *   2. npm install mysql2 --no-save        (only needed for the MySQL part)
 *   3. node scripts/migrate-legacy-data.js
 *
 * Safe to re-run: heatmap documents are upserted by _id, and a MySQL table is
 * skipped if its MongoDB collection already has data.
 * Sections whose source is not configured (empty OLD_MONGO_URI / no mysql2) are skipped.
 */
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });                  // MONGO_URI (target)
dotenv.config({ path: path.join(__dirname, "legacy.env"), override: true });  // old sources

const mongoose = require("mongoose");
const Heatmap = require("../models/Heatmap");
const Claim = require("../models/Claim");
const Escrow = require("../models/Escrow");
const ModerationCase = require("../models/ModerationCase");

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const asDate = (value, fallback) => {
    const d = value ? new Date(value) : null;
    return d && !isNaN(d) ? d : fallback;
};

async function migrateHeatmap() {
    if (!process.env.OLD_MONGO_URI) {
        console.log("[heatmap] OLD_MONGO_URI not set - skipped");
        return;
    }

    const old = await mongoose.createConnection(process.env.OLD_MONGO_URI).asPromise();
    try {
        const docs = await old.db.collection("heatmaps").find({}).toArray();

        if (docs.length) {
            await Heatmap.bulkWrite(docs.map((doc) => ({
                replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
            })));
        }
        console.log(`[heatmap] copied ${docs.length} hotspot(s)`);
    } finally {
        await old.close();
    }
}

async function migrateMySQL() {
    let mysql;
    try {
        mysql = require("mysql2/promise");
    } catch (e) {
        console.log("[mysql] mysql2 is not installed (npm install mysql2 --no-save) - skipped");
        return;
    }

    const conn = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    try {
        const tables = [
            {
                table: "claims", Model: Claim,
                map: (r) => ({
                    asset: r.asset,
                    claimant: r.claimant,
                    status: pick(r.status, ["Pending", "Verified", "Archived"], "Pending"),
                    date: asDate(r.date || r.created_at, new Date())
                })
            },
            {
                table: "escrow", Model: Escrow,
                map: (r) => ({
                    asset: r.asset,
                    amount: Number(r.amount),
                    status: pick(r.status, ["LOCKED", "RELEASED"], "LOCKED"),
                    releasedAt: asDate(r.released_at, null),
                    createdAt: asDate(r.created_at, new Date())
                })
            },
            {
                table: "moderation_cases", Model: ModerationCase,
                map: (r) => ({
                    asset: r.asset,
                    reporter: r.reporter,
                    status: pick(r.status, ["PENDING", "RESOLVED"], "PENDING")
                })
            }
        ];

        for (const { table, Model, map } of tables) {
            if (await Model.estimatedDocumentCount() > 0) {
                console.log(`[${table}] target collection already has data - skipped`);
                continue;
            }

            const [rows] = await conn.query(`SELECT * FROM \`${table}\` ORDER BY id ASC`);
            if (rows.length) {
                await Model.insertMany(rows.map(map));
            }
            console.log(`[${table}] copied ${rows.length} row(s)`);
        }
    } finally {
        await conn.end();
    }
}

(async () => {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI (target cluster) is not set in backend/.env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to the main MongoDB cluster");

    try {
        await migrateHeatmap();
        await migrateMySQL();
    } finally {
        await mongoose.disconnect();
    }
    console.log("Done.");
})().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
