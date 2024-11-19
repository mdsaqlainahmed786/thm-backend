import sharp from "sharp";
import { addStringBeforeExtension } from "../utils/helper/basic";
import S3Object, { IS3Object } from "../database/models/s3Object.model";
import { MongoID } from "../common";
import Media, { MediaType } from "../database/models/media.model";
import S3Service from "../services/S3Service";
import { readVideoMetadata } from "../middleware/file-uploading";
import fs from "fs";
import { AwsS3AccessEndpoints } from "../config/constants";
import { generateScreenshot } from "../middleware/file-uploading";
import path from "path";
import fileSystem from "fs/promises";
const s3Service = new S3Service();
async function generateThumbnail(media: Express.Multer.S3File, thumbnailFor: "video" | "image", width: number, height: number) {
    const s3Image = await s3Service.getS3Object(media.key);
    const cropSetting: {} = { width: width, height: height, fit: "cover" };
    if (s3Image.Body && media.mimetype.startsWith('image/') && thumbnailFor === "image") {
        const body = s3Image.Body;
        const rawToByteArray = await body.transformToByteArray();
        const sharpImage = await sharp(rawToByteArray);
        // const metadata = await sharpImage.metadata();
        const thumbnail = await sharpImage.resize(cropSetting).toBuffer();
        const thumbnailPath = addStringBeforeExtension(media.key, `-${width}-${height}`)
        const s3Upload = await s3Service.putS3Object(thumbnail, media.mimetype, thumbnailPath);
        return s3Upload;
    }
    return null;
    // if (s3Image.Body && media.mimetype.startsWith('video/') && thumbnailFor === "video") {
    //     const body = s3Image.Body;
    //     const rawToByteArray = await body.transformToByteArray();
    //     const thumbnailExtName = "png";
    //     const screenshot = await generateScreenshotBuffer(rawToByteArray, media.key, thumbnailExtName).catch((error: any) => console.log(error));
    //     if (screenshot) {
    //         const sharpImage = await sharp(screenshot);
    //         const metadata = await sharpImage.metadata();
    //         let thumbnailPathT = path.parse(media.key);
    //         width = metadata.width ?? 0;
    //         height = metadata.height ?? 0;
    //         // height: thumbnailHeight, fit: "contain"
    //         const thumbnail = await sharpImage.resize(cropSetting).toBuffer();
    //         //key new thumbnail key 
    //         const thumbnailPath = addStringBeforeExtension(`${thumbnailPathT.dir}/${thumbnailPathT.name}.${thumbnailExtName}`, `-${thumbnailWidth}x${thumbnailHeight}`)
    //         const thumbnailMimeType = `image/${thumbnailExtName}`;
    //         const s3Upload = await putS3Object(thumbnail, thumbnailMimeType, thumbnailPath);
    //         if (s3Upload && s3Upload.Location && s3Upload.Key) {
    //             const imageData: ThumbnailMediaFile = {
    //                 fileName: `${thumbnailPathT.name}.${thumbnailExtName}`,
    //                 width: thumbnailWidth,
    //                 height: thumbnailHeight,
    //                 fileSize: media.size,
    //                 mimeType: thumbnailMimeType,
    //                 sourceUrl: s3Upload.Location,
    //                 s3Key: s3Upload.Key,
    //                 size: Size.THUMBNAIL
    //             }
    //             sizeArray.push(imageData)
    //         }
    //     }
    // }
    // return { width, height, sizeArray };
}


async function storeMedia(files: Express.Multer.File[], userID: MongoID, businessProfileID: MongoID | null, type: MediaType, s3BasePath: string, uploadedFor: 'POST' | 'STORY') {
    let fileList: any[] = [];
    if (files) {
        await Promise.all(files && files.map(async (file) => {
            const fileObject = {
                businessProfileID: businessProfileID,
                userID: userID,
                fileName: file.originalname,
                fileSize: file.size,
                mediaType: type,
                mimeType: file.mimetype,
                width: 0,
                height: 0,
                duration: 0,
                sourceUrl: '',
                s3Key: '',
                thumbnailUrl: ''
            }
            let width = 500;
            let height = 500;
            if (uploadedFor === "POST") {
                width = 640;
                height = 640;
            }
            if (uploadedFor === "STORY") {
                width = 1080;
                height = 1980;
            }
            //Crop setting from thumbnail 
            const cropSetting: {} = { width: width, height: height, fit: sharp.fit.inside, withoutEnlargement: true };
            //Generate thumbnail
            let thumbnail: Buffer | null = null;
            if (file && file.mimetype.startsWith('image/')) {
                const sharpImage = await sharp(file.path);
                //Read metadata of video
                const metadata = await sharpImage.metadata();
                if (metadata) {
                    Object.assign(fileObject, { width: metadata.width, height: metadata.height });
                }
                thumbnail = await sharpImage.resize(cropSetting).toBuffer();
            }
            if (file && file.mimetype.startsWith('video/')) {
                //Read metadata of video
                const metadata = await readVideoMetadata(file.path);
                if (metadata) {
                    Object.assign(fileObject, { width: metadata.width, height: metadata.height, duration: metadata.duration });
                }
                //Generate thumbnail from video
                const generatedThumbnailUrl = await generateScreenshot(file.path, file.filename, 'jpeg');
                // //Resize video thumbnail
                if (generatedThumbnailUrl) {
                    const sharpImage = await sharp(generatedThumbnailUrl);
                    //Generate thumbnail
                    thumbnail = await sharpImage.resize(cropSetting).toBuffer();
                    await fileSystem.unlink(generatedThumbnailUrl);
                }
            }
            const fileBody = fs.createReadStream(file.path);
            const s3Path = s3BasePath + file.filename;
            //Upload video and images
            const uploadedFile = await s3Service.putS3Object(fileBody, file.mimetype, s3Path);
            if (uploadedFile && uploadedFile.Key) {
                Object.assign(fileObject, {
                    sourceUrl: uploadedFile.Location,
                    s3Key: uploadedFile.Key
                });
                //Upload thumbnail
                if (thumbnail) {
                    let thumbnailPath = addStringBeforeExtension(uploadedFile.Key, `-${width}x${height}`);
                    let thumbnailMimeType = file.mimetype;

                    if (file && file.mimetype.startsWith('video/')) {
                        const thumbnailExtName = "png";
                        let thumbnailPathT = path.parse(uploadedFile.Key);
                        thumbnailPath = addStringBeforeExtension(`${thumbnailPathT.dir}/${thumbnailPathT.name}.${thumbnailExtName}`, `-${width}x${height}`);
                        thumbnailMimeType = `image/${thumbnailExtName}`;
                    }
                    const uploadedThumbnailFile = await s3Service.putS3Object(thumbnail, thumbnailMimeType, thumbnailPath);
                    if (uploadedThumbnailFile) {
                        Object.assign(fileObject, {
                            thumbnailUrl: uploadedThumbnailFile.Location,
                        });
                    }
                }
            }
            await fileSystem.unlink(file.path);
            fileList.push(fileObject)
        }));
    }
    return await Media.create(fileList);
}

async function deleteUnwantedFiles(files: Express.Multer.File[]) {
    try {
        let objectToDelete: IS3Object[] = [];
        await Promise.all(files.map(async (file) => {
            await fileSystem.unlink(file.path)
        }))
    } catch (error: any) {
        console.error(error)
    }

}


export { storeMedia, generateThumbnail, deleteUnwantedFiles }