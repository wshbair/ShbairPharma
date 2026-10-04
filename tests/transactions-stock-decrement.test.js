process.env.APPNAME = 'ShbairPharma';
process.env.APPDATA = '/tmp/shbairpharma-test';

const transactionsApp = require('../api/transactions');

describe('transactions stock decrement guard', () => {
  test('decrements only for completed sales', () => {
    expect(transactionsApp.shouldDecrementInventoryForTransaction({
      status: 1,
      paid: 100,
      total: 100,
      items: [{ id: 10, quantity: 2 }],
    })).toBe(true);

    expect(transactionsApp.shouldDecrementInventoryForTransaction({
      status: 0,
      paid: 0,
      total: 100,
      items: [{ id: 10, quantity: 2 }],
    })).toBe(false);

    expect(transactionsApp.shouldDecrementInventoryForTransaction({
      status: 0,
      paid: 100,
      total: 100,
      items: [{ id: 10, quantity: 2 }],
    })).toBe(true);

    expect(transactionsApp.shouldDecrementInventoryForTransaction({
      status: 1,
      paid: 50,
      total: 100,
      items: [{ id: 10, quantity: 2 }],
    })).toBe(true);
  });

  test('finds completed sales containing the selected product', () => {
    const sales = transactionsApp.getProductSales([
      {
        _id: 1,
        status: 1,
        date: '2026-10-03T10:00:00.000Z',
        items: [{ id: 10, quantity: 2 }, { id: 11, quantity: 1 }],
      },
      {
        _id: 2,
        status: 0,
        paid: 0,
        total: 50,
        date: '2026-10-04T10:00:00.000Z',
        items: [{ id: 10, quantity: 4 }],
      },
    ], '10');

    expect(sales).toHaveLength(1);
    expect(sales[0]._id).toBe(1);
    expect(sales[0].items).toEqual([{ id: 10, quantity: 2 }, { id: 11, quantity: 1 }]);
    expect(sales[0].matchedItems).toEqual([{ id: 10, quantity: 2 }]);
  });

  test('paginates product sales while preserving the total count', () => {
    const sales = Array.from({ length: 30 }, (_, index) => ({ order: index + 1 }));
    const page = transactionsApp.getProductSalesPage(sales, '25', '25');

    expect(page.total).toBe(30);
    expect(page.records).toHaveLength(5);
    expect(page.records[0].order).toBe(26);
  });
});
