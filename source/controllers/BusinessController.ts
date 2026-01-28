import { GeoCoordinate } from './../database/models/common.model';
import { Request, Response, NextFunction } from "express";
import { httpInternalServerError, httpForbidden, httpNotFoundOr404, httpOk, httpBadRequest, httpCreated } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/anonymousUser.model";
import { ContentType, InsightType, MongoID } from "../common";
import { ObjectId } from "mongodb";
import moment from "moment";
import { isArray, predictCategory } from "../utils/helper/basic";
import AccountReach from "../database/models/accountReach.model";
import WebsiteRedirection from "../database/models/websiteRedirection.model";
import Post, { fetchPosts, getPostQuery } from "../database/models/post.model";
import Story, { storyTimeStamp, addMediaInStory } from "../database/models/story.model";
import UserConnection, { ConnectionStatus } from "../database/models/userConnection.model";
import Like from "../database/models/like.model";
import View from "../database/models/view.model.";
import Comment from "../database/models/comment.model";
import Message, { MessageType } from "../database/models/message.model";
import SharedContent from "../database/models/sharedContent.model";
import BusinessProfile from "../database/models/businessProfile.model";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessQuestion from "../database/models/businessQuestion.model";
import BusinessAnswer from "../database/models/businessAnswer.model";
import User from "../database/models/user.model";
import AnonymousUser from "../database/models/anonymousUser.model";
import BusinessReviewQuestion from "../database/models/businessReviewQuestion.model";
import { AppConfig, AwsS3AccessEndpoints } from "../config/constants";
import axios from "axios";
import EncryptionService from '../services/EncryptionService';
import { storeMedia } from "./MediaController";
import Menu from "../database/models/menu.model";
import Media from "../database/models/media.model";
import S3Service from "../services/S3Service";
import { httpNoContent } from "../utils/response";
import EnvironmentService from "../services/EnvironmentService";

const encryptionService = new EncryptionService();
const s3Service = new S3Service();
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
            fetchPosts({ ...getPostQuery, userID: new ObjectId(id), }, [], [], [], 1, 10, undefined, undefined, false, undefined, id)
        ]);
        const { engagementsData, engagements } = await fetchEngagedData(businessProfileID, id, groupFormat, labels, labelFormat);
        const responseData = {
            dashboard: {
                accountReached: accountReached,
                websiteRedirection,
                totalFollowers,
                engagements: engagements,
                engaged: 0,//FIXME remove me
            },
            data: {
                accountReached: accountReachedData,
                websiteRedirection: websiteRedirectionData,
                totalFollowers: followerData,
                engagements: engagementsData,
                engaged: [],//TODO remove me
            },
            stories: stories,
            posts: posts
        }
        return response.send(httpOk(responseData, 'Insights fetched'))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const collectInsightsData = async (request: Request, response: Response, next: NextFunction) => {
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
            case InsightType.WEBSITE_REDIRECTION:
                if (!business.website) {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest("Website link not found"), "Website linkk not found"))
                }
                const newRedirection = new WebsiteRedirection();
                newRedirection.userID = id;
                newRedirection.businessProfileID = business.id;
                await newRedirection.save();
                return response.send(httpOk(newRedirection, "Data collected"));
            case InsightType.ACCOUNT_REACH:
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
        let type = "business-profile";
        const businessProfileRef = await BusinessProfile.findOne(dbQuery, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            const googlePlaceApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeID}&key=${AppConfig.GOOGLE.MAP_KEY}`;
            const apiResponse = await (await fetch(googlePlaceApiUrl)).json();
            if (apiResponse.status === "OK") {
                const data = apiResponse.result;
                const name = data?.name ?? "";
                const rating = data?.rating ?? 0;
                const lat = data?.geometry?.location?.lat ?? 0;
                const lng = data?.geometry?.location?.lng ?? 0;
                /***
                 * Review Question based on place type
                 */
                let reviewQuestions: any[] = [];
                const types = data?.types ?? [];
                let businessTypeID: string | undefined = undefined;
                const predictedCategoryName = predictCategory(types, name);
                if (predictedCategoryName) {
                    const businessType = await BusinessType.findOne({ name: predictedCategoryName });
                    if (businessType) {
                        businessTypeID = businessType.id;
                        reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: [businessTypeID] } }).limit(8);
                    }
                }
                console.log("predictedCategory", predictedCategoryName)

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
                    coverImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${AppConfig.GOOGLE.MAP_KEY}`;
                    const res = await axios.get(coverImage);
                    coverImage = res.request._redirectable._options.href;
                }

                const anonymousBusinessExits = await AnonymousUser.findOne({ placeID: placeID, accountType: AccountType.BUSINESS });
                type = "google-business-profile";
                if (!anonymousBusinessExits) {
                    const newAnonymousBusiness = new AnonymousUser();
                    newAnonymousBusiness.accountType = AccountType.BUSINESS;
                    newAnonymousBusiness.name = name;
                    const geoCoordinate: GeoCoordinate = { type: "Point", coordinates: [lng, lat] }
                    newAnonymousBusiness.address = { city, state, street, zipCode, country, geoCoordinate, lat, lng };
                    newAnonymousBusiness.profilePic = {
                        "small": coverImage,
                        "medium": coverImage,
                        "large": coverImage
                    };
                    newAnonymousBusiness.coverImage = coverImage;
                    newAnonymousBusiness.rating = rating;
                    newAnonymousBusiness.placeID = placeID;
                    if (businessTypeID) {
                        newAnonymousBusiness.businessTypeID = businessTypeID;
                    }
                    const businessProfileRef = await newAnonymousBusiness.save();
                    const env = await EnvironmentService.getForLocation({ cacheKey: `place:${placeID}`, lat, lng });
                    return response.send(
                        httpOk(
                            {
                                businessProfileRef: Object.assign({}, businessProfileRef.toJSON(), {
                                    type: type,
                                    weatherReport: env.weatherReport,
                                    environment: env.summary
                                }),
                                reviewQuestions
                            },
                            "Business profile fetched"
                        )
                    );
                } else {
                    const latData = Number((anonymousBusinessExits as any)?.address?.lat ?? 0);
                    const lngData = Number((anonymousBusinessExits as any)?.address?.lng ?? 0);
                    const env = await EnvironmentService.getForLocation({ cacheKey: `place:${placeID}`, lat: latData, lng: lngData });
                    return response.send(
                        httpOk(
                            {
                                businessProfileRef: Object.assign({}, anonymousBusinessExits.toJSON(), {
                                    type: type,
                                    weatherReport: env.weatherReport,
                                    environment: env.summary
                                }),
                                reviewQuestions
                            },
                            "Business profile fetched"
                        )
                    );
                }
            }
            return response.send(httpInternalServerError(null, ErrorMessage.INTERNAL_SERVER_ERROR));
        }
        const reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: businessProfileRef.businessTypeID }, businessSubtypeID: { $in: businessProfileRef.businessSubTypeID } }, '_id question id');
        const latData = Number((businessProfileRef as any)?.address?.lat ?? 0);
        const lngData = Number((businessProfileRef as any)?.address?.lng ?? 0);
        const env = await EnvironmentService.getForLocation({ cacheKey: `bp:${String(businessProfileRef._id)}`, lat: latData, lng: lngData });
        return response.send(
            httpOk(
                {
                    businessProfileRef: Object.assign({}, businessProfileRef.toJSON(), {
                        type: type,
                        weatherReport: env.weatherReport,
                        environment: env.summary
                    }),
                    reviewQuestions
                },
                "Business profile fetched"
            )
        );
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
        const latData = Number((businessProfileRef as any)?.address?.lat ?? 0);
        const lngData = Number((businessProfileRef as any)?.address?.lng ?? 0);
        const env = await EnvironmentService.getForLocation({ cacheKey: `bp:${String(businessProfileRef._id)}`, lat: latData, lng: lngData });
        return response.send(httpOk({
            businessProfileRef: Object.assign({}, businessProfileRef.toJSON(), {
                weatherReport: env.weatherReport,
                environment: env.summary
            }),
            reviewQuestions,
        }, "Business profile fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

//Fetch business profile by direct business profile id (not encrypted)
const getBusinessProfileByDirectID = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.params;
        const businessProfileRef = await BusinessProfile.findOne({ _id: id }, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        const reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: businessProfileRef.businessTypeID }, businessSubtypeID: { $in: businessProfileRef.businessSubTypeID } }, '_id question id')
        const latData = Number((businessProfileRef as any)?.address?.lat ?? 0);
        const lngData = Number((businessProfileRef as any)?.address?.lng ?? 0);
        const env = await EnvironmentService.getForLocation({ cacheKey: `bp:${String(businessProfileRef._id)}`, lat: latData, lng: lngData });
        return response.send(httpOk({
            businessProfileRef: Object.assign({}, businessProfileRef.toJSON(), {
                weatherReport: env.weatherReport,
                environment: env.summary
            }),
            reviewQuestions,
        }, "Business profile fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


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

function engagementAggregatePipeline(groupFormat: string, labels: string[], labelFormat: string) {
    const pipeline = [
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                createdAt: { '$first': "$createdAt" },
                engagement: { $sum: 1 }, // Optional: Count the number of sales per day
            },
        },
        {
            $project: {
                _id: 0,
                engagement: 1,
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
                                            engagement: 0,
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
    return { pipeline };
}

/**
 * Upload restaurant menu items (images or PDFs) for the logged-in business owner.
 * Only businesses whose type is "Restaurant" are allowed to add menu items.
 */
const addRestaurantMenu = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, businessProfileID } = request.user;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!businessProfileID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }

        const businessProfile = await BusinessProfile.findOne({ _id: new ObjectId(String(businessProfileID)) });
        if (!businessProfile) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }

        const businessType = await BusinessType.findOne({ _id: businessProfile.businessTypeID });
        if (!businessType || businessType.name !== "Restaurant") {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: Only restaurant businesses can add menu items."), "Access denied: Only restaurant businesses can add menu items."));
        }

        const files = request.files as { [fieldname: string]: Express.MulterS3.File[] } | undefined;
        const menuFiles = files && (files["menu"] as Express.MulterS3.File[]);

        if (!menuFiles || menuFiles.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Menu file (image or PDF) is required"), "Menu file (image or PDF) is required"));
        }

        // Store uploaded files as media records (supports images and PDFs)
        const mediaList = await storeMedia(
            menuFiles,
            id as unknown as MongoID,
            businessProfile.id as unknown as MongoID,
            AwsS3AccessEndpoints.BUSINESS_DOCUMENTS,
            "POST"
        );
        if (!mediaList || mediaList.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Unable to upload menu items"), "Unable to upload menu items"));
        }

        // Link media to business profile as menu entries
        const menuDocs = await Promise.all(
            mediaList.map(async (media) => {
                const newMenu = new Menu();
                newMenu.businessProfileID = businessProfile.id as unknown as MongoID;
                newMenu.userID = id as unknown as MongoID;
                newMenu.mediaID = media.id as unknown as MongoID;
                return newMenu.save();
            })
        );

        return response.send(httpCreated(menuDocs, "Menu items added successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

/**
 * Fetch all menu items (images / PDFs) for a given business profile.
 * This route is public so users can see restaurant menus.
 */
const getRestaurantMenu = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { businessProfileID } = request.params;

        const businessProfile = await BusinessProfile.findOne({ _id: new ObjectId(businessProfileID) });
        if (!businessProfile) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }

        const menuItems = await Menu.find({ businessProfileID: businessProfile.id }).sort({ createdAt: -1 });

        if (!menuItems || menuItems.length === 0) {
            return response.send(httpOk([], "No menu items found for this business"));
        }

        const mediaIDs = menuItems.map((m) => m.mediaID as unknown as MongoID);
        const mediaList = await Media.find({ _id: { $in: mediaIDs } });

        const menuResponse = menuItems.map((menu) => {
            const media = mediaList.find((m) => String(m.id) === String(menu.mediaID));
            return {
                id: menu.id,
                businessProfileID: menu.businessProfileID,
                mediaID: menu.mediaID,
                createdAt: menu.createdAt,
                media: media
                    ? {
                        id: media.id,
                        mediaType: media.mediaType,
                        sourceUrl: media.sourceUrl,
                        thumbnailUrl: media.thumbnailUrl,
                        mimeType: media.mimeType,
                    }
                    : null,
            };
        });

        return response.send(httpOk(menuResponse, "Menu items fetched successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

/**
 * Delete a specific menu item (image or PDF) for the logged-in restaurant business owner.
 * This will delete the Menu document, associated Media document, and files from S3.
 */
const deleteRestaurantMenu = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, businessProfileID } = request.user;
        const menuID = request.params.id;

        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!businessProfileID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }

        // Find the menu item and verify it belongs to the user's business profile
        const menuItem = await Menu.findOne({
            _id: new ObjectId(menuID),
            businessProfileID: new ObjectId(String(businessProfileID))
        });

        if (!menuItem) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Menu item not found or you don't have permission to delete it"), "Menu item not found or you don't have permission to delete it"));
        }

        // Find the associated media document
        const media = await Media.findOne({ _id: menuItem.mediaID });

        if (media) {
            // Delete files from S3
            if (media.s3Key) {
                await s3Service.deleteS3Object(media.s3Key);
            }
            // Only delete thumbnail if it's an S3 URL (not external placeholder URLs like for PDFs)
            if (media.thumbnailUrl && (media.thumbnailUrl.includes('.s3.') || media.thumbnailUrl.startsWith('s3://'))) {
                try {
                    await s3Service.deleteS3Asset(media.thumbnailUrl);
                } catch (error: any) {
                    // If thumbnail deletion fails (e.g., external URL), just log and continue
                    console.warn('Failed to delete thumbnail (may be external URL):', media.thumbnailUrl);
                }
            }
            // Delete the media document
            await media.deleteOne();
        }

        // Delete the menu document
        await menuItem.deleteOne();

        return response.send(httpNoContent(null, "Menu item deleted successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

async function fetchEngagedData(businessProfileID: string, userID: string, groupFormat: string, labels: string[], labelFormat: string) {
    console.log(businessProfileID, userID, "businessProfileID");
    //analyzing posts && stories
    const [posts, stories] = await Promise.all([
        Post.distinct('_id', { businessProfileID: new ObjectId(businessProfileID) }),
        Story.distinct('_id', { $match: { userID: new ObjectId(userID), timeStamp: { $gte: storyTimeStamp } } })
    ])
    console.log(posts);
    console.log(stories);
    const [likesData, commentsData, sharedContentData, storyLikesData, storyCommentsData, storyViewsData, likes, comments, sharedContent, storyLikes, storyComments, storyViews] = await Promise.all(
        [
            Like.aggregate([
                {
                    $match: { postID: { $in: posts } }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            Comment.aggregate(
                [
                    {
                        $match: { postID: { $in: posts } }
                    },
                    ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
                ]
            ),
            SharedContent.aggregate([
                {
                    $match: { contentID: { $in: posts }, contentType: ContentType.POST }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            Like.aggregate([
                {
                    $match: { storyID: { $in: stories } }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            Message.aggregate([
                {
                    $match: { storyID: { $in: stories }, type: MessageType.STORY_COMMENT }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            View.aggregate([
                {
                    $match: { storyID: { $in: stories } }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),



            Like.countDocuments({ postID: { $in: posts } }),
            Comment.countDocuments({ postID: { $in: posts } }),
            SharedContent.countDocuments({ contentID: { $in: posts }, contentType: ContentType.POST }),
            Like.countDocuments({ storyID: { $in: stories } }),
            Message.countDocuments({ storyID: { $in: stories }, type: MessageType.STORY_COMMENT }),
            View.countDocuments({ storyID: { $in: stories } })
        ]
    );
    console.log(storyLikes);
    console.log(storyComments);
    console.log(storyViews);

    console.log(likes);
    console.log(comments);
    console.log(sharedContent);

    type Engagement = { labelName: string, engagement: number };
    const allEngagements = [...likesData, ...commentsData, ...sharedContentData, ...storyLikesData, ...storyCommentsData, ...storyViewsData,];
    // Group by `labelName` and sum the engagements
    const engagementsData = allEngagements.reduce((acc, { labelName, engagement }) => {
        // Find the existing entry for the current `labelName`
        const existing = acc.find((item: Engagement) => item.labelName === labelName);
        if (existing) {
            // If entry exists, add the engagement to it
            existing.engagement += engagement;
        } else {
            // If no entry exists, create a new one
            acc.push({ labelName, engagement });
        }

        return acc;
    }, []);

    const engagements = likes + comments + sharedContent + storyLikes + storyComments + storyViews;
    console.log(allEngagements);
    console.log(engagements);
    return { engagementsData, engagements };
}

export default {
    insights,
    collectInsightsData,
    businessTypes,
    businessSubTypes,
    businessQuestions,
    businessQuestionAnswer,
    getBusinessProfileByPlaceID,
    getBusinessProfileByID,
    getBusinessProfileByDirectID,
    addRestaurantMenu,
    getRestaurantMenu,
    deleteRestaurantMenu
};
