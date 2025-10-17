import { Request, Response, NextFunction } from "express";
import Post from "../database/models/post.model";
import User from "../database/models/user.model";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { ObjectId } from "mongodb";

/**
 * Invite a collaborator to a post
 */
const inviteCollaborator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postID, invitedUserID } = req.body;
    const { id: requesterID } = req.user;

    const post = await Post.findById(postID);
    if (!post) return res.send(httpNotFoundOr404(ErrorMessage.POST_NOT_FOUND, "Post not found"));

    if (post.userID.toString() !== requesterID.toString()) {
      return res.send(httpBadRequest(ErrorMessage.invalidRequest("Only the post owner can invite collaborators")));
    }

    const alreadyInvited = post.collaborationInvites?.some(
      (invite) => invite.invitedUserID?.toString() === invitedUserID.toString()
    );
    if (alreadyInvited) {
      return res.send(httpBadRequest(ErrorMessage.invalidRequest("User already invited")));
    }

    post.collaborationInvites?.push({ invitedUserID });
    await post.save();

    return res.send(httpOk(post, "Collaboration invite sent successfully"));
  } catch (error: any) {
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
    if (!post) return res.send(httpNotFoundOr404(ErrorMessage.POST_NOT_FOUND, "Post not found"));

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
      // Add collaborator to post
      if (!post.collaborators?.includes(userID as any)) {
        post.collaborators?.push(new ObjectId(userID));
      }
    }

    await post.save();
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
