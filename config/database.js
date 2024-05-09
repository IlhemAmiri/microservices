const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mon_projet');
    console.log('Connecté à MongoDB');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
