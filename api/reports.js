let app = require("express")();
let bodyParser = require("body-parser");

app.use(bodyParser.json());
module.exports = app;

const { transactionsDB } = require("./db");

/**
 * GET endpoint: Get the welcome message for the Reports API.
 *
 * @param {Object} req request object.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/", function (req, res) {
  res.send("Reports API");
});

/**
 * GET endpoint: Get daily sales report for a specific date.
 * Calculates total sales, total cost, and profit.
 *
 * @param {Object} req request object with date query parameter (YYYY-MM-DD format).
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/daily", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Date parameter is required (format: YYYY-MM-DD)",
      });
    }

    // Parse the date and create start/end timestamps for the entire day
    const dateObj = new Date(date);
    const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
    const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

    // Query transactions for the entire day
    const transactions = await transactionsDB.find({
      date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
      status: 1, // Only completed transactions
    });
    // @ts-ignore
    if(!transactions || !Array.isArray(transactions)) {
      return res.status(404).json({
        error: "Not Found",
        message: "No transactions found for the specified date",
      });
    }

    // Calculate metrics
    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;

    if (Array.isArray(transactions)) {
      transactions.forEach((transaction) => {
        // Add to total sales
        totalSales += transaction.total || 0;

        // Calculate cost from items
        if (transaction.items && Array.isArray(transaction.items)) {
          transaction.items.forEach((item) => {
            totalCost += item.totalCost;
            totalProfit += item.totalProfit;
          });
        }
      });
    }


    return res.json({
      date: date,
      transactionCount: transactions.length,
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      profit: parseFloat(totalProfit.toFixed(2)),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to generate report",
      details: err.message,
    });
  }
});

/**
 * GET endpoint: Get sales report for a date range.
 * Useful for weekly or monthly reports.
 *
 * @param {Object} req request object with start and end query parameters.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/range", async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Both start and end date parameters are required (format: YYYY-MM-DD)",
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Adjust end date to include entire last day
    endDate.setHours(23, 59, 59, 999);

    const transactions = await transactionsDB.find({
      date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
      status: 1,
    });

    let totalSales = 0;
    let totalCost = 0;

    if (Array.isArray(transactions)) {
      transactions.forEach((transaction) => {
        totalSales += transaction.total || 0;

        if (transaction.items && Array.isArray(transaction.items)) {
          transaction.items.forEach((item) => {
            const itemCost = (item.cost || 0) * (item.quantity || 1);
            totalCost += itemCost;
          });
        }
      });
    }

    const profit = totalSales - totalCost;

    return res.json({
      startDate: start,
      endDate: end,
      transactionCount: transactions.length,
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to generate report",
      details: err.message,
    });
  }
});

/**
 * GET endpoint: Get sales histogram data for a specific product over the past year.
 * Groups sales data by month to show sales trends.
 *
 * @param {Object} req request object with productId query parameter.
 * @param {Object} res response object.
 * @returns {void}
 */
app.get("/product-sales-histogram", async (req, res) => {
  try {
    const { productId, year } = req.query;

    if (!productId || !year) {
      return res.status(400).json({
        error: "Bad Request",
        message: "productId and year parameters are required",
      });
    }

    // Calculate date range for the past year
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(Number(year), 0);
    endDate.setFullYear(Number(year), 11);


    // Query transactions containing the product from the past year
    const transactions = await transactionsDB.find({
      date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
      status: 1, // Only completed transactions
      "items.id": Number(productId),
    });
    //console.log(transactions);
    // Initialize histogram data for all months in the past year
    const histogramData = [];
    const monthMap = {};
    let productName = "";
    // Create entries for all months
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(Number(year), month, 1);
      const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
      monthMap[yearMonth] = {
        month: yearMonth,
        monthName: monthDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        }),
        sales: 0,
        quantity: 0,
        transactionCount: 0,
      };
    }


    // Process transactions and aggregate sales data by month
    if (Array.isArray(transactions)) {
      transactions.forEach((transaction) => {
        const txDate = new Date(transaction.date);
        const yearMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
        if (monthMap[yearMonth]) {
          // Find the product in the transaction items
          const productItems = transaction.items.filter((item) => item.id === Number(productId));
          productItems.forEach((item) => {
            monthMap[yearMonth].sales += Number(item.price) || 0;
            monthMap[yearMonth].quantity += Number(item.quantity) || 0;
            productName = item.product_name;
          });

          monthMap[yearMonth].transactionCount += 1;
        }
      });
    }
    // Convert to array and round values
    Object.values(monthMap).forEach((month) => {
      month.sales = parseFloat(month.sales.toFixed(2));
      histogramData.push(month);
    });
    return res.json({
      productId: productId,
      productName: productName,
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      histogramData: histogramData,
      totalSalesForPeriod: parseFloat(
        histogramData.reduce((sum, month) => sum + month.sales, 0).toFixed(2)
      ),
      totalQuantity: histogramData.reduce((sum, month) => sum + month.quantity, 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Histogram generation error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to generate histogram data",
      details: err.message,
    });
  }
});
