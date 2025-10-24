import { Request, Response, NextFunction } from "express";
import Post from "../database/models/post.model";
import User from "../database/models/user.model";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import Notification, { NotificationType } from "../database/models/notification.model";
import { ErrorMessage } from "../utils/response-message/error";
import { ObjectId } from "mongodb";

/**
 * Invite a collaborator to a post
 */
const inviteCollaborator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postID, invitedUserID } = req.body;
    const { id: requesterID } = req.user;

    // Check if post exists
    const post = await Post.findById(postID);
    if (!post) {
      return res.send(httpNotFoundOr404(null, "Post not found"));
    }

    // Only post owner can invite collaborators
    if (post.userID.toString() !== requesterID.toString()) {
      return res.send(httpBadRequest(null, "Only the post owner can invite collaborators"));
    }

    // Prevent duplicate invite
    const alreadyInvited = post.collaborationInvites?.some(
      (invite) =>
        invite.invitedUserID?.toString() === invitedUserID.toString() &&
        invite.status === "pending"
    );

    if (alreadyInvited) {
      return res.send(httpBadRequest(null, "User already invited"));
    }

    // Add invite
    post.collaborationInvites?.push({ invitedUserID });
    await post.save();

    // Fetch both users
    const [invitedUser, inviterUser] = await Promise.all([
      User.findById(invitedUserID),
      User.findById(requesterID),
    ]);

    // Create notification
    if (invitedUser && inviterUser) {
      await Notification.create({
        userID: invitedUser._id, // receiver
        senderID: inviterUser._id, // who invited
        postID: post._id,
        type: NotificationType.COLLABORATION_INVITE, // create enum if not existing
        message: `${inviterUser.name || "Someone"} invited you to collaborate on a post.`,
      });
    }

    return res.send(httpOk(post, "Collaboration invite sent successfully"));
  } catch (error: any) {
    console.error("Error inviting collaborator:", error);
    next(httpInternalServerError(error, error.message));
  }
};

/**
 * Accept or Decline collaboration
 */
const respondToInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postID, action } = req.body; // "accept" or "decline"
    const { id: userID } = req.user;

    const post = await Post.findById(postID);
    if (!post)
      return res.send(httpNotFoundOr404(ErrorMessage.POST_NOT_FOUND, "Post not found"));

    const invite = post.collaborationInvites?.find(
      (i) => i.invitedUserID?.toString() === userID.toString()
    );

    if (!invite) {
      return res.send(httpBadRequest(ErrorMessage.invalidRequest("No pending invitation found")));
    }

    if (invite.status !== "pending") {
      return res.send(httpBadRequest(ErrorMessage.invalidRequest("Invite already responded to")));
    }

    invite.status = action === "accept" ? "accepted" : "declined";
    invite.respondedAt = new Date();

    if (action === "accept") {
      if (!post.collaborators?.includes(userID as any)) {
        post.collaborators?.push(new ObjectId(userID));
      }
    }

    await post.save();

    const [invitedUser, postOwner] = await Promise.all([
      User.findById(userID),         // The one who responded
      User.findById(post.userID),    // The post owner who should be notified
    ]);

    if (invitedUser && postOwner) {
      const notificationType =
        action === "accept"
          ? NotificationType.COLLABORATION_ACCEPTED
          : NotificationType.COLLABORATION_REJECTED; 

      await Notification.create({
        userID: postOwner._id,     
        senderID: invitedUser._id,
        postID: post._id,
        type: notificationType,
        message:
          action === "accept"
            ? `${invitedUser.name || "Someone"} accepted your collaboration invite.`
            : `${invitedUser.name || "Someone"} declined your collaboration invite.`,
      });
    }

    return res.send(httpOk(post, `Invite ${action}ed successfully`));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message));
  }
};


/**
 * Get all collaborations for a user
 */
const getCollaborations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: userID } = req.user;

    const posts = await Post.find({
      $or: [{ collaborators: userID }, { "collaborationInvites.invitedUserID": userID }],
    })
      .populate("userID", "name profilePic")
      .populate("collaborators", "name profilePic");

    return res.send(httpOk(posts, "Collaboration posts fetched successfully"));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message));
  }
};

export default {
  inviteCollaborator,
  respondToInvite,
  getCollaborations,
};
