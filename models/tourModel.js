const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel'); // for the embadding guides and its pre save middleware

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.6666 -> 46.666 -> 47 -> 4.7 
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // Embadded Schema (Object)!!!
      // GeoJSON
      type : {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number], //Type!!
      address: String,
      description: String,
    },
    locations: [ // This makes Array of another Embadded (Objects) data !!
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
      address: String,
      description: String,
      day: Number
      }
    ],
    // guides: client sends here UserIds , in the pre save middleware, we add the real documents (Embadding not refrence!!)
    guides: [ // child refrence (pass the id in the clinet side!!)
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// index for frequently read fields not for write
// delete them manually in database if not used
// compound index
tourSchema.index({price: 1 , ratingsAverage: -1 }); // 1 ascending, -1 is descending
// single index
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// to solve the problem arising from using parent refrence, which is the parent don't know its childs, so we keep an array of childs in virtaul prperty and use when need
// virtaul populate
tourSchema.virtual('reviews' , {
  ref: 'Review', // model of refrence
  foreignField: 'tour', // ref in child
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// See guides above too !!
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id=> User.findById(id));

//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// to show the guides objects in every find## method
tourSchema.pre(/^find/, function(next) {

  this.populate({
    path: 'guide',
    select: '-__v -passwordChangedAt'
  });

  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
