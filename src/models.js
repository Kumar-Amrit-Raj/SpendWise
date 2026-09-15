const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true, collection: 'sw_users' });

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['income', 'expense'], required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 60, index: true },
  date: { type: Date, required: true, default: Date.now, index: true },
  note: { type: String, trim: true, maxlength: 300, default: '' },
  recurringRule: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringRule', default: null },
  occurrenceKey: { type: String, default: null }
}, { timestamps: true, collection: 'sw_transactions' });
transactionSchema.index(
  { user: 1, recurringRule: 1, occurrenceKey: 1 },
  {
    unique: true,
    name: 'uniq_recurring_occurrence',
    partialFilterExpression: {
      recurringRule: { $type: 'objectId' },
      occurrenceKey: { $type: 'string' }
    }
  }
);
transactionSchema.index({ user: 1, date: -1, createdAt: -1 });

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  limit: { type: Number, required: true, min: 0 }
}, { timestamps: true, collection: 'sw_budgets' });
budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

const recurringRuleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  frequency: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
  nextRun: { type: Date, required: true },
  note: { type: String, trim: true, maxlength: 300, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'sw_recurring_rules' });

const investmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  schemeCode: { type: String, trim: true, default: '' },
  monthlySip: { type: Number, min: 0, default: 0 },
  investedAmount: { type: Number, min: 0, default: 0 },
  targetAmount: { type: Number, min: 0, default: 0 },
  targetDate: { type: Date, default: null },
  units: { type: Number, min: 0, default: 0 },
  notes: { type: String, maxlength: 300, default: '' }
}, { timestamps: true, collection: 'sw_investments' });

module.exports = {
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Transaction: mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema),
  Budget: mongoose.models.Budget || mongoose.model('Budget', budgetSchema),
  RecurringRule: mongoose.models.RecurringRule || mongoose.model('RecurringRule', recurringRuleSchema),
  Investment: mongoose.models.Investment || mongoose.model('Investment', investmentSchema)
};
