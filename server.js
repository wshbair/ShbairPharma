const http = require("http");
const express = require("express")();
const server = http.createServer(express);
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const pkg = require("./package.json");
const {app} = require('electron');
//require("dotenv").config();

process.env.APPDATA = app.getPath('appData');
process.env.APPNAME = pkg.name;
const PORT = Number(process.env.PORT) || 0;
const BIND_HOST = process.env.BIND_HOST || "0.0.0.0";
const LICENSE_KEY = process.env.LICENSE_KEY || "";
//@ts-expect-error
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1" || req.ip === "::ffff:127.0.0.1",
});

console.log("Server started");

express.use(bodyParser.json());
express.use(bodyParser.urlencoded({ extended: false }));
express.use(limiter);

express.all("/*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Content-type,Accept,X-Access-Token,X-Key,X-License-Key",
    );
    if (req.method == "OPTIONS") {
        res.status(200).end();
    } else {
        next();
    }
});

function isLocalRequest(req) {
    const ip = req.ip || "";
    return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

// License-key gate: enforced only when LICENSE_KEY is configured (Server mode).
// Local requests (the Server's own renderer) and the public discovery endpoint bypass.
express.use("/api", function (req, res, next) {
    if (!LICENSE_KEY) return next();
    if (isLocalRequest(req)) return next();
    if (req.path === "/discovery") return next();
    const provided = req.headers["x-license-key"];
    if (provided && provided === LICENSE_KEY) return next();
    return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid license key",
    });
});

// Public discovery endpoint — Terminals call this to verify reachability before
// they have a confirmed license key. Returns minimal, non-sensitive identity.
express.get("/api/discovery", function (req, res) {
    res.json({
        name: "ShbairPharma POS",
        version: pkg.version,
        requiresLicense: !!LICENSE_KEY,
    });
});

// Heartbeat — license-gated; used by Terminals for online/offline indicator.
express.get("/api/heartbeat", function (req, res) {
    res.json({ ok: true, ts: Date.now() });
});

express.get("/", function (req, res) {
    res.send("POS Server Online.");
});

express.use("/api/inventory", require("./api/inventory"));
express.use("/api/customers", require("./api/customers"));
express.use("/api/categories", require("./api/categories"));
express.use("/api/providers", require("./api/providers"));
express.use("/api/settings", require("./api/settings"));
express.use("/api/users", require("./api/users"));
express.use("/api/expenses", require("./api/expenses"));
express.use("/api", require("./api/transactions"));
express.use("/api/invoice",  require("./api/invoice"));
express.use("/api/payment",  require("./api/payment"));
express.use("/api/settings",  require("./api/settings"));
express.use("/api/reports", require("./api/reports"));




server.listen(PORT, BIND_HOST, () => {
    // Re-export the actually-bound port so the renderer (pos.js) can build
    // the API URL correctly when PORT=0 (OS-assigned) in Standalone mode.
    const addr = server.address();
    if (addr && typeof addr === "object") process.env.PORT = String(addr.port);
    console.log("Listening on", BIND_HOST + ":" + process.env.PORT, LICENSE_KEY ? "(license enforced)" : "");
});

/**
 * Restarts the server process.
 */
function restartServer() {
    server.close(() => {
        // Remove cached modules so require() reloads them
        Object.keys(require.cache).forEach(key => {
            if (key.includes('api') || key.endsWith('server.js')) {
                delete require.cache[key];
            }
        });
        // Re-require server.js to restart everything
        require('./server');
    });
}

module.exports = { restartServer };