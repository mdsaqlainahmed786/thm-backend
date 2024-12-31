import cron from 'node-cron';
import { CronSchedule } from '../config/constants';
import { fetchUserFollower, fetchUserFollowing } from '../database/models/userConnection.model';
import UserConnectionController from '../controllers/UserConnectionController';
import User from '../database/models/user.model';
import UserConnection from '../database/models/userConnection.model';
import { MongoID } from '../common';
import { ConnectionStatus } from './../database/models/userConnection.model';
async function followTHM() {
    try {
        // Create default profile (if it doesn't exist yet)
        const defaultAccount = await UserConnectionController.createDefaultProfile();
        if (!defaultAccount) {
            console.log("Default account not found.");
            return;
        }

        // Get the list of users already following the default account
        let following = await fetchUserFollower(defaultAccount.id);
        // Get users who are not already following
        const users = await User.distinct('_id', { _id: { $nin: following } }) as MongoID[];
        console.log(users.length, "users not following the profile.");

        if (users.length === 0) {
            console.log("No users need to follow the profile.");
            return;
        }
        // Batch query to get all existing connections between users and defaultAccount
        const existingConnections = await UserConnection.find({
            $or: [
                { follower: { $in: users }, following: defaultAccount.id, status: { $in: [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED] } }
            ]
        }).lean();
        const existingUserConnections = new Set(existingConnections.map(connection => connection.follower.toString()));

        // Create connections for users who haven't connected yet
        const newConnections = users.filter(userID => {
            if (userID.toString() === defaultAccount.id.toString()) return false; // Skip the default account itself
            return !existingUserConnections.has(userID.toString());
        });

        if (newConnections.length > 0) {
            // Bulk insert new user connections
            const newUserConnections = newConnections.map(userID => {
                const newUserConnection = new UserConnection();
                newUserConnection.follower = userID;
                newUserConnection.following = defaultAccount.id;
                newUserConnection.status = ConnectionStatus.ACCEPTED;
                return newUserConnection;
            });
            await UserConnection.insertMany(newUserConnections);
            console.log(`${newUserConnections.length} new connections created.`);
        } else {
            console.log("No new connections were created.");
        }
    } catch (error) {
        console.error("Error during Follow THM process:", error);
    }
}
const THMFollow: cron.ScheduledTask = cron.schedule(CronSchedule.EVERY_TWO_MINUTE, followTHM);
export default THMFollow;


// followTHM = async () => {
//     console.log("Follow THM");
//     const defaultAccount = await UserConnectionController.createDefaultProfile();
//     if (defaultAccount) {
//         let following = await fetchUserFollowing(defaultAccount.id);
//         const users = await User.distinct('_id', { _id: { $nin: following } }) as MongoID[];
//         console.log(users.length, "profile following");
//         await Promise.all(users.map(async (userID) => {
//             if (userID.toString() !== defaultAccount.id.toString()) {
//                 const haveConnectedBefore = await UserConnection.findOne({
//                     $or: [
//                         { follower: userID, following: defaultAccount.id, status: { $in: [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED] } },
//                     ]
//                 });
//                 if (!haveConnectedBefore) {
//                     const newUserConnection = new UserConnection();
//                     newUserConnection.follower = userID;
//                     newUserConnection.following = defaultAccount.id;
//                     newUserConnection.status = ConnectionStatus.ACCEPTED;
//                     await newUserConnection.save();
//                 }
//             }
//             return userID;
//         }));
//     }


// }