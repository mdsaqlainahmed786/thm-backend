import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { isArray, parseQueryParam } from "../../utils/helper/basic";
import Amenity from '../../database/models/amenity.model';
import Room, { addAmenitiesInRoom, addRoomImagesInRoom } from "../../database/models/room.model";
import BusinessProfile from "../../database/models/businessProfile.model";
import { generateThumbnail, deleteUnwantedFiles } from "../MediaController";
import RoomImage from "../../database/models/roomImage.model";
import AccountReach from "../../database/models/accountReach.model";
import { AccountType, addAmenitiesInBusinessProfile } from "../../database/models/user.model";
import { ObjectId } from "mongodb";
import PricePreset, { generatePricePresetForRoom } from "../../database/models/pricePreset.model";
import RoomPrices from "../../database/models/demo/roomPrices.model";
const NOT_FOUND = "Room not found.";
const FETCHED = "Rooms fetched.";
const CREATED = "Room created.";
const UPDATED = "Room updated.";
const DELETED = "Room deleted.";
const RETRIEVED = "Room fetched.";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        let { pageNumber, documentLimit, query, bedType, roomType }: any = request.query;
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
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            Object.assign(dbQuery, { businessProfileID: new ObjectId(businessProfileID) });
        }
        if (bedType) {
            Object.assign(dbQuery, { bedType: bedType })
        }
        if (roomType) {
            Object.assign(dbQuery, { roomType: roomType })
        }
        const [documents, totalDocument] = await Promise.all([
            Room.aggregate([
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
            Room.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        const { description, price, currency, title, amenities, bedType, roomType, mealPlan, children, adults, totalRooms } = request.body;
        
        // Handle files from .any() - can be array or object with fieldnames
        // Accept common variants from clients (images, images[])
        const allFiles: Express.Multer.S3File[] = Array.isArray(request.files)
            ? (request.files as Express.Multer.S3File[])
            : Object.values((request.files as { [fieldname: string]: Express.Multer.File[] } | undefined) ?? {})
                .flat() as Express.Multer.S3File[];
        
        const allowedFieldNames = new Set(['images', 'images[]']);
        const unexpectedFiles = allFiles.filter((f) => !allowedFieldNames.has(f.fieldname));
        const mediaFiles = allFiles.filter((f) => allowedFieldNames.has(f.fieldname)) as Express.Multer.S3File[];
        
        // Delete any unexpected files that were uploaded
        if (unexpectedFiles.length > 0) {
            await deleteUnwantedFiles(unexpectedFiles);
        }
        
        // Validate field name - provide helpful error if wrong field name was used
        if (allFiles.length > 0 && mediaFiles.length === 0) {
            const receivedFields = Array.from(new Set(allFiles.map((f) => f.fieldname))).filter(Boolean);
            return response.send(httpBadRequest(
                ErrorMessage.invalidRequest(`Room images field must be 'images'. Received: ${receivedFields.join(', ') || 'none'}`),
                `Room images field must be 'images'. Received: ${receivedFields.join(', ') || 'none'}`
            ));
        }
        
        // Enforce max count of 5 images
        const MAX_IMAGES = 5;
        if (mediaFiles.length > MAX_IMAGES) {
            const extraFiles = mediaFiles.slice(MAX_IMAGES);
            await deleteUnwantedFiles(extraFiles);
            // Continue with only the first 5 images
        }
        const validMediaFiles = mediaFiles.slice(0, MAX_IMAGES);
        
        let businessProfile = businessProfileID || request?.body?.businessProfileID;
        if (!businessProfile) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Business profile id is required"), "Business profile id is required"))
        }
        const businessProfileRef = await BusinessProfile.findOne({ _id: businessProfile });
        if (!businessProfileRef) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        let amenitiesArray: string[] = [];
        if (amenities && isArray(amenities)) {
            // Convert string IDs to ObjectIds for MongoDB query
            const amenityObjectIds = amenities.map((id: any) => {
                try {
                    return new ObjectId(id);
                } catch (error) {
                    return null;
                }
            }).filter((id: any) => id !== null);
            
            if (amenityObjectIds.length > 0) {
                amenitiesArray = await Amenity.distinct("_id", { _id: { $in: amenityObjectIds } }) as string[];
            }
        }
        // const room = await checkAvailability(roomType, checkIn, checkOut);

        // if (!room) return res.status(404).json({ message: "No available rooms" });
        const newRoom = new Room();
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
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Room images is required."), "Room images is required."))
        }

        // Save the room FIRST to get a valid _id
        const savedRoom = await newRoom.save();

        /**
         * Handle Room Images 
         * Process images after room is saved to ensure we have a valid roomID
         */
        try {
            await Promise.all(validMediaFiles.map(async (mediaFile, index) => {
                try {
                    // Generate thumbnail with error handling - if it fails, use original image
                    const mediaFileThumbnail = await generateThumbnail(mediaFile, "image", 486, 324).catch((error) => {
                        console.error(`Failed to generate thumbnail for image ${index}:`, error);
                        return null; // Return null if thumbnail generation fails
                    });
                    
                    const newRoomImage = new RoomImage();
                    newRoomImage.roomID = savedRoom._id; // Use saved room's _id
                    newRoomImage.isCoverImage = index === 0 ? true : false;
                    newRoomImage.sourceUrl = mediaFile.location;
                    newRoomImage.thumbnailUrl = mediaFileThumbnail?.Location || mediaFile.location;
                    const savedRoomImage = await newRoomImage.save();
                    return savedRoomImage.id;
                } catch (error: any) {
                    // Log error but don't fail the entire operation for a single image
                    console.error(`Error processing room image ${index}:`, error);
                    // Still create the room image record with the original URL if thumbnail fails
                    const newRoomImage = new RoomImage();
                    newRoomImage.roomID = savedRoom._id;
                    newRoomImage.isCoverImage = index === 0 ? true : false;
                    newRoomImage.sourceUrl = mediaFile.location;
                    newRoomImage.thumbnailUrl = mediaFile.location; // Fallback to original
                    await newRoomImage.save().catch((saveError) => {
                        console.error(`Failed to save room image ${index}:`, saveError);
                    });
                }
            }));
        } catch (error: any) {
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
        return response.send(httpCreated(savedAmenity, CREATED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        const ID = request?.params?.id;
        const { description, price, currency, title, amenities, bedType, roomType, mealPlan, children, adults, totalRooms } = request.body;
        
        // Handle files from .any() - can be array or object with fieldnames
        // Accept common variants from clients (images, images[])
        const allFiles: Express.Multer.S3File[] = Array.isArray(request.files)
            ? (request.files as Express.Multer.S3File[])
            : Object.values((request.files as { [fieldname: string]: Express.Multer.File[] } | undefined) ?? {})
                .flat() as Express.Multer.S3File[];
        
        const allowedFieldNames = new Set(['images', 'images[]']);
        const unexpectedFiles = allFiles.filter((f) => !allowedFieldNames.has(f.fieldname));
        const mediaFiles = allFiles.filter((f) => allowedFieldNames.has(f.fieldname)) as Express.Multer.S3File[];
        
        // Delete any unexpected files that were uploaded
        if (unexpectedFiles.length > 0) {
            await deleteUnwantedFiles(unexpectedFiles);
        }
        
        // Enforce max count of 5 images for updates
        const MAX_IMAGES = 5;
        if (mediaFiles.length > MAX_IMAGES) {
            const extraFiles = mediaFiles.slice(MAX_IMAGES);
            await deleteUnwantedFiles(extraFiles);
            // Continue with only the first 5 images
        }
        const validMediaFiles = mediaFiles.slice(0, MAX_IMAGES);

        const query = { _id: ID };
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            Object.assign({ businessProfileID: businessProfileID });
        }
        const room = await Room.findOne(query);
        if (!room) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        room.pricePerNight = price ?? room.pricePerNight;
        room.description = description ?? room.description;
        room.currency = currency ?? room.currency;
        room.title = title ?? room.title;
        let amenitiesArray: string[] = [];
        if (amenities && isArray(amenities)) {
            // Convert string IDs to ObjectIds for MongoDB query
            const amenityObjectIds = amenities.map((id: any) => {
                try {
                    return new ObjectId(id);
                } catch (error) {
                    return null;
                }
            }).filter((id: any) => id !== null);
            
            if (amenityObjectIds.length > 0) {
                amenitiesArray = await Amenity.distinct("_id", { _id: { $in: amenityObjectIds } }) as string[];
            }
            room.amenities = amenitiesArray.length !== 0 ? amenitiesArray : room.amenities;
        }
        room.bedType = bedType ?? room.bedType;
        room.mealPlan = mealPlan ?? room.mealPlan;
        room.children = children ?? room.children;
        room.adults = adults ?? room.adults;
        room.roomType = roomType ?? room.roomType;
        room.totalRooms = totalRooms ?? room.totalRooms;
        if (validMediaFiles && validMediaFiles.length !== 0) {
            try {
                await Promise.all(validMediaFiles.map(async (mediaFile, index) => {
                    try {
                        // Generate thumbnail with error handling - if it fails, use original image
                        const mediaFileThumbnail = await generateThumbnail(mediaFile, "image", 486, 324).catch((error) => {
                            console.error(`Failed to generate thumbnail for image ${index}:`, error);
                            return null; // Return null if thumbnail generation fails
                        });
                        
                        const newRoomImage = new RoomImage();
                        newRoomImage.roomID = room._id; // Use room's _id
                        newRoomImage.isCoverImage = false;
                        newRoomImage.sourceUrl = mediaFile.location;
                        newRoomImage.thumbnailUrl = mediaFileThumbnail?.Location || mediaFile.location;
                        const savedRoomImage = await newRoomImage.save();
                        return savedRoomImage.id;
                    } catch (error: any) {
                        // Log error but don't fail the entire operation for a single image
                        console.error(`Error processing room image ${index}:`, error);
                        // Still create the room image record with the original URL if thumbnail fails
                        const newRoomImage = new RoomImage();
                        newRoomImage.roomID = room._id;
                        newRoomImage.isCoverImage = false;
                        newRoomImage.sourceUrl = mediaFile.location;
                        newRoomImage.thumbnailUrl = mediaFile.location; // Fallback to original
                        await newRoomImage.save().catch((saveError) => {
                            console.error(`Failed to save room image ${index}:`, saveError);
                        });
                    }
                }));
            } catch (error: any) {
                // If all images fail, we still have the room updated, but log the error
                console.error("Error processing room images:", error);
                // Continue - room is already updated
            }
        }
        const [savedRoom, pricePresets] = await Promise.all([
            room.save(),
            PricePreset.find({})
        ]);
        await Promise.all(pricePresets.map(async (pricePreset) => {
            await generatePricePresetForRoom(pricePreset.id)
        }))
        return response.send(httpAcceptedOrUpdated(savedRoom, UPDATED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        const ID = request?.params?.id;
        const query = { _id: ID };
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            Object.assign({ businessProfileID: businessProfileID });
        }
        const room = await Room.findOne(query);
        if (!room) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }

        await room.deleteOne();
        await RoomPrices.deleteMany({ roomID: ID });
        return response.send(httpNoContent(null, DELETED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { id } = request.params;
        const dbQuery = { _id: new ObjectId(id) };
        const room = await Room.aggregate([
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
                    'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
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
            addRoomImagesInRoom().lookup,
            addRoomImagesInRoom().addRoomCoverAndThumbnailImage,
            addAmenitiesInRoom().lookup,
            {
                '$project': {
                    'businessProfileRef': 0,
                }
            }
        ]);
        if (room.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        return response.send(httpOk(room[0], RETRIEVED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { index, store, update, destroy, show };
