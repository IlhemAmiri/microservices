const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader'); 
const mongoose = require('mongoose'); 
const Reservation = require('../models/reservationModel');

const reservationProtoPath = './proto/reservation.proto';

const reservationProtoDefinition = protoLoader.loadSync(reservationProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const reservationProto = grpc.loadPackageDefinition(reservationProtoDefinition).reservation;

mongoose.connect('mongodb://127.0.0.1:27017/mon_projet')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); 
  });

  const reservationService = {
    // Méthode pour récupérer une réservation
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
  
    // Méthode pour créer une réservation
    createReservation: async (call, callback) => {
      try {
        const { client, room, dateStart, dateEnd } = call.request;
        const newReservation = new Reservation({ client, room, dateStart, dateEnd });
        const reservation = await newReservation.save();
  
        callback(null, { reservation });
      } catch (err) {
        callback(new Error("Error while creating the reservation"));
      }
    },
  
    // Méthode pour mettre à jour une réservation
    updateReservation: async (call, callback) => {
      try {
        const { reservation_id, client, room, dateStart, dateEnd } = call.request;
        const updatedReservation = await Reservation.findByIdAndUpdate(
          reservation_id,
          { client, room, dateStart, dateEnd },
          { new: true }
        );
  
        if (!updatedReservation) {
          return callback(new Error("Reservation not found"));
        }
  
        callback(null, { reservation: updatedReservation });
      } catch (err) {
        callback(new Error("Error while updating the reservation"));
      }
    },
  
    // Méthode pour supprimer une réservation
    deleteReservation: async (call, callback) => {
      try {
        const reservationId = call.request.reservation_id;
        const deletedReservation = await Reservation.findByIdAndDelete(reservationId);
  
        if (!deletedReservation) {
          return callback(new Error("Reservation not found"));
        }
  
        callback(null, { reservation: deletedReservation });
      } catch (err) {
        callback(new Error("Error while deleting the reservation"));
      }
    },
  
    // Méthode pour récupérer toutes les réservations
    getAllReservations: async (call, callback) => {
      try {
        const reservations = await Reservation.find();
        callback(null, { reservations });
      } catch (err) {
        callback(new Error("Error while fetching all reservations"));
      }
    },
  };
  

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
