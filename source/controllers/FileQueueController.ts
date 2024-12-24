import { Request, Response, NextFunction } from "express";
import { httpCreated, httpInternalServerError, httpNoContent, httpAcceptedOrUpdated, httpOk, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import FileQueue, { QueueStatus } from "../database/models/file-processing.model";
import fileSystem from "fs/promises";
import { isArray } from "../utils/helper/basic";
import Media from "../database/models/media.model";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { status }: any = request.query;
        if (status && status) {
            const fileQueues = await FileQueue.find({ status: status }).limit(10);
            return response.send(httpOk(fileQueues, 'Processing queue fetched'));
        }
        const fileQueues = await FileQueue.find({ status: { $in: [QueueStatus.CREATED] } }).limit(10);
        return response.send(httpOk(fileQueues, 'File queues fetched'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {

}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { status, s3Location } = request.body;
        const fileQueue = await FileQueue.findOne({ _id: ID });
        if (!fileQueue) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("File queue not found"), "File queue not found"));
        }
        fileQueue.status = status ?? fileQueue.status;
        if (s3Location && isArray(s3Location)) {
            fileQueue.s3Location = s3Location ? s3Location : fileQueue.s3Location;
        }
        const savedFileQueue = await fileQueue.save();
        if (savedFileQueue && savedFileQueue.status === QueueStatus.COMPLETED && savedFileQueue.s3Location && savedFileQueue.s3Location.length !== 0) {
            const media = await Media.findOne({ s3Key: savedFileQueue.s3Key });
            if (media) {
                const m3u8Urls = savedFileQueue.s3Location.filter((url) => url.endsWith('.m3u8'));
                const sourceUrl = media.sourceUrl;
                media.videoUrl = sourceUrl ?? media.sourceUrl;
                if (m3u8Urls.length !== 0) {
                    media.sourceUrl = m3u8Urls[0] ?? media.sourceUrl;
                }

                await media.save();
                //Remove public file in main server after conversion
                await fileSystem.unlink(savedFileQueue.filePath);
                if (m3u8Urls.length !== 0) {
                    fileQueue.filePath = m3u8Urls[0];
                }
                fileQueue.mediaID = media.id;
                await fileQueue.save();
            }
        }
        return response.send(httpAcceptedOrUpdated(savedFileQueue, 'File queue updated'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        return response.send(httpOk(null, 'Not implemented'));
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
