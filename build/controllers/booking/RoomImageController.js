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
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const roomImage_model_1 = __importDefault(require("../../database/models/roomImage.model"));
const S3Service_1 = __importDefault(require("../../services/S3Service"));
const s3Service = new S3Service_1.default();
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id: imageID } = request.params;
        const { id: userID } = request.user;
        // Find the image
        const roomImage = yield roomImage_model_1.default.findById(imageID);
        if (!roomImage) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Room image not found."), "Room image not found."));
        }
        // Optional: Check if the user owns the room business profile
        // For now, following the pattern in RoomController.ts where authenticateUser handles general auth
        const roomID = roomImage.roomID;
        const wasCoverImage = roomImage.isCoverImage;
        // Delete from S3
        try {
            if (roomImage.sourceUrl) {
                yield s3Service.deleteS3Asset(roomImage.sourceUrl);
            }
            if (roomImage.thumbnailUrl && roomImage.thumbnailUrl !== roomImage.sourceUrl) {
                yield s3Service.deleteS3Asset(roomImage.thumbnailUrl);
            }
        }
        catch (s3Error) {
            console.error("Error deleting room image from S3:", s3Error);
            // We continue even if S3 delete fails to keep DB in sync
        }
        // Delete from DB
        yield roomImage.deleteOne();
        // If it was a cover image, assign a new one
        if (wasCoverImage) {
            const nextImage = yield roomImage_model_1.default.findOne({ roomID: roomID });
            if (nextImage) {
                nextImage.isCoverImage = true;
                yield nextImage.save();
            }
        }
        return response.send((0, response_1.httpNoContent)(null, "Room image deleted successfully."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { destroy };
