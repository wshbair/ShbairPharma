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
app.shouldDecrementInventoryForTransaction = function (transaction) {
  if (!transaction || !Array.isArray(transaction.items) || transaction.items.length === 0) {
    return false;
  }

  const status = Number(transaction.status ?? 0);
  const paid = Number(transaction.paid ?? 0);
  const total = Number(transaction.total ?? 0);

  if (status === 1) {
    return true;
  }

  return Number.isFinite(paid) && Number.isFinite(total) && paid >= total;
};

app.getProductSales = function (transactions, productId) {
  return transactions
    .filter(function (transaction) {
      return app.shouldDecrementInventoryForTransaction(transaction);
    })
    .map(function (transaction) {
      const matchedItems = transaction.items.filter(function (item) {
        return Number(item.id) === Number(productId);
      });
      return Object.assign({}, transaction, { matchedItems: matchedItems });
    })
    .filter(function (transaction) {
      return transaction.matchedItems.length > 0;
    })
    .sort(function (a, b) {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
};

app.getProductSalesPage = function (sales, requestedSkip, requestedLimit) {
  const parsedLimit = Number.parseInt(requestedLimit, 10) || 25;
  const limit = Math.min(Math.max(parsedLimit, 1), 100);
  const parsedSkip = Number.parseInt(requestedSkip, 10) || 0;
  const skip = Math.max(parsedSkip, 0);
  return {
    records: sales.slice(skip, skip + limit),
    total: sales.length,
    limit: limit,
    skip: skip,
  };
};

app.get("/sales-by-product/:productId", function (req, res) {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId) || productId <= 0) {
    return res.status(400).json({ error: "Valid product ID required" });
  }

  transactionsDB.find({}, function (err, transactions) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const sales = app.getProductSales(transactions, productId);
    res.json(app.getProductSalesPage(sales, req.query.skip, req.query.limit));
  });
});

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

      if (app.shouldDecrementInventoryForTransaction(newTransaction)) {
        //@ts-expect-error
        Inventory.decrementInventory(newTransaction.items, newTransaction);
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
        Inventory.returnBackInventory(transaction.items, transaction)
        res.sendStatus(200);
      }
    },
  );
});

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
