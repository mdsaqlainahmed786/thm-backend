import { Request, Response, NextFunction } from "express";
import { httpCreated, httpInternalServerError, httpNoContent, httpAcceptedOrUpdated, httpOk, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { parseQueryParam } from "../utils/helper/basic";
import { httpOkExtended } from "../utils/response";
import ContactSupport from "../database/models/contactSupport.model";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {}
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                        { email: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { message: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    ]
                }
            )
        }
        const documents = await ContactSupport.aggregate(
            [
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
                        updatedAt: 0,
                        __v: 0,
                    }
                }
            ]
        ).exec();
        const totalDocument = await ContactSupport.find(dbQuery).countDocuments();
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Contacts fetched.', pageNumber, totalPagesCount, totalDocument));
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
        const ID = request?.params?.id;
        const contactSupport = await ContactSupport.findOne({ _id: ID });
        if (!contactSupport) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Contact not found"), "Contact not found"));
        }
        await contactSupport.deleteOne();
        return response.send(httpNoContent(null, 'Contact Deleted'));
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
