/**
 * config/db.js - MongoDB connection configuration
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return conn;
};

module.exports = connectDB;
