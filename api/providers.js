const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require('@seald-io/nedb');
const path = require("path");
const validator = require("validator");
const e = require("express");
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;


app.use(bodyParser.json());
module.exports = app;

// Use the shared singleton so providersDB is opened exactly once
const { providersDB } = require("./db");


app.get("/", function (req, res) {
    res.send("Providers API");
});

app.get("/all", function (req, res) {
    providersDB.find({}, function (err, docs) {
        res.send(docs);
    });
});

app.post("/provider", function (req, res) {
    let newProvider = {
        _id: Math.floor(Date.now() / 1000),
        name: validator.escape(req.body.name || ""),
        phone: validator.escape(req.body.phone || ""),
        email: validator.escape(req.body.email || ""),
        entryDate: new Date().toISOString(),

    };
    providersDB.insert(newProvider, function (err) {
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
    providersDB.update(
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
    providersDB.remove(
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
