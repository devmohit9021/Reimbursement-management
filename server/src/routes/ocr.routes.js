const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { processReceipt } = require('../utils/ocr.util');
const path = require('path');
const fs = require('fs');

router.post('/extract', authenticate, upload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const filePath = req.file.path;
  const result = await processReceipt(filePath);

  // Clean up uploaded file after OCR
  try { fs.unlinkSync(filePath); } catch (_) {}

  res.json(result);
});

module.exports = router;
