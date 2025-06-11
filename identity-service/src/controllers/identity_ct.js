const RefreshToken = require('../models/refreshToken')
const User = require('../models/users')
const logger = require('../utils/logger')
const generateTokens = require('../utils/generateToken')
const {validateRegistration , validatelogin} = require('../utils/validation')


//registeration
const registeration = async (req , res)=> {
    logger.info('Registeration endpoint hit')
    try{
        const {error} =  validateRegistration(req.body)
        if(error){
            logger.error('Registeration error' , error.details[0].message)
            return res.status(400).json({success:false,message:error.details[0].message})
        }

        const {username , email, password} = req.body
        let user = await User.findOne({$or : [{email} , {username}]})
        console.log(user)
        if(user){
            logger.warn('User already exist')
            return res.status(400).json({success:false,message:'User already exist'})
        }

        user = new User({username , email , password})
        await user.save()
        logger.warn("User saved successfully", user._id);
        const { accessToken, refreshToken } = await generateTokens(user);

        res.status(201).json({
        success: true,
        message: "User registered successfully!",
        accessToken,
        refreshToken,
        });
    }
    catch(e){
        logger.error('Registeration error occured',e)
        return res.status(500).json({success:false , message:'Internal server error'})
    }
};

//login
const login = async (req,res)=> {
    logger.info('Login endpoint hit')
    try{
        const {error} = await validatelogin(req.body)
        if(error){
            logger.error('Login error' , error.details[0].message)
            return res.status(400).json({success:false,message:error.details[0].message})
        }

        const {email, password} = req.body
        let user = await User.findOne({email})
        if(!user){
            logger.warn('User not exist')
            return res.status(400).json({success:false,message:'User not exist'})
        }

        const isValidPass = await user.comparePassword(password)
        if(!isValidPass){
            logger.warn('Invalid user')
            return res.status(400).json({success:false,message:'Incorrect credentials'})
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        return res.json({
          accessToken,
          refreshToken,
          userId: user._id,
        });
       
    }
    catch(e){
        logger.error('Login error occured',e)
        return res.status(500).json({success:false , message:'Internal server error'})
    }
}

//refersh token
const refreshTokenUser = async (req,res)=>{
    logger.info('Refresh token api hit....')
    try{
        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn('Refresh Token is missing')
            return res.status(400).json({success:false,message:'Refresh token is missing'})
        }

        const storeToken = RefreshToken.findOne({token:refreshToken})

        if(!storeToken || storeToken.expiresAt < new Date()){
            logger.warn('Invalid or expired refresh token')
            return res.status(401).json({success:false,message:'Invalid or expired refresh token'})
        }

        const user = User.findById(storeToken.user)
        if(!user){
            logger.warn("User not found")
            return res.status(401).json({success:false,message:'User not found'})
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = new generateTokens(user)

        await RefreshToken.deleteOne({_id : storeToken._id})

        res.json({
            accessToken: newAccessToken, 
            refreshToken: newRefreshToken 
        })
    }
    catch(e){
        logger.error('Refresh token error occured' ,e)
        return res.status(500).json({success:false,message:"Internal server error"})
    }
    
}


//logout
const logoutUser = async (req,res)=> {
    logger.info('logout api hit....')
    try{
        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn('Refresh Token is missing')
            return res.status(400).json({success:false,message:'Refresh token is missing'})
        }

        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info("Refresh token deleted for logout");
    
        res.json({
          success: true,
          message: "Logged out successfully!",
        })
    }
    catch(e){
        logger.error('Error while logging out',e)
        return res.status(500).json({success:false , message:'Internal server error'})
    }
}

module.exports = {registeration ,login , refreshTokenUser , logoutUser}