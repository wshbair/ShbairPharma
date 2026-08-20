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
});
