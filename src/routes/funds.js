const express = require('express');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

router.get('/investments/schemes', async (req, res, next) => {
  try {
    const query = String(req.query.query || '').trim();
    if (query.length < 2) return res.json([]);
    if (query.length > 80) return res.status(400).json({ message: 'Search text is too long' });

    const response = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) return res.status(502).json({ message: 'Mutual-fund search provider is unavailable' });

    const payload = await response.json();
    const schemes = Array.isArray(payload)
      ? payload
          .filter(item => item?.schemeCode && item?.schemeName)
          .slice(0, 25)
          .map(item => ({ schemeCode: item.schemeCode, schemeName: item.schemeName }))
      : [];

    res.json(schemes);
  } catch (error) {
    if (error.name === 'TimeoutError') return res.status(504).json({ message: 'Mutual-fund search timed out' });
    next(error);
  }
});

module.exports = router;
