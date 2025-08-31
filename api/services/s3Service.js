const AWS = require('aws-sdk');
const logger = require('../config/logger');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-1'
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
        ...options
      };

      const result = await s3.upload(params).promise();
      logger.info(`File uploaded successfully to S3: ${result.Location}`);
      
      return {
        success: true,
        location: result.Location,
        key: result.Key,
        etag: result.ETag
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  // Download file from S3
  async downloadFile(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      const result = await s3.getObject(params).promise();
      logger.info(`File downloaded successfully from S3: ${key}`);
      
      return result.Body;
    } catch (error) {
      logger.error('S3 download error:', error);
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();
      logger.info(`File deleted successfully from S3: ${key}`);
      
      return { success: true };
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  // Generate pre-signed URL for direct upload
  generatePresignedUrl(key, expires = 3600) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expires,
        ContentType: 'application/octet-stream'
      };

      const url = s3.getSignedUrl('putObject', params);
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
      const params = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await s3.listObjectsV2(params).promise();
      logger.info(`Listed ${result.Contents.length} files from S3`);
      
      return result.Contents;
    } catch (error) {
      logger.error('S3 list files error:', error);
      throw new Error(`Failed to list files from S3: ${error.message}`);
    }
  }
}

module.exports = new S3Service();
