const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Counter = sequelize.define('Counter', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    seq: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'counters',
    timestamps: false
});

module.exports = Counter;
