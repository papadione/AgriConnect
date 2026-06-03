const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class UploadService {
    async uploadImage(fileBuffer, filename) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'agriconnect',
                    public_id: filename.split('.')[0],
                    transformation: [{ width: 800, height: 800, crop: 'limit' }]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result.secure_url);
                }
            );
            
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }
}

module.exports = new UploadService();