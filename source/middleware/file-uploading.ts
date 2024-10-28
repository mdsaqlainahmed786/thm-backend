


import { S3Client, DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, DeleteObjectCommandOutput, CompleteMultipartUploadCommandOutput } from "@aws-sdk/client-s3";
import S3Storage from "multer-s3";
import path from "path";
import multer from "multer";
import { AppConfig, AwsS3AccessEndpoints } from "../config/constants";
import { Request } from "express";
import { v4 } from "uuid";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs/promises";
import sharp from "sharp";
import { addStringBeforeExtension } from "../utils/helper/basic";
import { Readable } from "stream"
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import ffmpeg from "fluent-ffmpeg";
// import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
// ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// ffmpeg.setFfprobePath(ffmpegInstaller.path);

export const PUBLIC_DIR = `public/files`;
import { StreamingBlobPayloadInputTypes } from '@smithy/types'
export const s3Client = new S3Client({
    credentials: {
        accessKeyId: AppConfig.AWS_ACCESS_KEY,
        secretAccessKey: AppConfig.AWS_SECRET_KEY
    },
    region: AppConfig.AWS_REGION
});

function sanitizeImage(request: Request, file: any, cb: any) {
    const fileExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".gif", ".mp4", ".pdf", ".doc", ".docx"];

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
export const uploadMedia = (endPoint: string) => multer({
    storage: S3Storage({
        s3: s3Client,
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
})

export async function deleteS3Object(s3Key: string): Promise<DeleteObjectCommandOutput> {
    const deleteCommand = new DeleteObjectCommand({
        Bucket: AppConfig.AWS_BUCKET_NAME,
        Key: s3Key
    });
    return await s3Client.send(deleteCommand);
}

export async function getS3Object(s3Key: string): Promise<GetObjectCommandOutput> {
    const getCommand = new GetObjectCommand({
        Bucket: AppConfig.AWS_BUCKET_NAME,
        Key: s3Key,
    });
    return await s3Client.send(getCommand);
}
export async function generatePresignedUrl(s3Key: string) {
    // Create a command for the object you want to access
    const command = new GetObjectCommand({
        Bucket: AppConfig.AWS_BUCKET_NAME,
        Key: s3Key,
    });

    // Generate the presigned URL, valid for 1 hour (3600 seconds)
    return await getSignedUrl(s3Client, command);
}
export async function putS3Object(body: StreamingBlobPayloadInputTypes, contentType: string, path: string): Promise<CompleteMultipartUploadCommandOutput> {
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: AppConfig.AWS_BUCKET_NAME,
            Key: path,
            Body: body,
            ContentType: contentType
        }
    });
    return await upload.done();
}


// export async function generateScreenshotBuffer(videoData: Uint8Array, fileName: string, thumbnailExtName: string) {
//     const thumbnail = path.parse(fileName);
//     const videoPath = `${PublicDir}/${thumbnail.name}${thumbnail.ext}`;
//     await removeAllFilesInDirectory(PublicDir);
//     const isFileCreated = await createWriteStreamPromise(videoPath, videoData);
//     return new Promise((resolve, reject) => {
//         const thumbnailName = `${thumbnail.name}.${thumbnailExtName}` //Thumbnail name same as video name / Public path of thumbnail
//         const thumbnailPath = `${PublicDir}/${thumbnailName}` //Public path of thumbnail
//         if (isFileCreated) {
//             ffmpeg(videoPath).screenshots({
//                 count: 1,
//                 timemarks: ['00:00:00.002'],
//                 filename: thumbnailName,
//                 folder: PublicDir,
//             }).on('end', () => {
//                 resolve(thumbnailPath);//return thumb name and path to the callback
//             }).on('error', function (err, stdout, stderr) {
//                 console.error(err);
//                 reject(null);
//             });
//         } else {
//             reject(null)
//         }
//     });
// }

export async function createWriteStreamPromise(filePath: string, data: Uint8Array): Promise<string | null> {
    try {
        await fs.writeFile(filePath, data);
        return filePath;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
export async function removeAllFilesInDirectory(directoryPath: string) {
    try {
        const files = await fs.readdir(directoryPath);

        // Use Promise.all to delete each file asynchronously
        await Promise.all(files.map(async (file) => {
            const filePath = path.join(directoryPath, file);
            await fs.unlink(filePath);
            // console.log(`File ${file} removed.`);
        }));
        // console.log(`All files in ${directoryPath} removed successfully.`);
    } catch (error) {
        console.error('Error:', error);
    }
}




export async function thumbnailGenerator(media: Express.Multer.S3File, sizes: ('small' | 'medium')[]) {
    return Promise.all(sizes.map(async (size) => {
        const s3Image = await getS3Object(media.key);
        let thumbnailWidth = 320;
        let thumbnailHeight = 240;
        let s3Location: string = media.location;
        if (size === 'medium') {
            thumbnailWidth = 640;
            thumbnailHeight = 480;
        }
        if (s3Image.Body && media.mimetype.startsWith('image/')) {
            const body = s3Image.Body;
            const rawToByteArray = await body.transformToByteArray();
            const sharpImage = await sharp(rawToByteArray);
            // height: thumbnailHeight, fit: "contain"
            const thumbnail = await sharpImage.resize({ width: thumbnailWidth, height: thumbnailHeight, fit: "cover" }).toBuffer();
            //key new thumbnail key 
            const thumbnailPath = addStringBeforeExtension(media.key, `-${thumbnailWidth}x${thumbnailHeight}`)
            const s3Upload = await putS3Object(thumbnail, media.mimetype, thumbnailPath);
            if (s3Upload) {
                s3Location = s3Upload.Location ?? media.location;
            }
        }
        return { size: size, s3Location: s3Location }
    }))

}

