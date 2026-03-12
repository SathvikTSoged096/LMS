const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subject = sequelize.define('Subject', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    instructorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    thumbnail: {
        type: DataTypes.STRING,
        defaultValue: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    },
    units: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'subjects',
    timestamps: true
});

const _origSubjectToJSON = Subject.prototype.toJSON;
Subject.prototype.toJSON = function () {
    const values = _origSubjectToJSON.call(this);
    values._id = String(values.id);
    return values;
};

module.exports = Subject;
