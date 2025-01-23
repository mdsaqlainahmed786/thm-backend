import cron from 'node-cron';
import { CronSchedule } from '../config/constants';
import BusinessProfile from '../database/models/businessProfile.model';
import Post from '../database/models/post.model';
async function rateTHMBusiness() {
    try {
        console.log("Rate THM Business")
        const reviews = await Post.aggregate([
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
