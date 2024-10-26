import https from "http";
import ExpressApp from "./app";
import { AppConfig } from "./config/constants";
import { DBOptimization } from "./cron/DbOptimizationCron";
import { s3Client } from "./middleware/file-uploading";
import { ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
const listBuckets = async () => {
    try {
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);

        if (response.Buckets) {
            console.log(response.Buckets);
            response.Buckets.forEach(bucket => {
                // Construct the bucket endpoint URL
                // https://the-hotel-media-bucket.s3.ap-south-1.amazonaws.com/dev-posts/5ad0966e-7353-460f-ad88-4fe7b1332a84.jpg
                const bucketEndpoint = `https://${bucket.Name}.s3.${AppConfig.AWS_REGION}.amazonaws.com`;
                console.log(`Bucket Name: ${bucket.Name}, Endpoint: ${bucketEndpoint}`);
            });
        } else {
            console.log('No buckets found.');
        }

        const command2 = new ListObjectsV2Command({ Bucket: AppConfig.AWS_BUCKET_NAME });
        const responsed = await s3Client.send(command2);
        console.log(responsed)


    } catch (error) {
        console.error('Error listing buckets:', error);
    }
};
const httpServer = https.createServer(ExpressApp);
httpServer.listen(AppConfig.PORT, () => {
    //Basic Details for server
    // listBuckets();
    console.log(`The server is running\tPORT: ${AppConfig.PORT}\tDATED: ${new Date()}`,);
    DBOptimization.start();
});
httpServer.timeout = 1200000;  // 2 Minutes