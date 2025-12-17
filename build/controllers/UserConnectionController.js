"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const user_model_1 = require("../database/models/user.model");
const user_model_2 = __importDefault(require("../database/models/user.model"));
const userConnection_model_1 = __importStar(require("../database/models/userConnection.model"));
const basic_1 = require("../utils/helper/basic");
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const AppNotificationController_1 = __importDefault(require("./AppNotificationController"));
const notification_model_1 = require("../database/models/notification.model");
const user_model_3 = require("../database/models/user.model");
const uuid_1 = require("uuid");
const common_1 = require("../common");
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const sendFollowRequest = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const followingID = request.params.id;
        const { id } = request.user;
        const followingUser = yield user_model_2.default.findOne({ _id: followingID });
        if (!id || !followingUser) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (id === followingID) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Following your own account is not allowed. Please follow other users.z"), "Following your own account is not allowed. Please follow other users."));
        }
        const haveConnectedBefore = yield userConnection_model_1.default.findOne({
            $or: [
                // { follower: followingUser.id, following: id, status: { $in: [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED] } },
                { follower: id, following: followingUser.id, status: { $in: [userConnection_model_1.ConnectionStatus.PENDING, userConnection_model_1.ConnectionStatus.ACCEPTED] } },
            ]
        });
        if (!haveConnectedBefore) {
            const newUserConnection = new userConnection_model_1.default();
            newUserConnection.follower = id;
            newUserConnection.following = followingUser.id;
            if (!followingUser.privateAccount) {
                newUserConnection.status = userConnection_model_1.ConnectionStatus.ACCEPTED;
            }
            const follow = yield newUserConnection.save();
            if (follow.status === userConnection_model_1.ConnectionStatus.ACCEPTED) {
                AppNotificationController_1.default.store(id, followingUser.id, notification_model_1.NotificationType.FOLLOWING, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            }
            else {
                AppNotificationController_1.default.store(id, followingUser.id, notification_model_1.NotificationType.FOLLOW_REQUEST, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            }
            return response.send((0, response_1.httpCreated)(follow, "A follow request has already been sent"));
        }
        else {
            let Message = (haveConnectedBefore.status === userConnection_model_1.ConnectionStatus.ACCEPTED) ? "You are already following" : "Follow request already sent!";
            return response.send((0, response_1.httpAcceptedOrUpdated)(null, Message));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const acceptFollow = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const connectionID = request.params.id;
        const connection = yield userConnection_model_1.default.findOne({ _id: connectionID, following: id, status: userConnection_model_1.ConnectionStatus.PENDING });
        if (!connection) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Follow request not found"), "Follow request not found"));
        }
        if (connection.status !== userConnection_model_1.ConnectionStatus.ACCEPTED) {
            connection.status = userConnection_model_1.ConnectionStatus.ACCEPTED;
            yield connection.save();
            //Send self notification
            AppNotificationController_1.default.store(connection.follower, id, notification_model_1.NotificationType.FOLLOWING, { connectionID: connection.id, userID: connection.follower }).catch((error) => console.error(error));
            //Remove connection request notification from app notification
            AppNotificationController_1.default.destroy(connection.follower, connection.following, notification_model_1.NotificationType.FOLLOW_REQUEST, { connectionID: connection.id, userID: connection.following });
            //Notify the follower 
            AppNotificationController_1.default.store(id, connection.follower, notification_model_1.NotificationType.ACCEPT_FOLLOW_REQUEST, { connectionID: connection.id, userID: connection.follower });
            return response.send((0, response_1.httpAcceptedOrUpdated)(connection, "Follow request accepted"));
        }
        return response.send((0, response_1.httpAcceptedOrUpdated)(connection, "You are already following"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const rejectFollow = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const connectionID = request.params.id;
        const connection = yield userConnection_model_1.default.findOne({ _id: connectionID, following: id, status: userConnection_model_1.ConnectionStatus.PENDING });
        if (!connection) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Follow request not found"), "Follow request not found"));
        }
        if (connection.status !== userConnection_model_1.ConnectionStatus.ACCEPTED) {
            //Remove connection request notification from app notification
            AppNotificationController_1.default.destroy(connection.follower, connection.following, notification_model_1.NotificationType.FOLLOW_REQUEST, { connectionID: connection.id, userID: connection.following });
            // connection.status = ConnectionStatus.REJECT;
            yield connection.deleteOne();
            return response.send((0, response_1.httpAcceptedOrUpdated)(null, "Follow request rejected"));
        }
        return response.send((0, response_1.httpAcceptedOrUpdated)(null, "Follow request rejected"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const followBack = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const connectionID = request.params.id;
        const connection = yield userConnection_model_1.default.findOne({ _id: connectionID, following: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED });
        if (!connection) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Follow request not found"), "Follow request not found"));
        }
        //Send connection requestion
        const followingUser = yield user_model_2.default.findOne({ _id: connection.follower });
        if (!id || !followingUser) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const haveConnectedBefore = yield userConnection_model_1.default.findOne({
            $or: [
                // { follower: followingUser.id, following: id, status: { $in: [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED] } },
                { follower: id, following: followingUser.id, status: { $in: [userConnection_model_1.ConnectionStatus.PENDING, userConnection_model_1.ConnectionStatus.ACCEPTED] } },
            ]
        });
        if (!haveConnectedBefore) {
            const newUserConnection = new userConnection_model_1.default();
            newUserConnection.follower = id;
            newUserConnection.following = followingUser.id;
            if (!followingUser.privateAccount) {
                newUserConnection.status = userConnection_model_1.ConnectionStatus.ACCEPTED;
            }
            const follow = yield newUserConnection.save();
            if (follow.status === userConnection_model_1.ConnectionStatus.ACCEPTED) {
                AppNotificationController_1.default.store(id, followingUser.id, notification_model_1.NotificationType.FOLLOWING, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            }
            else {
                AppNotificationController_1.default.store(id, followingUser.id, notification_model_1.NotificationType.FOLLOW_REQUEST, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            }
            return response.send((0, response_1.httpCreated)(follow, "A follow request has already been sent"));
        }
        else {
            let Message = (haveConnectedBefore.status === userConnection_model_1.ConnectionStatus.ACCEPTED) ? "You are already following" : "Follow request already sent!";
            return response.send((0, response_1.httpAcceptedOrUpdated)(connection, Message));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const unFollow = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const followingID = request.params.id;
        const { id } = request.user;
        const followingUser = yield user_model_2.default.findOne({ _id: followingID });
        if (!id || !followingUser) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const connection = yield userConnection_model_1.default.findOne({ follower: id, following: followingUser.id });
        if (!connection) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Following not found"), "Following not found"));
        }
        yield connection.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Unfollowed user'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const follower = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const userID = request.params.id;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 30);
        const [user, blockedUsers] = yield Promise.all([
            user_model_2.default.findOne({ _id: userID }),
            (0, user_model_1.getBlockedByUsers)(id),
        ]);
        if (!id || !user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [followersIDs, inMyFollowing] = yield Promise.all([
            userConnection_model_1.default.distinct('follower', { following: userID, status: userConnection_model_1.ConnectionStatus.ACCEPTED, follower: { $nin: blockedUsers } }),
            userConnection_model_1.default.findOne({ following: userID, follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED })
        ]);
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This account is Private. Follow this account to see their following."), "This account is Private. Follow this account to see their following."));
        }
        const dbQuery = Object.assign({ _id: { $in: followersIDs } }, user_model_1.activeUserQuery);
        if (query !== undefined && query !== "") {
            //Search business profile
            const businessProfileIDs = yield businessProfile_model_1.default.distinct('_id', {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
            Object.assign(dbQuery, {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { businessProfileID: { $in: businessProfileIDs } }
                ]
            });
        }
        const [documents, totalDocument] = yield Promise.all([
            (0, user_model_1.getUserProfile)(dbQuery, pageNumber, documentLimit),
            user_model_2.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Follower fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const following = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const userID = request.params.id;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 30);
        const [user, blockedUsers] = yield Promise.all([
            user_model_2.default.findOne({ _id: userID }),
            (0, user_model_1.getBlockedByUsers)(id),
        ]);
        if (!id || !user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [followingIDs, inMyFollowing] = yield Promise.all([
            userConnection_model_1.default.distinct('following', { follower: userID, status: userConnection_model_1.ConnectionStatus.ACCEPTED, following: { $nin: blockedUsers } }),
            userConnection_model_1.default.findOne({ following: userID, follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED })
        ]);
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This account is Private. Follow this account to see their following."), "This account is Private. Follow this account to see their following."));
        }
        const dbQuery = Object.assign({ _id: { $in: followingIDs } }, user_model_1.activeUserQuery);
        if (query !== undefined && query !== "") {
            //Search business profile
            const businessProfileIDs = yield businessProfile_model_1.default.distinct('_id', {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
            Object.assign(dbQuery, {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { businessProfileID: { $in: businessProfileIDs } }
                ]
            });
        }
        const [documents, totalDocument] = yield Promise.all([
            (0, user_model_1.getUserProfile)(dbQuery, pageNumber, documentLimit),
            user_model_2.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Following fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const createDefaultProfile = () => __awaiter(void 0, void 0, void 0, function* () {
    const email = 'contact@thehotelmedia.com';
    const username = 'thehotelmedia';
    const name = 'The Hotel Media';
    const dialCode = '+91';
    const phoneNumber = '7738727020';
    const hostAddress = 'https://thehotelmedia.com';
    const isAccountExit = yield user_model_2.default.findOne({ email: email, role: common_1.Role.OFFICIAL });
    if (!isAccountExit) {
        const newUser = new user_model_2.default();
        newUser.profilePic = {
            small: hostAddress + '/public/files/thm-logo-sm.png',
            large: hostAddress + '/public/files/thm-logo-md.png',
            medium: hostAddress + '/public/files/thm-logo-lg.png'
        };
        newUser.bio = 'Your go-to app 📱 for honest reviews 💬\n and trusted ratings across a wide range of categories.';
        newUser.username = username;
        newUser.email = email;
        newUser.name = name;
        newUser.accountType = user_model_3.AccountType.INDIVIDUAL;
        newUser.dialCode = dialCode;
        newUser.phoneNumber = phoneNumber;
        newUser.password = (0, uuid_1.v4)();
        newUser.isActivated = true;
        newUser.isVerified = true;
        newUser.hasProfilePicture = true;
        newUser.privateAccount = false;
        newUser.role = common_1.Role.OFFICIAL;
        return yield newUser.save();
    }
    return isAccountExit;
});
exports.default = { index, sendFollowRequest, acceptFollow, rejectFollow, unFollow, follower, following, followBack, createDefaultProfile };
