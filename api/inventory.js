const app = require("express")();
//const server = require("http").Server(app);
const bodyParser = require("body-parser");
const async = require("async");
const sanitizeFilename = require('sanitize-filename');
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {filterFile} = require('../assets/js/utils');
const maxFileSize = 2097152 //2MB = 2*1024*1024
const validator = require("validator");
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;
let moment = require("moment");

const storage = multer.diskStorage({
    destination: path.join(appData, appName, "uploads"),
    filename: function (req, file, callback) {
        callback(null, Date.now()+path.extname(file.originalname));
    },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: maxFileSize },
  fileFilter: filterFile,
}).single("imagename");

const csvUpload = multer({
  storage: storage,
  limits: { fileSize: maxFileSize },
  fileFilter: function (req, file, cb) {
    const allowedCsv = ["text/csv", "application/vnd.ms-excel", "application/csv"];
    if (allowedCsv.includes(file.mimetype)) {
      cb(null, true);
    } else {
    //@ts-expect-error
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
  },
}).single("csvfile");


function parseDate(str) {
    if(str == "")
        return new Date().toISOString().split("T")[0];
    try {
        return new Date(str).toISOString().split("T")[0];
    } catch (error) {
        console.log(error)
    }
}

app.use(bodyParser.json());
module.exports = app;

// Use the shared singleton so inventory.db is opened exactly once
const { inventoryDB } = require("./db");

/**
 * GET endpoint: Get the welcome message for the Inventory API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
    res.send("Inventory API");
});

/**
 * GET endpoint: Get product details by product ID.
 *
 * @param {Object} req request object with product ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/product/:productId", function (req, res) {
    if (!req.params.productId) {
        res.status(500).send("ID field is required.");
    } else {
        inventoryDB.findOne(
            {
                _id: parseInt(req.params.productId),
            },
            function (err, product) {
                res.send(product);
            },
        );
    }
});

/**
 * GET endpoint: Get details of all products.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/products", function (req, res) {
    inventoryDB.find({}, function (err, docs) {
        res.send(docs);
    });
});

app.get("/stock-check", function(req, res){
    inventoryDB.find({}, function(err, docs){
        
        const low = docs.filter(function (p) {
        return p.stock == 1 && parseInt(p.quantity) <= parseInt(p.minStock || 1);
        });
         
        const lowStockProducts = low.slice(0, 4).map(function (p) {
            return `<strong>${p.name}</strong> (${p.quantity})`;
        }).join(", ") + (low.length > 4 ? ` +${low.length - 4} more` : "");
        
        // expire check 
        const expired = docs.filter(function (p) {
           let expiryDate = moment(p.expirationDate, "YYYY-MM-DD");
            return moment().isSameOrAfter(expiryDate);
        });
        
        const expiredProducts = expired.slice(0, 4).map(function (p) {
            return `<strong>${p.name}</strong>`;
        }).join(", ") + (expired.length > 4 ? ` +${expired.length - 4} more` : "");

        res.send({
            "lowStockMsg": low.length > 0 ? `Inventory Alert: <strong>${low.length}</strong> products are at or below minimum stock levels, including ${lowStockProducts}` : "",
            "expiredMsg": expired.length > 0 ? `Expiry Alert: <strong>${expired.length}</strong> products have expired, including ${expiredProducts}` : ""
        })

    })
})

/**
 * POST endpoint: Create or update a product.
 *
 * @param {Object} req request object with product data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/product", function (req, res) {
    upload(req, res, function (err) {

        if (err) {
            if (err instanceof multer.MulterError) {
                console.error('Upload Error:', err);
                return res.status(400).json({
                    error: 'Upload Error',
                    message: err.message,
                });
            } else {
                console.error('Unknown Error:', err);
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: err.message,
                });
            }
        }

    let image = "";

    if (validator.escape(req.body.img) !== "") {
        image = sanitizeFilename(req.body.img);
    }

    if (req.file) {
        image = sanitizeFilename(req.file.filename);
    }


    if (validator.escape(req.body.remove) === "1") {
            try {
                let imgPath = path.join(
                appData,
                appName,
                "uploads",
                image,
                );

                if (!req.file) {
                fs.unlinkSync(imgPath);
                image = "";
                }
                
            } catch (err) {
                console.error(err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "An unexpected error occurred.",
                });
            }

        }
    let Product = {
        _id: parseInt(validator.escape(req.body.id)),
        barcode: parseInt(validator.escape(req.body.barcode)),
        expirationDate: parseDate(validator.escape(req.body.expirationDate)) ,
        price: validator.escape(req.body.price),
        category: validator.escape(req.body.category),
        quantity: validator.escape(req.body.quantity),
        name: validator.escape(req.body.name),
        stock: req.body.stock === "on" ? 0 : 1,
        minStock: validator.escape(req.body.minStock),
        img: image,
        costPrice: validator.escape(req.body.cost_price),
        profitMargin: validator.escape(req.body.profit_margin),
        provider: validator.escape(req.body.provider || ""),
        entryDate: parseDate(validator.escape(req.body.entryDate)) ,
        invoiceId: validator.escape(req.body.invoice_id),
    };

    if (validator.escape(req.body.id) === "") {
        Product._id = Math.floor(Date.now() / 1000);
        Product.invoiceHistory = [{
            invoiceId:  Product.invoiceId  || "",
            providerId: Product.provider   || "",
            quantity:   parseInt(Product.quantity) || 0,
            costPrice:  Product.costPrice  || "",
            entryDate:  Product.entryDate  || new Date().toISOString().split("T")[0],
        }];
        inventoryDB.insert(Product, function (err, product) {
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
    } else {
        inventoryDB.update(
            {
                _id: parseInt(validator.escape(req.body.id)),
            },
            Product,
            {},
            function (err, numReplaced, product) {
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
    }
    });
});

/**
 * POST /products/csv
 * Bulk import or update products from an uploaded CSV file.
 * Each row in the CSV maps to a product document.
 * If a product with the same _id already exists it will be updated, otherwise inserted.
 * Returns a summary count of inserted and updated records.
 */
app.post("/products/csv", function (req, res) {
    // Handle multipart upload via multer middleware
    csvUpload(req, res, function (err) {
        // Catch and respond to any multer-level upload errors
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    error: 'Upload Error',
                    message: err.message,
                });
            } else {
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: err.message,
                });
            }
        }

        // Ensure a file was actually uploaded
        if (!req.file) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'CSV file is required.',
            });
        }

        // Build absolute path to the uploaded CSV (sanitize filename to avoid traversal)
        let csvPath = path.join(appData, appName, "uploads", sanitizeFilename(req.file.filename));

        try {
            // Read entire CSV into memory as UTF-8 string
            let raw = fs.readFileSync(csvPath, "utf8");

            // Split into lines, trimming empty ones
            let lines = raw.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });

            // Reject if header-only or completely empty
            if (lines.length === 0) {
                return res.status(400).json({ error: "Bad Request", message: "Empty CSV file." });
            }

            // Extract headers from first line
            let headers = lines[0].split(",").map(function (h) { return h.trim(); });

            // Collect parsed products here
            let products = [];

            // Iterate data rows (skip header)
            for (let i = 1; i < lines.length; i++) {
                let cols = lines[i].split(",").map(function (c) { return c.trim(); });

                // Build row object mapping header -> value
                let row = {};
                for (let j = 0; j < headers.length; j++) { row[headers[j]] = cols[j] || ""; }

                // Sanitize image filename if provided
                let image = "";
                if (validator.escape(row.img) !== "") { image = sanitizeFilename(row.img); }

                // Construct product document with fallback defaults
                let p = {
                    _id: validator.escape(row.id) === "" ? Math.floor(Date.now() / 1000) : parseInt(validator.escape(row.id)),
                    barcode: validator.escape(row.barcode) === "" ? 0 : parseInt(validator.escape(row.barcode)),
                    expirationDate: parseDate(validator.escape(row.expirationDate)),
                    price: validator.escape(row.price),
                    category: validator.escape(row.category),
                    quantity: validator.escape(row.quantity) === "" ? 0 : parseFloat(row.quantity),
                    name: validator.escape(row.name),
                    stock: row.stock === "on" ? 0 : 1,
                    minStock: validator.escape(row.minStock) === "" ? 0 : parseFloat(row.minStock),
                    img: image,
                    profitMargin: validator.escape(row.profitMargin),
                    costPrice: validator.escape(row.costPrice),
                    entryDate:  new Date().toISOString().split("T")[0]
                };
                products.push(p);
            }
            // Counters for summary response
            let inserted = 0;
            let updated = 0;

            // Process products sequentially to avoid duplicate key races
            async.eachSeries(products, function (p, cb) {
                function proceed() {
                    inventoryDB.findOne({ _id: parseInt(p._id) }, function (e, existing) {
                        if (existing) {
                            inventoryDB.update({ _id: parseInt(p._id) }, p, {}, function (e2) {
                                if (!e2) { updated++; }
                                cb();
                            });
                        } else {
                            inventoryDB.insert(p, function (e3) {
                                if (!e3) { inserted++; }
                                cb();
                            });
                        }
                    });
                }

                let catName = validator.escape(p.category);
                if (catName === undefined || catName === null || catName === "") {
                    p.category = "other";
                    return proceed();
                }
                else
                    return proceed()

                // let catId = random(1000000, 9999999);
                // if (!isNaN(catId)) {
                //     categoryDB.findOne({ name: catName }, function (ce, existingCat) {
                //         if (existingCat) {
                //             p.category = existingCat.name;
                //             proceed();
                //         } else {
                //             categoryDB.insert({ id: catId, name: catName}, function () {
                //                 p.category = catName;
                //                 proceed();
                //             });
                //         }
                //     });
                // } else {
                //     let name = validator.escape(catName);
                //     categoryDB.findOne({ name: name }, function (ce, existingCat) {
                //         if (existingCat) {
                //             p.category = existingCat.name;
                //             proceed();
                //         } else {
                //             let id = Math.floor(Date.now() / 1000)
                //             let newCat = { id: id, name: name };
                //             categoryDB.insert(newCat, function () {
                //                 p.category = newCat.name;
                //                 proceed();
                //             });
                //         }
                //     });
                // }
            }, function (finalErr) {
                if (finalErr) {
                    return res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
                } else {
                    return res.status(200).json({ inserted: inserted, updated: updated });
                }
            });
        } catch (e) {
            // Catch file read or parsing exceptions
            return res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
        }
    });
});

/**
 * DELETE endpoint: Delete a product by product ID.
 *
 * @param {Object} req request object with product ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.delete("/product/:productId", function (req, res) {
    inventoryDB.remove(
        {
            _id: parseInt(req.params.productId),
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
 * POST endpoint: Find a product by SKU code.
 *
 * @param {Object} req request object with SKU code in the body.
 * @param {Object} res response object.
 * @returns {void}
 */

app.post("/product/sku", function (req, res) {
    let sku = validator.escape(req.body.skuCode);
    inventoryDB.findOne(
        {
            barcode: parseInt(sku),
        },
        function (err, doc) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "An unexpected error occurred.",
                });
            } else {
                res.send(doc);
            }
        },
    );
});

/**
 * POST endpoint: Find a product by product name code.
 *
 * @param {Object} req request object with product name in the body.
 * @param {Object} res response object.
 * @returns {void}
 */

app.post("/product/name", function (req, res) {
    console.log("Search Product name API")
    let name = validator.escape(req.body.productName);
    inventoryDB.find(
        {  
            $or: 
            [
                { barcode: parseInt(name) },
                { name: { $regex: new RegExp(name, "i") } }
            ]
        },
        function (err, doc) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "An unexpected error occurred.",
                });
            } else {
                res.send(doc);
            }
        },
    );
});
/**
 * PATCH /product/:id/costs
 * Update only quantity and/or costPrice of a product without touching other fields.
 */
app.patch("/product/:id/costs", function (req, res) {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Product ID required" });

    const updates = {};
    if (req.body.name           !== undefined) updates.name           = validator.escape(String(req.body.name));
    if (req.body.quantity       !== undefined) updates.quantity       = validator.escape(String(req.body.quantity));
    if (req.body.costPrice      !== undefined) updates.costPrice      = validator.escape(String(req.body.costPrice));
    if (req.body.price          !== undefined) updates.price          = validator.escape(String(req.body.price));
    if (req.body.barcode        !== undefined) updates.barcode        = validator.escape(String(req.body.barcode));
    if (req.body.expirationDate !== undefined) updates.expirationDate = parseDate(validator.escape(String(req.body.expirationDate)));

    if (!Object.keys(updates).length) {
        return res.status(400).json({ error: "No fields to update" });
    }

    inventoryDB.update({ _id: id }, { $set: updates }, {}, function (err, n) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (!n) return res.status(404).json({ error: "Product not found" });
        res.sendStatus(200);
    });
});

/**
 * POST /restock/:productId
 * Add stock to an existing product, updating invoiceId, provider, costPrice,
 * and appending an entry to invoiceHistory.
 */
app.post("/restock/:productId", function (req, res) {
    const productId  = parseInt(validator.escape(String(req.params.productId)));
    const addQty     = parseInt(validator.escape(String(req.body.quantity    || 0)));
    const invoiceId  = validator.escape(req.body.invoiceId   || "");
    const providerId = validator.escape(req.body.providerId  || "");
    const costPrice  = validator.escape(String(req.body.costPrice || ""));
    const price  = validator.escape(String(req.body.price || ""));
    const entryDate  = validator.escape(req.body.entryDate   || new Date().toISOString().split("T")[0]);
    const expireDate = parseDate(validator.escape(String(req.body.expirationDate)));

    if (!productId || addQty <= 0) {
        return res.status(400).json({ error: "Bad Request", message: "Valid product ID and quantity required." });
    }

    inventoryDB.findOne({ _id: productId }, function (err, product) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (!product) return res.status(404).json({ error: "Product not found" });

        const newQty = (parseInt(product.quantity) || 0) + addQty;
        const historyEntry = { invoiceId, providerId, quantity: addQty, costPrice, entryDate };

        inventoryDB.update(
            { _id: productId },
            {
                $set: {
                    quantity:  newQty,
                    invoiceId: invoiceId  || product.invoiceId,
                    provider:  providerId || product.provider,
                    costPrice: costPrice  || product.costPrice,
                    price:     price      || product.price,
                    expireDate: expireDate || product.expireDate
                },
                $push: { invoiceHistory: historyEntry },
            },
            {},
            function (err2) {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                res.sendStatus(200);
            }
        );
    });
});

/**
 * Decrement inventory quantities based on a list of products in a transaction.
 *
 * @param {Array} products - List of products in the transaction.
 * @returns {void}
 */
//@ts-expect-error
app.decrementInventory = function (products) {
    async.eachSeries(products, function (transactionProduct, callback) {
        inventoryDB.findOne(
            {
                _id: parseInt(transactionProduct.id),
            },
            function (err, product) {
                if (!product || !product.quantity) {
                    callback();
                } else {
                    let updatedQuantity =
                        parseFloat(product.quantity) -
                        parseFloat(transactionProduct.quantity);
                    //console.log(`Decrementing product ${product._id} quantity from ${product.quantity} to ${updatedQuantity}`);
                    inventoryDB.update(
                        {
                            _id: parseInt(product._id),
                        },
                        {
                            $set: {
                                quantity: updatedQuantity,
                            },
                        },
                        {},
                        callback,
                    );
                }
            },
        );
        inventoryDB.compactDatafile((err) => {
        if (err) console.error('Compaction failed:', err);
        else console.log('Database compacted.');
    });
    });
};
