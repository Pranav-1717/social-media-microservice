const logger = require('../utils/logger');
const Post = require('../models/Post');
const {validateCreatePost} = require('../utils/validation');
const { publishToQueue } = require('../utils/rabbitmq'); // Import the RabbitMQ utility


const deleteCache = async (req) => {

  const keys = await  req.redisClient.keys(`posts:*`);
  if(keys.length > 0){
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Hit createPost controller");

  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.error("Validation error", error.details[0].message);
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { content, mediaIds } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const userId = req.user?.userId ; // Temporarily fallback to test

    const newPost = new Post({
      User: userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newPost.save();
    await publishToQueue("post.created", {
      postId: newPost._id.toString(),
      userId: newPost.User.toString(),
      content: newPost.content,
      createdAt: newPost.createdAt,
    }); // Publish to RabbitMQ

    await deleteCache(req); // Delete cache for posts

    logger.info("✅ Post created successfully", newPost);
    res.status(201).json({ success: true, message: "Post created", data: newPost });
  } catch (e) {
    logger.error("❌ Error in createPost", e);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//get  all posta
const getAllPosts = async (req, res) => {
  logger.info("Hit getAllPosts controller");
  try {
   const page = parseInt(req.query.page) ||  1;
   const limit = parseInt(req.query.limit) || 10;
   const startIndex = (page-1)*limit;

   const chacheKey = `posts:${page}:{limit}`;
   const cachedPosts = await req.redisClient.get(chacheKey);

   if(cachedPosts){
    return res.json(JSON.parse(cachedPosts));
   }

   const results = await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit);
   const totalPosts = await Post.countDocuments({});
   const totalpage = Math.ceil(totalPosts/limit);
   const posts = {
    totalPosts,
    totalpage,
    currentPage: page,
    posts: results
   };

    await req.redisClient.setex(chacheKey, 300, JSON.stringify(posts)); // Cache for 1 hour
    res.json(results);
  } catch (e) {
    logger.error("Error in getAllPosts", e);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


//GET POST BY ID
const getPostById = async (req, res)=>{
  logger.info("Hit getPostById controller");
  try{
    const postid = req.params.id;
    const post = await req.redisClient.get(`posts/${postid}`);
    if(post){
      return res.status(200).json({success:true,message:"Post fetched from cache",data:JSON.parse(post)});
    }
    const postData = await Post.findById(postid);
    if(!postData){
      return res.status(404).json({success:false,message:"Post not found"});
    }
    await req.redisClient.setex(`posts/${postid}`, 3600, JSON.stringify(postData)); // Cache for 1 hour
    return res.status(200).json({success:true,message:"Post fetched",data:postData});
  }
  catch(e){
    logger.error("Error in getPostById",e);
    res.status(500).json({success:false,message:"Internal server error"});
  }
};

//delete post by id
const deletePostById = async (req, res)=>{
  logger.info("Hit deletePostById controller");
  try{
    const postid = req.params.id;
    const userId = req.user.userId ; // Temporarily fallback to test
    const post = await Post.findById({_id:postid,User:userId});
    if(!post){
      return res.status(404).json({success:false,message:"Post not found"});
    }

    await publishToQueue("post.deleted", {
      postId: post._id,
      userId: post.User,
      mediaIds: post.mediaIds,
    }); // Publish to RabbitMQ
    await Post.deleteOne({_id:postid});
    await req.redisClient.del(`posts/${postid}`); // Delete cache for the specific post
    await deleteCache(req); // Delete cache for all posts
    return res.status(200).json({success:true,message:"Post deleted successfully"});
  }
  catch(e){
    logger.error("Error in deletePostById",e);
    res.status(500).json({success:false,message:"Internal server error"});
  }
};
  
  

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    deletePostById
}