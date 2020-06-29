const express = require('express');
const viewController = require('../controllers/viewController');
const userController = require('../controllers/userControlle');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);

router.route('/').get(viewController.getHome);
router.route('/login').get(viewController.getLogin);
router.route('/register').get(viewController.getRegister);
router.route('/faq').get(viewController.getFAQ);
router.route('/admin').get(viewController.getAdminLogin);

//admin dashboard
router
  .route('/admin/dashboard')
  .get(
    authController.authenticate,
    authController.restrictTo('admin'),
    viewController.getAdminDashboard
  );
router
  .route('/user/dashboard')
  .get(authController.authenticate, viewController.getUserDashboard);

module.exports = router;
