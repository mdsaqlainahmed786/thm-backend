import { Express } from 'express'
import { Types } from 'mongoose';
import { UserWithRole } from '../../../common';

declare global {
    namespace Express {
        namespace Multer {
            /** Object containing file metadata and access information. */
            interface S3File extends File {
                bucket: string;
                key: string;
                acl: string;
                contentType: string;
                contentDisposition: null;
                contentEncoding: null;
                storageClass: string;
                serverSideEncryption: null;
                metadata: any;
                location: string;
                etag: string;
            }
        }
    }
}
declare module 'express-serve-static-core' {
    export interface Request {
        user?: UserWithRole;
    }
}