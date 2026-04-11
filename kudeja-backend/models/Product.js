const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    category: {
      type: DataTypes.STRING,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    image_url: {
      type: DataTypes.STRING,
    },
    // Structured list of specs, e.g. ["CPU: i7", "RAM: 16GB"]
    specs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Array of review objects: [{ userId, userName, rating, comment, date }]
    reviews: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    tableName: 'products',
    timestamps: true,
  }
);

module.exports = Product;