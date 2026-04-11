const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const MessageReply = sequelize.define(
    'MessageReply',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        messageId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'messages',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        senderName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        senderRole: {
            type: DataTypes.ENUM('user', 'admin'),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: 'message_replies',
        timestamps: true,
    }
);

module.exports = MessageReply;
