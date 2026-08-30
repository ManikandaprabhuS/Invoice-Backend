const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const serviceCtrl = require('../controllers/service.controller');

router.post('/services', auth, serviceCtrl.createService);
router.get('/services', auth, serviceCtrl.getServices);
router.put('/services/:id', auth, serviceCtrl.updateService);
router.delete('/services/:id', auth, serviceCtrl.deleteService);

module.exports = router;
