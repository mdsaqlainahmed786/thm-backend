import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Subscription from "../database/models/subscription.model";
import Post, { PostType } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import { countWords } from "../utils/helper/basic";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // let { pageNumber, documentLimit, query }: any = request.query;
        // const dbQuery = {};
        // pageNumber = parseQueryParam(pageNumber, 1);
        // documentLimit = parseQueryParam(documentLimit, 20);
        // if (query !== undefined && query !== "") {
        //     Object.assign(dbQuery,
        //         {
        //             $or: [
        //                 { DTNAME: { $regex: new RegExp(query.toLowerCase(), "i") } },
        //                 { DTABBR: { $regex: new RegExp(query.toLowerCase(), "i") } },
        //             ]
        //         }
        //     )
        // }
        // const documents = await DeathCode.aggregate(
        //     [
        //         {
        //             $match: dbQuery
        //         },
        //         {
        //             $sort: { _id: -1 }
        //         },
        //         {
        //             $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        //         },
        //         {
        //             $limit: documentLimit
        //         },
        //     ]
        // ).exec();
        // const totalDocument = await DeathCode.find(dbQuery).countDocuments();
        // const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        // return response.send(httpOkExtended(documents, 'Death code fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const MAX_CONTENT_LENGTH = 20; // Set maximum content length
const MAX_VIDEO_UPLOADS = 1;
const MAX_IMAGE_UPLOADS = 2;
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const { content } = request.body;
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.images as Express.Multer.S3File[];
        const videos = files && files.images as Express.Multer.S3File[];
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (accountType === AccountType.INDIVIDUAL) {
            //TODO need to be fixed for video and images
            const [haveSubscription, dailyContentLimit] = await Promise.all([
                Subscription.findOne({ userID: id, expirationDate: { $gte: new Date() } }),
                DailyContentLimit.findOne({ userID: id })
            ])

            if (!haveSubscription) {
                if (!dailyContentLimit && content && countWords(content) >= MAX_CONTENT_LENGTH) {
                    const error = `Content must be a string and cannot exceed ${MAX_CONTENT_LENGTH} words.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                } else if (!dailyContentLimit && images && images.length > MAX_IMAGE_UPLOADS) {
                    const error = `can not upload multiple images.`;
                    console.log(images);
                    let objectToDelete: IS3Object[] = [];
                    images.map((image) => {
                        objectToDelete.push({
                            key: image.key,
                            location: image.location,
                            delete: true,
                            fieldname: image.fieldname,
                            originalname: image.originalname,
                            encoding: image.encoding,
                            mimetype: image.mimetype,
                        })
                    })
                    // await S3Object.fin
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                } else if (!dailyContentLimit && videos && videos.length > MAX_VIDEO_UPLOADS) {
                    const error = `can not load multiple video`;
                    console.log(videos);
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                }

            }


        }
        const newPost = new Post();
        newPost.postType = PostType.POST;
        newPost.userID = id;
        newPost.isPublished = true;
        newPost.content = content;
        const savedPost = await newPost.save();

        console.log(accountType);

        return response.send(savedPost)
        // const { DTCODE, DTNAME, DTABBR } = request.body;
        // const newDeathCode = new DeathCode();
        // newDeathCode.DTCODE = DTCODE;
        // newDeathCode.DTNAME = DTNAME;
        // newDeathCode.DTABBR = DTABBR;
        // const savedDeathCode = await newDeathCode.save();
        // return response.send(httpCreated(savedDeathCode, 'Death code created.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // const ID = request?.params?.id;
        // const { DTCODE, DTNAME, DTABBR } = request.body;
        // const deathCode = await DeathCode.findOne({ _id: ID });
        // if (!deathCode) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Death code not found."), "Death code not found."));
        // }
        // deathCode.DTCODE = DTCODE ?? deathCode.DTCODE;
        // deathCode.DTNAME = DTNAME ?? deathCode.DTNAME;
        // deathCode.DTABBR = DTABBR ?? deathCode.DTABBR;
        // const savedDeathCode = await deathCode.save();
        // return response.send(httpAcceptedOrUpdated(savedDeathCode, 'Death code updated.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // const ID = request?.params?.id;
        // const deathCode = await DeathCode.findOne({ _id: ID });
        // if (!deathCode) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Death code not found."), "Death code not found."));
        // }
        // await deathCode.deleteOne();
        // return response.send(httpNoContent({}, 'Death code deleted.'));
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
