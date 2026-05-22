require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Check (Render.com uses this) ──────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── CREATE: Add a new service record ─────────────────────────────────────────
app.post('/api/records', async (req, res) => {
  const { student_name, supervisor_name, activity_description, hours, service_date } = req.body;

  if (!student_name || !supervisor_name || !activity_description || !hours) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (isNaN(hours) || Number(hours) <= 0) {
    return res.status(400).json({ error: 'Hours must be a positive number.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO service_records
         (student_name, supervisor_name, activity_description, hours, service_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        student_name.trim(),
        supervisor_name.trim(),
        activity_description.trim(),
        Number(hours),
        service_date || new Date().toISOString().split('T')[0],
      ]
    );
    res.status(201).json({ message: 'Record created.', record: result.rows[0] });
  } catch (err) {
    console.error('POST /api/records error:', err);
    res.status(500).json({ error: 'Database error while creating record.' });
  }
});

// ─── READ: Search records by student name ─────────────────────────────────────
app.get('/api/records/search', async (req, res) => {
  const { student_name } = req.query;

  if (!student_name || !student_name.trim()) {
    return res.status(400).json({ error: 'student_name query parameter is required.' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM service_records
       WHERE LOWER(student_name) LIKE LOWER($1)
       ORDER BY service_date DESC, created_at DESC`,
      [`%${student_name.trim()}%`]
    );
    res.json({ count: result.rowCount, records: result.rows });
  } catch (err) {
    console.error('GET /api/records/search error:', err);
    res.status(500).json({ error: 'Database error while searching records.' });
  }
});

// ─── READ: Get all records ─────────────────────────────────────────────────────
app.get('/api/records', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM service_records ORDER BY service_date DESC, created_at DESC'
    );
    res.json({ count: result.rowCount, records: result.rows });
  } catch (err) {
    console.error('GET /api/records error:', err);
    res.status(500).json({ error: 'Database error while fetching records.' });
  }
});

// ─── READ: Get single record by ID ────────────────────────────────────────────
app.get('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM service_records WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json({ record: result.rows[0] });
  } catch (err) {
    console.error('GET /api/records/:id error:', err);
    res.status(500).json({ error: 'Database error while fetching record.' });
  }
});

// ─── UPDATE: Revise a record by ID ────────────────────────────────────────────
app.put('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  const { student_name, supervisor_name, activity_description, hours, service_date } = req.body;

  if (!student_name || !supervisor_name || !activity_description || !hours) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (isNaN(hours) || Number(hours) <= 0) {
    return res.status(400).json({ error: 'Hours must be a positive number.' });
  }

  try {
    const result = await pool.query(
      `UPDATE service_records
       SET student_name = $1,
           supervisor_name = $2,
           activity_description = $3,
           hours = $4,
           service_date = $5
       WHERE id = $6
       RETURNING *`,
      [
        student_name.trim(),
        supervisor_name.trim(),
        activity_description.trim(),
        Number(hours),
        service_date || new Date().toISOString().split('T')[0],
        id,
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json({ message: 'Record updated.', record: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/records/:id error:', err);
    res.status(500).json({ error: 'Database error while updating record.' });
  }
});

// ─── DELETE: Remove a record by ID ────────────────────────────────────────────
app.delete('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM service_records WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Record not found.' });
    res.json({ message: 'Record deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /api/records/:id error:', err);
    res.status(500).json({ error: 'Database error while deleting record.' });
  }
});

// ─── Fallback: serve the frontend ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Server running on port ${PORT}`);
});
