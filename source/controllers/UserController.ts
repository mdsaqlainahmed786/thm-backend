import { addBusinessProfileInUser, calculateProfileCompletion, getUserProfile, getUserPublicProfile } from './../database/models/user.model';
import { Request, Response, NextFunction } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpForbidden, httpOkExtended, httpCreated, httpNoContent, httpAcceptedOrUpdated } from "../utils/response";
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
import BusinessAnswer from '../database/models/businessAnswer.model';
import Post, { fetchPosts, PostType } from '../database/models/post.model';
import UserConnection, { ConnectionStatus } from '../database/models/userConnection.model';
import { parseQueryParam } from '../utils/helper/basic';
import Like from '../database/models/like.model';
import SavedPost from '../database/models/savedPost.model';
import Media, { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import { storeMedia } from './MediaController';
import { deleteUnwantedFiles } from './MediaController';
import PropertyPictures from '../database/models/propertyPicture.model';
import { AppConfig, AwsS3AccessEndpoints } from '../config/constants';
import { CookiePolicy } from '../config/constants';
import BlockedUser from '../database/models/blockedUser.model';
import EventJoin from '../database/models/eventJoin.model';
import UserAddress from '../database/models/user-address.model';
import { SuccessMessage } from '../utils/response-message/success';
const editProfile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { dialCode, phoneNumber, bio, acceptedTerms, website, name, gstn, email, businessTypeID, businessSubTypeID, privateAccount, notificationEnabled } = request.body;
        const { id } = request.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType === AccountType.BUSINESS) {
            user.acceptedTerms = acceptedTerms ?? user.acceptedTerms;
            user.privateAccount = privateAccount ?? user.privateAccount;
            user.notificationEnabled = notificationEnabled ?? user.notificationEnabled;
            const businessProfileRef = await BusinessProfile.findOne({ _id: user.businessProfileID });

            if (businessProfileRef) {
                businessProfileRef.bio = bio ?? businessProfileRef.bio;
                businessProfileRef.website = website ?? businessProfileRef.website;
                businessProfileRef.phoneNumber = phoneNumber ?? businessProfileRef.phoneNumber;
                businessProfileRef.dialCode = dialCode ?? businessProfileRef.dialCode;
                businessProfileRef.name = name ?? businessProfileRef.name;
                businessProfileRef.gstn = gstn ?? businessProfileRef.gstn;
                businessProfileRef.email = email ?? businessProfileRef.email;
                businessProfileRef.privateAccount = privateAccount ?? businessProfileRef.privateAccount;
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
            return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef }, SuccessMessage.PROFILE_UPDATE));
        } else {
            user.name = name ?? user.name;
            user.dialCode = dialCode ?? user.dialCode;
            user.phoneNumber = phoneNumber ?? user.phoneNumber;
            user.bio = bio ?? user.bio;
            user.acceptedTerms = acceptedTerms ?? user.acceptedTerms;
            user.privateAccount = privateAccount ?? user.privateAccount;
            user.notificationEnabled = notificationEnabled ?? user.notificationEnabled;
            const savedUser = await user.save();
            return response.send(httpOk(savedUser.hideSensitiveData(), SuccessMessage.PROFILE_UPDATE));
        }

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const profile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const [user, profileCompleted, posts, follower, following, userAddress] = await Promise.all([
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
            calculateProfileCompletion(id),
            Post.find({ userID: id }).countDocuments(),
            UserConnection.find({ following: id, status: ConnectionStatus.ACCEPTED }).countDocuments(),
            UserConnection.find({ follower: id, status: ConnectionStatus.ACCEPTED }).countDocuments(),
            UserAddress.findOne({ userID: id })
        ]);
        if (user.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }
        let responseData = { posts: posts, follower: follower, following: following, profileCompleted, address: userAddress };
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
const publicProfile = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const userID = request.params.id;
        const [user, posts, follower, following, myConnection, isBlocked] = await getUserPublicProfile(userID, id);
        if (user.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }
        let responseData = { posts: posts, follower: follower, following: following };
        if (accountType === AccountType.BUSINESS) {
            Object.assign(responseData, { ...user[0], isConnected: myConnection?.status === ConnectionStatus.ACCEPTED ? true : false, isRequested: myConnection?.status === ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false });
        } else {
            Object.assign(responseData, { ...user[0], isConnected: myConnection?.status === ConnectionStatus.ACCEPTED ? true : false, isRequested: myConnection?.status === ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false });
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
                return response.send(httpOk(savedBusinessProfile, SuccessMessage.PROFILE_UPDATE))
            }
            if (smallThumb && smallThumb.Location && mediumThumb && mediumThumb.Location && image && image.location) {
                user.profilePic = { small: smallThumb.Location, medium: mediumThumb.Location, large: image.location }
                user.hasProfilePicture = true;
                const savedUser = await user.save();
                return response.send(httpOk(savedUser, SuccessMessage.PROFILE_UPDATE))
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
        const { action } = request.body;
        console.log(action)
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
        if (!action && action !== "update") {
            if (!(businessRegistration && files && businessRegistration.length !== 0)) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Please upload business registration certificate"), "Please upload business registration certificate"));
            }
            if (!(addressProof && files && addressProof.length !== 0)) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Please upload address proof"), "Please upload address proof"));
            }
        }
        const document = await BusinessDocument.findOne({ businessProfileID: user.businessProfileID });
        if (!document) {
            const newBusinessDocument = new BusinessDocument();
            newBusinessDocument.businessProfileID = user.businessProfileID;
            newBusinessDocument.businessRegistration = businessRegistration[0].location;
            newBusinessDocument.addressProof = addressProof[0].location;
            const savedBusinessProfile = await newBusinessDocument.save();
            return response.send(httpOk(savedBusinessProfile, 'Business document uploaded.'));
        }
        if (action && action === "update") {
            if (files && businessRegistration && businessRegistration.length !== 0) {
                document.businessRegistration = businessRegistration[0].location;
            }
            if (files && addressProof && addressProof.length !== 0) {
                document.addressProof = addressProof[0].location;
            }
        }
        const savedDocument = await document.save();
        return response.send(httpOk(savedDocument, 'Business document updated.'))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const businessDocument = async (request: Request, response: Response, next: NextFunction) => {
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
        const businessDocuments = await BusinessDocument.find({ businessProfileID: user.businessProfileID });
        return response.send(httpOk(businessDocuments, 'Business document fetched.'));
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

const userPosts = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const userID = request.params.id;
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        const dbQuery = { isPublished: true, userID: new ObjectId(userID) };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const [user, inMyFollowing, likedByMe, savedByMe, joiningEvents] = await Promise.all(
            [
                User.findOne({ _id: userID }),
                UserConnection.findOne({ following: userID, follower: id, status: ConnectionStatus.ACCEPTED }),
                Like.distinct('postID', { userID: id, postID: { $ne: null } }),
                SavedPost.distinct('postID', { userID: id, postID: { $ne: null } }),
                EventJoin.distinct('postID', { userID: id, postID: { $ne: null } }),
            ]
        );
        if (!id || !user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("This account is Private. Follow this account to see their photos and videos."), "This account is Private. Follow this account to see their photos and videos."))
        }
        const [documents, totalDocument] = await Promise.all([
            fetchPosts(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit),
            Post.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'User feed fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const userPostMedia = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const userID = request.params.id;
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const [user, inMyFollowing, mediaIDs, propertyPictures] = await Promise.all(
            [
                User.findOne({ _id: userID }),
                UserConnection.findOne({ following: userID, follower: id, status: ConnectionStatus.ACCEPTED }),
                Post.distinct('media', { isPublished: true, userID: new ObjectId(userID) }),
                PropertyPictures.distinct('mediaID', { userID: new ObjectId(userID) })
            ]
        );
        if (!id || !user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("This account is Private. Follow this account to see their photos and videos."), "This account is Private. Follow this account to see their photos and videos."))
        }
        const dbQuery = { _id: { $in: [...mediaIDs, ...propertyPictures] }, };
        //Return only videos if requested by the user through the videos endpoint
        if (new RegExp("/user/videos/").test(request.originalUrl)) {
            Object.assign(dbQuery, { mediaType: MediaType.VIDEO });
        }
        //Return only images if requested by the user through the images endpoint
        if (new RegExp("/user/images/").test(request.originalUrl)) {
            Object.assign(dbQuery, { mediaType: MediaType.IMAGE });
        }
        const [documents, totalDocument] = await Promise.all([
            Media.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
                {
                    $project: {
                        _id: 1,
                        mediaType: 1,
                        mimeType: 1,
                        sourceUrl: 1,
                    }
                }

            ]),
            Media.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'User media fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const userReviews = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const userID = request.params.id;
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;

        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const [user, inMyFollowing, likedByMe, savedByMe, joiningEvents] = await Promise.all(
            [
                User.findOne({ _id: userID }),
                UserConnection.findOne({ following: userID, follower: id, status: ConnectionStatus.ACCEPTED }),
                Like.distinct('postID', { userID: id, postID: { $ne: null } }),
                SavedPost.distinct('postID', { userID: id, postID: { $ne: null } }),
                EventJoin.distinct('postID', { userID: id, postID: { $ne: null } }),
            ]
        );
        if (!id || !user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("This account is Private. Follow this account to see their photos and videos."), "This account is Private. Follow this account to see their photos and videos."))
        }
        if (!user.businessProfileID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        const dbQuery = { isPublished: true, reviewedBusinessProfileID: user.businessProfileID, postType: PostType.REVIEW };
        const [documents, totalDocument] = await Promise.all([
            fetchPosts(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit),
            Post.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Business reviews fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const businessPropertyPictures = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;

        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.images as Express.Multer.S3File[];

        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!images) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Content is required for creating a post"), 'Content is required for creating a post'))
        }
        if (accountType !== AccountType.BUSINESS && !businessProfileID) {
            await deleteUnwantedFiles(images);
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."));
        }
        /**
         * Handle media
         */
        let newPropertyPictures: {
            userID: MongoID;
            businessProfileID?: MongoID;
            mediaID: MongoID;
        }[] = []
        if (images && images.length !== 0) {
            const imageList = await storeMedia(images, id, null, MediaType.IMAGE, AwsS3AccessEndpoints.BUSINESS_PROPERTY, 'POST');
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => newPropertyPictures.push({
                    userID: id,
                    mediaID: image.id,
                    businessProfileID: businessProfileID
                }));
            }
        }
        console.log(newPropertyPictures);
        const propertyPictures = await PropertyPictures.create(newPropertyPictures);
        return response.send(httpCreated(propertyPictures, 'Property pictures uploaded successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const tagPeople = async (request: Request, response: Response, next: NextFunction) => {
    try {

        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const [inMyFollower] = await Promise.all(
            [
                UserConnection.distinct('follower', { following: id, status: ConnectionStatus.ACCEPTED })
            ]
        );
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const dbQuery: any[] = []
        if (query !== undefined && query !== "") {
            //Search business profile
            const businessProfileIDs = await BusinessProfile.distinct('_id', {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
            dbQuery.push({
                $or: [
                    { _id: { $in: inMyFollower }, name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { _id: { $in: inMyFollower }, username: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") }, privateAccount: false },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") }, privateAccount: false },
                    { businessProfileID: { $in: businessProfileIDs }, privateAccount: false }
                ]
            })
        } else {
            dbQuery.push({ _id: { $in: inMyFollower } })
            dbQuery.push({ privateAccount: false, })
        }
        const [documents, totalDocument] = await Promise.all([
            getUserProfile({
                $or: dbQuery
            }, pageNumber, documentLimit),
            User.find({
                $or: dbQuery
            }).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Tagged fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const deactivateAccount = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        user.isActivated = false;
        await user.save();
        // You can reactivate it anytime by logging back in.
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.DEVICE_ID_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_KEY, CookiePolicy);
        return response.send(httpNoContent(null, 'Your account has been successfully deactivated. We\'re sorry to see you go!'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const deleteAccount = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        user.isDeleted = true;
        await user.save();
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.DEVICE_ID_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_KEY, CookiePolicy);
        return response.send(httpNoContent(null, 'Your account will be permanently deleted in 30 days. You can reactivate it within this period if you change your mind.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const blockUser = async (request: Request, response: Response, next: NextFunction) => {
    try {


        const ID = request.params.id;
        const { id, accountType, businessProfileID } = request.user;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [user, isBlocked, inMyFollowing] = await Promise.all([
            User.findOne({ _id: ID }),
            BlockedUser.findOne({ blockedUserID: ID, userID: id }),
            UserConnection.findOne({ following: ID, follower: id, status: ConnectionStatus.ACCEPTED }),
        ])
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!isBlocked) {
            const newBlockedUser = new BlockedUser();
            newBlockedUser.userID = id;
            newBlockedUser.blockedUserID = ID;
            newBlockedUser.businessProfileID = businessProfileID ?? null;
            if (inMyFollowing) {
                await inMyFollowing.deleteOne();
            }
            const savedLike = await newBlockedUser.save();
            return response.send(httpCreated(savedLike, "User blocked successfully"));
        }
        await isBlocked.deleteOne();
        return response.send(httpNoContent(null, 'User unblocked successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
//TODO remove deleted and disabled user
const blockedUsers = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const userIDs = await BlockedUser.distinct('blockedUserID', { userID: id });
        const dbQuery = { _id: { $in: userIDs } };
        const [documents, totalDocument] = await Promise.all([
            getUserProfile(dbQuery, pageNumber, documentLimit),
            User.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Tagged fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const address = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { street, city, state, zipCode, country, phoneNumber, dialCode, lat, lng } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (accountType === AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: You can't update your billing address. Please contact admin support."), "Access denied: You can't update your billing address. Please contact admin support."))
        }
        const address = await UserAddress.findOne({ userID: id });
        if (address) {
            address.street = street;
            address.city = city;
            address.state = state;
            address.zipCode = zipCode;
            address.country = country;
            address.phoneNumber = phoneNumber;
            address.dialCode = dialCode;
            address.userID = id;
            address.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
            address.lat = lat;
            address.lng = lng;
            const savedUserAddress = await address.save();
            return response.send(httpAcceptedOrUpdated(savedUserAddress, 'Billing address updated successfully.'))
        }
        const newUserAddress = new UserAddress();
        newUserAddress.street = street;
        newUserAddress.city = city;
        newUserAddress.state = state;
        newUserAddress.zipCode = zipCode;
        newUserAddress.country = country;
        newUserAddress.phoneNumber = phoneNumber;
        newUserAddress.dialCode = dialCode;
        newUserAddress.userID = id;
        newUserAddress.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        newUserAddress.lat = lat;
        newUserAddress.lng = lng;
        const savedUserAddress = await newUserAddress.save();
        return response.send(httpCreated(savedUserAddress, 'Billing address added successfully.'))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { editProfile, profile, publicProfile, changeProfilePic, businessDocumentUpload, businessDocument, businessQuestionAnswer, userPosts, userPostMedia, userReviews, businessPropertyPictures, tagPeople, deactivateAccount, deleteAccount, blockUser, blockedUsers, address };