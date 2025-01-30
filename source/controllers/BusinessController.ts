import { Request, Response, NextFunction } from "express";
import { httpInternalServerError, httpForbidden, httpNotFoundOr404, httpOk, httpBadRequest } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/anonymousUser.model";
import { ContentType, InsightType } from "../common";
import { ObjectId } from "mongodb";
import moment from "moment";
import { isArray } from "../utils/helper/basic";
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
            fetchPosts({ ...getPostQuery, userID: new ObjectId(id), }, [], [], [], 1, 10)
        ]);
        const engaged = await fetchEngagedData(businessProfileID, id);
        const responseData = {
            dashboard: {
                accountReached: accountReached,
                websiteRedirection,
                totalFollowers,
                engaged: engaged,//FIXME todo
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

async function fetchEngagedData(businessProfileID: string, userID: string) {
    console.log(businessProfileID, userID, "businessProfileID");

    //analyzing posts
    const posts = await Post.distinct('_id', { businessProfileID: new ObjectId(businessProfileID) });
    const likes = await Like.countDocuments({ postID: { $in: posts } });
    const comments = await Comment.countDocuments({ postID: { $in: posts } });
    const sharedContent = await SharedContent.countDocuments({ contentID: { $in: posts }, contentType: ContentType.POST });

    //analyzing stories
    const stories = await Story.distinct('_id', { $match: { userID: new ObjectId(userID), timeStamp: { $gte: storyTimeStamp } } });
    const storyLikes = await Like.countDocuments({ storyID: { $in: stories } });
    const storyComments = await Message.countDocuments({ storyID: { $in: stories }, type: MessageType.STORY_COMMENT });
    const storyViews = await View.countDocuments({ storyID: { $in: stories } });

    console.log(storyLikes);
    console.log(storyComments);
    console.log(storyViews);

    console.log(likes);
    console.log(comments);
    console.log(sharedContent);
    return storyLikes + storyComments + storyViews + likes + comments + sharedContent;
}

export default { insights, collectInsightsData, businessTypes, businessSubTypes, businessQuestions, businessQuestionAnswer };
