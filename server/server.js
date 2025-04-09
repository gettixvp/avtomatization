const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: 'postgresql://postgresql_6nv7_user:EQCCcg1l73t8S2g9sfF2LPVx6aA5yZts@dpg-cvlq2pggjchc738o29r0-a/postgresql_6nv7'
});

const ADMIN_EMAIL = 'svaleriya695@gmail.com';

// Инициализация базы данных
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      section VARCHAR(50) NOT NULL,
      text TEXT NOT NULL,
      link TEXT,
      image TEXT
    );
  `);
}
initDB();

// Регистрация
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email, isAdmin: email === ADMIN_EMAIL }, 'secret', { expiresIn: '24h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение контента
app.get('/api/content', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM content');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавление контента (только админ)
app.post('/api/content', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'secret');
    if (decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { section, text, link, image } = req.body;
    const result = await pool.query(
      'INSERT INTO content (section, text, link, image) VALUES ($1, $2, $3, $4) RETURNING *',
      [section, text, link, image]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));