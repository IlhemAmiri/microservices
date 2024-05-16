const { Kafka } = require('kafkajs');
const Room = require('../models/roomModel'); 
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mon_projet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const kafka = new Kafka({
  clientId: 'room-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'room-group' });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'room-test', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log('Received room event:', event);
        console.log('Successfully processed room event:', message.value.toString());
        switch (event.eventType) {
          case 'creation':
            handleRoomCreation(event.roomData);
            break;
          case 'modification':
            handleRoomModification(event.roomData);
            break;
          case 'suppression':
            handleRoomSuppression(event.roomData);
            break;
          case 'recuperation':
            handleRoomRecuperation(event.roomId);
            break;
          case 'recuperation_tous':
            handleAllRoomsRecuperation();
            break;
          default:
            console.warn('Event type not recognized:', event.eventType);
        }
      },
    });
  } catch (error) {
    console.error('Error with Kafka consumer:', error);
  }
};

const handleRoomCreation = async (roomData) => {
  try {
    console.log('Handling room creation event:', roomData);
    const { numero, type, status, prix, description } = roomData;
    const newRoom = new Room({ numero, type, status, prix, description });
    const room = await newRoom.save();
    console.log('Room created:', room);
  } catch (error) {
    console.error('Error handling room creation event:', error);
  }
};

const handleRoomModification = async (roomData) => {
  try {
    console.log('Handling room modification event:', roomData);
    const { id, numero, type, status, prix, description } = roomData;
    const updatedRoom = await Room.findByIdAndUpdate(id, { numero, type, status, prix, description }, { new: true });
    console.log('Room updated:', updatedRoom);
  } catch (error) {
    console.error('Error handling room modification event:', error);
  }
};

const handleRoomSuppression = async (roomData) => {
  try {
    console.log('Handling room suppression event:', roomData);
    const roomId = roomData.id;
    const room = await Room.findById(roomId);
    if (!room) {
      console.error('Room not found for deletion');
      return;
    }
    await room.deleteOne();
    console.log('Room deleted successfully');
  } catch (error) {
    console.error('Error handling room suppression event:', error);
  }
};

const handleRoomRecuperation = async (roomId) => {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    console.log('Room retrieved:', room);
  } catch (error) {
    console.error('Error while fetching room:', error);
    throw error;
  }
};

const handleAllRoomsRecuperation = async () => {
  try {
    const rooms = await Room.find();
    console.log('All rooms retrieved:', rooms);
  } catch (error) {
    console.error('Error while fetching all rooms:', error);
    throw error;
  }
};

run().catch(console.error);
