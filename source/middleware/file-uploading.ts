
import S3Storage from "multer-s3";
import path, { normalize } from "path";
import multer from "multer";
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
            /**
             * Dynamic routes for s3 to better management of assets.
             */
            switch (endPoint) {
                case AwsS3AccessEndpoints.USERS:
                    const userID = request.user?.id ?? 'anonymous';
                    cb(null, `${endPoint}${file.fieldname}/${v4() + '-' + userID}${path.extname(file.originalname)}`);
                    break;
                case AwsS3AccessEndpoints.BUSINESS_DOCUMENTS:
                    cb(null, `${endPoint}${file.fieldname}/${v4()}${path.extname(file.originalname)}`);
                    break;
                default:
                    cb(null, `${endPoint}${v4()}${path.extname(file.originalname)}`);
                    break;
            }
        },
    }),
    fileFilter: (request, file, callback) => {
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
        callback(null, v4() + path.extname(file.originalname));
    }
});

export const diskUpload = multer({ storage: DiskStorage })




export const readVideoMetadata = async (file_path: string): Promise<FFProbeStream | null> => {
    try {
        const metadata: FFProbeResult = await new Promise((resolve, reject) => {
            ffprobe(file_path, { path: ffprobeStatic.path }, (err, metadata) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(metadata);
                }
            });
        });
        if (metadata.streams.length !== 0) {
            return metadata.streams[0];
        }
        return null;
    } catch (error) {
        console.error(`Failed to read video metadata ::: ${error}`)
        return null
    }
};

export async function generateScreenshot(videoPath: string, fileName: string, thumbnailExtName: string) {
    try {
        const thumbnail = path.parse(fileName);
        const thumbnailName = `${thumbnail.name}.${thumbnailExtName}` //Thumbnail name same as video name / Public path of thumbnail
        const thumbnailPath = `${PUBLIC_DIR}/${thumbnailName}` //Public path of thumbnail
        const url: string = await new Promise((resolve, reject) => {
            ffmpeg(videoPath).screenshots({
                count: 1,
                timemarks: ['00:00:00.002'],
                filename: thumbnailName,
                folder: PUBLIC_DIR,
            }).on('end', () => {
                resolve(thumbnailPath);//return thumb name and path to the callback
            }).on('error', function (err, stdout, stderr) {
                console.error(err);
                reject(null);
            });
        });
        return url;
    } catch (error) {
        console.error(`Failed to read video metadata ::: ${error}`)
        return null
    }
}