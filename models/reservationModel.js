const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client', 
    required: true
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room', 
    required: true
  },
  dateStart: {
    type: Date,
    required: true
  },
  dateEnd: {
    type: Date,
    required: true
  }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
