const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const userCtrl = require('../controllers/user.controller');

router.get('/users', auth, userCtrl.getUsers);
router.get('/users/lookup', auth, userCtrl.findUserByBusinessDetails);
router.get('/users/:id', auth, userCtrl.getUserById);
router.put('/users/:id', auth, userCtrl.updateUser);
router.delete('/users/:id', auth, userCtrl.deleteUser);

module.exports = router;
