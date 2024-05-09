const grpc = require('@grpc/grpc-js'); // For gRPC
const protoLoader = require('@grpc/proto-loader'); // For loading Protobuf
const mongoose = require('mongoose'); // For MongoDB
const Reservation = require('../models/reservationModel'); // Mongoose model for reservations

// Path to the Protobuf file for reservations
const reservationProtoPath = './proto/reservation.proto';

// Load the Protobuf for reservations
const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load the Reservation service from the gRPC package
const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mon_projet')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit the process on error
  });

// gRPC service implementation for reservations
const reservationService = {
  getReservation: async (call, callback) => {
    try {
      const reservationId = call.request.reservation_id;
      const reservation = await Reservation.findById(reservationId);

      if (!reservation) {
        return callback(new Error("Reservation not found"));
      }

      callback(null, { reservation });
    } catch (err) {
      callback(new Error("Error while fetching the reservation"));
    }
  },

  createReservation: async (call, callback) => {
    try {
      const { client_id, room_id, dateStart, dateEnd } = call.request;
      const newReservation = new Reservation({ client_id, room_id, dateStart, dateEnd });
      const reservation = await newReservation.save();

      callback(null, { reservation });
    } catch (err) {
      callback(new Error("Error while creating the reservation"));
    }
  },
};

// Create the gRPC server for reservations
const server = new grpc.Server();
server.addService(reservationProto.ReservationService.service, reservationService);

const port = 50056;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Failed to bind server:", err);
    return;
  }
  console.log(`Reservation service is operational on port ${boundPort}`);
});
