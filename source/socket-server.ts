import { Server, Socket } from "socket.io";
import https from "http";
import { allowedOrigins } from "./app";
import { SocketUser, AppSocketUser, MongoID } from "./common";
import InMemorySessionStore from "./utils/sessionStore";
import User, { activeUserQuery, addBusinessProfileInUser } from "./database/models/user.model";
import { randomBytes } from 'crypto';
import { SocketChannel } from "./config/constants";
import moment from "moment";
import Message, { MessageType } from "./database/models/message.model";
import { PrivateIncomingMessagePayload } from "./common";
import { ObjectId } from "mongodb";
import { parseQueryParam } from "./utils/helper/basic";
import { Messages } from "./common";
import MessagingController from "./controllers/MessagingController";
import { fetchUserFollowing } from "./database/models/userConnection.model";
import DevicesConfig from "./database/models/appDeviceConfig.model";
import { v4 } from "uuid";
import { createMessagePayload } from "./notification/FirebaseNotificationController";
import { Message as FMessage } from "firebase-admin/lib/messaging/messaging-api";
import { sendNotification } from "./notification/FirebaseNotificationController";
import { NotificationType } from "./database/models/notification.model";
const sessionStore = new InMemorySessionStore();
const randomId = () => randomBytes(15).toString("hex");
export default function createSocketServer(httpServer: https.Server) {
    console.info("Socket Server:::")
    const io = new Server(httpServer, {
        allowEIO3: true,
        cors: { origin: allowedOrigins },
        pingInterval: 105000,
        pingTimeout: 100000
    });

    /** Auth middleware */
    io.use(async (socket, next) => {
        const username = socket.handshake.auth.username;
        if (!username) {
            console.error("invalid username", socket.handshake.auth);
            return next(new Error("invalid username"));
        }
        const user = await User.findOne({ username: username });
        if (!user) {
            console.error("unauthorized", socket.handshake.auth);
            return next(new Error("unauthorized"));
        }
        (socket as AppSocketUser).sessionID = randomId();
        (socket as AppSocketUser).username = username;
        (socket as AppSocketUser).userID = user.id;
        next();
    });
    io.on("connection", (socket) => {

        const sessionUser: SocketUser = {
            sessionID: (socket as AppSocketUser).sessionID,
            username: (socket as AppSocketUser).username,
            userID: (socket as AppSocketUser).userID,
            inChatScreen: false
        }
        console.log("Connection :::\n", socket.id, sessionUser)


        // Persist session
        sessionStore.saveSession((socket as AppSocketUser).username, sessionUser);

        socket.join((socket as AppSocketUser).username);


        socket.broadcast.emit(SocketChannel.USER_CONNECTED, (socket as AppSocketUser).username);
        socket.on(SocketChannel.USERS, () => {
            onlineUsers(socket, (socket as AppSocketUser).username)
        });


        socket.on(SocketChannel.TYPING, () => {
            // when the client emits 'typing', we broadcast it to others
            socket.broadcast.emit(SocketChannel.TYPING, {
                username: (socket as AppSocketUser).username
            });
        });


        socket.on(SocketChannel.STOP_TYPING, () => {
            socket.broadcast.emit(SocketChannel.STOP_TYPING, {
                username: (socket as AppSocketUser).username
            });
        })

        /**Done */
        socket.on(SocketChannel.PRIVATE_MESSAGE, async (data: PrivateIncomingMessagePayload, next) => {
            const currentSession = sessionStore.findSession(data.to);
            const isSeen = currentSession?.chatWith === (socket as AppSocketUser).username;
            const inChatScreen = currentSession?.inChatScreen ? currentSession?.inChatScreen : false;
            const messageData = {
                message: data.message,
                from: (socket as AppSocketUser).username,
                to: data.to,
                time: new Date().toISOString(),
                isSeen: isSeen ?? false
            }
            socket.to(data.to).to((socket as AppSocketUser).username).emit(SocketChannel.PRIVATE_MESSAGE, messageData);
            try {
                const sendedBy = await User.findOne({ username: (socket as AppSocketUser).username });
                const sendTo = await User.findOne({ username: data.to });
                if (sendedBy && sendTo) {
                    const newMessage = new Message();
                    newMessage.userID = sendedBy.id;
                    newMessage.targetUserID = sendTo.id;
                    newMessage.isSeen = messageData.isSeen;
                    switch (data.message.type) {
                        case MessageType.TEXT:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.TEXT;
                            break;
                        case MessageType.IMAGE:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.IMAGE;
                            newMessage.mediaUrl = data.message.mediaUrl;
                            break;
                        case MessageType.VIDEO:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.VIDEO;
                            newMessage.mediaUrl = data.message.mediaUrl;
                            break;
                        case MessageType.PDF:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.PDF;
                            newMessage.mediaUrl = data.message.mediaUrl;
                            break;
                    }
                    const savedMessage = await newMessage.save();
                    if (!inChatScreen) {
                        let message = savedMessage.message;
                        switch (savedMessage.type) {
                            case MessageType.IMAGE:
                                message = "📸 image";
                                break;
                            case MessageType.VIDEO:
                                message = "🎬 video";
                                break;
                            case MessageType.PDF:
                                message = "📝 pdf";
                                break;
                        }
                        sendMessageNotification(sendTo.id, message, sendedBy);
                    }
                }
            } catch (error: any) {
                console.error(error)
            }
        });


        socket.on(SocketChannel.CHAT_SCREEN, async (data: { query: string | undefined, pageNumber: number | undefined, documentLimit: number | undefined }) => {

            const ID = (socket as AppSocketUser).userID;
            let documentLimit;
            let pageNumber;
            let query;
            pageNumber = data?.pageNumber;
            query = data?.query;

            pageNumber = parseQueryParam(pageNumber, 1);
            documentLimit = parseQueryParam(documentLimit, 20);

            const messages: Messages = {
                totalMessages: 0,
                totalPages: 0,
                pageNo: pageNumber,
                messages: []
            }
            if (ID) {
                let onlineUsers: string[] = [];
                sessionStore.findAllSessions().map((session) => {
                    onlineUsers.push(session.username);
                });
                const findQuery = {
                    $or: [
                        { userID: new ObjectId(ID), deletedByID: { $nin: [ID] } },
                        { targetUserID: new ObjectId(ID), deletedByID: { $nin: [ID] } },

                    ]
                }
                if (query !== undefined && query !== "") {
                    const userProfileIDs = await User.distinct("_id", {
                        $or: [
                            { "personalInfo.name": { $regex: new RegExp(query.toLowerCase(), "i") } },
                            { "personalInfo.username": { $regex: new RegExp(query.toLowerCase(), "i") } },
                        ]
                    });
                    Object.assign(findQuery, {
                        $or: [
                            { userID: new ObjectId(ID), targetUserID: { $in: userProfileIDs }, deletedByID: { $nin: [ID] } },
                            { targetUserID: new ObjectId(ID), userID: { $in: userProfileIDs }, deletedByID: { $nin: [ID] } },
                        ]
                    });
                }
                const totalDocuments = await MessagingController.getChatCount(findQuery, ID, pageNumber, documentLimit);
                const recentChatHistory = await MessagingController.fetchChatByUserID(findQuery, ID, pageNumber, documentLimit);
                const totalPages = Math.ceil(totalDocuments / documentLimit) || 1;
                messages.totalMessages = totalDocuments;
                messages.totalPages = totalPages;
                messages.pageNo = pageNumber;
                messages.messages = recentChatHistory;
                socket.emit(SocketChannel.CHAT_SCREEN, messages);
            } else {
                socket.emit(SocketChannel.CHAT_SCREEN, messages);
            }
        })
        /**Done */
        socket.on(SocketChannel.FETCH_CONVERSATIONS, async (data: { username: string, pageNumber: number | undefined, documentLimit: number | undefined }) => {
            let username;
            let pageNumber;
            let documentLimit;
            username = data?.username;
            pageNumber = data?.pageNumber;
            pageNumber = parseQueryParam(pageNumber, 1);
            documentLimit = parseQueryParam(documentLimit, 20);
            const [user, targetUser] = await Promise.all([
                User.findOne({ username: (socket as AppSocketUser).username }),
                User.findOne({ username: username }),
            ]);
            const messages: Messages = {
                totalMessages: 0,
                totalPages: 0,
                pageNo: pageNumber,
                messages: []
            }
            if (targetUser && user) {
                let findQuery = {
                    $or: [
                        { userID: new ObjectId(user.id), targetUserID: new ObjectId(targetUser.id), deletedByID: { $nin: [user.id] } },
                        { userID: new ObjectId(targetUser.id), targetUserID: new ObjectId(user.id), deletedByID: { $nin: [user.id] } }
                    ]
                }
                await Message.updateMany({ targetUserID: user.id, userID: targetUser.id, isSeen: false }, { isSeen: true });
                const [totalMessages, conversations] = await Promise.all([
                    Message.find(findQuery).countDocuments(),
                    MessagingController.fetchMessagesByUserID(findQuery, user.id, pageNumber, documentLimit),
                ]);
                const totalPages = Math.ceil(totalMessages / documentLimit) || 1;
                messages.totalMessages = totalMessages;
                messages.totalPages = totalPages;
                messages.pageNo = pageNumber;
                messages.messages = conversations;
                socket.emit(SocketChannel.FETCH_CONVERSATIONS, messages);
            } else {
                socket.emit(SocketChannel.FETCH_CONVERSATIONS, messages);
            }
        });

        socket.on(SocketChannel.IN_PRIVATE_CHAT, (username: string) => {
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: username ?? undefined,
                inChatScreen: (socket as AppSocketUser).inChatScreen,
            });
            console.log("in chat", username);
        });

        socket.on(SocketChannel.LEAVE_PRIVATE_CHAT, () => {
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: undefined,
                inChatScreen: (socket as AppSocketUser).inChatScreen,
            });
            console.log("leave chat");
        });

        socket.on(SocketChannel.IN_CHAT, () => {
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: (socket as AppSocketUser).chatWith,
                inChatScreen: true,
            });
            console.log("in chat screen",);
        });

        socket.on(SocketChannel.LEAVE_CHAT, () => {
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: (socket as AppSocketUser).chatWith,
                inChatScreen: false,
            });
            console.log("leave chat screen");
        });

        socket.on(SocketChannel.MESSAGE_SEEN, async (username: string) => {
            const [targetUser, user] = await Promise.all([
                User.findOne({ username: username }),
                User.findOne({ username: (socket as AppSocketUser).username })
            ]);
            if (targetUser && user) {
                /**Update last seen */
                await Message.updateMany({ targetUserID: user.id, userID: targetUser.id, isSeen: false }, { isSeen: true });
                socket.to(username).emit("message seen");
            }
        });
        socket.on(SocketChannel.FETCH_LAST_SEEN, async (username: string) => {
            const targetUser = await User.findOne({ username: username });
            const user = await User.findOne({ username: (socket as AppSocketUser).username })
            if (targetUser && user) {
                /**
                 * Target User
                 */
                const isUserOnline = sessionStore.findSession(targetUser.username);
                if (isUserOnline) {
                    lastSeen(socket, 'Online');
                }
                if (!isUserOnline) {
                    lastSeen(socket, moment(targetUser.lastSeen).fromNow());
                }
            } else {
                lastSeen(socket, '')
            }
        });


        socket.on("disconnect", async () => {
            console.log("disconnect", (socket as AppSocketUser).username);
            socket.broadcast.emit(SocketChannel.USER_DISCONNECTED, (socket as AppSocketUser).username);
            sessionStore.destroySession((socket as AppSocketUser).username);
            updateLastSeen(socket);
        });
    });
    return io;
}

async function onlineUsers(socket: Socket, currentUsername: string) {
    let onlineUsers: (string | ObjectId)[] = [];
    let users: string[] = [];
    sessionStore.findAllSessions().map((session) => {
        onlineUsers.push(session.userID);
        users.push(session.username);
    });
    const myFollowingIDs = await fetchUserFollowing((socket as AppSocketUser).userID);
    const onlineFollowing = myFollowingIDs.filter((following) => onlineUsers.includes(following.toString()));
    const userList = await User.aggregate([
        {
            $match: {
                ...activeUserQuery,
                _id: { $in: onlineFollowing }
            }
        },
        {
            $addFields: {
                userID: '$_id',
            }
        },
        addBusinessProfileInUser().lookup,
        addBusinessProfileInUser().unwindLookup,
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
    ]);
    socket.emit(SocketChannel.USERS, userList);
}
function lastSeen(socket: Socket, message: string) {
    socket.emit(SocketChannel.LAST_SEEN, message);
}
async function updateLastSeen(socket: Socket) {
    const user = await User.findOne({ username: (socket as AppSocketUser).username });
    if (user) {
        user.lastSeen = new Date();
        await user.save();
    }
}

async function sendMessageNotification(targetUserID: MongoID, message: string, data: any,) {
    try {
        const notificationID = v4();
        const type = NotificationType.MESSAGING;
        const image = data?.profilePic?.small ?? '';
        let title = `${data.name ?? 'User'}`;
        const description = message;
        const devicesConfigs = await DevicesConfig.find({ userID: targetUserID });
        await Promise.all(devicesConfigs.map(async (devicesConfig) => {
            if (devicesConfig && devicesConfig.notificationToken) {
                const message: FMessage = createMessagePayload(devicesConfig.notificationToken, title, description, {
                    notificationID: notificationID,
                    devicePlatform: devicesConfig.devicePlatform,
                    type: type,
                    image: "",
                    profileImage: image
                });
                await sendNotification(message);
            }
            return devicesConfig;
        }));
    } catch (error) {
        console.error("Error sending one or more notifications:", error);
    }
}
