const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const mongoose = require('mongoose'); 
const Client = require('../models/clientModel'); 

const clientProtoPath = './proto/client.proto';

const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

mongoose.connect('mongodb://127.0.0.1:27017/mon_projet')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); 
  });

const clientService = {
  createClient: async (call, callback) => {
    try {
      const { nom, prenom, adresse, email, telephone } = call.request;
      const newClient = new Client({ nom, prenom, adresse, email, telephone });
      const client = await newClient.save();
      callback(null, { client });
    } catch (err) {
      callback(new Error("Error while creating the client"));
    }
  },

  updateClient: async (call, callback) => {
    try {
      const { client_id, nom, prenom, adresse, email, telephone } = call.request;
      const updatedClient = await Client.findByIdAndUpdate(client_id, { nom, prenom, adresse, email, telephone }, { new: true });
      if (!updatedClient) {
        return callback(new Error("Client not found"));
      }
      callback(null, { client: updatedClient });
    } catch (err) {
      callback(new Error("Error while updating the client"));
    }
  },

 getAllClients: async (call, callback) => {
    try {
      const clients = await Client.find();
      callback(null, { clients });
    } catch (err) {
      callback(new Error("Error while fetching all clients"));
    }
  },


  getClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const client = await Client.findById(clientId);
      if (!client) {
        return callback(new Error("Client not found"));
      }
      callback(null, { client });
    } catch (err) {
      callback(new Error("Error while fetching the client"));
    }
  },

  deleteClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const deletedClient = await Client.findByIdAndDelete(clientId);
      if (!deletedClient) {
        return callback(new Error("Client not found"));
      }
      callback(null, { client: deletedClient });
    } catch (err) {
      callback(new Error("Error while deleting the client"));
    }
  },
};

const server = new grpc.Server();
server.addService(clientProto.ClientService.service, clientService);

const port = 50054;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Failed to bind server:", err);
    return;
  }
  console.log(`Client service is operational on port ${boundPort}`);
});
