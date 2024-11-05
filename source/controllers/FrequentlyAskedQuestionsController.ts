import { Request, Response, NextFunction } from "express";
import { httpCreated, httpInternalServerError, httpNoContent, httpAcceptedOrUpdated, httpOk, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { parseQueryParam } from "../utils/helper/basic";
import { httpOkExtended } from "../utils/response";
import FAQ from '../database/models/faq.model';
import { PipelineStage } from "mongoose";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { pageNumber, documentLimit, query, type, project }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = { isPublished: true };
        if (type !== undefined && type !== "") {
            Object.assign(dbQuery, { type });
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                {
                    $or: [
                        { question: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        { answer: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                    ]
                }
            )
        }

        const faqPipelineStage: PipelineStage[] = [
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

        ];
        if (project && project === "full") {
            faqPipelineStage.push({
                $project: {
                    updatedAt: 0,
                    __v: 0,
                }
            })
        } else {
            faqPipelineStage.push({
                $project: {
                    isPublished: 0,
                    type: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            })
        }
        const documents = await FAQ.aggregate(faqPipelineStage).exec();
        const totalDocument = await FAQ.find(dbQuery).countDocuments();
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'FAQ fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { question, answer, type } = request.body;
        const newFAQ = new FAQ();
        newFAQ.question = question;
        newFAQ.answer = answer;
        newFAQ.type = type;
        newFAQ.isPublished = true;
        const savedFAQ = await newFAQ.save();
        return response.send(httpCreated(savedFAQ, 'FAQ created'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { question, answer, type, isPublished } = request.body;
        const faq = await FAQ.findOne({ _id: ID });
        if (!faq) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("FAQ not found"), "FAQ not found"));
        }
        faq.question = question ?? faq.question;
        faq.answer = answer ?? faq.answer;
        faq.type = type ?? faq.type;
        faq.isPublished = isPublished ?? faq.isPublished;
        const savedFAQ = await faq.save();
        return response.send(httpAcceptedOrUpdated(savedFAQ, 'FAQ updated.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const faq = await FAQ.findOne({ _id: ID });
        if (!faq) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("FAQ not found"), "FAQ not found"));
        }
        await faq.deleteOne();
        return response.send(httpNoContent(null, 'FAQ Deleted'));
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
