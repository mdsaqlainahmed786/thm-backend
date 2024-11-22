import { Request, Response, NextFunction } from "express";
import { httpInternalServerError, httpNotFoundOr404, httpCreated, httpNoContent } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import crypto from 'crypto';
import Like from "../database/models/like.model";
import SavedPost from "../database/models/savedPost.model";
import EventJoin from "../database/models/eventJoin.model";
import { fetchPosts } from "../database/models/post.model";
import User from "../database/models/user.model";
import SharedContent from "../database/models/sharedContent.model";
import { ObjectId } from "mongodb";
import { ContentType } from "../common";
import { ConnectionStatus } from "../database/models/userConnection.model";
import { getUserPublicProfile } from "../database/models/user.model";
import { AccountType } from "../database/models/user.model";
const posts = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = request.user?.id;
        const { postID, userID } = request.query;
        if (!postID || !userID) {
            return response.send(httpNotFoundOr404({}));
        }
        const decryptedPostID = decrypt(postID as string);
        const decryptedUserID = decrypt(userID as string);
        const [likedByMe, savedByMe, joiningEvents, user] = await Promise.all([
            Like.distinct('postID', { userID: id, postID: { $ne: null } }),
            SavedPost.distinct('postID', { userID: id, postID: { $ne: null } }),
            EventJoin.distinct('postID', { userID: id, postID: { $ne: null } }),
            User.findOne({ _id: decryptedUserID }),
        ]);
        const [post, isSharedBefore,] = await Promise.all([
            fetchPosts({ _id: new ObjectId(decryptedPostID) }, likedByMe, savedByMe, joiningEvents, 1, 1),
            SharedContent.findOne({ contentID: decryptedPostID, userID: decryptedUserID, contentType: ContentType.POST }),
        ])
        if (!post || post?.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!isSharedBefore) {
            const newSharedContent = new SharedContent();
            newSharedContent.contentID = decryptedPostID;
            newSharedContent.contentType = ContentType.POST;
            newSharedContent.userID = user.id;//Shared By
            newSharedContent.businessProfileID = user.businessProfileID ?? null;
            await newSharedContent.save();
            return response.send(httpCreated(post[0], "Content shared successfully"));
        }
        return response.send(httpNoContent(post[0], 'Content shared successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const users = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const requestedUserID = request.user?.id;
        const accountType = request.user?.accountType;
        const { id, userID } = request.query;
        if (!id || !userID) {
            return response.send(httpNotFoundOr404({}));
        }
        const decryptedID = decrypt(id as string);
        const decryptedUserID = decrypt(userID as string);
        const [user, posts, follower, following, myConnection, isBlocked] = await getUserPublicProfile(decryptedID, requestedUserID);
        const [sharedBy, isSharedBefore] = await Promise.all([
            User.findOne({ _id: decryptedUserID }),
            SharedContent.findOne({ contentID: decryptedID, userID: decryptedUserID, contentType: ContentType.USER }),
        ]);
        if (!sharedBy) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }
        let responseData = { posts: posts, follower: follower, following: following };
        if (accountType === AccountType.BUSINESS) {
            Object.assign(responseData, { ...user[0], isConnected: myConnection?.status === ConnectionStatus.ACCEPTED ? true : false, isRequested: myConnection?.status === ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false });
        } else {
            Object.assign(responseData, { ...user[0], isConnected: myConnection?.status === ConnectionStatus.ACCEPTED ? true : false, isRequested: myConnection?.status === ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false });
        }
        if (!isSharedBefore) {
            const newSharedContent = new SharedContent();
            newSharedContent.contentID = decryptedID;
            newSharedContent.contentType = ContentType.USER;
            newSharedContent.userID = sharedBy.id;//Shared By
            newSharedContent.businessProfileID = sharedBy.businessProfileID ?? null;
            await newSharedContent.save();
            return response.send(httpCreated(responseData, "Content shared successfully"));
        }
        return response.send(httpNoContent(responseData, 'Content shared successfully'));

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const tester = async (request: Request, response: Response, next: NextFunction) => {
    const userAgent = request.headers['user-agent'];
    return response.send({
        userAgent,
    })
}

const SECRET_KEY = '1234567890123456'; // Same key as in Java
const IV = '1234567890123456'; // Same IV as in Java
const ALGORITHM = 'aes-128-cbc';
function encrypt(data: string) {
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), Buffer.from(IV));
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // URL-safe Base64 encoding
    return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decrypt(encryptedData: string) {
    // Convert URL-safe Base64 back to standard Base64
    const base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), Buffer.from(IV));
    let decrypted = decipher.update(base64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export default { posts, tester, users }