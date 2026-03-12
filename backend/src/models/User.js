const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'INSTRUCTOR', 'STUDENT'),
        defaultValue: 'STUDENT'
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
    }
}, {
    tableName: 'users',
    timestamps: true
});

// Add _id (string) to JSON output for MongoDB compat
const _origUserToJSON = User.prototype.toJSON;
User.prototype.toJSON = function () {
    const values = _origUserToJSON.call(this);
    values._id = String(values.id);
    return values;
};

module.exports = User;
