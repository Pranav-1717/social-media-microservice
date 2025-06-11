const mongoose = require('mongoose');
const argon2 = require('argon2');

const userschema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
    },
    createdat:{
        type:Date,
        default:Date.now
    }
},
    {
        timestamps:true,
    }
);


userschema.pre('save', async function (next) {  // 👈 Change arrow function to function
    if (this.isModified('password')) {
        try {
            this.password = await argon2.hash(this.password);
        } catch (error) {
            return next(error);
        }
    }
    next(); 
});

userschema.methods.comparePassword = async function (candidatePassword) {  //Use function() {} instead of arrow function
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw error;
    }
};


userschema.index({username:'test'});

module.exports = mongoose.model('User' , userschema);