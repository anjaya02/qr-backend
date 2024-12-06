// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create a MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// API Endpoint: Scan QR Code
app.post('/scan', async (req, res) => {
  const { qr_value } = req.body;

  if (!qr_value) {
    return res.status(400).json({ message: 'QR value is required.' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM qr_codes WHERE qr_value = ?', [qr_value]);

    if (rows.length > 0) {
      let scan_count = rows[0].scan_count + 1;
      let message = `QR code has been scanned ${scan_count} time(s).`;

      if (scan_count >= 5) {
        scan_count = 5; // Cap at 5
        message = 'QR code has been scanned up to 5 times.';
      }

      // Update the scan count
      await pool.execute('UPDATE qr_codes SET scan_count = ? WHERE qr_value = ?', [scan_count, qr_value]);

      return res.status(200).json({ message, scan_count });
    } else {
      return res.status(404).json({ message: 'Record not found.' });
    }
  } catch (error) {
    console.error('Error processing scan:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
