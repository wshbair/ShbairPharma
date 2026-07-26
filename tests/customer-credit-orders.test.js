const { getCreditOrderStatus, calculateDueAmount, matchesOrderId } = require('../api/customer-credit-utils');

describe('customer credit order helpers', () => {
  test('marks fully paid orders as paid', () => {
    expect(getCreditOrderStatus(100, 100)).toBe('paid');
    expect(calculateDueAmount(100, 100)).toBe(0);
  });

  test('marks partially paid orders as partial', () => {
    expect(getCreditOrderStatus(60, 100)).toBe('partial');
    expect(calculateDueAmount(100, 60)).toBe(40);
  });

  test('marks unpaid orders as pending', () => {
    expect(getCreditOrderStatus(0, 100)).toBe('pending');
    expect(calculateDueAmount(100, 0)).toBe(100);
  });

  test('matches orders by ID even when stored as a different primitive type', () => {
    expect(matchesOrderId({ _id: 1783146380 }, '1783146380')).toBe(true);
    expect(matchesOrderId({ _id: '1783146380' }, 1783146380)).toBe(true);
    expect(matchesOrderId({ _id: 123 }, '456')).toBe(false);
  });
});
