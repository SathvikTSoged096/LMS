const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Quiz = sequelize.define('Quiz', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    subjectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'subjects', key: 'id' }
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    questions: {
        type: DataTypes.JSONB,
        allowNull: false
    }
}, {
    tableName: 'quizzes',
    timestamps: true
});

const _origQuizToJSON = Quiz.prototype.toJSON;
Quiz.prototype.toJSON = function () {
    const values = _origQuizToJSON.call(this);
    values._id = String(values.id);
    return values;
};

module.exports = Quiz;
