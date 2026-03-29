const router = require('express').Router();
const { getRates } = require('../utils/currency.util');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/rates', authenticate, async (req, res) => {
  const base = req.query.base || 'USD';
  const rates = await getRates(base);
  res.json({ base, rates });
});

module.exports = router;
