const express = require('express');
const router = express.Router();
const {
  getCreditBalance,
  useCreditsForAction,
  buyCredits,getCreditPlans
} = require('../controllers/creditController');

router.get('/balance/:userId', getCreditBalance);
router.post('/use', useCreditsForAction);
router.post('/buy', buyCredits);
router.get('/plans', getCreditPlans);

module.exports = router;