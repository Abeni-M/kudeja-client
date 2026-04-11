const { sequelize } = require('./database/db');
require('dotenv').config();
const Product = require('./models/Product');

async function seedProducts() {
  try {
    const products = [
      { name: 'Product 1', price: 19.99 },
      { name: 'Product 2', price: 29.99 }
    ];

    await Product.bulkCreate(products);
    console.log('Products seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();