
import { S3Client, DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, DeleteObjectCommandOutput, CompleteMultipartUploadCommandOutput } from "@aws-sdk/client-s3";
import { AppConfig } from "../config/constants";
import { StreamingBlobPayloadInputTypes } from '@smithy/types';
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
class S3Service {
    private bucketName: string;
    private accessKeyId: string;
    private region: string;
    private secretAccessKey: string;
    private s3Client: S3Client;
    constructor() {
        this.bucketName = AppConfig.AWS_BUCKET_NAME;
        this.accessKeyId = AppConfig.AWS_ACCESS_KEY;
        this.secretAccessKey = AppConfig.AWS_SECRET_KEY;
        this.region = AppConfig.AWS_REGION;
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey
            },
            region: this.region
        })
    }
    getClient() {
        return this.s3Client;
    }
    async getS3Object(s3Key: string): Promise<GetObjectCommandOutput> {
        const getCommand = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
        });
        return await this.s3Client.send(getCommand);
    }
    async deleteS3Object(s3Key: string): Promise<DeleteObjectCommandOutput> {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key
        });
        return await this.s3Client.send(deleteCommand);
    }
    async deleteS3Asset(assetLink: string) {
        const s3Key = await this.extractS3Key(assetLink);
        return await this.deleteS3Object(s3Key);
    }
    async putS3Object(body: StreamingBlobPayloadInputTypes, contentType: string, path: string): Promise<CompleteMultipartUploadCommandOutput> {
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: this.bucketName,
                Key: path,
                Body: body,
                ContentType: contentType
            }
        });
        return await upload.done();
    }
    async generatePresignedUrl(s3Key: string) {
        // Create a command for the object you want to access
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
        });
        // Generate the presigned URL, valid for 1 hour (3600 seconds)
        return await getSignedUrl(this.s3Client, command);
    }
    private async extractS3Key(url: string) {
        let s3Key = '';
        // Check if the URL is in s3:// format
        if (url.startsWith('s3://')) {
            // Remove the s3:// prefix and extract everything after the bucket name
            s3Key = url.slice(5);  // Remove 's3://' prefix
        } else if (url.startsWith('https://')) {
            // Use RegExp to extract the key after the bucket name
            const regex = /^https:\/\/([^/]+)\.s3\.[a-z0-9-]+\.amazonaws\.com\/(.*)$/;
            const match = url.match(regex);
            if (match) {
                s3Key = match[2];  // The part after the bucket name
                // Remove any query parameters or fragments (optional)
                s3Key = s3Key.split('?')[0].split('#')[0];  // Remove any query or fragment
            } else {
                throw new Error('Invalid S3 URL format.');
            }
        } else {
            throw new Error('Invalid URL format.');
        }

        return s3Key;
    }
}

export default S3Service;