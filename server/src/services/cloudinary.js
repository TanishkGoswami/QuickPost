import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Point fluent-ffmpeg to the bundled static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 20 MB chunk size for large video uploads
const CHUNK_SIZE = 20 * 1024 * 1024;

// Cloudinary free-tier hard limit (100 MB). We compress at 95 MB to leave headroom.
const CLOUDINARY_MAX_BYTES = 100 * 1024 * 1024;
const COMPRESS_THRESHOLD = 95 * 1024 * 1024;

/**
 * Compress a video file using FFmpeg so it fits under Cloudinary's 100 MB limit.
 * Targets H.264 video at 4 Mbps + AAC audio at 128 kbps.
 * Returns the path to the compressed file (caller must delete it).
 */
async function compressVideo(inputPath) {
  const tmpOutput = path.join(os.tmpdir(), `qp_compressed_${Date.now()}.mp4`);
  console.log(`🗜️  Compressing video: ${inputPath} → ${tmpOutput}`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate('4000k')   // 4 Mbps — good quality, keeps big videos < 100 MB
      .audioBitrate('128k')
      .outputOptions([
        '-preset fast',         // fast encoding, acceptable quality
        '-movflags +faststart', // better streaming
        '-pix_fmt yuv420p',     // max compatibility
      ])
      .output(tmpOutput)
      .on('start', (cmd) => console.log(`🎬 FFmpeg started`))
      .on('progress', (p) => {
        if (p.percent) process.stdout.write(`\r   ↳ Compressing… ${Math.round(p.percent)}%`);
      })
      .on('end', () => {
        process.stdout.write('\n');
        const size = fs.statSync(tmpOutput).size;
        console.log(`✅ Compression done — output size: ${(size / 1024 / 1024).toFixed(1)} MB`);
        resolve(tmpOutput);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg compression failed:', err.message);
        reject(new Error(`Video compression failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Upload a file to Cloudinary.
 * Automatically compresses videos that exceed the 95 MB threshold.
 * Uses chunked upload_large for videos to avoid 413 errors on large files.
 * @param {string} filePath - Local file path to upload
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<Object>} Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(filePath, resourceType = 'auto') {
  let uploadPath = filePath;
  let compressedTmp = null;

  try {
    console.log(`☁️  Uploading ${resourceType} to Cloudinary...`);

    // ── Auto-compress oversized videos ──────────────────────────────────────
    if (resourceType === 'video') {
      const fileSizeBytes = fs.statSync(filePath).size;
      const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(1);
      console.log(`📏 Video size: ${fileSizeMB} MB`);

      if (fileSizeBytes > COMPRESS_THRESHOLD) {
        console.log(`⚠️  File exceeds ${COMPRESS_THRESHOLD / 1024 / 1024} MB — compressing before upload...`);
        compressedTmp = await compressVideo(filePath);

        const compressedSize = fs.statSync(compressedTmp).size;
        if (compressedSize > CLOUDINARY_MAX_BYTES) {
          throw new Error(
            `Video is too large even after compression ` +
            `(${(compressedSize / 1024 / 1024).toFixed(1)} MB). ` +
            `Please use a shorter or lower-resolution video (max ~100 MB).`
          );
        }
        uploadPath = compressedTmp;
      }
    }

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
         cloudinary.uploader.upload_large(uploadPath, uploadOptions, (error, res) => {
            if (error) reject(error);
            else resolve(res);
         });
      } else {
         cloudinary.uploader.upload(uploadPath, uploadOptions)
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
  } finally {
    // Clean up the temporary compressed file if we created one
    if (compressedTmp) {
      try { fs.unlinkSync(compressedTmp); } catch (_) {}
    }
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
