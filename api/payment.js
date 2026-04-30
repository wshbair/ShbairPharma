const app        = require("express")();
const bodyParser  = require("body-parser");
const validator   = require("validator");

app.use(bodyParser.json());
module.exports = app;

const { invoicesDB, paymentsDB } = require("./db");

function esc(val) {
    return validator.escape(String(val == null ? "" : val));
}

// ── Helper: recalculate and persist paymentStatus on all provider invoices ────
function syncInvoiceStatuses(providerId, callback) {
    paymentsDB.find({ providerId: providerId }, function (err, payments) {
        if (err) return callback(err);

        const totalPaid = payments.reduce(function (s, p) {
            return s + (parseFloat(p.amount) || 0);
        }, 0);

        invoicesDB.find({ providerId: providerId }, function (err2, invoices) {
            if (err2) return callback(err2);
            if (invoices.length === 0) return callback(null);

            // Oldest invoice gets paid off first
            invoices.sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());

            let remaining = totalPaid;
            let done = 0;

            invoices.forEach(function (inv) {
                const net = parseFloat(inv.netAmount) || 0;
                let status;
                let invPaid;

                if (remaining >= net && net > 0) {
                    status  = "paid";
                    invPaid = net;
                    remaining -= net;
                } else if (remaining > 0) {
                    status  = "partial";
                    invPaid = remaining;
                    remaining = 0;
                } else {
                    status  = "pending";
                    invPaid = 0;
                }

                invoicesDB.update(
                    { invoiceId: inv.invoiceId },
                    { $set: { paymentStatus: status, paidAmount: invPaid } },
                    {},
                    function (updateErr) {
                        done++;
                        if (done === invoices.length) callback(updateErr || null);
                    }
                );
            });
        });
    });
}

// ── GET all payments for a provider (with running balance) ───────────────────
app.get("/provider/:providerId", function (req, res) {
    const providerId = esc(req.params.providerId);

    // Fetch payments and invoices in parallel
    paymentsDB.find({ providerId: providerId }, function (err, payments) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        invoicesDB.find({ providerId: providerId }, function (err2, invoices) {
            if (err2) {
                console.error(err2);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            const totalInvoiced = invoices.reduce(function (s, inv) {
                return s + (parseFloat(inv.netAmount) || 0);
            }, 0);

            const totalPaid = payments.reduce(function (s, p) {
                return s + (parseFloat(p.amount) || 0);
            }, 0);

            // Sort payments newest-first
            payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

            res.send({
                payments:       payments,
                totalInvoiced:  totalInvoiced,
                totalPaid:      totalPaid,
                balance:        totalInvoiced - totalPaid,
            });
        });
    });
});

// ── POST create payment ───────────────────────────────────────────────────────
app.post("/", function (req, res) {
    const payment = {
        paymentId:     "PAY-" + Date.now(),
        providerId:    esc(req.body.providerId),
        amount:        parseFloat(esc(req.body.amount))  || 0,
        paymentDate:   esc(req.body.paymentDate),
        paymentMethod: esc(req.body.paymentMethod) || "cash",
        reference:     esc(req.body.reference)     || "",
        notes:         esc(req.body.notes)         || "",
        createdAt:     new Date().toISOString(),
        updatedAt:     new Date().toISOString(),
    };

    paymentsDB.insert(payment, function (err, newPayment) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        syncInvoiceStatuses(payment.providerId, function () {
            res.status(200).json(newPayment);
        });
    });
});

// ── PUT update payment ───────────────────────────────────────────────────────
app.put("/:paymentId", function (req, res) {
    const paymentId = esc(req.params.paymentId);

    const updates = { updatedAt: new Date().toISOString() };
    if (req.body.amount        !== undefined) updates.amount        = parseFloat(esc(req.body.amount)) || 0;
    if (req.body.paymentDate   !== undefined) updates.paymentDate   = esc(req.body.paymentDate);
    if (req.body.paymentMethod !== undefined) updates.paymentMethod = esc(req.body.paymentMethod);
    if (req.body.reference     !== undefined) updates.reference     = esc(req.body.reference);
    if (req.body.notes         !== undefined) updates.notes         = esc(req.body.notes);

    paymentsDB.findOne({ paymentId: paymentId }, function (err0, existing) {
        if (err0) {
            console.error(err0);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (!existing) return res.status(404).send("Payment not found");

        paymentsDB.update(
            { paymentId: paymentId },
            { $set: updates },
            {},
            function (err, numReplaced) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (numReplaced === 0) return res.status(404).send("Payment not found");
                syncInvoiceStatuses(existing.providerId, function () {
                    res.sendStatus(200);
                });
            }
        );
    });
});

// ── DELETE payment ────────────────────────────────────────────────────────────
app.delete("/:paymentId", function (req, res) {
    const paymentId = esc(req.params.paymentId);

    paymentsDB.findOne({ paymentId: paymentId }, function (err0, existing) {
        if (err0) {
            console.error(err0);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (!existing) return res.status(404).send("Payment not found");

        paymentsDB.remove({ paymentId: paymentId }, {}, function (err, numRemoved) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            if (numRemoved === 0) return res.status(404).send("Payment not found");
            syncInvoiceStatuses(existing.providerId, function () {
                res.sendStatus(200);
            });
        });
    });
});
