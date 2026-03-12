const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'subjects', key: 'id' }
    },
    progressUnit: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    progressChapter: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    progressSection: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    percentageCompleted: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
}, {
    tableName: 'enrollments',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['studentId', 'subjectId'] }
    ]
});

const _origEnrollmentToJSON = Enrollment.prototype.toJSON;
Enrollment.prototype.toJSON = function () {
    const values = _origEnrollmentToJSON.call(this);
    values._id = String(values.id);
    return values;
};

module.exports = Enrollment;
