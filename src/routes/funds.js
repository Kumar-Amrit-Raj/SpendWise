const express = require('express');
const { requireAuth } = require('../auth');
const { Investment } = require('../models');

const router = express.Router();
router.use(requireAuth);

function toIsoFromMfDate(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(value || ''));
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

async function fetchHistoricalNav(schemeCode, investmentDate) {
  const start = new Date(`${investmentDate}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const endDate = end.toISOString().slice(0, 10);

  const response = await fetch(
    `https://api.mfapi.in/mf/${schemeCode}?startDate=${investmentDate}&endDate=${endDate}`,
    { signal: AbortSignal.timeout(7000) }
  );

  if (!response.ok) throw new Error('HISTORICAL_NAV_UNAVAILABLE');
  const payload = await response.json();
  const rows = Array.isArray(payload.data) ? payload.data : [];

  const candidates = rows
    .map(row => ({ ...row, isoDate: toIsoFromMfDate(row.date), navNumber: Number(row.nav) }))
    .filter(row => row.isoDate && row.isoDate >= investmentDate && Number.isFinite(row.navNumber) && row.navNumber > 0)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  const row = candidates[0];
  if (!row) throw new Error('HISTORICAL_NAV_NOT_FOUND');

  return {
    schemeName: payload.meta?.scheme_name || '',
    nav: row.navNumber,
    navDate: row.isoDate
  };
}

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

router.post('/investments', async (req, res, next) => {
  try {
    const schemeCode = String(req.body.schemeCode || '').trim();
    const investedAmount = Number(req.body.investedAmount);
    const investmentDate = String(req.body.investmentDate || '').trim();
    const today = new Date().toISOString().slice(0, 10);

    if (!/^\d+$/.test(schemeCode)) return res.status(400).json({ message: 'Select a valid mutual fund scheme' });
    if (!Number.isFinite(investedAmount) || investedAmount <= 0) return res.status(400).json({ message: 'Enter a valid invested amount' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(investmentDate) || investmentDate > today) {
      return res.status(400).json({ message: 'Enter a valid investment date that is not in the future' });
    }

    let purchase;
    try {
      purchase = await fetchHistoricalNav(schemeCode, investmentDate);
    } catch (error) {
      if (error.name === 'TimeoutError') return res.status(504).json({ message: 'Historical NAV lookup timed out' });
      if (error.message === 'HISTORICAL_NAV_UNAVAILABLE') return res.status(502).json({ message: 'Historical NAV provider is unavailable' });
      if (error.message === 'HISTORICAL_NAV_NOT_FOUND') return res.status(404).json({ message: 'No NAV was found near that investment date' });
      throw error;
    }

    const units = investedAmount / purchase.nav;
    const item = await Investment.create({
      user: req.userId,
      name: purchase.schemeName || String(req.body.name || 'Mutual fund').trim(),
      schemeCode,
      investedAmount,
      investmentDate: new Date(`${investmentDate}T00:00:00.000Z`),
      purchaseNav: purchase.nav,
      purchaseNavDate: new Date(`${purchase.navDate}T00:00:00.000Z`),
      units
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
