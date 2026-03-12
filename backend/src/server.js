const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars FIRST (before any model imports that use DATABASE_URL)
dotenv.config();

const { connectDB, sequelize } = require('./config/db');
const { User, Subject, Quiz } = require('./models');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const resultRoutes = require('./routes/resultRoutes');
const flagRoutes = require('./routes/flagRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Lazy Connection Middleware - Optimizes for Vercel cold starts
let isDbConnected = false;
app.use(async (req, res, next) => {
    // Debug log for environment variables in Vercel logs
    if (!isDbConnected) {
        console.log(`[DEBUG] DATABASE_URL present: ${!!process.env.DATABASE_URL}`);
        console.log(`[DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);
    }

    if (!isDbConnected && !req.path.startsWith('/api/health')) {
        try {
            await connectDB();

            // Sync database only in development or if a forced sync flag is set
            if (process.env.NODE_ENV !== 'production' || process.env.FORCE_SYNC === 'true') {
                await sequelize.sync({ alter: true });
                console.log('All tables synced');
            }
            isDbConnected = true;
        } catch (err) {
            console.error('Lazy DB Connection Failed:', err.message);
            // We don't block the request here, but DB dependent routes will likely fail with 500
        }
    }
    next();
});

// Serve static files from the public directory (for uploaded PDFs etc)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic Routes
app.get('/', (req, res) => {
    res.send('LMS API is running...');
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        dbConnected: isDbConnected,
        hasDbUrl: !!process.env.DATABASE_URL, // Critical debug info
        env: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
    });
});

// Public Stats Route — used by login page
app.get('/api/stats', async (req, res) => {
    try {
        const [students, instructors, subjects, quizzes] = await Promise.all([
            User.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
            User.count({ where: { role: 'INSTRUCTOR' } }),
            Subject.count(),
            Quiz.count()
        ]);
        res.json({ students, instructors, subjects, quizzes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;

// Only listen locally, Vercel handles the export
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
