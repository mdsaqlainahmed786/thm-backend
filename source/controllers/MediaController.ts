
import sharp from "sharp";
import { getS3Object } from "../middleware/file-uploading";
import { addStringBeforeExtension } from "../utils/helper/basic";
import { putS3Object } from "../middleware/file-uploading";
import S3Object, { IS3Object } from "../database/models/s3Object.model";
import { MongoID } from "../common";
import Media, { MediaType } from "../database/models/media.model";
async function generateThumbnail(media: Express.Multer.S3File, thumbnailFor: "video" | "image", width: number, height: number) {
    const s3Image = await getS3Object(media.key);
    const cropSetting: {} = { width: width, height: height, fit: "cover" };
    if (s3Image.Body && media.mimetype.startsWith('image/') && thumbnailFor === "image") {
        const body = s3Image.Body;
        const rawToByteArray = await body.transformToByteArray();
        const sharpImage = await sharp(rawToByteArray);
        // const metadata = await sharpImage.metadata();
        const thumbnail = await sharpImage.resize(cropSetting).toBuffer();
        const thumbnailPath = addStringBeforeExtension(media.key, `-${width}x${height}`)
        const s3Upload = await putS3Object(thumbnail, media.mimetype, thumbnailPath);
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


async function storeMedia(files: Express.Multer.S3File[], userID: MongoID, businessProfileID: MongoID | null, type: MediaType) {
    let fileList: any[] = [];
    files && files.map((file) => {
        fileList.push({
            businessProfileID: businessProfileID,
            userID: userID,
            fileName: file.originalname,
            width: 0,
            height: 0,
            fileSize: file.size,
            mediaType: type,
            mimeType: file.mimetype,
            sourceUrl: file.location,
            s3Key: file.key,
        })
    })
    return await Media.create(fileList);
}

async function deleteUnwantedFiles(files: Express.Multer.S3File[]) {
    try {
        let objectToDelete: IS3Object[] = [];
        files.map((file) => {
            objectToDelete.push({
                key: file.key,
                location: file.location,
                delete: true,
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
            })
        })
        await S3Object.create(objectToDelete);
    } catch (error: any) {
        console.error(error)
    }

}


export { storeMedia, generateThumbnail, deleteUnwantedFiles }