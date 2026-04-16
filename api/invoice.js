const app = require("express")();
const async = require("async");
const sanitizeFilename = require('sanitize-filename');
const multer = require("multer");
const path = require("path");
const validator = require("validator");
const bodyParser = require("body-parser");

const appName = process.env.APPNAME;
const appData = process.env.APPDATA;

// ── File upload middleware (invoice photos / PDFs) ──────────────────────────
const storage = multer.diskStorage({
    destination: path.join(appData, appName, "uploads"),
    filename: function (req, file, callback) {
        callback(null, Date.now() + path.extname(file.originalname));
    },
});

const invoiceUpload = multer({
    storage: storage,
    limits: { fileSize: 2097152 * 5 }, // 10 MB
    fileFilter: function (req, file, cb) {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
        }
    },
}).single("invoiceFile");

app.use(bodyParser.json());

module.exports = app;

// ── Datastores (shared singletons — never open the same .db file twice) ──────
const { inventoryDB, invoicesDB } = require("./db");

// ── Helper: safe escape (handles undefined/null) ─────────────────────────────
function esc(val) {
    return validator.escape(String(val == null ? "" : val));
}

// ============================================================================
//  ROUTES
// ============================================================================

app.get("/", function (req, res) {
    res.send("Pharmacy Invoice API");
});

// ── GET all invoices ─────────────────────────────────────────────────────────
app.get("/invoices", function (req, res) {
    invoicesDB.find({}, function (err, docs) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.send(docs);
    });
});

// ── GET invoices by provider (with summary stats) ────────────────────────────
// Must be declared BEFORE /invoice/:invoiceId to prevent ambiguity
app.get("/invoice/provider/:providerId", function (req, res) {
    if (!req.params.providerId) {
        return res.status(400).json({ error: "Bad Request", message: "Provider ID is required." });
    }

    const providerId = esc(req.params.providerId);

    invoicesDB.find({ providerId: providerId }, function (err, invoices) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        const now = new Date();
        let stats = {
            totalInvoices: invoices.length,
            totalAmount:   0,
            paidAmount:    0,
            pendingAmount: 0,
            overdueAmount: 0,
            invoices:      invoices,
        };

        invoices.forEach(function (inv) {
            const net = inv.netAmount || 0;
            stats.totalAmount += net;
            if (inv.paymentStatus === "paid") {
                stats.paidAmount += net;
            } else {
                stats.pendingAmount += net;
                if (inv.dueDate && new Date(inv.dueDate) < now) {
                    stats.overdueAmount += net;
                }
            }
        });

        res.send(stats);
    });
});

// ── GET invoice by ID ────────────────────────────────────────────────────────
app.get("/invoice/:invoiceId", function (req, res) {
    if (!req.params.invoiceId) {
        return res.status(400).send("Invoice ID is required.");
    }
    invoicesDB.findOne({ invoiceId: req.params.invoiceId }, function (err, invoice) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (!invoice) return res.status(404).send("Invoice not found");
        res.send(invoice);
    });
});

// ── GET products linked to an invoice ───────────────────────────────────────
app.get("/invoice/:invoiceId/products", function (req, res) {
    if (!req.params.invoiceId) {
        return res.status(400).send("Invoice ID is required.");
    }
    const iid = req.params.invoiceId;
    inventoryDB.find({
        $or: [
            { invoiceId: iid },
            { invoiceHistory: { $elemMatch: { invoiceId: iid } } },
        ]
    }, function (err, products) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.send(products);
    });
});

// ── POST create invoice ──────────────────────────────────────────────────────
app.post("/invoice", function (req, res) {
    invoiceUpload(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: "Upload Error", message: err.message });
            }
            return res.status(500).json({ error: "Internal Server Error", message: err.message });
        }

        const invoiceFile = req.file ? sanitizeFilename(req.file.filename) : "";

        const invoice = {
            invoiceId:       esc(req.body.invoiceId) || `INV-${Date.now()}`,
            providerId:      esc(req.body.providerId),
            invoiceDate:     esc(req.body.invoiceDate),
            dueDate:         esc(req.body.dueDate),
            totalAmount:     parseFloat(esc(req.body.totalAmount))    || 0,
            taxAmount:       parseFloat(esc(req.body.taxAmount))      || 0,
            discountAmount:  parseFloat(esc(req.body.discountAmount)) || 0,
            netAmount:       parseFloat(esc(req.body.netAmount))      || 0,
            paymentStatus:   esc(req.body.paymentStatus) || "pending",
            paymentMethod:   esc(req.body.paymentMethod),
            status:          esc(req.body.status) || "active",
            notes:           esc(req.body.notes),
            invoiceFile:     invoiceFile,
            createdAt:       new Date().toISOString(),
            updatedAt:       new Date().toISOString(),
        };

        invoicesDB.insert(invoice, function (err, newInvoice) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            res.status(200).json(newInvoice);
        });
    });
});

// ── PUT update invoice (partial update, optional file replacement) ───────────
app.put("/invoice/:invoiceId", function (req, res) {
    if (!req.params.invoiceId) {
        return res.status(400).send("Invoice ID is required.");
    }

    invoiceUpload(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: "Upload Error", message: err.message });
            }
            return res.status(500).json({ error: "Internal Server Error", message: err.message });
        }

        const updates = { updatedAt: new Date().toISOString() };

        if (req.body.paymentStatus  !== undefined) updates.paymentStatus  = esc(req.body.paymentStatus);
        if (req.body.invoiceDate    !== undefined) updates.invoiceDate    = esc(req.body.invoiceDate);
        if (req.body.dueDate        !== undefined) updates.dueDate        = esc(req.body.dueDate);
        if (req.body.totalAmount    !== undefined) updates.totalAmount    = parseFloat(esc(req.body.totalAmount))    || 0;
        if (req.body.taxAmount      !== undefined) updates.taxAmount      = parseFloat(esc(req.body.taxAmount))      || 0;
        if (req.body.discountAmount !== undefined) updates.discountAmount = parseFloat(esc(req.body.discountAmount)) || 0;
        if (req.body.netAmount      !== undefined) updates.netAmount      = parseFloat(esc(req.body.netAmount))      || 0;
        if (req.body.paymentMethod  !== undefined) updates.paymentMethod  = esc(req.body.paymentMethod);
        if (req.body.status         !== undefined) updates.status         = esc(req.body.status) || "active";
        if (req.body.notes          !== undefined) updates.notes          = esc(req.body.notes);

        // Replace the attached file if a new one was uploaded
        if (req.file) {
            updates.invoiceFile = sanitizeFilename(req.file.filename);
        }

        invoicesDB.update(
            { invoiceId: req.params.invoiceId },
            { $set: updates },
            {},
            function (err, numReplaced) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                if (numReplaced === 0) return res.status(404).send("Invoice not found");
                res.sendStatus(200);
            }
        );
    });
});

// ── DELETE invoice ───────────────────────────────────────────────────────────
app.delete("/invoice/:invoiceId", function (req, res) {
    if (!req.params.invoiceId) {
        return res.status(400).send("Invoice ID is required.");
    }

    // Block deletion if products still reference this invoice (top-level or in history)
    const delIid = req.params.invoiceId;
    inventoryDB.find({
        $or: [
            { invoiceId: delIid },
            { invoiceHistory: { $elemMatch: { invoiceId: delIid } } },
        ]
    }, function (err, products) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (products && products.length > 0) {
            return res.status(400).json({
                error: "Bad Request",
                message: `Cannot delete: ${products.length} product(s) still reference this invoice.`,
            });
        }
        invoicesDB.remove({ invoiceId: req.params.invoiceId }, {}, function (err, numRemoved) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            if (numRemoved === 0) return res.status(404).send("Invoice not found");
            res.sendStatus(200);
        });
    });
});

// ── POST link products to an invoice ────────────────────────────────────────
app.post("/invoice/:invoiceId/link-products", function (req, res) {
    if (!req.params.invoiceId) {
        return res.status(400).send("Invoice ID is required.");
    }

    const productIds = req.body.productIds;
    if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "Bad Request", message: "productIds array is required." });
    }

    async.eachSeries(productIds, function (productId, callback) {
        inventoryDB.update(
            { _id: parseInt(productId) },
            { $set: { invoiceId: req.params.invoiceId } },
            {},
            callback
        );
    }, function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.sendStatus(200);
    });
});

// ── GET invoice statistics (global) ─────────────────────────────────────────
app.get("/invoices/statistics", function (req, res) {
    invoicesDB.find({}, function (err, invoices) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        const now = new Date();
        const stats = {
            totalInvoices: invoices.length,
            totalAmount:   0,
            paidAmount:    0,
            pendingAmount: 0,
            overdueAmount: 0,
            byStatus: { paid: 0, pending: 0, overdue: 0 },
        };

        invoices.forEach(function (inv) {
            const net = inv.netAmount || 0;
            stats.totalAmount += net;
            if (inv.paymentStatus === "paid") {
                stats.paidAmount += net;
                stats.byStatus.paid++;
            } else {
                stats.pendingAmount += net;
                stats.byStatus.pending++;
                if (inv.dueDate && new Date(inv.dueDate) < now) {
                    stats.overdueAmount += net;
                    stats.byStatus.overdue++;
                }
            }
        });

        res.send(stats);
    });
});
