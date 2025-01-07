import cron from 'node-cron';
import { CronSchedule } from '../config/constants';
import { fetchUserFollower, fetchUserFollowing } from '../database/models/userConnection.model';
import UserConnectionController from '../controllers/UserConnectionController';
import User from '../database/models/user.model';
import UserConnection from '../database/models/userConnection.model';
import { MongoID } from '../common';
import { ConnectionStatus } from './../database/models/userConnection.model';
import Review from '../database/models/reviews.model';
import BusinessProfile from '../database/models/businessProfile.model';
async function rateTHMBusiness() {
    try {
        console.log("Rate THM Business")
        const reviews = await Review.aggregate([
            {
                $match: {
                    reviewedBusinessProfileID: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$reviewedBusinessProfileID",
                    totalRating: { $sum: '$rating' },
                    ratingCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalRating: { $toInt: "$totalRating" },
                    averageRating: {
                        $round: [{ $divide: ["$totalRating", "$ratingCount"] }, 1]
                    }
                }
            }
        ]);
        if (reviews && reviews.length != 0) {
            await Promise.all(reviews.map(async (review) => {
                await BusinessProfile.findOneAndUpdate({ _id: review?._id }, { rating: review.averageRating })
            }));
        }
    } catch (error) {
        console.error("Error during Follow THM process:", error);
    }
}
const THMRating: cron.ScheduledTask = cron.schedule(CronSchedule.ONLY_ON_MONDAY_AND_THURSDAY, rateTHMBusiness);
export default THMRating;
