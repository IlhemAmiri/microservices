const Room = require('../models/roomModel'); 


const createRoom = async (numero, type, status, prix, description) => {
  const newRoom = new Room({ numero, type, status, prix, description});
  return await newRoom.save(); 
};


const getRooms = async () => {
  return await Room.find(); 
};


const getRoomById = async (id) => {
  return await Room.findById(id); 
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
};
