// @ts-check
const app = require("express")();
const bodyParser = require("body-parser");
const sanitizeFilename = require('sanitize-filename');
const multer = require("multer");
const path = require("path");
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
            //@ts-expect-error
            cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
        }
    },
}).single("invoiceFile");

app.use(bodyParser.json());
module.exports = app;

// Use the shared singleton so expensesDB is opened exactly once
const { expensesDB } = require("./db");

// Expense categories enum
const EXPENSE_CATEGORIES = [
    "Rent",
    "Salaries",
    "Electricity",
    "Internet",
    "Water",
    "Licensing",
    "Municipality Fees",
    "Maintenance",
    "Miscellaneous"
];

/**
 * Validate expense data
 * @param {Object} data
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateExpense(data) {
    const errors = [];
    
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        errors.push('Title is required');
    }
    
    if (!data.category || !EXPENSE_CATEGORIES.includes(data.category)) {
        errors.push(`Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
    }
    
    if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
        errors.push('Amount must be a positive number');
    }
    
    if (!data.expenseDate) {
        errors.push('Expense date is required');
    } else {
        const expenseDate = new Date(data.expenseDate);
        if (isNaN(expenseDate.getTime())) {
            errors.push('Invalid expense date format');
        } else if (expenseDate > new Date()) {
            errors.push('Expense date cannot be in the future');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * GET /
 * Welcome message
 */
app.get("/", function (req, res) {
    res.send("Expenses API");
});

/**
 * GET /all
 * Get all expenses with optional filtering
 */
app.get("/all", function (req, res) {
    const { category, startDate, endDate } = req.query;
    const query = {};
    
    if (category && EXPENSE_CATEGORIES.includes(category)) {
        query.category = category;
    }
    
    if (startDate || endDate) {
        query.expenseDate = {};
        if (startDate) {
            query.expenseDate.$gte = new Date(startDate).getTime();
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.expenseDate.$lte = end.getTime();
        }
    }
  expensesDB.find(query, function (err, docs) {
    res.send({
      success: true,
      count: docs.length,
      data: docs
    });

  });
});

/**
 * GET /category/:category
 * Get expenses by category
 */
app.get("/category/:category", function (req, res) {
    const { category } = req.params;

    expensesDB.find({ category }).sort({ expenseDate: -1 }).exec(function (err, docs) {
        if (err) {
            console.error(err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to retrieve expenses"
            });
        } else {
            res.json({
                success: true,
                category,
                count: docs.length,
                data: docs
            });
        }
    });
});

/**
 * GET /expense/:id
 * Get a single expense by ID
 */
app.get("/expense/:id", function (req, res) {
    const { id } = req.params;
    
    expensesDB.findOne({ _id: id }, function (err, doc) {
        if (err) {
            console.error(err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to retrieve expense"
            });
        } else if (!doc) {
            res.status(404).json({
                error: "Not Found",
                message: `Expense with id ${id} not found`
            });
        } else {
            res.json({
                success: true,
                data: doc
            });
        }
    });
});

/**
 * POST /expense
 * Create a new expense
 */


app.post("/expense", function (req, res) {
    console.log("Received expense creation request with body:", req.body);
    invoiceUpload(req, res, function (err) {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: "Upload Error", message: err.message });
            }
            return res.status(500).json({ error: "Internal Server Error", message: err.message });
        }
        
        const invoiceFile = req.file ? sanitizeFilename(req.file.filename) : "";
        const invoice = {
            title: req.body.title,
            category: req.body.category,
            amount: parseFloat(req.body.amount),
            description: req.body.description || "",
            expenseDate: new Date(req.body.expenseDate).getTime(),
            expenseFile: invoiceFile,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()   
        };
        expensesDB.insert(invoice, function (err, newInvoice) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            res.status(200).json(newInvoice);
        });
    });
});

/**
 * PUT /expense/:id
 * Update an expense
 */
app.put("/expense/:id", function (req, res) {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find existing expense
    expensesDB.findOne({ _id: id }, function (err, existing) {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to update expense"
            });
        }
        
        if (!existing) {
            return res.status(404).json({
                error: "Not Found",
                message: `Expense with id ${id} not found`
            });
        }
        
        // Prepare updated data
        const merged = {
            ...existing,
            title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
            category: updateData.category !== undefined ? updateData.category : existing.category,
            amount: updateData.amount !== undefined ? parseFloat(updateData.amount) : existing.amount,
            currency: updateData.currency !== undefined ? updateData.currency : existing.currency,
            description: updateData.description !== undefined ? updateData.description : existing.description,
            expenseDate: updateData.expenseDate !== undefined ? new Date(updateData.expenseDate).getTime() : existing.expenseDate,
            updatedAt: Date.now()
        };
        
        // Validate merged data
        const validation = validateExpense({
            title: merged.title,
            category: merged.category,
            amount: merged.amount,
            expenseDate: new Date(merged.expenseDate)
        });
        
        if (!validation.valid) {
            return res.status(400).json({
                error: "Validation Error",
                message: "Invalid expense data",
                details: validation.errors
            });
        }
        
        // Update
        expensesDB.update({ _id: id }, merged, {}, function (err, numReplaced) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "Failed to update expense"
                });
            } else {
                res.json({
                    success: true,
                    message: "Expense updated successfully",
                    data: merged
                });
            }
        });
    });
});

/**
 * DELETE /expense/:id
 * Delete an expense
 */
app.delete("/expense/:id", function (req, res) {
    const { id } = req.params;
    
    expensesDB.findOne({ _id: id }, function (err, existing) {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to delete expense"
            });
        }
        
        if (!existing) {
            return res.status(404).json({
                error: "Not Found",
                message: `Expense with id ${id} not found`
            });
        }
        
        expensesDB.remove({ _id: id }, {}, function (err, numRemoved) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "Failed to delete expense"
                });
            } else {
                res.json({
                    success: true,
                    message: "Expense deleted successfully",
                    deletedId: id
                });
            }
        });
    });
});

/**
 * GET /summary
 * Get expense summary (total by category and overall)
 */
app.get("/summary", function (req, res) {
    const { category, startDate, endDate } = req.query;
    const query = {};
    
    if (category && VALID_CATEGORIES.includes(category)) {
        query.category = category;
    }
    
    if (startDate || endDate) {
        query.expenseDate = {};
        if (startDate) {
            query.expenseDate.$gte = new Date(startDate).getTime();
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.expenseDate.$lte = end.getTime();
        }
    }
    
    expensesDB.find(query, function (err, expenses) {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to generate summary"
            });
        }
        
        const summary = {};
        let total = 0;
        
        expenses.forEach(exp => {
            if (!summary[exp.category]) {
                summary[exp.category] = {
                    name: EXPENSE_CATEGORIES[exp.category],
                    amount: 0,
                    count: 0
                };
            }
            summary[exp.category].amount += exp.amount;
            summary[exp.category].count += 1;
            total += exp.amount;
        });
        
        res.json({
            success: true,
            summary: {
                byCategory: summary,
                total: total,
                totalExpenses: expenses.length,
                dateRange: {
                    from: startDate || null,
                    to: endDate || null
                }
            }
        });
    });
});

/**
 * POST /expense/batch
 * Create multiple expenses at once
 */
app.post("/expense/batch", function (req, res) {
    const expenses = Array.isArray(req.body) ? req.body : [req.body];
    
    if (!Array.isArray(expenses) || expenses.length === 0) {
        return res.status(400).json({
            error: "Bad Request",
            message: "Provide an array of expenses"
        });
    }
    
    const validatedExpenses = [];
    const validationErrors = [];
    
    // Validate all expenses
    expenses.forEach((exp, index) => {
        const validation = validateExpense(exp);
        if (!validation.valid) {
            validationErrors.push({
                index,
                errors: validation.errors
            });
        } else {
            validatedExpenses.push({
                title: exp.title.trim(),
                category: exp.category,
                amount: parseFloat(exp.amount),
                currency: exp.currency || "JOD",
                description: exp.description || "",
                expenseDate: new Date(exp.expenseDate).getTime(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }
    });
    
    if (validationErrors.length > 0) {
        return res.status(400).json({
            error: "Validation Error",
            message: "Some expenses have validation errors",
            validationErrors
        });
    }
    
    expensesDB.insert(validatedExpenses, function (err, newExpenses) {
        if (err) {
            console.error(err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to create expenses"
            });
        } else {
            res.status(201).json({
                success: true,
                message: `${newExpenses.length} expenses created successfully`,
                count: newExpenses.length,
                data: newExpenses
            });
        }
    });
});

/**
 * GET /categories
 * Get available expense categories
 */
app.get("/categories", function (req, res) {
    res.json({
        success: true,
        categories: EXPENSE_CATEGORIES,
        count: EXPENSE_CATEGORIES.length
    });
});
