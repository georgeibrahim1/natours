const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.post('/signup' , authController.signup);
router.post('/login' , authController.login);

router.post('/forgetPassword' , authController.forgotPassword);

router.patch('/resetPassword/:token' , authController.resetPassword);

// add to all next middleware and controllers
router.use(authController.protect);

router.patch('/updateMyPassword',authController.updatePassword);

router.get('/me',userController.getMe,userController.getUser);

router.patch('/updateMe',userController.updateMe);

// not delete excatly but deactivate (it is just a fucking method verb)
router.delete('/deleteMe',userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
