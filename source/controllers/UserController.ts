import { addBusinessProfileInUser, Business, calculateProfileCompletion } from './../database/models/user.model';
import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpForbidden } from "../utils/response";
import User, { AccountType } from "../database/models/user.model";
import { ErrorMessage } from "../utils/response-message/error";
import { ObjectId } from "mongodb";

import BusinessProfile from "../database/models/businessProfile.model";
import BusinessDocument from '../database/models/businessDocument.model';
import BusinessQuestion from '../database/models/businessQuestion.model';
import { generateThumbnail } from './MediaController';

import { isArray } from '../utils/helper/basic';
import BusinessType from '../database/models/businessType.model';
import BusinessSubType from '../database/models/businessSubType.model';
import BusinessAnswer, { IBusinessAnswer } from '../database/models/businessAnswer.model';
const editProfile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { dialCode, phoneNumber, bio, acceptedTerms, website, name, gstn, email, businessTypeID, businessSubTypeID } = request.body;
        const { id } = request.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType === AccountType.BUSINESS) {
            user.acceptedTerms = acceptedTerms ?? user.acceptedTerms;
            const businessProfileRef = await BusinessProfile.findOne({ _id: user.businessProfileID });

            if (businessProfileRef) {
                businessProfileRef.bio = bio ?? businessProfileRef.bio;
                businessProfileRef.website = website ?? businessProfileRef.website;
                businessProfileRef.phoneNumber = phoneNumber ?? businessProfileRef.phoneNumber;
                businessProfileRef.dialCode = dialCode ?? businessProfileRef.dialCode;
                businessProfileRef.name = name ?? businessProfileRef.name;
                businessProfileRef.gstn = gstn ?? businessProfileRef.gstn;
                businessProfileRef.email = email ?? businessProfileRef.email;
                /**
                 * 
                 * Ensure the business or business sub type is exits or not
                 */
                if (businessTypeID && businessTypeID !== "" && businessSubTypeID && businessSubTypeID && businessSubTypeID !== "") {
                    const [businessType, businessSubType] = await Promise.all([
                        BusinessType.findOne({ _id: businessTypeID }),
                        BusinessSubType.findOne({ businessTypeID: businessTypeID, _id: businessSubTypeID })
                    ]);
                    if ((!businessType) || (!businessSubType)) {
                        return response.send(httpBadRequest('Either business type or business subtype not found'))
                    }
                    businessProfileRef.businessTypeID = businessTypeID ?? businessProfileRef.businessTypeID;
                    businessProfileRef.businessSubTypeID = businessSubTypeID ?? businessProfileRef.businessSubTypeID;
                }
                await businessProfileRef.save();
            }
            const savedUser = await user.save();
            return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef }, "Profile updated successfully"));
        } else {
            user.name = name ?? user.name;
            user.dialCode = dialCode ?? user.dialCode;
            user.phoneNumber = phoneNumber ?? user.phoneNumber;
            user.bio = bio ?? user.bio;
            user.acceptedTerms = acceptedTerms ?? user.acceptedTerms;
            const savedUser = await user.save();
            return response.send(httpOk(savedUser.hideSensitiveData(), "Profile updated successfully"));
        }

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const profile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const [user, profileCompleted] = await Promise.all([
            User.aggregate(
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
            ),
            calculateProfileCompletion(id)
        ])

        if (user.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }

        let responseData = { posts: 0, follower: 0, following: 0, profileCompleted, };
        if (accountType === AccountType.BUSINESS) {
            Object.assign(responseData, { ...user[0] })
        } else {
            Object.assign(responseData, { ...user[0] })
        }
        return response.send(httpOk(responseData, 'User profile fetched'));
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
        const body = request.body;
        let questionIDs: string[] = [];
        let answers: any[] = [];
        if (isArray(body)) {
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
            body.map((answerData: any) => {
                if (answerData.questionID && answerData.answer && answerData.answer.toLowerCase() === "yes") {
                    questionIDs.push(answerData.questionID);
                    answers.push({
                        questionID: answerData?.questionID,
                        answer: answerData?.answer,
                        businessProfileID: businessProfile._id
                    });
                } else {
                    answers.push({
                        questionID: answerData?.questionID,
                        answer: answerData?.answer,
                        businessProfileID: businessProfile._id
                    });
                }
            })
            const [businessQuestionAnswerIDs, businessAnswer] = await Promise.all([
                BusinessQuestion.distinct('_id', {
                    _id: { $in: questionIDs },
                    businessTypeID: { $in: [businessProfile.businessTypeID] }, businessSubtypeID: { $in: [businessProfile.businessSubTypeID] }
                }),
                //Remove old answer from db
                BusinessAnswer.deleteMany({ businessProfileID: businessProfile._id })
            ]);
            businessProfile.amenities = businessQuestionAnswerIDs as string[];
            //store new answer
            const savedAnswers = await BusinessAnswer.create(answers);
            const savedAmenity = await businessProfile.save();
            return response.send(httpOk(savedAmenity, "Business answer saved successfully"));
        } else {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Invalid request payload"), "Invalid request payload"))
        }
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { editProfile, profile, changeProfilePic, businessDocumentUpload, businessQuestionAnswer, };