const express = require('express');
const mongoose = require('mongoose');
const { Transaction, Budget, RecurringRule, Investment } = require('../models');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

const cleanText = (value, fallback = '') => String(value ?? fallback).trim();
const money = (value) => Number(value);
const validMonth = (value) => /^\d{4}-\d{2}$/.test(String(value || ''));

function monthRange(month) {
  if (!validMonth(month)) return null;
  const [year, index] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(year, index - 1, 1)), end: new Date(Date.UTC(year, index, 1)) };
}

function advanceDate(date, frequency) {
  const next = new Date(date);
  if (frequency === 'weekly') next.setUTCDate(next.getUTCDate() + 7);
  if (frequency === 'monthly') next.setUTCMonth(next.getUTCMonth() + 1);
  if (frequency === 'yearly') next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}

async function materializeRecurring(userId) {
  const rules = await RecurringRule.find({ user: userId, active: true, nextRun: { $lte: new Date() } });
  for (const rule of rules) {
    let cursor = new Date(rule.nextRun);
    let guard = 0;
    while (cursor <= new Date() && guard < 60) {
      const occurrenceKey = cursor.toISOString().slice(0, 10);
      await Transaction.updateOne(
        { user: userId, recurringRule: rule._id, occurrenceKey },
        { $setOnInsert: { user: userId, title: rule.title, amount: rule.amount, type: rule.type, category: rule.category, date: cursor, note: rule.note, recurringRule: rule._id, occurrenceKey } },
        { upsert: true }
      );
      cursor = advanceDate(cursor, rule.frequency);
      guard += 1;
    }
    rule.nextRun = cursor;
    await rule.save();
  }
}

function transactionPayload(body) {
  const amount = money(body.amount);
  const type = cleanText(body.type);
  const title = cleanText(body.title);
  const category = cleanText(body.category);
  const date = new Date(body.date);
  if (!title || !category || !['income', 'expense'].includes(type) || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime())) return null;
  return { title, category, type, amount, date, note: cleanText(body.note) };
}

router.get('/transactions', async (req, res, next) => {
  try {
    await materializeRecurring(req.userId);
    const query = { user: req.userId };
    if (['income', 'expense'].includes(req.query.type)) query.type = req.query.type;
    if (req.query.category) query.category = req.query.category;
    if (req.query.month && monthRange(req.query.month)) {
      const range = monthRange(req.query.month);
      query.date = { $gte: range.start, $lt: range.end };
    }
    if (req.query.search) {
      const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ title: new RegExp(escaped, 'i') }, { category: new RegExp(escaped, 'i') }, { note: new RegExp(escaped, 'i') }];
    }
    const items = await Transaction.find(query).sort({ date: -1, createdAt: -1 }).limit(1000);
    res.json(items);
  } catch (error) { next(error); }
});

router.post('/transactions', async (req, res, next) => {
  try {
    const data = transactionPayload(req.body);
    if (!data) return res.status(400).json({ message: 'Provide a valid title, amount, type, category and date' });
    const item = await Transaction.create({ ...data, user: req.userId });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

router.patch('/transactions/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Transaction not found' });
    const data = transactionPayload(req.body);
    if (!data) return res.status(400).json({ message: 'Provide valid transaction details' });
    const item = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.userId }, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Transaction not found' });
    res.json(item);
  } catch (error) { next(error); }
});

router.delete('/transactions/:id', async (req, res, next) => {
  try {
    const item = mongoose.isValidObjectId(req.params.id) ? await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId }) : null;
    if (!item) return res.status(404).json({ message: 'Transaction not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/budgets', async (req, res, next) => {
  try {
    await materializeRecurring(req.userId);
    const month = validMonth(req.query.month) ? req.query.month : new Date().toISOString().slice(0, 7);
    const [budgets, expenses] = await Promise.all([
      Budget.find({ user: req.userId, month }).sort({ category: 1 }),
      Transaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), type: 'expense', date: { $gte: monthRange(month).start, $lt: monthRange(month).end } } },
        { $group: { _id: '$category', spent: { $sum: '$amount' } } }
      ])
    ]);
    const spent = Object.fromEntries(expenses.map(row => [row._id, row.spent]));
    res.json(budgets.map(item => ({ ...item.toObject(), spent: spent[item.category] || 0 })));
  } catch (error) { next(error); }
});

router.put('/budgets', async (req, res, next) => {
  try {
    const month = cleanText(req.body.month);
    const category = cleanText(req.body.category);
    const limit = money(req.body.limit);
    if (!validMonth(month) || !category || !Number.isFinite(limit) || limit < 0) return res.status(400).json({ message: 'Provide a valid month, category and budget limit' });
    const item = await Budget.findOneAndUpdate({ user: req.userId, month, category }, { $set: { limit } }, { upsert: true, new: true, runValidators: true });
    res.json(item);
  } catch (error) { next(error); }
});

router.delete('/budgets/:id', async (req, res, next) => {
  try {
    const item = mongoose.isValidObjectId(req.params.id) ? await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId }) : null;
    if (!item) return res.status(404).json({ message: 'Budget not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/recurring', async (req, res, next) => {
  try {
    await materializeRecurring(req.userId);
    res.json(await RecurringRule.find({ user: req.userId }).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post('/recurring', async (req, res, next) => {
  try {
    const title = cleanText(req.body.title);
    const category = cleanText(req.body.category);
    const type = cleanText(req.body.type);
    const amount = money(req.body.amount);
    const frequency = cleanText(req.body.frequency);
    const nextRun = new Date(req.body.nextRun);
    const valid = title && category && ['income', 'expense'].includes(type) && Number.isFinite(amount) && amount > 0
      && ['weekly', 'monthly', 'yearly'].includes(frequency) && !Number.isNaN(nextRun.getTime());
    if (!valid) return res.status(400).json({ message: 'Provide valid recurring transaction details' });
    const item = await RecurringRule.create({
      user: req.userId, title, category, type, amount, frequency, nextRun,
      note: cleanText(req.body.note), active: req.body.active !== false
    });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

router.patch('/recurring/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Recurring rule not found' });
    const current = await RecurringRule.findOne({ _id: req.params.id, user: req.userId });
    if (!current) return res.status(404).json({ message: 'Recurring rule not found' });
    const allowed = ['title', 'amount', 'type', 'category', 'frequency', 'nextRun', 'note', 'active'];
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body, key)) current[key] = req.body[key];
    await current.save();
    res.json(current);
  } catch (error) { next(error); }
});

router.delete('/recurring/:id', async (req, res, next) => {
  try {
    const item = mongoose.isValidObjectId(req.params.id) ? await RecurringRule.findOneAndDelete({ _id: req.params.id, user: req.userId }) : null;
    if (!item) return res.status(404).json({ message: 'Recurring rule not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/reports/monthly', async (req, res, next) => {
  try {
    await materializeRecurring(req.userId);
    const month = validMonth(req.query.month) ? req.query.month : new Date().toISOString().slice(0, 7);
    const range = monthRange(month);
    const rows = await Transaction.find({ user: req.userId, date: { $gte: range.start, $lt: range.end } }).select('amount type category');
    let income = 0, expenses = 0;
    const categories = {};
    rows.forEach(row => {
      if (row.type === 'income') income += row.amount;
      else { expenses += row.amount; categories[row.category] = (categories[row.category] || 0) + row.amount; }
    });
    const categoryBreakdown = Object.entries(categories).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
    res.json({ month, income, expenses, savings: income - expenses, categoryBreakdown, transactionCount: rows.length });
  } catch (error) { next(error); }
});

router.get('/investments', async (req, res, next) => {
  try { res.json(await Investment.find({ user: req.userId }).sort({ createdAt: -1 })); }
  catch (error) { next(error); }
});

router.post('/investments', async (req, res, next) => {
  try {
    const name = cleanText(req.body.name);
    if (!name) return res.status(400).json({ message: 'Investment name is required' });
    const item = await Investment.create({
      user: req.userId, name, schemeCode: cleanText(req.body.schemeCode), monthlySip: Math.max(0, money(req.body.monthlySip) || 0),
      investedAmount: Math.max(0, money(req.body.investedAmount) || 0), targetAmount: Math.max(0, money(req.body.targetAmount) || 0),
      targetDate: req.body.targetDate ? new Date(req.body.targetDate) : null, units: Math.max(0, money(req.body.units) || 0), notes: cleanText(req.body.notes)
    });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

router.patch('/investments/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'schemeCode', 'monthlySip', 'investedAmount', 'targetAmount', 'targetDate', 'units', 'notes'];
    const updates = Object.fromEntries(allowed.filter(key => Object.prototype.hasOwnProperty.call(req.body, key)).map(key => [key, req.body[key]]));
    const item = mongoose.isValidObjectId(req.params.id) ? await Investment.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates, { new: true, runValidators: true }) : null;
    if (!item) return res.status(404).json({ message: 'Investment not found' });
    res.json(item);
  } catch (error) { next(error); }
});

router.delete('/investments/:id', async (req, res, next) => {
  try {
    const item = mongoose.isValidObjectId(req.params.id) ? await Investment.findOneAndDelete({ _id: req.params.id, user: req.userId }) : null;
    if (!item) return res.status(404).json({ message: 'Investment not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/investments/nav/:schemeCode', async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.schemeCode)) return res.status(400).json({ message: 'Invalid scheme code' });
    const response = await fetch(`https://api.mfapi.in/mf/${req.params.schemeCode}/latest`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return res.status(502).json({ message: 'NAV provider is unavailable' });
    const payload = await response.json();
    const row = Array.isArray(payload.data) ? payload.data[0] : null;
    if (!row) return res.status(404).json({ message: 'NAV not found for this scheme' });
    res.json({ schemeCode: req.params.schemeCode, schemeName: payload.meta?.scheme_name || '', nav: Number(row.nav), date: row.date });
  } catch (error) {
    if (error.name === 'TimeoutError') return res.status(504).json({ message: 'NAV provider timed out' });
    next(error);
  }
});

module.exports = router;
