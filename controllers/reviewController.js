const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factor = require('./handlerFactory');

exports.setTourUserIds = (req,res,next) => {
    // allow nested routes
    if(!req.body.tour) req.params.tourId;
    if(!req.body.user) req.user.id; // from protect
    next();
}

exports.getReviews = factor.getAll(Review);
exports.getReview = factor.getOne(Review);
exports.createReview = factor.createOne(Review);
exports.deleteReview = factor.deleteOne(Review);
exports.updateReview = factor.updateOne(Review);