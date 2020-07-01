const express = require('express');
const viewController = require('../controllers/viewController');
const userController = require('../controllers/userControlle');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const intervaleController = require('../controllers/intervalControllers');

const router = express.Router();

router.use(authController.isLoggedIn);

router.route('/').get(intervaleController.clearTask, viewController.getHome);
router.route('/login').get(viewController.getLogin);
router.route('/register').get(viewController.getRegister);
router.route('/faq').get(viewController.getFAQ);
router.route('/admin').get(viewController.getAdminLogin);

router
  .route('/user/dashboard')
  .get(authController.authenticate, viewController.getUserDashboard);

router.route('/user/links/new').post(viewController.userSubmitLinks);

//admin routes
//admin dashboard
router
  .route('/admin/dashboard')
  .get(
    authController.authenticate,
    authController.restrictTo('admin'),
    viewController.getAdminDashboard
  );

//route for admin to set a new task (POST)
router
  .route('/admin/newtask')
  .post(
    authController.authenticate,
    authController.restrictTo('admin'),
    viewController.setTask
  );

//router to get user details page(GET)
router
  .route('/admin/user/:userId')
  .get(
    authController.authenticate,
    authController.restrictTo('admin'),
    viewController.getIndividualPageAdmin
  );

//router to set the status of user withdrawal request
router
  .route('/admin/withdrawals/setstatus')
  .patch(
    authController.authenticate,
    authController.restrictTo('admin'),
    viewController.setWithdrawalStatus
  );

//router to set the status of user submitted link
router
  .route('/admin/links/setstatus')
  .patch(
    authController.authenticate,
    authController.restrictTo('admin'),
    viewController.setLinkStatus
  );

//router to set the status of user
router
  .route('/admin/user/status')
  .patch(
    authController.authenticate,
    authController.restrictTo('admin'),
    viewController.setUserStatus
  );

//export router to app
module.exports = router;
