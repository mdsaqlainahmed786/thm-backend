import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { parseQueryParam } from "../../utils/helper/basic";
import User from "../../database/models/user.model";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);

        const dbQuery = { isPublished: true, };
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                // {
                //     $or: [
                //         { DTNAME: { $regex: new RegExp(query.toLowerCase(), "i") } },
                //         { DTABBR: { $regex: new RegExp(query.toLowerCase(), "i") } },
                //     ]
                // }
            )
        }
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        const [documents, totalDocument] = await Promise.all([
            User.aggregate([
                {
                    $match: {}
                }
            ]),
            User.find({}).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'User fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // const postID = request.params.id;
        // const { id, accountType, businessProfileID } = request.user;
        // if (!id) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        // }
        // const [post, isSaved] = await Promise.all([
        //     Post.findOne({ _id: postID }),
        //     SavedPost.findOne({ postID: postID, userID: id }),
        // ])
        // if (!post) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        // }
        // if (!isSaved) {
        //     const newSavedPost = new SavedPost();
        //     newSavedPost.userID = id;
        //     newSavedPost.postID = postID;
        //     newSavedPost.businessProfileID = businessProfileID ?? null;
        //     const savedLike = await newSavedPost.save();
        //     return response.send(httpCreated(savedLike, "Post saved successfully"));
        // }
        // await isSaved.deleteOne();
        // return response.send(httpNoContent(null, 'Post removed successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpAcceptedOrUpdated({}, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpNoContent({}, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpOk({}, "Not implemented"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy };
