const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Notification = sequelize.define(
    'Notification',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'info', // 'success', 'warning', 'error', 'info'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        targetId: {
            type: DataTypes.STRING, // Optional ID for the related record (e.g., OrderID)
            allowNull: true,
        },
    },
    {
        tableName: 'notifications',
        timestamps: true,
    }
);

module.exports = Notification;
