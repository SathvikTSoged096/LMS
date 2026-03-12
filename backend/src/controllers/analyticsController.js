const { Enrollment, Result, User } = require('../models');

// @desc    Get student rankings for a specific subject
// @route   GET /api/analytics/subject/:id/rankings
// @access  Private/Admin/Instructor
const getSubjectRankings = async (req, res) => {
    try {
        const subjectId = req.params.id;

        // Get all enrollments for this subject
        const enrollments = await Enrollment.findAll({
            where: { subjectId },
            include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }]
        });

        // Get all quiz results for this subject
        const results = await Result.findAll({ where: { subjectId } });

        const rankings = enrollments.map(enrollment => {
            const plain = enrollment.toJSON();
            const studentId = plain.student.id;

            // Find all results for this student in this subject
            const studentResults = results.filter(r => r.studentId === studentId);

            // Calculate avg quiz percentage
            let avgQuizPct = 0;
            if (studentResults.length > 0) {
                const totalPct = studentResults.reduce((acc, curr) => acc + curr.percentage, 0);
                avgQuizPct = totalPct / studentResults.length;
            }

            const completionPct = plain.percentageCompleted || 0;

            // Ranking formula: 70% Quiz + 30% Completion
            const finalScore = (avgQuizPct * 0.7) + (completionPct * 0.3);

            return {
                studentId: plain.student.id,
                name: plain.student.name,
                email: plain.student.email,
                averageQuizScore: avgQuizPct.toFixed(2),
                completionPercentage: completionPct.toFixed(2),
                finalRankingScore: finalScore.toFixed(2)
            };
        });

        // Sort descending by final score
        rankings.sort((a, b) => parseFloat(b.finalRankingScore) - parseFloat(a.finalRankingScore));

        res.json(rankings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get overall college rankings
// @route   GET /api/analytics/college-rankings
// @access  Private/Admin
const getCollegeRankings = async (req, res) => {
    try {
        const students = await User.findAll({
            where: { role: 'STUDENT' },
            attributes: ['id', 'name', 'email']
        });
        const enrollments = await Enrollment.findAll();
        const results = await Result.findAll();

        const collegeRankings = students.map(student => {
            const studentId = student.id;

            const myEnrollments = enrollments.filter(e => e.studentId === studentId);
            const myResults = results.filter(r => r.studentId === studentId);

            let avgCompletion = 0;
            if (myEnrollments.length > 0) {
                avgCompletion = myEnrollments.reduce((acc, curr) => acc + (curr.percentageCompleted || 0), 0) / myEnrollments.length;
            }

            let avgQuiz = 0;
            if (myResults.length > 0) {
                avgQuiz = myResults.reduce((acc, curr) => acc + curr.percentage, 0) / myResults.length;
            }

            const finalScore = (avgQuiz * 0.7) + (avgCompletion * 0.3);

            return {
                studentId: student.id,
                name: student.name,
                email: student.email,
                enrolledCount: myEnrollments.length,
                averageQuizScore: avgQuiz.toFixed(2),
                completionPercentage: avgCompletion.toFixed(2),
                finalRankingScore: finalScore.toFixed(2)
            };
        }).filter(s => s.enrolledCount > 0);

        collegeRankings.sort((a, b) => parseFloat(b.finalRankingScore) - parseFloat(a.finalRankingScore));

        res.json(collegeRankings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSubjectRankings,
    getCollegeRankings
};
