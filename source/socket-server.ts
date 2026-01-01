import { Server, Socket } from "socket.io";
import https from "http";
import { allowedOrigins } from "./app";
import { SocketUser, AppSocketUser, MongoID } from "./common";
import InMemorySessionStore from "./utils/sessionStore";
import User, { activeUserQuery, addBusinessProfileInUser, IUser } from "./database/models/user.model";
import { randomBytes } from 'crypto';
import Post from "./database/models/post.model";
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
import { AccountType } from "./database/models/anonymousUser.model";
import BusinessProfile from "./database/models/businessProfile.model";
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
            chatWith: undefined,
            inChatScreen: false,
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
            const isOnline = currentSession ? true : false;
            try {
                const sendedBy = await User.findOne({ username: (socket as AppSocketUser).username });
                const sendTo = await User.findOne({ username: data.to });
                if (sendedBy && sendTo) {
                    const newMessage = new Message();
                    newMessage.userID = sendedBy.id;
                    newMessage.targetUserID = sendTo.id;
                    newMessage.isSeen = isSeen ?? false;
                    switch (data.message.type) {
                        case MessageType.TEXT:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.TEXT;
                            break;
                        case MessageType.IMAGE:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.IMAGE;
                            if (data.message.mediaID) {
                                newMessage.mediaID = data.message.mediaID;
                            }
                            if (data.message.postID) {
                                newMessage.postID = data.message.postID;
                            }
                            break;
                        case MessageType.VIDEO:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.VIDEO;
                            if (data.message.mediaID) {
                                newMessage.mediaID = data.message.mediaID;
                            }
                            if (data.message.postID) {
                                newMessage.postID = data.message.postID;
                            }
                            break;
                        case MessageType.PDF:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.PDF;
                            if (data.message.mediaID) {
                                newMessage.mediaID = data.message.mediaID;
                            }
                            if (data.message.postID) {
                                newMessage.postID = data.message.postID;
                            }
                            break;

                        //TODO Also add in chat export 
                        case MessageType.STORY_COMMENT:
                            newMessage.message = data.message.message;
                            newMessage.type = MessageType.STORY_COMMENT;
                            // newMessage.mediaUrl = data.message.mediaUrl;
                            if (data.message.mediaID && data.message.storyID) {
                                newMessage.mediaID = data.message.mediaID;
                                newMessage.storyID = data.message.storyID;
                            }
                            break;
                    }
                    const savedMessage = await newMessage.save();
                    const messageID = String(savedMessage._id);
                    const messageData = {
                        message: {
                            ...data.message,
                            messageID: messageID
                        },
                        from: (socket as AppSocketUser).username,
                        to: data.to,
                        time: new Date().toISOString(),
                        isSeen: isSeen ?? false,
                        isEdited: false
                    }
                    socket.to(data.to).to((socket as AppSocketUser).username).emit(SocketChannel.PRIVATE_MESSAGE, messageData);

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
                        case MessageType.STORY_COMMENT:
                            message = "replied to your story";
                            break;
                    }
                    if (isOnline) {
                        if (!inChatScreen) {
                            sendMessageNotification(sendTo.id, message, sendedBy);
                        }
                    } else {
                        sendMessageNotification(sendTo.id, message, sendedBy);
                    }
                }
            } catch (error: any) {
                console.error(error)
            }
        });

        socket.on(SocketChannel.EDIT_MESSAGE, async (...args: any[]) => {
            // Handle different data formats
            const data = args[0] || {};
            console.log("EDIT_MESSAGE received - Raw args:", args);
            console.log("EDIT_MESSAGE received - Parsed data:", data, "from user:", (socket as AppSocketUser).username);
            try {
                const messageID = data.messageID || data.messageId;
                const message = data.message || data.text;

                if (!messageID || !message) {
                    console.log("EDIT_MESSAGE: Missing required fields", { messageID, message });
                    return socket.emit("error", { message: "Missing messageID or message field" });
                }
                const user = await User.findOne({ username: (socket as AppSocketUser).username });
                if (!user) {
                    return socket.emit("error", { message: "User not found" });
                }

                // Validate ObjectId format
                if (!ObjectId.isValid(messageID)) {
                    console.log("EDIT_MESSAGE: Invalid message ID format:", messageID);
                    return socket.emit("error", { message: "Invalid message ID format" });
                }

                const messageDoc = await Message.findById(new ObjectId(messageID));
                if (!messageDoc) {
                    console.log("EDIT_MESSAGE: Message not found with ID:", messageID);
                    return socket.emit("error", { message: "Message not found" });
                }

                // Only the sender can edit the message
                if (messageDoc.userID.toString() !== user.id.toString()) {
                    console.log("EDIT_MESSAGE: User not authorized to edit message");
                    return socket.emit("error", { message: "You can only edit your own messages" });
                }

                // Update message
                messageDoc.message = message;
                messageDoc.isEdited = true;
                messageDoc.editedAt = new Date();
                const updatedMessage = await messageDoc.save();

                // Get the target user for broadcasting
                const targetUser = await User.findById(messageDoc.targetUserID);
                if (!targetUser) {
                    return socket.emit("error", { message: "Target user not found" });
                }

                // Emit updated message to both users
                const updatePayload = {
                    messageID: String(updatedMessage._id),
                    message: updatedMessage.message,
                    isEdited: true,
                    editedAt: updatedMessage.editedAt?.toISOString(),
                    from: (socket as AppSocketUser).username,
                    to: targetUser.username
                };

                socket.to(targetUser.username).to((socket as AppSocketUser).username).emit(SocketChannel.EDIT_MESSAGE, updatePayload);
                console.log("EDIT_MESSAGE: Edit event emitted to users:", updatePayload);
            } catch (error: any) {
                console.error("EDIT_MESSAGE_ERROR:", error);
                socket.emit("error", { message: error.message || "Failed to edit message" });
            }
        });

        // Catch-all listener for debugging (log any unhandled events)
        socket.onAny((eventName, ...args) => {
            if (eventName === SocketChannel.EDIT_MESSAGE || eventName === SocketChannel.DELETE_MESSAGE) {
                console.log("DEBUG: Event received via onAny:", eventName, "Args:", args);
            }
        });

        socket.on(SocketChannel.DELETE_MESSAGE, async (...args: any[]) => {
            // Handle different data formats
            const data = args[0] || {};
            console.log("DELETE_MESSAGE received - Raw args:", args);
            console.log("DELETE_MESSAGE received - Parsed data:", data, "from user:", (socket as AppSocketUser).username);
            try {
                const user = await User.findOne({ username: (socket as AppSocketUser).username });
                if (!user) {
                    console.log("DELETE_MESSAGE: User not found");
                    return socket.emit("error", { message: "User not found" });
                }

                const messageID = data.messageID || data.messageId;

                if (!messageID) {
                    console.log("DELETE_MESSAGE: Missing messageID field");
                    return socket.emit("error", { message: "Missing messageID field" });
                }

                // Validate ObjectId format
                if (!ObjectId.isValid(messageID)) {
                    console.log("DELETE_MESSAGE: Invalid message ID format:", messageID);
                    return socket.emit("error", { message: "Invalid message ID format" });
                }

                const message = await Message.findById(new ObjectId(messageID));
                if (!message) {
                    console.log("DELETE_MESSAGE: Message not found with ID:", messageID);
                    return socket.emit("error", { message: "Message not found" });
                }

                // Only the sender can delete the message
                if (message.userID.toString() !== user.id.toString()) {
                    console.log("DELETE_MESSAGE: User not authorized to delete message");
                    return socket.emit("error", { message: "You can only delete your own messages" });
                }

                // Get target user before deletion for broadcasting
                const targetUser = await User.findById(message.targetUserID);
                if (!targetUser) {
                    console.log("DELETE_MESSAGE: Target user not found");
                    return socket.emit("error", { message: "Target user not found" });
                }

                // Hard delete the message
                await Message.findByIdAndDelete(new ObjectId(messageID));
                console.log("DELETE_MESSAGE: Message deleted successfully:", messageID);

                // Emit delete event to both users
                const deletePayload = {
                    messageID: messageID,
                    from: (socket as AppSocketUser).username,
                    to: targetUser.username
                };

                socket.to(targetUser.username).to((socket as AppSocketUser).username).emit(SocketChannel.DELETE_MESSAGE, deletePayload);
                console.log("DELETE_MESSAGE: Delete event emitted to users:", deletePayload);
            } catch (error: any) {
                console.error("DELETE_MESSAGE_ERROR:", error);
                socket.emit("error", { message: error.message || "Failed to delete message" });
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
                        { userID: new ObjectId(ID), deletedByID: { $nin: [new ObjectId(ID)] } },
                        { targetUserID: new ObjectId(ID), deletedByID: { $nin: [new ObjectId(ID)] } },

                    ]
                }
                if (query !== undefined && query !== "") {
                    const businessProfileIDs = await BusinessProfile.distinct("_id", {
                        $or: [
                            { "name": { $regex: new RegExp(query.toLowerCase(), "i") } },
                            { "username": { $regex: new RegExp(query.toLowerCase(), "i") } },
                        ]
                    });
                    const [userIDs] = await Promise.all([
                        User.distinct("_id", {
                            $or: [
                                { "name": { $regex: new RegExp(query.toLowerCase(), "i") } },
                                { "username": { $regex: new RegExp(query.toLowerCase(), "i") } },
                                { "businessProfileID": { $in: businessProfileIDs } }
                            ]
                        }),

                    ]);
                    Object.assign(findQuery, {
                        $or: [
                            { userID: new ObjectId(ID), targetUserID: { $in: userIDs }, deletedByID: { $nin: [ID] } },
                            { targetUserID: new ObjectId(ID), userID: { $in: userIDs }, deletedByID: { $nin: [ID] } },
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
                        { userID: new ObjectId(user.id), targetUserID: new ObjectId(targetUser.id), deletedByID: { $nin: [new ObjectId(user.id)] } },
                        { userID: new ObjectId(targetUser.id), targetUserID: new ObjectId(user.id), deletedByID: { $nin: [new ObjectId(user.id)] } }
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
            console.log("in private chat", username);
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: username ?? (socket as AppSocketUser).chatWith,
                inChatScreen: true,
            });
            console.log(sessionStore);
        });

        socket.on(SocketChannel.LEAVE_PRIVATE_CHAT, () => {
            console.log("leave private chat", (socket as AppSocketUser).chatWith);
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: undefined,
                inChatScreen: false,
            });
            console.log(sessionStore);
        });

        socket.on(SocketChannel.IN_CHAT, () => {
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: undefined,
                inChatScreen: true,
            });
            console.log("in chat screen");
        });

        socket.on(SocketChannel.LEAVE_CHAT, () => {
            sessionStore.saveSession((socket as AppSocketUser).username, {
                username: (socket as AppSocketUser).username,
                sessionID: (socket as AppSocketUser).sessionID,
                userID: (socket as AppSocketUser).userID,
                chatWith: undefined,
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
        socket.on(SocketChannel.COLLAB_INVITE, async (data: { postID: string; invitedUserID: string }) => {
            try {
                const { postID, invitedUserID } = data;
                const requesterID = (socket as AppSocketUser).userID;

                const post = await Post.findById(postID);
                if (!post) {
                    return socket.emit("error", { message: "Post not found" });
                }

                if (post.userID.toString() !== requesterID.toString()) {
                    return socket.emit("error", { message: "Only post owner can invite collaborators" });
                }

                // Avoid duplicate invites
                const alreadyInvited = post.collaborationInvites?.some(
                    (invite) => invite.invitedUserID?.toString() === invitedUserID.toString() && invite.status === "pending"
                );
                if (alreadyInvited) {
                    return socket.emit("error", { message: "User already invited" });
                }

                // Push invite
                post.collaborationInvites?.push({ invitedUserID });
                await post.save();

                // Notify invited user in real time
                socket.to(invitedUserID.toString()).emit(SocketChannel.COLLAB_INVITE, {
                    postID,
                    invitedBy: requesterID,
                    message: "You’ve been invited to collaborate on a post.",
                });

                console.log(`Collaboration invite sent from ${requesterID} to ${invitedUserID}`);
            } catch (error) {
                console.error("COLLAB_INVITE_ERROR:", error);
            }
        });


        // Accept or decline collaboration
        socket.on(SocketChannel.COLLAB_RESPONSE, async (data: { postID: string; action: "accept" | "decline" }) => {
            try {
                const { postID, action } = data;
                const userID = (socket as AppSocketUser).userID;

                const post = await Post.findById(postID);
                if (!post) return socket.emit("error", { message: "Post not found" });

                const invite = post.collaborationInvites?.find(
                    (i) => i.invitedUserID?.toString() === userID.toString()
                );
                if (!invite) return socket.emit("error", { message: "No pending invite found" });
                if (invite.status !== "pending") return socket.emit("error", { message: "Invite already responded to" });

                // Update status
                //@ts-ignore
                invite.status = action;
                invite.respondedAt = new Date();

                if (action === "accept") {
                    if (!post.collaborators?.some((c) => c.toString() === userID.toString())) {
                        post.collaborators?.push(new ObjectId(userID));
                    }
                }

                await post.save();

                // Notify post owner
                const postOwner = post.userID.toString();
                socket.to(postOwner).emit(SocketChannel.COLLAB_RESPONSE, {
                    postID,
                    fromUser: userID,
                    action,
                    message: `User ${action}ed your collaboration invite.`,
                });

                // Notify both users to refresh their post feed (if accepted)
                if (action === "accept") {
                    socket.to(postOwner).emit(SocketChannel.COLLAB_UPDATE, {
                        postID,
                        collaborator: userID,
                        updateType: "new_collaboration",
                    });
                    socket.emit(SocketChannel.COLLAB_UPDATE, {
                        postID,
                        collaborator: userID,
                        updateType: "new_collaboration",
                    });
                }

                console.log(`Collaboration ${action}ed by ${userID} for post ${postID}`);
            } catch (error) {
                console.error("COLLAB_RESPONSE_ERROR:", error);
            }
        });
        socket.on(SocketChannel.COLLAB_UPDATE, async (data: { postID: string; updateType: string }) => {
            const { postID, updateType } = data;
            const post = await Post.findById(postID);
            if (!post) return;
            //@ts-ignore
            const targetUsers = [post.userID.toString(), ...post.collaborators?.map(String)];
            for (const user of targetUsers) {
                socket.to(user).emit(SocketChannel.COLLAB_UPDATE, {
                    postID,
                    updateType,
                    message: "Post insights updated",
                });
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
        {
            $limit: 20
        }
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

async function sendMessageNotification(targetUserID: MongoID, message: string, data: IUser) {
    try {
        const notificationID = v4();
        const type = NotificationType.MESSAGING;
        let profileImage = data?.profilePic?.small || '';
        let title = `${data.name || 'User'}`;
        const description = message;

        const accountType = data?.accountType || undefined;
        if (accountType && accountType === AccountType.BUSINESS && data && data.businessProfileID) {
            const businessProfile = await BusinessProfile.findOne({ _id: data.businessProfileID });
            if (businessProfile) {
                title = `${businessProfile.name || 'User'}`;
                profileImage = businessProfile?.profilePic?.small || '';
            }
        }

        const devicesConfigs = await DevicesConfig.find({ userID: targetUserID });
        await Promise.all(devicesConfigs.map(async (devicesConfig) => {
            if (devicesConfig && devicesConfig.notificationToken) {
                const message: FMessage = createMessagePayload(devicesConfig.notificationToken, title, description, {
                    notificationID: notificationID,
                    devicePlatform: devicesConfig.devicePlatform,
                    type: type,
                    image: "",
                    profileImage,
                });
                await sendNotification(message);
            }
            return devicesConfig;
        }));
    } catch (error) {
        console.error("Error sending one or more notifications:", error);
    }
}
