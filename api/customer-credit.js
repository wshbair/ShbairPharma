const app = require('express')();
const bodyParser = require('body-parser');
const validator = require('validator');

app.use(bodyParser.json());
module.exports = app;

const { transactionsDB } = require('./db');
const { getCreditOrderStatus, calculateDueAmount, matchesOrderId } = require('./customer-credit-utils');

function esc(val) {
  return validator.escape(String(val == null ? '' : val));
}

app.get('/orders', function (req, res) {
  transactionsDB.find({ customer: { $ne: 0 }, order_type: 1 }, function (err, docs) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const enriched = docs.map(function (order) {
      const total = Number(order.total) || 0;
      const paid = Number(order.paidAmount || order.paid || 0) || 0;
      return Object.assign({}, order, {
        paymentStatus: getCreditOrderStatus(paid, total),
        dueAmount: calculateDueAmount(total, paid),
      });
    });

    res.send(enriched);
  });
});

app.get('/orders/:orderId', function (req, res) {
  transactionsDB.find({}, function (err, docs) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const order = docs.find(function (doc) {
      return matchesOrderId(doc, req.params.orderId);
    });

    if (!order) return res.status(404).send('Order not found');

    const total = Number(order.total) || 0;
    const paid = Number(order.paidAmount || order.paid || 0) || 0;
    res.send(Object.assign({}, order, {
      paymentStatus: getCreditOrderStatus(paid, total),
      dueAmount: calculateDueAmount(total, paid),
    }));
  });
});

app.post('/orders', function (req, res) {
  const order = {
    _id: req.body._id || `CRED-${Date.now()}`,
    order: req.body.order || `CRED-${Date.now()}`,
    ref_number: esc(req.body.ref_number || ''),
    discount: Number(req.body.discount) || 0,
    customer: req.body.customer,
    status: Number(req.body.status) || 0,
    subtotal: Number(req.body.subtotal) || 0,
    totalCost: Number(req.body.totalCost) || 0,
    profit: Number(req.body.profit) || 0,
    tax: Number(req.body.tax) || 0,
    order_type: 2,
    items: req.body.items || [],
    date: req.body.date || new Date().toISOString(),
    payment_type: esc(req.body.payment_type || 'Credit'),
    payment_info: esc(req.body.payment_info || ''),
    total: Number(req.body.total) || 0,
    paid: Number(req.body.paid) || 0,
    paidAmount: Number(req.body.paidAmount) || Number(req.body.paid) || 0,
    change: Number(req.body.change) || 0,
    till: esc(req.body.till || ''),
    mac: esc(req.body.mac || ''),
    user: esc(req.body.user || ''),
    user_id: req.body.user_id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  transactionsDB.insert(order, function (err, newOrder) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.status(200).json(newOrder);
  });
});

app.post('/orders/:orderId/payments', function (req, res) {
  const orderId = req.params.orderId;
  const paymentAmount = Number(req.body.amount) || 0;
  const paymentDate = esc(req.body.paymentDate || new Date().toISOString());
  const paymentMethod = esc(req.body.paymentMethod || 'Cash');
  const reference = esc(req.body.reference || '');
  const notes = esc(req.body.notes || '');
  console.log(`Processing payment for order ${orderId}: amount=${paymentAmount}, date=${paymentDate}, method=${paymentMethod}, reference=${reference}, notes=${notes}`);
  if (paymentAmount <= 0) {
    return res.status(400).json({ error: 'Bad Request', message: 'Payment amount must be greater than zero.' });
  }

  transactionsDB.find({}, function (err, docs) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const order = docs.find(function (doc) {
      return matchesOrderId(doc, orderId);
    });

    if (!order) return res.status(404).send('Order not found');

    const currentPaid = Number(order.paidAmount || order.paid || 0) || 0;
    const totalAmount = Number(order.total) || 0;
    const nextPaid = currentPaid + paymentAmount;
    const cappedPaid = Math.min(nextPaid, totalAmount);
    const dueAmount = Math.max(0, totalAmount - cappedPaid);

    transactionsDB.update(
      { _id: order._id },
      {
        $set: {
          paidAmount: cappedPaid,
          paid: cappedPaid,
          status: getCreditOrderStatus(cappedPaid, totalAmount) == 'paid' ? 1: 0,
          dueAmount: dueAmount,
          paymentStatus: getCreditOrderStatus(cappedPaid, totalAmount),
          payment_type: paymentMethod,
          paymentHistory: (order.paymentHistory || []).concat([{
            paymentId: `PAY-${Date.now()}`,
            amount: paymentAmount,
            paymentDate: paymentDate,
            paymentMethod: paymentMethod,
            reference: reference,
            notes: notes,
          }]),
          updatedAt: new Date().toISOString(),
        },
      },
      {},
      function (updateErr) {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
        transactionsDB.findOne({ _id: order._id }, function (findErr, updatedOrder) {
          if (findErr) {
            console.error(findErr);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          res.status(200).json(updatedOrder);
        });
      },
    );
  });
});

app.get('/reports', function (req, res) {
  transactionsDB.find({ customer: { $ne: 0 }, order_type: 2 }, function (err, docs) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const paid = docs.filter(function (order) { return (order.paymentStatus || '').toLowerCase() === 'paid'; });
    const partial = docs.filter(function (order) { return (order.paymentStatus || '').toLowerCase() === 'partial'; });
    const pending = docs.filter(function (order) { return (order.paymentStatus || '').toLowerCase() === 'pending'; });

    const paidTotal = paid.reduce(function (sum, order) { return sum + (Number(order.total) || 0); }, 0);
    const dueTotal = docs.reduce(function (sum, order) { return sum + (Number(order.dueAmount) || 0); }, 0);
    const partialTotal = partial.reduce(function (sum, order) { return sum + (Number(order.dueAmount) || 0); }, 0);

    res.send({
      totalOrders: docs.length,
      paidOrders: paid.length,
      partialOrders: partial.length,
      pendingOrders: pending.length,
      paidTotal: paidTotal,
      dueTotal: dueTotal,
      partialTotal: partialTotal,
      orders: docs,
    });
  });
});
