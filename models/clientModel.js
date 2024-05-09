const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clientSchema = new Schema({
  nom: {
    type: String,
    required: true,
  },
  prenom: {
    type: String,
    required: true,
  },
  adresse: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, 
  },
  telephone: {
    type: String,
    required: true,
  },
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
