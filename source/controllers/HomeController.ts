
import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpOkExtended, httpNotFoundOr404, httpForbidden } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessQuestion from "../database/models/businessQuestion.model";
import { parseQueryParam, randomColor } from "../utils/helper/basic";
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
import BusinessTypeSeeder, { BusinessTypes } from "../database/seeders/BusinessTypeSeeder";
import BusinessSubtypeSeeder from "../database/seeders/BusinessSubtypeSeeder";
import PromoCodeSeeder from "../database/seeders/PromoCodeSeeder";
import ReviewQuestionSeeder from "../database/seeders/ReviewQuestionSeeder";
import FAQSeeder from "../database/seeders/FAQSeeder";
import Order, { OrderStatus } from "../database/models/order.model";
import EventJoin from "../database/models/eventJoin.model";
import { AppConfig } from "../config/constants";
import moment from "moment";
import AccountReach from "../database/models/accountReach.model";
import User from "../database/models/user.model";
import Comment from "../database/models/comment.model";
import SharedContent from "../database/models/sharedContent.model";
import { BusinessType as BusinessTypeEnum } from "../database/seeders/BusinessTypeSeeder";
import EncryptionService from "../services/EncryptionService";
import sharp from 'sharp';
const encryptionService = new EncryptionService();
const feed = async (request: Request, response: Response, next: NextFunction) => {
    try {
        //Only shows public profile post here and follower posts
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        const dbQuery = { isPublished: true, isDeleted: false };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (query !== undefined && query !== "") {
        }
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [likedByMe, savedByMe, joiningEvents] = await Promise.all([
            Like.distinct('postID', { userID: id, postID: { $ne: null } }),
            SavedPost.distinct('postID', { userID: id, postID: { $ne: null } }),
            EventJoin.distinct('postID', { userID: id, postID: { $ne: null } }),
        ]);
        const [documents, totalDocument] = await Promise.all([
            fetchPosts(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit),
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
        const hostAddress = request.protocol + "://" + request.get("host");
        const promoCodeSeeder = new PromoCodeSeeder();
        const shouldRunPromoCodeSeeder = await promoCodeSeeder.shouldRun();
        if (shouldRunPromoCodeSeeder) {
            await promoCodeSeeder.run();
        }
        const businessTypeSeeder = new BusinessTypeSeeder(hostAddress);
        const shouldRunBusinessTypeSeeder = await businessTypeSeeder.shouldRun();
        if (shouldRunBusinessTypeSeeder) {
            await businessTypeSeeder.run();
        }
        const businessSubtypeSeeder = new BusinessSubtypeSeeder();
        const shouldRunBusinessSubtypeSeeder = await businessSubtypeSeeder.shouldRun();
        if (shouldRunBusinessSubtypeSeeder) {
            await businessSubtypeSeeder.run();
        }
        const businessQuestionSeeder = new BusinessQuestionSeeder(hostAddress);
        const shouldRunBusinessQuestionSeeder = await businessQuestionSeeder.shouldRun();
        if (shouldRunBusinessQuestionSeeder) {
            await businessQuestionSeeder.run();
        }
        const reviewQuestionSeeder = new ReviewQuestionSeeder(hostAddress);
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

//Fetch business based on google place id 
const getBusinessProfileByPlaceID = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { placeID } = request.params;
        let parsedQuerySet = request.query;
        let { businessProfileID }: any = parsedQuerySet;
        const dbQuery = { placeID: placeID, };
        if (businessProfileID && businessProfileID !== '') {
            Object.assign(dbQuery, { _id: businessProfileID });
        }
        const businessProfileRef = await BusinessProfile.findOne(dbQuery, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            const googlePlaceApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeID}&key=${AppConfig.GOOGLE.MAP_KEY}`;
            const apiResponse = await (await fetch(googlePlaceApiUrl)).json();
            if (apiResponse.status === "OK") {
                const data = apiResponse.result;
                const name = data?.name ?? "";
                const lat = data?.geometry?.location?.lat ?? 0;
                const lng = data?.geometry?.location?.lng ?? 0;
                /***
                 * Review Question based on place type
                 */
                let reviewQuestions: any[] = [];
                const types = data?.types ?? [];

                //Bars / Clubs
                if (types.some((element: any) => ['bar', 'night_club'].includes(element))) {
                    const businessTypeID = await BusinessType.findOne({ name: BusinessTypeEnum.BARS_CLUBS });
                    if (businessTypeID) {
                        reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: businessTypeID } }).limit(8);
                    }

                }
                //Hotel
                if (types.some((element: any) => ['lodging'].includes(element))
                    && ['hotel'].some((word: string) => name.toLowerCase().includes(word))) {
                    const businessTypeID = await BusinessType.findOne({ name: BusinessTypeEnum.HOTEL });
                    if (businessTypeID) {
                        reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: businessTypeID } }).limit(8);
                    }

                }
                //Restaurant
                if (types.some((element: any) => ['cafe', 'restaurant', 'meal_delivery', 'meal_takeaway'].includes(element))
                    && ['cafe', 'restaurant', 'kitchen'].some((word: string) => name.toLowerCase().includes(word))) {
                    const businessTypeID = await BusinessType.findOne({ name: BusinessTypeEnum.RESTAURANT });
                    if (businessTypeID) {
                        reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: businessTypeID } }).limit(8);
                    }

                }

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

//Fetch business profile by encrypted business profile id
const getBusinessProfileByID = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { encryptedID } = request.params;
        const decryptedBusinessProfileID = encryptionService.decrypt(encryptedID as string);
        const businessProfileRef = await BusinessProfile.findOne({ _id: decryptedBusinessProfileID }, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
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
        let parsedQuerySet = request.query;
        let { filter }: any = parsedQuerySet;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."))
        }
        const { currentDate, labels, groupFormat, labelFormat } = createChartLabels(filter);

        /**
         * Calculate Engagement Metrics = Total Interactions
         * Total Interactions = Total Likes + Total Shares + Total Comments + Total Reactions + Total Clicks + Total Views
         */

        const [totalFollowers, followerData, websiteRedirection, websiteRedirectionData, accountReached, accountReachedData, stories, posts] = await Promise.all([
            UserConnection.find({ following: id, status: ConnectionStatus.ACCEPTED }).countDocuments(),
            fetchFollowerData({ following: new ObjectId(id), status: ConnectionStatus.ACCEPTED }, groupFormat, labels, labelFormat),
            WebsiteRedirection.find({ businessProfileID: businessProfileID }).countDocuments(),
            fetchWebsiteRedirectionData({ businessProfileID: new ObjectId(businessProfileID) }, groupFormat, labels, labelFormat),
            AccountReach.find({ businessProfileID: businessProfileID }).countDocuments(),
            fetchAccountReach({ businessProfileID: businessProfileID }, groupFormat, labels, labelFormat),
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
            fetchPosts({ userID: new ObjectId(id), }, [], [], [], 1, 10)
        ]);
        const eng = await fetchEngagedData(businessProfileID);
        const responseData = {
            dashboard: {
                accountReached: accountReached,
                websiteRedirection,
                totalFollowers,
                engaged: 0,//FIXME todo
            },
            data: {
                accountReached: accountReachedData,
                websiteRedirection: websiteRedirectionData,
                totalFollowers: followerData,
                engaged: [],
            },
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
        if (myBusinessProfile && myBusinessProfile?.toString() === businessProfileID.toString()) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("The target Business Profile ID you entered matches your existing Business Profile ID. Please select a different target ID."), "The target Business Profile ID you entered matches your existing Business Profile ID. Please select a different target ID."))
        }
        const business = await BusinessProfile.findOne({ _id: businessProfileID });
        if (!business) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        switch (type) {
            case Type.WEBSITE_REDIRECTION:
                if (!business.website) {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest("Website link not found"), "Website linkk not found"))
                }
                const newRedirection = new WebsiteRedirection();
                newRedirection.userID = id;
                newRedirection.businessProfileID = business.id;
                await newRedirection.save();
                return response.send(httpOk(newRedirection, "Data collected"));
            case Type.ACCOUNT_REACH:
                const isAccountReact = await AccountReach.findOne({ reachedBy: id, businessProfileID: businessProfileID });
                if (!isAccountReact) {
                    const newAccountReach = new AccountReach();
                    newAccountReach.businessProfileID = businessProfileID;
                    newAccountReach.reachedBy = id;
                    const savedAccountReach = await newAccountReach.save();
                    return response.send(httpOk(savedAccountReach, "Data collected"));
                }
                return response.send(httpOk(isAccountReact, 'Data collected'))
        }
        return response.send("");
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const transactions = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        const dbQuery = { userID: new ObjectId(id), status: OrderStatus.COMPLETED };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (query !== undefined && query !== "") {
        }
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [documents, totalDocument] = await Promise.all([
            Order.aggregate(
                [
                    {
                        $match: dbQuery
                    },
                    {
                        '$lookup': {
                            'from': 'subscriptionplans',
                            'let': { 'subscriptionPlanID': '$subscriptionPlanID' },
                            'pipeline': [
                                { '$match': { '$expr': { '$eq': ['$_id', '$$subscriptionPlanID'] } } },
                                {
                                    '$project': {
                                        _id: 1,
                                        image: 1,
                                        name: 1,
                                    }
                                }
                            ],
                            'as': 'subscriptionPlanRef'
                        }
                    },
                    {
                        '$unwind': {
                            'path': '$subscriptionPlanRef',
                            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                        }
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
                            id: 1,
                            orderID: 1,
                            grandTotal: 1,
                            paymentDetail: 1,
                            subscriptionPlanRef: 1,
                            createdAt: 1,
                        }
                    }
                ]
            ).exec(),
            Order.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Transactions fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const createThumbnail = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { letter, color }: any = request.query;
        const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${color ? '#' + color : randomColor()}" />
            <text x="50%" y="50%" font-size="150" font-weight="500" text-anchor="middle" fill="white" dy=".3em" font-family="Roboto">${letter?.substring(0, 1)?.toUpperCase() ?? "A"}</text>
        </svg>`;
        const svgBuffer = Buffer.from(svg);
        const pngBuffer = await sharp(svgBuffer).png().toBuffer();
        response.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': Buffer.byteLength(pngBuffer),
        });
        response.write(pngBuffer);
        return response.end();
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { feed, businessTypes, businessSubTypes, businessQuestions, dbSeeder, getBusinessProfileByPlaceID, getBusinessProfileByID, insights, collectData, transactions, createThumbnail };


function createChartLabels(filter: string) {
    const currentDate = moment();
    let startDate;
    let endDate;
    let days;
    let lastMonthStartDate;
    let lastMonthEndDate;
    let labelFormat;
    let labels;
    let groupFormat;//group sale order to weekly, monthly and yearly
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    switch (filter) {
        case "yearly":
            startDate = new Date(currentDate.startOf('year').toISOString());
            endDate = new Date(currentDate.endOf('year').toISOString());

            lastMonthStartDate = new Date(currentDate.clone().subtract(1, 'year').startOf('year').toISOString());
            lastMonthEndDate = new Date(currentDate.clone().subtract(1, 'year').endOf('year').toISOString());
            groupFormat = "%Y-%m";//Month and year only 
            labelFormat = '%m';
            labels = monthNames;
            // days = calculateTotalDays(startDate, endDate);
            break;
        case "monthly":
            startDate = new Date(currentDate.startOf('month').toISOString());
            endDate = new Date(currentDate.endOf('month').toISOString());

            lastMonthStartDate = new Date(currentDate.clone().subtract(1, 'month').startOf('month').toISOString());
            lastMonthEndDate = new Date(currentDate.clone().subtract(1, 'month').endOf('month').toISOString());
            labelFormat = '%d';
            groupFormat = "%Y-%m-%d";
            labels = [`${1} ${currentDate.format('MMM')}`, `${2} ${currentDate.format('MMM')}`, `${3} ${currentDate.format('MMM')}`, `${4} ${currentDate.format('MMM')}`, `${5} ${currentDate.format('MMM')}`, `${6} ${currentDate.format('MMM')}`, `${7} ${currentDate.format('MMM')}`, `${8} ${currentDate.format('MMM')}`, `${9} ${currentDate.format('MMM')}`, `${10} ${currentDate.format('MMM')}`, `${11} ${currentDate.format('MMM')}`, `${12} ${currentDate.format('MMM')}`, `${13} ${currentDate.format('MMM')}`, `${14} ${currentDate.format('MMM')}`, `${15} ${currentDate.format('MMM')}`, `${16} ${currentDate.format('MMM')}`, `${17} ${currentDate.format('MMM')}`, `${18} ${currentDate.format('MMM')}`, `${19} ${currentDate.format('MMM')}`, `${20} ${currentDate.format('MMM')}`, `${21} ${currentDate.format('MMM')}`, `${22} ${currentDate.format('MMM')}`, `${23} ${currentDate.format('MMM')}`, `${24} ${currentDate.format('MMM')}`, `${25} ${currentDate.format('MMM')}`, `${26} ${currentDate.format('MMM')}`, `${27} ${currentDate.format('MMM')}`, `${28} ${currentDate.format('MMM')}`, `${29} ${currentDate.format('MMM')}`, `${30} ${currentDate.format('MMM')}`, `${31} ${currentDate.format('MMM')}`];
            // days = calculateTotalDays(startDate, endDate);
            break;
        default:
            startDate = new Date(currentDate.startOf('week').toISOString());
            endDate = new Date(currentDate.endOf('week').toISOString());

            lastMonthStartDate = new Date(currentDate.clone().subtract(1, 'week').startOf('week').toISOString());
            lastMonthEndDate = new Date(currentDate.clone().subtract(1, 'week').endOf('week').toISOString());
            labelFormat = "%u";
            labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            groupFormat = "%Y-%m-%d";
            // days = calculateTotalDays(startDate, endDate);
            break;
    }

    return {
        currentDate,
        labelFormat,
        groupFormat,
        labels,
        startDate,
        endDate,
        lastMonthStartDate,
        lastMonthEndDate
    };
}

function fetchWebsiteRedirectionData(query: { [key: string]: any; }, groupFormat: string, labels: string[], labelFormat: string) {
    return WebsiteRedirection.aggregate([
        {
            $match: query
        },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                createdAt: { '$first': "$createdAt" },
                redirection: { $sum: 1 }, // Optional: Count the number of sales per day
            },
        },
        {
            $project: {
                _id: 0,
                redirection: 1,
                labelName: {
                    $let: {
                        vars: {
                            labelNames: labels//Label array base on global filter 
                        },
                        in: {
                            $arrayElemAt: [
                                "$$labelNames",//Create label name based on global filter and dateString
                                {
                                    $subtract: [{ $toInt: { $dateToString: { format: labelFormat, date: "$createdAt" } } }, 1]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: {
                    $map: {
                        input: labels,
                        as: "labelName",
                        in: {
                            $let: {
                                vars: {
                                    matchedData: {
                                        $filter: {
                                            input: "$data",
                                            as: "item",
                                            cond: { $eq: ["$$item.labelName", "$$labelName"] }
                                        }
                                    }
                                },
                                in: {//check if data for current label is exits or not if not then add dummy data for label,
                                    $cond: {
                                        if: { $eq: [{ $size: "$$matchedData" }, 0] },
                                        then: {
                                            redirection: 0,
                                            labelName: "$$labelName"
                                        },
                                        else: { $arrayElemAt: ["$$matchedData", 0] }
                                    }
                                }
                            }

                        }
                    }
                }
            }
        },
        {
            $unwind: "$data"
        },
        {
            $replaceRoot: { newRoot: "$data" }
        },
    ]).exec();
}
function fetchFollowerData(query: { [key: string]: any; }, groupFormat: string, labels: string[], labelFormat: string) {
    return UserConnection.aggregate([
        {
            $match: query
        },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                createdAt: { '$first': "$createdAt" },
                followers: { $sum: 1 }, // Optional: Count the number of sales per day
            },
        },
        {
            $project: {
                _id: 0,
                followers: 1,
                labelName: {
                    $let: {
                        vars: {
                            labelNames: labels//Label array base on global filter 
                        },
                        in: {
                            $arrayElemAt: [
                                "$$labelNames",//Create label name based on global filter and dateString
                                {
                                    $subtract: [{ $toInt: { $dateToString: { format: labelFormat, date: "$createdAt" } } }, 1]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: {
                    $map: {
                        input: labels,
                        as: "labelName",
                        in: {
                            $let: {
                                vars: {
                                    matchedData: {
                                        $filter: {
                                            input: "$data",
                                            as: "item",
                                            cond: { $eq: ["$$item.labelName", "$$labelName"] }
                                        }
                                    }
                                },
                                in: {//check if data for current label is exits or not if not then add dummy data for label,
                                    $cond: {
                                        if: { $eq: [{ $size: "$$matchedData" }, 0] },
                                        then: {
                                            followers: 0,
                                            labelName: "$$labelName"
                                        },
                                        else: { $arrayElemAt: ["$$matchedData", 0] }
                                    }
                                }
                            }

                        }
                    }
                }
            }
        },
        {
            $unwind: "$data"
        },
        {
            $replaceRoot: { newRoot: "$data" }
        },
    ]);
}

function fetchAccountReach(query: { [key: string]: any; }, groupFormat: string, labels: string[], labelFormat: string) {
    return AccountReach.aggregate(
        [
            {
                $match: query
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                    createdAt: { '$first': "$createdAt" },
                    accountReach: { $sum: 1 }, // Optional: Count the number of sales per day
                },
            },
            {
                $project: {
                    _id: 0,
                    accountReach: 1,
                    labelName: {
                        $let: {
                            vars: {
                                labelNames: labels//Label array base on global filter 
                            },
                            in: {
                                $arrayElemAt: [
                                    "$$labelNames",//Create label name based on global filter and dateString
                                    {
                                        $subtract: [{ $toInt: { $dateToString: { format: labelFormat, date: "$createdAt" } } }, 1]
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    data: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    data: {
                        $map: {
                            input: labels,
                            as: "labelName",
                            in: {
                                $let: {
                                    vars: {
                                        matchedData: {
                                            $filter: {
                                                input: "$data",
                                                as: "item",
                                                cond: { $eq: ["$$item.labelName", "$$labelName"] }
                                            }
                                        }
                                    },
                                    in: {//check if data for current label is exits or not if not then add dummy data for label,
                                        $cond: {
                                            if: { $eq: [{ $size: "$$matchedData" }, 0] },
                                            then: {
                                                accountReach: 0,
                                                labelName: "$$labelName"
                                            },
                                            else: { $arrayElemAt: ["$$matchedData", 0] }
                                        }
                                    }
                                }

                            }
                        }
                    }
                }
            },
            {
                $unwind: "$data"
            },
            {
                $replaceRoot: { newRoot: "$data" }
            },
        ]
    )
}

async function fetchEngagedData(businessProfileID: string) {
    const likes = await Like.aggregate([
        {
            $match: { businessProfileID: new ObjectId(businessProfileID) }
        }
    ]).exec();

    const comments = await Comment.aggregate([
        {
            $match: { businessProfileID: new ObjectId(businessProfileID) }
        }
    ]).exec();
    const sharedContent = await SharedContent.aggregate([
        {
            $match: { businessProfileID: new ObjectId(businessProfileID) }
        }
    ]);
    console.log(comments);
    console.log(likes);
    console.log(sharedContent);

}