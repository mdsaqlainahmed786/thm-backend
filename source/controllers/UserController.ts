import path from "path";
import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import sharp from "sharp";
import fs from "fs/promises"
import { PUBLIC_DIR } from "../middleware/file-uploading";
import { v4 } from "uuid";
import User, { AccountType } from "../database/models/user.model";
import { ErrorMessage } from "../utils/response-message/error";
import { ObjectId } from "mongodb";
import { getS3Object, putS3Object } from "../middleware/file-uploading";
import { addStringBeforeExtension } from "../utils/helper/basic";
import BusinessProfile from "../database/models/businessProfile.model";
const editProfile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { fullName, dialCode, phoneNumber, bio } = request.body;
        const { id } = request.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        user.fullName = fullName ?? user.fullName;
        user.dialCode = dialCode ?? user.dialCode;
        user.phoneNumber = phoneNumber ?? user.phoneNumber;
        user.bio = bio ?? user.bio;
        const savedUser = await user.save();
        return response.send(httpOk(savedUser, "Profile updated successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const profile = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.user;
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new ObjectId(id)
                }
            },
            {
                '$lookup': {
                    'from': 'businessprofiles',
                    'let': { 'businessProfileID': '$businessProfileID' },
                    'pipeline': [
                        { '$match': { '$expr': { '$eq': ['$_id', '$$businessProfileID'] } } },
                        {
                            $project: {
                                createdAt: 0,
                                updatedAt: 0,
                                __v: 0,
                            }
                        }
                    ],
                    'as': 'businessProfilesRef'
                }
            },
            {
                '$unwind': {
                    'path': '$businessProfilesRef',
                    'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                }
            },
            {
                $limit: 1,
            },
            {
                $project: {
                    otp: 0,
                    password: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            }
        ]
    )
    if (user.length === 0) {
        return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
    }
    return response.send(httpOk(user[0], 'User profile fetched'))
}
const changeProfilePic = async (request: Request, response: Response, next: NextFunction) => {
    const { id, accountType } = request.user;

    const user = await User.findOne({ _id: id });
    if (!user) {
        return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
    }
    const files = request.files as { [fieldname: string]: Express.Multer.File[] };
    const images = files.profilePic as Express.Multer.S3File[];
    if (images && images && images.length !== 0) {
        const image = images[0];
        const smallThumb = await generateThumbnail(image, "image", 200, 200);
        const mediumThumb = await generateThumbnail(image, "image", 480, 480);
        if (accountType === AccountType.BUSINESS && smallThumb && smallThumb.Location && mediumThumb && mediumThumb.Location && image && image.location) {
            const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send(httpOk(ErrorMessage.invalidRequest("Business profile not found"), 'Business profile not found'))
            }
            businessProfile.profilePic = { small: smallThumb.Location, medium: mediumThumb.Location, large: image.location };
            const savedBusinessProfile = await businessProfile.save();
            user.hasProfilePicture = true;
            const savedUser = await user.save();
            return response.send(httpOk(savedBusinessProfile, "Profile picture changed successfully"))
        }
        if (smallThumb && smallThumb.Location && mediumThumb && mediumThumb.Location && image && image.location) {
            user.profilePic = { small: smallThumb.Location, medium: mediumThumb.Location, large: image.location }
            user.hasProfilePicture = true;
            const savedUser = await user.save();
            return response.send(httpOk(savedUser, "Profile picture changed successfully"))
        }
        return response.send({ image, smallThumb, mediumThumb });
    } else {
        return response.send(httpBadRequest(ErrorMessage.invalidRequest("Please upload profile image"), "Please upload profile image"))
    }
}
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
export default { editProfile, profile, changeProfilePic };