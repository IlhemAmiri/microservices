const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/database');
const Client = require('./models/clientModel');
const Room = require('./models/roomModel');
const Reservation = require('./models/reservationModel');
const produceMessage = require('./kafka/produceMessage');
const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(bodyParser.json());

// Define routes for clients
app.get('/client', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (err) {
        res.status(500).send("Error while fetching clients: " + err.message);
    }
});

app.get('/client/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).send("Client not found");
        }
        res.json(client);
    } catch (err) {
        res.status(500).send("Error while fetching client: " + err.message);
    }
});

app.post('/client', async (req, res) => {
    try {
        const { nom, prenom, adresse, email, telephone } = req.body;
        const newClient = new Client({ nom, prenom, adresse, email, telephone });
        const client = await newClient.save();

        res.json(client);
    } catch (err) {
        res.status(500).send("Error while creating client: " + err.message);
    }
});

app.delete('/client/:id', async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).send("Client not found");
        }
        res.json({ message: "Client deleted successfully" });
    } catch (err) {
        res.status(500).send("Error while deleting client: " + err.message);
    }
});

app.put('/client/:id', async (req, res) => {
    try {
        const { nom, prenom, adresse, email, telephone } = req.body;
        const updatedClient = await Client.findByIdAndUpdate(req.params.id, { nom, prenom, adresse, email, telephone }, { new: true });
        if (!updatedClient) {
            return res.status(404).send("Client not found");
        }
        res.json(updatedClient);
    } catch (err) {
        res.status(500).send("Error while updating client: " + err.message);
    }
});

app.get('/room', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).send("Error while fetching rooms: " + err.message);
    }
});

app.post('/room', async (req, res) => {
    try {
        const { numero, type, status, prix, description } = req.body;
        const newRoom = new Room({ numero, type, status, prix, description });
        const room = await newRoom.save();
        await produceMessage('test-topic', room);
        res.json(room);
    } catch (err) {
        res.status(500).send("Error while creating room: " + err.message);
    }
});
app.put('/room/:id', async (req, res) => {
    try {
        const { numero, type, status, prix, description } = req.body;
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, { numero, type, status, prix, description }, { new: true });
        if (!updatedRoom) {
            return res.status(404).send("Room not found");
        }
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).send("Error while updating room: " + err.message);
    }
});

app.delete('/room/:id', async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).send("Room not found");
        }
        res.json({ message: "Room deleted successfully" });
    } catch (err) {
        res.status(500).send("Error while deleting room: " + err.message);
    }
});
app.get('/room/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).send("Room not found");
        }
        res.json(room);
    } catch (err) {
        res.status(500).send("Error while fetching room: " + err.message);
    }
});

app.put('/room/:id', async (req, res) => {
    try {
        const { numero, type, status, prix, description } = req.body;
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, { numero, type, status, prix, description }, { new: true });
        if (!updatedRoom) {
            return res.status(404).send("Room not found");
        }
        res.json(updatedRoom);
    } catch (err) {
        res.status(500).send("Error while updating room: " + err.message);
    }
});
app.get('/reservation', async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.json(reservations);
    } catch (err) {
        res.status(500).send("Error while fetching reservations: " + err.message);
    }
});
app.delete('/reservation/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).send("Reservation not found");
        }
        res.json({ message: "Reservation deleted successfully" });
    } catch (err) {
        res.status(500).send("Error while deleting reservation: " + err.message);
    }
});

app.post('/reservation', async (req, res) => {
    try {
        const { client, room, dateStart, dateEnd } = req.body;

        const clientExists = await Client.exists({ _id: client });
        if (!clientExists) {
            return res.status(400).send("Client not found");
        }

        // Vérifier si la chambre existe
        const roomData = await Room.findById(room);
        if (!roomData) {
            return res.status(400).send("Room not found");
        }

        // Vérifier si la chambre est libre
        if (roomData.status !== 'libre') {
            return res.status(400).send("Room is not available");
        }

        // Mettre à jour le statut de la chambre à "réservée"
        roomData.status = 'réservée';
        await roomData.save();

        // Créer une nouvelle réservation
        const newReservation = new Reservation({ client, room, dateStart, dateEnd });
        const reservation = await newReservation.save();

        res.json(reservation);
    } catch (err) {
        res.status(500).send("Error while creating reservation: " + err.message);
    }
});

app.put('/reservation/:id', async (req, res) => {
    try {
        const { client, room, dateStart, dateEnd } = req.body;
        const updatedReservation = await Reservation.findByIdAndUpdate(req.params.id, { client: client, room: room, dateStart, dateEnd }, { new: true });
        if (!updatedReservation) {
            return res.status(404).send("Reservation not found");
        }
        res.json(updatedReservation);
    } catch (err) {
        res.status(500).send("Error while updating reservation: " + err.message);
    }
});

app.get('/reservation/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).send("Reservation not found");
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).send("Error while fetching reservation: " + err.message);
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`API Gateway operational on port ${port}`);
});
