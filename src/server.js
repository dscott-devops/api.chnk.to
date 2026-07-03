require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { attachUser } = require('./middleware/auth');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(attachUser);

app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/qr', qrRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`chnktoapi listening on ${host}:${port}`);
});
