const axios = require('axios');

const rateCache = new Map(); // { baseCurrency: { rates: {}, fetchedAt: Date } }
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const getRates = async (base = 'USD') => {
  const cached = rateCache.get(base);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }
  try {
    const { data } = await axios.get(`${process.env.EXCHANGE_RATE_BASE_URL}/${base}`);
    const rates = data.rates;
    rateCache.set(base, { rates, fetchedAt: Date.now() });
    return rates;
  } catch {
    // Return 1:1 if rate fetch fails
    return { [base]: 1 };
  }
};

const convertCurrency = async (amount, from, to) => {
  if (from === to) return amount;
  const rates = await getRates(from);
  const rate = rates[to];
  if (!rate) return amount; // fallback: no conversion
  return parseFloat((amount * rate).toFixed(2));
};

module.exports = { getRates, convertCurrency };
