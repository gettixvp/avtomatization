const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;
const SECRET_KEY = process.env.SECRET_KEY || 'my-super-secret-key';

// Подключение к PostgreSQL (настроено для Neon)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Neon требует SSL
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Создание директории uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir);
        console.log("Created 'uploads' directory.");
    } catch (err) {
        console.error("Error creating 'uploads' directory:", err);
    }
}

// Настройка multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Инициализация базы данных
async function initializeDatabase() {
    let client;
    try {
        client = await pool.connect();
        console.log('Starting database initialization...');

        // Удаление старых таблиц для чистого старта
        await client.query('DROP TABLE IF EXISTS comments CASCADE');
        await client.query('DROP TABLE IF EXISTS content CASCADE');
        await client.query('DROP TABLE IF EXISTS sections CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        console.log('Dropped existing tables if any');

        // Создание таблицы users
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT false
            )
        `);
        console.log('Table "users" created');

        // Создание таблицы sections
        await client.query(`
            CREATE TABLE sections (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                color VARCHAR(50),
                icon VARCHAR(50)
            )
        `);
        console.log('Table "sections" created');

        // Создание таблицы content
        await client.query(`
            CREATE TABLE content (
                id SERIAL PRIMARY KEY,
                section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                text TEXT,
                link VARCHAR(255),
                file_path VARCHAR(255),
                image_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table "content" created');

        // Создание таблицы comments
        await client.query(`
            CREATE TABLE comments (
                id SERIAL PRIMARY KEY,
                content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table "comments" created');

        // Создание администратора
        const adminEmail = process.env.ADMIN_EMAIL || 'svaleriya695@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin_password';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await client.query(
            'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            ['Admin', adminEmail, hashedPassword, true]
        );
        console.log('Admin user created or already exists');

    } catch (error) {
        console.error('Error during database initialization:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
            console.log('Database client released.');
        }
    }
}

// Проверка подключения и запуск сервера
async function startServer() {
    try {
        const client = await pool.connect();
        console.log('Database connection successful. Performing check...');
        await client.query('SELECT NOW()');
        client.release();
        console.log('Database connection check passed.');

        await initializeDatabase();
        console.log('Database initialization complete.');

        // Маршруты
        app.post('/api/register', async (req, res) => {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required' });
            }
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const result = await pool.query(
                    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
                    [name, email, hashedPassword]
                );
                res.status(201).json({ message: 'User registered', userId: result.rows[0].id });
            } catch (error) {
                if (error.code === '23505' && error.constraint === 'users_email_key') {
                    res.status(409).json({ error: 'Email already exists' });
                } else {
                    console.error('Registration error:', error);
                    res.status(500).json({ error: 'Server error during registration' });
                }
            }
        });

        app.post('/api/login', async (req, res) => {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            try {
                const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                const user = result.rows[0];
                if (!user || !(await bcrypt.compare(password, user.password))) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                const token = jwt.sign(
                    { id: user.id, email: user.email, isAdmin: user.is_admin },
                    SECRET_KEY,
                    { expiresIn: '1h' }
                );
                res.json({ token, isAdmin: user.is_admin, name: user.name });
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: 'Server error during login' });
            }
        });

        const authenticateToken = (req, res, next) => {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token == null) return res.status(401).json({ error: 'Access denied, token missing' });

            jwt.verify(token, SECRET_KEY, (err, user) => {
                if (err) return res.status(403).json({ error: 'Invalid or expired token' });
                req.user = user;
                next();
            });
        };

        const isAdmin = (req, res, next) => {
            if (!req.user || !req.user.isAdmin) {
                return res.status(403).json({ error: 'Forbidden: Admin access required' });
            }
            next();
        };

        app.get('/api/sections', async (req, res) => {
            try {
                const result = await pool.query('SELECT * FROM sections ORDER BY id');
                res.json(result.rows);
            } catch (error) {
                console.error('Error fetching sections:', error);
                res.status(500).json({ error: 'Server error fetching sections' });
            }
        });

        app.get('/api/content/:sectionId', async (req, res) => {
            const { sectionId } = req.params;
            if (isNaN(parseInt(sectionId))) {
                return res.status(400).json({ error: 'Invalid section ID format' });
            }
            try {
                const contentResult = await pool.query('SELECT * FROM content WHERE section_id = $1 ORDER BY created_at DESC', [sectionId]);
                const content = contentResult.rows;

                // Для каждого материала получаем комментарии
                for (let item of content) {
                    const commentsResult = await pool.query(`
                        SELECT c.*, u.name as user_name 
                        FROM comments c 
                        JOIN users u ON c.user_id = u.id 
                        WHERE c.content_id = $1 
                        ORDER BY c.created_at ASC
                    `, [item.id]);
                    item.comments = commentsResult.rows;
                }

                res.json(content);
            } catch (error) {
                console.error(`Error fetching content for section ${sectionId}:`, error);
                res.status(500).json({ error: 'Server error fetching content' });
            }
        });

        app.post('/api/sections', authenticateToken, isAdmin, async (req, res) => {
            const { title, description, color, icon } = req.body;
            if (!title) {
                return res.status(400).json({ error: 'Title is required for a section' });
            }
            try {
                const result = await pool.query(
                    'INSERT INTO sections (title, description, color, icon) VALUES ($1, $2, $3, $4) RETURNING *',
                    [title, description || null, color || null, icon || null]
                );
                res.status(201).json(result.rows[0]);
            } catch (error) {
                console.error('Error creating section:', error);
                res.status(500).json({ error: 'Server error creating section' });
            }
        });

        app.put('/api/sections/:id', authenticateToken, isAdmin, async (req, res) => {
            const { id } = req.params;
            const { title, description, color, icon } = req.body;
            if (!title) {
                return res.status(400).json({ error: 'Title is required for a section' });
            }
            try {
                const result = await pool.query(
                    'UPDATE sections SET title = $1, description = $2, color = $3, icon = $4 WHERE id = $5 RETURNING *',
                    [title, description || null, color || null, icon || null, id]
                );
                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Section not found' });
                }
                res.json(result.rows[0]);
            } catch (error) {
                console.error('Error updating section:', error);
                res.status(500).json({ error: 'Server error updating section' });
            }
        });

        app.post('/api/content', authenticateToken, isAdmin, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
            const { sectionId, title, text, link } = req.body;
            if (!sectionId || !title) {
                return res.status(400).json({ error: 'Section ID and Title are required' });
            }
            if (isNaN(parseInt(sectionId))) {
                return res.status(400).json({ error: 'Invalid section ID format' });
            }
            const filePath = req.files && req.files['file'] ? 'uploads/' + req.files['file'][0].filename : null;
            const imagePath = req.files && req.files['image'] ? 'uploads/' + req.files['image'][0].filename : null;

            try {
                const result = await pool.query(
                    'INSERT INTO content (section_id, title, text, link, file_path, image_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [sectionId, title, text || null, link || null, filePath, imagePath]
                );
                res.status(201).json(result.rows[0]);
            } catch (error) {
                if (error.code === '23503') {
                    res.status(404).json({ error: `Section with ID ${sectionId} not found.` });
                } else {
                    console.error('Error adding content:', error);
                    res.status(500).json({ error: 'Server error adding content' });
                }
            }
        });

        app.post('/api/comments', authenticateToken, async (req, res) => {
            const { contentId, text } = req.body;
            const userId = req.user.id;
            if (!contentId || !text) {
                return res.status(400).json({ error: 'Content ID and text are required' });
            }
            try {
                const result = await pool.query(
                    'INSERT INTO comments (content_id, user_id, text) VALUES ($1, $2, $3) RETURNING *',
                    [contentId, userId, text]
                );
                const comment = result.rows[0];
                // Получаем имя пользователя для ответа
                const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
                comment.user_name = userResult.rows[0].name;
                res.status(201).json(comment);
            } catch (error) {
                console.error('Error adding comment:', error);
                res.status(500).json({ error: 'Server error adding comment' });
            }
        });

        app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
            try {
                const result = await pool.query('SELECT id, name, email, is_admin FROM users ORDER BY id');
                res.json(result.rows);
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ error: 'Server error fetching users' });
            }
        });

        app.use((req, res) => {
            res.status(404).json({ error: 'Not Found' });
        });

        app.use((err, req, res, next) => {
            console.error("Unhandled error:", err);
            res.status(500).json({ error: 'Something went wrong!' });
        });

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API base URL: http://localhost:${PORT}/api`);
            console.log(`Uploads served from: /uploads`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
