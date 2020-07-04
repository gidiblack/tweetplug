const express = require('express');
const authController = require('../controllers/authController');
const userContoller = require('../controllers/userControlle');
const adminController = require('../controllers/adminController');

const router = express.Router();
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/forgotpassword').post(authController.forgotPassword);
router.route('/resetpassword/:token').patch(authController.resetPassword);
//router.use(authController.authenticate);
router.route('/links/:userId').post(userContoller.addLink);
router.route('/withdrawal/:userId').post(userContoller.withdrawalRequest);
router.route('/:userId').patch(userContoller.updateMe);
router.route('/updatepassword').patch(authController.updateMyPassword);

module.exports = router;
