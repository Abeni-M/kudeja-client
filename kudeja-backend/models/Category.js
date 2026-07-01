const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Category = sequelize.define(
    'Category',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
        },
        // List of specification fields for this category, e.g. ["RAM", "Storage", "Processor"]
        specFields: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
    },
    {
        tableName: 'categories',
        timestamps: true,
    }
);

module.exports = Category;
