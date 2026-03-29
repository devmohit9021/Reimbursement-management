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
  // Parsing Line-by-Line is safer to prevent capturing accidental cross-line digits
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let amount = null;
  // Amount: find the last occurrence of total/payable on a single line
  for (const line of lines) {
    const m = line.match(/(?:total|amount|due|payable|amount payable)[^\d\n]*([\d,]+(?:\.\d{1,2})?)/i);
    if (m) {
      amount = parseFloat(m[1].replace(/,/g, ''));
    }
  }
  // Fallback to standalone currency patterns
  if (!amount) {
    const fallbackMatch = text.match(/[\$£€₹]\s*([\d,]+(?:\.\d{1,2})?)/);
    if (fallbackMatch) amount = parseFloat(fallbackMatch[1].replace(/,/g, ''));
  }

  // Currency: Look for clear symbols
  let currency = 'USD';
  const lt = text.toLowerCase();
  if (text.includes('₹') || lt.includes('inr') || lt.includes('rs.') || lt.includes('rupees')) currency = 'INR';
  else if (text.includes('€') || lt.includes('eur ')) currency = 'EUR';
  else if (text.includes('£') || lt.includes('gbp ')) currency = 'GBP';
  else if (text.includes('¥') || lt.includes('jpy ')) currency = 'JPY';
  else if (lt.includes('aud ')) currency = 'AUD';
  else if (lt.includes('cad ')) currency = 'CAD';

  // Date: try Date explicit label first, then fallback
  let dateMatch = text.match(/date[^\d]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (!dateMatch) dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
  let date = null;
  if (dateMatch) {
    const parts = dateMatch[1].split(/[\/\-\.]/);
    if (parts.length === 3) {
      // Guess format: if parts[2] is length 4, it's year.
      let day = parts[0], month = parts[1], year = parts[2];
      // if year is in parts[0]
      if (parts[0].length === 4) { year = parts[0]; month = parts[1]; day = parts[2]; }
      if (year.length === 2) year = '20' + year;
      const parsed = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
    }
  }

  // Merchant: use the previously parsed lines
  const merchantLines = lines.filter(l => l.length > 2);
  const merchant = merchantLines[0] || null;

  // Category Inference
  let category = '';
  const lowerText = text.toLowerCase();
  if (lowerText.match(/restaurant|cafe|food|dining|lunch|dinner|breakfast|swiggy|zomato|pizza/)) category = 'Food & Dining';
  else if (lowerText.match(/flight|train|taxi|uber|cab|travel|airline|transit/)) category = 'Travel';
  else if (lowerText.match(/hotel|inn|airbnb|accommodation|motel/)) category = 'Accommodation';
  else if (lowerText.match(/amazon|flipkart|office|paper|stationery|staples/)) category = 'Office Supplies';
  else if (lowerText.match(/laptop|mouse|keyboard|monitor|equipment|hardware|apple|dell|lenovo/)) category = 'Equipment';
  else if (lowerText.match(/software|subscription|github|aws|cloud|hosting|figma|adobe/)) category = 'Software';
  else if (lowerText.match(/hospital|pharmacy|clinic|medical|health/)) category = 'Medical';
  else if (lowerText.match(/training|course|udemy|coursera|seminar/)) category = 'Training';
  else if (lowerText.match(/movie|entertainment|game|ticket/)) category = 'Entertainment';
  else category = 'Other';

  return { amount, currency, date, merchant, category, rawText: text };
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
