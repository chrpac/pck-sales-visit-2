const logger = require('../config/logger');

// Generate pre-signed URL for client-side upload
const presign = async (req, res) => {
  try {
    const { type, filename, contentType, acl } = req.query;
    if (!type || !filename) {
      return res.status(400).json({ status: 'fail', message: 'type and filename are required' });
    }

    if (!process.env.AWS_S3_BUCKET) {
      return res.status(400).json({ status: 'fail', message: 'S3 is not configured' });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `${type}/${Date.now()}_${safeName}`;
    // Lazy load to avoid requiring aws-sdk if not used elsewhere
    const s3Service = require('../services/s3Service');
    const url = await s3Service.generatePresignedUrl(key, 900, contentType || 'application/octet-stream', acl || 'private');

    res.status(200).json({ status: 'success', data: { url, key, provider: 's3', contentType: contentType || 'application/octet-stream', acl: acl || 'private' } });
  } catch (error) {
    logger.error('Presign error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate upload URL' });
  }
};

module.exports = { presign };

// Proxy image fetch from private S3 via backend
module.exports.proxy = async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ status: 'fail', message: 'key is required' });
    const s3Service = require('../services/s3Service');
    const { stream, contentType, contentLength, lastModified, etag } = await s3Service.getFileStream(key);
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (lastModified) res.setHeader('Last-Modified', new Date(lastModified).toUTCString());
    if (etag) res.setHeader('ETag', etag);
    // Allow cross-origin embedding for images via proxy
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    stream.on('error', (e) => {
      logger.error('Stream error:', e);
      if (!res.headersSent) res.status(500).end('Stream error');
    });
    stream.pipe(res);
  } catch (error) {
    logger.error('Proxy image error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load file' });
  }
};
