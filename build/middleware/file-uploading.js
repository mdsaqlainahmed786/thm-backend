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
exports.generateScreenshot = exports.readVideoMetadata = exports.diskUpload = exports.DiskStorage = exports.s3Upload = exports.PUBLIC_DIR = void 0;
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importStar(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = require("os");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const constants_1 = require("../config/constants");
const uuid_1 = require("uuid");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const ffprobe_1 = __importDefault(require("ffprobe"));
const ffprobe_static_1 = __importDefault(require("ffprobe-static"));
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
fluent_ffmpeg_1.default.setFfprobePath(ffmpeg_1.default.path);
exports.PUBLIC_DIR = `public/files`;
const S3Service_1 = __importDefault(require("../services/S3Service"));
const s3Service = new S3Service_1.default();
function sanitizeImage(request, file, cb) {
    const fileExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".mp4", ".pdf", ".doc", ".docx", ".mov"];
    const fileExtension = path_1.default.extname(file.originalname.toLowerCase());
    const isAllowedExt = fileExts.includes(fileExtension);
    const isAllowedImageMimeType = file.mimetype.startsWith("image/");
    const isAllowedVideoMimeType = file.mimetype.startsWith("video/");
    const isAllowedDocumentMimeType = file.mimetype.startsWith("application/");
    // Log file details for debugging
    console.log("File validation:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extension: fileExtension,
        isAllowedExt,
        isAllowedImageMimeType,
        isAllowedVideoMimeType,
        isAllowedDocumentMimeType
    });
    if ((isAllowedExt && isAllowedImageMimeType) ||
        (isAllowedExt && isAllowedVideoMimeType) ||
        (isAllowedExt && isAllowedDocumentMimeType)) {
        return cb(null, true);
    }
    else {
        const error = new Error(`File type not allowed. Allowed types: ${fileExts.join(', ')}. Received: ${fileExtension} (${file.mimetype})`);
        error.status = 400;
        console.error("File validation failed:", error.message);
        cb(error, false);
    }
}
/**
 *
 * @param endPoint Endpoint is s3 endpoint where image will present after upload.
 * @returns
 */
const s3Upload = (endPoint) => (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3Service.getClient(),
        bucket: constants_1.AppConfig.AWS_BUCKET_NAME,
        acl: "public-read", // Storage Access Type
        contentType: (req, file, cb) => {
            cb(null, file.mimetype);
        },
        metadata: (request, file, cb) => {
            cb(null, { fieldname: file.fieldname });
        },
        key: (request, file, cb) => {
            var _a, _b;
            // Clean and safe endpoint
            const cleanEndpoint = endPoint.replace(/\/+$/, '').replace(/^\/+/, '');
            const extension = path_1.default.extname(file.originalname);
            const uniqueName = `${Date.now()}-${(0, uuid_1.v4)()}${extension}`;
            switch (endPoint) {
                case constants_1.AwsS3AccessEndpoints.USERS:
                    const userID = (_b = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 'anonymous';
                    cb(null, `${cleanEndpoint}/${file.fieldname}/${(0, uuid_1.v4)()}-${userID}${extension}`);
                    break;
                case constants_1.AwsS3AccessEndpoints.BUSINESS_DOCUMENTS:
                    cb(null, `${cleanEndpoint}/${file.fieldname}/${(0, uuid_1.v4)()}${extension}`);
                    break;
                default:
                    cb(null, `${cleanEndpoint}/${uniqueName}`);
                    break;
            }
            console.log("🧾 Final S3 Key =>", `${cleanEndpoint}/${uniqueName}`);
        }
    }),
    fileFilter: (request, file, callback) => {
        //@ts-ignore
        sanitizeImage(request, file, callback);
    },
    limits: {
        fileSize: 1024 * 1024 * 500 //0.5GB
    }
});
exports.s3Upload = s3Upload;
exports.DiskStorage = multer_1.default.diskStorage({
    destination: function (request, file, callback) {
        callback(null, (0, path_1.normalize)(exports.PUBLIC_DIR));
    },
    filename: function (request, file, callback) {
        callback(null, `${(0, uuid_1.v4)()}-${Date.now()}` + path_1.default.extname(file.originalname));
    }
});
exports.diskUpload = (0, multer_1.default)({ storage: exports.DiskStorage });
const readVideoMetadata = (filePathOrKey) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let localPath = filePathOrKey;
    try {
        // ✅ If the provided path does not exist locally, assume it's an S3 Key
        if (!fs_1.default.existsSync(filePathOrKey)) {
            console.log("Downloading video temporarily from S3 to read metadata...");
            const tmpFilePath = path_1.default.join((0, os_1.tmpdir)(), `${Date.now()}-video.mp4`);
            // Ensure we pass a valid S3 key
            if (!filePathOrKey || typeof filePathOrKey !== "string") {
                throw new Error("Invalid S3 key passed to readVideoMetadata");
            }
            const s3Object = yield s3Service.getS3Object(filePathOrKey);
            if (!s3Object || !s3Object.Body) {
                throw new Error("S3 object not found or empty body");
            }
            const buffer = yield s3Object.Body.transformToByteArray();
            //@ts-ignore
            yield promises_1.default.writeFile(tmpFilePath, Buffer.from(buffer));
            localPath = tmpFilePath;
        }
        // ✅ Probe the local file (temporary or real)
        const metadata = yield new Promise((resolve, reject) => {
            (0, ffprobe_1.default)(localPath, { path: ffprobe_static_1.default.path }, (err, metadata) => {
                if (err)
                    reject(err);
                else
                    resolve(metadata);
            });
        });
        const videoStream = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.streams) === null || _a === void 0 ? void 0 : _a.find((s) => s.codec_type === "video");
        return videoStream || null;
    }
    catch (error) {
        console.error("Failed to read video metadata :::", error);
        return null;
    }
    finally {
        // ✅ Clean up temporary file
        if (localPath.startsWith((0, os_1.tmpdir)()) && fs_1.default.existsSync(localPath)) {
            yield promises_1.default.unlink(localPath).catch(() => { });
        }
    }
});
exports.readVideoMetadata = readVideoMetadata;
function generateScreenshot(s3Key, fileName, thumbnailExtName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // ✅ Create a temporary local path
            const tmpVideoPath = path_1.default.join((0, os_1.tmpdir)(), `${Date.now()}-video.mp4`);
            const tmpThumbPath = path_1.default.join((0, os_1.tmpdir)(), `${Date.now()}-thumbnail.${thumbnailExtName}`);
            // ✅ Download the video temporarily from S3
            const s3Object = yield s3Service.getS3Object(s3Key);
            if (!s3Object || !s3Object.Body)
                throw new Error("S3 video object not found");
            const buffer = yield s3Object.Body.transformToByteArray();
            //@ts-ignore
            yield promises_1.default.writeFile(tmpVideoPath, Buffer.from(buffer));
            // ✅ Generate a thumbnail image locally
            yield new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(tmpVideoPath)
                    .on("end", resolve)
                    .on("error", reject)
                    .screenshots({
                    count: 1,
                    timemarks: ["00:00:00.002"],
                    filename: path_1.default.basename(tmpThumbPath),
                    folder: path_1.default.dirname(tmpThumbPath),
                });
            });
            // ✅ Return the local thumbnail path
            return tmpThumbPath;
        }
        catch (error) {
            console.error("Failed to generate video thumbnail :::", error);
            return null;
        }
    });
}
exports.generateScreenshot = generateScreenshot;
