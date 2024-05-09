const grpc = require('@grpc/grpc-js'); // For gRPC
const protoLoader = require('@grpc/proto-loader'); // For loading Protobuf
const mongoose = require('mongoose'); // For MongoDB
const Client = require('../models/clientModel'); // Mongoose model for clients

// Path to the Protobuf file
const clientProtoPath = './proto/client.proto';

// Load the Protobuf
const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load the Client service from the gRPC package
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mon_projet')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit the process on error
  });

// gRPC service implementation for clients
const clientService = {
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
};

// Create the gRPC server
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
