const logger = require("../utils/logger");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const Media = require("../models/media-model");

const handlePostDelete = async (event) => {
    logger.info("Handling post delete event", event);
    const { postId , mediaIds} = event;

    try {
        if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
            logger.warn("No mediaIds to delete");
            return;
          }

        // Delete media from Cloudinary
        const mediatodelete = await Media.find({_id: { $in: mediaIds }});
        for(const media of mediatodelete){
            await deleteMediaFromCloudinary(media.publicId);
            await Media.deleteOne({ _id: media._id });
        }
        logger.info("Media deleted successfully from cloudinary", mediaId);
    } catch (error) {
        logger.error("Error while deleting media from cloudinary", error);
    }
}

module.exports = {
    handlePostDelete,
};