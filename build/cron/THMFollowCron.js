"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const constants_1 = require("../config/constants");
const userConnection_model_1 = require("../database/models/userConnection.model");
const UserConnectionController_1 = __importDefault(require("../controllers/UserConnectionController"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const userConnection_model_2 = __importDefault(require("../database/models/userConnection.model"));
const userConnection_model_3 = require("./../database/models/userConnection.model");
function followTHM() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create default profile (if it doesn't exist yet)
            const defaultAccount = yield UserConnectionController_1.default.createDefaultProfile();
            if (!defaultAccount) {
                console.log("Default account not found.");
                return;
            }
            // Get the list of users already following the default account
            let following = yield (0, userConnection_model_1.fetchUserFollower)(defaultAccount.id);
            // Get users who are not already following
            const users = yield user_model_1.default.distinct('_id', { _id: { $nin: following } });
            // console.log(users.length, "users not following the profile.");
            if (users.length === 0) {
                // console.log("No users need to follow the profile.");
                return;
            }
            // Batch query to get all existing connections between users and defaultAccount
            const existingConnections = yield userConnection_model_2.default.find({
                $or: [
                    { follower: { $in: users }, following: defaultAccount.id, status: { $in: [userConnection_model_3.ConnectionStatus.PENDING, userConnection_model_3.ConnectionStatus.ACCEPTED] } }
                ]
            }).lean();
            const existingUserConnections = new Set(existingConnections.map(connection => connection.follower.toString()));
            // Create connections for users who haven't connected yet
            const newConnections = users.filter(userID => {
                if (userID.toString() === defaultAccount.id.toString())
                    return false; // Skip the default account itself
                return !existingUserConnections.has(userID.toString());
            });
            if (newConnections.length > 0) {
                // Bulk insert new user connections
                const newUserConnections = newConnections.map(userID => {
                    const newUserConnection = new userConnection_model_2.default();
                    newUserConnection.follower = userID;
                    newUserConnection.following = defaultAccount.id;
                    newUserConnection.status = userConnection_model_3.ConnectionStatus.ACCEPTED;
                    return newUserConnection;
                });
                yield userConnection_model_2.default.insertMany(newUserConnections);
                // console.log(`${newUserConnections.length} new connections created.`);
            }
            else {
                // console.log("No new connections were created.");
            }
        }
        catch (error) {
            console.error("Error during Follow THM process:", error);
        }
    });
}
const THMFollow = node_cron_1.default.schedule(constants_1.CronSchedule.EVERY_TWO_MINUTE, followTHM);
exports.default = THMFollow;
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
