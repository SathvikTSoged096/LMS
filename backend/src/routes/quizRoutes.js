const express = require('express');
const router = express.Router();
const {
    createQuiz,
    getSubjectQuizzes,
    submitQuizUrl,
    updateQuiz,
    deleteQuiz,
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('INSTRUCTOR', 'ADMIN'), createQuiz);
router.get('/subject/:subjectId', protect, getSubjectQuizzes);
router.put('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), updateQuiz);
router.delete('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), deleteQuiz);
router.post('/:id/submit', protect, authorize('STUDENT'), submitQuizUrl);

module.exports = router;
