const { Flag, Quiz, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Flag a quiz question
// @route   POST /api/flags
// @access  Private/Student
const createFlag = async (req, res) => {
    try {
        const { quizId, questionIndex, reason } = req.body;

        if (!quizId || questionIndex === undefined || !reason) {
            return res.status(400).json({ message: 'quizId, questionIndex, and reason are required' });
        }

        // Verify quiz exists and questionIndex is valid
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
            return res.status(400).json({ message: 'Invalid question index' });
        }

        const flag = await Flag.create({
            studentId: req.user.id,
            quizId,
            questionIndex,
            reason
        });

        res.status(201).json({ message: 'Question flagged successfully', flag });
    } catch (error) {
        // Sequelize unique constraint error
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'You have already flagged this question' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get flags for quizzes created by the logged-in instructor
// @route   GET /api/flags
// @access  Private/Instructor
const getFlags = async (req, res) => {
    try {
        // Find quizzes created by this instructor
        const myQuizzes = await Quiz.findAll({
            where: { createdBy: req.user.id },
            attributes: ['id']
        });
        const quizIds = myQuizzes.map(q => q.id);

        const flags = await Flag.findAll({
            where: { quizId: { [Op.in]: quizIds } },
            include: [
                { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
                { model: Quiz, as: 'quiz', attributes: ['id', 'title', 'questions'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Transform: nest student/quiz under studentId/quizId for Mongoose populate compat
        const transformed = flags.map(f => {
            const plain = f.toJSON();
            if (plain.student) {
                plain.studentId = { ...plain.student, _id: String(plain.student.id) };
                delete plain.student;
            }
            if (plain.quiz) {
                plain.quizId = { ...plain.quiz, _id: String(plain.quiz.id) };
                delete plain.quiz;
            }
            return plain;
        });

        res.json(transformed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createFlag, getFlags };
