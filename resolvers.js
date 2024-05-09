const grpc = require('@grpc/grpc-js'); 
const protoLoader = require('@grpc/proto-loader'); 
const Client = require('./models/clientModel');
const Room = require('./models/roomModel');
const Reservation = require('./models/reservationModel');

const clientProtoPath = './proto/client.proto';
const roomProtoPath = './proto/room.proto';
const reservationProtoPath = './proto/reservation.proto';

const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const roomProtoDefinition = protoLoader.loadSync(roomProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;
const roomProto = grpc.loadPackageDefinition(roomProtoDefinition).room;
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;

// Create gRPC clients
const clientClient = new clientProto.ClientService('localhost:50054', grpc.credentials.createInsecure());
const roomClient = new roomProto.RoomService('localhost:50055', grpc.credentials.createInsecure());
const reservationClient = new reservationProto.ReservationService('localhost:50056', grpc.credentials.createInsecure()); // Créer un client gRPC pour le service de réservation

// GraphQL Resolvers
const resolvers = {
    Query: {
        client: async (_, { id }) => {
          try {
            const client = await Client.findById(id);
            if (!client) {
              throw new Error("Client not found");
            }
            return client;
          } catch (error) {
            throw new Error("Error while fetching client: " + error.message);
          }
        },
        clients: async () => {
          try {
            const clients = await Client.find();
            return clients;
          } catch (error) {
            throw new Error("Error while fetching clients: " + error.message);
          }
        },
        room: async (_, { id }) => {
            try {
              const room = await Room.findById(id);
              if (!room) {
                throw new Error("Room not found");
              }
              return room;
            } catch (error) {
              throw new Error("Error while fetching room: " + error.message);
            }
          },
          rooms: async () => {
            try {
              const rooms = await Room.find();
              return rooms;
            } catch (error) {
              throw new Error("Error while fetching rooms: " + error.message);
            }
          },
          reservation: async (_, { id }) => {
            try {
              const reservation = await Reservation.findById(id);
              if (!reservation) {
                throw new Error("Reservation not found");
              }
              return reservation;
            } catch (error) {
              throw new Error("Error while fetching reservation: " + error.message);
            }
          },
          reservations: async () => {
            try {
              const reservations = await Reservation.find();
              return reservations;
            } catch (error) {
              throw new Error("Error while fetching reservations: " + error.message);
            }
          },
      },
  Mutation: {
    createClient: async (_, { nom, prenom, adresse, email, telephone }) => {
      try {
        const client = await new Promise((resolve, reject) => {
          clientClient.createClient({ nom, prenom, adresse, email, telephone }, (error, response) => {
            if (error) {
              reject(error.details);
            } else {
              resolve(response.client);
            }
          });
        });
        return client;
      } catch (error) {
        throw new Error("Failed to create client: " + error);
      }
    },
    createRoom: async (_, { numero, type, status, prix, description }) => {
      try {
        const room = await new Promise((resolve, reject) => {
          roomClient.createRoom({ numero, type, status, prix, description }, (error, response) => {
            if (error) {
              reject(error.details);
            } else {
              resolve(response.room);
            }
          });
        });
        return room;
      } catch (error) {
        throw new Error("Failed to create room: " + error);
      }
    },
    createReservation: async (_, { client, room, dateStart, dateEnd }) => {
      try {
          const clientExists =await Client.exists({ _id: client });
          if (!clientExists) {
              throw new Error("Client not found");
          }
  
          const roomData = await Room.findById(room);
          if (!roomData) {
              throw new Error("Room not found");
          }
  
          if (roomData.status !== 'libre') {
              throw new Error("Room is not available");
          }
  
          roomData.status = 'réservée';
          await roomData.save();
  
          const newReservation = new Reservation({ client:client.toString(), room:room.toString(), dateStart, dateEnd });
          const reservation = await newReservation.save();
  
          return  reservation;
      } catch (error) {
          throw new Error("Failed to create reservation: " + error.message);
      }
  },
    updateClient: async (_, { id, nom, prenom, adresse, email, telephone }) => {
        try {
            const updatedClient = await Client.findByIdAndUpdate(id, { nom, prenom, adresse, email, telephone }, { new: true });
            if (!updatedClient) {
                throw new Error("Client not found");
            }
            return updatedClient;
        } catch (error) {
            throw new Error("Failed to update client: " + error.message);
        }
    },
    updateRoom: async (_, { id, numero, type, status, prix, description }) => {
        try {
            const updatedRoom = await Room.findByIdAndUpdate(id, { numero, type, status, prix, description }, { new: true });
            if (!updatedRoom) {
                throw new Error("Room not found");
            }
            return updatedRoom;
        } catch (error) {
            throw new Error("Failed to update room: " + error.message);
        }
    },
    updateReservation: async (_, { id, client, room, dateStart, dateEnd }) => {
        try {
            const updatedReservation = await Reservation.findByIdAndUpdate(id, { client, room, dateStart, dateEnd }, { new: true });
            if (!updatedReservation) {
                throw new Error("Reservation not found");
            }
            return updatedReservation;
        } catch (error) {
            throw new Error("Failed to update reservation: " + error.message);
        }
    },
    deleteClient: async (_, { id }) => {
        try {
          const deletedClient = await Client.findByIdAndDelete(id);
          if (!deletedClient) {
            throw new Error("Client not found");
          }
          return deletedClient;
        } catch (error) {
          throw new Error("Failed to delete client: " + error.message);
        }
      },
      deleteRoom: async (_, { id }) => {
        try {
          const deletedRoom = await Room.findByIdAndDelete(id);
          if (!deletedRoom) {
            throw new Error("Room not found");
          }
          return deletedRoom;
        } catch (error) {
          throw new Error("Failed to delete room: " + error.message);
        }
      },
      deleteReservation: async (_, { id }) => {
        try {
          const deletedReservation = await Reservation.findByIdAndDelete(id);
          if (!deletedReservation) {
            throw new Error("Reservation not found");
          }
          return deletedReservation;
        } catch (error) {
          throw new Error("Failed to delete reservation: " + error.message);
        }
      },
  },
};

module.exports = resolvers;
