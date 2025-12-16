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
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const constants_1 = require("../config/constants");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    constructor() {
        this.bucketName = constants_1.AppConfig.AWS_BUCKET_NAME;
        this.accessKeyId = constants_1.AppConfig.AWS_ACCESS_KEY_ID;
        this.secretAccessKey = constants_1.AppConfig.AWS_SECRET_ACCESS_KEY;
        this.region = constants_1.AppConfig.AWS_REGION;
        this.s3Client = new client_s3_1.S3Client({
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey
            },
            region: this.region
        });
    }
    getClient() {
        return this.s3Client;
    }
    getS3Object(s3Key) {
        return __awaiter(this, void 0, void 0, function* () {
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
            });
            return yield this.s3Client.send(getCommand);
        });
    }
    deleteS3Object(s3Key) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key
            });
            return yield this.s3Client.send(deleteCommand);
        });
    }
    deleteS3Asset(assetLink) {
        return __awaiter(this, void 0, void 0, function* () {
            const s3Key = yield this.extractS3Key(assetLink);
            return yield this.deleteS3Object(s3Key);
        });
    }
    putS3Object(body, contentType, path) {
        return __awaiter(this, void 0, void 0, function* () {
            // ✅ Always sanitize path before sending to AWS
            path = path.replace(/\/{2,}/g, '/').replace(/^\/+/, ''); // remove leading slashes too
            const upload = new lib_storage_1.Upload({
                client: this.s3Client,
                params: {
                    Bucket: this.bucketName,
                    Key: path,
                    Body: body,
                    ContentType: contentType,
                    ACL: "public-read",
                },
            });
            return yield upload.done();
        });
    }
    generatePresignedUrl(s3Key) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a command for the object you want to access
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
            });
            // Generate the presigned URL, valid for 1 hour (3600 seconds)
            return yield (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command);
        });
    }
    extractS3Key(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let s3Key = '';
            // Check if the URL is in s3:// format
            if (url.startsWith('s3://')) {
                // Remove the s3:// prefix and extract everything after the bucket name
                s3Key = url.slice(5); // Remove 's3://' prefix
            }
            else if (url.startsWith('https://')) {
                // Use RegExp to extract the key after the bucket name
                const regex = /^https:\/\/([^/]+)\.s3\.[a-z0-9-]+\.amazonaws\.com\/(.*)$/;
                const match = url.match(regex);
                if (match) {
                    s3Key = match[2]; // The part after the bucket name
                    // Remove any query parameters or fragments (optional)
                    s3Key = s3Key.split('?')[0].split('#')[0]; // Remove any query or fragment
                }
                else {
                    throw new Error('Invalid S3 URL format.');
                }
            }
            else {
                throw new Error('Invalid URL format.');
            }
            return s3Key;
        });
    }
}
exports.default = S3Service;
