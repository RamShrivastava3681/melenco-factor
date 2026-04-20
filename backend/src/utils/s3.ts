import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

let s3Client: S3Client | null = null;

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const isS3Configured = (): boolean => {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
  );
};

export const getS3Bucket = (): string => getRequiredEnv('AWS_S3_BUCKET');

const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: getRequiredEnv('AWS_REGION'),
      credentials: {
        accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
        secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY')
      }
    });
  }

  return s3Client;
};

const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const uploadDocumentToS3 = async (params: {
  folder: string;
  fileName: string;
  contentType: string;
  body: Buffer;
}): Promise<{ key: string; bucket: string }> => {
  if (!isS3Configured()) {
    throw new Error('AWS S3 is not configured. Please set AWS credentials in .env');
  }

  const bucket = getS3Bucket();
  const safeName = sanitizeFileName(params.fileName || 'document');
  const key = `${params.folder}/${Date.now()}-${safeName}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType || 'application/octet-stream'
    })
  );

  return { key, bucket };
};

export const getDocumentFromS3 = async (
  key: string
): Promise<{ buffer: Buffer; contentType: string; contentLength?: number }> => {
  if (!isS3Configured()) {
    throw new Error('AWS S3 is not configured. Please set AWS credentials in .env');
  }

  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: key
    })
  );

  if (!response.Body) {
    throw new Error('Document body is empty');
  }

  const readable = response.Body as Readable;
  const buffer = await streamToBuffer(readable);

  return {
    buffer,
    contentType: response.ContentType || 'application/octet-stream',
    ...(typeof response.ContentLength === 'number' ? { contentLength: response.ContentLength } : {})
  };
};
