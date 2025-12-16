import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { parseQueryParam } from "../../utils/helper/basic";
import Amenity, { AmenityCategory, defaultAmenity } from '../../database/models/amenity.model';
const NOT_FOUND = "Amenity not found.";
const FETCHED = "Amenity fetched.";
const CREATED = "Amenity created.";
const UPDATED = "Amenity updated.";
const DELETED = "Amenity deleted.";

const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {};
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    ]
                }
            )
        }
        const [documents, totalDocument] = await Promise.all([
            Amenity.aggregate([
                {
                    $match: dbQuery
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
                        __v: 0,
                    }
                },
            ]),
            Amenity.find(dbQuery).countDocuments()
        ]);
        if (documents.length === 0) {
            await Promise.all(defaultAmenity.map(async (amenity) => {
                const isExits = await Amenity.findOne({ name: amenity.name });
                if (!isExits) {
                    await Amenity.create(amenity);
                }
            }));
        }
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { name } = request.body;
        const newAmenity = new Amenity();
        newAmenity.name = name;
        const savedAmenity = await newAmenity.save();
        return response.send(httpCreated(savedAmenity, CREATED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { name, isPublished } = request.body;
        const amenity = await Amenity.findOne({ _id: ID });
        if (!amenity) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        amenity.name = name ?? amenity.name;
        amenity.isPublished = isPublished ?? amenity.isPublished;
        const savedAmenity = await amenity.save();
        return response.send(httpAcceptedOrUpdated(savedAmenity, UPDATED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const amenity = await Amenity.findOne({ _id: ID });
        if (!amenity) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        await amenity.deleteOne();
        return response.send(httpNoContent(null, DELETED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const categories = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { query }: any = request.query;
        const data = Object.values(AmenityCategory).filter((amenity) => amenity.toLowerCase().includes(query))
        return response.send(httpOk(data, "Amenity category fetched."))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, categories };
