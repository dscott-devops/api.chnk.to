const express = require('express');
const QRCode = require('qrcode');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function isValidUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

router.post('/generate', async (req, res) => {
  const { url, label, save } = req.body || {};
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'A valid http(s) url is required' });
  }

  if (save) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to save a code' });
    }
    await pool.query(
      'INSERT INTO qrcodes (user_id, url, label) VALUES ($1, $2, $3)',
      [req.user.sub, url, label || null]
    );
  }

  const png = await QRCode.toBuffer(url, { type: 'png', width: 512 });
  res.type('image/png').send(png);
});

router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, url, label, created_at FROM qrcodes WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.sub]
  );
  res.json({ codes: rows });
});

router.get('/:id/download', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT url FROM qrcodes WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  const png = await QRCode.toBuffer(rows[0].url, { type: 'png', width: 512 });
  res.type('image/png').send(png);
});

module.exports = router;
