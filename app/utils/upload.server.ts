// app/utils/upload.server.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageToCloudinary(base64Image: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'store-locator',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit' }, // Resize
        { quality: 'auto' }, // Auto optimize
        { fetch_format: 'auto' }, // WebP nếu browser support
      ],
    });

    return result.secure_url; // Trả về URL thay vì base64
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}