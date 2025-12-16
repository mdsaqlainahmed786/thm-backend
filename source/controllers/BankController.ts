import { ObjectId } from 'mongodb';
// import { AccountType } from './../../database/models/anonymousUser.model';
import { Request, Response, NextFunction } from "express";
// import { isArray, parseQueryParam } from '../../utils/helper/basic';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError, httpCreated, httpNoContent, httpOk } from '../utils/response';
// import { ErrorMessage } from '../../utils/response-message/error';
// import Post, { addGoogleReviewedBusinessProfileInPost, addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, countPostDocument, PostType } from '../../database/models/post.model';
// import PricePreset, { PricePresetType } from '../../database/models/pricePreset.model';
import BankAccount from '../database/models/bankAccount.model';
import Bank from '../provider/bank';
import { ErrorMessage } from '../utils/response-message/error';
import { parseQueryParam } from '../utils/helper/basic';
const NOT_FOUND = "Bank account found.";
const FETCHED = "Banks fetched.";
const CREATED = "Bank account created.";
const UPDATED = "Bank account updated.";
const DELETED = "Bank account deleted.";
const RETRIEVED = "Bank account fetched.";
const banks = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const hostAddress = request.protocol + "://" + request.get("host");
        return response.send(httpOk(Bank.map((bank) => ({ ...bank, icon: `${hostAddress}/${bank.icon}` })), FETCHED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, acco } = request.user;
        let { pageNumber, documentLimit, query, postType }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                {
                    $or: [
                        // { content: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        // { name: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        // { venue: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        // { streamingLink: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        // { 'location.placeName': { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true }
                    ]
                }
            )
        }

        const [documents, totalDocument] = await Promise.all([
            BankAccount.aggregate([
                {
                    $match: {}
                },
                {
                    $sort: { primaryAccount: -1 }
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
            BankAccount.find({}).countDocuments()
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
        const { bankName, ifsc, accountNumber, accountHolder, type } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!businessProfileID) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const bankAccounts = await BankAccount.find({ businessProfileID: businessProfileID, userID: id });
        const bankAccount = new BankAccount();
        bankAccount.businessProfileID = businessProfileID;
        bankAccount.userID = id;
        bankAccount.bankName = bankName;
        const bankIcon = Bank.filter((bank) => bank.name === bankName)?.[0]?.icon;
        const hostAddress = request.protocol + "://" + request.get("host");
        bankAccount.bankIcon = bankIcon ? hostAddress + "/" + bankIcon : "";
        if (bankAccounts.length === 0) {
            bankAccount.primaryAccount = true;
        }
        bankAccount.accountNumber = accountNumber;
        bankAccount.ifsc = ifsc;
        bankAccount.accountHolder = accountHolder;
        bankAccount.type = type;
        bankAccount.documents = [];
        const savedBankAccount = await bankAccount.save();
        return response.send(httpCreated(savedBankAccount, CREATED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    // try {
    //     const ID = request?.params?.id;
    //     const { price, weekendPrice, type, startDate, endDate, months, weeks } = request.body;
    //     const pricePreset = await PricePreset.findOne({ _id: ID });
    //     if (!pricePreset) {
    //         return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
    //     }
    //     pricePreset.type = type ?? pricePreset.type;
    //     pricePreset.price = price ?? pricePreset.price;
    //     pricePreset.weekendPrice = weekendPrice ?? pricePreset.weekendPrice;
    //     switch (type) {
    //         case PricePresetType.CUSTOM:
    //             pricePreset.startDate = startDate;
    //             pricePreset.endDate = endDate;
    //             break;
    //         case PricePresetType.QUARTERLY:
    //             if (months && isArray(months)) {
    //                 pricePreset.months = months;
    //             }
    //             break;
    //         case PricePresetType.MONTHLY:
    //             if (months && isArray(months)) {
    //                 pricePreset.months = months;
    //             }
    //             if (weeks && isArray(weeks)) {
    //                 pricePreset.weeks = weeks;
    //             }
    //             break;
    //     }
    //     const savedPricePreset = await pricePreset.save();
    //     return response.send(httpAcceptedOrUpdated(savedPricePreset, UPDATED));
    // } catch (error: any) {
    //     next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    // }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const bankAccount = await BankAccount.findOne({ _id: ID });
        if (!bankAccount) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        if (bankAccount.primaryAccount && bankAccount.primaryAccount === true) {
            const firstBankAccount = await BankAccount.findOne({ businessProfileID: bankAccount.businessProfileID, userID: bankAccount.userID });
            if (firstBankAccount) {
                console.log(firstBankAccount);
                firstBankAccount.primaryAccount = true;
                await firstBankAccount.save();
            }
        }
        await bankAccount.deleteOne();
        return response.send(httpNoContent(null, DELETED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    // try {

    // } catch (error: any) {
    //     next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    // }
}
const setPrimaryAccount = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, AccountType, businessProfileID, role } = request.user;
        const ID = request?.params?.id;
        const bankAccount = await BankAccount.findOne({ _id: ID, userID: id, businessProfileID: businessProfileID });
        if (!bankAccount) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        bankAccount.primaryAccount = true;
        await bankAccount.save();
        await BankAccount.updateMany({ _id: { $nin: bankAccount._id } }, { primaryAccount: false });
        return response.send(httpNoContent(null, "Bank account set as the primary account."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


export default { banks, index, store, update, destroy, show, setPrimaryAccount };
