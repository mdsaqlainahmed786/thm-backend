import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import { addStringBeforeExtension, isArray } from "../utils/helper/basic";
import { MongoID } from "../common";
import Media, { MediaType } from "../database/models/media.model";
import S3Service from "../services/S3Service";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { readVideoMetadata } from "../middleware/file-uploading";
import fs from "fs";
import { AwsS3AccessEndpoints } from "../config/constants";
import { generateScreenshot } from "../middleware/file-uploading";
import path from "path";
import fileSystem from "fs/promises";
import FileQueue, { QueueStatus } from "../database/models/fileProcessing.model";
import { ErrorMessage } from "../utils/response-message/error";
import View from "../database/models/view.model.";
import { httpInternalServerError, httpOk, httpAcceptedOrUpdated, httpNotFoundOr404, httpCreated, httpNoContent } from "../utils/response";
import Post, { PostType } from "../database/models/post.model";
const s3Service = new S3Service();
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
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


async function storeMedia(
  files: Express.MulterS3.File[],
  userID: MongoID,
  businessProfileID: MongoID | null,
  s3BasePath: string,
  uploadedFor: "POST" | "STORY"
) {
  if (!files || files.length === 0) return [];

  const mediaPayloads: any[] = [];

  for (const file of files) {
    const media: any = {
      businessProfileID,
      userID,
      fileName: file.originalname,
      fileSize: file.size,
      mediaType: "",
      mimeType: file.mimetype,
      width: 0,
      height: 0,
      duration: 0,
      sourceUrl: file.location,
      s3Key: file.key,
      thumbnailUrl: "",
    };

    const width = uploadedFor === "STORY" ? 1080 : 640;
    const height = uploadedFor === "STORY" ? 1980 : 640;
    const cropSetting = {
      width,
      height,
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    };

    let thumbnailBuffer: Buffer | null = null;

    // ---------------- IMAGE ----------------
    if (file.mimetype.startsWith("image/")) {
      media.mediaType = MediaType.IMAGE;

      const s3Object = await s3Service.getS3Object(file.key);
      const rawBuffer = await s3Object.Body?.transformToByteArray();
      if (!rawBuffer) throw new Error("Failed to read image buffer");

      const sharpImage = sharp(rawBuffer);
      const metadata = await sharpImage.metadata();

      if (metadata?.width && metadata?.height) {
        media.width = metadata.width;
        media.height = metadata.height;
      }

      thumbnailBuffer = await sharpImage.resize(cropSetting).toBuffer();
    }

    // ---------------- VIDEO ----------------
    if (file.mimetype.startsWith("video/")) {
      media.mediaType = MediaType.VIDEO;
      media.videoUrl = file.location;

      const metadata = await readVideoMetadata(file.key);
      if (metadata) {
        media.width = metadata.width;
        media.height = metadata.height;
        media.duration = metadata.duration;
      }

      const screenshotPath = await generateScreenshot(
        file.key,
        file.filename,
        "jpeg"
      );

      if (screenshotPath) {
        const sharpImage = sharp(screenshotPath);
        thumbnailBuffer = await sharpImage.resize(cropSetting).toBuffer();
        await fileSystem.unlink(screenshotPath).catch(() => {});
      }
    }

    // ---------------- PDF ----------------
    if (file.mimetype === "application/pdf") {
      media.mediaType = MediaType.PDF;
      media.thumbnailUrl =
        "https://thehotelmedia.com/public/files/thm-logo.png";
    }

    // ---------------- THUMBNAIL UPLOAD ----------------
    if (thumbnailBuffer) {
      let thumbKey = addStringBeforeExtension(
        file.key,
        `-${width}x${height}`
      ).replace(/\/{2,}/g, "/");

      const uploadedThumb = await s3Service.putS3Object(
        thumbnailBuffer,
        file.mimetype.startsWith("video/") ? "image/jpeg" : file.mimetype,
        thumbKey
      );

      if (uploadedThumb?.Location) {
        media.thumbnailUrl = uploadedThumb.Location;
      }
    }

    if (!media.thumbnailUrl) {
      media.thumbnailUrl =
        "https://thehotelmedia.com/public/files/thm-logo.png";
    }

    mediaPayloads.push(media);
  }

  // ✅ INSERT FIRST — MongoDB assigns REAL _id
  const createdMedia = await Media.create(mediaPayloads);

  // ✅ Create FileQueue ONLY after Media exists
  await Promise.all(
    createdMedia
      .filter((m: any) => m.mediaType === MediaType.VIDEO)
      .map((m: any) =>
        FileQueue.create({
          s3Key: m.s3Key,
          mediaID: m._id,
        })
      )
  );

  return createdMedia;
}



async function deleteUnwantedFiles(files: Express.Multer.File[]) {
  try {
    await Promise.all(files.map(async (file) => {
      // await fileSystem.unlink(file.path)
    }))
  } catch (error: any) {
    console.error(error)
  }

}

const storeViews = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { id, accountType, businessProfileID } = request.user;
    const { postID, mediaID } = request.body;
    const [post, isViewed, media] = await Promise.all([
      Post.findOne({ _id: postID, media: { $in: [new ObjectId(mediaID)] } }),
      View.findOne({ postID: postID, mediaID: mediaID, userID: id }),
      Media.findOne({ _id: mediaID })
    ])
    if (!post) {
      return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post media not found."), "Post media found."));
    }
    if (!media || media && media.mediaType !== MediaType.VIDEO) {
      return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post media not found."), "Post media found."));
    }
    if (!isViewed) {
      const newView = new View();
      newView.userID = id;
      newView.postID = postID;
      newView.mediaID = mediaID;
      newView.businessProfileID = businessProfileID ?? null;
      const savedView = await newView.save();
      return response.send(httpCreated(savedView, "View saved successfully"));
    }
    return response.send(httpNoContent(isViewed, 'View saved successfully'));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
}

export { storeMedia, generateThumbnail, deleteUnwantedFiles }
export default { storeViews }
