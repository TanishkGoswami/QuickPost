import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const PLATFORM_SIZE_CONFIG = {
  instagram: {
    image: {
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 },
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1080, height: 1080 },
    },
    video: {
      '1:1': { width: 1080, height: 1080 },
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1080, height: 1920 },
    },
  },
  youtube: {
    video: {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1920, height: 1080 },
    },
    thumbnail: {
      default: { width: 1280, height: 720 },
    },
  },
  linkedin: {
    image: {
      '1.91:1': { width: 1200, height: 627 },
      '1:1': { width: 1080, height: 1080 },
      default: { width: 1200, height: 627 },
    },
    video: {
      '1.91:1': { width: 1200, height: 627 },
      '1:1': { width: 1080, height: 1080 },
      default: { width: 1200, height: 627 },
    },
  },
  x: {
    image: {
      '16:9': { width: 1200, height: 675 },
      '1:1': { width: 1080, height: 1080 },
      default: { width: 1200, height: 675 },
    },
    video: {
      '16:9': { width: 1200, height: 675 },
      '1:1': { width: 1080, height: 1080 },
      default: { width: 1200, height: 675 },
    },
  },
  facebook: {
    image: {
      '1:1': { width: 1200, height: 1200 },
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1200, height: 1200 },
    },
    video: {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1920, height: 1080 },
    },
  },
  threads: {
    image: {
      '1:1': { width: 1200, height: 1200 },
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1200, height: 1200 },
    },
    video: {
      '9:16': { width: 1080, height: 1920 },
      '16:9': { width: 1920, height: 1080 },
      default: { width: 1080, height: 1920 },
    },
  },
  pinterest: {
    image: {
      '2:3': { width: 1000, height: 1500 },
      default: { width: 1000, height: 1500 },
    },
    video: {
      '2:3': { width: 1000, height: 1500 },
      default: { width: 1000, height: 1500 },
    },
  },
  tiktok: {
    video: {
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1080, height: 1920 },
    },
  },
  whatsapp: {
    image: {
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1080, height: 1920 },
    },
    video: {
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1080, height: 1920 },
    },
  },
  telegram: {
    image: {
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1080, height: 1920 },
    },
    video: {
      '9:16': { width: 1080, height: 1920 },
      default: { width: 1080, height: 1920 },
    },
  },
};

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function selectTargetSize(platform, mediaType, selectedAspectRatio) {
  const platformConfig = PLATFORM_SIZE_CONFIG[platform];
  if (!platformConfig) return null;

  const mediaConfig = platformConfig[mediaType] || platformConfig.image;
  if (!mediaConfig) return null;

  return mediaConfig[selectedAspectRatio] || mediaConfig.default || null;
}

function processImage(inputPath, outputPath, target) {
  return new Promise((resolve, reject) => {
    const vf = `scale=${target.width}:${target.height}:force_original_aspect_ratio=increase,crop=${target.width}:${target.height}`;

    ffmpeg(inputPath)
      .outputOptions(['-vf', vf, '-frames:v 1', '-q:v 2'])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

function processVideo(inputPath, outputPath, target) {
  return new Promise((resolve, reject) => {
    const vf = `scale=${target.width}:${target.height}:force_original_aspect_ratio=increase,crop=${target.width}:${target.height},setsar=1`;

    ffmpeg(inputPath)
      .videoFilters(vf)
      .outputOptions([
        '-c:v libx264',
        '-preset veryfast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

export async function generatePlatformMediaVariants({
  inputFilePath,
  mediaType,
  selectedChannels,
  selectedAspectRatio,
  jobId,
}) {
  if (!inputFilePath || !selectedChannels?.length) {
    return { variants: {}, generatedFiles: [] };
  }

  const outputRoot = path.resolve(process.cwd(), 'uploads', 'processed', String(jobId || Date.now()));
  ensureDirectory(outputRoot);

  const variants = {};
  const generatedFiles = [];

  for (const platform of selectedChannels) {
    const target = selectTargetSize(platform, mediaType, selectedAspectRatio);
    if (!target) continue;

    const outputName = mediaType === 'video'
      ? `${platform}-${target.width}x${target.height}.mp4`
      : `${platform}-${target.width}x${target.height}.jpg`;

    const outputPath = path.join(outputRoot, outputName);

    try {
      if (mediaType === 'video') {
        await processVideo(inputFilePath, outputPath, target);
      } else {
        await processImage(inputFilePath, outputPath, target);
      }

      variants[platform] = {
        path: outputPath,
        width: target.width,
        height: target.height,
        ratio: `${target.width}:${target.height}`,
      };
      generatedFiles.push(outputPath);
    } catch (error) {
      // Graceful fallback: do not break broadcast if one platform variant fails.
      console.warn(`⚠️ [MEDIA] Variant generation failed for ${platform}:`, error.message);
    }
  }

  return { variants, generatedFiles };
}
