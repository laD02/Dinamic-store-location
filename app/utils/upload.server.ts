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
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

export async function deleteImageFromCloudinary(imageUrl: string): Promise<boolean> {
  try {
    // Extract public_id từ Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/store-locator/{filename}.{ext}
    // Cần lấy: store-locator/{filename}

    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) {
      console.error('Invalid Cloudinary URL format:', imageUrl);
      return false;
    }

    // Lấy phần sau /upload/ và bỏ version (v1234567890/)
    let pathAfterUpload = urlParts[1];
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, ''); // Bỏ version

    // Bỏ extension (.jpg, .png, etc.)
    const publicId = pathAfterUpload.replace(/\.[^.]+$/, '');

    console.log('Deleting image with public_id:', publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      console.log('Image deleted successfully:', publicId);
      return true;
    } else if (result.result === 'not found') {
      console.warn('Image not found on Cloudinary:', publicId);
      return true; // Coi như thành công vì ảnh đã không tồn tại
    } else {
      console.error('Failed to delete image:', result);
      return false;
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}