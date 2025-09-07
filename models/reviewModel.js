const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true,"Review can't be empty!"]
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: { // parent refrence
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true,'Review must belong to a tour']
    },
    user: { // parent refrence
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true,'Review must belong to a user']
    }
}, 
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// prevent duplicate reviews, give error if you tried to add more than one review
reviewSchema.index({tour:1 , user:1} , {
    unique: true
});


reviewSchema.pre(/^find/ , async function(next) {

    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    this.populate({
        path: 'user',
        select: 'name photo'
    })

    next();
});

// method attached to model itself not document like ##Schema.methods.bewFunction
// in this function we need to do this, as we need to aggregate on the model, as the aggregate works only in model
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1},
                avgRating : {$avg:'$rating'}
            }
        }
    ]);

    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId , {
            ratingsQuantity: stats[0].nRating ,
            ratingAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId , {
            ratingsQuantity: 0,
            ratingAverage: 4.5
        });

    }
};

// after the review is saved, we need to calc not in pre
reviewSchema.post('save' , function() {
    
    // constructor points to the model of document (this)
    this.constructor.calcAverageRatings(this.tour);
    // we can't use this as Review is not yet declared
    // Review.calcAverageRatings(this.tour);
});

// handle delete and update review!!
// we need to get acccess to the model to call calcAverageRatings()
// why not all in pre? the document is not updated in pre
reviewSchema.pre(/^findOneAnd/ , async function(next) {
    // this = query
    this.r = await this.findOne; // r is the document, add it to query
    next();
});

// why not all in post?  this.findOne() inside post, it won’t work, because the query already executed.
reviewSchema.post(/^findOneAnd/ , async function(next) {
    await this.r.constructor.calcAverageRatings(this.r.tour); // have access to query as you are in query middleware
});


const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;