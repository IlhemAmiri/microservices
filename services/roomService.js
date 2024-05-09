const Room = require('../models/roomModel'); // Require the room model

// Create a new room
const createRoom = async (numero, type, status, prix, description) => {
  const newRoom = new Room({ numero, type, status, prix, description});
  return await newRoom.save(); // Save to the database
};

// Get all rooms
const getRooms = async () => {
  return await Room.find(); // Get all rooms
};

// Get a room by ID
const getRoomById = async (id) => {
  return await Room.findById(id); // Find a room by its ID
};

// Export the services
module.exports = {
  createRoom,
  getRooms,
  getRoomById,
};
