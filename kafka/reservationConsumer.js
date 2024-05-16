const { Kafka } = require('kafkajs');
const Reservation = require('../models/reservationModel'); 
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mon_projet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const kafka = new Kafka({
  clientId: 'reservation-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'reservation-group' });

const run = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'reservation-test', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log('Received reservation event:', event);
        console.log('Successfully processed reservation event:', message.value.toString());
        switch (event.eventType) {
          case 'creation':
            handleReservationCreation(event.reservationData);
            break;
          case 'modification':
            handleReservationModification(event.reservationData);
            break;
          case 'suppression':
            handleReservationSuppression(event.reservationData);
            break;
          case 'recuperation':
            handleReservationRecuperation(event.reservationId);
            break;
          case 'recuperation_tous':
            handleAllReservationsRecuperation();
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

const handleReservationCreation = async (reservationData) => {
  try {
    console.log('Handling reservation creation event:', reservationData);
    const { client, room, dateStart, dateEnd } = reservationData;
    const newReservation = new Reservation({ client, room, dateStart, dateEnd });
    const reservation = await newReservation.save();
    console.log('Reservation created:', reservation);
  } catch (error) {
    console.error('Error handling reservation creation event:', error);
  }
};

const handleReservationModification = async (reservationData) => {
  try {
    console.log('Handling reservation modification event:', reservationData);
    const { id, client, room, dateStart, dateEnd } = reservationData;
    const updatedReservation = await Reservation.findByIdAndUpdate(id, { client, room, dateStart, dateEnd }, { new: true });
    console.log('Reservation updated:', updatedReservation);
  } catch (error) {
    console.error('Error handling reservation modification event:', error);
  }
};

const handleReservationSuppression = async (reservationData) => {
  try {
    console.log('Handling reservation suppression event:', reservationData);
    const reservationId = reservationData.id;
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      console.error('Reservation not found for deletion');
      return;
    }
    await reservation.deleteOne();
    console.log('Reservation deleted successfully');
  } catch (error) {
    console.error('Error handling reservation suppression event:', error);
  }
};

const handleReservationRecuperation = async (reservationId) => {
  try {
    const reservation = await Reservation.findById(reservationId).populate('client').populate('room');
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    console.log('Reservation retrieved:', reservation);
  } catch (error) {
    console.error('Error while fetching reservation:', error);
    throw error;
  }
};

const handleAllReservationsRecuperation = async () => {
  try {
    const reservations = await Reservation.find().populate('client').populate('room');
    console.log('All reservations retrieved:', reservations);
  } catch (error) {
    console.error('Error while fetching all reservations:', error);
    throw error;
  }
};

run().catch(console.error);
