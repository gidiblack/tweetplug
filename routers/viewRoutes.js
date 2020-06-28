const express = require('express');
const viewController = require('../controllers/viewController');
const userController = require('../controllers/userControlle');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

const router = express.Router();
router.route('/').get(viewController.getHome);
router.route('/login').get(viewController.getLogin);
router.route('/register').get(viewController.getRegister);
router.route('/faq').get(viewController.getFAQ);

module.exports = router;
