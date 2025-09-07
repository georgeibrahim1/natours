const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// app.set('view engine', 'pug');
// app.set('views' , path.join(__dirname, 'views'));

// Serving static files
// app.use(express.static(path.join(__dirname , 'public')));

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body to req.body
// you can inside {limit: '10kb'}
app.use(express.json());

// best place to clean data after edit body
// Data sanitization against noSql query injection
app.use(mongoSanitize()); // delete $
// Data sanitization against XSS
app.use(xss()); // delete js or turn codes to wired stuff

// parameter pollution filter (use the last one if duplicated, good for prevent duplicate sort fields)
app.use(hpp({
  whitelist: [
    'duration', 
    'ratingsAverage', 
    'ratingsQuantity',
    'difficulty',
    'maxGroupSize',
    'price'
  ]
}));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!' 
  // adds some headers like the max, remaining
});

// affect onlt these routes
app.use('/api',limiter);

app.use(cookieParser());

app.use(helmet());

// 3) ROUTES
// app.use('/' , viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviws',reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
