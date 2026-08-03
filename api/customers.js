// @ts-check
/// <reference types="jquery" />

const app = require("express")();
const bodyParser = require("body-parser");
const async = require("async");
const path = require("path");
const validator = require("validator");
 
app.use(bodyParser.json());
module.exports = app;

 

// Use the shared singleton so customersDB is opened exactly once
const { customersDB } = require("./db");

/**
 * GET endpoint: Get the welcome message for the Customer API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Customer API");
});

/**
 * GET endpoint: Get customer details by customer ID.
 *
 * @param {Object} req request object with customer ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/customer/:customerId", function (req, res) {
    const customerId = req.params.customerId;
    //console.log("Fetching customer with ID:", customerId);
    if (!customerId) {
        res.status(400).send("ID field is required.");
        return;
    }

    const query = {
        $or: [
            { _id: customerId },
            { _id: parseInt(customerId, 10) },
        ],
    };

    customersDB.findOne(query, function (err, customer) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error", message: "Failed to load customer." });
            return;
        }
        res.send(customer);
    });
});

/**
 * GET endpoint: Get details of all customers.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/all", function (req, res) {
    customersDB.find({}, function (err, docs) {
        res.send(docs);
    });
});

/**
 * POST endpoint: Create a new customer.
 *
 * @param {Object} req request object with new customer data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/customer", function (req, res) {
    var newCustomer = req.body;
    customersDB.insert(newCustomer, function (err, customer) {
        if (err) {
            console.error(err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "An unexpected error occurred.",
            });
        } else {
            res.sendStatus(200);
        }
    });
});

/**
 * DELETE endpoint: Delete a customer by customer ID.
 *
 * @param {Object} req request object with customer ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/customer/:customerId", function (req, res) {
    customersDB.remove(
        {
            _id: req.params.customerId,
        },
        function (err, numRemoved) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "An unexpected error occurred.",
                });
            } else {
                res.sendStatus(200);
            }
        },
    );
});

/**
 * PUT endpoint: Update customer details.
 *
 * @param {Object} req request object with updated customer data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.put("/customer", function (req, res) {
    const rawCustomerId = req.body && (req.body._id || req.body.id);
    if (rawCustomerId === undefined || rawCustomerId === null || rawCustomerId === "") {
        res.status(400).json({ error: "Bad Request", message: "ID field is required." });
        return;
    }

    const customerId = String(rawCustomerId);
    const query = {
        $or: [
            { _id: customerId },
            { _id: parseInt(customerId, 10) },
        ],
    };

    customersDB.findOne(query, function (findErr, existingCustomer) {
        if (findErr) {
            console.error(findErr);
            res.status(500).json({ error: "Internal Server Error", message: "Failed to find customer." });
            return;
        }

        if (!existingCustomer) {
            res.status(404).json({ error: "Not Found", message: "Customer not found." });
            return;
        }

        const sanitizedCustomer = Object.assign({}, req.body, { _id: existingCustomer._id });
        customersDB.update(
            { _id: existingCustomer._id },
            { $set: sanitizedCustomer },
            {},
            function (err, numReplaced) {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: "An unexpected error occurred.",
                    });
                    return;
                }

                res.sendStatus(200);
            },
        );
    });
});