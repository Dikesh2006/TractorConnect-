const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const expenseService = require('../services/expenseService');

/**
 * @route   GET /api/v1/expenses
 * @desc    Get expenses with filtering and pagination
 * @access  Private (Admin or Owner)
 */
const getAllExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.getAllExpenses(req.query, req.user);
  return sendSuccess(res, result, 'Expenses retrieved');
});

/**
 * @route   POST /api/v1/expenses
 * @desc    Add a new expense
 * @access  Private (Admin or Owner)
 */
const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body, req.user);
  return sendSuccess(res, { expense }, 'Expense logged successfully', 201);
});

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update an expense
 * @access  Private (Admin or Owner)
 */
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.body, req.user);
  return sendSuccess(res, { expense }, 'Expense updated successfully');
});

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Soft-delete an expense
 * @access  Private (Admin or Owner)
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.deleteExpense(req.params.id, req.user);
  return sendSuccess(res, { expense }, 'Expense deleted successfully');
});

module.exports = {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};

