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
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const basic_1 = require("../../utils/helper/basic");
const amenity_model_1 = __importDefault(require("../../database/models/amenity.model"));
const room_model_1 = __importStar(require("../../database/models/room.model"));
const businessProfile_model_1 = __importDefault(require("../../database/models/businessProfile.model"));
const MediaController_1 = require("../MediaController");
const roomImage_model_1 = __importDefault(require("../../database/models/roomImage.model"));
const user_model_1 = require("../../database/models/user.model");
const mongodb_1 = require("mongodb");
const pricePreset_model_1 = __importStar(require("../../database/models/pricePreset.model"));
const roomPrices_model_1 = __importDefault(require("../../database/models/demo/roomPrices.model"));
const NOT_FOUND = "Room not found.";
const FETCHED = "Rooms fetched.";
const CREATED = "Room created.";
const UPDATED = "Room updated.";
const DELETED = "Room deleted.";
const RETRIEVED = "Room fetched.";
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        let { pageNumber, documentLimit, query, bedType, roomType } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
        }
        if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
            Object.assign(dbQuery, { businessProfileID: new mongodb_1.ObjectId(businessProfileID) });
        }
        if (bedType) {
            Object.assign(dbQuery, { bedType: bedType });
        }
        if (roomType) {
            Object.assign(dbQuery, { roomType: roomType });
        }
        const [documents, totalDocument] = yield Promise.all([
            room_model_1.default.aggregate([
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
            room_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        const { description, price, currency, title, amenities, bedType, roomType, mealPlan, children, adults, totalRooms } = request.body;
        // Handle files from .any() - can be array or object with fieldnames
        // Accept common variants from clients (images, images[])
        const allFiles = Array.isArray(request.files)
            ? request.files
            : Object.values((_b = request.files) !== null && _b !== void 0 ? _b : {})
                .flat();
        const allowedFieldNames = new Set(['images', 'images[]']);
        const unexpectedFiles = allFiles.filter((f) => !allowedFieldNames.has(f.fieldname));
        const mediaFiles = allFiles.filter((f) => allowedFieldNames.has(f.fieldname));
        // Delete any unexpected files that were uploaded
        if (unexpectedFiles.length > 0) {
            yield (0, MediaController_1.deleteUnwantedFiles)(unexpectedFiles);
        }
        // Validate field name - provide helpful error if wrong field name was used
        if (allFiles.length > 0 && mediaFiles.length === 0) {
            const receivedFields = Array.from(new Set(allFiles.map((f) => f.fieldname))).filter(Boolean);
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(`Room images field must be 'images'. Received: ${receivedFields.join(', ') || 'none'}`), `Room images field must be 'images'. Received: ${receivedFields.join(', ') || 'none'}`));
        }
        // Enforce max count of 5 images
        const MAX_IMAGES = 5;
        if (mediaFiles.length > MAX_IMAGES) {
            const extraFiles = mediaFiles.slice(MAX_IMAGES);
            yield (0, MediaController_1.deleteUnwantedFiles)(extraFiles);
            // Continue with only the first 5 images
        }
        const validMediaFiles = mediaFiles.slice(0, MAX_IMAGES);
        let businessProfile = businessProfileID || ((_c = request === null || request === void 0 ? void 0 : request.body) === null || _c === void 0 ? void 0 : _c.businessProfileID);
        if (!businessProfile) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Business profile id is required"), "Business profile id is required"));
        }
        const businessProfileRef = yield businessProfile_model_1.default.findOne({ _id: businessProfile });
        if (!businessProfileRef) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        let amenitiesArray = [];
        if (amenities && (0, basic_1.isArray)(amenities)) {
            amenitiesArray = (yield amenity_model_1.default.distinct("_id", { _id: { $in: amenities } }));
        }
        // const room = await checkAvailability(roomType, checkIn, checkOut);
        // if (!room) return res.status(404).json({ message: "No available rooms" });
        const newRoom = new room_model_1.default();
        newRoom.businessProfileID = businessProfile;
        newRoom.title = title;
        newRoom.maxOccupancy = (parseInt(adults) + parseInt(children));
        newRoom.description = description;
        newRoom.pricePerNight = price;
        newRoom.currency = currency;
        newRoom.amenities = [...amenitiesArray];
        newRoom.bedType = bedType;
        newRoom.roomType = roomType;
        newRoom.mealPlan = mealPlan;
        newRoom.children = children;
        newRoom.adults = adults;
        newRoom.totalRooms = totalRooms;
        // Validate images before proceeding
        if (!validMediaFiles || validMediaFiles.length === 0) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Room images is required."), "Room images is required."));
        }
        // Save the room FIRST to get a valid _id
        const savedRoom = yield newRoom.save();
        /**
         * Handle Room Images
         * Process images after room is saved to ensure we have a valid roomID
         */
        try {
            yield Promise.all(validMediaFiles.map((mediaFile, index) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    // Generate thumbnail with error handling - if it fails, use original image
                    const mediaFileThumbnail = yield (0, MediaController_1.generateThumbnail)(mediaFile, "image", 486, 324).catch((error) => {
                        console.error(`Failed to generate thumbnail for image ${index}:`, error);
                        return null; // Return null if thumbnail generation fails
                    });
                    const newRoomImage = new roomImage_model_1.default();
                    newRoomImage.roomID = savedRoom._id; // Use saved room's _id
                    newRoomImage.isCoverImage = index === 0 ? true : false;
                    newRoomImage.sourceUrl = mediaFile.location;
                    newRoomImage.thumbnailUrl = (mediaFileThumbnail === null || mediaFileThumbnail === void 0 ? void 0 : mediaFileThumbnail.Location) || mediaFile.location;
                    const savedRoomImage = yield newRoomImage.save();
                    return savedRoomImage.id;
                }
                catch (error) {
                    // Log error but don't fail the entire operation for a single image
                    console.error(`Error processing room image ${index}:`, error);
                    // Still create the room image record with the original URL if thumbnail fails
                    const newRoomImage = new roomImage_model_1.default();
                    newRoomImage.roomID = savedRoom._id;
                    newRoomImage.isCoverImage = index === 0 ? true : false;
                    newRoomImage.sourceUrl = mediaFile.location;
                    newRoomImage.thumbnailUrl = mediaFile.location; // Fallback to original
                    yield newRoomImage.save().catch((saveError) => {
                        console.error(`Failed to save room image ${index}:`, saveError);
                    });
                }
            })));
        }
        catch (error) {
            // If all images fail, we still have the room saved, but log the error
            console.error("Error processing room images:", error);
            // Continue - room is already saved
        }
        // // Mark dates as unavailable
        // const current = new Date(checkIn);
        // while (current < new Date(checkOut)) {
        //     await Inventory.update(
        //         { isAvailable: false },
        //         { where: { RoomId: room.id, date: current.toISOString().split("T")[0] } }
        //     );
        //     current.setDate(current.getDate() + 1);
        // }
        const savedAmenity = savedRoom;
        return response.send((0, response_1.httpCreated)(savedAmenity, CREATED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g;
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        const ID = (_e = request === null || request === void 0 ? void 0 : request.params) === null || _e === void 0 ? void 0 : _e.id;
        const { description, price, currency, title, amenities, bedType, roomType, mealPlan, children, adults, totalRooms } = request.body;
        // Handle files from .any() - can be array or object with fieldnames
        // Accept common variants from clients (images, images[])
        const allFiles = Array.isArray(request.files)
            ? request.files
            : Object.values((_f = request.files) !== null && _f !== void 0 ? _f : {})
                .flat();
        const allowedFieldNames = new Set(['images', 'images[]']);
        const unexpectedFiles = allFiles.filter((f) => !allowedFieldNames.has(f.fieldname));
        const mediaFiles = allFiles.filter((f) => allowedFieldNames.has(f.fieldname));
        // Delete any unexpected files that were uploaded
        if (unexpectedFiles.length > 0) {
            yield (0, MediaController_1.deleteUnwantedFiles)(unexpectedFiles);
        }
        // Enforce max count of 5 images for updates
        const MAX_IMAGES = 5;
        if (mediaFiles.length > MAX_IMAGES) {
            const extraFiles = mediaFiles.slice(MAX_IMAGES);
            yield (0, MediaController_1.deleteUnwantedFiles)(extraFiles);
            // Continue with only the first 5 images
        }
        const validMediaFiles = mediaFiles.slice(0, MAX_IMAGES);
        const query = { _id: ID };
        if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
            Object.assign({ businessProfileID: businessProfileID });
        }
        const room = yield room_model_1.default.findOne(query);
        if (!room) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        room.pricePerNight = price !== null && price !== void 0 ? price : room.pricePerNight;
        room.description = description !== null && description !== void 0 ? description : room.description;
        room.currency = currency !== null && currency !== void 0 ? currency : room.currency;
        room.title = title !== null && title !== void 0 ? title : room.title;
        let amenitiesArray = [];
        if (amenities && (0, basic_1.isArray)(amenities)) {
            amenitiesArray = (yield amenity_model_1.default.distinct("_id", { _id: { $in: amenities } }));
            room.amenities = amenitiesArray.length !== 0 ? amenitiesArray : room.amenities;
        }
        room.bedType = bedType !== null && bedType !== void 0 ? bedType : room.bedType;
        room.mealPlan = mealPlan !== null && mealPlan !== void 0 ? mealPlan : room.mealPlan;
        room.children = children !== null && children !== void 0 ? children : room.children;
        room.adults = adults !== null && adults !== void 0 ? adults : room.adults;
        room.roomType = roomType !== null && roomType !== void 0 ? roomType : room.roomType;
        room.totalRooms = totalRooms !== null && totalRooms !== void 0 ? totalRooms : room.totalRooms;
        if (validMediaFiles && validMediaFiles.length !== 0) {
            try {
                yield Promise.all(validMediaFiles.map((mediaFile, index) => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        // Generate thumbnail with error handling - if it fails, use original image
                        const mediaFileThumbnail = yield (0, MediaController_1.generateThumbnail)(mediaFile, "image", 486, 324).catch((error) => {
                            console.error(`Failed to generate thumbnail for image ${index}:`, error);
                            return null; // Return null if thumbnail generation fails
                        });
                        const newRoomImage = new roomImage_model_1.default();
                        newRoomImage.roomID = room._id; // Use room's _id
                        newRoomImage.isCoverImage = false;
                        newRoomImage.sourceUrl = mediaFile.location;
                        newRoomImage.thumbnailUrl = (mediaFileThumbnail === null || mediaFileThumbnail === void 0 ? void 0 : mediaFileThumbnail.Location) || mediaFile.location;
                        const savedRoomImage = yield newRoomImage.save();
                        return savedRoomImage.id;
                    }
                    catch (error) {
                        // Log error but don't fail the entire operation for a single image
                        console.error(`Error processing room image ${index}:`, error);
                        // Still create the room image record with the original URL if thumbnail fails
                        const newRoomImage = new roomImage_model_1.default();
                        newRoomImage.roomID = room._id;
                        newRoomImage.isCoverImage = false;
                        newRoomImage.sourceUrl = mediaFile.location;
                        newRoomImage.thumbnailUrl = mediaFile.location; // Fallback to original
                        yield newRoomImage.save().catch((saveError) => {
                            console.error(`Failed to save room image ${index}:`, saveError);
                        });
                    }
                })));
            }
            catch (error) {
                // If all images fail, we still have the room updated, but log the error
                console.error("Error processing room images:", error);
                // Continue - room is already updated
            }
        }
        const [savedRoom, pricePresets] = yield Promise.all([
            room.save(),
            pricePreset_model_1.default.find({})
        ]);
        yield Promise.all(pricePresets.map((pricePreset) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, pricePreset_model_1.generatePricePresetForRoom)(pricePreset.id);
        })));
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedRoom, UPDATED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j;
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        const ID = (_h = request === null || request === void 0 ? void 0 : request.params) === null || _h === void 0 ? void 0 : _h.id;
        const query = { _id: ID };
        if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
            Object.assign({ businessProfileID: businessProfileID });
        }
        const room = yield room_model_1.default.findOne(query);
        if (!room) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        yield room.deleteOne();
        yield roomPrices_model_1.default.deleteMany({ roomID: ID });
        return response.send((0, response_1.httpNoContent)(null, DELETED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_j = error.message) !== null && _j !== void 0 ? _j : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    try {
        let { id } = request.params;
        const dbQuery = { _id: new mongodb_1.ObjectId(id) };
        const room = yield room_model_1.default.aggregate([
            {
                $match: dbQuery
            },
            {
                $project: {
                    password: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            },
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $limit: 1
            },
            {
                '$lookup': {
                    'from': 'businessprofiles',
                    'let': { 'businessProfileID': '$businessProfileID' },
                    'pipeline': [
                        { '$match': { '$expr': { '$eq': ['$_id', '$$businessProfileID'] } } },
                        {
                            '$project': {
                                'checkIn': 1,
                                'checkOut': 1,
                                'languageSpoken': 1,
                            }
                        }
                    ],
                    'as': 'businessProfileRef'
                }
            },
            {
                '$unwind': {
                    'path': '$businessProfileRef',
                    'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                }
            },
            {
                $addFields: {
                    checkIn: {
                        $cond: {
                            if: { $eq: [{ $ifNull: ["$businessProfileRef.checkIn", null] }, null] },
                            then: "11:00",
                            else: "$businessProfileRef.checkIn"
                        }
                    },
                    checkOut: {
                        $cond: {
                            if: { $eq: [{ $ifNull: ["$businessProfileRef.checkOut", null] }, null] },
                            then: "12:00",
                            else: "$businessProfileRef.checkOut"
                        }
                    },
                    languageSpoken: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: [{ $ifNull: ["$businessProfileRef.languageSpoken", []] }, []] }, // checks if not null or empty array
                                    { $ne: [{ $type: "$businessProfileRef.languageSpoken" }, "missing"] } // checks if the field exists
                                ]
                            },
                            then: "$businessProfileRef.languageSpoken",
                            else: []
                        }
                    }
                }
            },
            (0, room_model_1.addRoomImagesInRoom)().lookup,
            (0, room_model_1.addRoomImagesInRoom)().addRoomCoverAndThumbnailImage,
            (0, room_model_1.addAmenitiesInRoom)().lookup,
            {
                '$project': {
                    'businessProfileRef': 0,
                }
            }
        ]);
        if (room.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        return response.send((0, response_1.httpOk)(room[0], RETRIEVED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_k = error.message) !== null && _k !== void 0 ? _k : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, show };
