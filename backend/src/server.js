const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars FIRST (before any model imports that use DATABASE_URL)
dotenv.config();

const { connectDB, sequelize } = require('./config/db');
const { User, Subject, Quiz } = require('./models');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const resultRoutes = require('./routes/resultRoutes');
const flagRoutes = require('./routes/flagRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('LMS API is running...');
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
app.use('/api/admin', adminRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await sequelize.sync(); // Tables already created
    console.log('All tables synced');

    if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
};

startServer();

module.exports = app;
