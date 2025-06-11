const logger = require('../utils/logger');
const  Media = require('../models/media-model');
const { uploadMediaToCloudinary } = require('../utils/cloudinary');
 // debug

 const uploadMedia = async (req, res) => {
    logger.info("Starting media upload");
    try {
      console.log(req.file, "req.filereq.file");
  
      if (!req.file) {
        logger.error("No file found. Please add a file and try again!");
        return res.status(400).json({
          success: false,
          message: "No file found. Please add a file and try again!",
        });
      }
  
      const { originalname, mimetype, buffer } = req.file;
      const userId = req.user.userId;
  
      logger.info(`File details: name=${originalname}, type=${mimetype}`);
      logger.info("Uploading to cloudinary starting...");
  
      const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
      logger.info(
        `Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`
      );
  
      const newlyCreatedMedia = new Media({
        publicId: cloudinaryUploadResult.public_id,
        originalName: originalname,
        mimeType: mimetype,
        url: cloudinaryUploadResult.secure_url,
        userId,
      });
  
      await newlyCreatedMedia.save();
  
      res.status(201).json({
        success: true,
        mediaId: newlyCreatedMedia._id,
        url: newlyCreatedMedia.url,
        message: "Media upload is successfully",
      });
    } catch (error) {
      logger.error("Error creating media", error);
      res.status(500).json({
        success: false,
        message: "Error creating media",
      });
    }
  };

const getAllMedia = async (req, res) => {
    logger.info("Hit getAllMedia controller");
    try {
      const media = await Media.find({userId: req.user.userId});
      if (!media) {
        return res.status(404).json({
          success: false,
          message: "No media found",
        });
      };

      return res.status(200).json({media});
    } catch (error) {
      logger.error("Error fetching media", error);
      res.status(500).json({
        success: false,
        message: "Error fetching media",
      });
    }
  }

module.exports = {
    uploadMedia,
    getAllMedia
}
