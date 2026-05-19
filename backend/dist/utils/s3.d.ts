export declare const isS3Configured: () => boolean;
export declare const getS3Bucket: () => string;
export declare const uploadDocumentToS3: (params: {
    folder: string;
    fileName: string;
    contentType: string;
    body: Buffer;
}) => Promise<{
    key: string;
    bucket: string;
}>;
export declare const getDocumentFromS3: (key: string) => Promise<{
    buffer: Buffer;
    contentType: string;
    contentLength?: number;
}>;
//# sourceMappingURL=s3.d.ts.map