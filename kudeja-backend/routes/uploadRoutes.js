const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

// Dedicated uploads folder inside backend
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to build fully qualified public URL
function getPublicUrl(req, filename) {
  const customBackendUrl = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '');
  if (customBackendUrl) {
    return `${customBackendUrl}/uploads/${filename}`;
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const cleanPrefix = (file.fieldname || 'img').replace(/[^a-zA-Z0-9]/g, '');
    cb(null, `${cleanPrefix}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF, etc.) are allowed'));
    }
  },
});

// Middleware supporting multiple common field names ('image', 'file', 'receipt', 'photo')
const multiFieldUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'receipt', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

/**
 * @route   POST /api/upload
 * @desc    Upload an image (product, ad, or payment receipt)
 * @access  Private (Authenticated users / Admins)
 */
router.post('/', protect, (req, res) => {
  multiFieldUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }

    const file =
      req.files?.image?.[0] ||
      req.files?.file?.[0] ||
      req.files?.receipt?.[0] ||
      req.files?.photo?.[0] ||
      req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const publicUrl = getPublicUrl(req, file.filename);
    const relativeUrl = `/uploads/${file.filename}`;

    return res.json({
      success: true,
      url: publicUrl,
      relativeUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    });
  });
});

/**
 * @route   POST /api/upload/base64
 * @desc    Save base64 data URL as a file and return public URL
 * @access  Private
 */
router.post('/base64', protect, async (req, res) => {
  try {
    const { dataUrl, filename: preferredName } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'dataUrl string is required' });
    }

    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid data URL format' });
    }

    const rawExt = match[1] === 'jpeg' ? 'jpg' : match[1];
    const ext = `.${rawExt.replace(/[^a-zA-Z0-9]/g, '')}`;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = preferredName
      ? `${preferredName.replace(/[^a-zA-Z0-9_-]/g, '')}-${uniqueSuffix}${ext}`
      : `base64-${uniqueSuffix}${ext}`;

    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = getPublicUrl(req, filename);
    return res.json({
      success: true,
      url: publicUrl,
      relativeUrl: `/uploads/${filename}`,
      filename,
      size: buffer.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process base64 image', error: error.message });
  }
});

module.exports = {
  router,
  upload,
  uploadsDir,
  getPublicUrl,
};
