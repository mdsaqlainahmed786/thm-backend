import { addBusinessProfileInUser, Business } from './../database/models/user.model';
import path from "path";
import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpForbidden } from "../utils/response";
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
import BusinessDocument from '../database/models/businessDocument.model';
import BusinessQuestion from '../database/models/businessQuestion.model';
import Subscription from '../database/models/subscription.model';
const editProfile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { fullName, dialCode, phoneNumber, bio } = request.body;
        const { id } = request.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType === AccountType.BUSINESS) {

        } else {
            user.fullName = fullName ?? user.fullName;
            user.dialCode = dialCode ?? user.dialCode;
            user.phoneNumber = phoneNumber ?? user.phoneNumber;
            user.bio = bio ?? user.bio;
        }
        const savedUser = await user.save();
        return response.send(httpOk(savedUser.hideSensitiveData(), "Profile updated successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const profile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const user = await User.aggregate(
            [
                {
                    $match: {
                        _id: new ObjectId(id)
                    }
                },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
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
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }

}
const changeProfilePic = async (request: Request, response: Response, next: NextFunction) => {

    try {
        const { id, accountType } = request.user;

        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.profilePic as Express.Multer.S3File[];
        if (images && images && images.length !== 0) {
            const image = images[0];
            const smallThumb = await generateThumbnail(image, "image", 200, 200);
            const mediumThumb = await generateThumbnail(image, "image", 480, 480);
            if (accountType === AccountType.BUSINESS && smallThumb && smallThumb.Location && mediumThumb && mediumThumb.Location && image && image.location) {
                const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
                if (!businessProfile) {
                    return response.send(httpOk(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
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
        }
        else {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Please upload profile image"), "Please upload profile image"))
        }
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }


}

const businessDocumentUpload = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access Denied! You don't have business account"), "Access Denied! You don't have business account"))
        }
        if (!user.businessProfileID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const businessRegistration = files && files.businessRegistration as Express.Multer.S3File[];
        const addressProof = files && files.addressProof as Express.Multer.S3File[];
        if (!(businessRegistration && files && businessRegistration.length !== 0)) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Please upload business registration certificate"), "Please upload business registration certificate"));
        }
        if (!(addressProof && files && addressProof.length !== 0)) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Please upload address proof"), "Please upload address proof"));
        }
        const newBusinessDocument = new BusinessDocument();
        newBusinessDocument.businessProfileID = user.businessProfileID;
        newBusinessDocument.businessRegistration = businessRegistration[0].location;
        newBusinessDocument.addressProof = addressProof[0].location;
        const savedBusinessProfile = await newBusinessDocument.save();
        return response.send(httpOk(savedBusinessProfile, 'Business document uploaded.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const businessQuestionAnswer = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { questionsIDs } = request.body;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access Denied! You don't have business account"), "Access Denied! You don't have business account"))
        }
        if (!user.businessProfileID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
        if (!businessProfile) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const [businessQuestionAnswerIDs] = await Promise.all([
            BusinessQuestion.distinct('_id', {
                _id: { $in: questionsIDs },
                businessTypeID: { $in: [businessProfile.businessTypeID] }, businessSubtypeID: { $in: [businessProfile.businessSubTypeID] }
            }),
        ]);
        businessProfile.amenities = businessQuestionAnswerIDs as string[];
        const savedAmenity = await businessProfile.save();
        return response.send(httpOk(savedAmenity, "Business answer saved successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
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
export default { editProfile, profile, changeProfilePic, businessDocumentUpload, businessQuestionAnswer, };