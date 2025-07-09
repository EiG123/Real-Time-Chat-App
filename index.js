// index.js
require('dotenv').config();
const express = require('express');
const app = express();
const { sequelize } = require('./models');

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connected');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
});

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));