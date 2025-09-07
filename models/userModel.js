const crypto = require('crypto'); // built-in
const mongoose = require('mongoose');
const { default: isEmail } = require('validator/lib/isEmail');
const  bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'User Name is required!']
    },
    email: {
        type: String,
        required: [true,'User Email is required!'],
        unique: true,
        tolowercase: true,
        validate: [isEmail, 'Please provide valid email']
    },
    photo: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user','guide',,'lead-guide','admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true,'User Password is required!'],
        minlength: 8, 
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true,'Please confirm your password'],
        // this only work in SAVE and CREATE only !!!
        validate: {
            validator: function(el) {
                return (el === this.password);  
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {

    if(!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password,12);

    this.passwordConfirm = undefined;

    next();
    
});

userSchema.pre('save',function(next) {
    if(!this.isModified('password') || this.isNew) {
        return next();
    }

    // database operations are slower than json operations, we want to make sure that jwtTimeStamp < passChangedAt !!
    this.passwordChangedAt = Date.now() - 1000;

    next();


});

userSchema.pre(/^find/,function(next) {
    // this points to the current query
    // to prevent showing all users even they are inactive
    this.find({active:{$ne: false} });
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword,userPassword) {
    return await bcrypt.compare(candidatePassword,userPassword);
};

userSchema.methods.changedPasswordAfter = function(JSTTimestamp) {
    if(this.passwordChangedAt) {
        const time = parseInt(this.passwordChangedAt.getTime() / 1000 , 10);

        return JSTTimestamp < time;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken; // to client
}

const User = mongoose.model('User',userSchema);

module.exports = User;