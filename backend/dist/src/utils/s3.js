"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentFromS3 = exports.uploadDocumentToS3 = exports.getS3Bucket = exports.isS3Configured = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
let s3Client = null;
const getRequiredEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};
const isS3Configured = () => {
    return Boolean(process.env.AWS_REGION &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_S3_BUCKET);
};
exports.isS3Configured = isS3Configured;
const getS3Bucket = () => getRequiredEnv('AWS_S3_BUCKET');
exports.getS3Bucket = getS3Bucket;
const getS3Client = () => {
    if (!s3Client) {
        s3Client = new client_s3_1.S3Client({
            region: getRequiredEnv('AWS_REGION'),
            credentials: {
                accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
                secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY')
            }
        });
    }
    return s3Client;
};
const sanitizeFileName = (fileName) => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};
const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
};
const uploadDocumentToS3 = async (params) => {
    if (!(0, exports.isS3Configured)()) {
        throw new Error('AWS S3 is not configured. Please set AWS credentials in .env');
    }
    const bucket = (0, exports.getS3Bucket)();
    const safeName = sanitizeFileName(params.fileName || 'document');
    const key = `${params.folder}/${Date.now()}-${safeName}`;
    await getS3Client().send(new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: params.body,
        ContentType: params.contentType || 'application/octet-stream'
    }));
    return { key, bucket };
};
exports.uploadDocumentToS3 = uploadDocumentToS3;
const getDocumentFromS3 = async (key) => {
    if (!(0, exports.isS3Configured)()) {
        throw new Error('AWS S3 is not configured. Please set AWS credentials in .env');
    }
    const response = await getS3Client().send(new client_s3_1.GetObjectCommand({
        Bucket: (0, exports.getS3Bucket)(),
        Key: key
    }));
    if (!response.Body) {
        throw new Error('Document body is empty');
    }
    const readable = response.Body;
    const buffer = await streamToBuffer(readable);
    return {
        buffer,
        contentType: response.ContentType || 'application/octet-stream',
        ...(typeof response.ContentLength === 'number' ? { contentLength: response.ContentLength } : {})
    };
};
exports.getDocumentFromS3 = getDocumentFromS3;
//# sourceMappingURL=s3.js.map