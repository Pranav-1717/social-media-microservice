const mongoose = require('mongoose');
const { create } = require('../../../identity-service/src/models/refreshToken');

const postSchema = new mongoose.Schema({
    User:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    content:{
        type : String,
        required : true,
    },
    mediaIds : [
        {
            type : String,
        }
    ],
    createdAt:{
        type : Date,
        default : Date.now,
    },
},
    {timestamps : true}
);

postSchema.index({content:'text'});
const Post = mongoose.model('Post', postSchema);
module.exports = Post;