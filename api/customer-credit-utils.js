function getCreditOrderStatus(paidAmount, totalAmount) {
  const paid = Number(paidAmount) || 0;
  const total = Number(totalAmount) || 0;

  if (total <= 0) return 'pending';
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'pending';
}

function calculateDueAmount(totalAmount, paidAmount) {
  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  return Math.max(0, total - paid);
}

function matchesOrderId(order, candidateId) {
  if (!order || candidateId == null || candidateId === '') return false;
  const storedId = order && order._id;
  return String(storedId) === String(candidateId);
}

module.exports = {
  getCreditOrderStatus,
  calculateDueAmount,
  matchesOrderId,
};
