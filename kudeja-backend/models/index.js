const { sequelize } = require('../database/db'); 
const User = require('./user');
const Product = require('./Product');
const Task = require('./Task');
const Order = require('./Order');
const Category = require('./Category');
const Notification = require('./Notification');
const Message = require('./Message');
const MessageReply = require('./MessageReply');
const Ad = require('./Ad');

// Relationships
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryData' });

Message.hasMany(MessageReply, { foreignKey: 'messageId', as: 'replies' });
MessageReply.belongsTo(Message, { foreignKey: 'messageId' });

module.exports = {
  sequelize,
  User,
  Product,
  Task,
  Order,
  Category,
  Notification,
  Message,
  MessageReply,
  Ad
};