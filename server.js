const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'your-secret-key'; // Замените на безопасный ключ

// Подключение к PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgresql_6nv7_user:EQCCcg1l73t8S2g9sfF2LPVx6aA5yZts@dpg-cvlq2pggjchc738o29r0-a/postgresql_6nv7'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Создание таблиц
async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT false
        );
        
        CREATE TABLE IF NOT EXISTS sections (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(50),
            icon VARCHAR(50)
        );
        
        CREATE TABLE IF NOT EXISTS content (
            id SERIAL PRIMARY KEY,
            section_id INTEGER REFERENCES sections(id),
            title VARCHAR(255) NOT NULL,
            text TEXT,
            link VARCHAR(255),
            file_path VARCHAR(255),
            image_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    // Создание администратора
    const adminEmail = 'svaleriya695@gmail.com';
    const adminExists = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (adminExists.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('admin_password', 10);
        await pool.query(
            'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4)',
            ['Admin', adminEmail, hashedPassword, true]
        );
    }
}

initializeDatabase();

// Регистрация
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
    } catch (error) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

// Авторизация
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, SECRET_KEY);
        res.json({ token, isAdmin: user.is_admin });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Middleware для проверки администратора
const isAdmin = (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
};

// Получение всех разделов
app.get('/api/sections', async (req, res) => {
    const result = await pool.query('SELECT * FROM sections');
    res.json(result.rows);
});

// Получение контента по разделу
app.get('/api/content/:sectionId', async (req, res) => {
    const { sectionId } = req.params;
    const result = await pool.query('SELECT * FROM content WHERE section_id = $1 ORDER BY created_at DESC', [sectionId]);
    res.json(result.rows);
});

// Добавление раздела (админ)
app.post('/api/sections', authenticateToken, isAdmin, async (req, res) => {
    const { title, description, color, icon } = req.body;
    const result = await pool.query(
        'INSERT INTO sections (title, description, color, icon) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, description, color, icon]
    );
    res.status(201).json(result.rows[0]);
});

// Добавление контента (админ)
app.post('/api/content', authenticateToken, isAdmin, upload.fields([{ name: 'file' }, { name: 'image' }]), async (req, res) => {
    const { sectionId, title, text, link } = req.body;
    const filePath = req.files['file'] ? req.files['file'][0].path : null;
    const imagePath = req.files['image'] ? req.files['image'][0].path : null;
    
    const result = await pool.query(
        'INSERT INTO content (section_id, title, text, link, file_path, image_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [sectionId, title, text, link, filePath, imagePath]
    );
    res.status(201).json(result.rows[0]);
});

// Получение списка пользователей (админ)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    const result = await pool.query('SELECT id, name, email, is_admin FROM users');
    res.json(result.rows);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});