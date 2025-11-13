declare module '@aws-sdk/client-s3' {
  interface S3ClientConfig {
    region?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  }

  export class S3Client {
    constructor(config: S3ClientConfig);
    send<T>(command: T): Promise<unknown>;
  }

  export class PutObjectCommand {
    constructor(params: Record<string, unknown>);
  }

  export class DeleteObjectCommand {
    constructor(params: Record<string, unknown>);
  }
}
