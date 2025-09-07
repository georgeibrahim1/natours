const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

// same as done in app.js !!
// tour/37497/reviews
// the {mergeParams: true} in reviewRoutes makes the reviewRouter method read tourId
router.use('/:tourId/reviews' , reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect,authController.restrictTo('admin', 'lead-guide' , 'guide'),tourController.getMonthlyPlan);

// can be tours-ditance?distnace=233&ceneter=-1,45&unit=mi
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithIn);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDitances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,authController.restrictTo('admin', 'lead-guide'),tourController.updateTour)
  .delete(authController.protect,authController.restrictTo('admin', 'lead-guide'),tourController.deleteTour);


module.exports = router;
