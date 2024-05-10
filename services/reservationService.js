const Reservation = require('../models/reservationModel'); // Require the reservation model

const createReservation = async (client, room, dateStart, dateEnd) => {
  const newReservation = new Reservation({ client: client, room: room, dateStart, dateEnd });
  return await newReservation.save(); 
};

const getReservations = async () => {
  return await Reservation.find();
};

const getReservationById = async (id) => {
  return await Reservation.findById(id); 
};

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
};
