const express = require('express');
const router = express.Router();

const expenseController = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createExpenseSchema, updateExpenseSchema } = require('../validators/expenseValidators');

// All expense routes are for Admin and Tractor Owners
router.use(authenticate, authorize('admin', 'owner'));

router.get('/', expenseController.getAllExpenses);
router.post('/', validate(createExpenseSchema), expenseController.createExpense);
router.put('/:id', validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

