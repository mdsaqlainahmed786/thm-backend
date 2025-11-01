
import S3Storage from "multer-s3";
import path, { normalize } from "path";
import fs from "fs/promises";
import { tmpdir } from "os";
import multer from "multer";
import fsSync from "fs";
import { AppConfig, AwsS3AccessEndpoints } from "../config/constants";
import { Request } from "express";
import { v4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe, { FFProbeResult, FFProbeStream } from "ffprobe";
import ffprobeStatic from "ffprobe-static"
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffmpegInstaller.path);

export const PUBLIC_DIR = `public/files`;
import S3Service from "../services/S3Service";
const s3Service = new S3Service();

function sanitizeImage(request: Request, file: any, cb: any) {
    const fileExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".gif", ".mp4", ".pdf", ".doc", ".docx", ".mov"];

    const isAllowedExt = fileExts.includes(
        path.extname(file.originalname.toLowerCase())
    );
    const isAllowedImageMimeType = file.mimetype.startsWith("image/");
    const isAllowedVideoMimeType = file.mimetype.startsWith("video/");
    const isAllowedDocumentMimeType = file.mimetype.startsWith("application/");


    if ((isAllowedExt && isAllowedImageMimeType) ||
        (isAllowedExt && isAllowedVideoMimeType) ||
        (isAllowedExt && isAllowedDocumentMimeType)
    ) {
        return cb(null, true);
    } else {
        const error: any = new Error('Error: File type not allowed!');
        error.status = 400;
        cb(error, false);
    }
}
/**
 * 
 * @param endPoint Endpoint is s3 endpoint where image will present after upload.
 * @returns 
 */
export const s3Upload = (endPoint: string) => multer({
    storage: S3Storage({
        s3: s3Service.getClient(),
        bucket: AppConfig.AWS_BUCKET_NAME,
        acl: "public-read", // Storage Access Type
        contentType: (req, file, cb) => {// Content Type for S3 Bucket
            cb(null, file.mimetype);
        },
        metadata: (request, file, cb) => {
            cb(null, { fieldname: file.fieldname })
        },
        key: (request: Request, file, cb) => {
            // Clean and safe endpoint
            const cleanEndpoint = endPoint.replace(/\/+$/, '').replace(/^\/+/, '');
            const extension = path.extname(file.originalname);
            const uniqueName = `${Date.now()}-${v4()}${extension}`;

            switch (endPoint) {
                case AwsS3AccessEndpoints.USERS:
                    const userID = request.user?.id ?? 'anonymous';
                    cb(null, `${cleanEndpoint}/${file.fieldname}/${v4()}-${userID}${extension}`);
                    break;
                case AwsS3AccessEndpoints.BUSINESS_DOCUMENTS:
                    cb(null, `${cleanEndpoint}/${file.fieldname}/${v4()}${extension}`);
                    break;
                default:
                    cb(null, `${cleanEndpoint}/${uniqueName}`);
                    break;
            }
            console.log("🧾 Final S3 Key =>", `${cleanEndpoint}/${uniqueName}`);

        }

    }),
    fileFilter: (request, file, callback) => {
        //@ts-ignore
        sanitizeImage(request, file, callback)
    },
    limits: {
        fileSize: 1024 * 1024 * 500//0.5GB
    }
});

export const DiskStorage = multer.diskStorage({
    destination: function (request, file, callback) {
        callback(null, normalize(PUBLIC_DIR));
    },
    filename: function (request, file, callback) {
        callback(null, `${v4()}-${Date.now()}` + path.extname(file.originalname));
    }
});

export const diskUpload = multer({ storage: DiskStorage })


export const readVideoMetadata = async (filePathOrKey: string): Promise<FFProbeStream | null> => {
  let localPath = filePathOrKey;

  try {
    // ✅ If the provided path does not exist locally, assume it's an S3 Key
    if (!fsSync.existsSync(filePathOrKey)) {
      console.log("Downloading video temporarily from S3 to read metadata...");
      const tmpFilePath = path.join(tmpdir(), `${Date.now()}-video.mp4`);

      // Ensure we pass a valid S3 key
      if (!filePathOrKey || typeof filePathOrKey !== "string") {
        throw new Error("Invalid S3 key passed to readVideoMetadata");
      }

      const s3Object = await s3Service.getS3Object(filePathOrKey);
      if (!s3Object || !s3Object.Body) {
        throw new Error("S3 object not found or empty body");
      }

      const buffer = await s3Object.Body.transformToByteArray();
      //@ts-ignore
      await fs.writeFile(tmpFilePath, Buffer.from(buffer));
      localPath = tmpFilePath;
    }

    // ✅ Probe the local file (temporary or real)
    const metadata: FFProbeResult = await new Promise((resolve, reject) => {
      ffprobe(localPath, { path: ffprobeStatic.path }, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });

    const videoStream = metadata?.streams?.find((s) => s.codec_type === "video");
    return videoStream || null;
  } catch (error) {
    console.error("Failed to read video metadata :::", error);
    return null;
  } finally {
    // ✅ Clean up temporary file
    if (localPath.startsWith(tmpdir()) && fsSync.existsSync(localPath)) {
      await fs.unlink(localPath).catch(() => {});
    }
  }
};


export async function generateScreenshot(s3Key: string, fileName: string, thumbnailExtName: string) {
  try {
    // ✅ Create a temporary local path
    const tmpVideoPath = path.join(tmpdir(), `${Date.now()}-video.mp4`);
    const tmpThumbPath = path.join(tmpdir(), `${Date.now()}-thumbnail.${thumbnailExtName}`);

    // ✅ Download the video temporarily from S3
    const s3Object = await s3Service.getS3Object(s3Key);
    if (!s3Object || !s3Object.Body) throw new Error("S3 video object not found");
    const buffer = await s3Object.Body.transformToByteArray();
    //@ts-ignore
    await fs.writeFile(tmpVideoPath, Buffer.from(buffer));

    // ✅ Generate a thumbnail image locally
    await new Promise((resolve, reject) => {
      ffmpeg(tmpVideoPath)
        .on("end", resolve)
        .on("error", reject)
        .screenshots({
          count: 1,
          timemarks: ["00:00:00.002"],
          filename: path.basename(tmpThumbPath),
          folder: path.dirname(tmpThumbPath),
        });
    });

    // ✅ Return the local thumbnail path
    return tmpThumbPath;
  } catch (error) {
    console.error("Failed to generate video thumbnail :::", error);
    return null;
  }
}