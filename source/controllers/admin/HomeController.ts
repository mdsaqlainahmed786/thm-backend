import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { parseFloatToFixed, parseQueryParam } from '../../utils/helper/basic';
import { AccountType } from '../../database/models/user.model';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError, httpOk } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import User from '../../database/models/user.model';
import Post from '../../database/models/post.model';
import Report from '../../database/models/reportedUser.model';
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
export default { index }