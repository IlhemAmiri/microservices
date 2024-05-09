const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    numero: {
        type: String,
        unique: true, 
        required: true
    },
    type: {
        type: String,
        enum: ['double', 'triple', 'individuelle', 'familiale', 'quadruple'],
        required: true
    },
    status: {
        type: String,
        enum: ['libre', 'réservée'],
        default: 'libre'
    },
    prix: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
