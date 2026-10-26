const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getSales, logSale } = require('../controllers/saleController');

// All sale routes require authentication
router.use(protect);

router.route('/')
  .get(getSales)
  .post(logSale);

module.exports = router;
