process.env.APPNAME = 'ShbairPharma';
process.env.APPDATA = '/tmp/shbairpharma-stockmovment-test';

const stockmovment = require('../api/stockmovment');

describe('stock movement records', () => {
  test('captures quantity deltas and changed product fields', () => {
    const record = stockmovment.createMovementRecord({
      action: 'restock',
      source: '/restock/12',
      before: { _id: 12, name: 'Medicine', quantity: 4, price: '10' },
      after: { _id: 12, name: 'Medicine', quantity: 7, price: '11' },
      timestamp: '2026-10-03T12:00:00.000Z',
    });

    expect(record).toMatchObject({
      action: 'restock',
      timestamp: '2026-10-03T12:00:00.000Z',
      productId: 12,
      productName: 'Medicine',
      quantityBefore: 4,
      quantityAfter: 7,
      quantityChange: 3,
      source: '/restock/12',
      changes: {
        quantity: { from: 4, to: 7 },
        price: { from: '10', to: '11' },
      },
    });
  });

  test('captures newly added product stock as an increase', () => {
    const record = stockmovment.createMovementRecord({
      action: 'product_added',
      after: { _id: 15, name: 'New medicine', quantity: 5 },
    });

    expect(record.quantityBefore).toBeNull();
    expect(record.quantityAfter).toBe(5);
    expect(record.quantityChange).toBe(5);
    expect(record.changes.quantity).toEqual({ to: 5 });
  });

  test('persists movement records to the dedicated datastore', (done) => {
    stockmovment.recordMovement({
      action: 'product_deleted',
      before: { _id: 19, name: 'Removed medicine', quantity: 2 },
      source: '/product/19',
    }, (err, record) => {
      expect(err).toBeNull();
      expect(record.quantityChange).toBe(-2);
      done();
    });
  });
});