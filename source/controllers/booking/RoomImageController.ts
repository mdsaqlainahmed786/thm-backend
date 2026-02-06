import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpInternalServerError, httpNoContent, httpNotFoundOr404 } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import RoomImage from "../../database/models/roomImage.model";
import S3Service from "../../services/S3Service";

const s3Service = new S3Service();

const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id: imageID } = request.params;
        const { id: userID } = request.user;

        // Find the image
        const roomImage = await RoomImage.findById(imageID);
        if (!roomImage) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Room image not found."), "Room image not found."));
        }

        // Optional: Check if the user owns the room business profile
        // For now, following the pattern in RoomController.ts where authenticateUser handles general auth

        const roomID = roomImage.roomID;
        const wasCoverImage = roomImage.isCoverImage;

        // Delete from S3
        try {
            if (roomImage.sourceUrl) {
                await s3Service.deleteS3Asset(roomImage.sourceUrl);
            }
            if (roomImage.thumbnailUrl && roomImage.thumbnailUrl !== roomImage.sourceUrl) {
                await s3Service.deleteS3Asset(roomImage.thumbnailUrl);
            }
        } catch (s3Error: any) {
            console.error("Error deleting room image from S3:", s3Error);
            // We continue even if S3 delete fails to keep DB in sync
        }

        // Delete from DB
        await roomImage.deleteOne();

        // If it was a cover image, assign a new one
        if (wasCoverImage) {
            const nextImage = await RoomImage.findOne({ roomID: roomID });
            if (nextImage) {
                nextImage.isCoverImage = true;
                await nextImage.save();
            }
        }

        return response.send(httpNoContent(null, "Room image deleted successfully."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

export default { destroy };
