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
const post_model_1 = __importDefault(require("../database/models/post.model"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const response_1 = require("../utils/response");
const notification_model_1 = require("../database/models/notification.model");
const mongodb_1 = require("mongodb");
const AppNotificationController_1 = __importDefault(require("./AppNotificationController"));
/**
 * Invite a collaborator to a post
 */
const inviteCollaborator = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // console.log(" [INVITE] Hit inviteCollaborator route");
        const { postID, invitedUserID } = req.body;
        const { id: requesterID } = req.user;
        // console.log(" [INVITE] Request Body:", { postID, invitedUserID, requesterID });
        const post = yield post_model_1.default.findById(postID);
        if (!post) {
            console.log(" [INVITE] Post not found:", postID);
            return res.send((0, response_1.httpNotFoundOr404)(null, "Post not found"));
        }
        if (post.userID.toString() !== requesterID.toString()) {
            // console.log(" [INVITE] Not the post owner. userID:", requesterID);
            return res.send((0, response_1.httpBadRequest)(null, "Only the post owner can invite collaborators"));
        }
        const alreadyInvited = (_a = post.collaborationInvites) === null || _a === void 0 ? void 0 : _a.some((invite) => {
            var _a;
            return ((_a = invite.invitedUserID) === null || _a === void 0 ? void 0 : _a.toString()) === invitedUserID.toString() &&
                invite.status === "pending";
        });
        if (alreadyInvited) {
            // console.log(" [INVITE] Already invited:", invitedUserID);
            return res.send((0, response_1.httpBadRequest)(null, "User already invited"));
        }
        (_b = post.collaborationInvites) === null || _b === void 0 ? void 0 : _b.push({ invitedUserID });
        yield post.save();
        // console.log(" [INVITE] Calling AppNotificationController.store()");
        AppNotificationController_1.default.store(requesterID, // sender
        invitedUserID, // receiver
        notification_model_1.NotificationType.COLLABORATION_INVITE, { postID: post._id, invitedUserID })
            .then(() => console.log("[INVITE] store() call completed successfully"))
            .catch((err) => console.error("[INVITE] store() threw error:", err));
        return res.send((0, response_1.httpOk)(post, "Collaboration invite sent successfully"));
    }
    catch (error) {
        // console.error(" [INVITE] Unexpected error:", error.message);
        next((0, response_1.httpInternalServerError)(error, error.message));
    }
});
/**
 * Accept or Decline collaboration
 */
/**
 * Accept or Decline collaboration
 */
const respondToInvite = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    try {
        const { postID, action } = req.body; // "accept" or "decline"
        const { id: userID } = req.user;
        // console.log(" [RESPOND] Collaboration response received:", {
        //   postID,
        //   action,
        //   userID,
        // });
        const post = yield post_model_1.default.findById(postID);
        if (!post) {
            console.log(" [RESPOND] Post not found:", postID);
            return res.send((0, response_1.httpNotFoundOr404)(null, "Post not found"));
        }
        const invite = (_c = post.collaborationInvites) === null || _c === void 0 ? void 0 : _c.find((i) => { var _a; return ((_a = i.invitedUserID) === null || _a === void 0 ? void 0 : _a.toString()) === userID.toString(); });
        if (!invite) {
            console.log(" [RESPOND] No invite found for user:", userID);
            return res.send((0, response_1.httpBadRequest)(null, "No pending invitation found"));
        }
        if (invite.status !== "pending") {
            console.log(" [RESPOND] Invite already handled:", invite.status);
            return res.send((0, response_1.httpBadRequest)(null, "Invite already responded to"));
        }
        invite.status = action === "accept" ? "accepted" : "declined";
        invite.respondedAt = new Date();
        if (action === "accept") {
            // Add collaborator if accepted
            if (!((_d = post.collaborators) === null || _d === void 0 ? void 0 : _d.includes(userID))) {
                (_e = post.collaborators) === null || _e === void 0 ? void 0 : _e.push(new mongodb_1.ObjectId(userID));
                // console.log(" [RESPOND] Added collaborator:", userID);
            }
        }
        yield post.save();
        // console.log("  [RESPOND] Post updated successfully");
        // Determine notification type
        const notificationType = action === "accept"
            ? notification_model_1.NotificationType.COLLABORATION_ACCEPTED
            : notification_model_1.NotificationType.COLLABORATION_REJECTED;
        console.log("  [RESPOND] Sending notification:", {
            type: notificationType,
            from: userID,
            to: post.userID,
        });
        // Send notification to the inviter (post owner)
        AppNotificationController_1.default.store(userID, // sender (the user who accepted/rejected)
        post.userID, // receiver (the inviter)
        notificationType, { postID: post._id, action })
            .then((notif) => {
            if (notif) {
                //@ts-ignore
                console.log(" [RESPOND] Notification created successfully:", notif._id.toString());
            }
            else {
                console.log(" [RESPOND] Notification creation returned null (skipped)");
            }
        })
            .catch((error) => console.error(" [RESPOND] Notification creation error:", error));
        const updatedPost = yield post_model_1.default.findById(postID)
            .populate({
            path: "collaborators",
            select: "name email username profileImage" // include whatever fields you need
        })
            .populate({
            path: "collaborationInvites.invitedUserID",
            select: "name email username profileImage"
        });
        return res.send((0, response_1.httpOk)(updatedPost, `Invite ${action}ed successfully`));
    }
    catch (error) {
        console.error(" [RESPOND] Unexpected error:", error.message);
        next((0, response_1.httpInternalServerError)(error, error.message));
    }
});
/**
 * Get all collaborations for a user
 */
const getCollaborations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: userID } = req.user;
        const posts = yield post_model_1.default.find({
            $or: [{ collaborators: userID }, { "collaborationInvites.invitedUserID": userID }],
        })
            .populate("userID", "name profilePic")
            .populate("collaborators", "name profilePic");
        return res.send((0, response_1.httpOk)(posts, "Collaboration posts fetched successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, error.message));
    }
});
const getCollaboratorsForPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { postID } = req.params;
        const post = yield post_model_1.default.findById(postID);
        if (!post) {
            return res.send((0, response_1.httpNotFoundOr404)(null, "Post not found"));
        }
        const collaboratorIDs = post.collaborators || [];
        if (!collaboratorIDs.length) {
            return res.send((0, response_1.httpOk)([], "No collaborators found for this post"));
        }
        const collaborators = yield user_model_1.default.find({ _id: { $in: collaboratorIDs } }, { name: 1, profilePic: 1, accountType: 1 });
        return res.send((0, response_1.httpOk)(collaborators, "Collaborators fetched successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, error.message));
    }
});
exports.default = {
    inviteCollaborator,
    respondToInvite,
    getCollaborations,
    getCollaboratorsForPost
};
