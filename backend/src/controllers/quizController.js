const { Quiz, Result, Subject, User } = require('../models');

// @desc    Create a quiz
// @route   POST /api/quizzes
// @access  Private/Instructor
const createQuiz = async (req, res) => {
    try {
        const { subjectId, title, questions } = req.body;

        // Server-side validation
        if (!questions || questions.length < 1) {
            return res.status(400).json({ message: 'A quiz must contain at least 1 question' });
        }

        const quiz = await Quiz.create({
            subjectId,
            createdBy: req.user.id,
            title,
            questions
        });

        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get quizzes for a specific subject
// @route   GET /api/quizzes/subject/:subjectId
// @access  Private
const getSubjectQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.findAll({
            where: { subjectId: req.params.subjectId }
        });

        // Instructors/Admins get full data; students get answers stripped
        if (req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN') {
            return res.json(quizzes);
        }

        // Strip correctOptionIndex from questions to prevent cheating
        const sanitized = quizzes.map(q => {
            const plain = q.toJSON();
            if (plain.questions) {
                plain.questions = plain.questions.map(({ correctOptionIndex, ...rest }) => rest);
            }
            return plain;
        });

        res.json(sanitized);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit answers and auto-grade
// @route   POST /api/quizzes/:id/submit
// @access  Private/Student
const submitQuizUrl = async (req, res) => {
    try {
        const { answers } = req.body;
        const quizId = req.params.id;
        const studentId = req.user.id;

        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Check if already attempted
        const existingResult = await Result.findOne({ where: { studentId, quizId } });
        if (existingResult) {
            return res.status(400).json({ message: 'You have already attempted this quiz' });
        }

        let score = 0;
        const gradedAnswers = [];

        quiz.questions.forEach((q, idx) => {
            const selectedOptionIndex = answers[idx];
            const isCorrect = selectedOptionIndex === q.correctOptionIndex;
            if (isCorrect) score += 1;

            gradedAnswers.push({
                questionIndex: idx,
                selectedOptionIndex,
                isCorrect
            });
        });

        const percentage = (score / quiz.questions.length) * 100;

        const result = await Result.create({
            studentId,
            quizId,
            subjectId: quiz.subjectId,
            score,
            percentage,
            answers: gradedAnswers
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my quiz results
// @route   GET /api/results/me
// @access  Private/Student
const getMyResults = async (req, res) => {
    try {
        const results = await Result.findAll({
            where: { studentId: req.user.id },
            include: [
                { model: Quiz, as: 'quiz', attributes: ['id', 'title'] },
                { model: Subject, as: 'subject', attributes: ['id', 'title'] }
            ]
        });
        // Transform: nest quiz/subject under quizId/subjectId for Mongoose populate compat
        const transformed = results.map(r => {
            const plain = r.toJSON();
            if (plain.quiz) {
                plain.quizId = { ...plain.quiz, _id: String(plain.quiz.id) };
                delete plain.quiz;
            }
            if (plain.subject) {
                plain.subjectId = { ...plain.subject, _id: String(plain.subject.id) };
                delete plain.subject;
            }
            return plain;
        });
        res.json(transformed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Instructor
const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByPk(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const { title, questions } = req.body;
        if (questions && questions.length < 1) {
            return res.status(400).json({ message: 'A quiz must contain at least 1 question' });
        }

        if (title) quiz.title = title;
        if (questions) {
            quiz.questions = questions;
            quiz.changed('questions', true);
        }
        await quiz.save();
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Instructor
const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByPk(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        await quiz.destroy();
        res.json({ message: 'Quiz deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createQuiz,
    getSubjectQuizzes,
    submitQuizUrl,
    getMyResults,
    updateQuiz,
    deleteQuiz
};
