const Expense = require('../models/Expense');
const { round2Decimals } = require('../utils/formatters');

/**
 * Get all expenses with filters and pagination (scoped to owner if role === 'owner')
 */
const getAllExpenses = async (
  { page = 1, limit = 20, category = '', tractor = '', ownerId = '', startDate = '', endDate = '' },
  currentUser = null
) => {
  const query = { isDeleted: false };

  if (currentUser && currentUser.role === 'owner') {
    query.tractorOwner = currentUser._id;
  } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
    query.tractorOwner = ownerId;
  }

  if (category) query.category = category;
  if (tractor) query.tractor = tractor;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [expenses, total, summary] = await Promise.all([
    Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('tractor', 'name registrationNumber')
      .populate('recordedBy', 'name')
      .lean(),
    Expense.countDocuments(query),
    Expense.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ])
  ]);

  return {
    expenses,
    totalExpensesAmount: round2Decimals(summary[0]?.totalAmount || 0),
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Create an expense
 */
const createExpense = async (data, currentUser) => {
  const targetOwnerId =
    currentUser.role === 'owner'
      ? currentUser._id
      : data.ownerId || currentUser._id;

  const expense = new Expense({
    category: data.category,
    amount: round2Decimals(data.amount),
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description.trim(),
    tractorOwner: targetOwnerId,
    tractor: data.tractorId || null,
    vendor: data.vendor?.trim() || '',
    paymentMethod: data.paymentMethod || 'cash',
    receiptNote: data.receiptNote?.trim() || '',
    recordedBy: currentUser._id
  });

  await expense.save();
  return expense.populate('tractor', 'name registrationNumber');
};

/**
 * Update an expense
 */
const updateExpense = async (id, data, currentUser = null) => {
  const expense = await Expense.findOne({ _id: id, isDeleted: false });
  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser &&
    currentUser.role === 'owner' &&
    expense.tractorOwner &&
    !expense.tractorOwner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only modify your own expenses.');
    error.statusCode = 403;
    throw error;
  }

  if (data.category !== undefined) expense.category = data.category;
  if (data.amount !== undefined) expense.amount = round2Decimals(data.amount);
  if (data.date !== undefined) expense.date = new Date(data.date);
  if (data.description !== undefined) expense.description = data.description.trim();
  if (data.tractorId !== undefined) expense.tractor = data.tractorId || null;
  if (data.vendor !== undefined) expense.vendor = data.vendor.trim();
  if (data.paymentMethod !== undefined) expense.paymentMethod = data.paymentMethod;
  if (data.receiptNote !== undefined) expense.receiptNote = data.receiptNote.trim();

  await expense.save();
  return expense.populate('tractor', 'name registrationNumber');
};

/**
 * Soft delete an expense
 */
const deleteExpense = async (id, currentUser = null) => {
  const expense = await Expense.findOne({ _id: id, isDeleted: false });
  if (!expense) {
    const error = new Error('Expense not found or already deleted');
    error.statusCode = 404;
    throw error;
  }

  if (
    currentUser &&
    currentUser.role === 'owner' &&
    expense.tractorOwner &&
    !expense.tractorOwner.equals(currentUser._id)
  ) {
    const error = new Error('Access denied. You can only delete your own expenses.');
    error.statusCode = 403;
    throw error;
  }

  expense.isDeleted = true;
  await expense.save();
  return expense;
};

module.exports = {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};

