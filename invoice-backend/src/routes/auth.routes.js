const router = require('express').Router();

const c = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.post('/login', c.login);
router.post('/users', auth, admin, c.createUser);
router.get('/users', auth, admin, c.getUsers);
router.delete('/users/:id', auth, admin, c.deleteUser);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password', c.resetPassword);

module.exports = router;
