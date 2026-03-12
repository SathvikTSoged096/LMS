const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Flag = sequelize.define('Flag', {
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
    questionIndex: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'REVIEWED', 'DISMISSED'),
        defaultValue: 'PENDING'
    }
}, {
    tableName: 'flags',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['studentId', 'quizId', 'questionIndex'] }
    ]
});

const _origFlagToJSON = Flag.prototype.toJSON;
Flag.prototype.toJSON = function () {
    const values = _origFlagToJSON.call(this);
    values._id = String(values.id);
    return values;
};

module.exports = Flag;
