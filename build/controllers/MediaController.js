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
exports.deleteUnwantedFiles = exports.generateThumbnail = exports.storeMedia = void 0;
const mongodb_1 = require("mongodb");
const sharp_1 = __importDefault(require("sharp"));
const basic_1 = require("../utils/helper/basic");
const media_model_1 = __importStar(require("../database/models/media.model"));
const S3Service_1 = __importDefault(require("../services/S3Service"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const file_uploading_1 = require("../middleware/file-uploading");
const file_uploading_2 = require("../middleware/file-uploading");
const promises_1 = __importDefault(require("fs/promises"));
const fileProcessing_model_1 = __importDefault(require("../database/models/fileProcessing.model"));
const error_1 = require("../utils/response-message/error");
const view_model_1 = __importDefault(require("../database/models/view.model."));
const response_1 = require("../utils/response");
const post_model_1 = __importDefault(require("../database/models/post.model"));
const s3Service = new S3Service_1.default();
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
function generateThumbnail(media, thumbnailFor, width, height) {
    return __awaiter(this, void 0, void 0, function* () {
        const s3Image = yield s3Service.getS3Object(media.key);
        const cropSetting = { width: width, height: height, fit: "cover" };
        if (s3Image.Body && media.mimetype.startsWith('image/') && thumbnailFor === "image") {
            const body = s3Image.Body;
            const rawToByteArray = yield body.transformToByteArray();
            const sharpImage = yield (0, sharp_1.default)(rawToByteArray);
            // const metadata = await sharpImage.metadata();
            const thumbnail = yield sharpImage.resize(cropSetting).toBuffer();
            const thumbnailPath = (0, basic_1.addStringBeforeExtension)(media.key, `-${width}-${height}`);
            const s3Upload = yield s3Service.putS3Object(thumbnail, media.mimetype, thumbnailPath);
            return s3Upload;
        }
        return null;
        // if (s3Image.Body && media.mimetype.startsWith('video/') && thumbnailFor === "video") {
        //     const body = s3Image.Body;
        //     const rawToByteArray = await body.transformToByteArray();
        //     const thumbnailExtName = "png";
        //     const screenshot = await generateScreenshotBuffer(rawToByteArray, media.key, thumbnailExtName).catch((error: any) => console.log(error));
        //     if (screenshot) {
        //         const sharpImage = await sharp(screenshot);
        //         const metadata = await sharpImage.metadata();
        //         let thumbnailPathT = path.parse(media.key);
        //         width = metadata.width ?? 0;
        //         height = metadata.height ?? 0;
        //         // height: thumbnailHeight, fit: "contain"
        //         const thumbnail = await sharpImage.resize(cropSetting).toBuffer();
        //         //key new thumbnail key 
        //         const thumbnailPath = addStringBeforeExtension(`${thumbnailPathT.dir}/${thumbnailPathT.name}.${thumbnailExtName}`, `-${thumbnailWidth}x${thumbnailHeight}`)
        //         const thumbnailMimeType = `image/${thumbnailExtName}`;
        //         const s3Upload = await putS3Object(thumbnail, thumbnailMimeType, thumbnailPath);
        //         if (s3Upload && s3Upload.Location && s3Upload.Key) {
        //             const imageData: ThumbnailMediaFile = {
        //                 fileName: `${thumbnailPathT.name}.${thumbnailExtName}`,
        //                 width: thumbnailWidth,
        //                 height: thumbnailHeight,
        //                 fileSize: media.size,
        //                 mimeType: thumbnailMimeType,
        //                 sourceUrl: s3Upload.Location,
        //                 s3Key: s3Upload.Key,
        //                 size: Size.THUMBNAIL
        //             }
        //             sizeArray.push(imageData)
        //         }
        //     }
        // }
        // return { width, height, sizeArray };
    });
}
exports.generateThumbnail = generateThumbnail;
function storeMedia(files, userID, businessProfileID, s3BasePath, uploadedFor) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileList = [];
        if (!files || files.length === 0)
            return [];
        yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const fileObject = {
                businessProfileID,
                userID,
                fileName: file.originalname,
                fileSize: file.size,
                mediaType: "",
                mimeType: file.mimetype,
                width: 0,
                height: 0,
                duration: 0,
                sourceUrl: "",
                s3Key: "",
                thumbnailUrl: "",
            };
            let width = uploadedFor === "STORY" ? 1080 : 640;
            let height = uploadedFor === "STORY" ? 1980 : 640;
            const cropSetting = {
                width,
                height,
                fit: sharp_1.default.fit.inside,
                withoutEnlargement: true,
            };
            let thumbnail = null;
            if (file.mimetype.startsWith("image/")) {
                Object.assign(fileObject, { mediaType: media_model_1.MediaType.IMAGE });
                const s3Object = yield s3Service.getS3Object(file.key);
                const rawBuffer = yield ((_a = s3Object.Body) === null || _a === void 0 ? void 0 : _a.transformToByteArray());
                if (!rawBuffer)
                    throw new Error("Could not read image buffer from S3");
                const sharpImage = (0, sharp_1.default)(rawBuffer);
                const metadata = yield sharpImage.metadata();
                if (metadata)
                    Object.assign(fileObject, {
                        width: metadata.width,
                        height: metadata.height,
                    });
                thumbnail = yield sharpImage.resize(cropSetting).toBuffer();
            }
            if (file.mimetype.startsWith("video/")) {
                Object.assign(fileObject, { mediaType: media_model_1.MediaType.VIDEO });
                // Extract metadata from S3 video
                const metadata = yield (0, file_uploading_1.readVideoMetadata)(file.key);
                if (metadata) {
                    Object.assign(fileObject, {
                        width: metadata.width,
                        height: metadata.height,
                        duration: metadata.duration,
                    });
                }
                const generatedThumbnailPath = yield (0, file_uploading_2.generateScreenshot)(file.key, file.filename, "jpeg");
                if (generatedThumbnailPath) {
                    const sharpImage = (0, sharp_1.default)(generatedThumbnailPath);
                    thumbnail = yield sharpImage.resize(cropSetting).toBuffer();
                    yield promises_1.default.unlink(generatedThumbnailPath).catch(() => { });
                }
                yield fileProcessing_model_1.default.create({
                    filePath: null,
                    s3Key: file.key,
                });
            }
            if (file.mimetype === "application/pdf") {
                Object.assign(fileObject, {
                    mediaType: media_model_1.MediaType.PDF,
                    thumbnailUrl: "https://png.pngtree.com/png-vector/20220606/ourmid/pngtree-pdf-file-icon-png-png-image_4899509.png",
                });
            }
            Object.assign(fileObject, {
                sourceUrl: file.location,
                s3Key: file.key,
            });
            if (thumbnail) {
                let thumbnailPath = (0, basic_1.addStringBeforeExtension)(file.key, `-${width}x${height}`);
                thumbnailPath = thumbnailPath.replace(/\/{2,}/g, "/");
                const uploadedThumbnailFile = yield s3Service.putS3Object(thumbnail, file.mimetype.startsWith("video/") ? "image/jpeg" : file.mimetype, thumbnailPath);
                if (uploadedThumbnailFile) {
                    // @ts-ignore
                    fileObject.thumbnailUrl = uploadedThumbnailFile.Location;
                }
            }
            if (!fileObject.thumbnailUrl || fileObject.thumbnailUrl.trim() === "") {
                fileObject.thumbnailUrl =
                    "https://thehotelmedia.com/public/files/thm-logo.png";
            }
            // ✅ Push only once per file
            fileList.push(fileObject);
        })));
        // ✅ Insert all media at once
        return yield media_model_1.default.create(fileList);
    });
}
exports.storeMedia = storeMedia;
function deleteUnwantedFiles(files) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                // await fileSystem.unlink(file.path)
            })));
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.deleteUnwantedFiles = deleteUnwantedFiles;
const storeViews = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { postID, mediaID } = request.body;
        const [post, isViewed, media] = yield Promise.all([
            post_model_1.default.findOne({ _id: postID, media: { $in: [new mongodb_1.ObjectId(mediaID)] } }),
            view_model_1.default.findOne({ postID: postID, mediaID: mediaID, userID: id }),
            media_model_1.default.findOne({ _id: mediaID })
        ]);
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Post media not found."), "Post media found."));
        }
        if (!media || media && media.mediaType !== media_model_1.MediaType.VIDEO) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Post media not found."), "Post media found."));
        }
        if (!isViewed) {
            const newView = new view_model_1.default();
            newView.userID = id;
            newView.postID = postID;
            newView.mediaID = mediaID;
            newView.businessProfileID = businessProfileID !== null && businessProfileID !== void 0 ? businessProfileID : null;
            const savedView = yield newView.save();
            return response.send((0, response_1.httpCreated)(savedView, "View saved successfully"));
        }
        return response.send((0, response_1.httpNoContent)(isViewed, 'View saved successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { storeViews };
