const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');

router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected route accessed',
    userId: req.userId
  });
});

module.exports = router;
