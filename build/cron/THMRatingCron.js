"use strict";
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
const node_cron_1 = __importDefault(require("node-cron"));
const constants_1 = require("../config/constants");
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const post_model_1 = __importDefault(require("../database/models/post.model"));
function rateTHMBusiness() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Rate THM Business");
            const reviews = yield post_model_1.default.aggregate([
                {
                    $match: {
                        reviewedBusinessProfileID: { $ne: null }
                    }
                },
                {
                    $group: {
                        _id: "$reviewedBusinessProfileID",
                        totalRating: { $sum: '$rating' },
                        ratingCount: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalRating: { $toInt: "$totalRating" },
                        averageRating: {
                            $round: [{ $divide: ["$totalRating", "$ratingCount"] }, 1]
                        }
                    }
                }
            ]);
            if (reviews && reviews.length != 0) {
                yield Promise.all(reviews.map((review) => __awaiter(this, void 0, void 0, function* () {
                    yield businessProfile_model_1.default.findOneAndUpdate({ _id: review === null || review === void 0 ? void 0 : review._id }, { rating: review.averageRating });
                })));
            }
        }
        catch (error) {
            console.error("Error during Follow THM process:", error);
        }
    });
}
const THMRating = node_cron_1.default.schedule(constants_1.CronSchedule.ONLY_ON_MONDAY_AND_THURSDAY, rateTHMBusiness);
exports.default = THMRating;
