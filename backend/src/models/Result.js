const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Result = sequelize.define('Result', {
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
    quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'quizzes', key: 'id' }
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'subjects', key: 'id' }
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    percentage: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    answers: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'results',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['studentId', 'quizId'] }
    ]
});

const _origResultToJSON = Result.prototype.toJSON;
Result.prototype.toJSON = function () {
    const values = _origResultToJSON.call(this);
    values._id = String(values.id);
    return values;
};

module.exports = Result;
