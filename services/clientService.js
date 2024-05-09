const Client = require('../models/clientModel'); // Require the client model

// Create a new client
const createClient = async (nom, prenom, adresse, email, telephone) => {
  const newClient = new Client({ nom, prenom, adresse, email, telephone });
  return await newClient.save(); // Save to the database
};

// Get all clients
const getClients = async () => {
  return await Client.find(); // Get all clients
};

// Get a client by ID
const getClientById = async (id) => {
  return await Client.findById(id); // Find a client by its ID
};

// Export the services
module.exports = {
  createClient,
  getClients,
  getClientById,
};
