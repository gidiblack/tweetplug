const express = require('express');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

const router = express.Router();
router.use(authController.authenticate, authController.restrictTo('admin'));

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

router.route('/task').post(adminController.setTask);
router.route('/task/all').get(adminController.getTasks);

router.route('/task/deactivated').get(adminController.getDeactivatedTasks);
router
  .route('/task/:taskId')
  .get(adminController.getSingleTask)
  .delete(adminController.deleteTask);

router.route('/task/:taskId/deactivate').patch(adminController.deactivateTask);
router.route('/links/all').get(adminController.getAllLinks);
module.exports = router;
