import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

type Provider = 'LOCAL' | 'S3';

export interface StorageConfig {
  provider: Provider;
  bucket?: string | null;
  region?: string | null;
  pathPrefix?: string | null;
}

export interface UploadParams {
  retailerId?: string;
  buffer: Buffer;
  filename?: string;
  contentType?: string;
  prefix?: string;
}

export interface UploadResult {
  key: string;
  provider: Provider;
  location: string;
}

const defaultConfig: StorageConfig = {
  provider: env.STORAGE_PROVIDER,
  bucket: env.S3_BUCKET ?? null,
  region: env.S3_REGION ?? null,
  pathPrefix: null
};

const localRoot = env.LOCAL_STORAGE_PATH
  ? path.resolve(process.cwd(), env.LOCAL_STORAGE_PATH)
  : path.resolve(process.cwd(), '../../storage');

const s3Clients = new Map<string, S3Client>();

const getS3Client = (config: StorageConfig) => {
  const region = config.region ?? env.S3_REGION;
  if (!region) {
    throw new Error('Missing S3 region configuration');
  }

  const cacheKey = region;
  if (!s3Clients.has(cacheKey)) {
    if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error('S3 credentials are not configured');
    }

    s3Clients.set(
      cacheKey,
      new S3Client({
        region,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY
        }
      })
    );
  }

  return s3Clients.get(cacheKey)!;
};

const ensureLocalDir = async (dir: string) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const resolveConfig = async (retailerId?: string): Promise<StorageConfig> => {
  if (!retailerId) return defaultConfig;

  const settings = await (prisma as any).retailerSettings.findUnique({
    where: { retailerId }
  });

  if (!settings) {
    return defaultConfig;
  }

  return {
    provider: settings.storageProvider,
    bucket: settings.storageBucket,
    region: settings.storageRegion,
    pathPrefix: settings.storagePathPrefix
  };
};

const buildKey = (params: UploadParams) => {
  const base = params.filename ?? `${randomUUID()}`;
  return params.prefix ? `${params.prefix}/${base}` : base;
};

export const uploadObject = async (params: UploadParams): Promise<UploadResult> => {
  const config = await resolveConfig(params.retailerId);
  const key = buildKey(params);

  if (config.provider === 'S3') {
    if (!config.bucket && !defaultConfig.bucket) {
      throw new Error('S3 bucket missing in storage configuration');
    }

    const bucket = config.bucket ?? defaultConfig.bucket!;
    const client = getS3Client(config);

    const objectKey = config.pathPrefix ? `${config.pathPrefix}/${key}` : key;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: params.buffer,
        ContentType: params.contentType
      })
    );

    const location = `s3://${bucket}/${objectKey}`;

    return {
      key: objectKey,
      provider: 'S3',
      location
    };
  }

  const retailerPrefix = params.retailerId ? path.join('retailers', params.retailerId) : '';
  const relativePath = path.join(retailerPrefix, key);
  const destination = path.join(localRoot, relativePath);

  await ensureLocalDir(path.dirname(destination));
  await fs.promises.writeFile(destination, params.buffer);

  return {
    key: relativePath,
    provider: 'LOCAL',
    location: destination
  };
};

export const deleteObject = async (key: string, retailerId?: string) => {
  const config = await resolveConfig(retailerId);

  if (config.provider === 'S3') {
    if (!config.bucket && !defaultConfig.bucket) {
      throw new Error('S3 bucket missing in storage configuration');
    }

    const bucket = config.bucket ?? defaultConfig.bucket!;
    const client = getS3Client(config);

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: config.pathPrefix ? `${config.pathPrefix}/${key}` : key
      })
    );
    return;
  }

  const destination = path.join(localRoot, key);
  await fs.promises.rm(destination, { force: true });
};

export const resolveObjectUrl = (key: string, config: StorageConfig = defaultConfig) => {
  if (config.provider === 'S3' && config.bucket && config.region) {
    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }

  return `/storage/${key}`;
};
