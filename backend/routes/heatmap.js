const express = require("express");

const router = express.Router();

const Heatmap = require("../models/Heatmap");
const Report = require("../models/Report");


// Does this report's free-text location belong to this hotspot? (e.g. a
// report with location "2nd Floor, Library" matches the "Library" hotspot)
function locationMatchesHotspot(hotspotName, location) {

    if (!hotspotName || !location) return false;

    const needle = hotspotName.trim().toLowerCase();
    const haystack = location.trim().toLowerCase();

    return needle.length > 0 && haystack.length > 0 && (
        haystack.indexOf(needle) !== -1 ||
        needle.indexOf(haystack) !== -1
    );
}


// Collapse stray whitespace on a free-text location so "Library", " Library",
// "Library  " etc. are all treated as the same place.
function normalizeLocation(raw) {
    if (!raw) return "";
    return raw.replace(/\s+/g, " ").trim();
}


// Turn a group of real lost-item reports into the {name, pct} rows the
// "Zone Details" panel expects. Most recent reports are weighted higher so
// the progress bars stay visually meaningful.
function buildItemRows(matches) {

    return matches
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8)
        .map((report, index) => ({
            name: report.itemName + (report.status === "returned" ? " (returned)" : ""),
            pct: Math.max(20, 100 - index * 12)
        }));
}


// Turn real lost-item reports into the {name, pct} rows the "Zone Details"
// panel expects, matching each report's free-text location against the
// hotspot's name.
function buildItemsForHotspot(hotspotName, reports) {

    if (!hotspotName) return [];

    const matches = reports.filter((report) =>
        locationMatchesHotspot(hotspotName, report.location)
    );

    return buildItemRows(matches);
}


// Score a location's risk (0-100, same scale the riskColor filter expects:
// >80 High, >50 Medium, else Low) from its real lost-item reports. Items
// still being searched for count more than ones already returned, and more
// reports at a spot pushes it further up the scale.
function computeRiskFromReports(matches) {

    if (!matches.length) return 0;

    const active = matches.filter((report) => report.status !== "returned").length;
    const resolved = matches.length - active;

    return Math.min(97, Math.round(20 + active * 18 + resolved * 6));
}


// Deterministic (but scattered) 0-100 position for a hotspot that has no
// hand-placed x/y in the DB, so the same location always lands in the same
// spot on the map between refreshes instead of jumping around.
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function autoPosition(name) {
    return {
        x: 12 + (hashString(name + "::x") % 76), // keep clear of the edges
        y: 15 + (hashString(name + "::y") % 70)
    };
}


// GET all hotspots. Every distinct "Last Seen Location" that appears on a
// real lost-item report becomes a hotspot on the Campus Spatial Risk Map,
// not just the hand-curated ones (e.g. "Library") already sitting in the
// heatmaps collection. A curated hotspot keeps its manually-set position and
// styling but is enriched with its real reports; every other reported
// location gets an auto-generated hotspot with a data-driven risk score.
router.get("/", async (req, res) => {

    try {

        const [hotspots, reports] = await Promise.all([
            Heatmap.find().lean(),
            Report.find().lean()
        ]);

        // Report locations absorbed into a curated hotspot by name match,
        // so they don't also spawn a duplicate auto-generated hotspot.
        const claimedLocationKeys = new Set();

        const curated = hotspots.map((spot) => {

            const matches = reports.filter((report) =>
                locationMatchesHotspot(spot.name, report.location)
            );

            matches.forEach((report) => {
                const key = normalizeLocation(report.location).toLowerCase();
                if (key) claimedLocationKeys.add(key);
            });

            const realItems = buildItemRows(matches);

            return Object.assign({}, spot, {
                // Real reported lost items take priority; fall back to
                // whatever was already on the document (if anything) so
                // zones with no matching reports yet aren't left empty.
                items: realItems.length > 0 ? realItems : (spot.items || []),
                reportedCount: realItems.length
            });

        });

        // Group every remaining report by its (normalized) location so
        // every other reported place shows up on the map too.
        const groups = new Map();

        reports.forEach((report) => {

            const displayName = normalizeLocation(report.location);
            if (!displayName) return;

            const key = displayName.toLowerCase();
            if (claimedLocationKeys.has(key)) return;

            if (!groups.has(key)) {
                groups.set(key, { name: displayName, reports: [] });
            }

            groups.get(key).reports.push(report);

        });

        const auto = Array.from(groups.values()).map((group) => {

            const pos = autoPosition(group.name);

            return {
                id: "auto-" + group.name.toLowerCase().replace(/\s+/g, "-"),
                name: group.name,
                x: pos.x,
                y: pos.y,
                size: Math.min(90, 40 + group.reports.length * 10),
                risk: computeRiskFromReports(group.reports),
                recoveryProbability: 0,
                safestArea: "",
                modelVersion: "v2.4 Spatial Engine",
                items: buildItemRows(group.reports),
                reportedCount: group.reports.length,
                autoGenerated: true
            };

        });

        res.json(curated.concat(auto));

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch heatmap data"
        });

    }

});


// ADD hotspot
router.post("/", async (req, res) => {

    try {

        const hotspot = await Heatmap.create(req.body);

        res.status(201).json(hotspot);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to add hotspot"
        });

    }

});


// UPDATE hotspot
router.put("/:id", async (req, res) => {

    try {

        const hotspot = await Heatmap.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true
            }
        );

        res.json(hotspot);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to update hotspot"
        });

    }

});


module.exports = router;