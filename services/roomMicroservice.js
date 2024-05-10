const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader'); 
const mongoose = require('mongoose');
const Room = require('../models/roomModel'); 

const roomProtoPath = './proto/room.proto';

const roomProtoDefinition = protoLoader.loadSync(roomProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const roomProto = grpc.loadPackageDefinition(roomProtoDefinition).room;

mongoose.connect('mongodb://127.0.0.1:27017/mon_projet')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit the process on error
  });

const roomService = {
  createRoom: async (call, callback) => {
    try {
      const {numero, type, status, prix, description } = call.request;
      const newRoom = new Room({numero, type, status, prix, description });
      const room = await newRoom.save();

      callback(null, { room });
    } catch (err) {
      callback(new Error("Error while creating the room"));
    }
  },

  getRoom: async (call, callback) => {
    try {
      const roomId = call.request.room_id;
      const room = await Room.findById(roomId);

      if (!room) {
        return callback(new Error("Room not found"));
      }

      callback(null, { room });
    } catch (err) {
      callback(new Error("Error while fetching the room"));
    }
  },

  updateRoom: async (call, callback) => {
    try {
      const { room_id, numero, type, status, prix, description } = call.request;
      const updatedRoom = await Room.findByIdAndUpdate(room_id, { numero, type, status, prix, description }, { new: true });

      if (!updatedRoom) {
        return callback(new Error("Room not found"));
      }

      callback(null, { room: updatedRoom });
    } catch (err) {
      callback(new Error("Error while updating the room"));
    }
  },
};

const server = new grpc.Server();
server.addService(roomProto.RoomService.service, roomService);

const port = 50055;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Failed to bind server:", err);
    return;
  }
  console.log(`Room service is operational on port ${boundPort}`);
});
