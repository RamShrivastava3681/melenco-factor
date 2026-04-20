import express from 'express';
import { getDocumentFromS3 } from '../utils/s3';

const router = express.Router();

router.get('/download', async (req, res) => {
  try {
    const key = String(req.query.key || '').trim();
    const fileName = String(req.query.fileName || '').trim();

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Document key is required'
      });
    }

    const { buffer, contentType } = await getDocumentFromS3(key);
    const fallbackName = key.split('/').pop() || 'document';
    const downloadName = fileName || fallbackName;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document from S3'
    });
  }
});

export default router;
