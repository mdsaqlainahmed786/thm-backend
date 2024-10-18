import { Request, Response, NextFunction } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpOkExtended, httpNotFoundOr404, httpForbidden } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessQuestion from "../database/models/businessQuestion.model";
import { parseQueryParam } from "../utils/helper/basic";
import Post, { fetchPosts, } from "../database/models/post.model";
import Like from "../database/models/like.model";
import SavedPost from "../database/models/savedPost.model";
import BusinessProfile from "../database/models/businessProfile.model";
import UserConnection from "../database/models/userConnection.model";
import { AccountType } from "../database/models/user.model";
import { ConnectionStatus } from "../database/models/userConnection.model";
import { Type } from "../validation/rules/api-validation";
import WebsiteRedirection from "../database/models/websiteRedirection.model";
import Story, { addMediaInStory } from "../database/models/story.model";
import { ObjectId } from "mongodb";
import BusinessQuestionSeeder from "../database/seeders/BusinessQuestionSeeder";
import BusinessReviewQuestion from "../database/models/businessReviewQuestion.model";
import BusinessTypeSeeder from "../database/seeders/BusinessTypeSeeder";
import BusinessSubtypeSeeder from "../database/seeders/BusinessSubtypeSeeder";
import PromoCodeSeeder from "../database/seeders/PromoCodeSeeder";
import ReviewQuestionSeeder from "../database/seeders/ReviewQuestionSeeder";
import FAQSeeder from "../database/seeders/FAQSeeder";
const feed = async (request: Request, response: Response, next: NextFunction) => {
    try {
        //Only shows public profile post here and follower posts
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        const dbQuery = { isPublished: true };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (query !== undefined && query !== "") {
        }
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [likedByMe, savedByMe] = await Promise.all([
            Like.distinct('postID', { userID: id, postID: { $ne: null } }),
            SavedPost.distinct('postID', { userID: id, postID: { $ne: null } })
        ]);
        const [documents, totalDocument] = await Promise.all([
            fetchPosts(dbQuery, likedByMe, savedByMe, pageNumber, documentLimit),
            Post.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Home feed fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const businessTypes = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const businessTypes = await BusinessType.find();
        return response.send(httpOk(businessTypes, "Business type fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const businessSubTypes = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request.params.id;
        const businessTypes = await BusinessSubType.find({ businessTypeID: ID });
        return response.send(httpOk(businessTypes, "Business subtype fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const businessQuestions = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { businessSubtypeID, businessTypeID } = request.body;
        const businessQuestions = await BusinessQuestion.find({ businessTypeID: { $in: [businessTypeID] }, businessSubtypeID: { $in: [businessSubtypeID] } }, '_id question answer').sort({ order: 1 }).limit(6);
        return response.send(httpOk(businessQuestions, "Business questions fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const dbSeeder = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const promoCodeSeeder = new PromoCodeSeeder();
        const shouldRunPromoCodeSeeder = await promoCodeSeeder.shouldRun();
        if (shouldRunPromoCodeSeeder) {
            await promoCodeSeeder.run();
        }
        const businessTypeSeeder = new BusinessTypeSeeder();
        const shouldRunBusinessTypeSeeder = await businessTypeSeeder.shouldRun();
        if (shouldRunBusinessTypeSeeder) {
            await businessTypeSeeder.run();
        }
        const businessSubtypeSeeder = new BusinessSubtypeSeeder();
        const shouldRunBusinessSubtypeSeeder = await businessSubtypeSeeder.shouldRun();
        if (shouldRunBusinessSubtypeSeeder) {
            await businessSubtypeSeeder.run();
        }
        const businessQuestionSeeder = new BusinessQuestionSeeder();
        const shouldRunBusinessQuestionSeeder = await businessQuestionSeeder.shouldRun();
        if (shouldRunBusinessQuestionSeeder) {
            await businessQuestionSeeder.run();
        }
        const reviewQuestionSeeder = new ReviewQuestionSeeder();
        const shouldRunReviewQuestionSeeder = await reviewQuestionSeeder.shouldRun();
        if (shouldRunReviewQuestionSeeder) {
            await reviewQuestionSeeder.run();
        }
        const faqSeeder = new FAQSeeder();
        const shouldRunFAQSeeder = await faqSeeder.shouldRun();
        if (shouldRunFAQSeeder) {
            await faqSeeder.run();
        }
        return response.send(httpOk(null, "Done"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }

}

const getBusinessByPlaceID = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { placeID } = request.params;
        const businessProfileRef = await BusinessProfile.findOne({ placeID: placeID }, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            const googleKey = "AIzaSyCp-X-z5geFn-8CBipvx310nH_VEaIbxlo";
            const apiResponse = await (await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeID}&key=${googleKey}`)).json();
            if (apiResponse.status === "OK") {
                const data = apiResponse.result;
                const name = data?.name ?? "";
                const lat = data?.geometry?.location?.lat ?? 0;
                const lng = data?.geometry?.location?.lng ?? 0;

                const photoReference = data?.photos && data?.photos?.length !== 0 ? data?.photos?.[0]?.photo_reference : null;
                let street = "";
                let city = "";
                let state = "";
                let zipCode = "";
                let country = "";
                const address_components = data?.address_components as { long_name: string, short_name: string, types: string[] }[];
                address_components.map((component) => {
                    const types = component.types;
                    if (types.includes('street_number') || types.includes('route') || types.includes("neighborhood") || types.includes("sublocality")) {
                        street = component.long_name;
                    } else if (types.includes('locality')) {
                        city = component.long_name;
                    } else if (types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    } else if (types.includes('postal_code')) {
                        zipCode = component.long_name;
                    }
                    else if (types.includes('country')) {
                        country = component.short_name;
                    }
                });
                let coverImage = "";
                if (photoReference) {
                    coverImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}`;
                }
                const businessProfileRef = {
                    "profilePic": {
                        "small": coverImage,
                        "medium": coverImage,
                        "large": coverImage
                    },
                    // "businessTypeID": "66f6859833d7970343e8ae21",
                    // "businessSubTypeID": "66f6859933d7970343e8ae47",
                    "name": name,
                    "address": {
                        "geoCoordinate": {
                            "type": "Point",
                            "coordinates": [
                                lng,
                                lat
                            ]
                        },
                        "street": street,
                        "city": city,
                        "state": state,
                        "zipCode": zipCode,
                        "country": country,
                        "lat": lat,
                        "lng": lng
                    },
                    "coverImage": coverImage,
                }
                const reviewQuestions: any[] = [];
                return response.send(httpOk({
                    businessProfileRef,
                    reviewQuestions
                }, "Business profile fetched"));
            }
            return response.send(httpInternalServerError(null, ErrorMessage.INTERNAL_SERVER_ERROR));
        }
        const reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: businessProfileRef.businessTypeID }, businessSubtypeID: { $in: businessProfileRef.businessSubTypeID } }, '_id question id')
        return response.send(httpOk({
            businessProfileRef,
            reviewQuestions
        }, "Business profile fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const insights = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."))
        }
        const [totalFollowers, websiteRedirection, stories, posts] = await Promise.all([
            UserConnection.find({ following: id, status: ConnectionStatus.ACCEPTED }).countDocuments(),
            WebsiteRedirection.find({ businessProfileID: businessProfileID }).countDocuments(),
            Story.aggregate([
                {
                    $match: { userID: new ObjectId(id), }
                },
                addMediaInStory().lookup,
                addMediaInStory().unwindLookup,
                addMediaInStory().replaceRootAndMergeObjects,
                addMediaInStory().project,
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $limit: 10
                }
            ]).exec(),
            fetchPosts({ userID: new ObjectId(id), }, [], [], 1, 10)
        ]);
        const responseData = {
            dashboard: {
                accountReached: 0,
                websiteRedirection,
                totalFollowers,
                engaged: 0,
            },
            data: [],
            stories: stories,
            posts: posts
        }
        return response.send(httpOk(responseData, 'Insights fetched'))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const collectData = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const myBusinessProfile = request.user.businessProfileID;
        const { type, businessProfileID } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        // if (accountType !== AccountType.BUSINESS) {
        //     return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."))
        // }
        if (businessProfileID.toString() === myBusinessProfile.toString()) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("The target Business Profile ID you entered matches your existing Business Profile ID. Please select a different target ID."), "The target Business Profile ID you entered matches your existing Business Profile ID. Please select a different target ID."))
        }
        switch (type) {
            case Type.WEBSITE_REDIRECTION:
                const business = await BusinessProfile.findOne({ _id: businessProfileID });
                if (!business) {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
                }
                if (!business.website) {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest("Website link not found"), "Website linkk not found"))
                }
                const newRedirecation = new WebsiteRedirection();
                newRedirecation.userID = id;
                newRedirecation.businessProfileID = business.id;
                await newRedirecation.save();
                return response.send(httpOk(newRedirecation, "Data collected"));
        }
        return response.send("");
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { feed, businessTypes, businessSubTypes, businessQuestions, dbSeeder, getBusinessByPlaceID, insights, collectData };