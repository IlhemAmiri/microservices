const Reservation = require('../models/reservationModel'); // Require the reservation model

// Create a new reservation
const createReservation = async (client, room, dateStart, dateEnd) => {
  const newReservation = new Reservation({ client: client, room: room, dateStart, dateEnd });
  return await newReservation.save(); // Save to the database
};

// Get all reservations
const getReservations = async () => {
  return await Reservation.find(); // Get all reservations
};

// Get a reservation by ID
const getReservationById = async (id) => {
  return await Reservation.findById(id); // Find a reservation by its ID
};

// Export the services
module.exports = {
  createReservation,
  getReservations,
  getReservationById,
};
