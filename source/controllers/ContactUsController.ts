import { Request, Response, NextFunction } from "express";
import { httpCreated, httpInternalServerError, httpNoContent, httpAcceptedOrUpdated, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { parseQueryParam } from "../utils/helper/basic";
import { httpOkExtended } from "../utils/response";
import FAQ from '../database/models/faq.model';
import ContactSupport from "../database/models/contactSupport.model";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // let { pageNumber, documentLimit, query, type }: any = request.query;
        // pageNumber = parseQueryParam(pageNumber, 1);
        // documentLimit = parseQueryParam(documentLimit, 20);
        // const dbQuery = { isPublished: true };
        // if (type !== undefined && type !== "") {
        //     Object.assign(dbQuery, { type });
        // }
        // if (query !== undefined && query !== "") {
        //     Object.assign(dbQuery,
        //         {
        //             $or: [
        //                 { question: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
        //                 { answer: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
        //             ]
        //         }
        //     )
        // }
        // const documents = await FAQ.aggregate(
        //     [
        //         {
        //             $match: dbQuery
        //         },
        //         {
        //             $sort: { createdAt: -1, id: 1 }
        //         },
        //         {
        //             $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        //         },
        //         {
        //             $limit: documentLimit
        //         },
        //         {
        //             $project: {
        //                 isPublished: 0,
        //                 type: 0,
        //                 createdAt: 0,
        //                 updatedAt: 0,
        //                 __v: 0,
        //             }
        //         }
        //     ]
        // ).exec();
        // const totalDocument = await FAQ.find(dbQuery).countDocuments();
        // const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        // return response.send(httpOkExtended(documents, 'FAQ fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, name, message } = request.body;
        const newContact = new ContactSupport();
        newContact.name = name;
        newContact.email = email;
        newContact.message = message;
        const savedContact = await newContact.save();
        return response.send(httpCreated(savedContact, 'Your message has been successfully submitted. We will respond shortly.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        return response.send(httpNoContent(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        return response.send(httpOk(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy };
