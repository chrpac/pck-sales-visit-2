const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../config/logger');

// Configure AWS SDK v3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

class S3Service {
  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET;
  }

  // Upload file to S3
  async uploadFile(file, key, options = {}) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: options.contentType || 'application/octet-stream',
        ACL: options.acl || 'private',
      };

      const command = new PutObjectCommand(params);
      const result = await s3.send(command);
      logger.info(`File uploaded successfully to S3: ${key}`);

      return { success: true, key, etag: result.ETag };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  // Download file from S3
  async downloadFile(key) {
    try {
      const params = { Bucket: this.bucket, Key: key };
      const command = new GetObjectCommand(params);
      const result = await s3.send(command);
      logger.info(`File downloaded successfully from S3: ${key}`);

      const streamToBuffer = (stream) => new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

      return await streamToBuffer(result.Body);
    } catch (error) {
      logger.error('S3 download error:', error);
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  // Get file stream and metadata for proxy streaming
  async getFileStream(key) {
    try {
      const params = { Bucket: this.bucket, Key: key };
      const command = new GetObjectCommand(params);
      const result = await s3.send(command);
      return {
        stream: result.Body,
        contentType: result.ContentType || 'application/octet-stream',
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
      };
    } catch (error) {
      logger.error('S3 get stream error:', error);
      throw new Error(`Failed to get file stream from S3: ${error.message}`);
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    try {
      const params = { Bucket: this.bucket, Key: key };
      const command = new DeleteObjectCommand(params);
      await s3.send(command);
      logger.info(`File deleted successfully from S3: ${key}`);
      
      return { success: true };
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  // Generate pre-signed URL for direct upload
  async generatePresignedUrl(key, expires = 3600, contentType = 'application/octet-stream', acl) {
    try {
      const putParams = {
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      };
      if (acl) {
        putParams.ACL = acl;
      }
      const command = new PutObjectCommand(putParams);
      const url = await getSignedUrl(s3, command, { expiresIn: expires });
      logger.info(`Pre-signed URL generated for key: ${key}`);
      return url;
    } catch (error) {
      logger.error('S3 pre-signed URL generation error:', error);
      throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
  }

  // List files in S3 bucket
  async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const params = { Bucket: this.bucket, Prefix: prefix, MaxKeys: maxKeys };
      const command = new ListObjectsV2Command(params);
      const result = await s3.send(command);
      logger.info(`Listed ${result.Contents.length} files from S3`);
      
      return result.Contents;
    } catch (error) {
      logger.error('S3 list files error:', error);
      throw new Error(`Failed to list files from S3: ${error.message}`);
    }
  }
}

module.exports = new S3Service();
