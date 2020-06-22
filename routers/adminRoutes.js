const express = require('express');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.route('/users').get(adminController.getUsers);
router.route('/withdrawals').get(adminController.getwithdrawals);
router.route('/:userId').get(adminController.getUser);
router
  .route('/withdrawals/:withdrawalId/approve')
  .patch(adminController.approveWithdrawal);

router
  .route('/withdrawals/:withdrawalId/reject')
  .patch(adminController.rejectWithdrawal);

router.route('/:userId/suspend').patch(adminController.suspendUser);
module.exports = router;
