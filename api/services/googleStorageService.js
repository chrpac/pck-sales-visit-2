const { Storage } = require('@google-cloud/storage');
const logger = require('../config/logger');

class GoogleStorageService {
  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      // keyFilename: 'path/to/service-account-key.json', // Optional: if not using environment auth
    });
    this.bucket = this.storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
  }

  // Upload file to Google Cloud Storage
  async uploadFile(file, fileName, options = {}) {
    try {
      const fileUpload = this.bucket.file(fileName);
      
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: options.contentType || 'application/octet-stream',
          ...options.metadata
        },
        public: options.public || false,
        validation: 'md5'
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          logger.error('Google Storage upload error:', error);
          reject(new Error(`Failed to upload file: ${error.message}`));
        });

        stream.on('finish', async () => {
          try {
            let publicUrl = null;
            if (options.public) {
              await fileUpload.makePublic();
              publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
            }

            logger.info(`File uploaded successfully to Google Storage: ${fileName}`);
            resolve({
              success: true,
              fileName,
              publicUrl,
              bucket: this.bucket.name
            });
          } catch (error) {
            reject(error);
          }
        });

        stream.end(file);
      });
    } catch (error) {
      logger.error('Google Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Download file from Google Cloud Storage
  async downloadFile(fileName) {
    try {
      const file = this.bucket.file(fileName);
      const [contents] = await file.download();
      
      logger.info(`File downloaded successfully from Google Storage: ${fileName}`);
      return contents;
    } catch (error) {
      logger.error('Google Storage download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  // Delete file from Google Cloud Storage
  async deleteFile(fileName) {
    try {
      await this.bucket.file(fileName).delete();
      logger.info(`File deleted successfully from Google Storage: ${fileName}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Google Storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Generate signed URL for direct access
  async generateSignedUrl(fileName, action = 'read', expires = Date.now() + 15 * 60 * 1000) {
    try {
      const options = {
        version: 'v4',
        action,
        expires
      };

      const [url] = await this.bucket.file(fileName).getSignedUrl(options);
      logger.info(`Signed URL generated for file: ${fileName}`);
      
      return url;
    } catch (error) {
      logger.error('Google Storage signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // List files in bucket
  async listFiles(prefix = '', maxResults = 1000) {
    try {
      const options = {
        prefix,
        maxResults
      };

      const [files] = await this.bucket.getFiles(options);
      logger.info(`Listed ${files.length} files from Google Storage`);
      
      return files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        updated: file.metadata.updated,
        contentType: file.metadata.contentType
      }));
    } catch (error) {
      logger.error('Google Storage list files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}

module.exports = new GoogleStorageService();
