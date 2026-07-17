import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Downloads a list of media URLs to the local uploads directory.
 * @param {string[]} mediaUrls - Array of URLs to download
 * @param {string[]} originalFilePaths - Array of original file paths (used to determine prefix/extension)
 * @returns {Promise<string[]>} Array of local paths where the files were downloaded
 */
export async function downloadMedia(mediaUrls, originalFilePaths = []) {
  const downloadedPaths = [];
  
  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];
    
    // If the URL is missing, skip it
    if (!url) continue;

    // Determine prefix and extension
    const originalPath = originalFilePaths[i] || '';
    const isVideo = originalPath.includes('video-');
    const prefix = isVideo ? 'video' : 'image';
    
    const extMatch = originalPath.match(/\.[0-9a-z]+$/i);
    const ext = extMatch ? extMatch[0] : (isVideo ? '.mp4' : '.jpg');
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${prefix}-${uniqueSuffix}${ext}`;
    const destPath = path.join(uploadDir, filename);
    
    console.log(`⬇️ Downloading media to ${destPath}...`);
    
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(destPath);
      
      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error = null;
        writer.on('error', err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) resolve();
        });
      });
      
      downloadedPaths.push(destPath);
    } catch (err) {
      console.error(`❌ Failed to download ${url}:`, err.message);
      // Clean up already downloaded files if this one fails
      downloadedPaths.forEach(p => {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
      throw new Error(`Failed to download media for processing: ${err.message}`);
    }
  }
  
  return downloadedPaths;
}
