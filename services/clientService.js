const Client = require('../models/clientModel'); 

const createClient = async (nom, prenom, adresse, email, telephone) => {
  const newClient = new Client({ nom, prenom, adresse, email, telephone });
  return await newClient.save(); // Save to the database
};

const getClients = async () => {
  return await Client.find();
};


const getClientById = async (id) => {
  return await Client.findById(id); 
};


module.exports = {
  createClient,
  getClients,
  getClientById,
};
