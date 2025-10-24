import { Request, Response, NextFunction } from "express";
import Post from "../database/models/post.model";
import User from "../database/models/user.model";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import Notification, { NotificationType } from "../database/models/notification.model";
import { ErrorMessage } from "../utils/response-message/error";
import { ObjectId } from "mongodb";
import AppNotificationController from "./AppNotificationController";

/**
 * Invite a collaborator to a post
 */

const inviteCollaborator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postID, invitedUserID } = req.body;
    const { id: requesterID } = req.user;

    const post = await Post.findById(postID);
    if (!post) {
      return res.send(httpNotFoundOr404(null, "Post not found"));
    }

    if (post.userID.toString() !== requesterID.toString()) {
      return res.send(httpBadRequest(null, "Only the post owner can invite collaborators"));
    }

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

    AppNotificationController.store(
      requesterID,               // sender (inviter)
      post.userID.toString() === invitedUserID.toString() ? requesterID : invitedUserID, // receiver
      NotificationType.COLLABORATION_INVITE,
      { postID: post._id, invitedUserID }
    ).catch((error) => console.error("Error sending invite notification:", error));

    return res.send(httpOk(post, "Collaboration invite sent successfully"));
  } catch (error: any) {
    console.error("Error inviting collaborator:", error);
    next(httpInternalServerError(error, error.message));
  }
};


/**
 * Accept or Decline collaboration
 */
/**
 * Accept or Decline collaboration
 */
const respondToInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postID, action } = req.body; // "accept" or "decline"
    const { id: userID } = req.user;

    console.log("🤝 [RESPOND] Collaboration response received:", {
      postID,
      action,
      userID,
    });

    const post = await Post.findById(postID);
    if (!post) {
      console.log(" [RESPOND] Post not found:", postID);
      return res.send(httpNotFoundOr404(null, "Post not found"));
    }

    const invite = post.collaborationInvites?.find(
      (i) => i.invitedUserID?.toString() === userID.toString()
    );

    if (!invite) {
      console.log(" [RESPOND] No invite found for user:", userID);
      return res.send(httpBadRequest(null, "No pending invitation found"));
    }

    if (invite.status !== "pending") {
      console.log(" [RESPOND] Invite already handled:", invite.status);
      return res.send(httpBadRequest(null, "Invite already responded to"));
    }

    invite.status = action === "accept" ? "accepted" : "declined";
    invite.respondedAt = new Date();

    if (action === "accept") {
      // Add collaborator if accepted
      if (!post.collaborators?.includes(userID as any)) {
        post.collaborators?.push(new ObjectId(userID));
        console.log(" [RESPOND] Added collaborator:", userID);
      }
    }

    await post.save();
    console.log("  [RESPOND] Post updated successfully");

    // Determine notification type
    const notificationType =
      action === "accept"
        ? NotificationType.COLLABORATION_ACCEPTED
        : NotificationType.COLLABORATION_REJECTED;

    console.log("  [RESPOND] Sending notification:", {
      type: notificationType,
      from: userID,
      to: post.userID,
    });

    // Send notification to the inviter (post owner)
    AppNotificationController.store(
      userID, // sender (the user who accepted/rejected)
      post.userID, // receiver (the inviter)
      notificationType,
      { postID: post._id, action }
    )
      .then((notif) => {
        if (notif) {
          //@ts-ignore
          console.log(" [RESPOND] Notification created successfully:", notif._id.toString());
        } else {
          console.log(" [RESPOND] Notification creation returned null (skipped)");
        }
      })
      .catch((error) => console.error(" [RESPOND] Notification creation error:", error));

    return res.send(httpOk(post, `Invite ${action}ed successfully`));
  } catch (error: any) {
    console.error(" [RESPOND] Unexpected error:", error.message);
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
