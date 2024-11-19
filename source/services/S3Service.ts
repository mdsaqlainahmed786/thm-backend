
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
}

export default S3Service;