
import { Request, Response, NextFunction } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpOkExtended, httpNotFoundOr404, httpForbidden } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessQuestion from "../database/models/businessQuestion.model";
import { parseQueryParam, predictCategory, randomColor } from "../utils/helper/basic";
import Post, { countPostDocument, fetchPosts, getPostQuery, getPostsCount, getSavedPost, } from "../database/models/post.model";
import Like from "../database/models/like.model";
import SavedPost from "../database/models/savedPost.model";
import BusinessProfile, { addUserInBusinessProfile, fetchBusinessProfiles } from "../database/models/businessProfile.model";
import UserConnection from "../database/models/userConnection.model";
import User, { AccountType, activeUserQuery, addBusinessSubTypeInBusinessProfile, addBusinessTypeInBusinessProfile, getBlockedUsers } from "../database/models/user.model";
import { ConnectionStatus } from "../database/models/userConnection.model";

import WebsiteRedirection from "../database/models/websiteRedirection.model";
import Story, { addMediaInStory, storyTimeStamp } from "../database/models/story.model";
import { ObjectId } from "mongodb";
import BusinessQuestionSeeder from "../database/seeders/BusinessQuestionSeeder";
import BusinessReviewQuestion from "../database/models/businessReviewQuestion.model";
import { shuffleArray } from "../utils/shuffle"; // create a helper function (shown below)
import { UserRecentPostCache } from "../utils/recentPostCache"; // simple in-memory cache (or Redis if prod)
import { FeedOrderCache } from "../utils/feedOrderCache";
import BusinessTypeSeeder from "../database/seeders/BusinessTypeSeeder";
import BusinessSubtypeSeeder from "../database/seeders/BusinessSubtypeSeeder";
import PromoCodeSeeder from "../database/seeders/PromoCodeSeeder";
import ReviewQuestionSeeder from "../database/seeders/ReviewQuestionSeeder";
import FAQSeeder from "../database/seeders/FAQSeeder";
import Order, { OrderStatus } from "../database/models/order.model";
import EventJoin from "../database/models/eventJoin.model";
import { AppConfig } from "../config/constants";
import moment from "moment";
import AccountReach from "../database/models/accountReach.model";
import Comment from "../database/models/comment.model";
import SharedContent from "../database/models/sharedContent.model";
import { BusinessType as BusinessTypeEnum } from "../database/seeders/BusinessTypeSeeder";
import EncryptionService from "../services/EncryptionService";
import sharp from 'sharp';
import AnonymousUser from "../database/models/anonymousUser.model";
import { GeoCoordinate } from "../database/models/common.model";
import axios from "axios";
import { ContentType } from "../common";
import Message, { MessageType } from "../database/models/message.model";
import View from "../database/models/view.model.";
const encryptionService = new EncryptionService();

//FIXME suggestion based on location
//FIXME remove suggestion key from request.query
// simple in-memory counter (resets when server restarts)



const feed = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { id, accountType } = request.user;
    let { pageNumber, documentLimit, query, lat, lng }: any = request.query;

    if (!id) {
      return response.status(200).json({
        success: false,
        message: "User not authenticated",
        data: [],
      });
    }

    const dbQuery = { ...getPostQuery };
    pageNumber = parseQueryParam(pageNumber, 1);
    documentLimit = parseQueryParam(documentLimit, 20);

    const [
      likedByMe,
      savedByMe,
      joiningEvents,
      blockedUsers,
      verifiedBusinessIDs
    ] = await Promise.all([
      Like.distinct("postID", { userID: id, postID: { $ne: null } }),
      getSavedPost(id),
      EventJoin.distinct("postID", { userID: id, postID: { $ne: null } }),
      getBlockedUsers(id),
      User.distinct("businessProfileID", {
        ...activeUserQuery,
        businessProfileID: { $ne: null },
      }),
      User.findOne({ _id: id }),
    ]);

   
    lat = lat || 0;
    lng = lng || 0;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
      const location = {
        geoCoordinate: { type: "Point", coordinates: [lng, lat] }
      };
      User.updateOne({ _id: id }, { $set: location })
        .then(() => console.log("Home location updated", "lat", lat, "lng", lng))
        .catch((error) => console.error("Error updating location:", error));
    }

    Object.assign(dbQuery, { userID: { $nin: blockedUsers } });

    const [documents, totalDocument, suggestions] = await Promise.all([
      fetchPosts(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit, lat, lng),
      countPostDocument(dbQuery),
      fetchBusinessProfiles(
        { _id: { $in: verifiedBusinessIDs } },
        pageNumber,
        7,
        lat,
        lng
      ),
    ]);

    let data: any[] = [];
    const isTopPage = Number(pageNumber) === 1;

    if (isTopPage) {
      const cachedFeed = FeedOrderCache.get(id);
      if (cachedFeed) {
        data = cachedFeed;
        FeedOrderCache.decrement(id);
      } else {
        data = shuffleArray(documents);
        FeedOrderCache.set(id, data);
      }
    } else {
      data = shuffleArray(documents);
    }
  
    const recentPost = await UserRecentPostCache.get(id);

    if (recentPost) {
      const postExists = data.find(p => p._id.toString() === recentPost.postID.toString());
      if (!postExists) {
        const userPost = await Post.findOne({ _id: recentPost.postID }).populate([
          { path: "userID", select: "fullName userName profileImage city country accountType" },
          { path: "businessProfileID", select: "businessName businessLogo category" },
        ]);
        if (userPost) data.unshift(userPost);
      } else {
        data = [
          postExists,
          ...data.filter(p => p._id.toString() !== recentPost.postID.toString()),
        ];
      }
      await UserRecentPostCache.decrement(id);
    }
    const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
    if (accountType === AccountType.INDIVIDUAL && suggestions?.length) {
      data.push({
        _id: new ObjectId(),
        postType: "suggestion",
        data: suggestions,
      });
    }

    return response.send(
      httpOkExtended(data, "Home feed fetched.", pageNumber, totalPagesCount, totalDocument)
    );

  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
};





//FIXME Remove my own business from suggestions
const suggestion = async (request: Request, response: Response, next: NextFunction) => {
  try {

    const { id } = request.user;
    let { pageNumber, documentLimit, query, suggestion }: any = request.query;
    pageNumber = parseQueryParam(pageNumber, 1);
    documentLimit = parseQueryParam(documentLimit, 20);
    if (!id) {
      return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
    }
    const [blockedUsers, verifiedBusinessIDs, currentUser] = await Promise.all([
      getBlockedUsers(id),
      User.distinct('businessProfileID', { ...activeUserQuery, businessProfileID: { $ne: null } }),
      User.findOne({ _id: id }),
    ]);
    const [lng, lat] = currentUser?.geoCoordinate?.coordinates || [0, 0];
    const dbQuery = {
      _id: { $in: verifiedBusinessIDs, $nin: blockedUsers }
    };
    const [documents, totalDocument] = await Promise.all([
      fetchBusinessProfiles(dbQuery, pageNumber, documentLimit, lat, lng),
      BusinessProfile.find(dbQuery).countDocuments(),
    ]);
    const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
    return response.send(httpOkExtended(documents, 'Suggestion fetched', pageNumber, totalPagesCount, totalDocument));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
}




const dbSeeder = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const hostAddress = request.protocol + "://" + request.get("host");
    const promoCodeSeeder = new PromoCodeSeeder();
    const shouldRunPromoCodeSeeder = await promoCodeSeeder.shouldRun();
    if (shouldRunPromoCodeSeeder) {
      await promoCodeSeeder.run();
    }
    const businessTypeSeeder = new BusinessTypeSeeder(hostAddress);
    const shouldRunBusinessTypeSeeder = await businessTypeSeeder.shouldRun();
    if (shouldRunBusinessTypeSeeder) {
      await businessTypeSeeder.run();
    }
    const businessSubtypeSeeder = new BusinessSubtypeSeeder();
    const shouldRunBusinessSubtypeSeeder = await businessSubtypeSeeder.shouldRun();
    if (shouldRunBusinessSubtypeSeeder) {
      await businessSubtypeSeeder.run();
    }
    const businessQuestionSeeder = new BusinessQuestionSeeder(hostAddress);
    const shouldRunBusinessQuestionSeeder = await businessQuestionSeeder.shouldRun();
    if (shouldRunBusinessQuestionSeeder) {
      await businessQuestionSeeder.run();
    }
    const reviewQuestionSeeder = new ReviewQuestionSeeder(hostAddress);
    const shouldRunReviewQuestionSeeder = await reviewQuestionSeeder.shouldRun();
    if (shouldRunReviewQuestionSeeder) {
      await reviewQuestionSeeder.run();
    }
    const faqSeeder = new FAQSeeder();
    const shouldRunFAQSeeder = await faqSeeder.shouldRun();
    if (shouldRunFAQSeeder) {
      await faqSeeder.run();
    }
    return response.send(httpOk(null, "Done"));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }

}




const transactions = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { id } = request.user;
    let { pageNumber, documentLimit, query }: any = request.query;
    const dbQuery = { userID: new ObjectId(id), status: OrderStatus.COMPLETED };
    pageNumber = parseQueryParam(pageNumber, 1);
    documentLimit = parseQueryParam(documentLimit, 20);
    if (query !== undefined && query !== "") {
    }
    if (!id) {
      return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
    }
    const [documents, totalDocument] = await Promise.all([
      Order.aggregate(
        [
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
              'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
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
        ]
      ).exec(),
      Order.find(dbQuery).countDocuments()
    ]);
    const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
    return response.send(httpOkExtended(documents, 'Transactions fetched.', pageNumber, totalPagesCount, totalDocument));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
}
const createThumbnail = async (request: Request, response: Response, next: NextFunction) => {
  try {
    let { letter, color, size }: any = request.query;
    let width = 240, height = 240, font = 180;
    if (size && size === "large") {
      height = 1000;
      width = 1000;
      font = 700;
    }
    if (size && size === "medium") {
      width = 620;
      height = 620;
      font = 500
    }
    // const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    //     <rect width="100%" height="100%" fill="${color ? '#' + color : randomColor()}" />
    //     <text x="50%" y="50%" font-size="${font}" font-weight="700" text-anchor="middle" fill="white" dy=".3em">${letter?.substring(0, 1)?.toUpperCase() ?? "A"}</text>
    // </svg>`;
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="${width}" height="${height}" fill="${color ? '#' + color : randomColor()}" />
<path d="M12 13C14.7614 13 17 10.7614 17 8C17 5.23858 14.7614 3 12 3C9.23858 3 7 5.23858 7 8C7 10.7614 9.23858 13 12 13Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    const svgBuffer = Buffer.from(svg);
    const pngBuffer = await sharp(svgBuffer).png().toBuffer();
    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': Buffer.byteLength(pngBuffer),
    });
    response.write(pngBuffer);
    return response.end();
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
}
const professions = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const professions = [
      'Business Person/ Man',
      'Government Sector/ Employee',
      'Self Employee/ Private Job',
      'Belongs To Hotel Industry',
      'Others',
    ];
    return response.send(httpOk(professions.map((profession) => ({ name: profession })), "Profession fetched"));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
}
export default { feed, dbSeeder, transactions, createThumbnail, professions, suggestion };


