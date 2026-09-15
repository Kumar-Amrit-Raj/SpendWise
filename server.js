require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./src/db');
const authRoutes = require('./src/routes/auth');
const financeRoutes = require('./src/routes/finance');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map(x => x.trim()) : true }));
app.use(express.json({ limit: '128kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'SpendWise API' }));
app.use('/api/auth', authRoutes);
app.use('/api', financeRoutes);

const buildDir = path.join(__dirname, 'client', 'build');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(buildDir));
  app.get('*', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(buildDir, 'index.html')));
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ message: 'That record already exists' });
  if (error?.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
  res.status(500).json({ message: 'Unexpected server error' });
});

const port = Number(process.env.PORT || 5000);
connectDatabase().then(() => app.listen(port, () => console.log(`SpendWise API listening on ${port}`))).catch(error => {
  console.error('Database startup failed:', error.message);
  process.exit(1);
});
