const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/invoice.controller');

router.post('/invoices', auth, ctrl.createInvoice);
router.get('/invoices', auth, ctrl.getInvoices);
router.put('/invoices/:id', auth, ctrl.updateInvoice);
router.delete('/invoices/:id', auth, ctrl.deleteInvoice);

module.exports = router;
