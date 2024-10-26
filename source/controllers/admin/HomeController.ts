import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { parseFloatToFixed, parseQueryParam } from '../../utils/helper/basic';
import { AccountType } from '../../database/models/user.model';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError, httpOk } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import User from '../../database/models/user.model';
import Post from '../../database/models/post.model';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const currentMonth = new Date();
        const startOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const startOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

        const [users, businessProfiles, posts, currentMonthUserCount, lastMonthUserCount, currentMonthPostCount, lastMonthPostCount, currentMonthBusinessCount, lastMonthBusinessCount] = await Promise.all([
            User.find({}).countDocuments(),
            User.find({ accountType: AccountType.BUSINESS }).countDocuments(),
            Post.find({}).countDocuments(),
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
        ]);
        let userPercentage = 0;
        let businessPercentage = 0;
        let postPercentage = 0;
        if (lastMonthUserCount > 0) {
            userPercentage = ((currentMonthUserCount - lastMonthUserCount) / currentMonthUserCount) * 100;
        }
        if (lastMonthBusinessCount > 0) {
            businessPercentage = ((currentMonthBusinessCount - lastMonthBusinessCount) / currentMonthBusinessCount) * 100;
        }
        if (lastMonthPostCount > 0) {
            postPercentage = ((currentMonthPostCount - lastMonthPostCount) / currentMonthPostCount) * 100;
        }
        console.log(lastMonthPostCount);
        console.log(currentMonthPostCount)
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
                }
            }
        }
        return response.send(httpOk(responseData, 'Dashboard data fetched.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { index }