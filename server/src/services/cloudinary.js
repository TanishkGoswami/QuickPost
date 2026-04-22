import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 20 MB chunk size for large video uploads
const CHUNK_SIZE = 20 * 1024 * 1024;

/**
 * Upload a file to Cloudinary.
 * Uses chunked upload_large for videos to avoid 413 errors on large files.
 * @param {string} filePath - Local file path to upload
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<Object>} Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(filePath, resourceType = 'auto') {
  try {
    console.log(`☁️  Uploading ${resourceType} to Cloudinary...`);

    const uploadOptions = {
      resource_type: resourceType,
      folder: 'quickpost',
      use_filename: false,
      unique_filename: true,
      // Chunked upload for videos avoids 413 payload-too-large errors
      ...(resourceType === 'video' && {
        chunk_size: CHUNK_SIZE,
      }),
    };

    // Use upload_large for videos (handles chunking transparently)
    const result = await new Promise((resolve, reject) => {
      if (resourceType === 'video') {
         cloudinary.uploader.upload_large(filePath, uploadOptions, (error, res) => {
            if (error) reject(error);
            else resolve(res);
         });
      } else {
         cloudinary.uploader.upload(filePath, uploadOptions)
           .then(resolve)
           .catch(reject);
      }
    });

    console.log(`✓ Upload successful: ${result.secure_url}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      width: result.width,
      height: result.height,
      size: result.bytes
    };

  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: result.result === 'ok',
      result: result.result
    };

  } catch (error) {
    console.error('❌ Cloudinary deletion failed:', error.message);
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
}

/**
 * Check if Cloudinary is properly configured
 * @returns {boolean} True if configured
 */
export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
