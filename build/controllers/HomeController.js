"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const basic_1 = require("../utils/helper/basic");
const post_model_1 = __importStar(require("../database/models/post.model"));
const like_model_1 = __importDefault(require("../database/models/like.model"));
const businessProfile_model_1 = __importStar(require("../database/models/businessProfile.model"));
const user_model_1 = __importStar(require("../database/models/user.model"));
const mongodb_1 = require("mongodb");
const BusinessQuestionSeeder_1 = __importDefault(require("../database/seeders/BusinessQuestionSeeder"));
const shuffle_1 = require("../utils/shuffle"); // create a helper function (shown below)
const recentPostCache_1 = require("../utils/recentPostCache"); // simple in-memory cache (or Redis if prod)
const BusinessTypeSeeder_1 = __importDefault(require("../database/seeders/BusinessTypeSeeder"));
const BusinessSubtypeSeeder_1 = __importDefault(require("../database/seeders/BusinessSubtypeSeeder"));
const PromoCodeSeeder_1 = __importDefault(require("../database/seeders/PromoCodeSeeder"));
const ReviewQuestionSeeder_1 = __importDefault(require("../database/seeders/ReviewQuestionSeeder"));
const FAQSeeder_1 = __importDefault(require("../database/seeders/FAQSeeder"));
const order_model_1 = __importStar(require("../database/models/order.model"));
const eventJoin_model_1 = __importDefault(require("../database/models/eventJoin.model"));
const EncryptionService_1 = __importDefault(require("../services/EncryptionService"));
const sharp_1 = __importDefault(require("sharp"));
const encryptionService = new EncryptionService_1.default();
//FIXME suggestion based on location
//FIXME remove suggestion key from request.query
// simple in-memory counter (resets when server restarts)
const feed = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType } = request.user;
        let { pageNumber, documentLimit, query, lat, lng } = request.query;
        if (!id) {
            return response.status(200).json({
                success: false,
                message: "User not authenticated",
                data: [],
            });
        }
        const dbQuery = Object.assign({}, post_model_1.getPostQuery);
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        // Fetch all necessary data in parallel
        const [likedByMe, savedByMe, joiningEvents, blockedUsers, verifiedBusinessIDs] = yield Promise.all([
            like_model_1.default.distinct("postID", { userID: id, postID: { $ne: null } }),
            (0, post_model_1.getSavedPost)(id),
            eventJoin_model_1.default.distinct("postID", { userID: id, postID: { $ne: null } }),
            (0, user_model_1.getBlockedUsers)(id),
            user_model_1.default.distinct("businessProfileID", Object.assign(Object.assign({}, user_model_1.activeUserQuery), { businessProfileID: { $ne: null } })),
            user_model_1.default.findOne({ _id: id }),
        ]);
        // Update user's home location (if provided)
        lat = lat || 0;
        lng = lng || 0;
        const parsedLat = Number(lat);
        const parsedLng = Number(lng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
            const location = {
                geoCoordinate: { type: "Point", coordinates: [lng, lat] }
            };
            user_model_1.default.updateOne({ _id: id }, { $set: location })
                .then(() => console.log("Home location updated", "lat", lat, "lng", lng))
                .catch((error) => console.error("Error updating location:", error));
        }
        // Exclude blocked users' posts
        Object.assign(dbQuery, { userID: { $nin: blockedUsers } });
        // Fetch posts, total count, and suggestions
        const [documents, totalDocument, suggestions] = yield Promise.all([
            (0, post_model_1.fetchPosts)(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit, lat, lng),
            (0, post_model_1.countPostDocument)(dbQuery),
            (0, businessProfile_model_1.fetchBusinessProfiles)({ _id: { $in: verifiedBusinessIDs } }, pageNumber, 7, lat, lng),
        ]);
        let data = [];
        const isTopPage = Number(pageNumber) === 1;
        // if (isTopPage) {
        //   const cachedFeed = FeedOrderCache.get(id);
        //   if (cachedFeed) {
        //     data = cachedFeed;
        //     FeedOrderCache.decrement(id);
        //   } else {
        //     data = shuffleArray(documents); // Randomized order
        //     FeedOrderCache.set(id, data);
        //   }
        // } else {
        //   data = shuffleArray(documents);
        // }
        data = (0, shuffle_1.shuffleArray)(documents);
        // // -----------------------------
        // // TEMP CHANGE: SORT POSTS BY LATEST FIRST
        // // -----------------------------
        // // This ensures that newly created posts appear at the top of the feed.
        // data = documents.sort((a: any, b: any) => {
        //   const dateA = new Date(a.createdAt).getTime();
        //   const dateB = new Date(b.createdAt).getTime();
        //   return dateB - dateA; // Descending order => latest first
        // });
        // // -----------------------------
        // // RECENT POST PRIORITY LOGIC (UNCHANGED)
        // // -----------------------------
        const recentPost = yield recentPostCache_1.UserRecentPostCache.get(id);
        if (recentPost) {
            const postExists = data.find(p => p._id.toString() === recentPost.postID.toString());
            if (!postExists) {
                const userPost = yield post_model_1.default.findOne({ _id: recentPost.postID }).populate([
                    { path: "userID", select: "fullName userName profileImage city country accountType" },
                    { path: "businessProfileID", select: "businessName businessLogo category" },
                ]);
                if (userPost)
                    data.unshift(userPost);
            }
            else {
                data = [
                    postExists,
                    ...data.filter(p => p._id.toString() !== recentPost.postID.toString()),
                ];
            }
            yield recentPostCache_1.UserRecentPostCache.decrement(id);
        }
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        if (accountType === user_model_1.AccountType.INDIVIDUAL && (suggestions === null || suggestions === void 0 ? void 0 : suggestions.length)) {
            data.push({
                _id: new mongodb_1.ObjectId(),
                postType: "suggestion",
                data: suggestions,
            });
        }
        // -----------------------------
        return response.send((0, response_1.httpOkExtended)(data, "Home feed fetched.", pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//FIXME Remove my own business from suggestions
const suggestion = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, suggestion } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [blockedUsers, verifiedBusinessIDs, currentUser] = yield Promise.all([
            (0, user_model_1.getBlockedUsers)(id),
            user_model_1.default.distinct('businessProfileID', Object.assign(Object.assign({}, user_model_1.activeUserQuery), { businessProfileID: { $ne: null } })),
            user_model_1.default.findOne({ _id: id }),
        ]);
        const [lng, lat] = ((_b = currentUser === null || currentUser === void 0 ? void 0 : currentUser.geoCoordinate) === null || _b === void 0 ? void 0 : _b.coordinates) || [0, 0];
        const dbQuery = {
            _id: { $in: verifiedBusinessIDs, $nin: blockedUsers }
        };
        const [documents, totalDocument] = yield Promise.all([
            (0, businessProfile_model_1.fetchBusinessProfiles)(dbQuery, pageNumber, documentLimit, lat, lng),
            businessProfile_model_1.default.find(dbQuery).countDocuments(),
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Suggestion fetched', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const dbSeeder = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const hostAddress = request.protocol + "://" + request.get("host");
        const promoCodeSeeder = new PromoCodeSeeder_1.default();
        const shouldRunPromoCodeSeeder = yield promoCodeSeeder.shouldRun();
        if (shouldRunPromoCodeSeeder) {
            yield promoCodeSeeder.run();
        }
        const businessTypeSeeder = new BusinessTypeSeeder_1.default(hostAddress);
        const shouldRunBusinessTypeSeeder = yield businessTypeSeeder.shouldRun();
        if (shouldRunBusinessTypeSeeder) {
            yield businessTypeSeeder.run();
        }
        const businessSubtypeSeeder = new BusinessSubtypeSeeder_1.default();
        const shouldRunBusinessSubtypeSeeder = yield businessSubtypeSeeder.shouldRun();
        if (shouldRunBusinessSubtypeSeeder) {
            yield businessSubtypeSeeder.run();
        }
        const businessQuestionSeeder = new BusinessQuestionSeeder_1.default(hostAddress);
        const shouldRunBusinessQuestionSeeder = yield businessQuestionSeeder.shouldRun();
        if (shouldRunBusinessQuestionSeeder) {
            yield businessQuestionSeeder.run();
        }
        const reviewQuestionSeeder = new ReviewQuestionSeeder_1.default(hostAddress);
        const shouldRunReviewQuestionSeeder = yield reviewQuestionSeeder.shouldRun();
        if (shouldRunReviewQuestionSeeder) {
            yield reviewQuestionSeeder.run();
        }
        const faqSeeder = new FAQSeeder_1.default();
        const shouldRunFAQSeeder = yield faqSeeder.shouldRun();
        if (shouldRunFAQSeeder) {
            yield faqSeeder.run();
        }
        return response.send((0, response_1.httpOk)(null, "Done"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const transactions = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        const dbQuery = { userID: new mongodb_1.ObjectId(id), status: order_model_1.OrderStatus.COMPLETED };
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        if (query !== undefined && query !== "") {
        }
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [documents, totalDocument] = yield Promise.all([
            order_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    '$lookup': {
                        'from': 'subscriptionplans',
                        'let': { 'subscriptionPlanID': '$subscriptionPlanID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$subscriptionPlanID'] } } },
                            {
                                '$project': {
                                    _id: 1,
                                    image: 1,
                                    name: 1,
                                }
                            }
                        ],
                        'as': 'subscriptionPlanRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$subscriptionPlanRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
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
                        id: 1,
                        orderID: 1,
                        grandTotal: 1,
                        paymentDetail: 1,
                        subscriptionPlanRef: 1,
                        createdAt: 1,
                    }
                }
            ]).exec(),
            order_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Transactions fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const createThumbnail = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        let { letter, color, size } = request.query;
        let width = 240, height = 240, font = 180;
        if (size && size === "large") {
            height = 1000;
            width = 1000;
            font = 700;
        }
        if (size && size === "medium") {
            width = 620;
            height = 620;
            font = 500;
        }
        // const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        //     <rect width="100%" height="100%" fill="${color ? '#' + color : randomColor()}" />
        //     <text x="50%" y="50%" font-size="${font}" font-weight="700" text-anchor="middle" fill="white" dy=".3em">${letter?.substring(0, 1)?.toUpperCase() ?? "A"}</text>
        // </svg>`;
        const svg = `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="${width}" height="${height}" fill="${color ? '#' + color : (0, basic_1.randomColor)()}" />
<path d="M12 13C14.7614 13 17 10.7614 17 8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8C7 10.7614 9.23858 13 12 13Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
        const svgBuffer = Buffer.from(svg);
        const pngBuffer = yield (0, sharp_1.default)(svgBuffer).png().toBuffer();
        response.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': Buffer.byteLength(pngBuffer),
        });
        response.write(pngBuffer);
        return response.end();
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const professions = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const professions = [
            'Business Person/ Man',
            'Government Sector/ Employee',
            'Self Employee/ Private Job',
            'Belongs To Hotel Industry',
            'Others',
        ];
        return response.send((0, response_1.httpOk)(professions.map((profession) => ({ name: profession })), "Profession fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { feed, dbSeeder, transactions, createThumbnail, professions, suggestion };
