const jwt= require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/refreshToken");

const generateTokens = async (user) =>{
    const accessToken = jwt.sign(
        {
          userId: user._id,
          username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "60m" }
      );

      const refreshToken = crypto.randomBytes(40).toString("hex");
      const expiredAt = new Date()
      expiredAt.setDate(expiredAt.getDate()+7);

      await RefreshToken.create({
        token:refreshToken,
        user:user._id,
        expiredAt
      });

      return {accessToken,refreshToken};
}

module.exports = generateTokens;