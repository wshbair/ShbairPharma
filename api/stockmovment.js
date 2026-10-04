/** @type {import("express").Express & { recordMovement: typeof recordMovement; createMovementRecord: typeof createMovementRecord; getActor: typeof getActor }} */
const app = require("express")();
const bodyParser = require("body-parser");
const { stockmovmentDB } = require("./db");

app.use(bodyParser.json());

function createMovementRecord(options) {
    const before = options.before || null;
    const after = options.after || null;
    const quantityBefore = before ? Number(before.quantity) : null;
    const quantityAfter = after ? Number(after.quantity) : null;
    const changes = {};

    const keys = new Set([
        ...Object.keys(before || {}),
        ...Object.keys(after || {}),
    ]);
    keys.delete("_id");

    keys.forEach(function (key) {
        const oldValue = before ? before[key] : undefined;
        const newValue = after ? after[key] : undefined;
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = { from: oldValue, to: newValue };
        }
    });

    return {
        action: options.action,
        timestamp: options.timestamp || new Date().toISOString(),
        productId: (after || before || {})._id,
        productName: (after || before || {}).name || "",
        quantityBefore: Number.isFinite(quantityBefore) ? quantityBefore : null,
        quantityAfter: Number.isFinite(quantityAfter) ? quantityAfter : null,
        quantityChange: Number.isFinite(quantityBefore) && Number.isFinite(quantityAfter)
            ? Number((quantityAfter - quantityBefore).toFixed(2))
            : (Number.isFinite(quantityAfter) ? quantityAfter : (Number.isFinite(quantityBefore) ? -quantityBefore : null)),
        source: options.source || "unknown",
        reference: options.reference || null,
        actor: options.actor || null,
        changes: changes,
        details: options.details || null,
    };
}

function recordMovement(options, callback) {
    if (!options || !options.action) {
        const error = new Error("A stock movement action is required.");
        if (callback) return callback(error);
        console.error(error);
        return;
    }

    stockmovmentDB.insert(createMovementRecord(options), function (err, record) {
        if (err) console.error("Failed to record stock movement:", err);
        if (callback) callback(err, record);
    });
}

function getActor(req) {
    if (!req) return null;
    const body = req.body || {};
    const actor = {
        id: body.user_id !== undefined ? body.user_id : (body.userId || null),
        name: body.username || body.userName || null,
    };
    if (req.ip) actor.ip = req.ip;
    return actor.id || actor.name || actor.ip ? actor : null;
}

app.get("/", function (req, res) {
    const query = {};
    if (req.query.productId !== undefined) {
        const productId = Number(req.query.productId);
        if (!Number.isFinite(productId)) {
            return res.status(400).json({ error: "Valid productId required" });
        }
        query.productId = productId;
    }
    if (req.query.action) query.action = String(req.query.action);
    if (req.query.start || req.query.end) {
        query.timestamp = {};
        if (req.query.start) query.timestamp.$gte = String(req.query.start);
        if (req.query.end) query.timestamp.$lte = String(req.query.end);
    }

    const requestedLimit = Number(req.query.limit) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 500);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    stockmovmentDB.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(function (err, records) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            res.json(records);
        });
});

app.recordMovement = recordMovement;
app.createMovementRecord = createMovementRecord;
app.getActor = getActor;
module.exports = app;