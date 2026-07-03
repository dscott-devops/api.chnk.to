const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'unreachable', message: err.message });
  }
});

module.exports = router;
