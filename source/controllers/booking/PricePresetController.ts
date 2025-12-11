import { AccountType } from '../../database/models/anonymousUser.model';
import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { isArray, parseQueryParam } from '../../utils/helper/basic';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError, httpCreated, httpNoContent, httpBadRequest } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import Post, { addGoogleReviewedBusinessProfileInPost, addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, countPostDocument, PostType } from '../../database/models/post.model';
import PricePreset, { generatePricePresetForRoom, PricePresetType } from '../../database/models/pricePreset.model';
import RoomPrices from '../../database/models/demo/roomPrices.model';




const NOT_FOUND = "Price preset found.";
const FETCHED = "Price preset fetched.";
const CREATED = "Price preset created.";
const UPDATED = "Price preset updated.";
const DELETED = "Price preset deleted.";
const RETRIEVED = "Price preset fetched.";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, postType }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            // Object.assign(dbQuery,
            //     {
            //         $or: [
            //             // { content: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { name: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { venue: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { streamingLink: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { 'location.placeName': { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true }
            //         ]
            //     }
            // )
        }

        const [documents, totalDocument] = await Promise.all([
            PricePreset.aggregate([
                {
                    $match: {}
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
                {
                    $project: {
                        updatedAt: 0,
                        __v: 0,
                    }
                }
            ]),
            PricePreset.find({}).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, AccountType, businessProfileID, role } = request.user;
        const { price, weekendPrice, type, startDate, endDate, months, weeks } = request.body;
        console.log(request.body);
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!businessProfileID) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        if (!(price > 0 || weekendPrice > 0)) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest('Either price or weekend price must be greater than zero.'), 'Either price or weekend price must be greater than zero.'));
        }
        const newPricePreset = new PricePreset();
        newPricePreset.businessProfileID = businessProfileID;
        newPricePreset.type = type;
        newPricePreset.price = price;
        newPricePreset.weekendPrice = weekendPrice;
        switch (type) {
            case PricePresetType.CUSTOM:
                newPricePreset.startDate = startDate;
                newPricePreset.endDate = endDate;
                break;
            case PricePresetType.QUARTERLY:
                if (months && isArray(months)) {
                    newPricePreset.months = months;
                }
                break;
            case PricePresetType.MONTHLY:
                if (months && isArray(months)) {
                    newPricePreset.months = months;
                }
                if (weeks && isArray(weeks)) {
                    newPricePreset.weeks = weeks;
                }
                break;
        }
        const savedPricePreset = await newPricePreset.save();
        await generatePricePresetForRoom(savedPricePreset.id);
        return response.send(httpCreated(savedPricePreset, CREATED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { price, weekendPrice, type, startDate, endDate, months, weeks, isActive, method } = request.body;
        const pricePreset = await PricePreset.findOne({ _id: ID });
        if (!pricePreset) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
        }
        if (method && method !== 'PUT' && !(price > 0 || weekendPrice > 0)) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest('Either price or weekend price must be greater than zero.'), 'Either price or weekend price must be greater than zero.'));
        }
        pricePreset.type = type ?? pricePreset.type;
        pricePreset.price = price ?? pricePreset.price;
        pricePreset.weekendPrice = weekendPrice ?? pricePreset.weekendPrice;
        pricePreset.isActive = isActive ?? pricePreset.isActive;
        const pricePresetIDs = await PricePreset.distinct("_id", { businessProfileID: pricePreset.businessProfileID });
        await Promise.all([
            PricePreset.updateMany({ _id: { $in: pricePresetIDs } }, { isActive: false }),
            RoomPrices.updateMany({ pricePresetID: { $in: pricePresetIDs } }, { isActive: false }),
        ]);
        if (isActive) {
            console.log(isActive);
            await RoomPrices.updateMany({ pricePresetID: { $in: pricePreset._id } }, { isActive: true })
        }
        switch (type) {
            case PricePresetType.CUSTOM:
                pricePreset.startDate = startDate;
                pricePreset.endDate = endDate;
                break;
            case PricePresetType.QUARTERLY:
                if (months && isArray(months)) {
                    pricePreset.months = months;
                }
                break;
            case PricePresetType.MONTHLY:
                if (months && isArray(months)) {
                    pricePreset.months = months;
                }
                if (weeks && isArray(weeks)) {
                    pricePreset.weeks = weeks;
                }
                break;
        }
        const savedPricePreset = await pricePreset.save();
        if (method && method === 'PUT') {
            await Promise.all([
                RoomPrices.deleteMany({ pricePresetID: savedPricePreset.id }),
                generatePricePresetForRoom(savedPricePreset.id)
            ])
        }
        return response.send(httpAcceptedOrUpdated(savedPricePreset, UPDATED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const pricePreset = await PricePreset.findOne({ _id: ID });
        if (!pricePreset) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        await pricePreset.deleteOne();
        await RoomPrices.deleteMany({ pricePresetID: ID });
        return response.send(httpNoContent(null, DELETED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}



export default { index, store, update, destroy, show };
