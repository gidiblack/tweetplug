const express = require('express');
const authController = require('../controllers/authController');
const userContoller = require('../controllers/userControlle');

const router = express.Router();
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/links/:userId').post(userContoller.addLink);
router.route('/withdrawal/:userId').post(userContoller.withdrawalRequest);
router.route('/:userId').patch(userContoller.updateMe);

module.exports = router;
