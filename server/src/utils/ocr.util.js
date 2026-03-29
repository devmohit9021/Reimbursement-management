const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const preprocessImage = async (inputPath) => {
  const outputPath = inputPath.replace(/(\.\w+)$/, '_processed$1');
  await sharp(inputPath)
    .grayscale()
    .normalize()
    .sharpen()
    .toFile(outputPath);
  return outputPath;
};

const extractTextFromImage = async (imagePath) => {
  const processedPath = await preprocessImage(imagePath);
  const { data: { text } } = await Tesseract.recognize(processedPath, 'eng', {
    logger: () => {},
  });
  // Clean up processed file
  try { fs.unlinkSync(processedPath); } catch (_) {}
  return text;
};

const parseReceiptText = (text) => {
  // Amount: look for currency patterns
  const amountMatch = text.match(/(?:total|amount|due|subtotal)[:\s]*[\$£€₹]?\s*([\d,]+\.?\d{0,2})/i)
    || text.match(/[\$£€₹]\s*([\d,]+\.?\d{2})/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

  // Date: various formats
  const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
  let date = null;
  if (dateMatch) {
    const parsed = new Date(dateMatch[1]);
    if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
  }

  // Merchant: first non-empty line often has the store name
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const merchant = lines[0] || null;

  return { amount, date, merchant, rawText: text };
};

const processReceipt = async (filePath) => {
  try {
    const text = await extractTextFromImage(filePath);
    return parseReceiptText(text);
  } catch (err) {
    console.error('OCR error:', err.message);
    return { amount: null, date: null, merchant: null, rawText: '' };
  }
};

module.exports = { processReceipt };
