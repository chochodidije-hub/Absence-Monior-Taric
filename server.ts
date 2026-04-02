import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import Database from 'better-sqlite3';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for express-rate-limit (OWASP)
  // Cloud Run/Nginx acts as a proxy, so we need to trust it to get the correct IP
  app.set('trust proxy', 1);

  // 1. Helmet for security headers (OWASP)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite HMR if needed, but in production it should be enabled
  }));

  // 2. CORS
  app.use(cors());

  // 3. Rate Limiting (OWASP)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }, // Suppress proxy validation warnings as we've set app.set('trust proxy', 1)
  });
  app.use('/api/', limiter);

  app.use(express.json());

  // Database Initialization (Parameterized Queries - OWASP)
  const db = new Database('app.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT,
      assigned_classes TEXT DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT,
      class_name TEXT,
      status TEXT,
      date TEXT,
      subject TEXT,
      duration TEXT,
      teacher_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES users(id)
    );
  `);

  // Migration: Add missing columns to attendance table
  try { db.prepare("ALTER TABLE attendance ADD COLUMN subject TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE attendance ADD COLUMN duration TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE attendance ADD COLUMN timestamp DATETIME DEFAULT CURRENT_TIMESTAMP").run(); } catch (e) {}

  // Migration: Add missing columns if table already existed (OWASP - Schema Integrity)
  try {
    db.prepare("ALTER TABLE users ADD COLUMN name TEXT").run();
  } catch (e) {
    // Column already exists or other error
  }
  try {
    db.prepare("ALTER TABLE users ADD COLUMN assigned_classes TEXT DEFAULT '[]'").run();
  } catch (e) {
    // Column already exists or other error
  }

  // Seed admin if not exists (OWASP - Initial Setup)
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin') as any;
  if (!adminExists) {
    db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run('admin', adminPassword, 'Admin User', 'admin');
  } else if (!adminExists.name) {
    db.prepare('UPDATE users SET name = ? WHERE username = ?').run('Admin User', 'admin');
  }

  // 4. Input Sanitization & Validation (OWASP)
  const loginSchema = z.object({
    username: z.string().min(1).max(50),
    password: z.string().min(1).max(100),
  });

  interface UserRow {
    id: number;
    username: string;
    password?: string;
    role: string;
  }

  const sanitizeInput = (input: string) => DOMPurify.sanitize(input);

  // Helper: Fetch Global Time (Reverted to local server clock)
  const fetchCasablancaTime = async () => {
    // Directly return server's local time
    return new Date();
  };

  // API Routes
  app.get('/api/time', async (req, res) => {
    // Return server's local time
    const localTime = await fetchCasablancaTime();
    res.json({ 
      datetime: localTime.toISOString(),
      unixtime: Math.floor(localTime.getTime() / 1000)
    });
  });

  app.get('/api/teachers', (req, res) => {
    const teachers = db.prepare('SELECT id, username, name, role, assigned_classes FROM users WHERE role = ?').all('teacher') as any[];
    const formattedTeachers = teachers.map(t => ({
      ...t,
      assignedClasses: JSON.parse(t.assigned_classes || '[]')
    }));
    res.json(formattedTeachers);
  });

  app.post('/api/teachers', (req, res) => {
    const teacherSchema = z.object({
      name: z.string().min(1).max(100),
      username: z.string().min(1).max(50),
      password: z.string().min(1).max(100),
    });

    try {
      const data = teacherSchema.parse(req.body);
      const cleanName = sanitizeInput(data.name);
      const cleanUsername = sanitizeInput(data.username);

      // Check if username exists
      const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }

      const result = db.prepare('INSERT INTO users (username, password, name, role, assigned_classes) VALUES (?, ?, ?, ?, ?)')
        .run(cleanUsername, data.password, cleanName, 'teacher', '[]');

      res.json({ 
        success: true, 
        id: result.lastInsertRowid, 
        name: cleanName, 
        username: cleanUsername, 
        role: 'teacher',
        assignedClasses: []
      });
    } catch (error) {
      res.status(400).json({ success: false, message: 'Invalid data' });
    }
  });

  app.post('/api/teachers/:id/classes', (req, res) => {
    const { id } = req.params;
    const { assignedClasses } = req.body;
    if (!Array.isArray(assignedClasses)) return res.status(400).json({ success: false, message: 'Invalid classes' });
    
    db.prepare('UPDATE users SET assigned_classes = ? WHERE id = ? AND role = ?')
      .run(JSON.stringify(assignedClasses), id, 'teacher');
    
    res.json({ success: true });
  });

  app.delete('/api/teachers/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(id, 'teacher');
    res.json({ success: true });
  });

  app.post('/api/teachers/:id/password', (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password required' });
    
    db.prepare('UPDATE users SET password = ? WHERE id = ? AND role = ?').run(password, id, 'teacher');
    res.json({ success: true });
  });

  app.post('/api/login', (req, res) => {
    try {
      // Validation
      const { username, password } = loginSchema.parse(req.body);
      
      // Sanitization
      const cleanUsername = sanitizeInput(username);

      // Parameterized Query (SQL Injection Prevention - OWASP)
      const user = db.prepare('SELECT id, username, name, role, assigned_classes FROM users WHERE username = ? AND password = ?').get(cleanUsername, password) as any | undefined;

      if (user) {
        res.json({ 
          success: true, 
          user: { 
            id: user.id, 
            username: user.username, 
            name: user.name,
            role: user.role,
            assignedClasses: JSON.parse(user.assigned_classes || '[]')
          } 
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(400).json({ success: false, message: 'Invalid input' });
    }
  });

  app.get('/api/attendance', (req, res) => {
    const records = db.prepare('SELECT * FROM attendance ORDER BY date DESC').all();
    res.json(records);
  });

  app.post('/api/attendance', async (req, res) => {
    const sessionSchema = z.object({
      className: z.string().min(1).max(50),
      subject: z.string().min(1).max(100),
      duration: z.string().min(1).max(20),
      teacherId: z.number(),
      students: z.array(z.object({
        name: z.string().min(1).max(100),
        status: z.enum(['present', 'absent', 'late']),
        massarId: z.string().min(1).max(50)
      }))
    });

    try {
      const data = sessionSchema.parse(req.body);
      
      // Use server's local time
      const now = await fetchCasablancaTime();
      
      // Format date for local storage
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timestampStr = now.toISOString();

      const insertStmt = db.prepare(`
        INSERT INTO attendance (student_name, class_name, status, date, subject, duration, teacher_id, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((students) => {
        for (const student of students) {
          insertStmt.run(
            sanitizeInput(student.name), 
            sanitizeInput(data.className), 
            student.status, 
            dateStr, 
            sanitizeInput(data.subject), 
            sanitizeInput(data.duration), 
            data.teacherId,
            timestampStr
          );
        }
      });

      transaction(data.students);

      res.json({ success: true, date: dateStr, timestamp: timestampStr });
    } catch (error) {
      console.error('Attendance Save Error:', error);
      res.status(400).json({ success: false, message: 'Invalid data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
