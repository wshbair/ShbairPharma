let app = require("express")();
let bodyParser = require("body-parser");
let Inventory = require("./inventory");
 
app.use(bodyParser.json());
module.exports = app;

// Use the shared singleton so transactionsDB is opened exactly once
 const { transactionsDB, inventoryDB } = require("./db");

/**
 * GET endpoint: Get the welcome message for the Transactions API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
  res.send("Transactions API");
});

/**
 * GET endpoint: Get details of all transactions.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/all", function (req, res) {
  transactionsDB.find({}, function (err, docs) {
    res.send(docs);
  });
});

/**
 * GET endpoint: Get on-hold transactions.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/on-hold", function (req, res) {
  transactionsDB.find(
    { $and: [{ ref_number: { $ne: "" } }, { status: 0 }] },
    function (err, docs) {
      if (docs) res.send(docs);
    },
  );
});

/**
 * GET endpoint: Get customer orders with a status of 0 and an empty reference number.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/customer-orders", function (req, res) {
  transactionsDB.find(
    { $and: [{ customer: { $ne: 0 } }] },
    function (err, docs) {
      if (docs) res.send(docs);
    },
  );
});

/**
 * GET endpoint: Get transactions based on date, user, and till parameters.
 *
 * @param {Object} req request object with query parameters.
 * @param {Object} res response object.
 * @returns {void}
 */
// app.get("/by-date", function (req, res) {
//   let startDate = new Date(req.query.start);
//   let endDate = new Date(req.query.end);

//   if (req.query.user == 0 && req.query.till == 0) {
//     transactionsDB.find(
//       {
//         $and: [
//           { date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } },
//           { status: parseInt(req.query.status) },
//         ],
//       },
//       function (err, docs) {
//         if (docs) res.send(docs);
//       },
//     );
//   }

//   if (req.query.user != 0 && req.query.till == 0) {
//     transactionsDB.find(
//       {
//         $and: [
//           { date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } },
//           { status: parseInt(req.query.status) },
//           { user_id: parseInt(req.query.user) },
//         ],
//       },
//       function (err, docs) {
//         if (docs) res.send(docs);
//       },
//     );
//   }

//   if (req.query.user == 0 && req.query.till != 0) {
//     transactionsDB.find(
//       {
//         $and: [
//           { date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } },
//           { status: parseInt(req.query.status) },
//           { till: parseInt(req.query.till) },
//         ],
//       },
//       function (err, docs) {
//         if (docs) res.send(docs);
//       },
//     );
//   }

//   if (req.query.user != 0 && req.query.till != 0) {
//     transactionsDB.find(
//       {
//         $and: [
//           { date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() } },
//           { status: parseInt(req.query.status) },
//           { till: parseInt(req.query.till) },
//           { user_id: parseInt(req.query.user) },
//         ],
//       },
//       function (err, docs) {
//         if (docs) res.send(docs);
//       },
//     );
//   }
// });

app.get("/by-date", async (req, res) => {
  try {
    const { start, end, user, till, status } = req.query;

    const startDate = new Date(start.toString());
    const endDate = new Date(end.toString());

    const query = {
      date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
      status: Number(status),
    };

    // Add optional filters only if they are not 0
    if (Number(user) !== 0) {
      query.user_id = Number(user);
    }

    if (Number(till) !== 0) {
      query.till = Number(till);
    }

    const docs = await transactionsDB.find(query);
    return res.send(docs);

  } catch (err) {
    return res.status(500).send({
      error: "Database error",
      details: err.message,
    });
  }
});
/**
 * POST endpoint: Create a new transaction.
 *
 * @param {Object} req request object with transaction data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/new", function (req, res) {
  let newTransaction = req.body;

  transactionsDB.insert(newTransaction, function (err, transaction) {
    if (err) {
      console.error(err);
      res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred.",
      });
    } else {
      res.sendStatus(200);

      if (newTransaction.paid >= newTransaction.total) {
        //@ts-expect-error 
        Inventory.decrementInventory(newTransaction.items);
      }
    }
  });
});

/**
 * PUT endpoint: Update an existing transaction.
 *
 * @param {Object} req request object with transaction data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.put("/new", function (req, res) {
  let oderId = req.body._id;
  transactionsDB.update(
    {
      _id: oderId,
    },
    req.body,
    {},
    function (err, numReplaced, order) {
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
 * POST endpoint: Delete a transaction.
 *
 * @param {Object} req request object with transaction data in the body.
 * @param {Object} res response object.
 * @returns {void}
 */
app.post("/delete", function (req, res) {
  let transaction = req.body;
  transactionsDB.remove(
    {
      _id: transaction.order,
    },
    function (err, numRemoved) {
      if (err) {
        console.error(err);
        res.status(500).json({
          error: "Internal Server Error",
          message: "An unexpected error occurred.",
        });
      } else {
        //@ts-expect-error
        Inventory.returnBackInventory(transaction.items)
        res.sendStatus(200);
      }
    },
  );
});

// /**
//  * GET endpoint: Get the most sold products within a date range.
//  * 
//  * @param {Object} req request object with start and end date query parameters.
//  * @param {Object} res response object.
//  * @returns {void}
//  */
// app.get("/most-sold", async function (req, res) {
//     try {
//         const { start, end, limit = 10 } = req.query;

//         // Validate and set default dates if not provided
//         const startDate = start ? new Date(start.toString()) : new Date(0); // Beginning of time
//         const endDate = end ? new Date(end.toString()) : new Date();

//         // Build the query for completed transactions in the date range
//         const query = {
//             date: {
//                 $gte: startDate.toISOString(),
//                 $lte: endDate.toISOString(),
//             },
//             status: 1, // Only completed transactions
//         };

//         // Fetch all matching transactions
//         const transactions = await transactionsDB.find(query);

//         // Aggregate product quantities
//         const productSales = {};
//         //@ts-ignore
//         transactions.forEach(transaction => {
//             if (transaction.items && Array.isArray(transaction.items)) {
//                 transaction.items.forEach(item => {
//                     // Skip if item doesn't have an id
//                     if (!item.id) return;
                    
//                     const productId = item.id.toString();
//                     const quantity = parseFloat(item.quantity) || 0;

//                     if (!productSales[productId]) {
//                         productSales[productId] = {
//                             id: item.id,
//                             product_name: item.product_name || 'Unknown Product',
//                             barcode: item.barcode || '',
//                             total_quantity: 0,
//                             total_revenue: 0,
//                             price: item.price || 0,
//                             cost_price: item.cost_price || 0,
//                         };
//                     }

//                     productSales[productId].total_quantity += quantity;
//                     productSales[productId].total_revenue += quantity * (parseFloat(item.price) || 0);
//                 });
//             }
//         });

//         // Convert to array and sort by total quantity (most sold first)
//         const sortedProducts = Object.values(productSales)
//             .sort((a, b) => b.total_quantity - a.total_quantity)
//             .slice(0, parseInt(limit, 10) || 10); // Limit results

//         // Calculate additional metrics
//         const totalItemsSold = sortedProducts.reduce((sum, p) => sum + p.total_quantity, 0);

//         return res.status(200).json({
//             success: true,
//             period: {
//                 start: startDate.toISOString(),
//                 end: endDate.toISOString(),
//             },
//             total_products_sold: totalItemsSold,
//             data: sortedProducts,
//             limit: parseInt(limit, 10) || 10,
//         });

//     } catch (err) {
//         console.error('Error fetching most sold products:', err);
//         return res.status(500).json({
//             success: false,
//             error: "Database error",
//             details: err.message,
//         });
//     }
// });

// /**
//  * GET endpoint: Get top 20 most sold products for the main dashboard.
//  * 
//  * @param {Object} req request object with optional date range.
//  * @param {Object} res response object.
//  * @returns {void}
//  */
// app.get("/most-sold", async function (req, res) {
//     try {
//         const { start, end } = req.query;

//         // Set date range (default to last 30 days if not specified)
//         const endDate = end ? new Date(end.toString()) : new Date();
//         const startDate = start ? new Date(start.toString()) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

//         // Query for completed transactions in date range
//         const query = {
//             date: {
//                 $gte: startDate.toISOString(),
//                 $lte: endDate.toISOString(),
//             },
//             status: 1, // Only completed transactions
//         };

//         // Fetch transactions
//         const transactions = await transactionsDB.find(query);

//         // Aggregate product quantities
//         const productSales = {};

//         transactions.forEach(transaction => {
//             if (transaction.items && Array.isArray(transaction.items)) {
//                 transaction.items.forEach(item => {
//                     if (!item.id) return;
                    
//                     const productId = item.id.toString();
//                     const quantity = parseFloat(item.quantity) || 0;

//                     if (!productSales[productId]) {
//                         productSales[productId] = {
//                             id: item.id,
//                             name: item.product_name || 'Unknown',
//                             barcode: item.barcode || '',
//                             quantity: 0,
//                             price: parseFloat(item.price) || 0,
//                         };
//                     }

//                     productSales[productId].quantity += quantity;
//                 });
//             }
//         });

//         // Convert to array, sort by quantity, and get top 20
//         const topProducts = Object.values(productSales)
//             .sort((a, b) => b.quantity - a.quantity)
//             .slice(0, 20);

//         // Get product details
//         const productsList = [];
//         for (const prod of topProducts) {
//             const prodInfo = await inventoryDB.findOneAsync({
//                 _id: prod.id
//             });
//             productsList.push(prodInfo);
//         }



//         return res.status(200).json({
//             success: true,
//             data: productsList,
//             period: {
//                 from: startDate.toISOString(),
//                 to: endDate.toISOString(),
//             }
//         });

//     } catch (err) {
//         console.error('Error fetching top sold products:', err);
//         return res.status(500).json({
//             success: false,
//             error: "Failed to fetch top products",
//         });
//     }
// });

/**
 * GET endpoint: Get details of a specific transaction by transaction ID.
 *
 * @param {Object} req request object with transaction ID as a parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/:transactionId", function (req, res) {
  transactionsDB.find({ _id: req.params.transactionId }, function (err, doc) {
    if (doc) res.send(doc[0]);
  });
});
