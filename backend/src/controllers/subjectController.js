const { Subject, User } = require('../models');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private (All authenticated users)
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.findAll({
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'email']
            }]
        });
        // Transform to match MongoDB populate format: instructorId becomes the populated object
        const result = subjects.map(s => {
            const plain = s.toJSON();
            if (plain.instructor) {
                plain.instructorId = { ...plain.instructor, _id: String(plain.instructor.id) };
                delete plain.instructor;
            }
            return plain;
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'name', 'email']
            }]
        });
        if (subject) {
            const plain = subject.toJSON();
            if (plain.instructor) {
                plain.instructorId = { ...plain.instructor, _id: String(plain.instructor.id) };
                delete plain.instructor;
            }
            res.json(plain);
        } else {
            res.status(404).json({ message: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private/Instructor
const createSubject = async (req, res) => {
    try {
        const { title, description, units, thumbnail } = req.body;

        const subject = await Subject.create({
            title,
            description: description || '',
            thumbnail: thumbnail || undefined,
            instructorId: req.user.id,
            units: units || []
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Instructor
const updateSubject = async (req, res) => {
    try {
        const { title, description, units, thumbnail } = req.body;

        const subject = await Subject.findByPk(req.params.id);

        if (subject) {
            // Check if user is the instructor of this subject or an admin
            if (subject.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(401).json({ message: 'Not authorized to update this subject' });
            }

            subject.title = title || subject.title;
            subject.description = description || subject.description;
            if (thumbnail) subject.thumbnail = thumbnail;
            if (units) subject.units = units;

            // Mark JSONB as changed so Sequelize persists it
            subject.changed('units', true);

            await subject.save();
            res.json(subject);
        } else {
            res.status(404).json({ message: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Instructor or Admin
const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByPk(req.params.id);

        if (subject) {
            if (subject.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(401).json({ message: 'Not authorized to delete this subject' });
            }

            await subject.destroy();
            res.json({ message: 'Subject removed' });
        } else {
            res.status(404).json({ message: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};
