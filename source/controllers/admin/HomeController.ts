import { ContentType } from './../../common/index';
import { Request, Response, NextFunction } from "express";
import { parseFloatToFixed, parseQueryParam } from '../../utils/helper/basic';
import { AccountType } from '../../database/models/user.model';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError, httpOk } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import User from '../../database/models/user.model';
import Post from '../../database/models/post.model';
import Report, { addCommentInReport, addPostInReport, addReportedByInReport, addUserInReport } from '../../database/models/reportedUser.model';
const contentTypes = Object.values(ContentType)
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const currentMonth = new Date();
        const startOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const startOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

        const [users, businessProfiles, posts, reports, currentMonthUserCount, lastMonthUserCount, currentMonthPostCount, lastMonthPostCount, currentMonthBusinessCount, lastMonthBusinessCount, currentMonthReportsCount, lastMonthReportsCount] = await Promise.all([
            User.countDocuments(),
            User.find({ accountType: AccountType.BUSINESS }).countDocuments(),
            Post.countDocuments(),
            Report.countDocuments(),
            User.find({
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            User.find({
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
            Post.find({
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            Post.find({
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
            User.find({
                accountType: AccountType.BUSINESS,
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            User.find({
                accountType: AccountType.BUSINESS,
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
            Report.find({
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            Report.find({
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
        ]);
        let userPercentage = 0;
        let businessPercentage = 0;
        let postPercentage = 0;
        let reportPercentage = 0;
        if (lastMonthUserCount > 0 && currentMonthUserCount > 0) {
            userPercentage = ((currentMonthUserCount - lastMonthUserCount) / currentMonthUserCount) * 100;
        }
        if (lastMonthBusinessCount > 0 && currentMonthBusinessCount > 0) {
            businessPercentage = ((currentMonthBusinessCount - lastMonthBusinessCount) / currentMonthBusinessCount) * 100;
        }
        if (lastMonthPostCount > 0 && currentMonthPostCount > 0) {
            postPercentage = ((currentMonthPostCount - lastMonthPostCount) / currentMonthPostCount) * 100;
        }

        if (lastMonthReportsCount > 0 && currentMonthReportsCount > 0) {
            reportPercentage = ((currentMonthReportsCount - lastMonthReportsCount) / currentMonthReportsCount) * 100;
        }
        const responseData = {
            statistics: {
                users: {
                    count: users,
                    percentage: parseFloatToFixed(userPercentage, 2)
                },
                posts: {
                    count: posts,
                    percentage: parseFloatToFixed(postPercentage, 2)
                },
                businessProfiles: {
                    count: businessProfiles,
                    percentage: parseFloatToFixed(businessPercentage, 2)
                },
                reports: {
                    count: reports,
                    percentage: parseFloatToFixed(reportPercentage, 2)
                }
            }
        }
        return response.send(httpOk(responseData, 'Dashboard data fetched.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const topReportedContent = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { documentLimit, contentType, overview }: any = request.query;
        documentLimit = parseQueryParam(documentLimit, 10);
        const dbQuery = {};
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (contentType && contentTypes.includes(contentType)) {
            Object.assign(dbQuery, { contentType: contentType })
        }
        const currentDate = new Date();
        const dbQuery2 = {}
        if (overview && overview === "monthly") {
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);  // 1st day of current month
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);  // Last day of current month
            Object.assign(dbQuery2, { createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } })
        }
        if (overview && overview === "yearly") {
            const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);  // January 1st of current year
            const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31);  // December 31st of current year
            Object.assign(dbQuery2, { createdAt: { $gte: firstDayOfYear, $lte: lastDayOfYear } })
        }
        const [reports, documents] = await Promise.all([
            Report.aggregate([
                {
                    $match: dbQuery2
                },
                {
                    $group: {
                        _id: "$contentType",            // Group by contentType
                        totalReports: { $sum: 1 }  // Sum report counts for each content
                    }
                },
                {
                    $project: {
                        labelName: '$_id',
                        totalReports: 1,
                        _id: 0,
                    }
                }
            ]),
            Report.aggregate([
                {
                    $match: dbQuery
                },
                addPostInReport().lookup,
                addPostInReport().unwindLookup,
                addUserInReport().lookup,
                addUserInReport().unwindLookup,
                addCommentInReport().lookup,
                addCommentInReport().unwindLookup,
                {
                    $group: {
                        _id: "$contentID",            // Group by content ID
                        contentType: { '$first': "$contentType" },
                        usersRef: { '$first': "$usersRef" },
                        postsRef: { '$first': "$postsRef" },
                        commentsRef: { '$first': "$commentsRef" },
                        createdAt: { '$last': '$createdAt' },
                        totalReports: { $sum: 1 }  // Sum report counts for each content
                    }
                },
                { $sort: { totalReports: -1 } },
                {
                    $limit: documentLimit
                },
            ])
        ]);
        return response.send(httpOk({
            reports,
            documents,
        }, 'Top reports fetched.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { index, topReportedContent }