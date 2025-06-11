const cloudinary = require("cloudinary").v2;
const logger = require("./logger");

console.log( "cloud_name");

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    console.log( "in function");
    cloudinary.config({
      cloud_name: process.env.cloud_name,
      api_key: process.env.api_key,
      api_secret: process.env.api_secret,
    });
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error("Error while uploading media to cloudinary", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try{
    const result = await cloudinary.uploader.destroy(publicId);
    if (result) {
      logger.info("Media deleted successfully from cloudinary", result);
    } else {
      logger.error("Error while deleting media from cloudinary", result);
    }
  }catch(error){
    logger.error("Error while deleting media from cloudinary", error);
  }
}
module.exports = { uploadMediaToCloudinary , deleteMediaFromCloudinary};