const User = require('./User');
const Subject = require('./Subject');
const Quiz = require('./Quiz');
const Result = require('./Result');
const Enrollment = require('./Enrollment');
const Flag = require('./Flag');
const Counter = require('./Counter');

// --- Associations ---

// Subject belongs to an instructor (User)
Subject.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });
User.hasMany(Subject, { foreignKey: 'instructorId' });

// Quiz belongs to Subject and User (creator)
Quiz.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Quiz.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Subject.hasMany(Quiz, { foreignKey: 'subjectId' });

// Result belongs to Student, Quiz, Subject
Result.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Result.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
Result.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
User.hasMany(Result, { foreignKey: 'studentId' });

// Enrollment belongs to Student and Subject
Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
User.hasMany(Enrollment, { foreignKey: 'studentId' });
Subject.hasMany(Enrollment, { foreignKey: 'subjectId' });

// Flag belongs to Student and Quiz
Flag.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Flag.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
User.hasMany(Flag, { foreignKey: 'studentId' });
Quiz.hasMany(Flag, { foreignKey: 'quizId' });

module.exports = { User, Subject, Quiz, Result, Enrollment, Flag, Counter };
