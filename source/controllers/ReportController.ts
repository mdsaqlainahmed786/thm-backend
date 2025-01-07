import { Request, Response, NextFunction } from "express";
import { httpNotFoundOr404, httpCreated, httpInternalServerError, httpNoContent, httpOkExtended } from "../utils/response";
import Report, { addCommentInReport, addPostInReport, addReportedByInReport, addUserInReport } from "../database/models/reportedUser.model";
import { ErrorMessage } from "../utils/response-message/error";
import { ContentType, Role } from "../common";
import Post from "../database/models/post.model";
import User from "../database/models/user.model";
import { parseQueryParam } from "../utils/helper/basic";
import Comment from "../database/models/comment.model";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, contentType }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (contentType === ContentType.POST) {
            Object.assign(dbQuery, { contentType: ContentType.POST });
        }
        if (contentType === ContentType.USER) {
            Object.assign(dbQuery, { contentType: ContentType.USER });
        }
        const [documents, totalDocument] = await Promise.all([
            Report.aggregate([
                {
                    $match: dbQuery
                },
                addPostInReport().lookup,
                addPostInReport().unwindLookup,
                addReportedByInReport().lookup,
                addReportedByInReport().unwindLookup,
                addUserInReport().lookup,
                addUserInReport().unwindLookup,
                addCommentInReport().lookup,
                addCommentInReport().unwindLookup,
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
            ]),
            Report.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Reported content fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const reportContent = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let contentID = request.params.id;
        const { id, accountType, businessProfileID, role } = request.user;
        const { reason } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [totalReports, isReportedBefore,] = await Promise.all([
            Report.find({ contentID: contentID, contentType: ContentType.POST }),
            Report.findOne({ contentID: contentID, contentType: ContentType.POST, reportedBy: id }),
        ]);
        const post = await Post.findOne({ _id: contentID });
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Content not found"), "Content not found"))
        }
        if (totalReports && totalReports.length >= 5) {//If some post is reported more then 5 time then remove from feed
            post.isPublished = false;
            await post.save();
        }
        if (role && role === Role.MODERATOR) {
            post.isPublished = false;
            await post.save();
        }
        if (!isReportedBefore) {
            const newReport = new Report();
            newReport.reportedBy = id;
            newReport.contentID = contentID;
            newReport.reason = reason ?? '';
            newReport.contentType = ContentType.POST;
            const report = await newReport.save();
            return response.send(httpCreated(report, "Content reported successfully"));
        }
        isReportedBefore.reason = reason ?? isReportedBefore.reason;
        await isReportedBefore.save();
        return response.send(httpNoContent(isReportedBefore, 'Content already reported'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const reportUser = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        let contentID = request.params.id;
        const { reason } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [totalReports, isReportedBefore,] = await Promise.all([
            Report.find({ contentID: contentID, contentType: ContentType.USER }),
            Report.findOne({ contentID: contentID, contentType: ContentType.USER, reportedBy: id }),
        ])
        const user = await User.findOne({ _id: contentID });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Content not found"), "Content not found"))
        }
        if (totalReports && totalReports.length >= 5) {//If some user is reported more then 5 time then deactivate their account
            user.isActivated = false;
            await user.save();
        }
        if (!isReportedBefore) {
            const newReport = new Report();
            newReport.reason = reason ?? '';
            newReport.reportedBy = id;
            newReport.contentID = contentID;
            newReport.contentType = ContentType.USER;
            const report = await newReport.save();
            return response.send(httpCreated(report, "User reported successfully"));
        }
        isReportedBefore.reason = reason ?? isReportedBefore.reason;
        await isReportedBefore.save();
        return response.send(httpNoContent(isReportedBefore, 'User already reported'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const reportComment = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        let contentID = request.params.id;
        const { reason } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [totalReports, isReportedBefore,] = await Promise.all([
            Report.find({ contentID: contentID, contentType: ContentType.COMMENT }),
            Report.findOne({ contentID: contentID, contentType: ContentType.COMMENT, reportedBy: id }),
        ])
        const comment = await Comment.findOne({ _id: contentID });
        if (!comment) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Content not found"), "Content not found"))
        }
        if (totalReports && totalReports.length >= 5 || role && role === Role.MODERATOR) {//If some user is reported more then 5 time then deactivate their account
            comment.isPublished = false;
            //Unpublish the reply as well
            const queries: any[] = [
                comment.save()
            ]
            if (comment.isParent) {
                queries.push(Comment.updateMany({ parentID: comment._id }, { isPublished: false }))
            }
            await Promise.all(queries);
        }
        if (!isReportedBefore) {
            const newReport = new Report();
            newReport.reason = reason ?? '';
            newReport.reportedBy = id;
            newReport.contentID = contentID;
            newReport.contentType = ContentType.COMMENT;
            const report = await newReport.save();
            return response.send(httpCreated(report, "Comment reported successfully"));
        }
        isReportedBefore.reason = reason ?? isReportedBefore.reason;
        await isReportedBefore.save();
        return response.send(httpNoContent(isReportedBefore, 'Comment already reported'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const report = await Report.findOne({ _id: ID });
        if (!report) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Record not found"), "Record not found"));
        }
        await report.deleteOne();
        return response.send(httpNoContent(null, 'Report deleted'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { index, destroy, reportContent, reportUser, reportComment };