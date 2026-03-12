const { Enrollment, Subject, User } = require('../models');

// @desc    Enroll in a subject
// @route   POST /api/enrollments/:subjectId
// @access  Private/Student
const enrollSubject = async (req, res) => {
    try {
        const studentId = req.user.id;
        const subjectId = req.params.subjectId;

        // Check if subject exists
        const subject = await Subject.findByPk(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Check enrollment limit (max 3)
        const currentEnrollments = await Enrollment.count({ where: { studentId } });
        if (currentEnrollments >= 3) {
            return res.status(400).json({ message: 'Maximum enrollment limit (3) reached' });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ where: { studentId, subjectId } });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this subject' });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            studentId,
            subjectId
        });

        res.status(201).json(enrollment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current student's enrollments
// @route   GET /api/enrollments/me
// @access  Private/Student
const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.findAll({
            where: { studentId: req.user.id },
            include: [{
                model: Subject,
                as: 'subject',
                attributes: ['id', 'title', 'description', 'thumbnail']
            }]
        });
        // Transform: nest subject data under 'subjectId' to match Mongoose populate format
        const result = enrollments.map(e => {
            const plain = e.toJSON();
            if (plain.subject) {
                plain.subjectId = { ...plain.subject, _id: String(plain.subject.id) };
                delete plain.subject;
            }
            // Map progress fields to nested progressPointer for frontend compatibility
            plain.progressPointer = {
                unit: plain.progressUnit || 0,
                chapter: plain.progressChapter || 0,
                section: plain.progressSection || 0
            };
            return plain;
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update progress pointer
// @route   PUT /api/enrollments/:subjectId/progress
// @access  Private/Student
const updateProgress = async (req, res) => {
    try {
        const { unit, chapter, section, percentageCompleted } = req.body;

        const enrollment = await Enrollment.findOne({
            where: {
                studentId: req.user.id,
                subjectId: req.params.subjectId
            }
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        if (unit !== undefined) enrollment.progressUnit = unit;
        if (chapter !== undefined) enrollment.progressChapter = chapter;
        if (section !== undefined) enrollment.progressSection = section;
        if (percentageCompleted !== undefined) enrollment.percentageCompleted = percentageCompleted;

        await enrollment.save();

        // Return with progressPointer format for frontend compatibility
        const plain = enrollment.toJSON();
        plain.progressPointer = {
            unit: plain.progressUnit || 0,
            chapter: plain.progressChapter || 0,
            section: plain.progressSection || 0
        };
        res.json(plain);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    enrollSubject,
    getMyEnrollments,
    updateProgress
};
