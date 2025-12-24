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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const sessionStore_1 = __importDefault(require("./utils/sessionStore"));
const user_model_1 = __importStar(require("./database/models/user.model"));
const crypto_1 = require("crypto");
const post_model_1 = __importDefault(require("./database/models/post.model"));
const constants_1 = require("./config/constants");
const moment_1 = __importDefault(require("moment"));
const message_model_1 = __importStar(require("./database/models/message.model"));
const mongodb_1 = require("mongodb");
const basic_1 = require("./utils/helper/basic");
const MessagingController_1 = __importDefault(require("./controllers/MessagingController"));
const userConnection_model_1 = require("./database/models/userConnection.model");
const appDeviceConfig_model_1 = __importDefault(require("./database/models/appDeviceConfig.model"));
const uuid_1 = require("uuid");
const FirebaseNotificationController_1 = require("./notification/FirebaseNotificationController");
const FirebaseNotificationController_2 = require("./notification/FirebaseNotificationController");
const notification_model_1 = require("./database/models/notification.model");
const anonymousUser_model_1 = require("./database/models/anonymousUser.model");
const businessProfile_model_1 = __importDefault(require("./database/models/businessProfile.model"));
const sessionStore = new sessionStore_1.default();
const randomId = () => (0, crypto_1.randomBytes)(15).toString("hex");
function createSocketServer(httpServer) {
    console.info("Socket Server:::");
    const io = new socket_io_1.Server(httpServer, {
        allowEIO3: true,
        cors: { origin: app_1.allowedOrigins },
        pingInterval: 105000,
        pingTimeout: 100000
    });
    /** Auth middleware */
    io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
        const username = socket.handshake.auth.username;
        if (!username) {
            console.error("invalid username", socket.handshake.auth);
            return next(new Error("invalid username"));
        }
        const user = yield user_model_1.default.findOne({ username: username });
        if (!user) {
            console.error("unauthorized", socket.handshake.auth);
            return next(new Error("unauthorized"));
        }
        socket.sessionID = randomId();
        socket.username = username;
        socket.userID = user.id;
        next();
    }));
    io.on("connection", (socket) => {
        const sessionUser = {
            sessionID: socket.sessionID,
            username: socket.username,
            userID: socket.userID,
            chatWith: undefined,
            inChatScreen: false,
        };
        console.log("Connection :::\n", socket.id, sessionUser);
        // Persist session
        sessionStore.saveSession(socket.username, sessionUser);
        socket.join(socket.username);
        socket.broadcast.emit(constants_1.SocketChannel.USER_CONNECTED, socket.username);
        socket.on(constants_1.SocketChannel.USERS, () => {
            onlineUsers(socket, socket.username);
        });
        socket.on(constants_1.SocketChannel.TYPING, () => {
            // when the client emits 'typing', we broadcast it to others
            socket.broadcast.emit(constants_1.SocketChannel.TYPING, {
                username: socket.username
            });
        });
        socket.on(constants_1.SocketChannel.STOP_TYPING, () => {
            socket.broadcast.emit(constants_1.SocketChannel.STOP_TYPING, {
                username: socket.username
            });
        });
        /**Done */
        socket.on(constants_1.SocketChannel.PRIVATE_MESSAGE, (data, next) => __awaiter(this, void 0, void 0, function* () {
            const currentSession = sessionStore.findSession(data.to);
            const isSeen = (currentSession === null || currentSession === void 0 ? void 0 : currentSession.chatWith) === socket.username;
            const inChatScreen = (currentSession === null || currentSession === void 0 ? void 0 : currentSession.inChatScreen) ? currentSession === null || currentSession === void 0 ? void 0 : currentSession.inChatScreen : false;
            const isOnline = currentSession ? true : false;
            const messageData = {
                message: data.message,
                from: socket.username,
                to: data.to,
                time: new Date().toISOString(),
                isSeen: isSeen !== null && isSeen !== void 0 ? isSeen : false
            };
            socket.to(data.to).to(socket.username).emit(constants_1.SocketChannel.PRIVATE_MESSAGE, messageData);
            // console.log(data)
            // return false
            try {
                const sendedBy = yield user_model_1.default.findOne({ username: socket.username });
                const sendTo = yield user_model_1.default.findOne({ username: data.to });
                if (sendedBy && sendTo) {
                    const newMessage = new message_model_1.default();
                    newMessage.userID = sendedBy.id;
                    newMessage.targetUserID = sendTo.id;
                    newMessage.isSeen = messageData.isSeen;
                    switch (data.message.type) {
                        case message_model_1.MessageType.TEXT:
                            newMessage.message = data.message.message;
                            newMessage.type = message_model_1.MessageType.TEXT;
                            break;
                        case message_model_1.MessageType.IMAGE:
                            newMessage.message = data.message.message;
                            newMessage.type = message_model_1.MessageType.IMAGE;
                            if (data.message.mediaID) {
                                newMessage.mediaID = data.message.mediaID;
                            }
                            if (data.message.postID) {
                                newMessage.postID = data.message.postID;
                            }
                            break;
                        case message_model_1.MessageType.VIDEO:
                            newMessage.message = data.message.message;
                            newMessage.type = message_model_1.MessageType.VIDEO;
                            if (data.message.mediaID) {
                                newMessage.mediaID = data.message.mediaID;
                            }
                            if (data.message.postID) {
                                newMessage.postID = data.message.postID;
                            }
                            break;
                        case message_model_1.MessageType.PDF:
                            newMessage.message = data.message.message;
                            newMessage.type = message_model_1.MessageType.PDF;
                            if (data.message.mediaID) {
                                newMessage.mediaID = data.message.mediaID;
                            }
                            if (data.message.postID) {
                                newMessage.postID = data.message.postID;
                            }
                            break;
                        //TODO Also add in chat export 
                        case message_model_1.MessageType.STORY_COMMENT:
                            newMessage.message = data.message.message;
                            newMessage.type = message_model_1.MessageType.STORY_COMMENT;
                            // newMessage.mediaUrl = data.message.mediaUrl;
                            if (data.message.mediaID && data.message.storyID) {
                                newMessage.mediaID = data.message.mediaID;
                                newMessage.storyID = data.message.storyID;
                            }
                            break;
                    }
                    const savedMessage = yield newMessage.save();
                    let message = savedMessage.message;
                    switch (savedMessage.type) {
                        case message_model_1.MessageType.IMAGE:
                            message = "📸 image";
                            break;
                        case message_model_1.MessageType.VIDEO:
                            message = "🎬 video";
                            break;
                        case message_model_1.MessageType.PDF:
                            message = "📝 pdf";
                            break;
                        case message_model_1.MessageType.STORY_COMMENT:
                            message = "replied to your story";
                            break;
                    }
                    if (isOnline) {
                        if (!inChatScreen) {
                            sendMessageNotification(sendTo.id, message, sendedBy);
                        }
                    }
                    else {
                        sendMessageNotification(sendTo.id, message, sendedBy);
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
        }));
        socket.on(constants_1.SocketChannel.CHAT_SCREEN, (data) => __awaiter(this, void 0, void 0, function* () {
            const ID = socket.userID;
            let documentLimit;
            let pageNumber;
            let query;
            pageNumber = data === null || data === void 0 ? void 0 : data.pageNumber;
            query = data === null || data === void 0 ? void 0 : data.query;
            pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
            documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
            const messages = {
                totalMessages: 0,
                totalPages: 0,
                pageNo: pageNumber,
                messages: []
            };
            if (ID) {
                let onlineUsers = [];
                sessionStore.findAllSessions().map((session) => {
                    onlineUsers.push(session.username);
                });
                const findQuery = {
                    $or: [
                        { userID: new mongodb_1.ObjectId(ID), deletedByID: { $nin: [new mongodb_1.ObjectId(ID)] } },
                        { targetUserID: new mongodb_1.ObjectId(ID), deletedByID: { $nin: [new mongodb_1.ObjectId(ID)] } },
                    ]
                };
                if (query !== undefined && query !== "") {
                    const businessProfileIDs = yield businessProfile_model_1.default.distinct("_id", {
                        $or: [
                            { "name": { $regex: new RegExp(query.toLowerCase(), "i") } },
                            { "username": { $regex: new RegExp(query.toLowerCase(), "i") } },
                        ]
                    });
                    const [userIDs] = yield Promise.all([
                        user_model_1.default.distinct("_id", {
                            $or: [
                                { "name": { $regex: new RegExp(query.toLowerCase(), "i") } },
                                { "username": { $regex: new RegExp(query.toLowerCase(), "i") } },
                                { "businessProfileID": { $in: businessProfileIDs } }
                            ]
                        }),
                    ]);
                    Object.assign(findQuery, {
                        $or: [
                            { userID: new mongodb_1.ObjectId(ID), targetUserID: { $in: userIDs }, deletedByID: { $nin: [ID] } },
                            { targetUserID: new mongodb_1.ObjectId(ID), userID: { $in: userIDs }, deletedByID: { $nin: [ID] } },
                        ]
                    });
                }
                const totalDocuments = yield MessagingController_1.default.getChatCount(findQuery, ID, pageNumber, documentLimit);
                const recentChatHistory = yield MessagingController_1.default.fetchChatByUserID(findQuery, ID, pageNumber, documentLimit);
                const totalPages = Math.ceil(totalDocuments / documentLimit) || 1;
                messages.totalMessages = totalDocuments;
                messages.totalPages = totalPages;
                messages.pageNo = pageNumber;
                messages.messages = recentChatHistory;
                socket.emit(constants_1.SocketChannel.CHAT_SCREEN, messages);
            }
            else {
                socket.emit(constants_1.SocketChannel.CHAT_SCREEN, messages);
            }
        }));
        /**Done */
        socket.on(constants_1.SocketChannel.FETCH_CONVERSATIONS, (data) => __awaiter(this, void 0, void 0, function* () {
            let username;
            let pageNumber;
            let documentLimit;
            username = data === null || data === void 0 ? void 0 : data.username;
            pageNumber = data === null || data === void 0 ? void 0 : data.pageNumber;
            pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
            documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
            const [user, targetUser] = yield Promise.all([
                user_model_1.default.findOne({ username: socket.username }),
                user_model_1.default.findOne({ username: username }),
            ]);
            const messages = {
                totalMessages: 0,
                totalPages: 0,
                pageNo: pageNumber,
                messages: []
            };
            if (targetUser && user) {
                let findQuery = {
                    $or: [
                        { userID: new mongodb_1.ObjectId(user.id), targetUserID: new mongodb_1.ObjectId(targetUser.id), deletedByID: { $nin: [new mongodb_1.ObjectId(user.id)] } },
                        { userID: new mongodb_1.ObjectId(targetUser.id), targetUserID: new mongodb_1.ObjectId(user.id), deletedByID: { $nin: [new mongodb_1.ObjectId(user.id)] } }
                    ]
                };
                yield message_model_1.default.updateMany({ targetUserID: user.id, userID: targetUser.id, isSeen: false }, { isSeen: true });
                const [totalMessages, conversations] = yield Promise.all([
                    message_model_1.default.find(findQuery).countDocuments(),
                    MessagingController_1.default.fetchMessagesByUserID(findQuery, user.id, pageNumber, documentLimit),
                ]);
                const totalPages = Math.ceil(totalMessages / documentLimit) || 1;
                messages.totalMessages = totalMessages;
                messages.totalPages = totalPages;
                messages.pageNo = pageNumber;
                messages.messages = conversations;
                socket.emit(constants_1.SocketChannel.FETCH_CONVERSATIONS, messages);
            }
            else {
                socket.emit(constants_1.SocketChannel.FETCH_CONVERSATIONS, messages);
            }
        }));
        socket.on(constants_1.SocketChannel.IN_PRIVATE_CHAT, (username) => {
            console.log("in private chat", username);
            sessionStore.saveSession(socket.username, {
                username: socket.username,
                sessionID: socket.sessionID,
                userID: socket.userID,
                chatWith: username !== null && username !== void 0 ? username : socket.chatWith,
                inChatScreen: true,
            });
            console.log(sessionStore);
        });
        socket.on(constants_1.SocketChannel.LEAVE_PRIVATE_CHAT, () => {
            console.log("leave private chat", socket.chatWith);
            sessionStore.saveSession(socket.username, {
                username: socket.username,
                sessionID: socket.sessionID,
                userID: socket.userID,
                chatWith: undefined,
                inChatScreen: false,
            });
            console.log(sessionStore);
        });
        socket.on(constants_1.SocketChannel.IN_CHAT, () => {
            sessionStore.saveSession(socket.username, {
                username: socket.username,
                sessionID: socket.sessionID,
                userID: socket.userID,
                chatWith: undefined,
                inChatScreen: true,
            });
            console.log("in chat screen");
        });
        socket.on(constants_1.SocketChannel.LEAVE_CHAT, () => {
            sessionStore.saveSession(socket.username, {
                username: socket.username,
                sessionID: socket.sessionID,
                userID: socket.userID,
                chatWith: undefined,
                inChatScreen: false,
            });
            console.log("leave chat screen");
        });
        socket.on(constants_1.SocketChannel.MESSAGE_SEEN, (username) => __awaiter(this, void 0, void 0, function* () {
            const [targetUser, user] = yield Promise.all([
                user_model_1.default.findOne({ username: username }),
                user_model_1.default.findOne({ username: socket.username })
            ]);
            if (targetUser && user) {
                /**Update last seen */
                yield message_model_1.default.updateMany({ targetUserID: user.id, userID: targetUser.id, isSeen: false }, { isSeen: true });
                socket.to(username).emit("message seen");
            }
        }));
        socket.on(constants_1.SocketChannel.FETCH_LAST_SEEN, (username) => __awaiter(this, void 0, void 0, function* () {
            const targetUser = yield user_model_1.default.findOne({ username: username });
            const user = yield user_model_1.default.findOne({ username: socket.username });
            if (targetUser && user) {
                /**
                 * Target User
                 */
                const isUserOnline = sessionStore.findSession(targetUser.username);
                if (isUserOnline) {
                    lastSeen(socket, 'Online');
                }
                if (!isUserOnline) {
                    lastSeen(socket, (0, moment_1.default)(targetUser.lastSeen).fromNow());
                }
            }
            else {
                lastSeen(socket, '');
            }
        }));
        socket.on(constants_1.SocketChannel.COLLAB_INVITE, (data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { postID, invitedUserID } = data;
                const requesterID = socket.userID;
                const post = yield post_model_1.default.findById(postID);
                if (!post) {
                    return socket.emit("error", { message: "Post not found" });
                }
                if (post.userID.toString() !== requesterID.toString()) {
                    return socket.emit("error", { message: "Only post owner can invite collaborators" });
                }
                // Avoid duplicate invites
                const alreadyInvited = (_a = post.collaborationInvites) === null || _a === void 0 ? void 0 : _a.some((invite) => { var _a; return ((_a = invite.invitedUserID) === null || _a === void 0 ? void 0 : _a.toString()) === invitedUserID.toString() && invite.status === "pending"; });
                if (alreadyInvited) {
                    return socket.emit("error", { message: "User already invited" });
                }
                // Push invite
                (_b = post.collaborationInvites) === null || _b === void 0 ? void 0 : _b.push({ invitedUserID });
                yield post.save();
                // Notify invited user in real time
                socket.to(invitedUserID.toString()).emit(constants_1.SocketChannel.COLLAB_INVITE, {
                    postID,
                    invitedBy: requesterID,
                    message: "You’ve been invited to collaborate on a post.",
                });
                console.log(`Collaboration invite sent from ${requesterID} to ${invitedUserID}`);
            }
            catch (error) {
                console.error("COLLAB_INVITE_ERROR:", error);
            }
        }));
        // Accept or decline collaboration
        socket.on(constants_1.SocketChannel.COLLAB_RESPONSE, (data) => __awaiter(this, void 0, void 0, function* () {
            var _c, _d, _e;
            try {
                const { postID, action } = data;
                const userID = socket.userID;
                const post = yield post_model_1.default.findById(postID);
                if (!post)
                    return socket.emit("error", { message: "Post not found" });
                const invite = (_c = post.collaborationInvites) === null || _c === void 0 ? void 0 : _c.find((i) => { var _a; return ((_a = i.invitedUserID) === null || _a === void 0 ? void 0 : _a.toString()) === userID.toString(); });
                if (!invite)
                    return socket.emit("error", { message: "No pending invite found" });
                if (invite.status !== "pending")
                    return socket.emit("error", { message: "Invite already responded to" });
                // Update status
                //@ts-ignore
                invite.status = action;
                invite.respondedAt = new Date();
                if (action === "accept") {
                    if (!((_d = post.collaborators) === null || _d === void 0 ? void 0 : _d.some((c) => c.toString() === userID.toString()))) {
                        (_e = post.collaborators) === null || _e === void 0 ? void 0 : _e.push(new mongodb_1.ObjectId(userID));
                    }
                }
                yield post.save();
                // Notify post owner
                const postOwner = post.userID.toString();
                socket.to(postOwner).emit(constants_1.SocketChannel.COLLAB_RESPONSE, {
                    postID,
                    fromUser: userID,
                    action,
                    message: `User ${action}ed your collaboration invite.`,
                });
                // Notify both users to refresh their post feed (if accepted)
                if (action === "accept") {
                    socket.to(postOwner).emit(constants_1.SocketChannel.COLLAB_UPDATE, {
                        postID,
                        collaborator: userID,
                        updateType: "new_collaboration",
                    });
                    socket.emit(constants_1.SocketChannel.COLLAB_UPDATE, {
                        postID,
                        collaborator: userID,
                        updateType: "new_collaboration",
                    });
                }
                console.log(`Collaboration ${action}ed by ${userID} for post ${postID}`);
            }
            catch (error) {
                console.error("COLLAB_RESPONSE_ERROR:", error);
            }
        }));
        socket.on(constants_1.SocketChannel.COLLAB_UPDATE, (data) => __awaiter(this, void 0, void 0, function* () {
            var _f;
            const { postID, updateType } = data;
            const post = yield post_model_1.default.findById(postID);
            if (!post)
                return;
            //@ts-ignore
            const targetUsers = [post.userID.toString(), ...(_f = post.collaborators) === null || _f === void 0 ? void 0 : _f.map(String)];
            for (const user of targetUsers) {
                socket.to(user).emit(constants_1.SocketChannel.COLLAB_UPDATE, {
                    postID,
                    updateType,
                    message: "Post insights updated",
                });
            }
        }));
        socket.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
            console.log("disconnect", socket.username);
            socket.broadcast.emit(constants_1.SocketChannel.USER_DISCONNECTED, socket.username);
            sessionStore.destroySession(socket.username);
            updateLastSeen(socket);
        }));
    });
    return io;
}
exports.default = createSocketServer;
function onlineUsers(socket, currentUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        let onlineUsers = [];
        let users = [];
        sessionStore.findAllSessions().map((session) => {
            onlineUsers.push(session.userID);
            users.push(session.username);
        });
        const myFollowingIDs = yield (0, userConnection_model_1.fetchUserFollowing)(socket.userID);
        const onlineFollowing = myFollowingIDs.filter((following) => onlineUsers.includes(following.toString()));
        const userList = yield user_model_1.default.aggregate([
            {
                $match: Object.assign(Object.assign({}, user_model_1.activeUserQuery), { _id: { $in: onlineFollowing } })
            },
            {
                $addFields: {
                    userID: '$_id',
                }
            },
            (0, user_model_1.addBusinessProfileInUser)().lookup,
            (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
            {
                '$replaceRoot': {
                    'newRoot': {
                        '$mergeObjects': ["$$ROOT", "$businessProfileRef"] // Merge businessProfileRef with the user object
                    }
                }
            },
            {
                $addFields: {
                    isOnline: {
                        $cond: {
                            if: { "$in": ["$username", users] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $sort: {
                    isOnline: -1,
                    lastSeen: -1,
                }
            },
            {
                $project: {
                    _id: '$userID',
                    name: 1,
                    username: 1,
                    profilePic: 1,
                    isOnline: 1,
                }
            },
            {
                $limit: 20
            }
        ]);
        socket.emit(constants_1.SocketChannel.USERS, userList);
    });
}
function lastSeen(socket, message) {
    socket.emit(constants_1.SocketChannel.LAST_SEEN, message);
}
function updateLastSeen(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield user_model_1.default.findOne({ username: socket.username });
        if (user) {
            user.lastSeen = new Date();
            yield user.save();
        }
    });
}
function sendMessageNotification(targetUserID, message, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const notificationID = (0, uuid_1.v4)();
            const type = notification_model_1.NotificationType.MESSAGING;
            let profileImage = ((_a = data === null || data === void 0 ? void 0 : data.profilePic) === null || _a === void 0 ? void 0 : _a.small) || '';
            let title = `${data.name || 'User'}`;
            const description = message;
            const accountType = (data === null || data === void 0 ? void 0 : data.accountType) || undefined;
            if (accountType && accountType === anonymousUser_model_1.AccountType.BUSINESS && data && data.businessProfileID) {
                const businessProfile = yield businessProfile_model_1.default.findOne({ _id: data.businessProfileID });
                if (businessProfile) {
                    title = `${businessProfile.name || 'User'}`;
                    profileImage = ((_b = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.profilePic) === null || _b === void 0 ? void 0 : _b.small) || '';
                }
            }
            const devicesConfigs = yield appDeviceConfig_model_1.default.find({ userID: targetUserID });
            yield Promise.all(devicesConfigs.map((devicesConfig) => __awaiter(this, void 0, void 0, function* () {
                if (devicesConfig && devicesConfig.notificationToken) {
                    const message = (0, FirebaseNotificationController_1.createMessagePayload)(devicesConfig.notificationToken, title, description, {
                        notificationID: notificationID,
                        devicePlatform: devicesConfig.devicePlatform,
                        type: type,
                        image: "",
                        profileImage,
                    });
                    yield (0, FirebaseNotificationController_2.sendNotification)(message);
                }
                return devicesConfig;
            })));
        }
        catch (error) {
            console.error("Error sending one or more notifications:", error);
        }
    });
}
