const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require('@seald-io/nedb');
const path = require("path");
const validator = require("validator");
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
const dbPath = path.join(
    appData,
    appName,
    "server",
    "databases",
    "providers.db",
);

app.use(bodyParser.json());
module.exports = app;

let providerDB = new Datastore({
    filename: dbPath,
    autoload: true,
});

providerDB.ensureIndex({ fieldName: "_id", unique: true });

app.get("/", function (req, res) {
    res.send("Providers API");
});

app.get("/all", function (req, res) {
    providerDB.find({}, function (err, docs) {
        res.send(docs);
    });
});

app.post("/provider", function (req, res) {
    let newProvider = {
        _id: Math.floor(Date.now() / 1000),
        name: validator.escape(req.body.name || ""),
        phone: validator.escape(req.body.phone || ""),
        email: validator.escape(req.body.email || ""),
    };
    providerDB.insert(newProvider, function (err) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
        } else {
            res.sendStatus(200);
        }
    });
});

app.put("/provider", function (req, res) {
    let update = {
        _id: parseInt(req.body.id),
        name: validator.escape(req.body.name || ""),
        phone: validator.escape(req.body.phone || ""),
        email: validator.escape(req.body.email || ""),
    };
    providerDB.update(
        { _id: parseInt(req.body.id) },
        update,
        {},
        function (err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
            } else {
                res.sendStatus(200);
            }
        },
    );
});

app.delete("/provider/:providerId", function (req, res) {
    providerDB.remove(
        { _id: parseInt(req.params.providerId) },
        function (err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
            } else {
                res.sendStatus(200);
            }
        },
    );
});
