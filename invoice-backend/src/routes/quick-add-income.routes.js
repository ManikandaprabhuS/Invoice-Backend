const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const quickAddIncomeCtrl = require('../controllers/quick-add-income.controller');

router.post('/', auth, quickAddIncomeCtrl.createQuickAddIncome);
router.get('/', auth, quickAddIncomeCtrl.getQuickAddIncomes);

module.exports = router;
