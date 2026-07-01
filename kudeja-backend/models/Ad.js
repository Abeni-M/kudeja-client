const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Ad = sequelize.define(
  'Ad',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slideImages: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
    },
    slideInterval: {
      type: DataTypes.INTEGER,
      defaultValue: 5, // in seconds
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    placement: {
      type: DataTypes.STRING,
      defaultValue: 'sidebar',
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'ads',
    timestamps: true,
  }
);

module.exports = Ad;
